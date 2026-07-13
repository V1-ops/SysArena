import { CheckCircle2, Clock3, ShieldCheck, Zap } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { challenges } from "../../data/challenges";
import { Button } from "../../components/ui/button";

const timeline = [
  "Request received",
  "Auth checked",
  "Queue processed",
  "Delivery confirmed",
];

export function SimulationPage() {
  const { challengeId } = useParams();
  const challenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];

  return (
    <div className="min-h-screen bg-[#091014] px-5 py-6 md:px-8 xl:px-12">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[#45A29E]">Simulation</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{challenge.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#C5C6C7]/75">
          <div className="rounded-2xl border border-white/6 bg-white/5 px-4 py-2.5">Run Status: Active</div>
          <div className="rounded-2xl border border-white/6 bg-white/5 px-4 py-2.5">Elapsed: 00:08</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/6 bg-[#0D141A] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div className="rounded-[24px] border border-white/6 bg-[#0A1015] p-4">
              <p className="mb-4 text-sm font-medium text-[#C5C6C7]/70">Mini Preview</p>
              <div className="rounded-[22px] border border-[#66FCF1]/10 bg-[#111A22] p-4">
                <div className="space-y-3">
                  <div className="ml-auto max-w-[80%] rounded-2xl bg-[#66FCF1] px-4 py-3 text-sm font-medium text-[#0B0C10]">
                    Hello Bob 👋
                  </div>
                  <div className="max-w-[70%] rounded-2xl bg-[#1F2833] px-4 py-3 text-sm text-[#C5C6C7]">
                    Delivered ✓✓
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[440px] overflow-hidden rounded-[24px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(102,252,241,0.12),transparent_28%),#0B1015]">
              <SimNode label="Client" left="8%" top="18%" />
              <SimNode label="API Gateway" left="32%" top="18%" active />
              <SimNode label="Chat Service" left="58%" top="18%" active />
              <SimNode label="Queue" left="30%" top="58%" active />
              <SimNode label="Database" left="60%" top="58%" />

              <SimPath left="17%" top="25%" width="18%" />
              <SimPath left="46%" top="25%" width="16%" />
              <SimPath left="39%" top="46%" width="2px" height="14%" vertical />
              <SimPath left="49%" top="65%" width="12%" />

              <div className="absolute left-[48%] top-[25%] h-4 w-4 rounded-full bg-[#66FCF1] shadow-[0_0_30px_rgba(102,252,241,0.85)]" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard icon={Zap} label="Latency" value="85ms" />
            <MetricCard icon={ShieldCheck} label="Reliability" value="99.2%" />
            <MetricCard icon={Clock3} label="Throughput" value="12K/s" />
          </div>

          <div className="rounded-[24px] border border-white/6 bg-[#0D141A] p-6">
            <p className="mb-4 text-lg font-semibold text-white">Status Feed</p>
            <div className="space-y-3">
              {timeline.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"
                >
                  <CheckCircle2 className={`h-4 w-4 ${index < 3 ? "text-[#66FCF1]" : "text-[#45A29E]"}`} />
                  <span className="text-sm text-[#C5C6C7]/75">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Button asChild size="lg" className="w-full">
            <Link to={`/result/${challenge.id}`}>Continue to Score</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SimNode({
  label,
  left,
  top,
  active,
}: {
  label: string;
  left: string;
  top: string;
  active?: boolean;
}) {
  return (
    <div
      className={`absolute rounded-2xl border px-4 py-3 text-sm font-medium ${
        active
          ? "border-[#66FCF1]/30 bg-[#112028] text-white shadow-[0_0_30px_rgba(102,252,241,0.15)]"
          : "border-white/6 bg-[#11161d] text-[#C5C6C7]"
      }`}
      style={{ left, top }}
    >
      {label}
    </div>
  );
}

function SimPath({
  left,
  top,
  width,
  height,
  vertical,
}: {
  left: string;
  top: string;
  width: string;
  height?: string;
  vertical?: boolean;
}) {
  return (
    <div
      className="absolute rounded-full bg-[#66FCF1] shadow-[0_0_18px_rgba(102,252,241,0.5)]"
      style={vertical ? { left, top, width, height } : { left, top, width, height: "2px" }}
    />
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-[#0D141A] p-5">
      <Icon className="h-5 w-5 text-[#66FCF1]" />
      <p className="mt-4 text-sm text-[#C5C6C7]/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
