#!/usr/bin/env node

/**
 * Script de demostración del sistema de detección de intenciones
 */

const IntentService = require('./src/services/intentService');
const ParameterExtractor = require('./src/utils/parameterExtractor');

console.log('🤖 Sistema de Detección de Intenciones - Demo\n');

// Inicializar servicios
const intentService = new IntentService();
const parameterExtractor = new ParameterExtractor();

// Ejemplos de texto para probar
const testCases = [
  'buscar laptop gaming',
  'hola',
  'precio de smartphone',
  'comprar 3 auriculares',
  'información sobre tablets',
  'adiós',
  'ayuda',
  'reservar cita',
  'opinión de monitor',
  'contacto'
];

console.log('📋 Casos de prueba:');
testCases.forEach((text, index) => {
  console.log(`${index + 1}. "${text}"`);
});

console.log('\n🔍 Resultados de detección:\n');

testCases.forEach((text, index) => {
  console.log(`--- Caso ${index + 1}: "${text}" ---`);
  
  try {
    // Buscar intenciones que coincidan
    const matchingIntents = intentService.findMatchingIntents(text);
    
    if (matchingIntents.length > 0) {
      const bestMatch = matchingIntents[0];
      console.log(`✅ Intención detectada: ${bestMatch.intentId}`);
      console.log(`📊 Confianza: ${(bestMatch.confidence * 100).toFixed(1)}%`);
      console.log(`🎯 Patrón coincidente: "${bestMatch.pattern}"`);
      
      // Extraer parámetros
      const parameters = parameterExtractor.extract(text, bestMatch.intentId);
      
      if (Object.keys(parameters).length > 0) {
        console.log(`📝 Parámetros extraídos:`, parameters);
      } else {
        console.log(`📝 Sin parámetros extraídos`);
      }
    } else {
      console.log(`❌ No se detectó ninguna intención`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
});

// Mostrar estadísticas del sistema
console.log('📊 Estadísticas del Sistema:');
const stats = intentService.getIntentStats();
console.log(`- Total de intenciones: ${stats.total}`);
console.log(`- Intenciones con patrones: ${stats.withPatterns}`);
console.log(`- Intenciones con parámetros: ${stats.withParameters}`);
console.log(`- Promedio de patrones por intención: ${stats.averagePatterns.toFixed(1)}`);
console.log(`- Promedio de parámetros por intención: ${stats.averageParameters.toFixed(1)}`);

// Mostrar intenciones disponibles
console.log('\n📋 Intenciones disponibles:');
const availableIntents = intentService.getAvailableIntents();
availableIntents.forEach(intent => {
  console.log(`- ${intent.id}: ${intent.name}`);
  if (intent.description) {
    console.log(`  Descripción: ${intent.description}`);
  }
  console.log(`  Patrones: ${intent.patterns.length}`);
  console.log(`  Parámetros: ${Object.keys(intent.parameters).length}`);
  console.log('');
});

console.log('✅ Demo completado exitosamente!'); 