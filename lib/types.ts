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

export interface LastInteractionResponse {
  lastAiMessage: string | null;
  lastHumanMessage: string | null;
  aiMinutesAgo: number | null;
  humanMinutesAgo: number | null;
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
