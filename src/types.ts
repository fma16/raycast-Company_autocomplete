export interface Preferences {
  inpiUsername: string;
  inpiPassword: string;
}

export interface ApiLoginResponse {
  token: string;
}

export interface CompanyData {
  updatedAt: string;
  nombreRepresentantsActifs: number;
  nombreEtablissementsOuverts: number;
  id: string;
  formality: {
    siren: string;
    content: {
      succursaleOuFiliale: string;
      formeExerciceActivitePrincipale: string;
      natureCreation: {
        dateCreation: string;
        societeEtrangere: boolean;
        formeJuridique: string;
        formeJuridiqueInsee: string;
        etablieEnFrance: boolean;
        salarieEnFrance: boolean;
        relieeEntrepriseAgricole: boolean;
        entrepriseAgricole: boolean;
      };
      personneMorale?: {
        denomination?: string;
        formeJuridique?: string;
        capital?: {
          montant: number;
        };
        immatriculationRcs?: {
          villeImmatriculation: string;
          numeroRcs: string;
        };
        adresseEntreprise: {
          adresse: {
            codePostal?: string;
          };
        };
        identite?: {
          entreprise?: {
            denomination?: string;
          };
          description?: {
            montantCapital?: number;
          };
        };
        composition?: {
          pouvoirs?: Array<{
            individu?: {
              descriptionPersonne?: {
                role?: string;
                nom?: string;
                prenoms?: string[];
                genre?: string;
                sexe?: string;
                civilite?: string;
              };
            };
          }>;
        };
      };
      personnePhysique?: {
        identite?: {
          entrepreneur?: {
            descriptionPersonne: {
              nom?: string;
              prenoms?: string[];
              genre?: string;
              nationalite?: string;
              dateDeNaissance?: string;
              lieuDeNaissance?: string;
            };
          };
        };
        adresseEntreprise: {
          adresse: {
            codePostal?: string;
          };
        };
        adressePersonne?: {
           adresse: {
            codePostal?: string;
          };
        };
      };
    };
  };
}
