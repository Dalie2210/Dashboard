import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

function getDb() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL no está configurada en .env.local");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

export default getDb;
