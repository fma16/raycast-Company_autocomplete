/**
 * Tests for API response validation and change detection
 */

import { 
  validateCompanyDataStructure, 
  detectApiChanges, 
  createApiBaseline 
} from '../../services/api-validation';

describe('API Validation', () => {
  
  const validPersonneMoraleResponse = {
    formality: {
      siren: "784608416",
      content: {
        personneMorale: {
          denomination: "TEST COMPANY",
          adresseEntreprise: {
            adresse: {
              codePostal: "75001",
              commune: "PARIS",
              numeroVoie: "123",
              typeVoie: "rue",
              libelleVoie: "de la Paix"
            }
          },
          composition: {
            pouvoirs: [
              {
                individu: {
                  descriptionPersonne: {
                    nom: "DUPONT",
                    prenoms: ["Jean"],
                    genre: "1"
                  }
                },
                roleEntreprise: "5132"
              }
            ]
          }
        }
      }
    }
  };
  
  const validPersonnePhysiqueResponse = {
    formality: {
      siren: "987654321",
      content: {
        personnePhysique: {
          identite: {
            entrepreneur: {
              descriptionPersonne: {
                nom: "MARTIN",
                prenoms: ["Marie"],
                genre: "2"
              }
            }
          },
          adressePersonne: {
            adresse: {
              codePostal: "69001",
              commune: "LYON"
            }
          }
        }
      }
    }
  };
  
  describe('Structure Validation', () => {
    test('should validate correct PersonneMorale structure', () => {
      const result = validateCompanyDataStructure(validPersonneMoraleResponse);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.missingFields).toHaveLength(0);
    });
    
    test('should validate correct PersonnePhysique structure', () => {
      const result = validateCompanyDataStructure(validPersonnePhysiqueResponse);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.missingFields).toHaveLength(0);
    });
    
    test('should detect missing required fields', () => {
      const invalidResponse = {
        formality: {
          // Missing siren
          content: {}
        }
      };
      
      const result = validateCompanyDataStructure(invalidResponse);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('siren'))).toBe(true);
      expect(result.missingFields).toContain('formality.siren');
    });
    
    test('should detect completely invalid response', () => {
      const result = validateCompanyDataStructure(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Response is not an object');
    });
    
    test('should detect missing formality', () => {
      const invalidResponse = { someOtherField: "value" };
      
      const result = validateCompanyDataStructure(invalidResponse);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: formality');
      expect(result.missingFields).toContain('formality');
    });
    
    test('should detect missing content entities', () => {
      const invalidResponse = {
        formality: {
          siren: "123456789",
          content: {} // Missing both personneMorale and personnePhysique
        }
      };
      
      const result = validateCompanyDataStructure(invalidResponse);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing both personneMorale and personnePhysique'))).toBe(true);
    });
    
    test('should validate SIREN format', () => {
      const invalidSirenResponse = {
        formality: {
          siren: "invalid-siren",
          content: {
            personneMorale: { denomination: "Test" }
          }
        }
      };
      
      const result = validateCompanyDataStructure(invalidSirenResponse);
      
      expect(result.warnings.some(w => w.includes('not 9 digits'))).toBe(true);
    });
    
    test('should handle both old and new API formats for representatives', () => {
      const oldFormatResponse = {
        formality: {
          siren: "123456789",
          content: {
            personneMorale: {
              denomination: "TEST",
              composition: {
                pouvoirs: [
                  {
                    personnePhysique: {
                      identite: {
                        descriptionPersonne: {
                          nom: "DUPONT",
                          prenoms: ["Jean"]
                        }
                      }
                    },
                    roleEntreprise: "5132"
                  }
                ]
              }
            }
          }
        }
      };
      
      const result = validateCompanyDataStructure(oldFormatResponse);
      expect(result.valid).toBe(true);
    });
  });
  
  describe('Change Detection', () => {
    test('should detect new fields', () => {
      const baseline = { a: 1, b: { c: 2 } };
      const current = { a: 1, b: { c: 2, d: 3 }, e: 4 };
      
      const changes = detectApiChanges(current, baseline);
      
      expect(changes.structureChanged).toBe(true);
      expect(changes.newFields).toContain('b.d');
      expect(changes.newFields).toContain('e');
      expect(changes.removedFields).toHaveLength(0);
      expect(changes.riskLevel).toBe('low');
    });
    
    test('should detect removed fields', () => {
      const baseline = { a: 1, b: { c: 2, d: 3 } };
      const current = { a: 1, b: { c: 2 } };
      
      const changes = detectApiChanges(current, baseline);
      
      expect(changes.structureChanged).toBe(true);
      expect(changes.newFields).toHaveLength(0);
      expect(changes.removedFields).toContain('b.d');
      expect(changes.riskLevel).toBe('high'); // Removed fields are high risk
    });
    
    test('should detect type changes', () => {
      const baseline = { a: "string", b: { c: 123 } };
      const current = { a: "string", b: { c: "now string" } };
      
      const changes = detectApiChanges(current, baseline);
      
      expect(changes.structureChanged).toBe(true);
      expect(changes.typeChanges).toContain('b.c: number → string');
      expect(changes.riskLevel).toBe('medium'); // Type changes are medium risk
    });
    
    test('should handle no changes', () => {
      const baseline = { a: 1, b: { c: "test" } };
      const current = { a: 1, b: { c: "test" } };
      
      const changes = detectApiChanges(current, baseline);
      
      expect(changes.structureChanged).toBe(false);
      expect(changes.newFields).toHaveLength(0);
      expect(changes.removedFields).toHaveLength(0);
      expect(changes.typeChanges).toHaveLength(0);
      expect(changes.riskLevel).toBe('low');
    });
    
    test('should detect complex nested changes', () => {
      const baseline = {
        formality: {
          siren: "123456789",
          content: {
            personneMorale: {
              denomination: "TEST",
              oldField: "value"
            }
          }
        }
      };
      
      const current = {
        formality: {
          siren: "123456789",
          content: {
            personneMorale: {
              denomination: "TEST",
              newField: "value"
            }
          }
        }
      };
      
      const changes = detectApiChanges(current, baseline);
      
      expect(changes.structureChanged).toBe(true);
      expect(changes.newFields).toContain('formality.content.personneMorale.newField');
      expect(changes.removedFields).toContain('formality.content.personneMorale.oldField');
      expect(changes.riskLevel).toBe('high'); // Has removed fields
    });
  });
  
  describe('Baseline Creation', () => {
    test('should create baseline from valid response', () => {
      const baseline = createApiBaseline(validPersonneMoraleResponse as any);
      
      expect(baseline.timestamp).toBeDefined();
      expect(baseline.structure).toBeDefined();
      expect(baseline.types).toBeDefined();
      expect(baseline.version).toBe('1.0');
      
      // Should contain key fields
      expect(baseline.structure).toContain('formality');
      expect(baseline.structure).toContain('formality.siren');
      expect(baseline.structure).toContain('formality.content');
      expect(baseline.structure).toContain('formality.content.personneMorale');
    });
    
    test('should capture field types correctly', () => {
      const baseline = createApiBaseline(validPersonneMoraleResponse as any);
      
      expect(baseline.types['formality.siren']).toBe('string');
      expect(baseline.types['formality.content']).toBe('object');
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle null and undefined values', () => {
      const responseWithNulls = {
        formality: {
          siren: "123456789",
          content: {
            personneMorale: {
              denomination: null,
              capital: undefined
            }
          }
        }
      };
      
      const result = validateCompanyDataStructure(responseWithNulls);
      expect(result.valid).toBe(true); // Should not crash
    });
    
    test('should handle arrays in response', () => {
      const responseWithArray = {
        formality: {
          siren: "123456789",
          content: {
            personneMorale: {
              denomination: "TEST",
              composition: {
                pouvoirs: [] // Empty array
              }
            }
          }
        }
      };
      
      const result = validateCompanyDataStructure(responseWithArray);
      expect(result.valid).toBe(true);
    });
    
    test('should handle missing optional nested objects', () => {
      const minimalResponse = {
        formality: {
          siren: "123456789",
          content: {
            personneMorale: {
              denomination: "MINIMAL COMPANY"
              // Missing address, composition, etc.
            }
          }
        }
      };
      
      const result = validateCompanyDataStructure(minimalResponse);
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('adresseEntreprise'))).toBe(true);
    });
  });
});