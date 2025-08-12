/**
 * Service mock pour l'API INPI utilisant des réponses pré-enregistrées
 * Utilisé pour les tests CI/CD sans authentification
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
 * Service mock qui simule l'API INPI avec des données pré-enregistrées
 */
export class INPIApiMock {
  private dataset: MockedDataset;
  private responseDelay: number;

  constructor(responseDelay = 100) {
    this.dataset = mockedResponses as MockedDataset;
    this.responseDelay = responseDelay;
  }

  /**
   * Simule l'authentification (toujours réussie en mode mock)
   */
  async login(): Promise<string> {
    await this.simulateDelay();
    return "mock-token-" + Date.now();
  }

  /**
   * Récupère les données mockées pour un SIREN
   */
  async getCompanyInfo(siren: string): Promise<CompanyData> {
    await this.simulateDelay();

    // Chercher la réponse mockée pour ce SIREN
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
   * Vérifie si un SIREN est disponible dans le dataset
   */
  isAvailable(siren: string): boolean {
    return this.dataset.responses.some((r) => r.siren === siren && !r.error);
  }

  /**
   * Retourne la liste des SIREN disponibles
   */
  getAvailableSirens(): string[] {
    return this.dataset.responses.filter((r) => !r.error).map((r) => r.siren);
  }

  /**
   * Retourne les métadonnées du dataset
   */
  getDatasetInfo(): MockedDataset["metadata"] {
    return this.dataset.metadata;
  }

  /**
   * Simule un délai de réseau
   */
  private async simulateDelay(): Promise<void> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }
  }

  /**
   * Réinitialise le délai de réponse
   */
  setResponseDelay(delay: number): void {
    this.responseDelay = delay;
  }
}

/**
 * Instance singleton du service mock
 */
export const inpiApiMock = new INPIApiMock();

/**
 * Fonction utilitaire pour déterminer si on utilise le mock ou l'API réelle
 */
export function shouldUseMock(): boolean {
  // Utilise le mock si :
  // 1. On est dans l'environnement de test
  // 2. Les identifiants ne sont pas disponibles
  // 3. La variable d'environnement FORCE_MOCK est définie

  const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;
  const hasCredentials = process.env.INPI_USERNAME && process.env.INPI_PASSWORD;
  const forceMock = process.env.FORCE_MOCK === "true";

  return forceMock || (isTestEnvironment && !hasCredentials);
}

/**
 * Fonction factory qui retourne le bon service selon le contexte
 */
export async function createINPIApiService(): Promise<{ getCompanyInfo: (siren: string) => Promise<CompanyData> }> {
  if (shouldUseMock()) {
    console.log("🎭 Using mocked INPI API service");
    return inpiApiMock;
  } else {
    // Import dynamique pour éviter les dépendances en mode mock
    const { login, getCompanyInfo } = await import("./inpi-api");
    console.log("🌐 Using real INPI API service");
    return { login, getCompanyInfo };
  }
}
