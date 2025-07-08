const Joi = require('joi');

/**
 * Esquema de validación para una intención
 */
const intentSchema = Joi.object({
  id: Joi.string().required().description('Identificador único de la intención'),
  name: Joi.string().required().description('Nombre descriptivo de la intención'),
  description: Joi.string().optional().description('Descripción de la intención'),
  patterns: Joi.array().items(Joi.string()).min(1).required().description('Patrones de texto para detectar la intención'),
  parameters: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      type: Joi.string().valid('string', 'number', 'boolean', 'date').required(),
      required: Joi.boolean().default(false),
      description: Joi.string().optional(),
      validation: Joi.object().optional()
    })
  ).default({}).description('Parámetros que se pueden extraer de esta intención'),
  confidence: Joi.number().min(0).max(1).default(0.8).description('Umbral de confianza mínimo'),
  priority: Joi.number().integer().min(1).default(1).description('Prioridad de la intención (menor = mayor prioridad)')
});

/**
 * Esquema de validación para la respuesta de detección de intención
 */
const intentResponseSchema = Joi.object({
  command: Joi.string().required().description('ID de la intención detectada o "none"'),
  confidence: Joi.number().min(0).max(1).required().description('Nivel de confianza de la detección'),
  params_list: Joi.object().default({}).description('Parámetros extraídos del texto'),
  original_text: Joi.string().required().description('Texto original de entrada'),
  processing_time: Joi.number().positive().optional().description('Tiempo de procesamiento en ms'),
  matched_pattern: Joi.string().optional().description('Patrón que coincidió'),
  alternatives: Joi.array().items(Joi.object({
    command: Joi.string().required(),
    confidence: Joi.number().min(0).max(1).required()
  })).optional().description('Intenciones alternativas con menor confianza')
});

/**
 * Clase para representar una intención
 */
class Intent {
  constructor(data) {
    const { error, value } = intentSchema.validate(data);
    if (error) {
      throw new Error(`Datos de intención inválidos: ${error.message}`);
    }
    
    Object.assign(this, value);
  }

  /**
   * Valida si un texto coincide con algún patrón de esta intención
   * @param {string} text - Texto a validar
   * @returns {boolean} - True si coincide
   */
  matchesPattern(text) {
    const normalizedText = text.toLowerCase().trim();
    return this.patterns.some(pattern => {
      const normalizedPattern = pattern.toLowerCase().trim();
      return normalizedText.includes(normalizedPattern.replace(/\{[^}]+\}/g, ''));
    });
  }

  /**
   * Extrae parámetros del texto según los patrones
   * @param {string} text - Texto de entrada
   * @returns {Object} - Parámetros extraídos
   */
  extractParameters(text) {
    const params = {};
    const normalizedText = text.toLowerCase().trim();

    for (const pattern of this.patterns) {
      const patternRegex = this.createPatternRegex(pattern);
      const match = normalizedText.match(patternRegex);
      
      if (match) {
        // Extraer parámetros del patrón
        const paramNames = this.getParameterNames(pattern);
        paramNames.forEach((paramName, index) => {
          if (match[index + 1]) {
            params[paramName] = match[index + 1].trim();
          }
        });
        break;
      }
    }

    return params;
  }

  /**
   * Crea una expresión regular a partir de un patrón
   * @param {string} pattern - Patrón con parámetros {param}
   * @returns {RegExp} - Expresión regular
   */
  createPatternRegex(pattern) {
    const regexPattern = pattern
      .replace(/\{[^}]+\}/g, '([^\\s]+)') // Reemplaza {param} con grupo de captura
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapa caracteres especiales
    
    return new RegExp(regexPattern, 'i');
  }

  /**
   * Extrae nombres de parámetros de un patrón
   * @param {string} pattern - Patrón con parámetros {param}
   * @returns {Array} - Array de nombres de parámetros
   */
  getParameterNames(pattern) {
    const matches = pattern.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  }

  /**
   * Valida los parámetros extraídos
   * @param {Object} params - Parámetros a validar
   * @returns {Object} - Resultado de validación
   */
  validateParameters(params) {
    const errors = [];
    const validParams = {};

    for (const [paramName, paramConfig] of Object.entries(this.parameters)) {
      const value = params[paramName];

      if (paramConfig.required && !value) {
        errors.push(`Parámetro requerido '${paramName}' no encontrado`);
        continue;
      }

      if (value) {
        // Validar tipo
        const isValid = this.validateParameterType(value, paramConfig.type);
        if (!isValid) {
          errors.push(`Parámetro '${paramName}' debe ser de tipo ${paramConfig.type}`);
          continue;
        }

        validParams[paramName] = value;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      params: validParams
    };
  }

  /**
   * Valida el tipo de un parámetro
   * @param {*} value - Valor a validar
   * @param {string} type - Tipo esperado
   * @returns {boolean} - True si es válido
   */
  validateParameterType(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return !isNaN(Number(value));
      case 'boolean':
        return ['true', 'false', '1', '0'].includes(value.toLowerCase());
      case 'date':
        return !isNaN(Date.parse(value));
      default:
        return true;
    }
  }
}

module.exports = {
  Intent,
  intentSchema,
  intentResponseSchema
}; 