const IntentService = require('./intentService');
const LocalBertService = require('./localBertService');
const { 
  DETECTION_METHODS, 
  getMethodConfig, 
  getDefaultMethod,
  isMethodEnabled 
} = require('../config/detection');

class HybridIntentService {
  constructor() {
    this.intentService = new IntentService();
    this.bertService = new LocalBertService();
    this.defaultMethod = getDefaultMethod();
    
    console.log(`🚀 Servicio híbrido iniciado con método por defecto: ${this.defaultMethod}`);
  }

  /**
   * Detecta intención usando el método especificado
   * @param {string} text - Texto a analizar
   * @param {string} method - Método de detección (opcional)
   * @returns {Promise<Object>} Resultado de la detección
   */
  async detectIntent(text, method = null) {
    const detectionMethod = method || this.defaultMethod;
    
    console.log(`🎯 Detectando intención con método: ${detectionMethod}`);
    
    try {
      switch (detectionMethod) {
        case DETECTION_METHODS.PATTERN_MATCHING:
          return await this.detectWithPatternMatching(text);
          
        case DETECTION_METHODS.BERT:
          return await this.detectWithBERT(text);
          
        case DETECTION_METHODS.HYBRID:
          return await this.detectWithHybrid(text);
          
        default:
          throw new Error(`Método de detección no válido: ${detectionMethod}`);
      }
    } catch (error) {
      console.error(`❌ Error en detección con método ${detectionMethod}:`, error);
      
      // Fallback al método por defecto si es diferente
      if (detectionMethod !== this.defaultMethod) {
        console.log(`🔄 Fallback al método por defecto: ${this.defaultMethod}`);
        return await this.detectIntent(text, this.defaultMethod);
      }
      
      return {
        intent: null,
        confidence: 0,
        pattern: '',
        parameters: {},
        originalText: text,
        method: detectionMethod,
        error: error.message
      };
    }
  }

  /**
   * Detección usando solo pattern matching
   */
  async detectWithPatternMatching(text) {
    const config = getMethodConfig(DETECTION_METHODS.PATTERN_MATCHING);
    const matches = this.intentService.findMatchingIntents(text);
    
    if (matches.length === 0) {
      return {
        intent: null,
        confidence: 0,
        pattern: '',
        parameters: {},
        originalText: text,
        method: DETECTION_METHODS.PATTERN_MATCHING
      };
    }

    const bestMatch = matches[0];
    
    // Filtrar por confianza mínima
    if (bestMatch.confidence < config.config.minConfidence) {
      return {
        intent: null,
        confidence: bestMatch.confidence,
        pattern: bestMatch.pattern,
        parameters: {},
        originalText: text,
        method: DETECTION_METHODS.PATTERN_MATCHING
      };
    }

    const intent = this.intentService.getIntent(bestMatch.intentId);
    const parameters = intent.extractParameters(text);

    return {
      intent: bestMatch.intentId,
      confidence: bestMatch.confidence,
      pattern: bestMatch.pattern,
      parameters: parameters,
      originalText: text,
      method: DETECTION_METHODS.PATTERN_MATCHING
    };
  }

  /**
   * Detección usando solo BERT local
   */
  async detectWithBERT(text) {
    const config = getMethodConfig(DETECTION_METHODS.BERT);
    
    if (!isMethodEnabled(DETECTION_METHODS.BERT)) {
      throw new Error('BERT no está habilitado en la configuración');
    }

    const bertResult = await this.bertService.classifyIntent(text);
    
    // Filtrar por confianza mínima
    if (bertResult.confidence < config.config.minConfidence) {
      return {
        intent: null,
        confidence: bertResult.confidence,
        pattern: '',
        parameters: {},
        originalText: text,
        method: DETECTION_METHODS.BERT
      };
    }

    // Extraer parámetros usando pattern matching
    const intent = this.intentService.getIntent(bertResult.intent);
    const parameters = intent ? intent.extractParameters(text) : {};

    return {
      intent: bertResult.intent,
      confidence: bertResult.confidence,
      pattern: '',
      parameters: parameters,
      originalText: text,
      method: DETECTION_METHODS.BERT,
      bertMethod: bertResult.method,
      scores: bertResult.scores
    };
  }

  /**
   * Detección híbrida combinando ambos métodos
   */
  async detectWithHybrid(text) {
    const config = getMethodConfig(DETECTION_METHODS.HYBRID);
    
    // Obtener resultados de ambos métodos
    const [patternResult, bertResult] = await Promise.allSettled([
      this.detectWithPatternMatching(text),
      this.detectWithBERT(text)
    ]);

    const patternSuccess = patternResult.status === 'fulfilled';
    const bertSuccess = bertResult.status === 'fulfilled';
    
    const patternData = patternSuccess ? patternResult.value : null;
    const bertData = bertSuccess ? bertResult.value : null;

    // Lógica de decisión híbrida
    if (patternSuccess && bertSuccess) {
      // Ambos métodos funcionaron
      if (patternData.confidence >= config.config.patternThreshold) {
        // Pattern matching tiene alta confianza, usarlo
        return {
          ...patternData,
          method: DETECTION_METHODS.HYBRID,
          hybridDecision: 'pattern_high_confidence',
          bertConfidence: bertData.confidence,
          bertScores: bertData.scores
        };
      } else if (bertData.confidence >= config.config.bertThreshold) {
        // BERT tiene alta confianza, usarlo
        return {
          ...bertData,
          method: DETECTION_METHODS.HYBRID,
          hybridDecision: 'bert_high_confidence',
          patternConfidence: patternData.confidence
        };
      } else {
        // Usar el mejor de ambos
        const bestResult = patternData.confidence > bertData.confidence ? patternData : bertData;
        return {
          ...bestResult,
          method: DETECTION_METHODS.HYBRID,
          hybridDecision: 'best_of_both',
          patternConfidence: patternData.confidence,
          bertConfidence: bertData.confidence,
          bertScores: bertData.scores
        };
      }
    } else if (patternSuccess) {
      // Solo pattern matching funcionó
      return {
        ...patternData,
        method: DETECTION_METHODS.HYBRID,
        hybridDecision: 'pattern_fallback',
        bertError: bertResult.reason?.message
      };
    } else if (bertSuccess) {
      // Solo BERT funcionó
      return {
        ...bertData,
        method: DETECTION_METHODS.HYBRID,
        hybridDecision: 'bert_fallback',
        patternError: patternResult.reason?.message
      };
    } else {
      // Ningún método funcionó
      return {
        intent: null,
        confidence: 0,
        pattern: '',
        parameters: {},
        originalText: text,
        method: DETECTION_METHODS.HYBRID,
        hybridDecision: 'both_failed',
        patternError: patternResult.reason?.message,
        bertError: bertResult.reason?.message
      };
    }
  }

  /**
   * Obtiene información sobre los métodos disponibles
   */
  getAvailableMethods() {
    const methods = {};
    
    Object.keys(DETECTION_METHODS).forEach(key => {
      const method = DETECTION_METHODS[key];
      const config = getMethodConfig(method);
      
      methods[method] = {
        name: config.name,
        description: config.description,
        enabled: config.enabled,
        priority: config.priority,
        config: config.config
      };
    });
    
    return methods;
  }

  /**
   * Cambia el método por defecto
   */
  setDefaultMethod(method) {
    if (!isMethodEnabled(method)) {
      throw new Error(`Método ${method} no está habilitado`);
    }
    
    this.defaultMethod = method;
    console.log(`✅ Método por defecto cambiado a: ${method}`);
  }

  /**
   * Obtiene estadísticas de rendimiento
   */
  async getPerformanceStats() {
    const stats = {
      defaultMethod: this.defaultMethod,
      availableMethods: this.getAvailableMethods(),
      bertStatus: await this.bertService.getModelStatus()
    };
    
    return stats;
  }

  /**
   * Compara resultados de diferentes métodos
   */
  async compareMethods(text) {
    const results = {};
    
    for (const method of Object.values(DETECTION_METHODS)) {
      if (isMethodEnabled(method)) {
        try {
          const startTime = Date.now();
          const result = await this.detectIntent(text, method);
          const endTime = Date.now();
          
          results[method] = {
            ...result,
            executionTime: endTime - startTime
          };
        } catch (error) {
          results[method] = {
            error: error.message,
            executionTime: 0
          };
        }
      }
    }
    
    return results;
  }

  /**
   * Entrena el modelo BERT local
   */
  async trainBertModel(trainingData) {
    try {
      console.log('🔄 Iniciando entrenamiento del modelo BERT local...');
      const history = await this.bertService.trainModel(trainingData);
      console.log('✅ Entrenamiento completado');
      return history;
    } catch (error) {
      console.error('❌ Error entrenando modelo BERT:', error);
      throw error;
    }
  }

  /**
   * Obtiene datos de entrenamiento de ejemplo
   */
  getTrainingData() {
    return [
      // Datos de búsqueda
      { text: 'buscar laptop', intent: 'BUSQUEDA' },
      { text: 'encontrar smartphone', intent: 'BUSQUEDA' },
      { text: 'necesito una tablet', intent: 'BUSQUEDA' },
      { text: 'quiero comprar auriculares', intent: 'BUSQUEDA' },
      { text: 'busco un teclado', intent: 'BUSQUEDA' },
      
      // Datos de compra
      { text: 'comprar laptop', intent: 'COMPRA' },
      { text: 'adquirir smartphone', intent: 'COMPRA' },
      { text: 'pagar por tablet', intent: 'COMPRA' },
      { text: 'ordenar auriculares', intent: 'COMPRA' },
      { text: 'hacer pedido de teclado', intent: 'COMPRA' },
      
      // Datos de venta
      { text: 'vender laptop', intent: 'VENTA' },
      { text: 'ofrecer smartphone', intent: 'VENTA' },
      { text: 'publicar tablet', intent: 'VENTA' },
      { text: 'anunciar auriculares', intent: 'VENTA' },
      { text: 'poner en venta teclado', intent: 'VENTA' },
      
      // Datos de ayuda
      { text: 'ayuda', intent: 'AYUDA' },
      { text: 'necesito soporte', intent: 'AYUDA' },
      { text: 'tengo un problema', intent: 'AYUDA' },
      { text: 'error en el sistema', intent: 'AYUDA' },
      { text: 'no funciona', intent: 'AYUDA' },
      
      // Datos de saludo
      { text: 'hola', intent: 'SALUDO' },
      { text: 'buenos días', intent: 'SALUDO' },
      { text: 'qué tal', intent: 'SALUDO' },
      { text: 'cómo estás', intent: 'SALUDO' },
      { text: 'saludos', intent: 'SALUDO' },
      
      // Datos de despedida
      { text: 'adiós', intent: 'DESPEDIDA' },
      { text: 'hasta luego', intent: 'DESPEDIDA' },
      { text: 'nos vemos', intent: 'DESPEDIDA' },
      { text: 'gracias', intent: 'DESPEDIDA' },
      { text: 'muchas gracias', intent: 'DESPEDIDA' }
    ];
  }
}

module.exports = HybridIntentService; 