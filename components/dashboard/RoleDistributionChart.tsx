"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { MetricsResponse } from "@/lib/types";

const COLORS = {
  ai: "#3b82f6",
  human: "#f59e0b",
};

interface RoleDistributionChartProps {
  metrics: MetricsResponse | undefined;
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { percentage: number } }[] }) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-white font-medium">{entry.name}</p>
        <p className="text-zinc-300">
          {entry.value} mensajes ({entry.payload.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export function RoleDistributionChart({ metrics, isLoading }: RoleDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
          Distribución de roles
        </p>
        <div className="h-64 bg-zinc-800 rounded-xl animate-pulse" />
      </Card>
    );
  }

  const data = [
    {
      name: "IA",
      value: metrics?.roleCounts.ai.count ?? 0,
      percentage: metrics?.roleCounts.ai.percentage ?? 0,
    },
    {
      name: "Humano",
      value: metrics?.roleCounts.human.count ?? 0,
      percentage: metrics?.roleCounts.human.percentage ?? 0,
    },
  ];

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
        Distribución de roles
      </p>
      <p className="text-xs text-zinc-600 mb-4">{total} mensajes totales</p>
      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? COLORS.ai : COLORS.human}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-zinc-300 text-sm">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center mt-[-24px]">
            <p className="text-2xl font-bold text-white">{total}</p>
            <p className="text-xs text-zinc-500">mensajes</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
          <div>
            <p className="text-xs text-zinc-400">IA</p>
            <p className="text-sm font-semibold text-white">
              {metrics?.roleCounts.ai.percentage ?? 0}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
          <div>
            <p className="text-xs text-zinc-400">Humano</p>
            <p className="text-sm font-semibold text-white">
              {metrics?.roleCounts.human.percentage ?? 0}%
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
