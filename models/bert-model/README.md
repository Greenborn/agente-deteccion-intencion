# Modelos BERT

Este directorio está destinado para almacenar modelos BERT entrenados y pre-entrenados utilizados por el sistema de detección de intenciones.

## Estructura Recomendada

```
bert-model/
├── README.md                    # Este archivo
├── pre-trained/                 # Modelos pre-entrenados
│   ├── bert-base-spanish/      # Modelo BERT base en español
│   ├── bert-base-multilingual/ # Modelo BERT multilingüe
│   └── distilbert-base/        # Modelo DistilBERT (más ligero)
├── fine-tuned/                  # Modelos fine-tuned
│   ├── intent-detection-es/    # Modelo entrenado para intenciones en español
│   └── intent-detection-en/    # Modelo entrenado para intenciones en inglés
├── config/                      # Configuraciones de modelos
│   ├── bert-config.json        # Configuración base
│   └── intent-config.json      # Configuración específica para intenciones
└── .gitignore                  # Ignorar archivos grandes
```

## Modelos Recomendados

### 1. Modelos Pre-entrenados

#### BERT Base Multilingual
- **Modelo**: `bert-base-multilingual-cased`
- **Tamaño**: ~1.1GB
- **Idiomas**: 104 idiomas incluyendo español
- **Uso**: Clasificación general de intenciones

#### DistilBERT Multilingual
- **Modelo**: `distilbert-base-multilingual-cased`
- **Tamaño**: ~500MB
- **Idiomas**: 104 idiomas
- **Uso**: Versión más rápida y ligera

#### BERT Base Spanish
- **Modelo**: `dccuchile/bert-base-spanish-wwm-cased`
- **Tamaño**: ~1.1GB
- **Idiomas**: Español
- **Uso**: Optimizado para español

### 2. Modelos Fine-tuned

Los modelos fine-tuned se crean entrenando los modelos pre-entrenados con datos específicos de intenciones.

## Descarga de Modelos

### Opción 1: Descarga Automática
El sistema descargará automáticamente los modelos cuando sea necesario:

```javascript
// En bertService.js
const model = await tf.loadLayersModel('https://huggingface.co/bert-base-multilingual-cased');
```

### Opción 2: Descarga Manual
Puedes descargar los modelos manualmente:

```bash
# Crear directorio para modelos
mkdir -p models/bert-model/pre-trained

# Descargar modelo BERT multilingüe
wget https://huggingface.co/bert-base-multilingual-cased/resolve/main/pytorch_model.bin
wget https://huggingface.co/bert-base-multilingual-cased/resolve/main/config.json
wget https://huggingface.co/bert-base-multilingual-cased/resolve/main/vocab.txt
```

### Opción 3: Usando Hugging Face CLI
```bash
# Instalar transformers
pip install transformers

# Descargar modelo
python -c "from transformers import AutoTokenizer, AutoModel; AutoTokenizer.from_pretrained('bert-base-multilingual-cased', cache_dir='./models/bert-model/pre-trained'); AutoModel.from_pretrained('bert-base-multilingual-cased', cache_dir='./models/bert-model/pre-trained')"
```

## Configuración

### Configuración en bert.js
```javascript
// src/config/bert.js
const BERT_CONFIG = {
  modelPath: './models/bert-model/pre-trained/bert-base-multilingual-cased',
  maxLength: 512,
  batchSize: 32,
  learningRate: 2e-5,
  epochs: 3
};
```

### Variables de Entorno
```bash
# .env
BERT_MODEL_PATH=./models/bert-model/pre-trained/bert-base-multilingual-cased
BERT_MAX_LENGTH=512
BERT_BATCH_SIZE=32
```

## Entrenamiento de Modelos

### 1. Preparar Datos
```javascript
// Preparar datos de entrenamiento
const trainingData = [
  { text: "buscar laptop", intent: "BUSQUEDA" },
  { text: "hola", intent: "SALUDO" },
  // ... más ejemplos
];
```

### 2. Fine-tuning
```javascript
// Entrenar modelo
const bertService = new BertService();
await bertService.fineTune(trainingData, {
  epochs: 3,
  batchSize: 16,
  learningRate: 2e-5
});
```

### 3. Guardar Modelo
```javascript
// Guardar modelo entrenado
await bertService.saveModel('./models/bert-model/fine-tuned/intent-detection-es');
```

## Uso en Producción

### Cargar Modelo
```javascript
const bertService = new BertService();
await bertService.loadModel('./models/bert-model/fine-tuned/intent-detection-es');
```

### Predicción
```javascript
const result = await bertService.predict("buscar laptop gaming");
console.log(result);
// { intent: "BUSQUEDA", confidence: 0.95, parameters: {...} }
```

## Optimización

### 1. Modelo Cuantizado
Para reducir el tamaño del modelo:
```javascript
// Cuantizar modelo
await bertService.quantizeModel();
```

### 2. Modelo Optimizado
Para mejorar el rendimiento:
```javascript
// Optimizar modelo
await bertService.optimizeModel();
```

### 3. Caché de Embeddings
```javascript
// Habilitar caché
bertService.enableEmbeddingCache();
```

## Monitoreo

### Métricas de Rendimiento
- **Precisión**: Porcentaje de predicciones correctas
- **Recall**: Porcentaje de intenciones detectadas correctamente
- **F1-Score**: Media armónica de precisión y recall
- **Latencia**: Tiempo de respuesta promedio

### Logs
```javascript
// Habilitar logging detallado
bertService.enableDetailedLogging();
```

## Troubleshooting

### Error: Modelo no encontrado
```bash
# Verificar que el modelo existe
ls -la models/bert-model/pre-trained/
```

### Error: Memoria insuficiente
```javascript
// Reducir batch size
const config = { batchSize: 8 };
```

### Error: GPU no disponible
```javascript
// Forzar uso de CPU
const config = { device: 'cpu' };
```

## Recursos Adicionales

- [Documentación de Transformers](https://huggingface.co/docs/transformers/)
- [Modelos BERT en Hugging Face](https://huggingface.co/models?search=bert)
- [Fine-tuning BERT](https://huggingface.co/docs/transformers/training)
- [Optimización de Modelos](https://huggingface.co/docs/transformers/performance)

## Notas Importantes

1. **Tamaño de archivos**: Los modelos BERT pueden ser muy grandes (1GB+). Considera usar `.gitignore` para no subirlos al repositorio.

2. **Licencias**: Verifica las licencias de los modelos antes de usarlos en producción.

3. **Idiomas**: Asegúrate de usar el modelo correcto para el idioma de tu aplicación.

4. **Rendimiento**: Los modelos más grandes son más precisos pero más lentos. Encuentra el balance adecuado.

5. **Actualizaciones**: Los modelos se actualizan regularmente. Considera actualizar periódicamente. 