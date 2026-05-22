import { NextRequest, NextResponse } from "next/server";
import { getSessionsTimeline } from "@/lib/queries";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api/dashboard/sessions-timeline");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  logger.debug(`[${requestId}] Incoming request`, {
    from,
    to,
    userAgent: req.headers.get("user-agent"),
  });

  if (!from || !to || isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
    logger.warn(`[${requestId}] Invalid date parameters`, { from, to });
    return NextResponse.json(
      { error: "Parámetros from y to requeridos en formato YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const data = await getSessionsTimeline(from, to);
    logger.info(`[${requestId}] Sessions timeline retrieved`, {
      from,
      to,
      totalDataPoints: data.points.length,
    });
    return NextResponse.json(data);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(`[${requestId}] Failed to fetch sessions timeline`, {
      from,
      to,
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Error al consultar la base de datos" },
      { status: 500 }
    );
  }
}
