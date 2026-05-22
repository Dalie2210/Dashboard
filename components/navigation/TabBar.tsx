"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabBar() {
  const pathname = usePathname();

  const isDashboard = pathname === "/";
  const isAssistant = pathname === "/assistant";

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Brand row */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-800/50">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
          Be Welly
        </span>
      </div>

      {/* Tabs row */}
      <div className="flex gap-6 px-6">
        <Link
          href="/"
          className={`py-4 text-sm font-medium border-b-2 transition-colors ${
            isDashboard
              ? "border-blue-500 text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Dashboard
        </Link>
        <Link
          href="/assistant"
          className={`py-4 text-sm font-medium border-b-2 transition-colors ${
            isAssistant
              ? "border-blue-500 text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Asistente IA
        </Link>
      </div>
    </div>
  );
}
