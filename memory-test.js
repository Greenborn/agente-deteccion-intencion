const IntentService = require('./src/services/intentService');

// Función para obtener información de memoria
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
    external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
  };
}

console.log('🧠 Monitoreo de Memoria - Agente de Detección de Intención\n');

// Memoria inicial
console.log('📊 Memoria inicial:');
console.log(getMemoryUsage());

// Inicializar servicios
console.log('\n🔄 Inicializando servicios...');
const startTime = Date.now();
const intentService = new IntentService();
const initTime = Date.now() - startTime;

console.log(`✅ Servicios inicializados en ${initTime}ms`);
console.log('📊 Memoria después de inicializar servicios:');
console.log(getMemoryUsage());

// Simular múltiples detecciones
console.log('\n🧪 Simulando detecciones de intenciones...');
const testCases = [
  'buscar laptop gaming',
  'comprar 3 auriculares',
  'precio de smartphone',
  'información sobre tablets',
  'hola',
  'adiós',
  'ayuda',
  'reservar cita',
  'opinión de monitor',
  'contacto'
];

for (let i = 0; i < testCases.length; i++) {
  const text = testCases[i];
  const matchingIntents = intentService.findMatchingIntents(text);
  
  if (matchingIntents.length > 0) {
    const bestMatch = matchingIntents[0];
    const intent = intentService.getIntent(bestMatch.intentId);
    const parameters = intent.extractParameters(text);
    
    console.log(`  ${i + 1}. "${text}" → ${bestMatch.intentId} (${Object.keys(parameters).length} params)`);
  } else {
    console.log(`  ${i + 1}. "${text}" → No detectado`);
  }
}

console.log('\n📊 Memoria después de procesar todas las detecciones:');
console.log(getMemoryUsage());

// Monitoreo continuo
console.log('\n📈 Monitoreo continuo (presiona Ctrl+C para detener):');
let counter = 0;
const interval = setInterval(() => {
  counter++;
  const text = testCases[counter % testCases.length];
  const matchingIntents = intentService.findMatchingIntents(text);
  
  if (counter % 10 === 0) {
    console.log(`\n🔄 Ciclo ${counter}:`);
    console.log(getMemoryUsage());
  }
}, 1000);

// Manejar salida
process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('\n\n📊 Memoria final:');
  console.log(getMemoryUsage());
  console.log('\n✅ Monitoreo finalizado');
  process.exit(0);
}); 