import { neon } from "@neondatabase/serverless";
import { Pool } from "@neondatabase/serverless";
import { getLogger } from "./logger";

const logger = getLogger("Database");

let _sql: ReturnType<typeof neon> | null = null;
let _pool: Pool | null = null;

function getDb() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      const err = "DATABASE_URL no está configurada en .env.local";
      logger.error("Database initialization failed", { reason: err });
      throw new Error(err);
    }
    try {
      logger.debug("Initializing Neon database connection");
      _sql = neon(process.env.DATABASE_URL);
      logger.info("Database connection established");
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Failed to initialize database connection", {
        error: error.message,
        stack: error.stack,
      });
      throw err;
    }
  }
  return _sql;
}

export async function executeDynamicSql(sql: string) {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      const err = "DATABASE_URL no está configurada en .env.local";
      logger.error("Pool initialization failed", { reason: err });
      throw new Error(err);
    }
    try {
      logger.debug("Initializing database pool");
      _pool = new Pool({ connectionString: process.env.DATABASE_URL });
      logger.info("Database pool created");
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Failed to create database pool", {
        error: error.message,
        stack: error.stack,
      });
      throw err;
    }
  }

  const client = await _pool.connect();
  try {
    logger.debug("Executing dynamic SQL", { sqlLength: sql.length });
    const result = await client.query(sql);
    logger.debug("Dynamic SQL executed successfully", {
      rowsReturned: result.rows.length,
    });
    return result.rows;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("Failed to execute dynamic SQL", {
      error: error.message,
      stack: error.stack,
      sqlLength: sql.length,
    });
    throw err;
  } finally {
    client.release();
  }
}

export default getDb;
