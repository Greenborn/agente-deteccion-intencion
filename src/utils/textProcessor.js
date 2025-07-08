const natural = require('natural');

class TextProcessor {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  /**
   * Procesa el texto de entrada para normalizarlo
   */
  process(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Texto de entrada inválido');
    }

    let processedText = text;

    // Convertir a minúsculas
    processedText = processedText.toLowerCase();

    // Normalizar acentos
    processedText = this.normalizeAccents(processedText);

    // Remover puntuación
    processedText = this.removePunctuation(processedText);

    // Remover espacios extra
    processedText = this.normalizeWhitespace(processedText);

    // Tokenización
    const tokens = this.tokenize(processedText);

    // Stemming
    const stemmedTokens = this.stem(tokens);

    // Reconstruir texto
    processedText = stemmedTokens.join(' ');

    return processedText.trim();
  }

  /**
   * Normaliza acentos y caracteres especiales
   */
  normalizeAccents(text) {
    const accentMap = {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
      'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
      'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
      'ñ': 'n', 'ç': 'c'
    };

    return text.replace(/[áàäéèëíìïóòöúùüñç]/g, match => accentMap[match] || match);
  }

  /**
   * Remueve puntuación del texto
   */
  removePunctuation(text) {
    return text.replace(/[^\w\s]/g, ' ');
  }

  /**
   * Normaliza espacios en blanco
   */
  normalizeWhitespace(text) {
    return text.replace(/\s+/g, ' ');
  }

  /**
   * Tokeniza el texto en palabras
   */
  tokenize(text) {
    return this.tokenizer.tokenize(text) || [];
  }

  /**
   * Aplica stemming a los tokens
   */
  stem(tokens) {
    return tokens.map(token => this.stemmer.stem(token));
  }

  /**
   * Extrae palabras clave del texto
   */
  extractKeywords(text, maxKeywords = 10) {
    const processedText = this.process(text);
    const tokens = this.tokenize(processedText);
    
    // Filtrar stop words
    const filteredTokens = this.removeStopWords(tokens);
    
    // Contar frecuencia
    const frequency = {};
    filteredTokens.forEach(token => {
      frequency[token] = (frequency[token] || 0) + 1;
    });

    // Ordenar por frecuencia
    const sortedKeywords = Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);

    return sortedKeywords;
  }

  /**
   * Remueve stop words del español
   */
  removeStopWords(tokens) {
    const stopWords = new Set([
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'una', 'como', 'pero', 'sus', 'me', 'hasta', 'hay', 'donde', 'han', 'quien', 'están', 'estado', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros'
    ]);

    return tokens.filter(token => !stopWords.has(token.toLowerCase()));
  }

  /**
   * Calcula la similitud entre dos textos
   */
  calculateSimilarity(text1, text2) {
    const processed1 = this.process(text1);
    const processed2 = this.process(text2);

    const tokens1 = new Set(this.tokenize(processed1));
    const tokens2 = new Set(this.tokenize(processed2));

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Detecta el idioma del texto (implementación básica)
   */
  detectLanguage(text) {
    // Implementación básica - en producción usar librería especializada
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se'];
    const englishWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to'];
    
    const words = this.tokenize(text.toLowerCase());
    let spanishCount = 0;
    let englishCount = 0;

    words.forEach(word => {
      if (spanishWords.includes(word)) spanishCount++;
      if (englishWords.includes(word)) englishCount++;
    });

    if (spanishCount > englishCount) return 'es';
    if (englishCount > spanishCount) return 'en';
    return 'unknown';
  }

  /**
   * Limpia y valida el texto de entrada
   */
  validateAndClean(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('El texto debe ser una cadena no vacía');
    }

    // Remover caracteres de control
    let cleaned = text.replace(/[\x00-\x1F\x7F]/g, '');

    // Limitar longitud
    const maxLength = 1000;
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }

    return cleaned.trim();
  }

  /**
   * Extrae entidades nombradas básicas (implementación simple)
   */
  extractNamedEntities(text) {
    const entities = [];
    const words = this.tokenize(text);

    // Detectar nombres propios (palabras que empiezan con mayúscula)
    words.forEach((word, index) => {
      if (/^[A-Z]/.test(word)) {
        entities.push({
          text: word,
          type: 'PERSON',
          position: index
        });
      }
    });

    // Detectar números
    const numberPattern = /\d+/g;
    let match;
    while ((match = numberPattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'NUMBER',
        position: match.index
      });
    }

    return entities;
  }
}

module.exports = TextProcessor; 