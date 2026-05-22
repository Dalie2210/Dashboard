import getDb from "./db";
import type {
  MetricsResponse,
  LastRoleSessionResponse,
  SessionsResponse,
  SessionsTimelineResponse,
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

export async function getLastRoleBySession(
  from: string,
  to: string
): Promise<LastRoleSessionResponse> {
  const sql = getDb();

  const rows = (await sql`
    SELECT last_rol, COUNT(*) AS session_count
    FROM (
      SELECT DISTINCT ON (session_id)
        session_id, rol AS last_rol
      FROM vista_dashboard_agente
      WHERE fecha >= ${from}::timestamptz
        AND fecha < ${to}::timestamptz
      ORDER BY session_id, fecha DESC
    ) t
    GROUP BY last_rol
  `) as Row[];

  let aiSessions = 0;
  let humanSessions = 0;
  for (const row of rows) {
    if (row.last_rol === "ai") aiSessions = Number(row.session_count);
    else if (row.last_rol === "human") humanSessions = Number(row.session_count);
  }

  return { aiSessions, humanSessions };
}

export async function getSessionsTimeline(
  from: string,
  to: string
): Promise<SessionsTimelineResponse> {
  const sql = getDb();

  const rows = (await sql`
    SELECT day, COUNT(*) AS session_count
    FROM (
      SELECT session_id, MIN(fecha)::date AS day
      FROM vista_dashboard_agente
      WHERE fecha >= ${from}::timestamptz
        AND fecha < ${to}::timestamptz
      GROUP BY session_id
    ) s
    GROUP BY day
    ORDER BY day
  `) as Row[];

  return {
    points: rows.map((r) => {
      const date = new Date(r.day as string);
      const formattedDay = date.toISOString().split("T")[0];
      return {
        day: formattedDay,
        sessionCount: Number(r.session_count),
      };
    }),
  };
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
