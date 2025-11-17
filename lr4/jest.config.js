module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server/tests'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'server/**/*.ts',
    '!server/tests/**/*.ts',
    '!server/server.js'
  ],
  coverageDirectory: 'coverage/server',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/server/tests/**/*.test.ts'],
  verbose: true
};
