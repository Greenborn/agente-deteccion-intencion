const IntentService = require('../services/intentService');

class ParameterExtractor {
  constructor() {
    this.intentService = new IntentService();
  }

  /**
   * Extrae parámetros del texto según la intención detectada
   */
  extract(text, intentId) {
    try {
      if (!text || !intentId) {
        return {};
      }

      const intent = this.intentService.getIntent(intentId);
      if (!intent) {
        return {};
      }

      const parameters = intent.parameters || {};
      const extractedParams = {};

      // Extraer cada parámetro definido en la intención
      Object.keys(parameters).forEach(paramName => {
        const paramConfig = parameters[paramName];
        const value = this.extractParameter(text, paramName, paramConfig, intentId);
        
        if (value !== null) {
          extractedParams[paramName] = value;
        } else if (paramConfig.required && paramConfig.default !== undefined) {
          extractedParams[paramName] = paramConfig.default;
        }
      });

      return extractedParams;

    } catch (error) {
      console.error('Error extrayendo parámetros:', error);
      return {};
    }
  }

  /**
   * Extrae un parámetro específico del texto
   */
  extractParameter(text, paramName, paramConfig, intentId) {
    const patterns = this.intentService.getIntentPatterns(intentId);
    
    // Buscar en patrones de la intención
    for (const pattern of patterns) {
      const extracted = this.extractFromPattern(text, pattern, paramName);
      if (extracted !== null) {
        return this.validateAndTransform(extracted, paramConfig);
      }
    }

    // Búsqueda por palabras clave
    const keywordValue = this.extractByKeywords(text, paramName, paramConfig);
    if (keywordValue !== null) {
      return keywordValue;
    }

    return null;
  }

  /**
   * Extrae parámetro de un patrón específico
   */
  extractFromPattern(text, pattern, paramName) {
    const paramRegex = new RegExp(`\\{${paramName}\\}`, 'g');
    const matches = pattern.match(paramRegex);
    
    if (!matches) {
      return null;
    }

    // Crear regex para extraer el valor del parámetro
    const patternRegex = pattern.replace(paramRegex, '(.+?)');
    const regex = new RegExp(patternRegex, 'i');
    const match = text.match(regex);

    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  }

  /**
   * Extrae parámetro por palabras clave
   */
  extractByKeywords(text, paramName, paramConfig) {
    const keywords = this.getParameterKeywords(paramName);
    const textLower = text.toLowerCase();

    for (const keyword of keywords) {
      const keywordIndex = textLower.indexOf(keyword.toLowerCase());
      if (keywordIndex !== -1) {
        // Extraer texto después de la palabra clave
        const afterKeyword = text.substring(keywordIndex + keyword.length);
        const words = afterKeyword.trim().split(/\s+/);
        
        if (words.length > 0) {
          return words[0];
        }
      }
    }

    return null;
  }

  /**
   * Obtiene palabras clave para un parámetro
   */
  getParameterKeywords(paramName) {
    const keywordMap = {
      'nombre_producto': ['producto', 'artículo', 'item', 'cosa', 'objeto'],
      'precio': ['precio', 'costo', 'valor', 'tarifa', 'cuánto cuesta'],
      'cantidad': ['cantidad', 'número', 'cuántos', 'cuántas'],
      'tema': ['tema', 'asunto', 'materia', 'sobre', 'acerca de'],
      'fecha': ['fecha', 'día', 'cuándo'],
      'ubicacion': ['ubicación', 'lugar', 'dónde', 'dirección']
    };

    return keywordMap[paramName] || [paramName];
  }

  /**
   * Valida y transforma el valor extraído según el tipo
   */
  validateAndTransform(value, paramConfig) {
    if (!value) {
      return null;
    }

    const type = paramConfig.type || 'string';

    switch (type) {
      case 'string':
        return this.validateString(value, paramConfig);
      
      case 'number':
        return this.validateNumber(value, paramConfig);
      
      case 'boolean':
        return this.validateBoolean(value, paramConfig);
      
      case 'date':
        return this.validateDate(value, paramConfig);
      
      default:
        return value;
    }
  }

  /**
   * Valida y transforma valor de tipo string
   */
  validateString(value, paramConfig) {
    let stringValue = String(value).trim();
    
    // Aplicar transformaciones si están definidas
    if (paramConfig.transform) {
      if (paramConfig.transform === 'lowercase') {
        stringValue = stringValue.toLowerCase();
      } else if (paramConfig.transform === 'uppercase') {
        stringValue = stringValue.toUpperCase();
      } else if (paramConfig.transform === 'capitalize') {
        stringValue = stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();
      }
    }

    // Validar longitud mínima y máxima
    if (paramConfig.minLength && stringValue.length < paramConfig.minLength) {
      return null;
    }
    
    if (paramConfig.maxLength && stringValue.length > paramConfig.maxLength) {
      stringValue = stringValue.substring(0, paramConfig.maxLength);
    }

    return stringValue;
  }

  /**
   * Valida y transforma valor de tipo number
   */
  validateNumber(value, paramConfig) {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return null;
    }

    // Validar rango
    if (paramConfig.min !== undefined && numValue < paramConfig.min) {
      return null;
    }
    
    if (paramConfig.max !== undefined && numValue > paramConfig.max) {
      return null;
    }

    return numValue;
  }

  /**
   * Valida y transforma valor de tipo boolean
   */
  validateBoolean(value, paramConfig) {
    const stringValue = String(value).toLowerCase();
    
    const trueValues = ['true', 'verdadero', 'sí', 'si', 'yes', '1', 'on'];
    const falseValues = ['false', 'falso', 'no', '0', 'off'];

    if (trueValues.includes(stringValue)) {
      return true;
    } else if (falseValues.includes(stringValue)) {
      return false;
    }

    return null;
  }

  /**
   * Valida y transforma valor de tipo date
   */
  validateDate(value, paramConfig) {
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      return null;
    }

    // Validar rango de fechas
    if (paramConfig.minDate) {
      const minDate = new Date(paramConfig.minDate);
      if (date < minDate) {
        return null;
      }
    }
    
    if (paramConfig.maxDate) {
      const maxDate = new Date(paramConfig.maxDate);
      if (date > maxDate) {
        return null;
      }
    }

    return date.toISOString();
  }

  /**
   * Extrae múltiples parámetros usando expresiones regulares
   */
  extractMultipleParameters(text, patterns) {
    const extracted = {};

    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.regex, 'gi');
      const matches = text.match(regex);

      if (matches) {
        matches.forEach(match => {
          const paramName = pattern.paramName;
          const value = match.replace(pattern.regex, '$1');
          extracted[paramName] = value;
        });
      }
    });

    return extracted;
  }

  /**
   * Extrae parámetros usando NLP básico
   */
  extractWithNLP(text, intentId) {
    const intent = this.intentService.getIntent(intentId);
    if (!intent) return {};

    const parameters = {};
    const words = text.toLowerCase().split(/\s+/);

    // Buscar entidades nombradas
    const entities = this.extractNamedEntities(text);
    entities.forEach(entity => {
      if (entity.type === 'PERSON') {
        parameters.nombre_persona = entity.text;
      } else if (entity.type === 'NUMBER') {
        parameters.cantidad = parseInt(entity.text);
      }
    });

    // Buscar palabras clave específicas
    Object.keys(intent.parameters || {}).forEach(paramName => {
      const keywords = this.getParameterKeywords(paramName);
      const foundKeyword = keywords.find(keyword => 
        words.includes(keyword.toLowerCase())
      );

      if (foundKeyword) {
        const keywordIndex = words.indexOf(foundKeyword.toLowerCase());
        if (keywordIndex < words.length - 1) {
          parameters[paramName] = words[keywordIndex + 1];
        }
      }
    });

    return parameters;
  }

  /**
   * Extrae entidades nombradas básicas
   */
  extractNamedEntities(text) {
    const entities = [];

    // Detectar nombres propios
    const namePattern = /\b[A-Z][a-z]+\b/g;
    let match;
    while ((match = namePattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'PERSON',
        position: match.index
      });
    }

    // Detectar números
    const numberPattern = /\b\d+\b/g;
    while ((match = numberPattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'NUMBER',
        position: match.index
      });
    }

    return entities;
  }
}

module.exports = ParameterExtractor; 