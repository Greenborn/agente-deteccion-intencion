const Joi = require('joi');

/**
 * Esquema de validación para la petición de detección de intención
 */
const detectIntentSchema = Joi.object({
  text: Joi.string().trim().min(1).max(1000).required()
    .description('Texto de entrada para analizar'),
  options: Joi.object({
    confidence_threshold: Joi.number().min(0).max(1).default(0.8)
      .description('Umbral mínimo de confianza'),
    include_alternatives: Joi.boolean().default(false)
      .description('Incluir intenciones alternativas'),
    max_alternatives: Joi.number().integer().min(1).max(10).default(3)
      .description('Número máximo de alternativas'),
    language: Joi.string().valid('es', 'en', 'auto').default('auto')
      .description('Idioma del texto'),
    context: Joi.object().optional()
      .description('Contexto adicional para la detección')
  }).optional()
});

/**
 * Esquema de validación para la petición de entrenamiento
 */
const trainSchema = Joi.object({
  intents: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    patterns: Joi.array().items(Joi.string()).min(1).required(),
    parameters: Joi.object().optional(),
    examples: Joi.array().items(Joi.string()).optional()
  })).min(1).required(),
  options: Joi.object({
    epochs: Joi.number().integer().min(1).max(100).default(10),
    batch_size: Joi.number().integer().min(1).max(128).default(32),
    learning_rate: Joi.number().positive().default(0.001),
    validation_split: Joi.number().min(0).max(1).default(0.2)
  }).optional()
});

/**
 * Esquema de validación para la petición de evaluación
 */
const evaluateSchema = Joi.object({
  test_data: Joi.array().items(Joi.object({
    text: Joi.string().required(),
    expected_intent: Joi.string().required(),
    expected_parameters: Joi.object().optional()
  })).min(1).required(),
  options: Joi.object({
    detailed: Joi.boolean().default(false),
    include_confusion_matrix: Joi.boolean().default(false)
  }).optional()
});

/**
 * Middleware de validación genérico
 * @param {Object} schema - Esquema Joi para validar
 * @returns {Function} - Middleware de Express
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Los datos de entrada no son válidos',
        details: errors
      });
    }

    // Reemplazar req.body con los datos validados
    req.body = value;
    next();
  };
};

/**
 * Middleware de validación para parámetros de consulta
 * @param {Object} schema - Esquema Joi para validar
 * @returns {Function} - Middleware de Express
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Los parámetros de consulta no son válidos',
        details: errors
      });
    }

    // Reemplazar req.query con los datos validados
    req.query = value;
    next();
  };
};

/**
 * Middleware de validación para parámetros de ruta
 * @param {Object} schema - Esquema Joi para validar
 * @returns {Function} - Middleware de Express
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Los parámetros de ruta no son válidos',
        details: errors
      });
    }

    // Reemplazar req.params con los datos validados
    req.params = value;
    next();
  };
};

/**
 * Middleware para validar el tipo de contenido
 * @param {string} contentType - Tipo de contenido esperado
 * @returns {Function} - Middleware de Express
 */
const validateContentType = (contentType = 'application/json') => {
  return (req, res, next) => {
    if (!req.is(contentType)) {
      return res.status(415).json({
        success: false,
        error: 'UNSUPPORTED_MEDIA_TYPE',
        message: `Se requiere contenido de tipo ${contentType}`,
        received: req.get('Content-Type')
      });
    }
    next();
  };
};

/**
 * Middleware para validar el tamaño del cuerpo de la petición
 * @param {number} maxSize - Tamaño máximo en bytes
 * @returns {Function} - Middleware de Express
 */
const validateBodySize = (maxSize = 1024 * 1024) => { // 1MB por defecto
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'PAYLOAD_TOO_LARGE',
        message: `El tamaño del cuerpo excede el límite de ${maxSize} bytes`,
        received: contentLength,
        limit: maxSize
      });
    }
    next();
  };
};

/**
 * Middleware para sanitizar texto de entrada
 * @returns {Function} - Middleware de Express
 */
const sanitizeText = () => {
  return (req, res, next) => {
    if (req.body && req.body.text) {
      // Eliminar caracteres de control excepto saltos de línea y tabulaciones
      req.body.text = req.body.text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      
      // Normalizar espacios múltiples
      req.body.text = req.body.text.replace(/\s+/g, ' ');
      
      // Eliminar espacios al inicio y final
      req.body.text = req.body.text.trim();
      
      // Verificar que el texto no esté vacío después de la sanitización
      if (!req.body.text) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_TEXT',
          message: 'El texto de entrada no puede estar vacío después de la sanitización'
        });
      }
    }
    next();
  };
};

/**
 * Middleware para validar límites de rate limiting
 * @param {Object} options - Opciones de rate limiting
 * @returns {Function} - Middleware de Express
 */
const validateRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos
    max = 100, // máximo 100 peticiones por ventana
    message = 'Demasiadas peticiones desde esta IP'
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpiar peticiones antiguas
    if (requests.has(ip)) {
      requests.set(ip, requests.get(ip).filter(timestamp => timestamp > windowStart));
    } else {
      requests.set(ip, []);
    }

    const currentRequests = requests.get(ip);

    if (currentRequests.length >= max) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    currentRequests.push(now);
    next();
  };
};

// Middlewares específicos predefinidos
const validateDetectIntent = validate(detectIntentSchema);
const validateTrain = validate(trainSchema);
const validateEvaluate = validate(evaluateSchema);

// Esquema para parámetros de consulta comunes
const commonQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
  sort: Joi.string().valid('asc', 'desc').default('desc'),
  filter: Joi.string().optional()
});

const validateCommonQuery = validateQuery(commonQuerySchema);

module.exports = {
  validate,
  validateQuery,
  validateParams,
  validateContentType,
  validateBodySize,
  sanitizeText,
  validateRateLimit,
  validateDetectIntent,
  validateTrain,
  validateEvaluate,
  validateCommonQuery,
  schemas: {
    detectIntent: detectIntentSchema,
    train: trainSchema,
    evaluate: evaluateSchema,
    commonQuery: commonQuerySchema
  }
}; 