// Setup específico para tests de integración
const request = require('supertest');

// Configurar servidor de test
let testServer;

beforeAll(async () => {
  // Importar app después de configurar variables de entorno
  const app = require('../src/index');
  testServer = app.listen(3001);
  
  // Esperar a que el servidor esté listo
  await new Promise(resolve => setTimeout(resolve, 1000));
});

afterAll(async () => {
  if (testServer) {
    await new Promise(resolve => testServer.close(resolve));
  }
});

// Función helper para hacer requests
global.makeRequest = (method, path, data = null) => {
  const req = request(testServer)[method.toLowerCase()](path);
  
  if (data) {
    req.send(data);
  }
  
  return req;
};

// Configurar timeouts más largos para integración
jest.setTimeout(60000); 