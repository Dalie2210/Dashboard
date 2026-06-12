"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { SalesTimelineResponse } from "@/lib/types";

interface SalesTimelineChartProps {
  salesTimeline: SalesTimelineResponse | undefined;
  isLoading: boolean;
}

function formatUSD(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface TooltipPayloadItem {
  value: number;
  payload: { revenue: number; transactions: number };
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
  const revenue = payload[0].value;
  const transactions = payload[0].payload.transactions;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-emerald-400 font-semibold">{formatUSD(revenue)}</p>
      <p className="text-zinc-300">
        {transactions} {transactions === 1 ? "venta" : "ventas"}
      </p>
    </div>
  );
}

export function SalesTimelineChart({
  salesTimeline,
  isLoading,
}: SalesTimelineChartProps) {
  if (isLoading) {
    return (
      <Card>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
          Ingresos por día
        </p>
        <div className="h-56 bg-zinc-800 rounded-xl animate-pulse" />
      </Card>
    );
  }

  const points = salesTimeline?.points ?? [];

  if (points.length === 0) {
    return (
      <Card>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
          Ingresos por día
        </p>
        <div className="flex items-center justify-center h-56 text-zinc-600 text-sm">
          Sin ventas en el período seleccionado
        </div>
      </Card>
    );
  }

  const totalRevenue = points.reduce((s, p) => s + p.revenue, 0);
  const avgDaily = totalRevenue / points.length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Ingresos por día
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">
            {points.length} {points.length === 1 ? "día con ventas" : "días con ventas"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Promedio diario</p>
          <p className="text-sm font-semibold text-emerald-400">
            {formatUSD(avgDaily)} / día
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#salesGradient)"
            dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#34d399", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
