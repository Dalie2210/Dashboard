import getDb from "./db";
import type {
  MetricsResponse,
  LastInteractionResponse,
  SessionsResponse,
} from "./types";

type Row = Record<string, unknown>;

export async function getMetrics(
  from: string,
  to: string
): Promise<MetricsResponse> {
  const sql = getDb();

  const totalsResult = (await sql`
    SELECT
      COUNT(*) AS total_messages,
      COUNT(DISTINCT session_id) AS total_sessions,
      ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT session_id), 0), 2) AS avg_messages_per_session
    FROM vista_dashboard_agente
    WHERE fecha >= ${from}::timestamptz
      AND fecha < ${to}::timestamptz
  `) as Row[];

  const roleRows = (await sql`
    SELECT
      rol,
      COUNT(*) AS message_count,
      ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) AS percentage
    FROM vista_dashboard_agente
    WHERE fecha >= ${from}::timestamptz
      AND fecha < ${to}::timestamptz
    GROUP BY rol
  `) as Row[];

  const totals = totalsResult[0] ?? {};
  const totalMessages = Number(totals.total_messages) || 0;
  const totalSessions = Number(totals.total_sessions) || 0;
  const avgMessagesPerSession = Number(totals.avg_messages_per_session) || 0;

  const aiRow = roleRows.find((r) => r.rol === "ai");
  const humanRow = roleRows.find((r) => r.rol === "human");

  return {
    avgMessagesPerSession,
    totalMessages,
    totalSessions,
    roleCounts: {
      ai: {
        count: Number(aiRow?.message_count) || 0,
        percentage: Number(aiRow?.percentage) || 0,
      },
      human: {
        count: Number(humanRow?.message_count) || 0,
        percentage: Number(humanRow?.percentage) || 0,
      },
    },
  };
}

export async function getLastInteraction(
  from: string,
  to: string
): Promise<LastInteractionResponse> {
  const sql = getDb();

  const result = (await sql`
    SELECT
      MAX(CASE WHEN rol = 'ai' THEN fecha END) AS last_ai_message,
      MAX(CASE WHEN rol = 'human' THEN fecha END) AS last_human_message
    FROM vista_dashboard_agente
    WHERE fecha >= ${from}::timestamptz
      AND fecha < ${to}::timestamptz
  `) as Row[];

  const row = result[0] ?? {};
  const now = Date.now();

  const lastAiMessage = row.last_ai_message
    ? new Date(row.last_ai_message as string).toISOString()
    : null;
  const lastHumanMessage = row.last_human_message
    ? new Date(row.last_human_message as string).toISOString()
    : null;

  const aiMinutesAgo = lastAiMessage
    ? Math.floor((now - new Date(lastAiMessage).getTime()) / 60_000)
    : null;
  const humanMinutesAgo = lastHumanMessage
    ? Math.floor((now - new Date(lastHumanMessage).getTime()) / 60_000)
    : null;

  return { lastAiMessage, lastHumanMessage, aiMinutesAgo, humanMinutesAgo };
}

export async function getSessions(
  from: string,
  to: string
): Promise<SessionsResponse> {
  const sql = getDb();

  const rows = (await sql`
    SELECT
      session_id,
      COUNT(*) AS message_count,
      COUNT(CASE WHEN rol = 'ai' THEN 1 END) AS ai_count,
      COUNT(CASE WHEN rol = 'human' THEN 1 END) AS human_count,
      MIN(fecha) AS started_at
    FROM vista_dashboard_agente
    WHERE fecha >= ${from}::timestamptz
      AND fecha < ${to}::timestamptz
    GROUP BY session_id
    ORDER BY started_at
    LIMIT 50
  `) as Row[];

  return {
    sessions: rows.map((r) => ({
      sessionId: String(r.session_id),
      messageCount: Number(r.message_count),
      aiCount: Number(r.ai_count),
      humanCount: Number(r.human_count),
      startedAt: new Date(r.started_at as string).toISOString(),
    })),
  };
}
