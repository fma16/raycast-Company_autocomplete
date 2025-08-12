# Guide de Tests - Extension INPI Raycast

## 🎯 Stratégie de Tests Séparés

Cette extension utilise une approche **hybride** pour les tests :
- **GitHub Actions** : Tests avec données mockées (sans authentification)
- **Tests locaux** : Tests avec API réelle INPI + vérification santé

## 🚀 Tests sur GitHub Actions (CI/CD)

### Tests Automatiques
Les tests suivants s'exécutent automatiquement sur GitHub Actions **sans nécessiter d'identifiants INPI** :

```bash
# Tests unitaires (chaque push)
npm run test:unit

# Tests d'intégration mockés (PR et branches main)  
npm run test:integration

# Tests de performance (sur demande avec [perf])
npm run test:performance
```

### Données Pré-enregistrées
Les tests CI/CD utilisent le fichier `assets/mocked-api-responses.json` qui contient :
- 3+ entreprises de test avec données réelles
- Structures complètes PersonneMorale/PersonnePhysique
- Validation de tous les cas d'usage métier

## 🏠 Tests Locaux (Avec API Réelle)

### Configuration Requise
Pour les tests avec l'API réelle, les tests essaieront automatiquement de récupérer vos identifiants INPI :

**Option 1 : Variables d'environnement (priorité)**
```bash
export INPI_USERNAME="votre_utilisateur"  
export INPI_PASSWORD="votre_mot_de_passe"
```

**Option 2 : Préférences Raycast (automatique)**
- Les tests essaieront de lire vos identifiants depuis les préférences Raycast stockées
- Aucune configuration supplémentaire nécessaire si vous avez déjà configuré l'extension

**Ordre de priorité :**
1. Variables d'environnement (si définies)
2. Préférences Raycast stockées (lecture système)
3. Aucun credential → tests skippés

### Tests Disponibles
```bash
# Tests avec API réelle INPI (essaiera automatiquement d'utiliser vos credentials Raycast)
npm run test:integration:real

# Ou avec variables d'environnement pour forcer des credentials spécifiques
INPI_USERNAME=your_user INPI_PASSWORD=your_pass npm run test:integration:real

# Vérification complète local + CI
npm run test:full
```

## 📊 Génération du Dataset Mocké

### Prérequis
- Identifiants INPI valides
- Connexion internet
- Node.js avec TypeScript

### Processus de Génération
```bash
# 1. Aller dans le dossier local
cd local/

# 2. Exécuter le script générateur
npx ts-node generate-mock-dataset.ts
```

### Ce que fait le script :
1. **Demande sécurisée** des identifiants (password masqué)
2. **Authentification** avec l'API INPI
3. **Nettoyage immédiat** des identifiants de la mémoire
4. **Collecte** des données pour 10 entreprises
5. **Rate limiting** respecté (2s entre requêtes)
6. **Sauvegarde** dans `assets/mocked-api-responses.json`

## 🔄 Workflow Complet

### 1. Développement Local
```bash
# Tests rapides pendant développement
npm run test:unit

# Validation avec mocks
npm run test:integration  

# Tests de performance
npm run test:performance
```

### 2. Validation Complète (Local)
```bash
# Générer dataset frais (si nécessaire)
cd local && npx ts-node generate-mock-dataset.ts

# Tests avec API réelle (utilise les préférences Raycast automatiquement)
npm run test:integration:real

# Suite complète
npm run test:full
```

### 3. Push vers GitHub
```bash
git add .
git commit -m "feature: nouvelle fonctionnalité"
git push origin feature-branch
```

Les tests CI/CD s'exécutent automatiquement avec les données mockées.

## 📋 Structure des Tests

### Tests Unitaires (`src/**/__tests__/`)
- ✅ **utils.test.ts** - Fonctions utilitaires
- ✅ **formatting.test.ts** - Formatage français
- ✅ **markdown-builder.test.ts** - Génération documents
- ✅ **address-formatter.test.ts** - Formatage adresses v1.1

### Tests d'Intégration Mockés (`src/__tests__/integration/`)
- ✅ **api-mocked.integration.test.ts** - Tests CI/CD sans auth
- ✅ **address-formatting.integration.test.ts** - Tests adresses complètes

### Tests Locaux Réels (`src/__tests__/local/`)
- ✅ **api-real.local.test.ts** - Validation API réelle

### Tests de Performance (`src/__tests__/`)
- ✅ **performance.test.ts** - Benchmarks consolidés

## 🔧 Configuration Jest

### Variables d'Environnement
```bash
# Force l'utilisation des mocks
FORCE_MOCK=true

# Tests avec API réelle (optionnel, utilise les préférences Raycast par défaut)
INPI_USERNAME=xxx
INPI_PASSWORD=xxx

# Mode développement
NODE_ENV=test
```

### Scripts de Test Détaillés

#### `npm run test:unit`
- Tests des fonctions métier
- Aucune dépendance réseau
- Exécution : ~0.4s
- Couverture : Logique critique

#### `npm run test:integration` 
- Utilise données mockées
- Valide flux complets
- Exécution : ~2s
- GitHub Actions compatible

#### `npm run test:integration:real`
- **Utilise automatiquement vos credentials Raycast ou les variables d'environnement**
- Tests avec vraies données
- Rate limiting respecté  
- Exécution : ~60s
- **Robuste face aux erreurs réseau temporaires** (retry automatique + skip intelligent)

#### `npm run test:performance`
- Benchmarks sans réseau
- Validation mémoire
- Exécution : ~0.3s
- Seuils configurables

## ⚡ Optimisations CI/CD

### GitHub Actions Optimisé
```yaml
# Exécution rapide par étapes
test-unit: 0.4s (chaque push)
test-integration: 2s (PR + main)
test-performance: 0.3s (sur demande) 
lint: 5s (chaque push)
```

### Cache et Performance
- ✅ Cache NPM automatique
- ✅ Tests parallèles optimisés
- ✅ Timeouts configurés par type
- ✅ Maxworkers adaptatif

## 🐛 Dépannage

### Tests CI/CD Échouent
```bash
# Vérifier que le dataset existe
ls -la assets/mocked-api-responses.json

# Régénérer si nécessaire
cd local && npx ts-node generate-mock-dataset.ts
git add assets/mocked-api-responses.json
git commit -m "update: mocked API responses"
```

### Tests Locaux Échouent
```bash
# Option 1: Vérifier que les préférences Raycast sont configurées
# (Ouvrir Raycast > Extension > French Company Search > Configure)

# Option 2: Vérifier identifiants d'environnement (fallback)
echo $INPI_USERNAME
echo $INPI_PASSWORD  # Doit afficher quelque chose

# Tester connexion API
npm run test:integration:real -- --testNamePattern="should authenticate"
```

### Erreurs Réseau Temporaires
Les tests locaux sont maintenant robustes face aux erreurs réseau temporaires :
- **Retry automatique** avec délais croissants
- **Skip intelligent** des tests si l'API INPI est indisponible temporairement
- **Messages informatifs** au lieu d'échecs pour les problèmes de connectivité
- **Test de connectivité préliminaire** pour détecter si l'API INPI est disponible

Si vous voyez des erreurs comme :
- `ECONNRESET` - Connexion fermée côté serveur
- `socket hang up` - Connexion interrompue
- `ECONNREFUSED` - Serveur indisponible (maintenance INPI)

Les tests continueront avec des avertissements plutôt que d'échouer complètement.

### Dataset Obsolète
```bash
# Régénérer avec nouvelles données
cd local/
npx ts-node generate-mock-dataset.ts

# Mettre à jour tests si nécessaire
npm run test:integration
```

## 📈 Métriques et Reporting

### Couverture de Code
```bash
# Rapport de couverture complet
npm run test:full

# Couverture par composant
npx jest --coverage --collectCoverageFrom="src/services/**/*.ts"
```

### Statistiques de Performance
- Tests unitaires : <1s
- Tests intégration (mock) : <5s  
- Tests locaux (réels) : <120s
- Pipeline complet CI/CD : <30s

## 🎯 Bonnes Pratiques

### ✅ À Faire
- Régénérer dataset mensuellement
- Tester localement avant push  
- Configurer identifiants dans les préférences Raycast
- Respecter rate limiting API (2s entre appels)

### ❌ À Éviter
- Committer identifiants dans le code
- Lancer tests réels sans rate limiting
- Ignorer les warnings de structure API
- Push sans validation locale préalable

## 🚀 Intégration Continue Complète

### Flux Optimal
1. **Développement** → Tests unitaires rapides
2. **Feature complète** → Tests intégration mockés  
3. **Avant push** → Tests locaux avec API réelle
4. **CI/CD** → Pipeline automatique sans auth
5. **Release** → Tests complets + coverage

Cette approche garantit une **qualité maximale** avec une **efficacité CI/CD optimale**.