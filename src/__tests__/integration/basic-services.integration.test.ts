/**
 * Basic integration tests for core services - simplified for initial infrastructure
 */

import { compressGreffeData, decompressGreffeData, validateCompression } from "../../services/greffe-compressor";
import { findGreffeByCodePostal } from "../../services/greffe-lookup";

describe("Basic Services Integration Tests", () => {
  describe("Greffe Compression Pipeline", () => {
    test("should compress and validate greffe data correctly", () => {
      const sampleData = {
        "75001": "PARIS",
        "75002": "PARIS",
        "75003": "PARIS",
        "13001": "MARSEILLE",
        "69001": "LYON",
      };

      // Test compression
      const compressed = compressGreffeData(sampleData);

      expect(compressed.metadata).toBeDefined();
      expect(compressed.metadata.compressionRatio).toBeGreaterThan(0);
      expect(compressed.ranges).toBeDefined();
      expect(compressed.singles).toBeDefined();

      // Test validation
      const validation = validateCompression(sampleData, compressed);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Test lookups
      expect(decompressGreffeData(compressed, "75001")).toBe("PARIS");
      expect(decompressGreffeData(compressed, "13001")).toBe("MARSEILLE");
      expect(decompressGreffeData(compressed, "99999")).toBeNull();
    });
  });

  describe("Greffe Lookup Service", () => {
    test("should find greffe for known postal codes", () => {
      const parisGreffe = findGreffeByCodePostal("75001");
      expect(parisGreffe).toBe("PARIS");

      const invalidGreffe = findGreffeByCodePostal("99999");
      expect(invalidGreffe).toBeNull();

      const emptyGreffe = findGreffeByCodePostal("");
      expect(emptyGreffe).toBeNull();
    });
  });

  describe("Integration Flow", () => {
    test("should process complete lookup pipeline", () => {
      // Test with real data lookup
      const greffe = findGreffeByCodePostal("75001");
      expect(greffe).toBe("PARIS");

      // Test with compressed data flow
      const data = { "75001": "PARIS", "75002": "PARIS" };
      const compressed = compressGreffeData(data);
      const result = decompressGreffeData(compressed, "75001");

      expect(result).toBe("PARIS");
    });
  });
});
