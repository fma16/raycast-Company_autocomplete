import axios from "axios";
import { getPreferenceValues } from "@raycast/api";
import { ApiLoginResponse, CompanyData, Preferences, SireneData } from "./types";

const API_BASE_URL = "https://registre-national-entreprises.inpi.fr";
const SIRENE_API_URL = "https://api.insee.fr/enterprises/sirene/V3";

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

async function getSireneData(siren: string): Promise<SireneData | null> {
  try {
    console.log(`Fetching Sirene data for SIREN ${siren}`);
    const response = await axios.get(`${SIRENE_API_URL}/siret?q=siren:${siren}&nombre=1`);
    
    if (response.data && response.data.etablissements && response.data.etablissements.length > 0) {
      const etablissement = response.data.etablissements[0];
      const uniteLegale = etablissement.uniteLegale;
      
      console.log("Sirene data found:", JSON.stringify({
        denomination: uniteLegale.denominationUniteLegale,
        categorieJuridique: uniteLegale.categorieJuridiqueUniteLegale,
        etatAdministratif: uniteLegale.etatAdministratifUniteLegale
      }, null, 2));
      
      return {
        uniteLegale: {
          siren: uniteLegale.siren,
          denominationUniteLegale: uniteLegale.denominationUniteLegale,
          categorieJuridiqueUniteLegale: uniteLegale.categorieJuridiqueUniteLegale,
          dateCreationUniteLegale: uniteLegale.dateCreationUniteLegale,
          etatAdministratifUniteLegale: uniteLegale.etatAdministratifUniteLegale,
          nomUniteLegale: uniteLegale.nomUniteLegale,
          prenomUsuelUniteLegale: uniteLegale.prenomUsuelUniteLegale,
          adresseEtablissements: [{
            numeroVoieEtablissement: etablissement.adresseEtablissement?.numeroVoieEtablissement,
            typeVoieEtablissement: etablissement.adresseEtablissement?.typeVoieEtablissement,
            libelleVoieEtablissement: etablissement.adresseEtablissement?.libelleVoieEtablissement,
            codePostalEtablissement: etablissement.adresseEtablissement?.codePostalEtablissement,
            libelleCommuneEtablissement: etablissement.adresseEtablissement?.libelleCommuneEtablissement,
          }]
        }
      };
    }
    
    console.log("No Sirene data found");
    return null;
  } catch (error) {
    console.error(`Failed to fetch Sirene data for SIREN ${siren}:`, error);
    return null;
  }
}

export async function getCompanyInfo(token: string, siren: string): Promise<CompanyData> {
  try {
    const apiClient = getApiClient(token);
    
    // Get INPI data
    console.log(`Fetching INPI data for SIREN ${siren}`);
    const inpiResponse = await apiClient.get(`/api/companies/${siren}`);
    
    // Skip Sirene for now to focus on INPI data structure
    // const sireneData = await getSireneData(siren);
    
    return inpiResponse.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`No company found for SIREN ${siren}.`);
    }
    console.error(`Failed to fetch company data for SIREN ${siren}:`, error);
    throw new Error("An error occurred while fetching company data.");
  }
}
