/**
 * Configuración de métodos de detección de intenciones
 * Permite elegir entre diferentes algoritmos de detección
 */

const DETECTION_METHODS = {
  PATTERN_MATCHING: 'pattern_matching',
  BERT: 'bert',
  HYBRID: 'hybrid'
};

const DETECTION_CONFIG = {
  // Método por defecto
  defaultMethod: process.env.DETECTION_METHOD || DETECTION_METHODS.HYBRID,
  
  // Configuración para cada método
  methods: {
    [DETECTION_METHODS.PATTERN_MATCHING]: {
      name: 'Pattern Matching',
      description: 'Detección basada en patrones de texto predefinidos',
      enabled: true,
      priority: 1,
      config: {
        minConfidence: 0.3,
        useSynonyms: true,
        caseSensitive: false
      }
    },
    
    [DETECTION_METHODS.BERT]: {
      name: 'BERT Local (TensorFlow.js)',
      description: 'Detección usando modelo BERT local entrenado',
      enabled: true, // Habilitado por defecto para BERT local
      priority: 2,
      config: {
        minConfidence: 0.4, // Umbral más bajo para BERT local
        modelName: 'bert-local',
        useLocalModel: true,
        vocabularySize: 500
      }
    },
    
    [DETECTION_METHODS.HYBRID]: {
      name: 'Híbrido (Pattern + BERT Local)',
      description: 'Combina pattern matching con BERT local para máxima precisión',
      enabled: true,
      priority: 3,
      config: {
        patternThreshold: 0.7,  // Si pattern matching > 0.7, usar solo pattern
        bertThreshold: 0.6,     // Umbral más bajo para BERT local
        fallbackToPattern: true // Si BERT falla, usar pattern matching
      }
    }
  }
};

/**
 * Obtiene la configuración de un método específico
 */
function getMethodConfig(method) {
  return DETECTION_CONFIG.methods[method] || null;
}

/**
 * Obtiene todos los métodos habilitados
 */
function getEnabledMethods() {
  return Object.keys(DETECTION_CONFIG.methods).filter(method => 
    DETECTION_CONFIG.methods[method].enabled
  );
}

/**
 * Obtiene el método por defecto
 */
function getDefaultMethod() {
  return DETECTION_CONFIG.defaultMethod;
}

/**
 * Valida si un método está habilitado
 */
function isMethodEnabled(method) {
  const config = getMethodConfig(method);
  return config && config.enabled;
}

/**
 * Obtiene la prioridad de un método
 */
function getMethodPriority(method) {
  const config = getMethodConfig(method);
  return config ? config.priority : 999;
}

/**
 * Obtiene métodos ordenados por prioridad
 */
function getMethodsByPriority() {
  return getEnabledMethods().sort((a, b) => 
    getMethodPriority(a) - getMethodPriority(b)
  );
}

module.exports = {
  DETECTION_METHODS,
  DETECTION_CONFIG,
  getMethodConfig,
  getEnabledMethods,
  getDefaultMethod,
  isMethodEnabled,
  getMethodPriority,
  getMethodsByPriority
}; 