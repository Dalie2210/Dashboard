export interface RoleCount {
  count: number;
  percentage: number;
}

export interface MetricsResponse {
  avgMessagesPerSession: number;
  totalMessages: number;
  totalSessions: number;
  roleCounts: {
    ai: RoleCount;
    human: RoleCount;
  };
}

export interface LastRoleSessionResponse {
  aiSessions: number;
  humanSessions: number;
}

export interface TimelinePoint {
  day: string;
  sessionCount: number;
}

export interface SessionsTimelineResponse {
  points: TimelinePoint[];
}

export interface SessionData {
  sessionId: string;
  messageCount: number;
  aiCount: number;
  humanCount: number;
  startedAt: string;
}

export interface SessionsResponse {
  sessions: SessionData[];
}

export interface DateRange {
  from: Date;
  to: Date;
}

export type MessageRole = "user" | "assistant";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isError?: boolean;
  tokenUsage?: TokenUsage;
  isOpenAI?: boolean;
}

export interface ChatRequest {
  question: string;
  useOpenAI?: boolean;
}

export interface ChatResponse {
  answer: string;
  sqlUsed?: string;
  rowCount?: number;
  tokenUsage?: TokenUsage;
}

export interface SalesMetricsResponse {
  totalRevenue: number;
  totalTransactions: number;
  avgTicket: number;
  uniqueBuyers: number;
}

export interface SalesTimelinePoint {
  day: string;
  revenue: number;
  transactions: number;
}

export interface SalesTimelineResponse {
  points: SalesTimelinePoint[];
}
