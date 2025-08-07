# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-07

### Added
- **Fonctionnalité Principale :** Recherche d'entreprises par SIREN/SIRET via l'API de l'INPI.
- **Enrichissement des Données RCS :** Intégration du référentiel "Communes - Greffes" de Datainfogreffe pour déterminer la ville du RCS à partir du code postal, assurant une meilleure précision.
- **Prise en charge des Personnes Physiques :** L'extension gère désormais les entrepreneurs individuels, avec un format d'affichage dédié et détaillé (nom, date/lieu de naissance, adresse, etc.).
- **Tables de Correspondance Étendues :** Ajout de listes complètes pour les formes juridiques et les rôles des représentants, basées sur le dictionnaire de données de l'INPI, pour des libellés plus clairs.
- **Initialisation du Projet :** Création d'un `README.md` détaillé, d'un `.gitignore` robuste et de ce `CHANGELOG.md`.
- **Logs de Débogage :** Mise en place d'un système de logs pour enregistrer la réponse complète de l'API INPI dans le dossier `logs/` à chaque requête.

### Changed
- **Standardisation des Champs Vides :** Utilisation du format `[[à compléter]]` de manière cohérente pour tous les champs où une donnée est manquante.
- **Structure du Code :** La logique de lecture des données locales (greffes) a été isolée dans son propre module `src/greffes.ts` pour une meilleure organisation et pour corriger des problèmes de build.
- **Mise à jour du `.gitignore` :** Le fichier a été affiné pour ignorer correctement les fichiers de développement locaux, les logs et les fichiers système.
- **Mise à jour du `README.md` :** Ajout de remerciements aux outils d'IA (Gemini CLI, Claude Code) ayant contribué au développement.

### Fixed
- **Correction du Bug de Logs Doubles :** Résolution du problème qui générait deux fichiers de log par requête en déplaçant la logique d'écriture dans un hook `useEffect`.
- **Correction du Suivi Git :** Les fichiers locaux (`logs/`, `.claude/`, etc.) qui étaient incorrectement suivis par Git ont été retirés du dépôt.
- **Correction des Erreurs de Build :** Résolution de plusieurs erreurs critiques (`ReferenceError`, `Command has no "default" export`) liées au chargement des modules et des fichiers JSON par le bundler de Raycast, en adoptant une stratégie de chargement paresseux (lazy-loading).

### Removed
- **Détection du Genre par Prénom :** Suppression de la logique non fiable qui tentait de deviner le genre d'une personne à partir de son prénom.
- **Code Inutilisé :** Nettoyage du code mort, incluant les fonctions et types liés à une potentielle intégration de l'API Sirene qui n'a pas été retenue.
