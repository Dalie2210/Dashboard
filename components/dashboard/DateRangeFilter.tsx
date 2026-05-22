"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import type { DateFilterState } from "@/hooks/useDateFilter";

interface DateRangeFilterProps {
  filter: DateFilterState;
}

const presets = [
  { label: "7 días", value: "7d" as const },
  { label: "30 días", value: "30d" as const },
  { label: "Este mes", value: "month" as const },
];

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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

  function cancel() {
    setRange({ from: filter.fromDate, to: filter.toDate });
    setOpen(false);
  }

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
          <CalendarIcon />
          <span>{formatDisplay(filter.fromDate)}</span>
          <span className="text-zinc-600">→</span>
          <span>{formatDisplay(filter.toDate)}</span>
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={cancel} />
          <div className="absolute right-0 top-full mt-2 z-20 bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden">

            {/* Selected range display */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Desde</p>
                <p className="text-sm font-medium text-white">
                  {range.from ? formatDisplay(range.from) : <span className="text-zinc-600">—</span>}
                </p>
              </div>
              <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="flex-1 text-right">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Hasta</p>
                <p className="text-sm font-medium text-white">
                  {range.to ? formatDisplay(range.to) : <span className="text-zinc-600">—</span>}
                </p>
              </div>
            </div>

            {/* Calendar */}
            <div className="px-4 py-4">
              <DayPicker
                mode="range"
                numberOfMonths={2}
                selected={range as { from: Date; to: Date }}
                onSelect={(r) => setRange(r ?? {})}
                disabled={{ after: new Date() }}
                classNames={{
                  months: "flex gap-6",
                  month: "w-[230px]",
                  month_caption: "flex items-center justify-between mb-3 px-1",
                  caption_label: "text-sm font-semibold text-white capitalize",
                  nav: "flex items-center gap-1",
                  button_previous:
                    "w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors",
                  button_next:
                    "w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors",
                  weeks: "w-full",
                  weekdays: "flex mb-1",
                  weekday:
                    "w-9 h-8 flex items-center justify-center text-[11px] font-medium text-zinc-500 uppercase",
                  week: "flex",
                  day: "w-9 h-9 p-0 flex items-center justify-center relative",
                  day_button:
                    "w-9 h-9 flex items-center justify-center text-sm text-zinc-300 rounded-full hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer focus:outline-none",
                  selected: "",
                  range_start:
                    "bg-blue-600/20 rounded-l-full [&>button]:bg-blue-600 [&>button]:text-white [&>button]:hover:bg-blue-500",
                  range_end:
                    "bg-blue-600/20 rounded-r-full [&>button]:bg-blue-600 [&>button]:text-white [&>button]:hover:bg-blue-500",
                  range_middle:
                    "bg-blue-600/10 rounded-none [&>button]:text-blue-300 [&>button]:hover:bg-blue-600/20",
                  today: "[&>button]:font-bold [&>button]:text-blue-400",
                  outside:
                    "[&>button]:text-zinc-700 [&>button]:hover:text-zinc-500 [&>button]:hover:bg-transparent",
                  disabled:
                    "[&>button]:text-zinc-700 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent",
                }}
                components={{
                  Chevron: ({ orientation }) =>
                    orientation === "left" ? <ChevronLeft /> : <ChevronRight />,
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-zinc-800 bg-zinc-950/40">
              <p className="text-xs text-zinc-600">
                {range.from && range.to
                  ? (() => {
                      const days = Math.round(
                        (range.to.getTime() - range.from.getTime()) / 86_400_000
                      ) + 1;
                      return `${days} ${days === 1 ? "día" : "días"} seleccionados`;
                    })()
                  : "Selecciona el rango"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={cancel}
                  className="px-4 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={applyRange}
                  disabled={!range.from || !range.to}
                  className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
