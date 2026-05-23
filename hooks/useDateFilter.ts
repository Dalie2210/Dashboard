"use client";

import { useState, useCallback } from "react";
import { toDateString, getDefaultDateRange } from "@/lib/utils";

const defaults = getDefaultDateRange();

export interface DateFilterState {
  from: string;
  to: string;
  fromDate: Date;
  toDate: Date;
  setRange: (from: Date, to: Date) => void;
  setPreset: (preset: "7d" | "30d" | "month") => void;
}

export function useDateFilter(): DateFilterState {
  const [fromDate, setFromDate] = useState<Date>(defaults.from);
  const [toDate, setToDate] = useState<Date>(defaults.to);

  const setRange = useCallback((from: Date, to: Date) => {
    const normalizedFrom = new Date(from);
    normalizedFrom.setHours(0, 0, 0, 0);
    const normalizedTo = new Date(to);
    normalizedTo.setHours(23, 59, 59, 999);
    setFromDate(normalizedFrom);
    setToDate(normalizedTo);
  }, []);

  const setPreset = useCallback((preset: "7d" | "30d" | "month") => {
    const now = new Date();
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    if (preset === "7d") {
      from.setDate(from.getDate() - 6);
    } else if (preset === "30d") {
      from.setDate(from.getDate() - 29);
    } else {
      from.setDate(1);
    }
    setFromDate(from);
    setToDate(to);
  }, []);

  return {
    from: toDateString(fromDate),
    to: toDateString(toDate),
    fromDate,
    toDate,
    setRange,
    setPreset,
  };
}
