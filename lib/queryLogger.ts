import { getLogger } from './logger';

const logger = getLogger('QueryLogger');

export async function logQuery<T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  const startTime = Date.now();
  const queryId = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  logger.debug(`[${queryId}] Starting query`, { name, ...context });

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    logger.info(`[${queryId}] Query completed`, {
      name,
      durationMs: duration,
      ...context,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));

    logger.error(`[${queryId}] Query failed`, {
      name,
      durationMs: duration,
      error: err.message,
      stack: err.stack,
      ...context,
    });

    throw error;
  }
}
