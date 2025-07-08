const { Intent } = require('./src/models/intent');

// Test simple para debuggear
const intentData = {
  id: 'TEST',
  name: 'Test Intent',
  patterns: ['buscar {nombre_producto}'],
  parameters: {
    nombre_producto: { type: 'string', required: true }
  }
};

const intent = new Intent(intentData);
const text = 'buscar laptop gaming';

console.log('Texto original:', text);
console.log('Patrón:', intent.patterns[0]);

// Crear la regex y mostrarla
const patternRegex = intent.createPatternRegex(intent.patterns[0]);
console.log('Regex generada:', patternRegex.source);

// Probar el match
const match = text.match(patternRegex);
console.log('Match completo:', match);

// Extraer parámetros
const params = intent.extractParameters(text);
console.log('Parámetros extraídos:', params); 