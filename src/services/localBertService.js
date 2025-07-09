const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');

class LocalBertService {
  constructor() {
    this.model = null;
    this.tokenizer = null;
    this.isModelLoaded = false;
    this.modelPath = path.join(__dirname, '../../models/bert-model');
    this.vocabulary = this.buildVocabulary();
    
    this.loadModel();
  }

  /**
   * Construye vocabulario básico para las intenciones
   */
  buildVocabulary() {
    return {
      // Palabras de búsqueda
      'buscar': 1, 'encontrar': 2, 'busco': 3, 'necesito': 4, 'quiero': 5,
      'producto': 6, 'artículo': 7, 'item': 8, 'cosa': 9, 'objeto': 10,
      
      // Palabras de compra
      'comprar': 11, 'adquirir': 12, 'pagar': 13, 'ordenar': 14, 'pedir': 15,
      'compra': 16, 'adquisición': 17, 'pago': 18, 'pedido': 19,
      
      // Palabras de venta
      'vender': 20, 'ofrecer': 21, 'publicar': 22, 'anunciar': 23, 'poner': 24,
      'venta': 25, 'oferta': 26, 'publicación': 27, 'anuncio': 28,
      
      // Palabras de precio
      'precio': 29, 'costo': 30, 'valor': 31, 'tarifa': 32, 'cuánto': 33,
      'cuál': 34, 'qué': 35, 'cuesta': 36, 'vale': 37,
      
      // Palabras de ayuda
      'ayuda': 38, 'soporte': 39, 'problema': 40, 'error': 41, 'fallo': 42,
      'no funciona': 43, 'tengo un problema': 44, 'puedes ayudarme': 45,
      
      // Saludos
      'hola': 46, 'saludos': 47, 'hey': 48, 'hi': 49, 'buenos días': 50,
      'buenas tardes': 51, 'buenas noches': 52, 'qué tal': 53, 'cómo estás': 54,
      
      // Despedidas
      'adiós': 55, 'hasta luego': 56, 'nos vemos': 57, 'chao': 58, 'bye': 59,
      'hasta la vista': 60, 'gracias': 61, 'muchas gracias': 62,
      
      // Productos comunes
      'laptop': 63, 'computadora': 64, 'smartphone': 65, 'teléfono': 66,
      'tablet': 67, 'auriculares': 68, 'cascos': 69, 'mouse': 70, 'teclado': 71,
      'monitor': 72, 'pantalla': 73, 'impresora': 74, 'cámara': 75,
      
      // Palabras de información
      'información': 76, 'datos': 77, 'detalles': 78, 'explica': 79,
      'cuéntame': 80, 'más información': 81, 'qué es': 82,
      
      // Palabras de ubicación
      'dónde': 83, 'ubicación': 84, 'lugar': 85, 'dirección': 86,
      'cerca': 87, 'lejos': 88, 'aquí': 89, 'allí': 90,
      
      // Palabras de tiempo
      'cuándo': 91, 'hora': 92, 'fecha': 93, 'día': 94, 'semana': 95,
      'mes': 96, 'año': 97, 'ahora': 98, 'después': 99, 'antes': 100,
      
      // Palabras de cantidad
      'cuánto': 101, 'mucho': 102, 'poco': 103, 'varios': 104, 'algunos': 105,
      'todos': 106, 'ninguno': 107, 'uno': 108, 'dos': 109, 'tres': 110,
      
      // Palabras de calidad
      'bueno': 111, 'malo': 112, 'excelente': 113, 'terrible': 114,
      'mejor': 115, 'peor': 116, 'nuevo': 117, 'viejo': 118, 'usado': 119,
      
      // Palabras de acción
      'hacer': 120, 'crear': 121, 'modificar': 122, 'cambiar': 123,
      'eliminar': 124, 'borrar': 125, 'guardar': 126, 'enviar': 127,
      
      // Palabras de estado
      'activo': 128, 'inactivo': 129, 'disponible': 130, 'agotado': 131,
      'en stock': 132, 'sin stock': 133, 'reservado': 134, 'vendido': 135,
      
      // Palabras de contacto
      'contacto': 136, 'llamar': 137, 'email': 138, 'correo': 139,
      'mensaje': 140, 'whatsapp': 141, 'teléfono': 142, 'número': 143,
      
      // Palabras de negación
      'no': 144, 'nunca': 145, 'jamás': 146, 'tampoco': 147, 'ni': 148,
      
      // Palabras de afirmación
      'sí': 149, 'siempre': 150, 'también': 151, 'además': 152, 'y': 153,
      
      // Palabras de pregunta
      'qué': 154, 'cuál': 155, 'dónde': 156, 'cuándo': 157, 'cómo': 158,
      'por qué': 159, 'quién': 160, 'cuánto': 161, 'cuántos': 162,
      
      // Palabras de conexión
      'y': 163, 'o': 164, 'pero': 165, 'sin embargo': 166, 'aunque': 167,
      'porque': 168, 'entonces': 169, 'después': 170, 'antes': 171,
      
      // Palabras de tiempo
      'hoy': 172, 'mañana': 173, 'ayer': 174, 'ahora': 175, 'luego': 176,
      'pronto': 177, 'tarde': 178, 'temprano': 179, 'siempre': 180,
      
      // Palabras de lugar
      'aquí': 181, 'allí': 182, 'allá': 183, 'cerca': 184, 'lejos': 185,
      'dentro': 186, 'fuera': 187, 'arriba': 188, 'abajo': 189,
      
      // Palabras de modo
      'rápido': 190, 'lento': 191, 'fácil': 192, 'difícil': 193,
      'bien': 194, 'mal': 195, 'mejor': 196, 'peor': 197,
      
      // Palabras de cantidad
      'todo': 198, 'nada': 199, 'algo': 200, 'poco': 201, 'mucho': 202,
      'demasiado': 203, 'suficiente': 204, 'bastante': 205,
      
      // Palabras de frecuencia
      'siempre': 206, 'nunca': 207, 'a veces': 208, 'raramente': 209,
      'frecuentemente': 210, 'ocasionalmente': 211, 'diariamente': 212,
      
      // Palabras de comparación
      'más': 213, 'menos': 214, 'igual': 215, 'diferente': 216,
      'similar': 217, 'parecido': 218, 'distinto': 219, 'único': 220,
      
      // Palabras de orden
      'primero': 221, 'segundo': 222, 'tercero': 223, 'último': 224,
      'siguiente': 225, 'anterior': 226, 'próximo': 227, 'pasado': 228,
      
      // Palabras de tamaño
      'grande': 229, 'pequeño': 230, 'mediano': 231, 'enorme': 232,
      'minúsculo': 233, 'gigante': 234, 'compacto': 235, 'espacioso': 236,
      
      // Palabras de color
      'rojo': 237, 'azul': 238, 'verde': 239, 'amarillo': 240,
      'negro': 241, 'blanco': 242, 'gris': 243, 'rosa': 244,
      
      // Palabras de material
      'plástico': 245, 'metal': 246, 'madera': 247, 'vidrio': 248,
      'tela': 249, 'cuero': 250, 'aluminio': 251, 'acero': 252,
      
      // Palabras de marca
      'apple': 253, 'samsung': 254, 'sony': 255, 'lg': 256,
      'hp': 257, 'dell': 258, 'lenovo': 259, 'asus': 260,
      
      // Palabras de tecnología
      'wifi': 261, 'bluetooth': 262, 'usb': 263, 'hdmi': 264,
      'wireless': 265, 'inalámbrico': 266, 'cable': 267, 'conector': 268,
      
      // Palabras de estado
      'nuevo': 269, 'usado': 270, 'seminuevo': 271, 'reacondicionado': 272,
      'original': 273, 'genérico': 274, 'marca': 275, 'fabricante': 276,
      
      // Palabras de garantía
      'garantía': 277, 'warranty': 278, 'devolución': 279, 'reembolso': 280,
      'cambio': 281, 'reparación': 282, 'servicio': 283, 'técnico': 284,
      
      // Palabras de envío
      'envío': 285, 'entrega': 286, 'shipping': 287, 'delivery': 288,
      'gratis': 289, 'gratuito': 290, 'costo': 291, 'tarifa': 292,
      
      // Palabras de pago
      'efectivo': 293, 'tarjeta': 294, 'crédito': 295, 'débito': 296,
      'transferencia': 297, 'paypal': 298, 'bitcoin': 299,
      
      // Palabras de descuento
      'descuento': 300, 'oferta': 301, 'promoción': 302, 'rebaja': 303,
      'liquidación': 304, 'saldo': 305, 'clearance': 306, 'sale': 307,
      
      // Palabras de opinión
      'me gusta': 308, 'no me gusta': 309, 'recomiendo': 310, 'evito': 311,
      'excelente': 312, 'terrible': 313, 'bueno': 314, 'malo': 315,
      
      // Palabras de urgencia
      'urgente': 316, 'inmediato': 317, 'rápido': 318, 'pronto': 319,
      'ya': 320, 'ahora': 321, 'inmediatamente': 322, 'asap': 323,
      
      // Palabras de confirmación
      'confirmar': 324, 'verificar': 325, 'revisar': 326, 'chequear': 327,
      'validar': 328, 'aprobar': 329, 'aceptar': 330, 'rechazar': 331,
      
      // Palabras de cancelación
      'cancelar': 332, 'anular': 333, 'suspender': 334, 'parar': 335,
      'terminar': 336, 'finalizar': 337, 'concluir': 338, 'acabar': 339,
      
      // Palabras de inicio
      'iniciar': 340, 'empezar': 341, 'comenzar': 342, 'arrancar': 343,
      'poner en marcha': 344, 'activar': 345, 'encender': 346, 'prender': 347,
      
      // Palabras de parada
      'parar': 348, 'detener': 349, 'frenar': 350, 'interrumpir': 351,
      'pausar': 352, 'suspender': 353, 'apagar': 354, 'desactivar': 355,
      
      // Palabras de configuración
      'configurar': 356, 'ajustar': 357, 'personalizar': 358, 'modificar': 359,
      'cambiar': 360, 'adaptar': 361, 'optimizar': 362, 'mejorar': 363,
      
      // Palabras de instalación
      'instalar': 364, 'montar': 365, 'colocar': 366, 'poner': 367,
      'conectar': 368, 'enchufar': 369, 'acoplar': 370, 'fijar': 371,
      
      // Palabras de desinstalación
      'desinstalar': 372, 'quitar': 373, 'remover': 374, 'sacar': 375,
      'desconectar': 376, 'desenchufar': 377, 'separar': 378, 'liberar': 379,
      
      // Palabras de actualización
      'actualizar': 380, 'upgrade': 381, 'mejorar': 382, 'renovar': 383,
      'modernizar': 384, 'evolucionar': 385, 'progresar': 386, 'avanzar': 387,
      
      // Palabras de retroceso
      'retroceder': 388, 'volver': 389, 'regresar': 390, 'devolver': 391,
      'revertir': 392, 'deshacer': 393, 'cancelar': 394, 'anular': 395,
      
      // Palabras de progreso
      'progreso': 396, 'avance': 397, 'desarrollo': 398, 'evolución': 399,
      'mejora': 400, 'crecimiento': 401, 'expansión': 402, 'ampliación': 403,
      
      // Palabras de reducción
      'reducción': 404, 'disminución': 405, 'decrecimiento': 406, 'contracción': 407,
      'minimización': 408, 'optimización': 409, 'simplificación': 410, 'streamlining': 411,
      
      // Palabras de éxito
      'éxito': 412, 'logro': 413, 'conquista': 414, 'victoria': 415,
      'triunfo': 416, 'realización': 417, 'cumplimiento': 418,
      
      // Palabras de fracaso
      'fracaso': 419, 'fallo': 420, 'error': 421, 'defecto': 422,
      'problema': 423, 'dificultad': 424, 'obstáculo': 425, 'impedimento': 426,
      
      // Palabras de solución
      'solución': 427, 'respuesta': 428, 'remedio': 429, 'cura': 430,
      'arreglo': 431, 'reparación': 432, 'corrección': 433, 'ajuste': 434,
      
      // Palabras de problema
      'problema': 435, 'issue': 436, 'bug': 437, 'defecto': 438, 'falla': 439
    };
  }

  /**
   * Carga el modelo BERT local
   */
  async loadModel() {
    try {
      console.log('🔄 Cargando modelo BERT local...');
      
      // Crear modelo simple para clasificación de intenciones
      this.model = tf.sequential({
        layers: [
          // Capa de embedding
          tf.layers.embedding({
            inputDim: Object.keys(this.vocabulary).length + 1, // +1 para tokens desconocidos
            outputDim: 32, // Reducido para mejor rendimiento
            inputLength: 10, // Longitud máxima reducida
            name: 'embedding'
          }),
          
          // Capa de pooling global
          tf.layers.globalAveragePooling1d({
            name: 'global_pooling'
          }),
          
          // Capa densa oculta
          tf.layers.dense({
            units: 64, // Reducido
            activation: 'relu',
            name: 'hidden_dense'
          }),
          
          // Dropout para regularización
          tf.layers.dropout({
            rate: 0.2, // Reducido
            name: 'dropout'
          }),
          
          // Capa de salida (6 intenciones)
          tf.layers.dense({
            units: 6, // BUSQUEDA, COMPRA, VENTA, AYUDA, SALUDO, DESPEDIDA
            activation: 'softmax',
            name: 'output_dense'
          })
        ]
      });

      // Compilar el modelo
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // Intentar cargar pesos pre-entrenados si existen
      try {
        if (fs.existsSync(path.join(this.modelPath, 'model.json'))) {
          await this.model.loadWeights(`file://${this.modelPath}/model.json`);
          console.log('✅ Pesos del modelo cargados desde archivo local');
        } else {
          console.log('⚠️ No se encontraron pesos pre-entrenados, usando modelo inicializado');
        }
      } catch (loadError) {
        console.log('⚠️ Error cargando pesos, usando modelo inicializado:', loadError.message);
      }

      this.isModelLoaded = true;
      console.log('✅ Modelo BERT local cargado exitosamente');

    } catch (error) {
      console.error('❌ Error cargando modelo BERT local:', error);
      this.isModelLoaded = false;
    }
  }

  /**
   * Tokeniza el texto de entrada
   */
  tokenizeText(text) {
    const words = text.toLowerCase().split(/\s+/);
    const maxVocabIndex = Object.keys(this.vocabulary).length;
    
    const tokenIds = words.map(word => {
      // Buscar palabra exacta
      if (this.vocabulary[word]) {
        const id = this.vocabulary[word];
        // Verificar que el índice esté dentro del rango válido
        return (id >= 0 && id <= maxVocabIndex) ? id : 0;
      }
      
      // Buscar palabras que contengan la palabra (con validación de rango)
      for (const [vocabWord, id] of Object.entries(this.vocabulary)) {
        if ((vocabWord.includes(word) || word.includes(vocabWord)) && 
            id >= 0 && id <= maxVocabIndex) {
          return id;
        }
      }
      
      // Token desconocido
      return 0;
    });

    // Padding/truncating a longitud 10 (reducida)
    const maxLength = 10;
    while (tokenIds.length < maxLength) {
      tokenIds.push(0); // Padding
    }
    
    if (tokenIds.length > maxLength) {
      tokenIds.splice(maxLength); // Truncating
    }

    return tokenIds;
  }

  /**
   * Clasifica la intención del texto
   */
  async classifyIntent(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Texto de entrada inválido');
      }

      if (!this.isModelLoaded) {
        throw new Error('Modelo BERT no está cargado');
      }

      // Tokenizar texto
      const tokens = this.tokenizeText(text);
      
      // Convertir a tensor
      const inputTensor = tf.tensor2d([tokens], [1, 10]); // Longitud reducida
      
      // Predicción
      const prediction = this.model.predict(inputTensor);
      const scores = await prediction.array();
      
      // Obtener la intención con mayor probabilidad
      const intentLabels = ['BUSQUEDA', 'COMPRA', 'VENTA', 'AYUDA', 'SALUDO', 'DESPEDIDA'];
      const maxIndex = scores[0].indexOf(Math.max(...scores[0]));
      const confidence = scores[0][maxIndex];
      
      // Limpiar tensores
      inputTensor.dispose();
      prediction.dispose();

      return {
        intent: intentLabels[maxIndex] || 'none',
        confidence: confidence,
        method: 'local_bert',
        scores: scores[0]
      };

    } catch (error) {
      console.error('Error en classifyIntent (local):', error);
      return {
        intent: 'none',
        confidence: 0,
        method: 'local_bert_error',
        error: error.message
      };
    }
  }

  /**
   * Entrena el modelo con datos de ejemplo
   */
  async trainModel(trainingData) {
    try {
      console.log('🔄 Iniciando entrenamiento del modelo local...');
      
      if (!this.isModelLoaded) {
        throw new Error('Modelo no está cargado');
      }

      // Preparar datos de entrenamiento
      const { inputs, labels } = this.prepareTrainingData(trainingData);
      
      // Entrenar el modelo
      const history = await this.model.fit(inputs, labels, {
        epochs: 20, // Reducido para entrenamiento más rápido
        batchSize: 16, // Reducido
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            try {
              console.log(`Época ${epoch + 1} completada`);
              
              if (logs && typeof logs === 'object') {
                const loss = (logs.loss && typeof logs.loss === 'number') ? logs.loss.toFixed(4) : 'N/A';
                const acc = (logs.acc && typeof logs.acc === 'number') ? logs.acc.toFixed(4) : 
                           (logs.accuracy && typeof logs.accuracy === 'number') ? logs.accuracy.toFixed(4) : 'N/A';
                
                console.log(`  Loss: ${loss}, Accuracy: ${acc}`);
                
                // Mostrar todas las métricas disponibles
                const availableMetrics = Object.keys(logs).filter(key => typeof logs[key] === 'number');
                if (availableMetrics.length > 0) {
                  console.log(`  Métricas disponibles: ${availableMetrics.join(', ')}`);
                }
              } else {
                console.log(`  No hay métricas disponibles en esta época`);
              }
            } catch (error) {
              console.log(`  Error en callback de época ${epoch + 1}:`, error.message);
            }
          }
        }
      });

      // Guardar el modelo
      await this.saveModel();
      
      console.log('✅ Entrenamiento completado');
      return history;

    } catch (error) {
      console.error('Error entrenando modelo:', error);
      throw error;
    }
  }

  /**
   * Prepara datos de entrenamiento
   */
  prepareTrainingData(trainingData) {
    const inputs = [];
    const labels = [];
    
    const intentLabels = ['BUSQUEDA', 'COMPRA', 'VENTA', 'AYUDA', 'SALUDO', 'DESPEDIDA'];
    
    trainingData.forEach(item => {
      try {
        const tokens = this.tokenizeText(item.text);
        inputs.push(tokens);
        
        // Crear etiqueta one-hot
        const labelIndex = intentLabels.indexOf(item.intent);
        const label = new Array(6).fill(0);
        if (labelIndex >= 0) {
          label[labelIndex] = 1;
        }
        labels.push(label);
      } catch (error) {
        console.warn(`Error procesando item: ${item.text}`, error.message);
      }
    });

    return {
      inputs: tf.tensor2d(inputs),
      labels: tf.tensor2d(labels)
    };
  }

  /**
   * Guarda el modelo entrenado
   */
  async saveModel() {
    try {
      // Crear directorio si no existe
      if (!fs.existsSync(this.modelPath)) {
        fs.mkdirSync(this.modelPath, { recursive: true });
      }
      
      // Guardar modelo
      await this.model.save(`file://${this.modelPath}`);
      console.log('✅ Modelo guardado en:', this.modelPath);
      
    } catch (error) {
      console.error('Error guardando modelo:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado del modelo
   */
  async getModelStatus() {
    return {
      isModelLoaded: this.isModelLoaded,
      modelPath: this.modelPath,
      vocabularySize: Object.keys(this.vocabulary).length,
      modelExists: fs.existsSync(this.modelPath),
      error: null
    };
  }
}

module.exports = LocalBertService; 