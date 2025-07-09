#!/usr/bin/env node

/**
 * Script de prueba para el cliente gRPC
 * Uso: node test-grpc.js
 */

const { createClient } = require('./src/grpc-client');

async function testGrpcClient() {
  console.log('🚀 Iniciando pruebas del cliente gRPC...\n');
  
  const client = createClient();
  
  try {
    // Test 1: Health Check
    console.log('📋 Test 1: Health Check');
    console.log('─'.repeat(50));
    const health = await client.healthCheck();
    console.log('✅ Servicio disponible:');
    console.log(`   Status: ${health.status}`);
    console.log(`   Service: ${health.service_name}`);
    console.log(`   Version: ${health.version}`);
    console.log(`   Timestamp: ${health.timestamp}\n`);

    // Test 2: Obtener Intenciones
    console.log('📋 Test 2: Obtener Intenciones Disponibles');
    console.log('─'.repeat(50));
    const intents = await client.getIntents();
    console.log(`✅ Intenciones disponibles: ${intents.intents.length}`);
    
    if (intents.intents.length > 0) {
      console.log('📝 Lista de intenciones:');
      intents.intents.forEach((intent, index) => {
        console.log(`   ${index + 1}. ${intent.id} - ${intent.name}`);
        if (intent.patterns && intent.patterns.length > 0) {
          console.log(`      Patrones: ${intent.patterns.join(', ')}`);
        }
      });
    }
    console.log('');

    // Test 3: Detectar Intenciones
    console.log('📋 Test 3: Detectar Intenciones');
    console.log('─'.repeat(50));
    
    const testCases = [
      'buscar laptop gaming',
      'encontrar smartphone',
      'producto auriculares bluetooth',
      'hola como estás',
      'quiero comprar una tablet',
      'buscar ropa deportiva'
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testText = testCases[i];
      console.log(`🎯 Test ${i + 1}: "${testText}"`);
      
      try {
        const result = await client.detectIntent(testText, `test-${i + 1}`);
        
        if (result.success) {
          if (result.intent) {
            console.log(`   ✅ Intención detectada: ${result.intent}`);
            console.log(`   📊 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
            console.log(`   🎯 Patrón: ${result.pattern}`);
            
            if (Object.keys(result.parameters).length > 0) {
              console.log(`   📝 Parámetros:`, result.parameters);
            }
          } else {
            console.log(`   ❌ No se detectó intención`);
          }
        } else {
          console.log(`   ❌ Error: ${result.error_message}`);
        }
      } catch (error) {
        console.log(`   ❌ Error de conexión: ${error.message}`);
      }
      
      console.log('');
    }

    // Test 4: Performance Test
    console.log('📋 Test 4: Prueba de Performance');
    console.log('─'.repeat(50));
    
    const performanceText = 'buscar laptop gaming';
    const iterations = 10;
    const startTime = Date.now();
    
    console.log(`🔄 Ejecutando ${iterations} requests...`);
    
    for (let i = 0; i < iterations; i++) {
      await client.detectIntent(performanceText, `perf-${i}`);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`✅ Performance completada:`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Average time: ${avgTime.toFixed(2)}ms per request`);
    console.log(`   Requests per second: ${(1000 / avgTime).toFixed(2)}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('💡 Asegúrate de que el servidor gRPC esté ejecutándose:');
    console.error('   npm run start:grpc');
  } finally {
    client.close();
    console.log('🔚 Cliente gRPC cerrado');
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testGrpcClient().catch(console.error);
}

module.exports = { testGrpcClient }; 