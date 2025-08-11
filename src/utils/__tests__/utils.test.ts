import { describe, it, expect } from "@jest/globals";
import { validateAndExtractSiren, formatSiren, formatFrenchNumber } from "../formatting";

describe("utils", () => {
  describe("validateAndExtractSiren", () => {
    it("should validate and return 9-digit SIREN", () => {
      expect(validateAndExtractSiren("123456789")).toBe("123456789");
      expect(validateAndExtractSiren("123 456 789")).toBe("123456789");
    });

    it("should extract SIREN from 14-digit SIRET", () => {
      expect(validateAndExtractSiren("12345678912345")).toBe("123456789");
      expect(validateAndExtractSiren("123 456 789 12345")).toBe("123456789");
    });

    it("should return null for invalid formats", () => {
      expect(validateAndExtractSiren("12345")).toBe(null);
      expect(validateAndExtractSiren("123456789012")).toBe(null);
      expect(validateAndExtractSiren("abc123456")).toBe(null);
      expect(validateAndExtractSiren("")).toBe(null);
    });
  });

  describe("formatSiren", () => {
    it("should format SIREN with non-breaking spaces", () => {
      const result = formatSiren("123456789");
      expect(result).toBe("123\u00A0456\u00A0789");
    });

    it("should handle already formatted SIREN", () => {
      const result = formatSiren("123 456 789");
      expect(result).toBe("123\u00A0456\u00A0789");
    });
  });

  describe("formatFrenchNumber", () => {
    it("should format numbers with French conventions", () => {
      const result1 = formatFrenchNumber("10000");
      expect(result1).toContain("10");
      expect(result1).toContain("000,00");
      
      expect(formatFrenchNumber("999")).toBe("999,00");
    });

    it("should handle string numbers", () => {
      const result = formatFrenchNumber(10000);
      expect(result).toContain("10");
      expect(result).toContain("000,00");
    });

    it("should return fallback for invalid input", () => {
      expect(formatFrenchNumber("invalid")).toBe("[[à compléter]]");
      expect(formatFrenchNumber("")).toBe("[[à compléter]]");
    });
  });
});