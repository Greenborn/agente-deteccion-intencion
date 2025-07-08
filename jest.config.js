module.exports = {
  // Directorio raíz de los tests
  testEnvironment: 'node',
  
  // Directorios donde buscar tests
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Cobertura de código
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  
  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup y teardown
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Timeout para tests
  testTimeout: 30000,
  
  // Verbosidad
  verbose: true,
  
  // Detectar cambios
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  
  // Variables de entorno para tests
  setupFiles: ['<rootDir>/tests/env.js'],
  
  // Transformaciones
  transform: {},
  
  // Extensiones de archivos
  moduleFileExtensions: ['js', 'json'],
  
  // Mapeo de módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Configuración para tests de integración
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/integration-setup.js']
    }
  ]
}; 