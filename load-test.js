const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const CONCURRENT_REQUESTS = 10;
const TOTAL_REQUESTS = 100;

const testCases = [
  'buscar laptop gaming',
  'comprar 3 auriculares',
  'precio de smartphone',
  'información sobre tablets',
  'hola',
  'adiós',
  'ayuda'
];

async function makeRequest(text) {
  try {
    const response = await axios.post(`${BASE_URL}/api/detect-intent`, {
      text: text
    });
    return response.data;
  } catch (error) {
    console.error(`Error en petición: ${error.message}`);
    return null;
  }
}

async function runLoadTest() {
  console.log('🚀 Iniciando prueba de carga...\n');
  console.log(`📊 Configuración:`);
  console.log(`   - Peticiones concurrentes: ${CONCURRENT_REQUESTS}`);
  console.log(`   - Total de peticiones: ${TOTAL_REQUESTS}`);
  console.log(`   - URL: ${BASE_URL}\n`);

  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;

  // Función para ejecutar un lote de peticiones
  async function runBatch(batchNumber) {
    const promises = [];
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      const text = testCases[i % testCases.length];
      promises.push(makeRequest(text));
    }

    const results = await Promise.all(promises);
    
    results.forEach(result => {
      if (result && result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    });

    console.log(`✅ Lote ${batchNumber + 1} completado`);
  }

  // Ejecutar todos los lotes
  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS);
  for (let i = 0; i < batches; i++) {
    await runBatch(i);
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const requestsPerSecond = (TOTAL_REQUESTS / totalTime) * 1000;

  console.log('\n📊 Resultados de la prueba de carga:');
  console.log(`   ⏱️  Tiempo total: ${totalTime}ms`);
  console.log(`   🚀 Peticiones por segundo: ${requestsPerSecond.toFixed(2)}`);
  console.log(`   ✅ Peticiones exitosas: ${successCount}`);
  console.log(`   ❌ Peticiones fallidas: ${errorCount}`);
  console.log(`   📈 Tasa de éxito: ${((successCount / TOTAL_REQUESTS) * 100).toFixed(2)}%`);

  // Verificar memoria del servidor después de la carga
  console.log('\n💡 Para verificar el consumo de memoria del servidor, ejecuta:');
  console.log(`   ps -p 82367 -o pid,ppid,cmd,%mem,%cpu,rss,vsz`);
  console.log('\n   O usa el script de monitoreo:');
  console.log(`   node memory-test.js`);
}

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Servidor está corriendo');
    return true;
  } catch (error) {
    console.error('❌ Servidor no está disponible. Asegúrate de ejecutar: npm run dev');
    return false;
  }
}

// Ejecutar la prueba
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runLoadTest();
  }
}

main().catch(console.error); 