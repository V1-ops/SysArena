import { CheckCircle2, CircleAlert, CircleSlash2, Loader2, XCircle } from "lucide-react";
import { useGraphStore } from "../hooks/useGraphStore";

interface EventLogProps {
  embedded?: boolean;
}

export function EventLog({ embedded = false }: EventLogProps) {
  const eventLog = useGraphStore((state) => state.eventLog);

  return (
    <section className={embedded ? "space-y-3" : "rounded-lg border border-white/8 bg-[#101820]"}>
      {!embedded && <div className="border-b border-white/8 p-4">
        <p className="text-sm font-semibold text-white">Execution Log</p>
        <p className="mt-1 text-xs leading-5 text-[#C5C6C7]/60">Active node and minimal work notes during simulation.</p>
      </div>}

      <div className="max-h-[280px] space-y-2 overflow-auto rounded-lg border border-white/8 bg-[#0B0C10] p-3">
        {eventLog.length ? (
          eventLog.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-white/8 bg-[#0B0C10] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {entry.status === "running" && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#66FCF1]" />}
                  {entry.status === "success" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#45A29E]" />}
                  {entry.status === "degraded" && <CircleAlert className="h-3.5 w-3.5 shrink-0 text-amber-300" />}
                  {entry.status === "skipped" && <CircleSlash2 className="h-3.5 w-3.5 shrink-0 text-[#C5C6C7]/45" />}
                  {entry.status === "error" && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-300" />}
                  <p className="truncate text-xs font-medium text-white">{entry.nodeLabel}</p>
                </div>
                <span className="shrink-0 text-[10px] text-[#C5C6C7]/45">{entry.timestamp}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#C5C6C7]/65">{entry.message}</p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-[#0B0C10] p-4 text-sm leading-6 text-[#C5C6C7]/58">
            Run a simulation to see node-by-node execution events.
          </div>
        )}
      </div>
    </section>
  );
}
