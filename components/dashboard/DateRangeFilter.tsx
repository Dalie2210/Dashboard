"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import type { DateFilterState } from "@/hooks/useDateFilter";

interface DateRangeFilterProps {
  filter: DateFilterState;
}

const presets = [
  { label: "7 días", value: "7d" as const },
  { label: "30 días", value: "30d" as const },
  { label: "Este mes", value: "month" as const },
];

export function DateRangeFilter({ filter }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({
    from: filter.fromDate,
    to: filter.toDate,
  });

  function applyRange() {
    if (range.from && range.to) {
      filter.setRange(range.from, range.to);
      setOpen(false);
    }
  }

  const displayFrom = filter.fromDate.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const displayTo = filter.toDate.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => filter.setPreset(p.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {displayFrom} – {displayTo}
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-20 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4">
            <DayPicker
              mode="range"
              selected={range as { from: Date; to: Date }}
              onSelect={(r) => setRange(r ?? {})}
              disabled={{ after: new Date() }}
              classNames={{
                root: "rdp-custom",
                day: "rdp-day-custom",
              }}
            />
            <div className="flex justify-end gap-2 mt-3 border-t border-zinc-800 pt-3">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={applyRange}
                disabled={!range.from || !range.to}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
