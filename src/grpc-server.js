const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const IntentService = require('./services/intentService');

// Configuración del servidor
const PORT = process.env.GRPC_PORT || 50051;
const PROTO_PATH = path.join(__dirname, '../protos/intent.proto');

// Cargar el protocolo
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const intentProto = grpc.loadPackageDefinition(packageDefinition).intent;

// Inicializar servicios
const intentService = new IntentService();

// Implementación del servicio gRPC
const intentDetectionService = {
  // Detecta intención y extrae parámetros
  detectIntent: async (call, callback) => {
    try {
      const { text, request_id } = call.request;
      
      console.log(`[gRPC] Detectando intención para: "${text}" (ID: ${request_id || 'N/A'})`);
      
      if (!text || typeof text !== 'string') {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'El campo "text" es requerido y debe ser una cadena de texto'
        });
      }

      // Buscar intenciones que coincidan
      const matchingIntents = intentService.findMatchingIntents(text);
      
      if (matchingIntents.length === 0) {
        return callback(null, {
          intent: '',
          confidence: 0,
          pattern: '',
          parameters: {},
          original_text: text,
          success: true,
          error_message: ''
        });
      }

      const bestMatch = matchingIntents[0];
      const intent = intentService.getIntent(bestMatch.intentId);
      const parameters = intent.extractParameters(text);

      const response = {
        intent: bestMatch.intentId,
        confidence: bestMatch.confidence,
        pattern: bestMatch.pattern,
        parameters: parameters,
        original_text: text,
        success: true,
        error_message: ''
      };

      console.log(`[gRPC] Intención detectada: ${response.intent} (confianza: ${response.confidence})`);
      callback(null, response);

    } catch (error) {
      console.error('[gRPC] Error detectando intención:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtiene todas las intenciones disponibles
  getIntents: async (call, callback) => {
    try {
      console.log('[gRPC] Obteniendo lista de intenciones');
      
      const intents = intentService.getAvailableIntents();
      
      const intentDefinitions = intents.map(intent => ({
        id: intent.id,
        name: intent.name || intent.id,
        patterns: intent.patterns || [],
        parameters: Object.keys(intent.parameters || {}).reduce((acc, key) => {
          acc[key] = {
            type: intent.parameters[key].type || 'string',
            required: intent.parameters[key].required || false,
            description: intent.parameters[key].description || ''
          };
          return acc;
        }, {})
      }));

      callback(null, {
        intents: intentDefinitions,
        success: true,
        error_message: ''
      });

    } catch (error) {
      console.error('[gRPC] Error obteniendo intenciones:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error interno del servidor'
      });
    }
  },

  // Health check del servicio
  healthCheck: async (call, callback) => {
    try {
      const response = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service_name: 'Agente de Detección de Intención (gRPC)',
        version: '1.0.0'
      };

      console.log('[gRPC] Health check solicitado');
      callback(null, response);

    } catch (error) {
      console.error('[gRPC] Error en health check:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error interno del servidor'
      });
    }
  }
};

// Crear y configurar el servidor
const server = new grpc.Server();

// Agregar el servicio al servidor
server.addService(intentProto.IntentDetectionService.service, intentDetectionService);

// Iniciar el servidor
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error('[gRPC] Error iniciando servidor:', error);
      return;
    }

    server.start();
    console.log(`🚀 Servidor gRPC iniciado en puerto ${port}`);
    console.log(`📡 Endpoints gRPC disponibles:`);
    console.log(`   DetectIntent: 0.0.0.0:${port}`);
    console.log(`   GetIntents: 0.0.0.0:${port}`);
    console.log(`   HealthCheck: 0.0.0.0:${port}`);
    console.log(`\n💡 Para probar el cliente gRPC:`);
    console.log(`   npm run test:grpc`);
  }
);

// Manejo de señales para cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor gRPC...');
  server.tryShutdown(() => {
    console.log('✅ Servidor gRPC cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor gRPC...');
  server.tryShutdown(() => {
    console.log('✅ Servidor gRPC cerrado correctamente');
    process.exit(0);
  });
});

module.exports = server; 