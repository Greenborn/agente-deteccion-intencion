const express = require('express');
const cors = require('cors');
const HybridIntentService = require('./services/hybridIntentService');
const { DETECTION_METHODS } = require('./config/detection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar servicio híbrido
const hybridService = new HybridIntentService();

// Endpoint principal para detectar intenciones
app.post('/api/detect-intent', async (req, res) => {
  try {
    const { text, method } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'El campo "text" es requerido y debe ser una cadena de texto'
      });
    }

    // Detectar intención con el método especificado o por defecto
    const result = await hybridService.detectIntent(text, method);

    res.json({
      success: true,
      data: {
        intent: result.intent,
        confidence: result.confidence,
        pattern: result.pattern,
        parameters: result.parameters,
        originalText: result.originalText,
        method: result.method,
        // Información adicional para métodos híbridos
        ...(result.hybridDecision && { hybridDecision: result.hybridDecision }),
        ...(result.bertMethod && { bertMethod: result.bertMethod }),
        ...(result.patternConfidence && { patternConfidence: result.patternConfidence }),
        ...(result.bertConfidence && { bertConfidence: result.bertConfidence }),
        ...(result.bertScores && { bertScores: result.bertScores })
      }
    });

  } catch (error) {
    console.error('Error detectando intención:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Endpoint para obtener todas las intenciones disponibles
app.get('/api/intents', (req, res) => {
  try {
    const intents = hybridService.intentService.getAvailableIntents();
    res.json({
      success: true,
      data: intents
    });
  } catch (error) {
    console.error('Error obteniendo intenciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Endpoint para obtener métodos de detección disponibles
app.get('/api/detection-methods', (req, res) => {
  try {
    const methods = hybridService.getAvailableMethods();
    res.json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('Error obteniendo métodos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Endpoint para cambiar método por defecto
app.post('/api/set-default-method', (req, res) => {
  try {
    const { method } = req.body;
    
    if (!method) {
      return res.status(400).json({
        success: false,
        error: 'El campo "method" es requerido'
      });
    }

    hybridService.setDefaultMethod(method);
    
    res.json({
      success: true,
      data: {
        message: `Método por defecto cambiado a: ${method}`,
        currentMethod: method
      }
    });
  } catch (error) {
    console.error('Error cambiando método:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para comparar métodos
app.post('/api/compare-methods', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'El campo "text" es requerido y debe ser una cadena de texto'
      });
    }

    const comparison = await hybridService.compareMethods(text);
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error comparando métodos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Endpoint para obtener estadísticas de rendimiento
app.get('/api/performance-stats', async (req, res) => {
  try {
    const stats = await hybridService.getPerformanceStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Endpoint para entrenar modelo BERT
app.post('/api/train-bert', async (req, res) => {
  try {
    const { trainingData, useDefaultData = true } = req.body;
    
    let dataToTrain;
    
    if (useDefaultData) {
      // Usar datos de entrenamiento por defecto
      dataToTrain = hybridService.getTrainingData();
      console.log('🔄 Usando datos de entrenamiento por defecto');
    } else if (trainingData && Array.isArray(trainingData)) {
      // Usar datos proporcionados por el usuario
      dataToTrain = trainingData;
      console.log('🔄 Usando datos de entrenamiento personalizados');
    } else {
      return res.status(400).json({
        success: false,
        error: 'Se requieren datos de entrenamiento válidos'
      });
    }

    console.log(`📊 Entrenando con ${dataToTrain.length} ejemplos`);
    
    // Iniciar entrenamiento
    const history = await hybridService.trainBertModel(dataToTrain);
    
    // Proteger acceso a las métricas del historial
    let finalAccuracy = 'N/A';
    let finalLoss = 'N/A';
    let epochs = 0;
    
    try {
      if (history && history.epoch && Array.isArray(history.epoch)) {
        epochs = history.epoch.length;
      }
      
      if (history && history.history && history.history.accuracy && Array.isArray(history.history.accuracy) && history.history.accuracy.length > 0) {
        finalAccuracy = history.history.accuracy[history.history.accuracy.length - 1];
      }
      
      if (history && history.history && history.history.loss && Array.isArray(history.history.loss) && history.history.loss.length > 0) {
        finalLoss = history.history.loss[history.history.loss.length - 1];
      }
    } catch (metricError) {
      console.log('⚠️ Error accediendo a métricas del historial:', metricError.message);
    }
    
    res.json({
      success: true,
      data: {
        message: 'Modelo BERT entrenado exitosamente',
        trainingExamples: dataToTrain.length,
        history: {
          epochs: epochs,
          finalAccuracy: finalAccuracy,
          finalLoss: finalLoss
        }
      }
    });
  } catch (error) {
    console.error('Error entrenando modelo BERT:', error);
    res.status(500).json({
      success: false,
      error: 'Error entrenando modelo BERT',
      details: error.message
    });
  }
});

// Endpoint para obtener datos de entrenamiento de ejemplo
app.get('/api/training-data', (req, res) => {
  try {
    const trainingData = hybridService.getTrainingData();
    res.json({
      success: true,
      data: {
        examples: trainingData,
        count: trainingData.length,
        intents: [...new Set(trainingData.map(item => item.intent))]
      }
    });
  } catch (error) {
    console.error('Error obteniendo datos de entrenamiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Endpoint para obtener estado del modelo BERT
app.get('/api/bert-status', async (req, res) => {
  try {
    const status = await hybridService.bertService.getModelStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error obteniendo estado BERT:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Endpoint específico para n8n
app.post('/api/n8n/detect-intent', async (req, res) => {
  try {
    const { text, method = 'hybrid', context = {} } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'El campo "text" es requerido y debe ser una cadena de texto'
      });
    }

    // Detectar intención
    const result = await hybridService.detectIntent(text, method);
    
    // Formato específico para n8n
    const n8nResponse = {
      success: true,
      data: {
        // Información básica
        intent: result.intent,
        confidence: result.confidence,
        originalText: result.originalText,
        method: result.method,
        
        // Información para n8n
        hasIntent: result.intent !== null,
        isHighConfidence: result.confidence > 0.8,
        
        // Parámetros extraídos
        parameters: result.parameters || {},
        parameterCount: Object.keys(result.parameters || {}).length,
        
        // Información del patrón
        pattern: result.pattern || '',
        hasPattern: !!result.pattern,
        
        // Información híbrida
        hybridDecision: result.hybridDecision || '',
        bertConfidence: result.bertConfidence || 0,
        patternConfidence: result.patternConfidence || 0,
        
        // Contexto adicional
        context: context,
        timestamp: new Date().toISOString(),
        
        // Flags para n8n
        shouldRespond: result.intent !== null && result.confidence > 0.5,
        intentType: result.intent ? result.intent.toLowerCase() : 'none',
        
        // Información de procesamiento
        processingTime: Date.now() - (req.startTime || Date.now()),
        serviceVersion: '2.1.0'
      }
    };

    res.json(n8nResponse);

  } catch (error) {
    console.error('Error en endpoint n8n:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para webhook de n8n (formato simplificado)
app.post('/api/n8n/webhook', async (req, res) => {
  try {
    const { text, method = 'hybrid' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Campo "text" requerido'
      });
    }

    const result = await hybridService.detectIntent(text, method);
    
    // Formato webhook simple para n8n
    res.json({
      intent: result.intent || 'none',
      confidence: result.confidence,
      parameters: result.parameters || {},
      pattern: result.pattern || '',
      method: result.method,
      success: result.intent !== null
    });

  } catch (error) {
    console.error('Error en webhook n8n:', error);
    res.status(500).json({
      error: 'Error procesando solicitud',
      success: false
    });
  }
});

// Endpoint para obtener información del servicio (para n8n)
app.get('/api/n8n/info', (req, res) => {
  res.json({
    service: 'Agente de Detección de Intenciones',
    version: '2.1.0',
    status: 'active',
    endpoints: {
      detect: '/api/n8n/detect-intent',
      webhook: '/api/n8n/webhook',
      compare: '/api/compare-methods',
      train: '/api/train-bert',
      status: '/api/bert-status'
    },
    capabilities: {
      intentDetection: true,
      parameterExtraction: true,
      hybridMethod: true,
      bertLocal: true,
      patternMatching: true,
      training: true
    },
    supportedIntents: ['BUSQUEDA', 'COMPRA', 'VENTA', 'AYUDA', 'SALUDO', 'DESPEDIDA'],
    defaultMethod: 'hybrid',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Agente de Detección de Intención (Híbrido con BERT Local)',
    defaultMethod: hybridService.defaultMethod
  });
});

// Endpoint raíz
app.get('/', (req, res) => {
  res.json({
    service: 'Agente de Detección de Intención (Híbrido con BERT Local)',
    version: '2.1.0',
    defaultMethod: hybridService.defaultMethod,
    endpoints: {
      'POST /api/detect-intent': 'Detectar intención y extraer parámetros',
      'GET /api/intents': 'Obtener todas las intenciones disponibles',
      'GET /api/detection-methods': 'Obtener métodos de detección disponibles',
      'POST /api/set-default-method': 'Cambiar método por defecto',
      'POST /api/compare-methods': 'Comparar resultados de diferentes métodos',
      'GET /api/performance-stats': 'Obtener estadísticas de rendimiento',
      'POST /api/train-bert': 'Entrenar modelo BERT local',
      'GET /api/training-data': 'Obtener datos de entrenamiento de ejemplo',
      'GET /api/bert-status': 'Obtener estado del modelo BERT',
      'GET /health': 'Health check del servicio'
    },
    methods: {
      'pattern_matching': 'Detección basada en patrones',
      'bert': 'Detección usando BERT local (TensorFlow.js)',
      'hybrid': 'Combinación de ambos métodos'
    },
    features: {
      'bert_local': 'Modelo BERT entrenado localmente',
      'tensorflow_js': 'Usando TensorFlow.js para inferencia',
      'vocabulary': 'Vocabulario de 500+ palabras',
      'training': 'Entrenamiento personalizable'
    }
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor híbrido con BERT local iniciado en puerto ${PORT}`);
  console.log(`📡 Método por defecto: ${hybridService.defaultMethod}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   POST http://localhost:${PORT}/api/detect-intent`);
  console.log(`   GET  http://localhost:${PORT}/api/intents`);
  console.log(`   GET  http://localhost:${PORT}/api/detection-methods`);
  console.log(`   POST http://localhost:${PORT}/api/set-default-method`);
  console.log(`   POST http://localhost:${PORT}/api/compare-methods`);
  console.log(`   GET  http://localhost:${PORT}/api/performance-stats`);
  console.log(`   POST http://localhost:${PORT}/api/train-bert`);
  console.log(`   GET  http://localhost:${PORT}/api/training-data`);
  console.log(`   GET  http://localhost:${PORT}/api/bert-status`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`\n💡 Para entrenar BERT: POST /api/train-bert`);
  console.log(`💡 Para cambiar método: POST /api/set-default-method`);
  console.log(`💡 Para comparar métodos: POST /api/compare-methods`);
});

module.exports = app; 