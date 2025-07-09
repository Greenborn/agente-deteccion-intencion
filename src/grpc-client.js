const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Configuración del cliente
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

class IntentDetectionClient {
  constructor(serverAddress = 'localhost:50051') {
    this.serverAddress = serverAddress;
    this.client = new intentProto.IntentDetectionService(
      serverAddress,
      grpc.credentials.createInsecure()
    );
  }

  /**
   * Detecta intención en el texto proporcionado
   * @param {string} text - Texto a analizar
   * @param {string} requestId - ID opcional para tracking
   * @returns {Promise<Object>} Resultado de la detección
   */
  detectIntent(text, requestId = null) {
    return new Promise((resolve, reject) => {
      const request = { text };
      if (requestId) {
        request.request_id = requestId;
      }

      this.client.detectIntent(request, (error, response) => {
        if (error) {
          console.error('[gRPC Client] Error detectando intención:', error);
          reject(error);
          return;
        }

        resolve(response);
      });
    });
  }

  /**
   * Obtiene todas las intenciones disponibles
   * @returns {Promise<Object>} Lista de intenciones
   */
  getIntents() {
    return new Promise((resolve, reject) => {
      this.client.getIntents({}, (error, response) => {
        if (error) {
          console.error('[gRPC Client] Error obteniendo intenciones:', error);
          reject(error);
          return;
        }

        resolve(response);
      });
    });
  }

  /**
   * Realiza health check del servicio
   * @returns {Promise<Object>} Estado del servicio
   */
  healthCheck() {
    return new Promise((resolve, reject) => {
      this.client.healthCheck({}, (error, response) => {
        if (error) {
          console.error('[gRPC Client] Error en health check:', error);
          reject(error);
          return;
        }

        resolve(response);
      });
    });
  }

  /**
   * Cierra la conexión del cliente
   */
  close() {
    this.client.close();
  }
}

// Función de utilidad para crear cliente
function createClient(serverAddress = 'localhost:50051') {
  return new IntentDetectionClient(serverAddress);
}

// Ejemplo de uso
async function example() {
  const client = createClient();

  try {
    // Health check
    console.log('🔍 Verificando estado del servicio...');
    const health = await client.healthCheck();
    console.log('✅ Servicio disponible:', health);

    // Obtener intenciones disponibles
    console.log('\n📋 Obteniendo intenciones disponibles...');
    const intents = await client.getIntents();
    console.log('📝 Intenciones disponibles:', intents.intents.length);

    // Detectar intención
    console.log('\n🎯 Detectando intención...');
    const result = await client.detectIntent('buscar laptop gaming', 'test-123');
    console.log('✅ Resultado:', result);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.close();
  }
}

// Exportar para uso como módulo
module.exports = {
  IntentDetectionClient,
  createClient
};

// Ejecutar ejemplo si se llama directamente
if (require.main === module) {
  example();
} 