/**
 * Basic performance tests for core operations
 */

import { findGreffeByCodePostal } from "../../services/greffe-lookup";
import { compressGreffeData, decompressGreffeData } from "../../services/greffe-compressor";

describe("Basic Performance Tests", () => {
  describe("Lookup Performance", () => {
    test("should perform single greffe lookup under target time", () => {
      const startTime = performance.now();

      const result = findGreffeByCodePostal("75001");

      const elapsed = performance.now() - startTime;

      expect(result).toBeDefined();
      expect(elapsed).toBeLessThan(10); // Target: <10ms
      console.log(`Single lookup: ${elapsed.toFixed(3)}ms`);
    });

    test("should perform batch lookups efficiently", () => {
      const testCodes = ["75001", "75002", "13001", "69001", "06000"];

      const startTime = performance.now();

      const results = testCodes.map((code) => findGreffeByCodePostal(code));

      const elapsed = performance.now() - startTime;
      const avgPerLookup = elapsed / testCodes.length;

      expect(results.filter((r) => r !== null).length).toBeGreaterThan(0);
      expect(avgPerLookup).toBeLessThan(2); // Target: <2ms average
      console.log(
        `Batch lookup (${testCodes.length} items): ${elapsed.toFixed(3)}ms total, ${avgPerLookup.toFixed(3)}ms average`,
      );
    });
  });

  describe("Compression Performance", () => {
    test("should maintain performance with compressed data", () => {
      // Small test dataset
      const originalData = {
        "75001": "PARIS",
        "75002": "PARIS",
        "75003": "PARIS",
        "13001": "MARSEILLE",
        "13002": "MARSEILLE",
        "69001": "LYON",
      };

      const compressed = compressGreffeData(originalData);
      const testCodes = Object.keys(originalData);

      const startTime = performance.now();

      testCodes.forEach((code) => {
        const result = decompressGreffeData(compressed, code);
        expect(result).toBe(originalData[code]);
      });

      const elapsed = performance.now() - startTime;
      const avgPerLookup = elapsed / testCodes.length;

      expect(avgPerLookup).toBeLessThan(1); // Target: <1ms for compressed lookup
      console.log(`Compressed lookup (${testCodes.length} items): ${avgPerLookup.toFixed(4)}ms average`);
      console.log(`Compression ratio: ${compressed.metadata.compressionRatio}%`);
    });
  });

  describe("Performance Baseline", () => {
    test("should establish basic performance benchmarks", () => {
      const benchmarks = {
        singleLookup: 0,
        batchLookup: 0,
        compressedLookup: 0,
      };

      // Single lookup benchmark
      const startSingle = performance.now();
      findGreffeByCodePostal("75001");
      benchmarks.singleLookup = performance.now() - startSingle;

      // Batch lookup benchmark
      const testCodes = ["75001", "13001", "69001"];
      const startBatch = performance.now();
      testCodes.forEach((code) => findGreffeByCodePostal(code));
      benchmarks.batchLookup = (performance.now() - startBatch) / testCodes.length;

      // Compressed lookup benchmark
      const testData = { "75001": "PARIS", "13001": "MARSEILLE" };
      const compressed = compressGreffeData(testData);
      const startCompressed = performance.now();
      decompressGreffeData(compressed, "75001");
      benchmarks.compressedLookup = performance.now() - startCompressed;

      console.log("Performance Benchmarks:", JSON.stringify(benchmarks, null, 2));

      // Verify benchmarks meet targets
      expect(benchmarks.singleLookup).toBeLessThan(10);
      expect(benchmarks.batchLookup).toBeLessThan(2);
      expect(benchmarks.compressedLookup).toBeLessThan(1);
    });
  });
});
