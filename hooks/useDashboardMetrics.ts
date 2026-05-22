"use client";

import useSWR from "swr";
import type { MetricsResponse, LastRoleSessionResponse, SessionsTimelineResponse } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Error al obtener métricas");
    return r.json();
  });

function rangeIncludesToday(to: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return to >= today;
}

function swrOptions(to: string) {
  const live = rangeIncludesToday(to);
  return {
    refreshInterval: live ? 3_600_000 : 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: live,
    dedupingInterval: live ? 60_000 : 0,
  };
}

export function useDashboardMetrics(from: string, to: string) {
  const { data, error, isValidating } = useSWR<MetricsResponse>(
    `/api/dashboard/metrics?from=${from}&to=${to}`,
    fetcher,
    swrOptions(to)
  );

  return {
    metrics: data,
    isLoading: !data && !error,
    isError: !!error,
    isValidating,
  };
}

export function useLastInteraction(from: string, to: string) {
  const { data, error, isValidating } = useSWR<LastRoleSessionResponse>(
    `/api/dashboard/last-interaction?from=${from}&to=${to}`,
    fetcher,
    swrOptions(to)
  );

  return {
    lastInteraction: data,
    isLoading: !data && !error,
    isError: !!error,
    isValidating,
  };
}

export function useSessionsTimeline(from: string, to: string) {
  const { data, error, isValidating } = useSWR<SessionsTimelineResponse>(
    `/api/dashboard/sessions-timeline?from=${from}&to=${to}`,
    fetcher,
    swrOptions(to)
  );

  return {
    timelineData: data,
    isLoading: !data && !error,
    isError: !!error,
    isValidating,
  };
}
