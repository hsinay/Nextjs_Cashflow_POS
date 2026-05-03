const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  // Avoid Watchman; CI/sandbox often lacks permissions or a working Watchman socket.
  watchman: false,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^uuid$': require.resolve('uuid'),
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'services/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    // generated / boilerplate files not worth measuring
    '!app/providers.tsx',
    '!app/layout.tsx',
    '!lib/prisma.ts',
    '!lib/design-tokens.ts',
  ],
  coverageThreshold: {
    // No global threshold: the project has hundreds of untested UI files that
    // would make a meaningful global % unreachable until full coverage is built.
    // Per-file guards protect what IS covered; raise global once overall coverage grows.
    //
    // Per-file minimums for well-tested critical paths
    './services/payment.service.ts': {
      lines: 20,
      functions: 20,
    },
    './services/pos.service.ts': {
      lines: 20,
      functions: 10,
    },
    './services/product.service.ts': {
      lines: 50,
      functions: 50,
    },
    './lib/currency.ts': {
      lines: 60,
      functions: 50,
    },
    './lib/validation-utils.ts': {
      lines: 80,
      functions: 80,
    },
    './lib/rbac.config.ts': {
      lines: 60,
      functions: 60,
    },
  },
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  transformIgnorePatterns: [
    '/node_modules/(?!uuid)/'
  ],
  // Fail fast on the first test suite failure in watch mode
  bail: false,
  // Verbose output in CI, quiet locally
  verbose: process.env.CI === 'true',
}

module.exports = createJestConfig(customJestConfig)
