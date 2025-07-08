/**
 * Configuración del modelo BERT y parámetros de procesamiento
 */

module.exports = {
  // Configuración del modelo
  MODEL: {
    name: process.env.BERT_MODEL_NAME || 'bert-base-multilingual-cased',
    localPath: './models/bert-model',
    maxLength: 512,
    batchSize: 32
  },

  // Configuración de Hugging Face
  HUGGINGFACE: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
    baseUrl: 'https://api-inference.huggingface.co/models',
    timeout: 30000,
    retryAttempts: 3
  },

  // Configuración de entrenamiento
  TRAINING: {
    epochs: 10,
    learningRate: 0.001,
    validationSplit: 0.2,
    earlyStoppingPatience: 3,
    saveBestModel: true
  },

  // Configuración de tokenización
  TOKENIZATION: {
    maxLength: 128,
    padding: 'max_length',
    truncation: true,
    returnAttentionMask: true,
    returnTokenTypeIds: false
  },

  // Configuración de clasificación
  CLASSIFICATION: {
    confidenceThreshold: 0.5,
    maxCandidates: 3,
    useSoftmax: true
  },

  // Configuración de caché
  CACHE: {
    enabled: true,
    maxSize: 1000,
    ttl: 3600000 // 1 hora en milisegundos
  },

  // Configuración de logging
  LOGGING: {
    level: process.env.LOG_LEVEL || 'info',
    enableModelLogs: true,
    enablePerformanceLogs: true
  }
}; 