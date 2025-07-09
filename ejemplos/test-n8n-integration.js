#!/usr/bin/env node

/**
 * Script de prueba para la integración con n8n
 * Este script simula las llamadas que haría n8n al servicio de detección de intenciones
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testEndpoint(endpoint, data = null, method = 'GET') {
  try {
    const config = {
      method: method.toLowerCase(),
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

async function testN8nIntegration() {
  log('🚀 Iniciando pruebas de integración con n8n', 'bold');
  log('==================================================');

  // 1. Probar endpoint de información
  logInfo('1. Probando endpoint de información del servicio...');
  const infoResult = await testEndpoint('/api/n8n/info');
  
  if (infoResult.success) {
    logSuccess('✅ Endpoint de información funcionando');
    log(`   Servicio: ${infoResult.data.service}`);
    log(`   Versión: ${infoResult.data.version}`);
    log(`   Estado: ${infoResult.data.status}`);
  } else {
    logError('❌ Error en endpoint de información');
    logError(infoResult.error);
    return;
  }

  // 2. Probar endpoint webhook simplificado
  logInfo('\n2. Probando endpoint webhook simplificado...');
  const webhookData = {
    text: 'buscar laptop',
    method: 'hybrid'
  };
  
  const webhookResult = await testEndpoint('/api/n8n/webhook', webhookData, 'POST');
  
  if (webhookResult.success) {
    logSuccess('✅ Endpoint webhook funcionando');
    log(`   Intención: ${webhookResult.data.intent}`);
    log(`   Confianza: ${webhookResult.data.confidence}`);
    log(`   Parámetros: ${JSON.stringify(webhookResult.data.parameters)}`);
  } else {
    logError('❌ Error en endpoint webhook');
    logError(webhookResult.error);
  }

  // 3. Probar endpoint completo con contexto
  logInfo('\n3. Probando endpoint completo con contexto...');
  const fullData = {
    text: 'quiero comprar una laptop',
    method: 'hybrid',
    context: {
      userId: '12345',
      sessionId: 'abc123',
      source: 'chatbot',
      timestamp: new Date().toISOString()
    }
  };
  
  const fullResult = await testEndpoint('/api/n8n/detect-intent', fullData, 'POST');
  
  if (fullResult.success) {
    logSuccess('✅ Endpoint completo funcionando');
    const data = fullResult.data.data;
    log(`   Intención: ${data.intent}`);
    log(`   Confianza: ${data.confidence}`);
    log(`   Método: ${data.method}`);
    log(`   Tiene intención: ${data.hasIntent}`);
    log(`   Alta confianza: ${data.isHighConfidence}`);
    log(`   Debe responder: ${data.shouldRespond}`);
    log(`   Tipo de intención: ${data.intentType}`);
    log(`   Parámetros: ${JSON.stringify(data.parameters)}`);
    log(`   Contexto: ${JSON.stringify(data.context)}`);
  } else {
    logError('❌ Error en endpoint completo');
    logError(fullResult.error);
  }

  // 4. Probar diferentes tipos de intenciones
  logInfo('\n4. Probando diferentes tipos de intenciones...');
  
  const testCases = [
    { text: 'hola, como estas', expected: 'SALUDO' },
    { text: 'necesito ayuda con mi pedido', expected: 'AYUDA' },
    { text: 'quiero vender mi telefono', expected: 'VENTA' },
    { text: 'buscar productos electronicos', expected: 'BUSQUEDA' },
    { text: 'comprar una computadora', expected: 'COMPRA' }
  ];

  for (const testCase of testCases) {
    const result = await testEndpoint('/api/n8n/webhook', {
      text: testCase.text,
      method: 'hybrid'
    }, 'POST');

    if (result.success) {
      const intent = result.data.intent;
      const confidence = result.data.confidence;
      
      if (intent === testCase.expected) {
        logSuccess(`✅ "${testCase.text}" → ${intent} (${confidence})`);
      } else {
        logWarning(`⚠️  "${testCase.text}" → ${intent} (esperado: ${testCase.expected})`);
      }
    } else {
      logError(`❌ Error probando: "${testCase.text}"`);
    }
  }

  // 5. Probar casos edge
  logInfo('\n5. Probando casos edge...');
  
  const edgeCases = [
    { text: '', description: 'Texto vacío' },
    { text: 'xyz123', description: 'Texto sin sentido' },
    { text: 'quiero comprar una lapto', description: 'Falta de ortografía' }
  ];

  for (const edgeCase of edgeCases) {
    const result = await testEndpoint('/api/n8n/webhook', {
      text: edgeCase.text,
      method: 'hybrid'
    }, 'POST');

    if (result.success) {
      const intent = result.data.intent;
      const confidence = result.data.confidence;
      logInfo(`ℹ️  "${edgeCase.description}": ${intent} (${confidence})`);
    } else {
      logError(`❌ Error en caso edge: "${edgeCase.description}"`);
    }
  }

  // 6. Probar comparación de métodos
  logInfo('\n6. Probando comparación de métodos...');
  const compareResult = await testEndpoint('/api/compare-methods', {
    text: 'quiero comprar una laptop'
  }, 'POST');

  if (compareResult.success) {
    logSuccess('✅ Comparación de métodos funcionando');
    const data = compareResult.data;
    if (data.pattern && data.pattern.intent) {
      log(`   Pattern Matching: ${data.pattern.intent} (${data.pattern.confidence})`);
    }
    if (data.bert && data.bert.intent) {
      log(`   BERT: ${data.bert.intent} (${data.bert.confidence})`);
    }
    if (data.hybrid && data.hybrid.intent) {
      log(`   Híbrido: ${data.hybrid.intent} (${data.hybrid.confidence})`);
    }
  } else {
    logError('❌ Error en comparación de métodos');
  }

  log('\n🎉 Pruebas completadas!', 'bold');
  log('==================================================');
  
  logInfo('Para usar en n8n:');
  log('1. Importa el workflow de ejemplo: ejemplos/n8n-workflow-example.json');
  log('2. Configura la URL del servidor en las variables de entorno');
  log('3. Ajusta las condiciones según tus necesidades');
  log('4. Prueba con diferentes tipos de texto');
  
  logInfo('Endpoints disponibles:');
  log('   POST /api/n8n/detect-intent - Detección completa con contexto');
  log('   POST /api/n8n/webhook - Webhook simplificado');
  log('   GET  /api/n8n/info - Información del servicio');
  log('   POST /api/compare-methods - Comparar métodos');
  log('   GET  /api/bert-status - Estado del modelo BERT');
}

// Ejecutar las pruebas
if (require.main === module) {
  testN8nIntegration().catch(error => {
    logError('Error ejecutando las pruebas:');
    logError(error.message);
    process.exit(1);
  });
}

module.exports = { testN8nIntegration }; 