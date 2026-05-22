"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { SessionsResponse } from "@/lib/types";

interface MessagesPerSessionChartProps {
  sessionsData: SessionsResponse | undefined;
  isLoading: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-zinc-400 text-xs mb-1">Sesión: {label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-white">
            <span style={{ color: p.fill }}>■</span> {p.name}: {p.value}
          </p>
        ))}
        <p className="text-zinc-400 text-xs mt-1 border-t border-zinc-700 pt-1">
          Total: {payload.reduce((s, p) => s + p.value, 0)}
        </p>
      </div>
    );
  }
  return null;
};

export function MessagesPerSessionChart({
  sessionsData,
  isLoading,
}: MessagesPerSessionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
          Mensajes por sesión
        </p>
        <div className="h-64 bg-zinc-800 rounded-xl animate-pulse" />
      </Card>
    );
  }

  const sessions = sessionsData?.sessions ?? [];
  const chartData = sessions.map((s) => ({
    session: s.sessionId.slice(0, 8),
    IA: s.aiCount,
    Humano: s.humanCount,
  }));

  const minWidth = Math.max(chartData.length * 60, 300);

  return (
    <Card>
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
        Mensajes por sesión
      </p>
      <p className="text-xs text-zinc-600 mb-4">
        {sessions.length} sesión{sessions.length !== 1 ? "es" : ""} en el
        período
      </p>
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">
          Sin datos para el período seleccionado
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />
                <XAxis
                  dataKey="session"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#27272a" }} />
                <Legend
                  formatter={(value) => (
                    <span className="text-zinc-300 text-sm">{value}</span>
                  )}
                />
                <Bar dataKey="IA" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Humano" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}
