/**
 * Configuración de intenciones y patrones para el sistema de detección
 * Cada intención define patrones de texto y parámetros que se pueden extraer
 */

const INTENTS = {
  BUSQUEDA: {
    name: 'Búsqueda de Productos',
    description: 'Intención para buscar productos o servicios',
    patterns: [
      'buscar {nombre_producto}',
      'encontrar {nombre_producto}',
      'producto {nombre_producto}',
      'necesito {nombre_producto}',
      'quiero {nombre_producto}',
      'busco {nombre_producto}',
      'dónde encontrar {nombre_producto}',
      'cómo conseguir {nombre_producto}'
    ],
    parameters: {
      nombre_producto: {
        type: 'string',
        required: true,
        description: 'Nombre del producto a buscar'
      }
    },
    synonyms: {
      'buscar': ['encontrar', 'busco', 'necesito', 'quiero'],
      'producto': ['artículo', 'item', 'cosa', 'objeto']
    }
  },

  COMPRA: {
    name: 'Compra de Productos',
    description: 'Intención para realizar una compra',
    patterns: [
      'comprar {nombre_producto}',
      'adquirir {nombre_producto}',
      'pagar {nombre_producto}',
      'ordenar {nombre_producto}',
      'hacer pedido de {nombre_producto}',
      'quiero comprar {nombre_producto}',
      'necesito comprar {nombre_producto}',
      'deseo adquirir {nombre_producto}'
    ],
    parameters: {
      nombre_producto: {
        type: 'string',
        required: true,
        description: 'Nombre del producto a comprar'
      },
      cantidad: {
        type: 'number',
        required: false,
        description: 'Cantidad del producto',
        default: 1
      }
    },
    synonyms: {
      'comprar': ['adquirir', 'pagar', 'ordenar', 'pedir'],
      'producto': ['artículo', 'item', 'cosa', 'objeto']
    }
  },

  VENTA: {
    name: 'Venta de Productos',
    description: 'Intención para vender productos',
    patterns: [
      'vender {nombre_producto}',
      'poner en venta {nombre_producto}',
      'ofrecer {nombre_producto}',
      'publicar {nombre_producto}',
      'anunciar {nombre_producto}',
      'quiero vender {nombre_producto}',
      'necesito vender {nombre_producto}',
      'deseo vender {nombre_producto}'
    ],
    parameters: {
      nombre_producto: {
        type: 'string',
        required: true,
        description: 'Nombre del producto a vender'
      },
      precio: {
        type: 'number',
        required: false,
        description: 'Precio del producto'
      }
    },
    synonyms: {
      'vender': ['ofrecer', 'publicar', 'anunciar', 'poner en venta'],
      'producto': ['artículo', 'item', 'cosa', 'objeto']
    }
  },

  AYUDA: {
    name: 'Solicitud de Ayuda',
    description: 'Intención para solicitar ayuda o soporte',
    patterns: [
      'ayuda',
      'necesito ayuda',
      'soporte',
      'problema',
      'error',
      'no funciona',
      'tengo un problema',
      'puedes ayudarme',
      'cómo funciona',
      'instrucciones'
    ],
    parameters: {
      tema: {
        type: 'string',
        required: false,
        description: 'Tema específico sobre el que se necesita ayuda'
      }
    },
    synonyms: {
      'ayuda': ['soporte', 'asistencia', 'apoyo'],
      'problema': ['error', 'fallo', 'defecto', 'bug']
    }
  },

  SALUDO: {
    name: 'Saludo',
    description: 'Intención de saludo o presentación',
    patterns: [
      'hola',
      'buenos días',
      'buenas tardes',
      'buenas noches',
      'saludos',
      'qué tal',
      'cómo estás',
      'bienvenido',
      'hey',
      'hi'
    ],
    parameters: {},
    synonyms: {
      'hola': ['saludos', 'hey', 'hi', 'buenos días', 'buenas tardes', 'buenas noches']
    }
  },

  DESPEDIDA: {
    name: 'Despedida',
    description: 'Intención de despedida o cierre',
    patterns: [
      'adiós',
      'hasta luego',
      'nos vemos',
      'chao',
      'bye',
      'hasta la vista',
      'que tengas un buen día',
      'gracias',
      'muchas gracias'
    ],
    parameters: {},
    synonyms: {
      'adiós': ['hasta luego', 'nos vemos', 'chao', 'bye', 'hasta la vista']
    }
  },

  PRECIO: {
    name: 'Consulta de Precio',
    description: 'Intención para consultar precios',
    patterns: [
      'precio de {nombre_producto}',
      'cuánto cuesta {nombre_producto}',
      'valor de {nombre_producto}',
      'costo de {nombre_producto}',
      'cuál es el precio de {nombre_producto}',
      'qué precio tiene {nombre_producto}',
      'tarifa de {nombre_producto}'
    ],
    parameters: {
      nombre_producto: {
        type: 'string',
        required: true,
        description: 'Nombre del producto para consultar precio'
      }
    },
    synonyms: {
      'precio': ['costo', 'valor', 'tarifa', 'cuánto cuesta'],
      'producto': ['artículo', 'item', 'cosa', 'objeto']
    }
  },

  INFORMACION: {
    name: 'Solicitud de Información',
    description: 'Intención para solicitar información general',
    patterns: [
      'información sobre {tema}',
      'datos de {tema}',
      'detalles de {tema}',
      'qué es {tema}',
      'explica {tema}',
      'cuéntame sobre {tema}',
      'más información de {tema}'
    ],
    parameters: {
      tema: {
        type: 'string',
        required: true,
        description: 'Tema sobre el que se solicita información'
      }
    },
    synonyms: {
      'información': ['datos', 'detalles', 'explicación'],
      'sobre': ['acerca de', 'relacionado con', 'respecto a']
    }
  }
};

module.exports = {
  INTENTS,
  
  // Configuración adicional
  DEFAULT_CONFIDENCE_THRESHOLD: 0.5,
  MAX_TEXT_LENGTH: 1000,
  
  // Configuración de procesamiento
  PROCESSING: {
    caseSensitive: false,
    removePunctuation: true,
    normalizeAccents: true,
    maxPatternsPerIntent: 20
  }
}; 