"use client";

import useSWR from "swr";
import type { MetricsResponse } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Error al obtener métricas");
    return r.json();
  });

export function useDashboardMetrics(from: string, to: string) {
  const { data, error, isValidating } = useSWR<MetricsResponse>(
    `/api/dashboard/metrics?from=${from}&to=${to}`,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5_000,
    }
  );

  return {
    metrics: data,
    isLoading: !data && !error,
    isError: !!error,
    isValidating,
  };
}

export function useLastInteraction(from: string, to: string) {
  const { data, error, isValidating } = useSWR(
    `/api/dashboard/last-interaction?from=${from}&to=${to}`,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5_000,
    }
  );

  return {
    lastInteraction: data,
    isLoading: !data && !error,
    isError: !!error,
    isValidating,
  };
}

export function useSessions(from: string, to: string) {
  const { data, error, isValidating } = useSWR(
    `/api/dashboard/sessions?from=${from}&to=${to}`,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5_000,
    }
  );

  return {
    sessionsData: data,
    isLoading: !data && !error,
    isError: !!error,
    isValidating,
  };
}
