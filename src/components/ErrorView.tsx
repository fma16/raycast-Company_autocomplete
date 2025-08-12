import { Detail } from "@raycast/api";

interface ErrorViewProps {
  siren: string;
  hasNoData: boolean;
}

export function ErrorView({ siren, hasNoData }: ErrorViewProps) {
  if (hasNoData) {
    return (
      <Detail
        markdown={`## ❌ Aucune donnée trouvée\n\nL'API INPI n'a pas retourné de données pour le SIREN ${siren}.\n\n### Que faire ?\n\n- ✅ **Vérifiez le numéro SIREN** : Assurez-vous qu'il contient exactement 9 chiffres\n- ✅ **Vérifiez que l'entreprise existe** : Consultez [l'annuaire des entreprises](https://www.societe.com)\n- ✅ **Attendez quelques minutes** : Les données récentes peuvent mettre du temps à apparaître\n- ✅ **Contactez le support INPI** : Si l'entreprise existe mais n'apparaît pas\n\n### Informations techniques\n- SIREN recherché : **${siren}**\n- Source : API INPI\n- Statut : Aucune données personneMorale/personnePhysique`}
      />
    );
  }

  return null;
}
