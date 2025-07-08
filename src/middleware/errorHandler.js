/**
 * Clase personalizada para errores de la aplicación
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores específicos de la aplicación
 */
class IntentDetectionError extends AppError {
  constructor(message, details = null) {
    super(message, 422, 'INTENT_DETECTION_ERROR', details);
  }
}

class BertServiceError extends AppError {
  constructor(message, details = null) {
    super(message, 503, 'BERT_SERVICE_ERROR', details);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class ConfigurationError extends AppError {
  constructor(message, details = null) {
    super(message, 500, 'CONFIGURATION_ERROR', details);
  }
}

/**
 * Mapa de códigos de error HTTP a mensajes amigables
 */
const errorMessages = {
  400: 'Solicitud incorrecta',
  401: 'No autorizado',
  403: 'Acceso prohibido',
  404: 'Recurso no encontrado',
  405: 'Método no permitido',
  408: 'Tiempo de espera agotado',
  409: 'Conflicto',
  413: 'Cuerpo de petición demasiado grande',
  415: 'Tipo de contenido no soportado',
  422: 'Entidad no procesable',
  429: 'Demasiadas peticiones',
  500: 'Error interno del servidor',
  502: 'Puerta de enlace incorrecta',
  503: 'Servicio no disponible',
  504: 'Tiempo de espera de puerta de enlace agotado'
};

/**
 * Middleware de manejo de errores principal
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error para debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Error de validación de Joi
  if (err.isJoi) {
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));

    error = new ValidationError('Los datos de entrada no son válidos', details);
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new ValidationError('JSON inválido en el cuerpo de la petición');
  }

  // Error de límite de tamaño
  if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new AppError('Archivo demasiado grande', 413, 'FILE_TOO_LARGE');
  }

  // Error de conexión a base de datos
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    error = new AppError('Error de conexión al servicio', 503, 'SERVICE_UNAVAILABLE');
  }

  // Error de timeout
  if (err.code === 'ETIMEDOUT') {
    error = new AppError('Tiempo de espera agotado', 408, 'TIMEOUT');
  }

  // Error de memoria
  if (err.code === 'ENOMEM') {
    error = new AppError('Error de memoria del servidor', 500, 'MEMORY_ERROR');
  }

  // Error de TensorFlow
  if (err.message && err.message.includes('TensorFlow')) {
    error = new BertServiceError('Error en el modelo de IA', {
      originalError: err.message
    });
  }

  // Error de Hugging Face
  if (err.message && err.message.includes('HuggingFace')) {
    error = new BertServiceError('Error en el servicio de IA', {
      originalError: err.message
    });
  }

  // Determinar el código de estado
  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'INTERNAL_ERROR';
  const message = error.message || errorMessages[statusCode] || 'Error interno del servidor';

  // Construir respuesta de error
  const errorResponse = {
    success: false,
    error: errorCode,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Añadir detalles si existen
  if (error.details) {
    errorResponse.details = error.details;
  }

  // Añadir stack trace solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.originalError = {
      message: err.message,
      name: err.name,
      code: err.code
    };
  }

  // Añadir request ID si existe
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Ruta no encontrada: ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Middleware para manejar métodos HTTP no permitidos
 */
const methodNotAllowedHandler = (req, res, next) => {
  const error = new AppError(
    `Método ${req.method} no permitido para ${req.originalUrl}`,
    405,
    'METHOD_NOT_ALLOWED',
    {
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      receivedMethod: req.method
    }
  );
  next(error);
};

/**
 * Middleware para capturar errores asíncronos
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para validar que el servicio esté listo
 */
const serviceReadyHandler = (req, res, next) => {
  // Verificar que el modelo BERT esté cargado
  if (!req.app.locals.bertService || !req.app.locals.bertService.isReady()) {
    const error = new BertServiceError(
      'El servicio de IA no está listo',
      { status: 'initializing' }
    );
    return next(error);
  }
  next();
};

/**
 * Middleware para manejar errores de timeout
 */
const timeoutHandler = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      const error = new AppError(
        'Tiempo de espera agotado',
        408,
        'REQUEST_TIMEOUT',
        { timeout: timeoutMs }
      );
      next(error);
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Middleware para logging de errores
 */
const errorLogger = (err, req, res, next) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      errorCode: err.errorCode
    },
    requestBody: req.body,
    requestQuery: req.query,
    requestParams: req.params
  };

  // Log según el nivel de error
  if (err.statusCode >= 500) {
    console.error('ERROR CRÍTICO:', JSON.stringify(logData, null, 2));
  } else if (err.statusCode >= 400) {
    console.warn('ERROR CLIENTE:', JSON.stringify(logData, null, 2));
  } else {
    console.info('ERROR INFORMATIVO:', JSON.stringify(logData, null, 2));
  }

  next(err);
};

/**
 * Middleware para manejo de errores de CORS
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    const error = new AppError(
      'Error de CORS',
      403,
      'CORS_ERROR',
      { origin: req.get('Origin') }
    );
    return next(error);
  }
  next(err);
};

/**
 * Función para crear errores personalizados
 */
const createError = (message, statusCode = 500, errorCode = null, details = null) => {
  return new AppError(message, statusCode, errorCode, details);
};

module.exports = {
  AppError,
  IntentDetectionError,
  BertServiceError,
  ValidationError,
  ConfigurationError,
  errorHandler,
  notFoundHandler,
  methodNotAllowedHandler,
  asyncErrorHandler,
  serviceReadyHandler,
  timeoutHandler,
  errorLogger,
  corsErrorHandler,
  createError,
  errorMessages
}; 