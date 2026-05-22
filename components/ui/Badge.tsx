interface BadgeProps {
  role: "ai" | "human";
}

export function Badge({ role }: BadgeProps) {
  const styles =
    role === "ai"
      ? "bg-blue-900/50 text-blue-300 border-blue-700"
      : "bg-amber-900/50 text-amber-300 border-amber-700";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}
    >
      {role === "ai" ? "IA" : "Humano"}
    </span>
  );
}
