/**
 * Mock service for INPI API using pre-recorded responses
 * Used for CI/CD tests without authentication
 */

import mockedResponses from "../../assets/mocked-api-responses.json";
import { CompanyData } from "../types";

export interface MockedApiResponse {
  siren: string;
  description: string;
  timestamp: string;
  data: CompanyData | null;
  error?: string;
}

export interface MockedDataset {
  metadata: {
    generated: string;
    version: string;
    description: string;
    totalCompanies: number;
    successfulResponses: number;
  };
  responses: MockedApiResponse[];
}

/**
 * Mock service that simulates the INPI API with pre-recorded data
 */
export class INPIApiMock {
  private dataset: MockedDataset;
  private responseDelay: number;

  constructor(responseDelay = 100) {
    this.dataset = mockedResponses as MockedDataset;
    this.responseDelay = responseDelay;
  }

  /**
   * Simulates authentication (always successful in mock mode)
   */
  async login(): Promise<string> {
    await this.simulateDelay();
    return "mock-token-" + Date.now();
  }

  /**
   * Retrieves mocked data for a SIREN
   */
  async getCompanyInfo(siren: string): Promise<CompanyData> {
    await this.simulateDelay();

    // Find the mocked response for this SIREN
    const mockedResponse = this.dataset.responses.find((r) => r.siren === siren);

    if (!mockedResponse) {
      throw new Error(`SIREN ${siren} not found in mocked dataset`);
    }

    if (mockedResponse.error) {
      throw new Error(`Mocked error for SIREN ${siren}: ${mockedResponse.error}`);
    }

    if (!mockedResponse.data) {
      throw new Error(`No data available for SIREN ${siren}`);
    }

    return mockedResponse.data;
  }

  /**
   * Checks if a SIREN is available in the dataset
   */
  isAvailable(siren: string): boolean {
    return this.dataset.responses.some((r) => r.siren === siren && !r.error);
  }

  /**
   * Returns the list of available SIRENs
   */
  getAvailableSirens(): string[] {
    return this.dataset.responses.filter((r) => !r.error).map((r) => r.siren);
  }

  /**
   * Returns the dataset metadata
   */
  getDatasetInfo(): MockedDataset["metadata"] {
    return this.dataset.metadata;
  }

  /**
   * Simulates network delay
   */
  private async simulateDelay(): Promise<void> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }
  }

  /**
   * Resets the response delay
   */
  setResponseDelay(delay: number): void {
    this.responseDelay = delay;
  }
}

/**
 * Singleton instance of the mock service
 */
export const inpiApiMock = new INPIApiMock();

/**
 * Utility function to determine whether to use mock or real API
 */
export function shouldUseMock(): boolean {
  // Use mock if:
  // 1. We are in test environment
  // 2. Credentials are not available
  // 3. FORCE_MOCK environment variable is set

  const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;
  const hasCredentials = process.env.INPI_USERNAME && process.env.INPI_PASSWORD;
  const forceMock = process.env.FORCE_MOCK === "true";

  return forceMock || (isTestEnvironment && !hasCredentials);
}

/**
 * Factory function that returns the appropriate service based on context
 */
export async function createINPIApiService(): Promise<{ getCompanyInfo: (siren: string) => Promise<CompanyData> }> {
  if (shouldUseMock()) {
    console.log("🎭 Using mocked INPI API service");
    return inpiApiMock;
  } else {
    // Dynamic import to avoid dependencies in mock mode
    const { getCompanyInfo } = await import("./inpi-api");
    console.log("🌐 Using real INPI API service");
    return { getCompanyInfo };
  }
}
