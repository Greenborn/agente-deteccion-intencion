const ParameterExtractor = require('../../src/utils/parameterExtractor');

describe('ParameterExtractor', () => {
  let extractor;

  beforeEach(() => {
    extractor = new ParameterExtractor();
  });

  describe('extractParameters', () => {
    test('should extract single parameter', () => {
      const text = 'buscar laptop';
      const pattern = 'buscar {producto}';
      
      const result = extractor.extractParameters(text, pattern);
      
      expect(result).toHaveProperty('producto', 'laptop');
    });

    test('should extract multiple parameters', () => {
      const text = 'comprar 3 laptops';
      const pattern = 'comprar {cantidad} {producto}';
      
      const result = extractor.extractParameters(text, pattern);
      
      expect(result).toHaveProperty('cantidad', '3');
      expect(result).toHaveProperty('producto', 'laptops');
    });

    test('should handle case insensitive matching', () => {
      const text = 'BUSCAR LAPTOP';
      const pattern = 'buscar {producto}';
      
      const result = extractor.extractParameters(text, pattern);
      
      expect(result).toHaveProperty('producto', 'LAPTOP');
    });

    test('should return empty object for no match', () => {
      const text = 'hola mundo';
      const pattern = 'buscar {producto}';
      
      const result = extractor.extractParameters(text, pattern);
      
      expect(result).toEqual({});
    });

    test('should handle patterns with special characters', () => {
      const text = 'precio de laptop-gaming';
      const pattern = 'precio de {producto}';
      
      const result = extractor.extractParameters(text, pattern);
      
      expect(result).toHaveProperty('producto', 'laptop-gaming');
    });

    test('should handle patterns with numbers', () => {
      const text = 'pedir 5 laptops';
      const pattern = 'pedir {cantidad} {producto}';
      
      const result = extractor.extractParameters(text, pattern);
      
      expect(result).toHaveProperty('cantidad', '5');
      expect(result).toHaveProperty('producto', 'laptops');
    });
  });

  describe('extractParametersFromMultiplePatterns', () => {
    test('should extract from first matching pattern', () => {
      const text = 'buscar laptop';
      const patterns = [
        'buscar {producto}',
        'encontrar {producto}',
        'necesito {producto}'
      ];
      
      const result = extractor.extractParametersFromMultiplePatterns(text, patterns);
      
      expect(result).toHaveProperty('producto', 'laptop');
    });

    test('should return empty object if no patterns match', () => {
      const text = 'hola mundo';
      const patterns = [
        'buscar {producto}',
        'encontrar {producto}'
      ];
      
      const result = extractor.extractParametersFromMultiplePatterns(text, patterns);
      
      expect(result).toEqual({});
    });

    test('should handle empty patterns array', () => {
      const text = 'buscar laptop';
      const patterns = [];
      
      const result = extractor.extractParametersFromMultiplePatterns(text, patterns);
      
      expect(result).toEqual({});
    });
  });

  describe('validateParameters', () => {
    test('should validate required parameters', () => {
      const params = { producto: 'laptop' };
      const schema = {
        producto: { type: 'string', required: true },
        cantidad: { type: 'number', required: false }
      };
      
      const result = extractor.validateParameters(params, schema);
      
      expect(result.isValid).toBe(true);
      expect(result.params).toHaveProperty('producto', 'laptop');
    });

    test('should reject missing required parameters', () => {
      const params = {};
      const schema = {
        producto: { type: 'string', required: true }
      };
      
      const result = extractor.validateParameters(params, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Parámetro requerido 'producto' no encontrado");
    });

    test('should validate parameter types', () => {
      const params = { cantidad: '5' };
      const schema = {
        cantidad: { type: 'number', required: true }
      };
      
      const result = extractor.validateParameters(params, schema);
      
      expect(result.isValid).toBe(true);
      expect(result.params).toHaveProperty('cantidad', 5);
    });

    test('should reject invalid parameter types', () => {
      const params = { cantidad: 'no es número' };
      const schema = {
        cantidad: { type: 'number', required: true }
      };
      
      const result = extractor.validateParameters(params, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Parámetro 'cantidad' debe ser de tipo number");
    });
  });

  describe('extractParametersWithPosition', () => {
    test('should extract parameters with position information', () => {
      const text = 'buscar laptop gaming';
      const pattern = 'buscar {producto}';
      
      const result = extractor.extractParametersWithPosition(text, pattern);
      
      expect(result).toHaveProperty('producto');
      expect(result.producto).toHaveProperty('value', 'laptop gaming');
      expect(result.producto).toHaveProperty('position');
      expect(result.producto.position).toHaveProperty('start');
      expect(result.producto.position).toHaveProperty('end');
    });

    test('should handle multiple parameters with positions', () => {
      const text = 'comprar 3 laptops';
      const pattern = 'comprar {cantidad} {producto}';
      
      const result = extractor.extractParametersWithPosition(text, pattern);
      
      expect(result).toHaveProperty('cantidad');
      expect(result).toHaveProperty('producto');
      expect(result.cantidad).toHaveProperty('position');
      expect(result.producto).toHaveProperty('position');
    });
  });

  describe('extractNamedEntities', () => {
    test('should extract product names', () => {
      const text = 'buscar laptop Dell XPS 13';
      
      const result = extractor.extractNamedEntities(text);
      
      expect(result).toHaveProperty('products');
      expect(result.products).toContain('laptop Dell XPS 13');
    });

    test('should extract quantities', () => {
      const text = 'comprar 5 laptops y 3 mouses';
      
      const result = extractor.extractNamedEntities(text);
      
      expect(result).toHaveProperty('quantities');
      expect(result.quantities).toContain(5);
      expect(result.quantities).toContain(3);
    });

    test('should extract dates', () => {
      const text = 'cita para mañana a las 3pm';
      
      const result = extractor.extractNamedEntities(text);
      
      expect(result).toHaveProperty('dates');
      expect(result.dates).toHaveLength(1);
    });
  });

  describe('normalizeText', () => {
    test('should normalize text correctly', () => {
      const text = '  Buscar   LAPTOP  ';
      
      const result = extractor.normalizeText(text);
      
      expect(result).toBe('buscar laptop');
    });

    test('should handle special characters', () => {
      const text = '¡Hola! ¿Cómo estás?';
      
      const result = extractor.normalizeText(text);
      
      expect(result).toBe('hola cómo estás');
    });

    test('should handle numbers', () => {
      const text = 'comprar 5 laptops';
      
      const result = extractor.normalizeText(text);
      
      expect(result).toBe('comprar 5 laptops');
    });
  });

  describe('createPatternRegex', () => {
    test('should create regex for simple pattern', () => {
      const pattern = 'buscar {producto}';
      
      const regex = extractor.createPatternRegex(pattern);
      
      expect(regex).toBeInstanceOf(RegExp);
      expect('buscar laptop'.match(regex)).toBeTruthy();
      expect('buscar'.match(regex)).toBeFalsy();
    });

    test('should create regex for multiple parameters', () => {
      const pattern = 'comprar {cantidad} {producto}';
      
      const regex = extractor.createPatternRegex(pattern);
      
      expect(regex).toBeInstanceOf(RegExp);
      expect('comprar 3 laptops'.match(regex)).toBeTruthy();
    });

    test('should handle special regex characters', () => {
      const pattern = 'precio de {producto} (USD)';
      
      const regex = extractor.createPatternRegex(pattern);
      
      expect(regex).toBeInstanceOf(RegExp);
      expect('precio de laptop (USD)'.match(regex)).toBeTruthy();
    });
  });

  describe('getParameterNames', () => {
    test('should extract parameter names from pattern', () => {
      const pattern = 'comprar {cantidad} {producto}';
      
      const names = extractor.getParameterNames(pattern);
      
      expect(names).toContain('cantidad');
      expect(names).toContain('producto');
    });

    test('should return empty array for pattern without parameters', () => {
      const pattern = 'hola mundo';
      
      const names = extractor.getParameterNames(pattern);
      
      expect(names).toEqual([]);
    });

    test('should handle duplicate parameter names', () => {
      const pattern = 'buscar {producto} y {producto}';
      
      const names = extractor.getParameterNames(pattern);
      
      expect(names).toEqual(['producto', 'producto']);
    });
  });
}); 