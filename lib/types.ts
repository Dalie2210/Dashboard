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
