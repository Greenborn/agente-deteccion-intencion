const BertService = require('../services/bertService');
const IntentService = require('../services/intentService');
const ParameterExtractor = require('../utils/parameterExtractor');
const TextProcessor = require('../utils/textProcessor');

class IntentController {
  constructor() {
    this.bertService = new BertService();
    this.intentService = new IntentService();
    this.parameterExtractor = new ParameterExtractor();
    this.textProcessor = new TextProcessor();
  }

  /**
   * Detecta intención y extrae parámetros del texto de entrada
   */
  async detectIntent(req, res) {
    try {
      const { text } = req.body;

      // Preprocesamiento del texto
      const processedText = this.textProcessor.process(text);

      // Clasificación de intención usando BERT
      const intentClassification = await this.bertService.classifyIntent(processedText);

      // Si no se detecta intención, retornar "none"
      if (!intentClassification.intent || intentClassification.confidence < 0.5) {
        return res.json({
          command: 'none',
          params_list: {},
          confidence: intentClassification.confidence || 0
        });
      }

      // Extraer parámetros según la intención detectada
      const parameters = this.parameterExtractor.extract(
        processedText,
        intentClassification.intent
      );

      // Formatear respuesta
      const response = {
        command: intentClassification.intent,
        params_list: parameters,
        confidence: intentClassification.confidence
      };

      res.json(response);

    } catch (error) {
      console.error('Error en detectIntent:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtiene lista de intenciones disponibles
   */
  async getIntents(req, res) {
    try {
      const intents = this.intentService.getAvailableIntents();
      res.json({
        intents,
        total: intents.length
      });
    } catch (error) {
      console.error('Error en getIntents:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Entrena el modelo con nuevos datos
   */
  async trainModel(req, res) {
    try {
      const { trainingData } = req.body;

      if (!trainingData || !Array.isArray(trainingData)) {
        return res.status(400).json({
          error: 'Datos de entrenamiento inválidos',
          message: 'Se requiere un array de datos de entrenamiento'
        });
      }

      // Validar estructura de datos de entrenamiento
      const isValidData = trainingData.every(item => 
        item.text && item.intent && typeof item.text === 'string' && typeof item.intent === 'string'
      );

      if (!isValidData) {
        return res.status(400).json({
          error: 'Formato de datos inválido',
          message: 'Cada elemento debe tener propiedades "text" e "intent"'
        });
      }

      // Iniciar entrenamiento
      const trainingResult = await this.bertService.trainModel(trainingData);

      res.json({
        message: 'Entrenamiento completado exitosamente',
        result: trainingResult
      });

    } catch (error) {
      console.error('Error en trainModel:', error);
      res.status(500).json({
        error: 'Error durante el entrenamiento',
        message: error.message
      });
    }
  }

  /**
   * Obtiene el estado del modelo y servicio
   */
  async getStatus(req, res) {
    try {
      const modelStatus = await this.bertService.getModelStatus();
      const serviceStatus = {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        model: modelStatus
      };

      res.json(serviceStatus);
    } catch (error) {
      console.error('Error en getStatus:', error);
      res.status(500).json({
        error: 'Error al obtener estado del servicio',
        message: error.message
      });
    }
  }
}

module.exports = new IntentController(); 