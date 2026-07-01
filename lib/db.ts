import postgres from "postgres";
import { getLogger } from "./logger";

const logger = getLogger("Database");

let _sql: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      const err = "DATABASE_URL no está configurada en .env.local";
      logger.error("Database initialization failed", { reason: err });
      throw new Error(err);
    }
    try {
      logger.debug("Initializing database connection");
      _sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
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
  const db = getDb();
  try {
    logger.debug("Executing dynamic SQL", { sqlLength: sql.length });
    const rows = await db.unsafe(sql);
    logger.debug("Dynamic SQL executed successfully", {
      rowsReturned: rows.length,
    });
    return rows;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("Failed to execute dynamic SQL", {
      error: error.message,
      stack: error.stack,
      sqlLength: sql.length,
    });
    throw err;
  }
}

export default getDb;
