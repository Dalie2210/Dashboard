"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { SessionsTimelineResponse } from "@/lib/types";

interface SessionsTimelineChartProps {
  timelineData: SessionsTimelineResponse | undefined;
  isLoading: boolean;
}

function formatDay(day: string): string {
  const d = new Date(day + "T12:00:00");
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

interface TooltipPayloadItem {
  value: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-zinc-400 mb-0.5">{label ? formatDay(label) : ""}</p>
      <p className="text-white font-semibold">
        {count} {count === 1 ? "sesión" : "sesiones"}
      </p>
    </div>
  );
}

export function SessionsTimelineChart({
  timelineData,
  isLoading,
}: SessionsTimelineChartProps) {
  if (isLoading) {
    return (
      <Card>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
          Sesiones por día
        </p>
        <div className="h-56 bg-zinc-800 rounded-xl animate-pulse" />
      </Card>
    );
  }

  const points = timelineData?.points ?? [];

  if (points.length === 0) {
    return (
      <Card>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
          Sesiones por día
        </p>
        <div className="flex items-center justify-center h-56 text-zinc-600 text-sm">
          Sin datos para el período seleccionado
        </div>
      </Card>
    );
  }

  const avg = points.reduce((s, p) => s + p.sessionCount, 0) / points.length;

  const chartData = points.map((p) => ({
    day: p.day,
    sesiones: p.sessionCount,
  }));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Sesiones por día
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">
            {points.length} {points.length === 1 ? "día con actividad" : "días con actividad"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Promedio</p>
          <p className="text-sm font-semibold text-blue-400">
            {avg.toFixed(1)} / día
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={formatDay}
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1 }} />
          <ReferenceLine
            y={avg}
            stroke="#3b82f6"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />
          <Line
            type="monotone"
            dataKey="sesiones"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#60a5fa", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
