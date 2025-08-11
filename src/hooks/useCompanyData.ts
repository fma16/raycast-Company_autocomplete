import { usePromise, showFailureToast } from "@raycast/utils";
import { useEffect } from "react";
import { getCompanyInfo } from "../services/inpi-api";
import { CompanyData } from "../types";

interface UseCompanyDataResult {
  data: CompanyData | undefined;
  isLoading: boolean;
  error: Error | undefined;
}

export function useCompanyData(siren: string): UseCompanyDataResult {
  const { data, isLoading, error } = usePromise(getCompanyInfo, [siren]);

  useEffect(() => {
    if (error) {
      showFailureToast(error, { title: "Erreur de recherche" });
    }
  }, [error]);

  return { data, isLoading, error };
}