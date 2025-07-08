// Configuración global para tests
require('dotenv').config({ path: '.env.test' });

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.BERT_MODEL_PATH = './models/bert-model/test-model';

// Mock de console para tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Mock de TensorFlow para tests
jest.mock('@tensorflow/tfjs-node', () => ({
  loadLayersModel: jest.fn(),
  tensor: jest.fn(),
  tidy: jest.fn(),
  ready: jest.fn()
}));

// Mock de Hugging Face para tests
jest.mock('@huggingface/inference', () => ({
  HfInference: jest.fn().mockImplementation(() => ({
    textClassification: jest.fn(),
    featureExtraction: jest.fn()
  }))
}));

// Configurar timeouts
jest.setTimeout(30000);

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Configurar variables globales de test
global.testUtils = {
  // Función para crear datos de prueba
  createTestIntent: (overrides = {}) => ({
    id: 'TEST_INTENT',
    name: 'Test Intent',
    patterns: ['test {param}'],
    parameters: {
      param: { type: 'string', required: true }
    },
    confidence: 0.8,
    priority: 1,
    ...overrides
  }),

  // Función para crear datos de entrenamiento
  createTrainingData: (count = 5) => {
    return Array(count).fill().map((_, i) => ({
      text: `test text ${i}`,
      intent: 'TEST_INTENT',
      parameters: { param: `value${i}` },
      confidence: 0.8 + (i * 0.02)
    }));
  },

  // Función para esperar
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Función para crear request mock
  createRequestMock: (body = {}, params = {}, query = {}) => ({
    body,
    params,
    query,
    headers: {},
    get: jest.fn(),
    ip: '127.0.0.1'
  }),

  // Función para crear response mock
  createResponseMock: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  }
}; 