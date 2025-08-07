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
        // ... (structure personneMorale inchangée)
      };
      personnePhysique?: {
        identite: {
          entrepreneur: {
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
            commune?: string;
            numeroVoie?: string;
            typeVoie?: string;
            libelleVoie?: string;
            complementLocalisation?: string;
            indiceRepetition?: string;
          };
        };
        adressePersonne?: {
           adresse: {
            codePostal?: string;
            commune?: string;
            numeroVoie?: string;
            typeVoie?: string;
            libelleVoie?: string;
            complementLocalisation?: string;
            indiceRepetition?: string;
          };
        };
      };
    };
  };
}

export interface Representative {
  role: string;
  descriptionPersonne: {
    nom: string;
    prenoms: string;
    sexe: 'M' | 'F';
  };
}

// ... (le reste du fichier est inchangé)