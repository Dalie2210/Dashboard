import { NextRequest, NextResponse } from "next/server";
import { getLastRoleBySession } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to || isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
    return NextResponse.json(
      { error: "Parámetros from y to requeridos en formato YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const data = await getLastRoleBySession(from, to);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/dashboard/last-interaction]", err);
    return NextResponse.json(
      { error: "Error al consultar la base de datos" },
      { status: 500 }
    );
  }
}
