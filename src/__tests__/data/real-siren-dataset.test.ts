/**
 * Tests de validation du dataset de SIREN réels
 */

import { describe, it, expect } from "@jest/globals";
import { REAL_SIREN_TEST_CASES, getNestedProperty, validateEntityStructure } from "../../data/real-siren-test-cases";

describe("Real SIREN Dataset Validation", () => {
  it("should contain 10 test cases", () => {
    expect(REAL_SIREN_TEST_CASES).toHaveLength(10);
  });

  it("should have valid SIREN format for all test cases", () => {
    REAL_SIREN_TEST_CASES.forEach((testCase) => {
      expect(testCase.siren).toMatch(/^\d{9}$/);
    });
  });

  it("should have proper structure for all test cases", () => {
    REAL_SIREN_TEST_CASES.forEach((testCase) => {
      expect(testCase.siren).toBeDefined();
      expect(testCase.type).toMatch(/^(personneMorale|personnePhysique)$/);
      expect(testCase.description).toBeDefined();
      expect(testCase.legalForm).toBeDefined();
      expect(testCase.expectedFields).toBeInstanceOf(Array);
      expect(testCase.expectedFields.length).toBeGreaterThan(0);
    });
  });

  it("should include diverse entity types", () => {
    const types = REAL_SIREN_TEST_CASES.map((tc) => tc.type);
    expect(types).toContain("personneMorale");
    expect(types).toContain("personnePhysique");
  });

  it("should include diverse legal forms", () => {
    const legalForms = REAL_SIREN_TEST_CASES.map((tc) => tc.legalForm);
    expect(legalForms).toContain("SA");
    expect(legalForms).toContain("SARL");
    expect(legalForms).toContain("SAS");
    expect(legalForms).toContain("Entrepreneur individuel");
  });

  describe("getNestedProperty utility", () => {
    it("should extract nested properties correctly", () => {
      const testObj = {
        level1: {
          level2: {
            value: "test",
          },
        },
      };

      expect(getNestedProperty(testObj, "level1.level2.value")).toBe("test");
      expect(getNestedProperty(testObj, "level1.level2")).toEqual({ value: "test" });
      expect(getNestedProperty(testObj, "nonexistent")).toBeUndefined();
    });

    it("should handle null/undefined objects", () => {
      expect(getNestedProperty(null, "test")).toBeUndefined();
      expect(getNestedProperty(undefined, "test")).toBeUndefined();
    });
  });

  describe("validateEntityStructure utility", () => {
    it("should validate personneMorale structure", () => {
      const mockData = {
        formality: {
          content: {
            personneMorale: {
              denomination: "Test Company",
            },
          },
        },
      };

      const testCase = REAL_SIREN_TEST_CASES.find((tc) => tc.type === "personneMorale")!;
      const modifiedTestCase = {
        ...testCase,
        expectedFields: ["formality.content.personneMorale.denomination"],
      };

      expect(validateEntityStructure(mockData, modifiedTestCase)).toBe(true);
    });

    it("should validate personnePhysique structure", () => {
      const mockData = {
        formality: {
          content: {
            personnePhysique: {
              identite: {
                entrepreneur: {
                  descriptionPersonne: {
                    nom: "Test",
                  },
                },
              },
            },
          },
        },
      };

      const testCase = REAL_SIREN_TEST_CASES.find((tc) => tc.type === "personnePhysique")!;
      const modifiedTestCase = {
        ...testCase,
        expectedFields: ["formality.content.personnePhysique.identite.entrepreneur.descriptionPersonne.nom"],
      };

      expect(validateEntityStructure(mockData, modifiedTestCase)).toBe(true);
    });

    it("should return false for invalid structure", () => {
      const mockData = {
        formality: {
          content: {},
        },
      };

      const testCase = REAL_SIREN_TEST_CASES[0];
      expect(validateEntityStructure(mockData, testCase)).toBe(false);
    });
  });
});
