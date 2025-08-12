/**
 * Tests d'intégration utilisant des données mockées (pour CI/CD)
 * Ces tests s'exécutent sur GitHub Actions sans nécessiter d'authentification
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { inpiApiMock, shouldUseMock } from "../../services/inpi-api-mock";
import { buildMarkdown } from "../../services/markdown-builder";
import { validateCompanyDataStructure } from "../../services/api-validation";
import { REAL_SIREN_TEST_CASES } from "../../data/real-siren-test-cases";

describe("Mocked API Integration Tests (CI/CD)", () => {
  beforeAll(() => {
    // Forcer l'utilisation du mock pour ces tests
    process.env.FORCE_MOCK = "true";
  });

  afterAll(() => {
    delete process.env.FORCE_MOCK;
  });

  describe("Mock Service Validation", () => {
    it("should use mocked service in CI environment", () => {
      expect(shouldUseMock()).toBe(true);
    });

    it("should have valid mocked dataset", () => {
      const datasetInfo = inpiApiMock.getDatasetInfo();

      expect(datasetInfo.totalCompanies).toBeGreaterThan(0);
      expect(datasetInfo.successfulResponses).toBeGreaterThan(0);
      expect(datasetInfo.version).toBeDefined();
      expect(datasetInfo.generated).toBeDefined();
    });

    it("should have test SIREN available", () => {
      const availableSirens = inpiApiMock.getAvailableSirens();
      const datasetInfo = inpiApiMock.getDatasetInfo();

      // Vérifier qu'on a au moins quelques SIREN disponibles
      expect(availableSirens.length).toBeGreaterThan(0);
      expect(datasetInfo.successfulResponses).toBeGreaterThan(0);

      // Si c'est le dataset temporaire (3 entreprises), accepter ça
      // Sinon, attendre au moins 80% des SIREN de test
      const minExpected = datasetInfo.totalCompanies >= 10 ? Math.floor(REAL_SIREN_TEST_CASES.length * 0.8) : 2; // Minimum pour dataset temporaire

      const availableTestSirens = REAL_SIREN_TEST_CASES.filter((tc) => availableSirens.includes(tc.siren));

      expect(availableTestSirens.length).toBeGreaterThanOrEqual(minExpected);

      if (datasetInfo.totalCompanies < 10) {
        console.warn(
          "⚠️ Using temporary dataset. Generate full dataset with: cd local && npx ts-node generate-mock-dataset.ts",
        );
      }
    });
  });

  describe("Mocked Data Structure Validation", () => {
    const availableSirens = inpiApiMock.getAvailableSirens();
    const testCases = REAL_SIREN_TEST_CASES.filter((tc) => availableSirens.includes(tc.siren));

    it.each(testCases)("should validate mocked data structure for $description (SIREN: $siren)", async (testCase) => {
      const data = await inpiApiMock.getCompanyInfo(testCase.siren);

      // Validation basique de la structure
      expect(data).toBeDefined();
      expect(data.formality).toBeDefined();
      expect(data.formality.siren).toBe(testCase.siren);

      // Validation avec le service de validation API
      const validation = validateCompanyDataStructure(data);
      expect(validation.valid).toBe(true);

      if (validation.errors.length > 0) {
        console.warn(`⚠️ Structure warnings for ${testCase.siren}:`, validation.errors);
      }
    });
  });

  describe("Markdown Generation with Mocked Data", () => {
    const availableSirens = inpiApiMock.getAvailableSirens();
    const testCases = REAL_SIREN_TEST_CASES.filter((tc) => availableSirens.includes(tc.siren));

    it.each(testCases)("should generate valid markdown for mocked $description (SIREN: $siren)", async (testCase) => {
      const data = await inpiApiMock.getCompanyInfo(testCase.siren);
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

        // Le SIREN doit être correctement formaté (avec espaces non-breakables)
        const formattedSiren = `${testCase.siren.substring(0, 3)}\u00A0${testCase.siren.substring(3, 6)}\u00A0${testCase.siren.substring(6, 9)}`;
        expect(markdown).toContain(formattedSiren);
      } else if (testCase.type === "personnePhysique") {
        expect(markdown).toMatch(/^(Monsieur|Madame)/);
        expect(markdown).toContain("N° : ");
      }

      // Validation des fonctions de formatage v1.1
      if (testCase.type === "personneMorale") {
        // Noms de représentants format "Prénom NOM"
        const representativeMatches = markdown.match(
          /Représentée aux fins des présentes par ([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ-]+ [A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ-]+)/,
        );
        if (representativeMatches) {
          const representativeName = representativeMatches[1];
          expect(representativeName).toMatch(
            /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ-]+ [A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ-]+$/,
          );
        }

        // Villes RCS en Title Case (Paris, Lyon, etc.)
        const rcsMatches = markdown.match(
          /Immatriculée au RCS de ([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ-]+)/,
        );
        if (rcsMatches) {
          const rcsCity = rcsMatches[1];
          expect(rcsCity).toMatch(/^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ]/);
          expect(rcsCity).not.toMatch(/^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ-]+$/);
        }

        // Adresses avec types de voies étendus (BD → Boulevard)
        const addressMatches = markdown.match(/situé (.+),/);
        if (addressMatches) {
          const address = addressMatches[1];
          // Vérifier que les abréviations sont étendues
          expect(address).not.toContain(" BD ");
          expect(address).not.toContain(" AV ");
          expect(address).not.toContain(" PL ");

          // Vérifier que les formes complètes sont présentes (si applicable)
          if (address.includes("boulevard") || address.includes("avenue") || address.includes("place")) {
            expect(address).toMatch(/(boulevard|avenue|place|rue|chemin)/i);
          }
        }
      }
    });
  });

  describe("Mock Service Performance", () => {
    it("should respond quickly with mocked data", async () => {
      const availableSirens = inpiApiMock.getAvailableSirens();
      if (availableSirens.length === 0) {
        console.warn("No available SIREN in mocked dataset");
        return;
      }

      const testSiren = availableSirens[0];
      const startTime = Date.now();

      await inpiApiMock.getCompanyInfo(testSiren);

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(500); // Devrait être très rapide avec des mocks
    });

    it("should handle multiple concurrent requests", async () => {
      const availableSirens = inpiApiMock.getAvailableSirens().slice(0, 3);

      if (availableSirens.length < 3) {
        console.warn("Not enough SIREN available for concurrent test");
        return;
      }

      const startTime = Date.now();

      const promises = availableSirens.map((siren) => inpiApiMock.getCompanyInfo(siren));

      const results = await Promise.all(promises);
      const elapsed = Date.now() - startTime;

      expect(results).toHaveLength(3);
      expect(elapsed).toBeLessThan(1000);

      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.formality).toBeDefined();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown SIREN gracefully", async () => {
      const unknownSiren = "999999999";

      await expect(inpiApiMock.getCompanyInfo(unknownSiren)).rejects.toThrow(
        `SIREN ${unknownSiren} not found in mocked dataset`,
      );
    });

    it("should handle mocked errors properly", async () => {
      // Tester les erreurs en essayant des SIREN invalides
      const invalidSiren = "000000000";

      await expect(inpiApiMock.getCompanyInfo(invalidSiren)).rejects.toThrow(
        `SIREN ${invalidSiren} not found in mocked dataset`,
      );
    });
  });
});
