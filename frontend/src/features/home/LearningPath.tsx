import { ArrowRight, Bug, Database, Gauge, Network, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { learningPath } from "../../data/homeVisualizationData";

const pathIcons = { database: Database, agents: Sparkles, network: Network, debug: Bug, optimize: Gauge } as const;

export function LearningPath() {
  return (
    <div className="relative">
      <div className="absolute left-[10%] right-[10%] top-10 hidden h-px bg-gradient-to-r from-[#66FCF1]/10 via-[#66FCF1]/45 to-[#66FCF1]/10 xl:block" />
      <div className="grid gap-4 xl:grid-cols-5">
        {learningPath.map((item, index) => {
          const Icon = pathIcons[item.icon];
          return (
            <Link key={item.challengeId} to={`/challenge/${item.challengeId}`} className="group relative rounded-2xl border border-white/8 bg-[#101820] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#66FCF1]/30 hover:bg-[#12212A] hover:shadow-[0_20px_45px_rgba(0,0,0,0.25)]">
              <div className="relative z-10 flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#66FCF1]/25 bg-[#0B0C10] text-[10px] font-semibold text-[#66FCF1]">{item.number}</span>
                <Icon className="h-5 w-5 text-[#45A29E] transition-colors group-hover:text-[#66FCF1]" />
              </div>
              <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-[#45A29E]">{index === 0 ? "Foundations" : index === 4 ? "Mastery" : "Next layer"}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 min-h-10 text-xs leading-5 text-[#C5C6C7]/60">{item.outcome}</p>
              <div className="mt-4 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.12em] text-[#C5C6C7]/45"><span>{item.difficulty}</span><span>{item.time}</span></div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#66FCF1]">Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></div>
              {index < learningPath.length - 1 && <div className="absolute -bottom-5 left-6 h-6 w-px bg-[#66FCF1]/30 xl:hidden" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
