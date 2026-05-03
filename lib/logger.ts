import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function createLogger() {
  const options = {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      env: process.env.NODE_ENV,
    },
  };

  if (isProduction || isTest) {
    return pino(options);
  }

  try {
    return pino({
      ...options,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          sync: true,
        },
      },
    });
  } catch {
    return pino(options);
  }
}

export const logger = createLogger();
