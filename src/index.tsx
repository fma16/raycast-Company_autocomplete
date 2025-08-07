import { Action, ActionPanel, Detail, Form, Icon, useNavigation, useForm, environment } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState, useEffect } from "react";
import { getCompanyInfo, login } from "./api";
import { CompanyData } from "./types";
import {
  formatAddress,
  formatField,
  formatSiren,
  getGenderAgreement,
  getLegalFormLabel,
  validateAndExtractSiren,
} from "./utils";
import { findGreffeByCodePostal } from "./greffes";
import * as fs from "fs";
import * as path from "path";

export default function Command() {
  return <SearchForm />;
}

function SearchForm() {
  const { push } = useNavigation();
  const [sirenInput, setSirenInput] = useState<string>("");
  const [sirenError, setSirenError] = useState<string | undefined>();

  function handleAction() {
    if (!sirenInput) {
      setSirenError("Please enter a SIREN or SIRET.");
      return;
    }
    const siren = validateAndExtractSiren(sirenInput);
    if (!siren) {
      setSirenError("Invalid SIREN or SIRET format.");
      return;
    }
    setSirenError(undefined);
    push(<CompanyDetail siren={siren} />);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Search Company" onAction={handleAction} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="siren"
        title="SIREN / SIRET"
        placeholder="Enter 9-digit SIREN or 14-digit SIRET"
        value={sirenInput}
        error={sirenError}
        onChange={(newValue) => {
          setSirenInput(newValue);
          if (sirenError) {
            setSirenError(undefined);
          }
        }}
      />
    </Form>
  );
}

function CompanyDetail({ siren }: { siren: string }) {
  const { data, isLoading, error } = usePromise(async () => {
    const token = await login();
    return await getCompanyInfo(token, siren);
  }, [siren]);

  useEffect(() => {
    if (data) {
      logApiResponse(data);
    }
  }, [data]);

  if (error) {
    return <Detail markdown={`## Error\n\n${error.message}`} />;
  }

  if (!isLoading && data && !data.formality?.content?.personneMorale && !data.formality?.content?.personnePhysique) {
    return (
      <Detail
        markdown={`## No Company Details Found\n\nThe API did not return company details for SIREN ${siren}.\n\nThis can happen if the company data is incomplete.`}
      />
    );
  }

  const markdown = data ? buildMarkdown(data) : "";

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      metadata={data ? <Metadata data={data} /> : null}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy to Clipboard" content={markdown} />
        </ActionPanel>
      }
    />
  );
}

function Metadata({ data }: { data: CompanyData }) {
    const content = data.formality.content;
    const personneMorale = content.personneMorale;
    const personnePhysique = content.personnePhysique;
    const natureCreation = content.natureCreation;

    let denomination = "[[à compléter]]";
    let shareCapital = "[[à compléter]]";
    let rcsCity = "[[à compléter]]";
    let address = "[[à compléter]]";
    let codePostal: string | undefined;

    if (personneMorale) {
        const identite = personneMorale.identite;
        denomination = formatField(identite?.entreprise?.denomination);
        shareCapital = formatField(identite?.description?.montantCapital);
        address = formatAddress(personneMorale.adresseEntreprise);
        codePostal = personneMorale.adresseEntreprise?.adresse?.codePostal;
    } else if (personnePhysique) {
        const desc = personnePhysique.identite?.entrepreneur?.descriptionPersonne;
        const prenoms = desc?.prenoms?.join(" ") || "";
        denomination = `${prenoms} ${desc?.nom || ""}`.trim();
        shareCapital = "N/A";
        address = formatAddress(personnePhysique.adresseEntreprise as any);
        codePostal = personnePhysique.adresseEntreprise?.adresse?.codePostal;
    }
    
    const greffeFromData = codePostal ? findGreffeByCodePostal(codePostal) : null;
    rcsCity = formatField(greffeFromData || personneMorale?.immatriculationRcs?.villeImmatriculation);

    const sirenFormatted = formatSiren(data.formality.siren);

    return (
        <Detail.Metadata>
            <Detail.Metadata.Label title="SIREN" text={data.formality.siren} />
            <Detail.Metadata.Label title="Dénomination" text={denomination} />
            <Detail.Metadata.Label title="Forme juridique" text={getLegalFormLabel(natureCreation.formeJuridique)} />
            <Detail.Metadata.Label title="Date création" text={formatField(natureCreation.dateCreation)} />
            <Detail.Metadata.Separator />
            <Detail.Metadata.Label title="Capital social" text={shareCapital !== "[[à compléter]]" && shareCapital !== "N/A" ? `${shareCapital} €` : shareCapital} />
            <Detail.Metadata.Label title="RCS" text={rcsCity !== "[[à compléter]]" ? `${rcsCity} - ${sirenFormatted}` : `[[à compléter]] - ${sirenFormatted}`} />
            <Detail.Metadata.Separator />
            <Detail.Metadata.Label title="Adresse" text={address} />
            <Detail.Metadata.Label title="Établie en France" text={natureCreation.etablieEnFrance ? "Oui" : "Non"} />
            <Detail.Metadata.Separator />
            <Detail.Metadata.Label title="Dernière MAJ INPI" text={data.updatedAt} />
            <Detail.Metadata.Label title="Établissements ouverts" text={data.nombreEtablissementsOuverts.toString()} />
        </Detail.Metadata>
    );
}

function logApiResponse(data: CompanyData) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const findProjectRoot = (startPath: string): string => {
    let currentPath = startPath;
    while (currentPath !== path.dirname(currentPath)) {
      if (fs.existsSync(path.join(currentPath, 'package.json'))) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }
    return startPath;
  };
  
  const projectRoot = findProjectRoot(__filename);
  const logsDir = path.join(projectRoot, 'logs');
  const logFile = path.join(logsDir, `inpi-${data.formality.siren}-${timestamp}.json`);
  
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logData = {
      timestamp: new Date().toISOString(),
      siren: data.formality.siren,
      note: "Complete INPI API response - all data from the API call",
      inpiApiResponse: data
    };
    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    console.log(`LOGS SAVED TO: ${logFile}`);
  } catch (error) {
    console.error('Failed to write log file:', error);
  }
}

function buildMarkdown(data: CompanyData): string {
  const content = data.formality.content;
  const personneMorale = content.personneMorale;
  const personnePhysique = content.personnePhysique;

  if (personnePhysique) {
    const desc = personnePhysique.identite?.entrepreneur?.descriptionPersonne;
    const civilite = desc?.genre === '2' ? 'Madame' : 'Monsieur';
    const prenom = (desc?.prenoms || [])[0] || '';
    const nom = desc?.nom || '';
    const prenomNom = `${prenom} ${nom}`.trim();

    const ne = desc?.genre === '2' ? 'Née' : 'Né';
    const dateNaissance = formatField(desc?.dateDeNaissance, '[[Date de naissance non renseignée]]');
    const lieuNaissance = formatField(desc?.lieuDeNaissance, '[[Lieu de naissance non renseigné]]');
    
    const nationalite = formatField(desc?.nationalite, '[[Nationalité non renseignée]]');
    
    const adresse = personnePhysique.adressePersonne 
        ? formatAddress(personnePhysique.adressePersonne as any) 
        : formatAddress(personnePhysique.adresseEntreprise as any);
    const demeurant = formatField(adresse, '[[Adresse non renseignée]]');

    const siren = formatSiren(data.formality.siren);

    return `${civilite} ${prenomNom}
${ne}(e) le ${dateNaissance} à ${lieuNaissance}
De nationalité ${nationalite}
Demeurant ${demeurant}
N° : ${siren}`;
  }

  if (personneMorale) {
    const natureCreation = content.natureCreation;
    const legalForm = getLegalFormLabel(natureCreation.formeJuridique);
    const sirenFormatted = formatSiren(data.formality.siren);

    const identite = personneMorale.identite;
    const composition = personneMorale.composition;
    const denomination = formatField(identite?.entreprise?.denomination) || formatField(personneMorale.denomination);
    const shareCapital = formatField(identite?.description?.montantCapital) || formatField(personneMorale.capital?.montant);
    const address = formatAddress(personneMorale.adresseEntreprise);
    const codePostal = personneMorale.adresseEntreprise?.adresse?.codePostal;
    const greffeFromData = codePostal ? findGreffeByCodePostal(codePostal) : null;
    const rcsCity = formatField(greffeFromData || personneMorale.immatriculationRcs?.villeImmatriculation);

    const title = `**La société ${denomination}**`;
    const details = `${legalForm} au capital de ${shareCapital} €
Immatriculée au RCS de ${rcsCity} sous le n° ${sirenFormatted}
Dont le siège social est situé ${address}`;

    let representativeName = "[[à compléter]]";
    let representativeRole = "[[à compléter]]";
    let representativeGender = null;

    if (composition?.pouvoirs && composition.pouvoirs.length > 0) {
      const pouvoir = composition.pouvoirs[0];
      if (pouvoir.individu?.descriptionPersonne) {
        const desc = pouvoir.individu.descriptionPersonne;
        const prenoms = desc.prenoms && desc.prenoms.length > 0 ? desc.prenoms[0] : "";
        representativeName = `${prenoms} ${desc.nom || ""}`.trim() || "[[à compléter]]";
        
        const roleMapping: { [key: string]: string } = {
            "11": "Membre", "13": "Contrôleur de gestion", "14": "Contrôleur des comptes", "23": "Autre associé majoritaire", "28": "Gérant et associé indéfiniment et solidairement responsable", "29": "Liquidateur", "30": "Gérant", "40": "Liquidateur", "51": "Président du conseil d'administration", "52": "Président du directoire", "53": "Directeur Général", "55": "Dirigeant à l'étranger", "56": "Dirigeant en France", "60": "Président-directeur général", "61": "Président du conseil de surveillance", "63": "Membre du directoire", "64": "Membre du conseil de surveillance", "65": "Administrateur", "66": "Pouvoir d'engager à titre habituel", "67": "Pouvoir d'engager l'établissement", "69": "Directeur général unique", "70": "Directeur général délégué", "71": "Commissaire aux comptes titulaire", "72": "Commissaire aux comptes suppléant", "73": "Président", "74": "Associé indéfiniment et solidairement responsable", "75": "Associé indéfiniment responsable", "76": "Représentant social à l'étranger", "77": "Représentant fiscal à l'étranger", "82": "Indivisaire", "86": "Exploitant pour le compte de l'indivision", "90": "Exploitant en commun", "97": "Mandataire ad hoc", "98": "Administrateur provisoire", "99": "Autre", "100": "Repreneur", "101": "Entrepreneur", "105": "Personne décisionnaire désignée", "110": "Vice-président", "201": "Dirigeant", "205": "Président",
        };
        representativeRole = roleMapping[desc.role || ""] || `Fonction ${desc.role}` || "[[à compléter]]";
        
        if (desc.genre === 'M' || desc.genre === 'F') {
          representativeGender = desc.genre;
        } else if (desc.sexe === 'M' || desc.sexe === 'F') {
          representativeGender = desc.sexe;
        } else if (desc.civilite) {
          if (desc.civilite.includes('M.') || desc.civilite.includes('Monsieur')) {
            representativeGender = 'M';
          } else if (desc.civilite.includes('Mme') || desc.civilite.includes('Madame')) {
            representativeGender = 'F';
          }
        }
      }
    }
    const genderAgreement = getGenderAgreement(representativeGender);
    const representativeLine = `Représentée aux fins des présentes par ${representativeName} en sa qualité de ${representativeRole}, dûment ${genderAgreement}.`;

    return `
${title}

${details}

${representativeLine}
  `;
  }

  return "Aucune information à afficher.";
}
