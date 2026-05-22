"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LastRoleSessionResponse } from "@/lib/types";

interface LastInteractionCardProps {
  data: LastRoleSessionResponse | undefined;
  isLoading: boolean;
}

function RolePanel({
  role,
  count,
  total,
}: {
  role: "ai" | "human";
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const isAi = role === "ai";
  const accent = isAi ? "text-blue-400" : "text-amber-400";
  const bg = isAi ? "bg-blue-950 border-blue-800" : "bg-amber-950 border-amber-800";
  const bar = isAi ? "bg-blue-500" : "bg-amber-500";

  return (
    <div className={`flex-1 rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <Badge role={role} />
        <span className={`text-xs font-semibold ${accent}`}>{pct}%</span>
      </div>
      <p className={`text-3xl font-bold ${accent} leading-tight`}>{count}</p>
      <p className="text-xs text-zinc-400 mt-1">
        {count === 1 ? "sesión" : "sesiones"}
      </p>
      <div className="mt-3 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${bar} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function LastInteractionCard({ data, isLoading }: LastInteractionCardProps) {
  if (isLoading) {
    return (
      <Card>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
          Sesiones por último rol
        </p>
        <div className="flex gap-3">
          <div className="flex-1 h-28 bg-zinc-800 rounded-xl animate-pulse" />
          <div className="flex-1 h-28 bg-zinc-800 rounded-xl animate-pulse" />
        </div>
      </Card>
    );
  }

  const aiSessions = data?.aiSessions ?? 0;
  const humanSessions = data?.humanSessions ?? 0;
  const total = aiSessions + humanSessions;

  return (
    <Card>
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
        Sesiones por último rol
      </p>
      <p className="text-xs text-zinc-600 mb-4">
        Quién envió el último mensaje en cada sesión
      </p>
      <div className="flex gap-3">
        <RolePanel role="ai" count={aiSessions} total={total} />
        <RolePanel role="human" count={humanSessions} total={total} />
      </div>
    </Card>
  );
}
