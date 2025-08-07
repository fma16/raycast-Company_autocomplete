# Recherche Entreprise (INPI) pour Raycast

Cette extension Raycast vous permet de rechercher rapidement les informations légales et financières d'une entreprise française en utilisant son numéro SIREN ou SIRET. Elle se connecte directement à l'API de l'INPI pour fournir des données à jour et fiables.

## Fonctionnalités

- **Recherche par SIREN ou SIRET :** Entrez un numéro à 9 (SIREN) ou 14 chiffres (SIRET) pour obtenir les informations de l'entreprise.
- **Informations Clés :** Affichez en un clin d'œil la dénomination sociale, la forme juridique, le capital social, la date de création, et l'adresse du siège.
- **Ville du RCS Fiabilisée :** Détermine et affiche le greffe du Tribunal de Commerce compétent en se basant sur le code postal de l'entreprise, grâce à un référentiel de données dédié.
- **Représentant Légal :** Identifie le représentant principal de l'entreprise (Président, Gérant, etc.).
- **Résumé Formaté :** Génère un texte clair et formaté, prêt à être copié-collé, résumant les informations essentielles de l'entreprise.

## Configuration

Pour utiliser cette extension, vous devez disposer de vos identifiants pour l'API de l'INPI.

1.  Lancez la commande "Rechercher une entreprise" pour la première fois.
2.  Raycast vous invitera à configurer l'extension.
3.  Entrez votre nom d'utilisateur (`inpiUsername`) et votre mot de passe (`inpiPassword`) dans les champs prévus.

Ces informations d'identification seront stockées de manière sécurisée par Raycast.

## Sources des Données

Cette extension s'appuie sur des sources de données ouvertes et officielles pour garantir la qualité des informations :

1.  **API INPI :** Les informations principales sur les entreprises (dénomination, capital, représentants, etc.) sont récupérées en temps réel via l'API officielle de l'**Institut National de la Propriété Industrielle (INPI)**.

2.  **Datainfogreffe :** Pour assurer l'exactitude de la ville d'immatriculation au RCS, l'extension utilise le jeu de données [Référentiel Communes - Greffes](https://opendata.datainfogreffe.fr/explore/assets/referentiel-communes-greffes/). Ce jeu de données est fourni par **Datainfogreffe** et est utilisé conformément à la **Licence Ouverte / Open Licence**.

## Développement

Pour installer les dépendances et lancer l'extension en mode développement :

```bash
npm install
npm run dev
```

Le fichier de référence des greffes est généré à partir d'un CSV. Si vous mettez à jour le fichier source dans le dossier `data`, vous pouvez reconstruire l'index JSON avec la commande :

```bash
npx ts-node transform/build-greffes-index.ts
```
