const intentsConfig = require('../config/intents');

class IntentService {
  constructor() {
    this.intents = intentsConfig.INTENTS;
    this.patterns = this.buildPatterns();
  }

  /**
   * Construye patrones de reconocimiento para cada intención
   */
  buildPatterns() {
    const patterns = {};
    
    Object.keys(this.intents).forEach(intentKey => {
      const intent = this.intents[intentKey];
      patterns[intentKey] = {
        patterns: intent.patterns || [],
        parameters: intent.parameters || {},
        synonyms: intent.synonyms || {}
      };
    });

    return patterns;
  }

  /**
   * Obtiene todas las intenciones disponibles
   */
  getAvailableIntents() {
    return Object.keys(this.intents).map(key => ({
      id: key,
      name: this.intents[key].name || key,
      description: this.intents[key].description || '',
      patterns: this.intents[key].patterns || [],
      parameters: this.intents[key].parameters || {}
    }));
  }

  /**
   * Obtiene una intención específica por ID
   */
  getIntent(intentId) {
    return this.intents[intentId] || null;
  }

  /**
   * Valida si una intención existe
   */
  isValidIntent(intentId) {
    return Object.keys(this.intents).includes(intentId);
  }

  /**
   * Obtiene los patrones de una intención específica
   */
  getIntentPatterns(intentId) {
    if (!this.isValidIntent(intentId)) {
      return [];
    }
    return this.intents[intentId].patterns || [];
  }

  /**
   * Obtiene los parámetros de una intención específica
   */
  getIntentParameters(intentId) {
    if (!this.isValidIntent(intentId)) {
      return {};
    }
    return this.intents[intentId].parameters || {};
  }

  /**
   * Busca sinónimos para una palabra
   */
  findSynonyms(word, intentId) {
    if (!this.isValidIntent(intentId)) {
      return [word];
    }

    const synonyms = this.intents[intentId].synonyms || {};
    return synonyms[word.toLowerCase()] || [word];
  }

  /**
   * Normaliza una intención (convierte a formato estándar)
   */
  normalizeIntent(intentId) {
    if (!intentId) return 'none';
    
    const normalized = intentId.toUpperCase().trim();
    return this.isValidIntent(normalized) ? normalized : 'none';
  }

  /**
   * Obtiene estadísticas de las intenciones
   */
  getIntentStats() {
    const stats = {
      total: Object.keys(this.intents).length,
      withPatterns: 0,
      withParameters: 0,
      averagePatterns: 0,
      averageParameters: 0
    };

    let totalPatterns = 0;
    let totalParameters = 0;

    Object.values(this.intents).forEach(intent => {
      if (intent.patterns && intent.patterns.length > 0) {
        stats.withPatterns++;
        totalPatterns += intent.patterns.length;
      }
      
      if (intent.parameters && Object.keys(intent.parameters).length > 0) {
        stats.withParameters++;
        totalParameters += Object.keys(intent.parameters).length;
      }
    });

    stats.averagePatterns = stats.total > 0 ? totalPatterns / stats.total : 0;
    stats.averageParameters = stats.total > 0 ? totalParameters / stats.total : 0;

    return stats;
  }

  /**
   * Busca intenciones que coincidan con un patrón de texto
   */
  findMatchingIntents(text) {
    const matches = [];
    const normalizedText = text.toLowerCase().trim();

    Object.keys(this.intents).forEach(intentId => {
      const intent = this.intents[intentId];
      const patterns = intent.patterns || [];

      patterns.forEach(pattern => {
        const normalizedPattern = pattern.toLowerCase();
        
        // Verificación simple de coincidencia
        if (normalizedText.includes(normalizedPattern.replace(/\{.*?\}/g, ''))) {
          matches.push({
            intentId,
            pattern,
            confidence: this.calculatePatternConfidence(normalizedText, normalizedPattern)
          });
        }
      });
    });

    // Ordenar por confianza descendente
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calcula la confianza de coincidencia de un patrón
   */
  calculatePatternConfidence(text, pattern) {
    const patternWords = pattern.replace(/\{.*?\}/g, '').trim().split(/\s+/);
    const textWords = text.split(/\s+/);
    
    let matches = 0;
    patternWords.forEach(word => {
      if (textWords.includes(word)) {
        matches++;
      }
    });

    return patternWords.length > 0 ? matches / patternWords.length : 0;
  }

  /**
   * Agrega una nueva intención
   */
  addIntent(intentId, intentConfig) {
    if (this.isValidIntent(intentId)) {
      throw new Error(`La intención ${intentId} ya existe`);
    }

    this.intents[intentId] = {
      name: intentConfig.name || intentId,
      description: intentConfig.description || '',
      patterns: intentConfig.patterns || [],
      parameters: intentConfig.parameters || {},
      synonyms: intentConfig.synonyms || {}
    };

    // Reconstruir patrones
    this.patterns = this.buildPatterns();

    return this.intents[intentId];
  }

  /**
   * Actualiza una intención existente
   */
  updateIntent(intentId, intentConfig) {
    if (!this.isValidIntent(intentId)) {
      throw new Error(`La intención ${intentId} no existe`);
    }

    this.intents[intentId] = {
      ...this.intents[intentId],
      ...intentConfig
    };

    // Reconstruir patrones
    this.patterns = this.buildPatterns();

    return this.intents[intentId];
  }

  /**
   * Elimina una intención
   */
  removeIntent(intentId) {
    if (!this.isValidIntent(intentId)) {
      throw new Error(`La intención ${intentId} no existe`);
    }

    delete this.intents[intentId];
    
    // Reconstruir patrones
    this.patterns = this.buildPatterns();

    return true;
  }
}

module.exports = IntentService; 