import axios from "axios";
import { getPreferenceValues } from "@raycast/api";
import { ApiLoginResponse, CompanyData, Preferences } from "./types";

// Rate limiting state
const apiCallTimes: number[] = [];
const MAX_CALLS_PER_MINUTE = 30; // Conservative limit to prevent API abuse

const API_BASE_URL = "https://registre-national-entreprises.inpi.fr";

/**
 * Implements rate limiting to prevent API abuse
 */
function checkRateLimit(): void {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Remove old entries
  while (apiCallTimes.length > 0 && apiCallTimes[0] < oneMinuteAgo) {
    apiCallTimes.shift();
  }
  
  // Check if we're over the limit
  if (apiCallTimes.length >= MAX_CALLS_PER_MINUTE) {
    throw new Error(`Rate limit exceeded: Maximum ${MAX_CALLS_PER_MINUTE} requests per minute. Please wait a moment and try again.`);
  }
  
  // Record this call
  apiCallTimes.push(now);
}

/**
 * Implements retry logic with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication errors or client errors (4xx)
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status >= 400 && status < 500 && status !== 429) {
          throw error;
        }
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);\n      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

const getApiClient = (token?: string) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return axios.create({
    baseURL: API_BASE_URL,
    headers,
  });
};

/**
 * Validates INPI credentials format
 */
function validateCredentials(username: string, password: string): void {
  if (!username || username.trim().length === 0) {
    throw new Error("INPI username is required. Please configure it in Raycast preferences.");
  }
  
  if (!password || password.trim().length === 0) {
    throw new Error("INPI password is required. Please configure it in Raycast preferences.");
  }
  
  // Basic format validation for username (email format expected)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username.trim())) {
    throw new Error("INPI username must be a valid email address.");
  }
  
  // Password strength validation
  if (password.length < 6) {
    throw new Error("INPI password appears invalid (too short). Please check your credentials.");
  }
}

export async function login(): Promise<string> {
  const { inpiUsername, inpiPassword }: Preferences = getPreferenceValues();

  // Validate credentials format before making API call
  validateCredentials(inpiUsername, inpiPassword);

  // Check rate limit before making request
  checkRateLimit();

  return withRetry(async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.post<ApiLoginResponse>("/api/sso/login", {
        username: inpiUsername.trim(),
        password: inpiPassword,
      });
      
      if (response.data && response.data.token) {
        return response.data.token;
      }
      throw new Error("Invalid login response from INPI API.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Authentication failed: Invalid INPI credentials. Please check your username and password in Raycast preferences.");
        }
        if (error.response?.status === 403) {
          throw new Error("Access denied: Your INPI account may not have API access. Please contact INPI support.");
        }
        if (error.response?.status === 429) {
          throw new Error("Rate limit exceeded: Too many login attempts. Please wait a few minutes and try again.");
        }
      }
      
      console.error("Authentication failed:", error);
      throw new Error("Failed to authenticate with INPI API. Please check your internet connection and credentials.");
    }
  });
}

export async function getCompanyInfo(token: string, siren: string): Promise<CompanyData> {
  // Check rate limit before making request
  checkRateLimit();

  return withRetry(async () => {
    try {
      const apiClient = getApiClient(token);
      
      console.log(`Fetching INPI data for SIREN ${siren}`);
      const inpiResponse = await apiClient.get(`/api/companies/${siren}`);
      
      return inpiResponse.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Company not found: No company found for SIREN ${siren}. Please verify the SIREN number.`);
        }
        if (error.response?.status === 401) {
          throw new Error("Authentication expired: Please try again. If the problem persists, check your INPI credentials.");
        }
        if (error.response?.status === 403) {
          throw new Error("Access denied: Your INPI account may not have permission to access this company's data.");
        }
        if (error.response?.status === 429) {
          throw new Error("Rate limit exceeded: Too many requests. Please wait a moment and try again.");
        }
      }
      
      console.error(`Failed to fetch company data for SIREN ${siren}:`, error);
      throw new Error("Network error: Failed to fetch company data. Please check your internet connection and try again.");
    }
  });
}