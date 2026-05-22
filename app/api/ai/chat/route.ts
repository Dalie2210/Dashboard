import Groq from "groq-sdk";
import { LRUCache } from "lru-cache";
import { validateSql } from "@/lib/sqlValidator";
import { executeDynamicSql } from "@/lib/db";
import { ChatRequest, ChatResponse } from "@/lib/types";

let groq: Groq | null = null;
const sqlCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
});

function getGroqClient(): Groq {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not configured");
    }
    try {
      groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      console.log("[Groq Client] Initialized successfully");
    } catch (err) {
      console.error("[Groq Client] Initialization error:", err);
      throw err;
    }
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
  const cacheKey = question.trim().toLowerCase();

  // Check cache first (SQL generation is deterministic at temperature 0)
  if (sqlCache.has(cacheKey)) {
    console.log("[SQL Generation] Cache hit for:", cacheKey.substring(0, 50));
    return sqlCache.get(cacheKey)!;
  }

  const systemPrompt = `Eres un asistente de análisis de datos para Be Welly.
Genera UNA SOLA consulta SQL válida para PostgreSQL.

ESQUEMA: vista vista_dashboard_agente
  - id (INTEGER)
  - session_id (VARCHAR) — agrupa mensajes en conversaciones
  - rol (TEXT) — 'ai' o 'human'
  - contenido (TEXT) — texto del mensaje
  - fecha (TIMESTAMP WITH TIME ZONE)

REGLAS: Solo SELECT. Sin explicaciones ni markdown. Solo vista_dashboard_agente.
Siempre LIMIT 200. Si la pregunta no aplica, responde: NO_DATA`;

  try {
    console.log("[SQL Generation] Calling Groq API for question:", question.substring(0, 50));
    const response = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Pregunta: ${question}`,
        },
      ],
      temperature: 0,
      max_tokens: 512,
    });

    console.log("[SQL Generation] Groq API response received:", {
      choices: response.choices?.length,
      hasContent: !!response.choices[0]?.message?.content,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No text response from Groq");
    }

    const sql = stripCodeFences(content);
    console.log("[SQL Generation] Generated SQL:", sql.substring(0, 100));
    sqlCache.set(cacheKey, sql);
    return sql;
  } catch (err) {
    console.error("[SQL Generation] Error:", {
      message: err instanceof Error ? err.message : String(err),
      name: err instanceof Error ? err.name : typeof err,
      error: err,
    });
    throw err;
  }
}

async function analyzeResults(
  question: string,
  sqlQuery: string,
  results: unknown[]
): Promise<string> {
  const systemPrompt = `Eres un analista de conversaciones para Be Welly.
Responde SIEMPRE en español con Markdown bien formateado:
- ## para secciones
- **negrita** para hallazgos clave
- Bullet points para enumeraciones
- Tablas Markdown para comparativas
- Resumen ejecutivo al inicio
- ## Recomendación al cierre cuando aplique
- Máximo 600 palabras`;

  const resultsJson = JSON.stringify(results, null, 2);

  const response = await getGroqClient().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Pregunta original: "${question}"\n\nResultados de la BD:\n${resultsJson}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No text response from Groq");
  }

  return content;
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "GROQ_API_KEY not configured. Set it in .env.local to enable AI features.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = (await request.json()) as ChatRequest;
    const { question } = body;

    // Validate question
    if (!question || question.length < 3 || question.length > 500) {
      return new Response(
        JSON.stringify({ error: "Question must be between 3 and 500 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Phase 1: Generate SQL
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

    // Validate SQL
    console.log("[Chat Route] Validating SQL...");
    const validation = validateSql(sqlResponse);
    if (!validation.valid) {
      console.error("[Chat Route] SQL validation failed:", validation.reason);
      return new Response(
        JSON.stringify({ error: `SQL validation failed: ${validation.reason}` }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // Execute SQL
    console.log("[Chat Route] Executing SQL query...");
    const results = await executeDynamicSql(sqlResponse);
    console.log("[Chat Route] Query executed successfully, got", results.length, "rows");

    // Phase 2: Analyze results with Gemini
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
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
      errorDetails = error;
    } else {
      errorMessage = String(error);
    }

    // Rate limit error from Groq
    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      return new Response(
        JSON.stringify({
          error:
            "API rate limit exceeded. Please wait a moment and try again. (Groq Free Tier: 30 RPM, 14,400 RPD)",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("[AI Chat Error] Full Details:", {
      message: errorMessage,
      details: errorDetails,
      type: typeof error,
      constructor: error?.constructor?.name,
    });
    return new Response(
      JSON.stringify({
        error: `Server error: ${errorMessage}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
