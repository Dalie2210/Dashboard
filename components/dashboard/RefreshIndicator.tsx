"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

interface RefreshIndicatorProps {
  isValidating: boolean;
  lastUpdated: Date | null;
}

export function RefreshIndicator({ isValidating, lastUpdated }: RefreshIndicatorProps) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      {isValidating ? (
        <Spinner size="sm" />
      ) : (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      <span>
        {isValidating
          ? "Actualizando..."
          : lastUpdated
          ? `Actualizado hace ${secondsAgo}s`
          : "En vivo"}
      </span>
    </div>
  );
}
