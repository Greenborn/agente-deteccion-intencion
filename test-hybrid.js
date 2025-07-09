#!/usr/bin/env node

/**
 * Script de prueba para el sistema híbrido de detección de intenciones
 * Uso: node test-hybrid.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testHybridSystem() {
  console.log('🚀 Iniciando pruebas del sistema híbrido...\n');
  
  try {
    // Test 1: Obtener métodos disponibles
    console.log('📋 Test 1: Métodos de Detección Disponibles');
    console.log('─'.repeat(60));
    const methodsResponse = await axios.get(`${BASE_URL}/api/detection-methods`);
    const methods = methodsResponse.data.data;
    
    console.log('✅ Métodos disponibles:');
    Object.keys(methods).forEach(method => {
      const config = methods[method];
      console.log(`   🔹 ${method}: ${config.name}`);
      console.log(`      Descripción: ${config.description}`);
      console.log(`      Habilitado: ${config.enabled ? '✅' : '❌'}`);
      console.log(`      Prioridad: ${config.priority}`);
    });
    console.log('');

    // Test 2: Detección con método por defecto
    console.log('📋 Test 2: Detección con Método por Defecto');
    console.log('─'.repeat(60));
    
    const testCases = [
      'buscar laptop gaming',
      'hola como estás',
      'precio de smartphone',
      'quiero comprar una tablet'
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testText = testCases[i];
      console.log(`🎯 Test ${i + 1}: "${testText}"`);
      
      try {
        const response = await axios.post(`${BASE_URL}/api/detect-intent`, {
          text: testText
        });
        
        const result = response.data.data;
        console.log(`   ✅ Método usado: ${result.method}`);
        console.log(`   🎯 Intención: ${result.intent || 'Ninguna'}`);
        console.log(`   📊 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
        
        if (result.pattern) {
          console.log(`   🎭 Patrón: ${result.pattern}`);
        }
        
        if (Object.keys(result.parameters).length > 0) {
          console.log(`   📝 Parámetros:`, result.parameters);
        }
        
        if (result.hybridDecision) {
          console.log(`   🔄 Decisión híbrida: ${result.hybridDecision}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
      }
      console.log('');
    }

    // Test 3: Comparar métodos
    console.log('📋 Test 3: Comparación de Métodos');
    console.log('─'.repeat(60));
    
    const comparisonText = 'buscar laptop gaming';
    console.log(`🔄 Comparando métodos para: "${comparisonText}"`);
    
    try {
      const comparisonResponse = await axios.post(`${BASE_URL}/api/compare-methods`, {
        text: comparisonText
      });
      
      const comparison = comparisonResponse.data.data;
      
      Object.keys(comparison).forEach(method => {
        const result = comparison[method];
        console.log(`\n🔹 ${method.toUpperCase()}:`);
        
        if (result.error) {
          console.log(`   ❌ Error: ${result.error}`);
        } else {
          console.log(`   🎯 Intención: ${result.intent || 'Ninguna'}`);
          console.log(`   📊 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
          console.log(`   ⏱️ Tiempo: ${result.executionTime}ms`);
          
          if (result.pattern) {
            console.log(`   🎭 Patrón: ${result.pattern}`);
          }
          
          if (Object.keys(result.parameters).length > 0) {
            console.log(`   📝 Parámetros:`, result.parameters);
          }
        }
      });
    } catch (error) {
      console.log(`❌ Error en comparación: ${error.response?.data?.error || error.message}`);
    }
    console.log('');

    // Test 4: Cambiar método por defecto
    console.log('📋 Test 4: Cambiar Método por Defecto');
    console.log('─'.repeat(60));
    
    const newMethod = 'hybrid';
    console.log(`🔄 Cambiando método por defecto a: ${newMethod}`);
    
    try {
      const changeResponse = await axios.post(`${BASE_URL}/api/set-default-method`, {
        method: newMethod
      });
      
      console.log(`✅ ${changeResponse.data.data.message}`);
      
      // Probar con el nuevo método
      const testResponse = await axios.post(`${BASE_URL}/api/detect-intent`, {
        text: 'buscar smartphone'
      });
      
      const result = testResponse.data.data;
      console.log(`🎯 Resultado con nuevo método:`);
      console.log(`   Método: ${result.method}`);
      console.log(`   Intención: ${result.intent}`);
      console.log(`   Confianza: ${(result.confidence * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.error || error.message}`);
    }
    console.log('');

    // Test 5: Estadísticas de rendimiento
    console.log('📋 Test 5: Estadísticas de Rendimiento');
    console.log('─'.repeat(60));
    
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/performance-stats`);
      const stats = statsResponse.data.data;
      
      console.log('✅ Estadísticas del sistema:');
      console.log(`   Método por defecto: ${stats.defaultMethod}`);
      console.log(`   Métodos disponibles: ${Object.keys(stats.availableMethods).length}`);
      
      if (stats.bertStatus) {
        console.log(`   Estado BERT: ${stats.bertStatus.isModelLoaded ? '✅ Cargado' : '❌ No cargado'}`);
        if (stats.bertStatus.error) {
          console.log(`   Error BERT: ${stats.bertStatus.error}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error obteniendo estadísticas: ${error.response?.data?.error || error.message}`);
    }
    console.log('');

    // Test 6: Detección con método específico
    console.log('📋 Test 6: Detección con Método Específico');
    console.log('─'.repeat(60));
    
    const specificMethods = ['pattern_matching', 'hybrid'];
    
    for (const method of specificMethods) {
      console.log(`🎯 Probando método: ${method}`);
      
      try {
        const response = await axios.post(`${BASE_URL}/api/detect-intent`, {
          text: 'precio de laptop',
          method: method
        });
        
        const result = response.data.data;
        console.log(`   ✅ Intención: ${result.intent || 'Ninguna'}`);
        console.log(`   📊 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   🔧 Método usado: ${result.method}`);
        
        if (result.hybridDecision) {
          console.log(`   🔄 Decisión: ${result.hybridDecision}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
      }
      console.log('');
    }

    console.log('🎉 Pruebas completadas exitosamente!');
    console.log('\n💡 Comandos útiles:');
    console.log('   curl -X POST http://localhost:3000/api/detect-intent -H "Content-Type: application/json" -d \'{"text":"buscar laptop","method":"hybrid"}\'');
    console.log('   curl -X POST http://localhost:3000/api/set-default-method -H "Content-Type: application/json" -d \'{"method":"pattern_matching"}\'');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('💡 Asegúrate de que el servidor esté ejecutándose:');
    console.error('   npm start');
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testHybridSystem().catch(console.error);
}

module.exports = { testHybridSystem }; 