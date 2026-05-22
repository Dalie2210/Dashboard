"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatMinutesAgo, getUrgencyColor, getUrgencyBg, formatISODate } from "@/lib/utils";
import type { LastInteractionResponse } from "@/lib/types";

interface LastInteractionCardProps {
  data: LastInteractionResponse | undefined;
  isLoading: boolean;
}

function InteractionPanel({
  role,
  minutesAgo,
  lastMessage,
}: {
  role: "ai" | "human";
  minutesAgo: number | null;
  lastMessage: string | null;
}) {
  const urgencyColor = getUrgencyColor(minutesAgo);
  const urgencyBg = getUrgencyBg(minutesAgo);

  return (
    <div className={`flex-1 rounded-xl border p-4 ${urgencyBg}`}>
      <div className="flex items-center justify-between mb-3">
        <Badge role={role} />
        <span className={`text-xs font-medium ${urgencyColor}`}>
          {minutesAgo !== null && minutesAgo < 5
            ? "Activo"
            : minutesAgo !== null && minutesAgo < 30
            ? "Reciente"
            : "Inactivo"}
        </span>
      </div>
      <p className={`text-2xl font-bold ${urgencyColor} leading-tight`}>
        {formatMinutesAgo(minutesAgo)}
      </p>
      <p className="text-xs text-zinc-500 mt-2">{formatISODate(lastMessage)}</p>
    </div>
  );
}

export function LastInteractionCard({ data, isLoading }: LastInteractionCardProps) {
  if (isLoading) {
    return (
      <Card>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
          Última interacción
        </p>
        <div className="flex gap-3">
          <div className="flex-1 h-28 bg-zinc-800 rounded-xl animate-pulse" />
          <div className="flex-1 h-28 bg-zinc-800 rounded-xl animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
        Última interacción
      </p>
      <div className="flex gap-3">
        <InteractionPanel
          role="ai"
          minutesAgo={data?.aiMinutesAgo ?? null}
          lastMessage={data?.lastAiMessage ?? null}
        />
        <InteractionPanel
          role="human"
          minutesAgo={data?.humanMinutesAgo ?? null}
          lastMessage={data?.lastHumanMessage ?? null}
        />
      </div>
    </Card>
  );
}
