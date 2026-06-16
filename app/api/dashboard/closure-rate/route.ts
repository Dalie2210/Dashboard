import { NextRequest, NextResponse } from "next/server";
import { getClosureRate } from "@/lib/queries";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api/dashboard/closure-rate");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  logger.debug(`[${requestId}] Incoming request`, { from, to });

  if (!from || !to || isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
    logger.warn(`[${requestId}] Invalid date parameters`, { from, to });
    return NextResponse.json(
      { error: "Parámetros from y to requeridos en formato YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const data = await getClosureRate(from, to);
    logger.info(`[${requestId}] Closure rate retrieved`, {
      from,
      to,
      closureRate: data.closureRate,
    });
    return NextResponse.json(data);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(`[${requestId}] Failed to fetch closure rate`, {
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
