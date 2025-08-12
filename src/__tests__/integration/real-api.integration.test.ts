/**
 * Tests d'intégration avec l'API INPI réelle
 * Utilise de vrais SIREN pour valider le comportement en conditions réelles
 * 
 * Usage:
 * 1. Dans Raycast : Configure tes credentials INPI dans les préférences
 * 2. En ligne de commande : INPI_USERNAME=your_user INPI_PASSWORD=your_pass npm test src/__tests__/integration/real-api.integration.test.ts
 * 3. Sans credentials : Les tests seront skippés automatiquement
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

// Disable mocks for this integration test to use real Raycast preferences
jest.unmock("@raycast/api");

import { getPreferenceValues } from "@raycast/api";
import { getCompanyInfo } from "../../services/inpi-api";
import { buildMarkdown } from "../../services/markdown-builder";
import { validateCompanyDataStructure } from "../../services/api-validation";
import { REAL_SIREN_TEST_CASES, validateEntityStructure } from "../../data/real-siren-test-cases";

interface Preferences {
  inpiUsername: string;
  inpiPassword: string;
}

// Configuration pour les tests d'intégration
const TEST_CONFIG = {
  timeout: 15000, // 15s timeout pour les appels API
  rateLimitDelay: 2000, // 2s entre chaque requête pour respecter les limites
  maxRetries: 2,
};

describe("Real INPI API Integration Tests", () => {
  let preferences: Preferences;

  beforeAll(() => {
    try {
      // Récupération des préférences Raycast configurées par l'utilisateur
      preferences = getPreferenceValues<Preferences>();

      if (!preferences.inpiUsername || !preferences.inpiPassword) {
        console.warn("⚠️ INPI credentials not configured in Raycast preferences. Integration tests will be skipped.");
        console.warn("   Configure your INPI credentials in Raycast settings to enable these tests.");
      } else {
        console.log("✅ INPI credentials found in Raycast preferences");
      }
    } catch (_error) {
      console.warn("⚠️ Could not access Raycast preferences. Tests will be skipped in non-Raycast environment.");
      console.warn("   These tests are designed to run within the Raycast environment.");
    }
  });

  describe("API Data Structure Validation", () => {
    it.each(REAL_SIREN_TEST_CASES)(
      "should fetch and validate structure for $description (SIREN: $siren)",
      async (testCase) => {
        // Skip test si pas de credentials
        if (!preferences?.inpiUsername || !preferences?.inpiPassword) {
          console.log(`⏭️ Skipping ${testCase.siren} - No INPI credentials configured`);
          return;
        }
        // Rate limiting : attendre entre chaque test
        await new Promise((resolve) => setTimeout(resolve, TEST_CONFIG.rateLimitDelay));

        let data;
        let attempt = 0;

        // Retry logic pour gérer les erreurs temporaires
        while (attempt < TEST_CONFIG.maxRetries) {
          try {
            data = await getCompanyInfo(testCase.siren);
            break;
          } catch (error) {
            attempt++;
            if (attempt >= TEST_CONFIG.maxRetries) {
              throw new Error(
                `Failed to fetch SIREN ${testCase.siren} after ${TEST_CONFIG.maxRetries} attempts: ${error}`,
              );
            }
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          }
        }

        // Validation basique de la structure
        expect(data).toBeDefined();
        expect(data?.formality).toBeDefined();
        expect(data?.formality.siren).toBe(testCase.siren);

        // Validation de la structure spécifique selon le type
        const isValidStructure = validateEntityStructure(data, testCase);
        expect(isValidStructure).toBe(true);

        // Validation avec le service de validation API
        const validation = validateCompanyDataStructure(data);
        expect(validation.valid).toBe(true);

        if (validation.errors.length > 0) {
          console.warn(`⚠️ Structure warnings for ${testCase.siren}:`, validation.errors);
        }
      },
      TEST_CONFIG.timeout,
    );
  });

  describe("Markdown Generation with Real Data", () => {
    it.each(REAL_SIREN_TEST_CASES)(
      "should generate valid markdown for $description (SIREN: $siren)",
      async (testCase) => {
        // Skip test si pas de credentials
        if (!preferences?.inpiUsername || !preferences?.inpiPassword) {
          console.log(`⏭️ Skipping ${testCase.siren} - No INPI credentials configured`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, TEST_CONFIG.rateLimitDelay));

        const data = await getCompanyInfo(testCase.siren);
        const markdown = buildMarkdown(data);

        // Le markdown ne doit pas être vide
        expect(markdown).toBeDefined();
        expect(markdown.length).toBeGreaterThan(0);

        // Le markdown ne doit pas contenir de fallbacks pour les données essentielles
        expect(markdown).not.toContain("No information to display");

        // Validation spécifique selon le type d'entité
        if (testCase.type === "personneMorale") {
          expect(markdown).toContain("**La société");
          expect(markdown).toContain("Représentée aux fins des présentes");

          // Le SIREN doit être correctement formaté (avec espaces)
          const formattedSiren = `${testCase.siren.substring(0, 3)} ${testCase.siren.substring(3, 6)} ${testCase.siren.substring(6, 9)}`;
          expect(markdown).toContain(formattedSiren);
        } else if (testCase.type === "personnePhysique") {
          expect(markdown).toMatch(/^(Monsieur|Madame)/);
          expect(markdown).toContain("N° : ");
        }

        // Validation des nouvelles fonctions de formatage
        // Les noms de représentants doivent suivre le format "Prénom NOM"
        if (testCase.type === "personneMorale") {
          // Rechercher les noms de représentants dans le markdown
          const representativeMatches = markdown.match(
            /Représentée aux fins des présentes par ([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ-]+ [A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ-]+)/,
          );
          if (representativeMatches) {
            const representativeName = representativeMatches[1];
            // Le nom doit avoir le format "Prénom NOM" (première lettre majuscule pour prénom, tout majuscule pour nom)
            expect(representativeName).toMatch(
              /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ-]+ [A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ-]+$/,
            );
          }
        }

        // Les villes RCS doivent être en Title Case (Paris, Lyon, etc.)
        if (testCase.type === "personneMorale") {
          const rcsMatches = markdown.match(
            /Immatriculée au RCS de ([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ-]+)/,
          );
          if (rcsMatches) {
            const rcsCity = rcsMatches[1];
            // La ville doit commencer par une majuscule et ne pas être entièrement en majuscules
            expect(rcsCity).toMatch(/^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ]/);
            expect(rcsCity).not.toMatch(/^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ-]+$/);
          }
        }
      },
      TEST_CONFIG.timeout,
    );
  });

  describe("Representative Information Extraction", () => {
    it.each(REAL_SIREN_TEST_CASES.filter((tc) => tc.expectedRepresentativeRole))(
      "should extract representative with correct role for $description (SIREN: $siren)",
      async (testCase) => {
        // Skip test si pas de credentials
        if (!preferences?.inpiUsername || !preferences?.inpiPassword) {
          console.log(`⏭️ Skipping ${testCase.siren} - No INPI credentials configured`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, TEST_CONFIG.rateLimitDelay));

        const data = await getCompanyInfo(testCase.siren);

        if (testCase.type === "personneMorale" && data.formality.content.personneMorale?.composition) {
          const { extractRepresentativeInfo } = await import("../../services/markdown-builder");
          const representative = extractRepresentativeInfo(data.formality.content.personneMorale.composition);

          expect(representative).toBeDefined();
          expect(representative.name).toBeDefined();
          expect(representative.role).toBeDefined();

          // Le nom du représentant ne doit pas être un fallback
          expect(representative.name).not.toContain("[[to be completed]]");

          // Si un rôle spécifique est attendu, le vérifier
          if (testCase.expectedRepresentativeRole) {
            // Note: Le rôle exact peut varier selon les données réelles
            // On vérifie seulement que ce n'est pas un fallback
            expect(representative.role).not.toContain("[[");
          }
        }
      },
      TEST_CONFIG.timeout,
    );
  });

  describe("Performance Validation", () => {
    it("should handle multiple concurrent requests efficiently", async () => {
      // Skip test si pas de credentials
      if (!preferences?.inpiUsername || !preferences?.inpiPassword) {
        console.log("⏭️ Skipping performance test - No INPI credentials configured");
        return;
      }
      const startTime = Date.now();

      // Prendre seulement 3 SIREN pour éviter le rate limiting
      const testSirens = REAL_SIREN_TEST_CASES.slice(0, 3);

      // Exécuter les requêtes avec délai pour respecter le rate limiting
      const promises = testSirens.map((testCase, index) => {
        return new Promise<{ siren: string; dataSize: number; markdownSize: number }>((resolve) => {
          // Délai progressif pour éviter le rate limiting
          setTimeout(async () => {
            const data = await getCompanyInfo(testCase.siren);
            const markdown = buildMarkdown(data);

            resolve({
              siren: testCase.siren,
              dataSize: JSON.stringify(data).length,
              markdownSize: markdown.length,
            });
          }, index * 2000);
        });
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Validation des performances
      expect(results).toHaveLength(3);
      expect(totalTime).toBeLessThan(30000); // Maximum 30s pour 3 requêtes

      results.forEach((result) => {
        expect(result.dataSize).toBeGreaterThan(0);
        expect(result.markdownSize).toBeGreaterThan(0);
      });

      console.log(`✓ Performance test completed: ${results.length} requests in ${totalTime}ms`);
    }, 35000); // 35s timeout pour le test de performance
  });
});

/**
 * Tests de régression pour s'assurer que les données réelles
 * ne cassent pas les fonctionnalités existantes
 */
describe("Regression Tests with Real Data", () => {
  it.each(REAL_SIREN_TEST_CASES.slice(0, 2))(
    // Limitons à 2 pour éviter le rate limiting
    "should not break existing functionality with real data from $description",
    async (testCase) => {
      // Skip test si pas de credentials
      if (!preferences?.inpiUsername || !preferences?.inpiPassword) {
        console.log(`⏭️ Skipping ${testCase.siren} - No INPI credentials configured`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, TEST_CONFIG.rateLimitDelay));

      const data = await getCompanyInfo(testCase.siren);

      // Test que toutes les fonctions utilitaires fonctionnent
      const { formatSiren, formatField, formatFrenchNumber } = await import("../../utils");

      expect(() => formatSiren(testCase.siren)).not.toThrow();
      expect(() => formatField("test")).not.toThrow();
      expect(() => formatFrenchNumber("1000")).not.toThrow();

      // Test que le markdown builder ne throw pas d'erreurs
      expect(() => buildMarkdown(data)).not.toThrow();

      // Test que la validation API ne throw pas d'erreurs
      expect(() => validateCompanyDataStructure(data)).not.toThrow();
    },
    TEST_CONFIG.timeout,
  );
});
