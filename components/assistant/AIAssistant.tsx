"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage, ChatResponse } from "@/lib/types";

const SUGGESTIONS = [
  "¿Cuáles han sido las objeciones principales esta semana?",
  "¿Cuántas sesiones hubo hoy comparado con ayer?",
  "Muéstrame las conversaciones más largas del último mes",
  "¿A qué horas del día hay más actividad?",
  "Compara las conversaciones de esta semana con la anterior",
];

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-xs bg-amber-900/30 text-white rounded-lg px-4 py-2 text-sm">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-2xl bg-zinc-900 border border-l-4 border-l-blue-500 border-zinc-800 text-white rounded-lg px-4 py-3 text-sm">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
            h2: ({ node, ...props }) => (
              <h2 className="text-base font-bold mt-4 mb-2 text-white" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-sm font-semibold mt-3 mb-1 text-white" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-2 leading-relaxed" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />
            ),
            li: ({ node, ...props }) => <li className="text-sm" {...props} />,
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto mb-2">
                <table
                  className="border-collapse border border-zinc-700 text-xs"
                  {...props}
                />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th className="border border-zinc-700 px-2 py-1 bg-zinc-800" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="border border-zinc-700 px-2 py-1" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong className="font-semibold text-white" {...props} />
            ),
            code: ({ node, inline, ...props }: any) =>
              inline ? (
                <code
                  className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono"
                  {...props}
                />
              ) : (
                <code
                  className="block bg-zinc-800 px-3 py-2 rounded text-xs font-mono overflow-x-auto mb-2"
                  {...props}
                />
              ),
          }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function LoadingBubble() {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-2xl bg-zinc-900 border border-l-4 border-l-blue-500 border-zinc-800 text-white rounded-lg px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
        </div>
        <span className="text-sm text-zinc-300">Analizando...</span>
      </div>
    </div>
  );
}

function ErrorBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-2xl bg-red-950/30 border border-l-4 border-l-red-500 border-red-900/50 text-red-200 rounded-lg px-4 py-3 text-sm">
        {content}
      </div>
    </div>
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300 transition-colors"
    >
      {label}
    </button>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = (await response.json()) as ChatResponse & { error?: string };

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== loadingMessage.id);
        if (data.error) {
          return [
            ...filtered,
            {
              id: `error-${Date.now()}`,
              role: "assistant",
              content: data.error,
              timestamp: new Date(),
              isError: true,
            },
          ];
        }
        return [
          ...filtered,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.answer,
            timestamp: new Date(),
          },
        ];
      });
    } catch (error) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== loadingMessage.id);
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Error de conexión. Por favor, intenta de nuevo.",
            timestamp: new Date(),
            isError: true,
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Asistente IA</h1>
          <p className="text-sm text-zinc-500">
            Haz preguntas sobre las conversaciones del agente en lenguaje natural
          </p>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">
                  ¿En qué puedo ayudarte?
                </h2>
                <p className="text-sm text-zinc-500 mb-6">
                  Pregúntame sobre sesiones, mensajes, roles y más
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {SUGGESTIONS.map((suggestion, idx) => (
                  <Chip
                    key={idx}
                    label={suggestion}
                    onClick={() => handleSendMessage(suggestion)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              {messages.map((msg) => {
                if (msg.role === "user") {
                  return <UserBubble key={msg.id} content={msg.content} />;
                }
                if (msg.isError) {
                  return <ErrorBubble key={msg.id} content={msg.content} />;
                }
                if (msg.isStreaming) {
                  return <LoadingBubble key={msg.id} />;
                }
                return <AssistantBubble key={msg.id} content={msg.content} />;
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area - sticky at bottom */}
      <div className="border-t border-zinc-800 bg-zinc-950 sticky bottom-0 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(input);
                }
              }}
              placeholder="Escribe tu pregunta... (Enter = enviar, Shift+Enter = nueva línea)"
              disabled={isLoading}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-blue-500 disabled:opacity-50"
              rows={3}
            />
            <button
              onClick={() => handleSendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed px-4 py-3 rounded-lg text-white font-medium transition-colors h-full flex items-center justify-center"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
