const request = require('supertest');
const express = require('express');
const app = require('../../src/index');

describe('API Integration Tests', () => {
  describe('POST /api/detect-intent', () => {
    test('should detect BUSQUEDA intent', async () => {
      const response = await request(app)
        .post('/api/detect-intent')
        .send({
          text: 'buscar laptop gaming'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.command).toBe('BUSQUEDA');
      expect(response.body.data.params_list).toHaveProperty('nombre_producto');
      expect(response.body.data.confidence).toBeGreaterThan(0.8);
    });

    test('should detect SALUDO intent', async () => {
      const response = await request(app)
        .post('/api/detect-intent')
        .send({
          text: 'hola'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.command).toBe('SALUDO');
      expect(response.body.data.params_list).toEqual({});
      expect(response.body.data.confidence).toBeGreaterThan(0.9);
    });

    test('should return none for unknown text', async () => {
      const response = await request(app)
        .post('/api/detect-intent')
        .send({
          text: 'texto sin sentido aleatorio'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.command).toBe('none');
      expect(response.body.data.confidence).toBeLessThan(0.5);
    });

    test('should validate required text field', async () => {
      const response = await request(app)
        .post('/api/detect-intent')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details).toBeDefined();
    });

    test('should validate text length', async () => {
      const longText = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/detect-intent')
        .send({
          text: longText
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    test('should handle options parameter', async () => {
      const response = await request(app)
        .post('/api/detect-intent')
        .send({
          text: 'buscar laptop',
          options: {
            confidence_threshold: 0.7,
            include_alternatives: true,
            max_alternatives: 2
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.command).toBe('BUSQUEDA');
      expect(response.body.data.alternatives).toBeDefined();
    });
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /api/intents', () => {
    test('should return all intents', async () => {
      const response = await request(app)
        .get('/api/intents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.intents).toBeDefined();
      expect(Array.isArray(response.body.data.intents)).toBe(true);
      expect(response.body.data.intents.length).toBeGreaterThan(0);
    });

    test('should return intent by id', async () => {
      const response = await request(app)
        .get('/api/intents/BUSQUEDA')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.intent.id).toBe('BUSQUEDA');
      expect(response.body.data.intent.patterns).toBeDefined();
    });

    test('should return 404 for non-existent intent', async () => {
      const response = await request(app)
        .get('/api/intents/NONEXISTENT')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('POST /api/intents', () => {
    test('should create new intent', async () => {
      const newIntent = {
        id: 'TEST_INTENT',
        name: 'Test Intent',
        patterns: ['test {param}'],
        parameters: {
          param: { type: 'string', required: true }
        }
      };

      const response = await request(app)
        .post('/api/intents')
        .send(newIntent)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.intent.id).toBe('TEST_INTENT');
    });

    test('should validate intent data', async () => {
      const invalidIntent = {
        name: 'Invalid Intent'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/intents')
        .send(invalidIntent)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/intents/:id', () => {
    test('should update existing intent', async () => {
      const updatedIntent = {
        id: 'BUSQUEDA',
        name: 'Búsqueda Actualizada',
        patterns: ['buscar {producto}', 'encontrar {producto}', 'necesito {producto}'],
        parameters: {
          producto: { type: 'string', required: true }
        }
      };

      const response = await request(app)
        .put('/api/intents/BUSQUEDA')
        .send(updatedIntent)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.intent.name).toBe('Búsqueda Actualizada');
      expect(response.body.data.intent.patterns).toHaveLength(3);
    });

    test('should return 404 for non-existent intent', async () => {
      const response = await request(app)
        .put('/api/intents/NONEXISTENT')
        .send({})
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('DELETE /api/intents/:id', () => {
    test('should delete intent', async () => {
      // First create a test intent
      const testIntent = {
        id: 'DELETE_TEST',
        name: 'Delete Test',
        patterns: ['delete test']
      };

      await request(app)
        .post('/api/intents')
        .send(testIntent)
        .expect(201);

      // Then delete it
      const response = await request(app)
        .delete('/api/intents/DELETE_TEST')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminada');
    });

    test('should return 404 for non-existent intent', async () => {
      const response = await request(app)
        .delete('/api/intents/NONEXISTENT')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('POST /api/train', () => {
    test('should train model with new data', async () => {
      const trainingData = {
        intents: [
          {
            id: 'TRAIN_TEST',
            name: 'Train Test',
            patterns: ['train test {param}'],
            parameters: {
              param: { type: 'string', required: true }
            }
          }
        ],
        options: {
          epochs: 5,
          batch_size: 16
        }
      };

      const response = await request(app)
        .post('/api/train')
        .send(trainingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.accuracy).toBeDefined();
    });

    test('should validate training data', async () => {
      const invalidData = {
        intents: []
        // Empty intents array
      };

      const response = await request(app)
        .post('/api/train')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/evaluate', () => {
    test('should evaluate model performance', async () => {
      const testData = {
        test_data: [
          {
            text: 'buscar laptop',
            expected_intent: 'BUSQUEDA',
            expected_parameters: {
              nombre_producto: 'laptop'
            }
          },
          {
            text: 'hola',
            expected_intent: 'SALUDO',
            expected_parameters: {}
          }
        ],
        options: {
          detailed: true
        }
      };

      const response = await request(app)
        .post('/api/evaluate')
        .send(testData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accuracy).toBeDefined();
      expect(response.body.data.precision).toBeDefined();
      expect(response.body.data.recall).toBeDefined();
    });
  });

  describe('Error handling', () => {
    test('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ROUTE_NOT_FOUND');
    });

    test('should handle method not allowed', async () => {
      const response = await request(app)
        .put('/api/health')
        .expect(405);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('METHOD_NOT_ALLOWED');
    });

    test('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/detect-intent')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('Rate limiting', () => {
    test('should handle rate limiting', async () => {
      // Make multiple requests quickly
      const promises = Array(105).fill().map(() =>
        request(app)
          .post('/api/detect-intent')
          .send({ text: 'test' })
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.some(res => res.status === 429);

      expect(rateLimited).toBe(true);
    });
  });
}); 