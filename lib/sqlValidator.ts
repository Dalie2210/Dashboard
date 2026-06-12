export function validateSql(sql: string): { valid: boolean; reason?: string } {
  const trimmed = sql.trim();

  // Check length
  if (trimmed.length > 4000) {
    return { valid: false, reason: "SQL query exceeds 4000 characters" };
  }

  // Must start with SELECT (case-insensitive)
  if (!/^\s*SELECT\s/i.test(trimmed)) {
    return { valid: false, reason: "Query must start with SELECT" };
  }

  // Check for dangerous keywords (case-insensitive)
  const dangerousKeywords = [
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "CREATE",
    "ALTER",
    "TRUNCATE",
    "GRANT",
    "REVOKE",
    "EXEC",
    "CALL",
    "COPY",
    "BEGIN",
    "COMMIT",
    "ROLLBACK",
  ];

  const upperSql = trimmed.toUpperCase();
  for (const keyword of dangerousKeywords) {
    // Use word boundaries to avoid false positives
    const pattern = new RegExp(`\\b${keyword}\\b`);
    if (pattern.test(upperSql)) {
      return { valid: false, reason: `Dangerous keyword "${keyword}" not allowed` };
    }
  }

  // Check for dangerous functions
  if (
    /pg_read_file|pg_write_file|execute|eval|system|shell_exec/i.test(upperSql)
  ) {
    return {
      valid: false,
      reason: "Dangerous functions not allowed",
    };
  }

  // Must reference at least one allowed table
  const allowedTables = ["AI_MEMORY", "VENTAS_CAMILA"];
  const referencesAllowed = allowedTables.some((t) => upperSql.includes(t));
  if (!referencesAllowed) {
    return {
      valid: false,
      reason: 'Query must reference "ai_memory" or "ventas_camila" table',
    };
  }

  // Check for multiple statements (semicolon in the middle)
  const parts = trimmed.split(";").filter((p) => p.trim());
  if (parts.length > 1) {
    return { valid: false, reason: "Multiple SQL statements not allowed" };
  }

  // Check for LIMIT clause
  const limitMatch = upperSql.match(/\bLIMIT\s+(\d+)\b/);
  if (!limitMatch) {
    return { valid: false, reason: "Query must include a LIMIT clause to control token usage" };
  }

  // Enforce LIMIT <= 100 to keep token usage under 12,000 tokens per request
  const limitValue = parseInt(limitMatch[1], 10);
  if (limitValue > 100) {
    return { valid: false, reason: "LIMIT must be 100 or less to control token usage" };
  }

  return { valid: true };
}
