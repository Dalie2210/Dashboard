export function StatCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-pulse">
      <div className="h-3 w-24 bg-zinc-700 rounded mb-4" />
      <div className="h-8 w-16 bg-zinc-700 rounded mb-2" />
      <div className="h-3 w-32 bg-zinc-800 rounded" />
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-pulse"
      style={{ minHeight: height + 40 }}
    >
      <div className="h-3 w-32 bg-zinc-700 rounded mb-6" />
      <div
        className="bg-zinc-800 rounded-xl w-full"
        style={{ height }}
      />
    </div>
  );
}
