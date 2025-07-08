const IntentService = require('../../src/services/intentService');
const { Intent } = require('../../src/models/intent');

describe('IntentService', () => {
  let intentService;
  let mockIntents;

  beforeEach(() => {
    mockIntents = [
      {
        id: 'BUSQUEDA',
        name: 'Búsqueda',
        patterns: ['buscar {producto}', 'encontrar {producto}'],
        parameters: {
          producto: { type: 'string', required: true }
        },
        confidence: 0.8,
        priority: 1
      },
      {
        id: 'SALUDO',
        name: 'Saludo',
        patterns: ['hola', 'buenos días'],
        parameters: {},
        confidence: 0.95,
        priority: 5
      }
    ];

    intentService = new IntentService();
    intentService.loadIntents(mockIntents);
  });

  describe('loadIntents', () => {
    test('should load intents correctly', () => {
      expect(intentService.intents).toHaveLength(2);
      expect(intentService.intents[0]).toBeInstanceOf(Intent);
      expect(intentService.intents[0].id).toBe('BUSQUEDA');
    });

    test('should sort intents by priority', () => {
      expect(intentService.intents[0].priority).toBe(1);
      expect(intentService.intents[1].priority).toBe(5);
    });
  });

  describe('detectIntent', () => {
    test('should detect BUSQUEDA intent', () => {
      const result = intentService.detectIntent('buscar laptop');
      
      expect(result.command).toBe('BUSQUEDA');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.params_list).toHaveProperty('producto', 'laptop');
    });

    test('should detect SALUDO intent', () => {
      const result = intentService.detectIntent('hola');
      
      expect(result.command).toBe('SALUDO');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.params_list).toEqual({});
    });

    test('should return none for unknown text', () => {
      const result = intentService.detectIntent('texto sin sentido');
      
      expect(result.command).toBe('none');
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('should handle empty text', () => {
      const result = intentService.detectIntent('');
      
      expect(result.command).toBe('none');
      expect(result.confidence).toBe(0);
    });

    test('should handle null text', () => {
      const result = intentService.detectIntent(null);
      
      expect(result.command).toBe('none');
      expect(result.confidence).toBe(0);
    });
  });

  describe('getIntentById', () => {
    test('should return intent by id', () => {
      const intent = intentService.getIntentById('BUSQUEDA');
      
      expect(intent).toBeInstanceOf(Intent);
      expect(intent.id).toBe('BUSQUEDA');
    });

    test('should return null for non-existent intent', () => {
      const intent = intentService.getIntentById('NONEXISTENT');
      
      expect(intent).toBeNull();
    });
  });

  describe('getAllIntents', () => {
    test('should return all intents', () => {
      const intents = intentService.getAllIntents();
      
      expect(intents).toHaveLength(2);
      expect(intents[0]).toBeInstanceOf(Intent);
      expect(intents[1]).toBeInstanceOf(Intent);
    });
  });

  describe('addIntent', () => {
    test('should add new intent', () => {
      const newIntent = {
        id: 'COMPRA',
        name: 'Compra',
        patterns: ['comprar {producto}'],
        parameters: {
          producto: { type: 'string', required: true }
        }
      };

      intentService.addIntent(newIntent);
      
      expect(intentService.intents).toHaveLength(3);
      expect(intentService.getIntentById('COMPRA')).toBeInstanceOf(Intent);
    });

    test('should update existing intent', () => {
      const updatedIntent = {
        id: 'BUSQUEDA',
        name: 'Búsqueda Actualizada',
        patterns: ['buscar {producto}', 'encontrar {producto}', 'necesito {producto}'],
        parameters: {
          producto: { type: 'string', required: true }
        }
      };

      intentService.addIntent(updatedIntent);
      
      expect(intentService.intents).toHaveLength(2);
      const intent = intentService.getIntentById('BUSQUEDA');
      expect(intent.name).toBe('Búsqueda Actualizada');
      expect(intent.patterns).toHaveLength(3);
    });
  });

  describe('removeIntent', () => {
    test('should remove intent by id', () => {
      const removed = intentService.removeIntent('BUSQUEDA');
      
      expect(removed).toBe(true);
      expect(intentService.intents).toHaveLength(1);
      expect(intentService.getIntentById('BUSQUEDA')).toBeNull();
    });

    test('should return false for non-existent intent', () => {
      const removed = intentService.removeIntent('NONEXISTENT');
      
      expect(removed).toBe(false);
      expect(intentService.intents).toHaveLength(2);
    });
  });

  describe('validateIntent', () => {
    test('should validate correct intent', () => {
      const validIntent = {
        id: 'TEST',
        name: 'Test Intent',
        patterns: ['test pattern'],
        parameters: {}
      };

      const result = intentService.validateIntent(validIntent);
      expect(result.isValid).toBe(true);
    });

    test('should reject intent without id', () => {
      const invalidIntent = {
        name: 'Test Intent',
        patterns: ['test pattern']
      };

      const result = intentService.validateIntent(invalidIntent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('"id" is required');
    });

    test('should reject intent without patterns', () => {
      const invalidIntent = {
        id: 'TEST',
        name: 'Test Intent'
      };

      const result = intentService.validateIntent(invalidIntent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('"patterns" is required');
    });
  });

  describe('getIntentStats', () => {
    test('should return correct statistics', () => {
      const stats = intentService.getIntentStats();
      
      expect(stats.totalIntents).toBe(2);
      expect(stats.intentsWithParameters).toBe(1);
      expect(stats.intentsWithoutParameters).toBe(1);
      expect(stats.averageConfidence).toBeCloseTo(0.875, 2);
      expect(stats.intentIds).toContain('BUSQUEDA');
      expect(stats.intentIds).toContain('SALUDO');
    });
  });

  describe('exportIntents', () => {
    test('should export intents to JSON format', () => {
      const exported = intentService.exportIntents();
      
      expect(exported).toHaveProperty('intents');
      expect(exported.intents).toHaveLength(2);
      expect(exported.intents[0]).toHaveProperty('id', 'BUSQUEDA');
      expect(exported.intents[1]).toHaveProperty('id', 'SALUDO');
      expect(exported).toHaveProperty('metadata');
    });
  });
}); 