import { LucideIcon, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

export function Pill({
  label,
  icon: Icon = Sparkles,
  className,
}: {
  label: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border border-white/5 bg-[#10161d] px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]",
        className
      )}
    >
      <Icon className="h-4 w-4 text-[#66FCF1]" />
      <span className="text-sm font-medium text-[#C5C6C7]">{label}</span>
    </div>
  );
}
