const statusLabels = {
  recommended: "Recommended",
  new: "New mission",
  "in-progress": "In progress",
} as const;

export function ChallengeStatusBadge({ status }: { status: keyof typeof statusLabels }) {
  const styles = {
    recommended: "border-[#66FCF1]/25 bg-[#66FCF1]/10 text-[#66FCF1]",
    new: "border-white/10 bg-white/5 text-[#C5C6C7]/70",
    "in-progress": "border-[#45A29E]/25 bg-[#45A29E]/10 text-[#8de4dd]",
  }[status];

  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] ${styles}`}>{statusLabels[status]}</span>;
}
