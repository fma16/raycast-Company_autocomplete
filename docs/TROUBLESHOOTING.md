# Guide de Dépannage Technique

## 🔧 Diagnostic et Résolution des Problèmes

### Architecture de Monitoring

L'extension dispose d'un système de monitoring avancé pour diagnostiquer automatiquement les problèmes de performance et de structure API.

#### Accès aux Métriques de Performance

```typescript
import { metrics, PerformanceMonitor } from './src/services/metrics';

// Vérifier la santé du système
const isHealthy = PerformanceMonitor.isHealthy();
const healthStatus = PerformanceMonitor.getHealthStatus();

// Générer un rapport détaillé
const report = PerformanceMonitor.generateReport(3600000); // 1 heure
console.log(report);

// Statistiques spécifiques par endpoint
const loginStats = metrics.getEndpointStats('/api/sso/login');
const companyStats = metrics.getEndpointStats('/api/companies/123456789');
```

#### Validation de Structure API

```typescript
import { validateCompanyDataStructure, detectApiChanges } from './src/services/api-validation';

// Valider la structure d'une réponse
const validation = validateCompanyDataStructure(apiResponse);
if (!validation.valid) {
  console.error('Erreurs de structure:', validation.errors);
  console.warn('Champs manquants:', validation.missingFields);
}

// Détecter les changements d'API
const changes = detectApiChanges(currentResponse, baselineResponse);
if (changes.riskLevel === 'high') {
  console.error('Changements critiques détectés:', changes.removedFields);
}
```

## 🚨 Problèmes Courants et Solutions

### 1. Authentification et Accès API

#### ❌ "Authentication failed: Invalid INPI credentials"

**Diagnostic:**
- Vérifiez les credentials dans les préférences Raycast
- Testez la connexion directement sur [data.inpi.fr](https://data.inpi.fr)

**Solutions:**
1. **Credentials incorrects:**
   ```bash
   # Vérifiez dans Raycast : Preferences > Extensions > French Company Search
   # Assurez-vous que l'email et le mot de passe sont corrects
   ```

2. **Compte sans accès API:**
   - Demandez l'accès API dans votre espace personnel INPI
   - Attendez la validation (peut prendre quelques jours)

3. **Cache de token corrompu:**
   ```typescript
   // Dans le développement, effacez le cache
   import { clearCache } from './src/services/inpi-api';
   clearCache();
   ```

#### ❌ "Rate limit exceeded"

**Diagnostic:**
```typescript
const stats = metrics.getStats(300000); // 5 minutes
console.log(`Requêtes récentes: ${stats.totalRequests}`);
console.log(`Taux de succès: ${stats.successRate}%`);
```

**Solutions:**
1. **Limite temporaire:** Attendez 1-2 minutes
2. **Usage excessif:** Réduisez la fréquence des recherches
3. **Monitoring:** Le système limite automatiquement à 30 req/min

### 2. Performance et Temps de Réponse

#### ❌ Temps de réponse > 5 secondes

**Diagnostic:**
```typescript
const report = PerformanceMonitor.generateReport();
console.log(report);

// Vérifiez les métriques P95/P99
const stats = metrics.getStats();
console.log(`P95: ${stats.p95ResponseTime}ms`);
console.log(`P99: ${stats.p99ResponseTime}ms`);
```

**Seuils de Performance:**
- ✅ **Sain:** Avg < 3s, P95 < 5s, Taux de succès > 95%
- ⚠️ **Dégradé:** Avg 3-5s, P95 5-8s, Taux de succès 90-95%
- ❌ **Critique:** Avg > 5s, P95 > 8s, Taux de succès < 90%

**Solutions:**
1. **Problème réseau:** Vérifiez la connexion internet
2. **Surcharge API INPI:** Réessayez plus tard
3. **Cache invalidé:** Le système utilise un cache de 5 minutes

### 3. Données Manquantes ou Incorrectes

#### ❌ "[[Nom du représentant à compléter]]"

**Diagnostic:**
```typescript
// Vérifiez la validation de structure
const validation = validateCompanyDataStructure(response);
validation.warnings.forEach(warning => console.warn(warning));

// Inspectez la structure des pouvoirs
console.log('Pouvoirs:', response.formality.content.personneMorale.composition.pouvoirs);
```

**Solutions:**
1. **Format API changé:** L'extension supporte les formats ancien et nouveau
2. **Données INPI incomplètes:** Normal pour certaines entreprises
3. **Structure non reconnue:** Créez une issue GitHub avec les logs

#### ❌ "No company found for SIREN"

**Diagnostic:**
```typescript
// Validez le format SIREN
import { validateAndExtractSiren } from './src/utils';
const validation = validateAndExtractSiren(userInput);
console.log('SIREN validé:', validation);
```

**Solutions:**
1. **SIREN inexistant:** Vérifiez sur [societe.com](https://societe.com)
2. **Format incorrect:** Utilisez 9 chiffres (SIREN) ou 14 chiffres (SIRET)
3. **Entreprise non active:** Certaines entreprises ne sont plus dans la base

### 4. Problèmes de Greffe et RCS

#### ❌ Greffe incorrect ou manquant

**Diagnostic:**
```typescript
import { findGreffeByCodePostal } from './src/services/greffe-lookup';

// Testez le lookup
const greffe = findGreffeByCodePostal('75001');
console.log('Greffe trouvé:', greffe);

// Vérifiez les performances
const startTime = performance.now();
const result = findGreffeByCodePostal('75001');
const elapsed = performance.now() - startTime;
console.log(`Lookup en ${elapsed.toFixed(3)}ms`);
```

**Solutions:**
1. **Données greffe obsolètes:**
   ```bash
   # Mettez à jour les données
   npm run build-greffes  # Si CSV disponible
   npm run compress-greffes  # Recompression
   ```

2. **Code postal inexistant:** Normal pour certains codes
3. **Performance dégradée:** Vérifiez que les données compressées sont utilisées

## 📊 Outils de Diagnostic

### 1. Rapport de Performance Automatique

```typescript
// Générez un rapport complet
const report = PerformanceMonitor.generateReport(3600000);
console.log(report);

/* Exemple de sortie:
=== API Performance Report (1.0h) ===
Status: ⚠️ Issues Detected

📊 General Stats:
  Total Requests: 25
  Success Rate: 88.0%

⏱️ Response Times:
  Average: 2340ms
  P95: 4200ms
  P99: 5100ms

❌ Errors by Type:
  AxiosError: 3

🚨 Issues Identified:
  • Low success rate: 88.0%
  • High P95 response time: 4200ms
*/
```

### 2. Validation de Changements API

```typescript
// Créez une baseline
const baseline = createApiBaseline(validResponse);

// Comparez avec de nouveaux responses
const changes = detectApiChanges(newResponse, baseline);

if (changes.riskLevel === 'high') {
  console.error('🚨 Changements critiques détectés:');
  console.error('Champs supprimés:', changes.removedFields);
  console.error('Changements de type:', changes.typeChanges);
}
```

### 3. Monitoring en Temps Réel

```typescript
// Les métriques sont automatiquement collectées
// Vérification périodique de santé
setInterval(() => {
  const health = PerformanceMonitor.getHealthStatus();
  if (!health.healthy) {
    console.warn('⚠️ Système dégradé:', health.issues);
  }
}, 300000); // Toutes les 5 minutes
```

## 🔍 Logs et Debugging

### Mode Développement

```bash
# Activez les logs détaillés
npm run dev

# Consultez les logs Raycast
tail -f ~/Library/Logs/Raycast/raycast.log
```

### Variables d'Environment

```bash
# Mode debug pour plus de logs
NODE_ENV=development npm run dev

# Niveaux de log
DEBUG=inpi:* npm run dev  # Logs INPI
DEBUG=greffe:* npm run dev  # Logs greffe
DEBUG=metrics:* npm run dev  # Logs métriques
```

## 📞 Support et Signalement

### Signaler un Bug

1. **Collectez les informations:**
   ```typescript
   // Rapport de performance
   const report = PerformanceMonitor.generateReport();
   
   // Erreurs récentes
   const errors = metrics.getRecentErrors(5);
   
   // État du système
   const health = PerformanceMonitor.getHealthStatus();
   ```

2. **Créez une issue GitHub** avec:
   - Rapport de performance
   - Erreurs récentes
   - SIREN testé (si applicable)
   - Logs de la console

### Contacts

- **Issues GitHub:** [Créer une issue](https://github.com/fma16/french-company-search/issues)
- **Logs Raycast:** `~/Library/Logs/Raycast/raycast.log`
- **Documentation:** [README.md](../README.md)

## 🛠️ Maintenance Préventive

### Mise à Jour Données Greffe

```bash
# Trimestrielle ou selon les notifications
npm run build-greffes  # Reconstruit depuis CSV
npm run compress-greffes  # Optimise les performances
npm test  # Valide l'intégrité
```

### Nettoyage Cache

```bash
# En cas de problèmes persistants
rm -rf node_modules/.cache
npm run build
```

### Tests de Santé

```bash
# Validez régulièrement
npm test  # Tests complets
npm run test:performance  # Tests performance
npm run lint  # Qualité du code
```

## 📈 Métriques de Référence

### Performance Targets

| Métrique | Cible | Seuil Critique |
|----------|-------|----------------|
| Temps réponse moyen | < 3s | > 5s |
| P95 temps de réponse | < 5s | > 8s |
| Taux de succès | > 95% | < 90% |
| Lookup greffe | < 10ms | > 50ms |
| Cache hit rate | > 80% | < 50% |

### Utilisation Mémoire

| Composant | Normal | Critique |
|-----------|--------|----------|
| Métriques cache | < 1MB | > 5MB |
| Données greffe | ~250KB | > 2MB |
| Cache API | < 2MB | > 10MB |

Cette documentation technique fournit tous les outils nécessaires pour diagnostiquer, résoudre et prévenir les problèmes dans l'extension INPI.