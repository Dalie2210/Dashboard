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

  // Must reference vista_dashboard_agente
  if (!upperSql.includes("VISTA_DASHBOARD_AGENTE")) {
    return {
      valid: false,
      reason: 'Query must reference "vista_dashboard_agente"',
    };
  }

  // Check for multiple statements (semicolon in the middle)
  const parts = trimmed.split(";").filter((p) => p.trim());
  if (parts.length > 1) {
    return { valid: false, reason: "Multiple SQL statements not allowed" };
  }

  return { valid: true };
}
