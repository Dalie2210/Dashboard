"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useDateFilter } from "@/hooks/useDateFilter";
import {
  useDashboardMetrics,
  useLastInteraction,
  useSessionsTimeline,
  useSalesMetrics,
  useSalesTimeline,
} from "@/hooks/useDashboardMetrics";
import { StatCard } from "./StatCard";
import { LastInteractionCard } from "./LastInteractionCard";
import { DateRangeFilter } from "./DateRangeFilter";
import { RefreshIndicator } from "./RefreshIndicator";
import { StatCardSkeleton } from "./LoadingSkeleton";

const SessionsTimelineChart = dynamic(
  () => import("./SessionsTimelineChart").then((m) => m.SessionsTimelineChart),
  { ssr: false }
);
const SalesTimelineChart = dynamic(
  () => import("./SalesTimelineChart").then((m) => m.SalesTimelineChart),
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

function RevenueIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}

function BuyersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="h-px flex-1 bg-zinc-800" />
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{title}</span>
      <div className="h-px flex-1 bg-zinc-800" />
    </div>
  );
}

function rangeIncludesToday(toDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return toDate >= today;
}

function formatUSD(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DashboardClient() {
  const filter = useDateFilter();
  const isLive = rangeIncludesToday(filter.toDate);

  const { metrics, isLoading: metricsLoading, isValidating: mv } = useDashboardMetrics(filter.from, filter.to);
  const { lastInteraction, isLoading: liLoading } = useLastInteraction(filter.from, filter.to);
  const { timelineData, isLoading: timelineLoading } = useSessionsTimeline(filter.from, filter.to);
  const { salesMetrics, isLoading: salesLoading } = useSalesMetrics(filter.from, filter.to);
  const { salesTimeline, isLoading: salesTimelineLoading } = useSalesTimeline(filter.from, filter.to);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (metrics) setLastUpdated(new Date());
  }, [metrics]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl font-bold text-white">Dashboard del Agente</h1>
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

        {/* ── Ventas ── */}
        <SectionDivider title="Ventas" />

        {/* KPI Cards — Sales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {salesLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label="Ingresos totales"
                value={formatUSD(salesMetrics?.totalRevenue ?? 0)}
                sublabel="En el período seleccionado"
                icon={<RevenueIcon />}
                accent="text-emerald-400"
              />
              <StatCard
                label="Transacciones"
                value={salesMetrics?.totalTransactions?.toLocaleString("es-CO") ?? "0"}
                sublabel="Ventas completadas"
                icon={<CartIcon />}
                accent="text-teal-400"
              />
              <StatCard
                label="Ticket promedio"
                value={formatUSD(salesMetrics?.avgTicket ?? 0)}
                sublabel="Por transacción"
                icon={<TicketIcon />}
                accent="text-cyan-400"
              />
              <StatCard
                label="Compradores únicos"
                value={salesMetrics?.uniqueBuyers?.toLocaleString("es-CO") ?? "0"}
                sublabel="Emails distintos"
                icon={<BuyersIcon />}
                accent="text-emerald-400"
              />
            </>
          )}
        </div>

        {/* Sales timeline */}
        <SalesTimelineChart salesTimeline={salesTimeline} isLoading={salesTimelineLoading} />

        {/* ── Agente IA ── */}
        <SectionDivider title="Agente IA" />

        {/* KPI Cards — Agent */}
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
                accent="text-blue-400"
              />
            </>
          )}
        </div>

        {/* Last Interaction */}
        <LastInteractionCard data={lastInteraction} isLoading={liLoading} />

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
