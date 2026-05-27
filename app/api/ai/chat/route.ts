import Groq from "groq-sdk";
import { LRUCache } from "lru-cache";
import { validateSql } from "@/lib/sqlValidator";
import { executeDynamicSql } from "@/lib/db";
import { ChatRequest, ChatResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let groq: Groq | null = null;
const sqlCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
});

function getTodayInColombia(): string {
  const now = new Date();
  const col = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const y = col.getFullYear();
  const m = String(col.getMonth() + 1).padStart(2, "0");
  const d = String(col.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getGroqClient(): Groq {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not configured");
    }
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log("[Groq Client] Initialized successfully");
  }
  return groq;
}

function stripCodeFences(text: string): string {
  return text
    .replace(/```(?:sql|SQL)?\s*\n?/g, "")
    .replace(/```\s*\n?/g, "")
    .trim();
}

async function generateSql(question: string): Promise<string> {
  const today = getTodayInColombia();
  const cacheKey = `${today}:${question.trim().toLowerCase()}`;

  if (sqlCache.has(cacheKey)) {
    console.log("[SQL Generation] Cache hit for:", cacheKey.substring(0, 50));
    return sqlCache.get(cacheKey)!;
  }

  const systemPrompt = `Eres un experto en SQL PostgreSQL que trabaja para Be Welly, empresa colombiana de bienestar digital.
Tu única función es generar consultas SQL precisas a partir de preguntas en español.
Fecha actual (zona horaria Colombia / Bogotá): ${today}

ESQUEMA DISPONIBLE:
  Vista: vista_dashboard_agente
    - id         (INTEGER)          — identificador único del mensaje
    - session_id (VARCHAR)          — agrupa mensajes de una misma conversación
    - rol        (TEXT)             — 'ai' para mensajes del asistente, 'human' para mensajes del usuario
    - contenido  (TEXT)             — texto completo del mensaje
    - fecha      (TIMESTAMP WITH TIME ZONE) — fecha y hora del mensaje, en UTC

INSTRUCCIONES:
1. Genera UNA SOLA consulta SELECT válida para PostgreSQL.
2. No incluyas explicaciones, comentarios ni bloques de código markdown. Solo el SQL puro.
3. Solo puedes consultar vista_dashboard_agente. No hay otras tablas.
4. Incluye siempre una cláusula LIMIT (máximo 100).
5. Para filtros de fecha usa la sintaxis: fecha::date = '${today}' o BETWEEN.
6. Para calcular sesiones únicas usa COUNT(DISTINCT session_id).
7. Para analizar contenido usa ILIKE '%término%' (sin tildes cuando sea posible).
8. Si la pregunta no puede responderse con este esquema, responde exactamente: NO_DATA`;

  try {
    console.log("[SQL Generation] Calling Groq API for question:", question.substring(0, 50));
    const response = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Pregunta: ${question}` },
      ],
      temperature: 0,
      max_tokens: 512,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No text response from Groq");

    const sql = stripCodeFences(content);
    console.log("[SQL Generation] Generated SQL:", sql.substring(0, 100));
    sqlCache.set(cacheKey, sql);
    return sql;
  } catch (err) {
    console.error("[SQL Generation] Error:", {
      message: err instanceof Error ? err.message : String(err),
      name: err instanceof Error ? err.name : typeof err,
    });
    throw err;
  }
}

function compressResults(rows: unknown[]): string {
  const MAX_ROWS = 80;
  const MAX_CONTENIDO_CHARS = 250;

  const compressed = rows.slice(0, MAX_ROWS).map((row) => {
    const r = row as Record<string, unknown>;
    const result: Record<string, unknown> = { ...r };
    if (typeof r.contenido === "string" && r.contenido.length > MAX_CONTENIDO_CHARS) {
      result.contenido = r.contenido.slice(0, MAX_CONTENIDO_CHARS) + "…";
    }
    return result;
  });

  const truncationNote =
    rows.length > MAX_ROWS
      ? `\n[Nota: se muestran ${MAX_ROWS} de ${rows.length} resultados para optimizar tokens]`
      : "";

  return JSON.stringify(compressed) + truncationNote;
}

async function analyzeResults(
  question: string,
  sqlQuery: string,
  results: unknown[]
): Promise<string> {
  const systemPrompt = `Eres un analista de datos senior para Be Welly, empresa colombiana de bienestar digital.
Tu audiencia son gerentes y directores de operaciones colombianos.

ESTRUCTURA CON MARKDOWN:
## Resumen ejecutivo
2-3 oraciones con el hallazgo principal y la métrica más relevante.

## Análisis detallado
Bullets, tablas comparativas y tendencias extraídas de los datos.

## Patrones identificados
Solo si los datos son suficientes para identificar comportamientos recurrentes o anomalías.

## Recomendaciones
Acciones concretas basadas en los hallazgos, solo si aplica.

REGLAS:
- Idioma: español colombiano, tono profesional pero cercano
- Usa **negrita** para métricas clave y hallazgos importantes
- Usa tablas Markdown cuando compares más de 2 categorías o períodos
- Cita números exactos del dataset; no inventes datos
- Máximo 800 palabras`;

  const resultsJson = compressResults(results);

  const response = await getGroqClient().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Pregunta original: "${question}"\n\nResultados de la BD:\n${resultsJson}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No text response from Groq");
  return content;
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "GROQ_API_KEY not configured. Set it in .env.local to enable AI features.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = (await request.json()) as ChatRequest;
    const { question } = body;

    if (!question || question.length < 3 || question.length > 500) {
      return new Response(
        JSON.stringify({ error: "Question must be between 3 and 500 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sqlResponse = await generateSql(question);

    if (sqlResponse.toUpperCase() === "NO_DATA") {
      return new Response(
        JSON.stringify({
          answer:
            "Lo siento, no puedo responder esa pregunta con la información disponible en el dashboard. Intenta preguntarme sobre sesiones, mensajes, roles (IA vs Humano) o actividad del agente.",
          sqlUsed: undefined,
          rowCount: 0,
        } as ChatResponse),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[Chat Route] Validating SQL...");
    const validation = validateSql(sqlResponse);
    if (!validation.valid) {
      console.error("[Chat Route] SQL validation failed:", validation.reason);
      return new Response(
        JSON.stringify({ error: `SQL validation failed: ${validation.reason}` }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[Chat Route] Executing SQL query...");
    const results = await executeDynamicSql(sqlResponse);
    console.log("[Chat Route] Query executed, got", results.length, "rows");

    const answer = await analyzeResults(question, sqlResponse, results);

    return new Response(
      JSON.stringify({
        answer,
        sqlUsed: sqlResponse,
        rowCount: results.length,
      } as ChatResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    let errorMessage = "Unknown error";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { name: error.name, message: error.message, stack: error.stack };
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
      errorDetails = error;
    } else {
      errorMessage = String(error);
    }

    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      return new Response(
        JSON.stringify({
          error: "Límite de solicitudes alcanzado. Por favor espera un momento e intenta de nuevo. (Groq Free Tier: 30 RPM, 14,400 RPD)",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("[AI Chat Error]", { message: errorMessage, details: errorDetails });
    return new Response(
      JSON.stringify({ error: `Server error: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
