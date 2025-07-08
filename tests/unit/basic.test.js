const IntentService = require('../../src/services/intentService');
const ParameterExtractor = require('../../src/utils/parameterExtractor');
const { Intent } = require('../../src/models/intent');
const { Parameter } = require('../../src/models/parameter');

describe('Basic Functionality Tests', () => {
  describe('IntentService', () => {
    test('should create IntentService instance', () => {
      const intentService = new IntentService();
      expect(intentService).toBeInstanceOf(IntentService);
    });

    test('should have intents loaded', () => {
      const intentService = new IntentService();
      const intents = intentService.getAvailableIntents();
      expect(intents).toBeDefined();
      expect(Array.isArray(intents)).toBe(true);
      expect(intents.length).toBeGreaterThan(0);
    });

    test('should get intent by id', () => {
      const intentService = new IntentService();
      const intent = intentService.getIntent('BUSQUEDA');
      expect(intent).toBeDefined();
      expect(intent).toHaveProperty('patterns');
    });

    test('should validate intent exists', () => {
      const intentService = new IntentService();
      expect(intentService.isValidIntent('BUSQUEDA')).toBe(true);
      expect(intentService.isValidIntent('NONEXISTENT')).toBe(false);
    });

    test('should get intent stats', () => {
      const intentService = new IntentService();
      const stats = intentService.getIntentStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('withPatterns');
      expect(stats).toHaveProperty('withParameters');
      expect(typeof stats.total).toBe('number');
    });
  });

  describe('ParameterExtractor', () => {
    test('should create ParameterExtractor instance', () => {
      const extractor = new ParameterExtractor();
      expect(extractor).toBeInstanceOf(ParameterExtractor);
    });

    test('should extract parameters from text', () => {
      const extractor = new ParameterExtractor();
      const params = extractor.extract('buscar laptop gaming', 'BUSQUEDA');
      expect(params).toBeDefined();
      expect(typeof params).toBe('object');
    });

    test('should handle empty text', () => {
      const extractor = new ParameterExtractor();
      const params = extractor.extract('', 'BUSQUEDA');
      expect(params).toEqual({});
    });

    test('should handle null text', () => {
      const extractor = new ParameterExtractor();
      const params = extractor.extract(null, 'BUSQUEDA');
      expect(params).toEqual({});
    });
  });

  describe('Intent Model', () => {
    test('should create Intent instance', () => {
      const intentData = {
        id: 'TEST',
        name: 'Test Intent',
        patterns: ['test {param}'],
        parameters: {
          param: { type: 'string', required: true }
        }
      };
      
      const intent = new Intent(intentData);
      expect(intent).toBeInstanceOf(Intent);
      expect(intent.id).toBe('TEST');
      expect(intent.name).toBe('Test Intent');
    });

    test('should validate intent data', () => {
      const invalidData = {
        name: 'Test Intent'
        // Missing required fields
      };
      
      expect(() => new Intent(invalidData)).toThrow();
    });

    test('should match patterns', () => {
      const intentData = {
        id: 'TEST',
        name: 'Test Intent',
        patterns: ['buscar {producto}'],
        parameters: {
          producto: { type: 'string', required: true }
        }
      };
      
      const intent = new Intent(intentData);
      expect(intent.matchesPattern('buscar laptop')).toBe(true);
      expect(intent.matchesPattern('hola mundo')).toBe(false);
    });

    test('should extract parameters', () => {
      const intentData = {
        id: 'TEST',
        name: 'Test Intent',
        patterns: ['buscar {producto}'],
        parameters: {
          producto: { type: 'string', required: true }
        }
      };
      
      const intent = new Intent(intentData);
      const params = intent.extractParameters('buscar laptop gaming');
      expect(params).toHaveProperty('producto', 'laptop gaming');
    });
  });

  describe('Parameter Model', () => {
    test('should create Parameter instance', () => {
      const paramData = {
        name: 'test_param',
        value: 'test_value',
        type: 'string',
        confidence: 0.9
      };
      
      const param = new Parameter(paramData);
      expect(param).toBeInstanceOf(Parameter);
      expect(param.name).toBe('test_param');
      expect(param.value).toBe('test_value');
    });

    test('should get typed value', () => {
      const paramData = {
        name: 'test_number',
        value: '42',
        type: 'number'
      };
      
      const param = new Parameter(paramData);
      expect(param.getTypedValue()).toBe(42);
    });

    test('should handle boolean values', () => {
      const paramData = {
        name: 'test_bool',
        value: 'true',
        type: 'boolean'
      };
      
      const param = new Parameter(paramData);
      expect(param.getTypedValue()).toBe(true);
    });

    test('should create parameter from value', () => {
      const param = Parameter.fromValue('test', 'value', { type: 'string' });
      expect(param).toBeInstanceOf(Parameter);
      expect(param.name).toBe('test');
      expect(param.value).toBe('value');
    });
  });

  describe('Integration', () => {
    test('should detect intent and extract parameters', () => {
      const intentService = new IntentService();
      const extractor = new ParameterExtractor();
      
      // Test with a known intent
      const text = 'buscar laptop gaming';
      const matchingIntents = intentService.findMatchingIntents(text);
      
      expect(matchingIntents.length).toBeGreaterThan(0);
      
      if (matchingIntents.length > 0) {
        const bestMatch = matchingIntents[0];
        const params = extractor.extract(text, bestMatch.intentId);
        
        expect(bestMatch.intentId).toBeDefined();
        expect(params).toBeDefined();
      }
    });
  });
}); 