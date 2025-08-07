import axios from "axios";
import { getPreferenceValues } from "@raycast/api";
import { ApiLoginResponse, CompanyData, Preferences } from "./types";

const API_BASE_URL = "https://registre-national-entreprises.inpi.fr";

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

export async function login(): Promise<string> {
  const { inpiUsername, inpiPassword }: Preferences = getPreferenceValues();

  if (!inpiUsername || !inpiPassword) {
    throw new Error("Missing INPI username or password in preferences.");
  }

  try {
    const apiClient = getApiClient();
    const response = await apiClient.post<ApiLoginResponse>("/api/sso/login", {
      username: inpiUsername,
      password: inpiPassword,
    });
    
    if (response.data && response.data.token) {
      return response.data.token;
    }
    throw new Error("Invalid login response from INPI API.");
  } catch (error) {
    console.error("Authentication failed:", error);
    throw new Error("Failed to authenticate with INPI API. Please check your credentials.");
  }
}

export async function getCompanyInfo(token: string, siren: string): Promise<CompanyData> {
  try {
    const apiClient = getApiClient(token);
    
    console.log(`Fetching INPI data for SIREN ${siren}`);
    const inpiResponse = await apiClient.get(`/api/companies/${siren}`);
    
    return inpiResponse.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`No company found for SIREN ${siren}.`);
    }
    console.error(`Failed to fetch company data for SIREN ${siren}:`, error);
    throw new Error("An error occurred while fetching company data.");
  }
}