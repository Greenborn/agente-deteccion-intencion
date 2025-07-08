const express = require('express');
const cors = require('cors');
const IntentService = require('./services/intentService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar servicios
const intentService = new IntentService();

// Endpoint principal para detectar intenciones
app.post('/api/detect-intent', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'El campo "text" es requerido y debe ser una cadena de texto'
      });
    }

    // Buscar intenciones que coincidan
    const matchingIntents = intentService.findMatchingIntents(text);
    
    if (matchingIntents.length === 0) {
      return res.json({
        success: true,
        data: {
          intent: null,
          confidence: 0,
          parameters: {},
          originalText: text
        }
      });
    }

    const bestMatch = matchingIntents[0];
    const intent = intentService.getIntent(bestMatch.intentId);
    const parameters = intent.extractParameters(text);

    res.json({
      success: true,
      data: {
        intent: bestMatch.intentId,
        confidence: bestMatch.confidence,
        pattern: bestMatch.pattern,
        parameters,
        originalText: text
      }
    });

  } catch (error) {
    console.error('Error detectando intención:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Endpoint para obtener todas las intenciones disponibles
app.get('/api/intents', (req, res) => {
  try {
    const intents = intentService.getAvailableIntents();
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

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Agente de Detección de Intención'
  });
});

// Endpoint raíz
app.get('/', (req, res) => {
  res.json({
    service: 'Agente de Detección de Intención',
    version: '1.0.0',
    endpoints: {
      'POST /api/detect-intent': 'Detectar intención y extraer parámetros',
      'GET /api/intents': 'Obtener todas las intenciones disponibles',
      'GET /health': 'Health check del servicio'
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
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   POST http://localhost:${PORT}/api/detect-intent`);
  console.log(`   GET  http://localhost:${PORT}/api/intents`);
  console.log(`   GET  http://localhost:${PORT}/health`);
});

module.exports = app; 