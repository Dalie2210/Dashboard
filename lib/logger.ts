import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const isDevelopment = process.env.NODE_ENV !== 'production';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}] ${message}${metaStr ? '\n' + metaStr : ''}`;
  })
);

const getTransports = () => {
  const transports: winston.transport[] = [];

  // Console en desarrollo y producción (para CI/CD)
  transports.push(
    new winston.transports.Console({
      format: isDevelopment ? consoleFormat : logFormat,
      level: isDevelopment ? 'debug' : 'info',
    })
  );

  // Archivo de logs en desarrollo (Next.js se reinicia, necesitamos persistencia)
  if (isDevelopment) {
    transports.push(
      new DailyRotateFile({
        dirname: path.join(process.cwd(), 'logs'),
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: logFormat,
        level: 'debug',
      })
    );

    // Archivo separado solo para errores
    transports.push(
      new DailyRotateFile({
        dirname: path.join(process.cwd(), 'logs'),
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: logFormat,
        level: 'error',
      })
    );
  }

  return transports;
};

let logger: winston.Logger | null = null;

export function getLogger(module?: string) {
  if (!logger) {
    logger = winston.createLogger({
      defaultMeta: { service: 'be-welly-dashboard' },
      transports: getTransports(),
    });
  }

  if (module) {
    return logger.child({ module });
  }

  return logger;
}

export default getLogger();
