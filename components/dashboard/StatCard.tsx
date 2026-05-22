import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: ReactNode;
  accent?: string;
}

export function StatCard({ label, value, sublabel, icon, accent = "text-blue-400" }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {label}
        </p>
        <span className={`${accent} opacity-80`}>{icon}</span>
      </div>
      <p className={`text-3xl font-bold text-white tabular-nums`}>{value}</p>
      {sublabel && (
        <p className="mt-1 text-xs text-zinc-500">{sublabel}</p>
      )}
    </Card>
  );
}
