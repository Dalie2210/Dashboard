"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useDateFilter } from "@/hooks/useDateFilter";
import {
  useDashboardMetrics,
  useLastInteraction,
  useSessionsTimeline,
} from "@/hooks/useDashboardMetrics";
import { StatCard } from "./StatCard";
import { LastInteractionCard } from "./LastInteractionCard";
import { DateRangeFilter } from "./DateRangeFilter";
import { RefreshIndicator } from "./RefreshIndicator";
import { StatCardSkeleton } from "./LoadingSkeleton";

const RoleDistributionChart = dynamic(
  () => import("./RoleDistributionChart").then((m) => m.RoleDistributionChart),
  { ssr: false }
);
const SessionsTimelineChart = dynamic(
  () => import("./SessionsTimelineChart").then((m) => m.SessionsTimelineChart),
  { ssr: false }
);

function MessageIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function SessionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function AvgIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function rangeIncludesToday(toDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return toDate >= today;
}

export function DashboardClient() {
  const filter = useDateFilter();
  const isLive = rangeIncludesToday(filter.toDate);

  const { metrics, isLoading: metricsLoading, isValidating: mv } = useDashboardMetrics(filter.from, filter.to);
  const { lastInteraction, isLoading: liLoading } = useLastInteraction(filter.from, filter.to);
  const { timelineData, isLoading: timelineLoading } = useSessionsTimeline(filter.from, filter.to);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (metrics) setLastUpdated(new Date());
  }, [metrics]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                Be Welly
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">Dashboard del Agente</h1>
          </div>
          <RefreshIndicator isValidating={mv} lastUpdated={lastUpdated} isLive={isLive} />
        </div>

        {/* Date Filter */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-zinc-500">
            Período:{" "}
            <span className="text-zinc-300">
              {filter.fromDate.toLocaleDateString("es-CO")} –{" "}
              {filter.toDate.toLocaleDateString("es-CO")}
            </span>
          </p>
          <DateRangeFilter filter={filter} />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label="Mensajes totales"
                value={metrics?.totalMessages?.toLocaleString("es-CO") ?? "0"}
                sublabel="En el período seleccionado"
                icon={<MessageIcon />}
                accent="text-blue-400"
              />
              <StatCard
                label="Sesiones"
                value={metrics?.totalSessions?.toLocaleString("es-CO") ?? "0"}
                sublabel="Conversaciones únicas"
                icon={<SessionIcon />}
                accent="text-violet-400"
              />
              <StatCard
                label="Promedio mensajes/sesión"
                value={metrics?.avgMessagesPerSession ?? "0"}
                sublabel="Mensajes por conversación"
                icon={<AvgIcon />}
                accent="text-emerald-400"
              />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <RoleDistributionChart metrics={metrics} isLoading={metricsLoading} />
          </div>
          <div className="lg:col-span-3">
            <LastInteractionCard data={lastInteraction} isLoading={liLoading} />
          </div>
        </div>

        {/* Sessions timeline */}
        <SessionsTimelineChart timelineData={timelineData} isLoading={timelineLoading} />

        {/* Footer */}
        <p className="text-center text-xs text-zinc-700 pb-2">
          {isLive
            ? "Actualización automática cada hora"
            : "Vista histórica — los datos no se actualizan"}
        </p>
      </div>
    </div>
  );
}
