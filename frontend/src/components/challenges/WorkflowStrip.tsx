import { ArrowRight } from "lucide-react";

export function WorkflowStrip({ steps, compact = false }: { steps: string[]; compact?: boolean }) {
  return (
    <div className={`flex items-center overflow-x-auto ${compact ? "gap-1.5" : "gap-2"}`}>
      {steps.map((step, index) => (
        <div key={`${step}-${index}`} className="flex shrink-0 items-center gap-1.5">
          <span className={`rounded-md border border-[#66FCF1]/15 bg-[#66FCF1]/7 text-[#C5C6C7]/75 ${compact ? "px-1.5 py-1 text-[9px]" : "px-2 py-1.5 text-[11px]"}`}>
            {step}
          </span>
          {index < steps.length - 1 && <ArrowRight className={`shrink-0 text-[#45A29E]/70 ${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`} />}
        </div>
      ))}
    </div>
  );
}
