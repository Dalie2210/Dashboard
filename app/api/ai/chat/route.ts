import Groq from "groq-sdk";
import OpenAI from "openai";
import { LRUCache } from "lru-cache";
import { validateSql } from "@/lib/sqlValidator";
import { executeDynamicSql } from "@/lib/db";
import { ChatRequest, ChatResponse, TokenUsage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let groq: Groq | null = null;
let openaiClient: OpenAI | null = null;

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

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("[OpenAI Client] Initialized successfully");
  }
  return openaiClient;
}

function stripCodeFences(text: string): string {
  return text
    .replace(/```(?:sql|SQL)?\s*\n?/g, "")
    .replace(/```\s*\n?/g, "")
    .trim();
}

async function generateSql(
  question: string,
  provider: "groq" | "openai"
): Promise<{ sql: string; usage?: TokenUsage }> {
  const today = getTodayInColombia();
  const cacheKey = `${today}:${question.trim().toLowerCase()}`;

  if (sqlCache.has(cacheKey)) {
    console.log("[SQL Generation] Cache hit for:", cacheKey.substring(0, 50));
    return { sql: sqlCache.get(cacheKey)! };
  }

  const systemPrompt = `Eres un experto en SQL PostgreSQL que trabaja para Be Welly, empresa colombiana de bienestar digital.
Tu única función es generar consultas SQL precisas a partir de preguntas en español para análisis de conversaciones del agente IA.
Fecha actual (zona horaria Colombia / Bogotá): ${today}

ESQUEMA DISPONIBLE:
  Tabla: ai_memory
    - id         (serial)           — identificador único del registro
    - session_id (varchar)          — CRÍTICO para agrupar hilos de conversación completos
    - message    (jsonb)            — contenido del mensaje, acceder con operators: message->>'content' para texto, message->>'type' para rol
    - created_at (timestamp)        — fecha y hora del mensaje, úsalo para ORDER BY created_at ASC

INSTRUCCIONES:
1. Genera UNA SOLA consulta SELECT válida para PostgreSQL.
2. No incluyas explicaciones, comentarios ni bloques de código markdown. Solo el SQL puro.
3. Solo puedes consultar la tabla ai_memory. No hay otras tablas.
4. Incluye siempre una cláusula LIMIT (máximo 100).
5. Para acceder al contenido del mensaje usa: message->>'content'
6. Para identificar el tipo de mensaje usa: message->>'type' (valores: 'human' o 'ai')
7. Para agrupar conversaciones completas usa session_id.
8. Para analizar contenido usa ILIKE '%término%' (sin tildes cuando sea posible).
9. Ordena siempre por created_at ASC para reconstruir el flujo de conversación cronológicamente.
10. Si la pregunta no puede responderse con este esquema, responde exactamente: NO_DATA`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: `Pregunta: ${question}` },
  ];

  try {
    let content: string;
    let usage: TokenUsage | undefined;

    if (provider === "openai") {
      console.log("[SQL Generation] Calling OpenAI API for question:", question.substring(0, 50));
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-4.1-mini-2025-04-14",
        messages,
        temperature: 0,
        max_tokens: 512,
      });
      content = response.choices[0]?.message?.content ?? "";
      if (!content) throw new Error("No text response from OpenAI");
      if (response.usage) {
        usage = {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        };
      }
    } else {
      console.log("[SQL Generation] Calling Groq API for question:", question.substring(0, 50));
      const response = await getGroqClient().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0,
        max_tokens: 512,
      });
      content = response.choices[0]?.message?.content ?? "";
      if (!content) throw new Error("No text response from Groq");
    }

    const sql = stripCodeFences(content);
    console.log("[SQL Generation] Generated SQL:", sql.substring(0, 100));
    sqlCache.set(cacheKey, sql);
    return { sql, usage };
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
  results: unknown[],
  provider: "groq" | "openai"
): Promise<{ answer: string; usage?: TokenUsage }> {
  const systemPrompt = `# INVESTIGADOR Y ANALISTA DE DATOS SENIOR — ANÁLISIS DE CONVERSACIONES IA

Eres un Investigador y Analista de Datos Senior experto en comportamiento de usuarios. Tu objetivo es analizar el histórico de chats de nuestra IA para extraer insights profundos, fricciones y conclusiones estratégicas.

Tu audiencia son gerentes y directores de operaciones colombianos.

## TU METODOLOGÍA DE INVESTIGACIÓN (OBLIGATORIA)

Eres un agente autónomo. Tienes permitido (y se espera que lo hagas) usar tu herramienta de base de datos MÚLTIPLES VECES en una sola tarea para refinar tu búsqueda antes de responder.

### Fase 1: Descubrimiento (Identificar anomalías o hilos)
Realiza consultas exploratorias iniciales para encontrar agrupaciones, tendencias o identificar session_ids específicos que sean relevantes para la pregunta del usuario.

### Fase 2: Reconstrucción del Contexto (Extracción Profunda)
Una vez que identifiques los session_ids más relevantes, NO te quedes con mensajes aislados. Ejecuta una NUEVA consulta SQL para extraer TODA la conversación de esas sesiones específicas (ej. WHERE session_id IN (...) ORDER BY created_at ASC). Necesitas leer el hilo completo para entender el contexto, el problema original del usuario y cómo la IA lo resolvió.

### Fase 3: Análisis y Síntesis (El Valor Añadido)
Lee las conversaciones completas que extrajiste. Aplica tu capacidad analítica para:
- Identificar la causa raíz de las consultas de los usuarios
- Evaluar si la IA resolvió el problema o si hubo frustración (fricción)
- Encontrar patrones de comportamiento o vacíos de información

## ESTRUCTURA DE RESPUESTA EN MARKDOWN

### Resumen ejecutivo
2-3 oraciones con el hallazgo principal y la métrica más relevante.

### Análisis detallado
Bullets, tablas comparativas y tendencias extraídas de los datos.

### Patrones identificados
Solo si los datos son suficientes para identificar comportamientos recurrentes o anomalías.

### Recomendaciones
Acciones concretas basadas en los hallazgos, solo si aplica.

## REGLAS DE COMUNICACIÓN

- Idioma: español colombiano, tono profesional pero cercano
- Usa **negrita** para métricas clave y hallazgos importantes
- Usa tablas Markdown cuando compares más de 2 categorías o períodos
- Cita números exactos del dataset; no inventes datos
- NUNCA muestres el código SQL, ni hables de la base de datos, tablas, o formatos JSON
- Actúa como si hubieras leído transcripciones de entrevistas, no reportes técnicos
- No menciones los session_id en los que encontraste los errores, ese dato solo es relevante para ti pero no para incluirlo en la respuesta
- Máximo 800 palabras`;

  const resultsJson = compressResults(results);
  const messages = [
    { role: "system" as const, content: systemPrompt },
    {
      role: "user" as const,
      content: `Pregunta original: "${question}"\n\nResultados de la BD:\n${resultsJson}`,
    },
  ];

  if (provider === "openai") {
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14",
      messages,
      temperature: 0.4,
      max_tokens: 1024,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No text response from OpenAI");
    const usage = response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined;
    return { answer: content, usage };
  } else {
    const response = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.4,
      max_tokens: 1024,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No text response from Groq");
    return { answer: content };
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const { question, useOpenAI } = body;
    const provider: "groq" | "openai" = useOpenAI === true ? "openai" : "groq";

    if (provider === "openai" && !process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured. Set it in .env.local." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    if (provider === "groq" && !process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "GROQ_API_KEY not configured. Set it in .env.local to enable AI features.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!question || question.length < 3 || question.length > 500) {
      return new Response(
        JSON.stringify({ error: "Question must be between 3 and 500 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sqlResult = await generateSql(question, provider);

    if (sqlResult.sql.toUpperCase() === "NO_DATA") {
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
    const validation = validateSql(sqlResult.sql);
    if (!validation.valid) {
      console.error("[Chat Route] SQL validation failed:", validation.reason);
      return new Response(
        JSON.stringify({ error: `SQL validation failed: ${validation.reason}` }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[Chat Route] Executing SQL query...");
    const results = await executeDynamicSql(sqlResult.sql);
    console.log("[Chat Route] Query executed, got", results.length, "rows");

    const analysisResult = await analyzeResults(question, sqlResult.sql, results, provider);

    const tokenUsage =
      sqlResult.usage && analysisResult.usage
        ? {
            promptTokens: sqlResult.usage.promptTokens + analysisResult.usage.promptTokens,
            completionTokens:
              sqlResult.usage.completionTokens + analysisResult.usage.completionTokens,
            totalTokens: sqlResult.usage.totalTokens + analysisResult.usage.totalTokens,
          }
        : undefined;

    return new Response(
      JSON.stringify({
        answer: analysisResult.answer,
        sqlUsed: sqlResult.sql,
        rowCount: results.length,
        tokenUsage,
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
      const isOpenAI = errorMessage.toLowerCase().includes("openai");
      return new Response(
        JSON.stringify({
          error: isOpenAI
            ? "OpenAI rate limit alcanzado. Por favor espera un momento e intenta de nuevo."
            : "Límite de solicitudes alcanzado. Por favor espera un momento e intenta de nuevo. (Groq Free Tier: 30 RPM, 14,400 RPD)",
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
