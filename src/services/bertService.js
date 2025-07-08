const tf = require('@tensorflow/tfjs-node');
const { HfInference } = require('@huggingface/inference');
const path = require('path');

class BertService {
  constructor() {
    this.model = null;
    this.tokenizer = null;
    this.isModelLoaded = false;
    this.hfInference = new HfInference(process.env.HUGGINGFACE_API_KEY);
    
    // Configuración del modelo
    this.modelPath = path.join(__dirname, '../../models/bert-model');
    this.modelName = process.env.BERT_MODEL_NAME || 'bert-base-multilingual-cased';
    
    this.loadModel();
  }

  /**
   * Carga el modelo BERT
   */
  async loadModel() {
    try {
      console.log('🔄 Cargando modelo BERT...');
      
      // Intentar cargar modelo local primero
      try {
        this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
        this.isModelLoaded = true;
        console.log('✅ Modelo BERT cargado desde archivo local');
      } catch (localError) {
        console.log('⚠️ No se pudo cargar modelo local, usando Hugging Face...');
        this.isModelLoaded = false;
      }
      
    } catch (error) {
      console.error('❌ Error cargando modelo BERT:', error);
      this.isModelLoaded = false;
    }
  }

  /**
   * Clasifica la intención del texto usando BERT
   */
  async classifyIntent(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Texto de entrada inválido');
      }

      // Si el modelo local no está disponible, usar Hugging Face
      if (!this.isModelLoaded) {
        return await this.classifyWithHuggingFace(text);
      }

      // Usar modelo local
      return await this.classifyWithLocalModel(text);

    } catch (error) {
      console.error('Error en classifyIntent:', error);
      return {
        intent: 'none',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Clasificación usando Hugging Face API
   */
  async classifyWithHuggingFace(text) {
    try {
      // Usar un modelo de clasificación de texto de Hugging Face
      const result = await this.hfInference.textClassification({
        model: 'facebook/bart-large-mnli', // Modelo para clasificación de texto
        inputs: text,
        parameters: {
          candidate_labels: this.getIntentLabels()
        }
      });

      const bestMatch = result[0];
      
      return {
        intent: bestMatch.label,
        confidence: bestMatch.score,
        method: 'huggingface'
      };

    } catch (error) {
      console.error('Error con Hugging Face:', error);
      return {
        intent: 'none',
        confidence: 0,
        method: 'huggingface_error'
      };
    }
  }

  /**
   * Clasificación usando modelo local
   */
  async classifyWithLocalModel(text) {
    try {
      // Tokenización del texto
      const tokens = await this.tokenizeText(text);
      
      // Predicción
      const prediction = await this.model.predict(tokens);
      const scores = await prediction.array();
      
      // Obtener la intención con mayor probabilidad
      const maxIndex = scores[0].indexOf(Math.max(...scores[0]));
      const intentLabels = this.getIntentLabels();
      
      return {
        intent: intentLabels[maxIndex] || 'none',
        confidence: scores[0][maxIndex],
        method: 'local_model'
      };

    } catch (error) {
      console.error('Error con modelo local:', error);
      return {
        intent: 'none',
        confidence: 0,
        method: 'local_model_error'
      };
    }
  }

  /**
   * Tokeniza el texto para el modelo BERT
   */
  async tokenizeText(text) {
    // Implementación básica de tokenización
    // En producción, usar el tokenizer específico del modelo
    const words = text.toLowerCase().split(/\s+/);
    const tokenIds = words.map(word => this.wordToId(word));
    
    return tf.tensor2d([tokenIds], [1, tokenIds.length]);
  }

  /**
   * Convierte palabra a ID (implementación simplificada)
   */
  wordToId(word) {
    // Implementación básica - en producción usar vocabulario real
    const vocabulary = {
      'buscar': 1, 'encontrar': 2, 'producto': 3, 'laptop': 4, 'computadora': 5,
      'precio': 6, 'costo': 7, 'comprar': 8, 'vender': 9, 'ayuda': 10
    };
    
    return vocabulary[word] || 0;
  }

  /**
   * Obtiene las etiquetas de intenciones disponibles
   */
  getIntentLabels() {
    return [
      'BUSQUEDA',
      'COMPRA',
      'VENTA',
      'AYUDA',
      'SALUDO',
      'DESPEDIDA'
    ];
  }

  /**
   * Entrena el modelo con nuevos datos
   */
  async trainModel(trainingData) {
    try {
      console.log('🔄 Iniciando entrenamiento del modelo...');
      
      // Preparar datos de entrenamiento
      const { inputs, labels } = this.prepareTrainingData(trainingData);
      
      // Crear modelo simple para demostración
      const model = tf.sequential({
        layers: [
          tf.layers.embedding({
            inputDim: 1000,
            outputDim: 16,
            inputLength: 10
          }),
          tf.layers.globalAveragePooling1d(),
          tf.layers.dense({ units: 24, activation: 'relu' }),
          tf.layers.dense({ units: this.getIntentLabels().length, activation: 'softmax' })
        ]
      });

      model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // Entrenar modelo
      const history = await model.fit(inputs, labels, {
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 1
      });

      // Guardar modelo
      await model.save(`file://${this.modelPath}`);
      this.model = model;
      this.isModelLoaded = true;

      console.log('✅ Entrenamiento completado');
      
      return {
        accuracy: history.history.accuracy[history.history.accuracy.length - 1],
        loss: history.history.loss[history.history.loss.length - 1],
        epochs: 10
      };

    } catch (error) {
      console.error('Error en trainModel:', error);
      throw error;
    }
  }

  /**
   * Prepara datos de entrenamiento
   */
  prepareTrainingData(trainingData) {
    const intentLabels = this.getIntentLabels();
    const inputs = [];
    const labels = [];

    trainingData.forEach(item => {
      // Tokenizar texto
      const tokens = this.tokenizeText(item.text);
      inputs.push(tokens);

      // Crear etiqueta one-hot
      const labelIndex = intentLabels.indexOf(item.intent);
      const label = new Array(intentLabels.length).fill(0);
      if (labelIndex !== -1) {
        label[labelIndex] = 1;
      }
      labels.push(label);
    });

    return {
      inputs: tf.tensor2d(inputs),
      labels: tf.tensor2d(labels)
    };
  }

  /**
   * Obtiene el estado del modelo
   */
  async getModelStatus() {
    return {
      isLoaded: this.isModelLoaded,
      modelPath: this.modelPath,
      modelName: this.modelName,
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = BertService; 