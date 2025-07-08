const Joi = require('joi');

/**
 * Esquema de validación para un parámetro
 */
const parameterSchema = Joi.object({
  name: Joi.string().required().description('Nombre del parámetro'),
  value: Joi.any().required().description('Valor del parámetro'),
  type: Joi.string().valid('string', 'number', 'boolean', 'date', 'array', 'object').required().description('Tipo de dato'),
  confidence: Joi.number().min(0).max(1).default(1.0).description('Confianza en la extracción'),
  source: Joi.string().valid('pattern', 'bert', 'manual').default('pattern').description('Fuente de extracción'),
  position: Joi.object({
    start: Joi.number().integer().min(0).optional(),
    end: Joi.number().integer().min(0).optional()
  }).optional().description('Posición en el texto original'),
  metadata: Joi.object().default({}).description('Metadatos adicionales')
});

/**
 * Esquema de validación para una lista de parámetros
 */
const parameterListSchema = Joi.object().pattern(
  Joi.string(),
  Joi.object({
    value: Joi.any().required(),
    type: Joi.string().valid('string', 'number', 'boolean', 'date', 'array', 'object').required(),
    confidence: Joi.number().min(0).max(1).default(1.0),
    source: Joi.string().valid('pattern', 'bert', 'manual').default('pattern'),
    position: Joi.object({
      start: Joi.number().integer().min(0).optional(),
      end: Joi.number().integer().min(0).optional()
    }).optional(),
    metadata: Joi.object().default({})
  })
);

/**
 * Clase para representar un parámetro extraído
 */
class Parameter {
  constructor(data) {
    const { error, value } = parameterSchema.validate(data);
    if (error) {
      throw new Error(`Datos de parámetro inválidos: ${error.message}`);
    }
    
    Object.assign(this, value);
  }

  /**
   * Convierte el parámetro a su tipo nativo
   * @returns {*} - Valor convertido
   */
  getTypedValue() {
    switch (this.type) {
      case 'string':
        return String(this.value);
      case 'number':
        return Number(this.value);
      case 'boolean':
        return this.parseBoolean(this.value);
      case 'date':
        return new Date(this.value);
      case 'array':
        return Array.isArray(this.value) ? this.value : [this.value];
      case 'object':
        return typeof this.value === 'object' ? this.value : JSON.parse(this.value);
      default:
        return this.value;
    }
  }

  /**
   * Parsea un valor booleano
   * @param {*} value - Valor a parsear
   * @returns {boolean} - Valor booleano
   */
  parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      return ['true', '1', 'yes', 'si', 'sí'].includes(lowerValue);
    }
    if (typeof value === 'number') return value !== 0;
    return Boolean(value);
  }

  /**
   * Valida si el parámetro cumple con un esquema específico
   * @param {Object} schema - Esquema de validación
   * @returns {Object} - Resultado de validación
   */
  validate(schema) {
    try {
      const { error } = schema.validate(this.getTypedValue());
      return {
        isValid: !error,
        error: error ? error.message : null
      };
    } catch (err) {
      return {
        isValid: false,
        error: err.message
      };
    }
  }

  /**
   * Convierte el parámetro a formato JSON
   * @returns {Object} - Representación JSON
   */
  toJSON() {
    return {
      name: this.name,
      value: this.value,
      type: this.type,
      confidence: this.confidence,
      source: this.source,
      position: this.position,
      metadata: this.metadata,
      typedValue: this.getTypedValue()
    };
  }

  /**
   * Crea un parámetro desde un valor simple
   * @param {string} name - Nombre del parámetro
   * @param {*} value - Valor del parámetro
   * @param {Object} options - Opciones adicionales
   * @returns {Parameter} - Instancia de parámetro
   */
  static fromValue(name, value, options = {}) {
    const type = options.type || Parameter.inferType(value);
    const confidence = options.confidence || 1.0;
    const source = options.source || 'manual';
    const position = options.position;
    const metadata = options.metadata || {};

    return new Parameter({
      name,
      value,
      type,
      confidence,
      source,
      position,
      metadata
    });
  }

  /**
   * Infiere el tipo de un valor
   * @param {*} value - Valor a analizar
   * @returns {string} - Tipo inferido
   */
  static inferType(value) {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    return 'string';
  }
}

/**
 * Clase para gestionar una lista de parámetros
 */
class ParameterList {
  constructor() {
    this.parameters = new Map();
  }

  /**
   * Añade un parámetro a la lista
   * @param {Parameter|Object} parameter - Parámetro a añadir
   */
  add(parameter) {
    if (parameter instanceof Parameter) {
      this.parameters.set(parameter.name, parameter);
    } else {
      const param = new Parameter(parameter);
      this.parameters.set(param.name, param);
    }
  }

  /**
   * Obtiene un parámetro por nombre
   * @param {string} name - Nombre del parámetro
   * @returns {Parameter|undefined} - Parámetro encontrado
   */
  get(name) {
    return this.parameters.get(name);
  }

  /**
   * Obtiene el valor de un parámetro
   * @param {string} name - Nombre del parámetro
   * @param {*} defaultValue - Valor por defecto si no existe
   * @returns {*} - Valor del parámetro
   */
  getValue(name, defaultValue = undefined) {
    const param = this.get(name);
    return param ? param.getTypedValue() : defaultValue;
  }

  /**
   * Verifica si existe un parámetro
   * @param {string} name - Nombre del parámetro
   * @returns {boolean} - True si existe
   */
  has(name) {
    return this.parameters.has(name);
  }

  /**
   * Elimina un parámetro
   * @param {string} name - Nombre del parámetro
   * @returns {boolean} - True si se eliminó
   */
  remove(name) {
    return this.parameters.delete(name);
  }

  /**
   * Obtiene todos los parámetros como objeto plano
   * @returns {Object} - Objeto con parámetros
   */
  toObject() {
    const result = {};
    for (const [name, param] of this.parameters) {
      result[name] = param.getTypedValue();
    }
    return result;
  }

  /**
   * Obtiene todos los parámetros con metadatos
   * @returns {Object} - Objeto con parámetros y metadatos
   */
  toDetailedObject() {
    const result = {};
    for (const [name, param] of this.parameters) {
      result[name] = param.toJSON();
    }
    return result;
  }

  /**
   * Filtra parámetros por criterios
   * @param {Function} filterFn - Función de filtrado
   * @returns {ParameterList} - Nueva lista filtrada
   */
  filter(filterFn) {
    const filtered = new ParameterList();
    for (const [name, param] of this.parameters) {
      if (filterFn(param, name)) {
        filtered.add(param);
      }
    }
    return filtered;
  }

  /**
   * Obtiene parámetros por tipo
   * @param {string} type - Tipo de parámetro
   * @returns {ParameterList} - Lista filtrada
   */
  getByType(type) {
    return this.filter(param => param.type === type);
  }

  /**
   * Obtiene parámetros por fuente
   * @param {string} source - Fuente de extracción
   * @returns {ParameterList} - Lista filtrada
   */
  getBySource(source) {
    return this.filter(param => param.source === source);
  }

  /**
   * Obtiene parámetros con confianza mínima
   * @param {number} minConfidence - Confianza mínima
   * @returns {ParameterList} - Lista filtrada
   */
  getByConfidence(minConfidence) {
    return this.filter(param => param.confidence >= minConfidence);
  }

  /**
   * Convierte la lista a formato JSON
   * @returns {Object} - Representación JSON
   */
  toJSON() {
    return this.toDetailedObject();
  }

  /**
   * Obtiene el número de parámetros
   * @returns {number} - Cantidad de parámetros
   */
  get size() {
    return this.parameters.size;
  }

  /**
   * Obtiene todos los nombres de parámetros
   * @returns {Array} - Array de nombres
   */
  get names() {
    return Array.from(this.parameters.keys());
  }

  /**
   * Obtiene todos los valores de parámetros
   * @returns {Array} - Array de valores
   */
  get values() {
    return Array.from(this.parameters.values()).map(param => param.getTypedValue());
  }
}

module.exports = {
  Parameter,
  ParameterList,
  parameterSchema,
  parameterListSchema
}; 