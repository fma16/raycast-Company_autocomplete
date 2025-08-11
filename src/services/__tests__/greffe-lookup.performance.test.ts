import { describe, it, expect, beforeAll } from "@jest/globals";
import { findGreffeByCodePostal } from "../greffe-lookup";

describe("greffe-lookup performance", () => {
  const testCodes = [
    "75001", "75008", "75015", "75020", // Paris
    "13001", "13008", "13015", // Marseille  
    "69001", "69008", "69015", // Lyon
    "10001", "31001", "44001", // Autres grandes villes
    "01001", "02001", "03001", // Départements ruraux
    "99999", "00000", "12345", // Codes inexistants
  ];

  let results: Array<{ code: string; greffe: string | null; time: number }> = [];

  beforeAll(() => {
    // Warm-up: premier appel pour initialiser les imports
    findGreffeByCodePostal("75001");
  });

  describe("lookup speed", () => {
    it("should perform lookups under 10ms each", () => {
      const maxTimeMs = 10;
      
      for (const code of testCodes) {
        const startTime = performance.now();
        const result = findGreffeByCodePostal(code);
        const endTime = performance.now();
        const timeMs = endTime - startTime;
        
        results.push({ code, greffe: result, time: timeMs });
        
        expect(timeMs).toBeLessThan(maxTimeMs);
      }
    });

    it("should maintain performance across multiple calls", () => {
      const iterations = 100;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const code = testCodes[i % testCodes.length];
        
        const startTime = performance.now();
        findGreffeByCodePostal(code);
        const endTime = performance.now();
        
        times.push(endTime - startTime);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      expect(avgTime).toBeLessThan(5); // Moyenne < 5ms
      expect(maxTime).toBeLessThan(15); // Max < 15ms
      
      console.log(`Performance stats: avg=${avgTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms`);
    });
  });

  describe("accuracy", () => {
    it("should return correct greffes for major cities", () => {
      expect(findGreffeByCodePostal("75001")).toBe("PARIS");
      expect(findGreffeByCodePostal("13001")).toBe("MARSEILLE"); 
      expect(findGreffeByCodePostal("69001")).toBe("LYON");
    });

    it("should return null for non-existent codes", () => {
      expect(findGreffeByCodePostal("00000")).toBeNull();
      expect(findGreffeByCodePostal("99999")).toBeNull();
      expect(findGreffeByCodePostal("")).toBeNull();
    });

    it("should handle edge cases", () => {
      // Test some actual Paris codes instead of assuming range
      expect(findGreffeByCodePostal("75116")).toBe("PARIS"); // Known Paris code
      expect(findGreffeByCodePostal("75001")).toBe("PARIS"); // First arrondissement
    });
  });

  describe("memory efficiency", () => {
    it("should not leak memory during repeated lookups", () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many lookups
      for (let i = 0; i < 1000; i++) {
        const code = testCodes[i % testCodes.length];
        findGreffeByCodePostal(code);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (< 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });

  afterAll(() => {
    // Print performance summary
    if (results.length > 0) {
      const avgTime = results.reduce((acc, r) => acc + r.time, 0) / results.length;
      const maxTime = Math.max(...results.map(r => r.time));
      const minTime = Math.min(...results.map(r => r.time));
      
      console.log('\n=== Greffe Lookup Performance Summary ===');
      console.log(`Tested ${results.length} lookups`);
      console.log(`Average: ${avgTime.toFixed(3)}ms`);
      console.log(`Min: ${minTime.toFixed(3)}ms`);
      console.log(`Max: ${maxTime.toFixed(3)}ms`);
      console.log(`All lookups under 10ms: ${results.every(r => r.time < 10) ? '✓' : '❌'}`);
    }
  });
});