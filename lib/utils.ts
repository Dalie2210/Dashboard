export function formatMinutesAgo(minutes: number | null): string {
  if (minutes === null) return "Sin datos";
  if (minutes < 1) return "Hace menos de 1 min";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return mins > 0 ? `Hace ${hours}h ${mins}min` : `Hace ${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days !== 1 ? "s" : ""}`;
}

export function getUrgencyColor(minutes: number | null): string {
  if (minutes === null) return "text-zinc-400";
  if (minutes < 5) return "text-emerald-400";
  if (minutes < 30) return "text-amber-400";
  return "text-red-400";
}

export function getUrgencyBg(minutes: number | null): string {
  if (minutes === null) return "bg-zinc-900 border-zinc-700";
  if (minutes < 5) return "bg-emerald-950 border-emerald-800";
  if (minutes < 30) return "bg-amber-950 border-amber-800";
  return "bg-red-950 border-red-800";
}

export function formatISODate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultDateRange(): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}
