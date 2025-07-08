const express = require('express');
const intentController = require('../controllers/intentController');
const validation = require('../middleware/validation');

const router = express.Router();

/**
 * @route POST /api/detect-intent
 * @desc Detecta intención y extrae parámetros del texto de entrada
 * @access Public
 */
router.post('/detect-intent', validation.validateIntentRequest, intentController.detectIntent);

/**
 * @route GET /api/intents
 * @desc Obtiene lista de intenciones disponibles
 * @access Public
 */
router.get('/intents', intentController.getIntents);

/**
 * @route POST /api/train
 * @desc Entrena el modelo con nuevos datos
 * @access Private (requiere autenticación)
 */
router.post('/train', intentController.trainModel);

/**
 * @route GET /api/status
 * @desc Obtiene el estado del modelo y servicio
 * @access Public
 */
router.get('/status', intentController.getStatus);

module.exports = router; 