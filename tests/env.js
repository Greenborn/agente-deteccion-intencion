// Variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.BERT_MODEL_PATH = './models/bert-model/test-model';
process.env.BERT_MAX_LENGTH = '128';
process.env.BERT_BATCH_SIZE = '8';
process.env.BERT_LEARNING_RATE = '2e-5';
process.env.BERT_EPOCHS = '1';
process.env.LOG_LEVEL = 'error';
process.env.CORS_ORIGIN = '*';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '1000'; 