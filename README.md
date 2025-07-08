# Agente de Detección de Intención

Este proyecto implementa un sistema de detección de intenciones y extracción de parámetros a partir de texto en lenguaje natural. Utiliza patrones configurables y permite la integración de modelos BERT para tareas avanzadas de NLP.

## Características principales
- Detección de intenciones a partir de frases de usuario.
- Extracción de parámetros (entidades) desde el texto.
- Configuración flexible de intenciones, patrones y parámetros.
- Soporte para integración con modelos BERT (opcional).
- Tests unitarios y de integración incluidos.

## Requisitos
- Node.js >= 14
- npm

## Instalación

1. Clona el repositorio y entra al directorio del proyecto:
   ```bash
   git clone <URL_DEL_REPO>
   cd agente-deteccion-intencion
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```

## Uso rápido (demo)

Puedes ejecutar una demo de prueba con ejemplos de frases:

```bash
node test-demo.js
```

Esto mostrará cómo el sistema detecta intenciones y extrae parámetros de varios ejemplos.

## Ejecutar el servidor

### Desarrollo (con nodemon)
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor se iniciará en `http://localhost:3000`

## API REST

### Detectar intención
**POST** `/api/detect-intent`

```bash
curl -X POST http://localhost:3000/api/detect-intent \
  -H "Content-Type: application/json" \
  -d '{"text": "buscar laptop gaming"}'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "intent": "BUSQUEDA",
    "confidence": 1,
    "pattern": "buscar {nombre_producto}",
    "parameters": {
      "nombre_producto": "laptop gaming"
    },
    "originalText": "buscar laptop gaming"
  }
}
```

### Obtener intenciones disponibles
**GET** `/api/intents`

```bash
curl http://localhost:3000/api/intents
```

### Health check
**GET** `/health`

```bash
curl http://localhost:3000/health
```

### Test con interfaz web
Abre el archivo `test-api.html` en tu navegador para probar la API de forma interactiva.

## Ejecutar tests

Para correr los tests unitarios y de integración:

```bash
npm test
```

## Ejemplos de uso

### Uso básico programático

```javascript
const IntentService = require('./src/services/intentService');

// Inicializar el servicio
const intentService = new IntentService();

// Detectar intención y extraer parámetros
const text = "buscar laptop gaming";
const matchingIntents = intentService.findMatchingIntents(text);

if (matchingIntents.length > 0) {
  const bestMatch = matchingIntents[0];
  const intent = intentService.getIntent(bestMatch.intentId);
  const parameters = intent.extractParameters(text);
  
  console.log('Intención detectada:', bestMatch.intentId);
  console.log('Confianza:', bestMatch.confidence);
  console.log('Parámetros:', parameters);
  // Output:
  // Intención detectada: BUSQUEDA
  // Confianza: 1
  // Parámetros: { nombre_producto: 'laptop gaming' }
}
```

### Ejemplos de frases y resultados esperados

| Frase de entrada | Intención | Parámetros extraídos |
|------------------|-----------|---------------------|
| "buscar laptop gaming" | BUSQUEDA | `{ nombre_producto: 'laptop gaming' }` |
| "comprar 3 auriculares" | COMPRA | `{ nombre_producto: '3 auriculares' }` |
| "precio de smartphone" | PRECIO | `{ nombre_producto: 'smartphone' }` |
| "información sobre tablets" | INFORMACION | `{ tema: 'tablets' }` |
| "hola" | SALUDO | `{}` (sin parámetros) |
| "adiós" | DESPEDIDA | `{}` (sin parámetros) |

## Estructura principal
- `src/models/intent.js`: Lógica y validación de intenciones.
- `src/services/intentService.js`: Servicio para gestionar y buscar intenciones.
- `src/utils/parameterExtractor.js`: Utilidad para extracción de parámetros.
- `config/intents.js`: Configuración de intenciones, patrones y parámetros.
- `test-demo.js`: Script de demostración interactiva.
- `tests/`: Carpeta con tests unitarios y de integración.

## Personalización
Puedes modificar o agregar intenciones y patrones editando el archivo `config/intents.js`.

## Notas
- Si deseas usar modelos BERT, consulta la carpeta `models/bert-model/` y su README para instrucciones específicas.
- Los archivos grandes de modelos y datos están excluidos del control de versiones por defecto.

---

¿Dudas o sugerencias? ¡No dudes en consultar o contribuir! 