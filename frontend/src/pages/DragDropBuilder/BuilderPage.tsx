import { Clock3, Play, RefreshCw, Save, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { challenges } from "../../data/challenges";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export function BuilderPage() {
  const { challengeId } = useParams();
  const challenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#45A29E]">
              {challenge.category}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{challenge.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#C5C6C7]/65">
              <span>{challenge.difficulty}</span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#45A29E]" />
                {challenge.estimatedTime}
              </span>
              <span>Draft Saved</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#66FCF1]/10 bg-[#0F151B] px-4 py-3 text-sm text-[#C5C6C7]/70">
            Goal: Create a low-latency, reliable graph
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr_320px]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-lg font-semibold text-white">Node Palette</h2>
            {challenge.supportedComponents.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/5 bg-[#0F151B] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#66FCF1]/15"
              >
                <p className="font-medium text-white">{item}</p>
                <p className="mt-1 text-sm text-[#C5C6C7]/60">
                  Drag into the canvas to compose the architecture.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative min-h-[620px] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(102,252,241,0.08),transparent_32%)]" />
              <GraphNode x="12%" y="20%" label="Client" />
              <GraphNode x="40%" y="20%" label="API Gateway" />
              <GraphNode x="68%" y="20%" label="Chat Service" active />
              <GraphNode x="24%" y="55%" label="Redis" />
              <GraphNode x="52%" y="55%" label="Queue" active />
              <GraphNode x="78%" y="55%" label="Database" />
              <GraphEdge left="19%" top="27%" width="22%" />
              <GraphEdge left="47%" top="27%" width="22%" active />
              <GraphEdge left="31%" top="62%" width="21%" />
              <GraphEdge left="59%" top="62%" width="18%" active />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Properties & Guidance</h2>
              <p className="mt-2 text-sm leading-6 text-[#C5C6C7]/65">
                Selected nodes reveal their purpose, connection requirements, and light validation hints.
              </p>
            </div>

            <div className="rounded-2xl border border-[#66FCF1]/10 bg-[#0F151B] p-4">
              <p className="text-sm font-medium text-white">Selected Node</p>
              <p className="mt-2 text-[#66FCF1]">Queue</p>
              <p className="mt-2 text-sm leading-6 text-[#C5C6C7]/65">
                Buffers traffic bursts and improves reliability when downstream services slow down.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0F151B] p-4">
              <p className="text-sm font-medium text-white">Hint</p>
              <p className="mt-2 text-sm leading-6 text-[#C5C6C7]/65">{challenge.hint}</p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button asChild size="lg">
                <Link to={`/simulate/${challenge.id}`}>
                  <Play className="h-4 w-4" />
                  Run Simulation
                </Link>
              </Button>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
              <Button variant="ghost">
                <Sparkles className="h-4 w-4" />
                Hint
              </Button>
              <Button variant="ghost">
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GraphNode({
  x,
  y,
  label,
  active,
}: {
  x: string;
  y: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`absolute rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_18px_40px_rgba(0,0,0,0.35)] ${
        active
          ? "border-[#66FCF1]/30 bg-[#112028] text-white shadow-[0_0_30px_rgba(102,252,241,0.15)]"
          : "border-white/6 bg-[#11161d] text-[#C5C6C7]"
      }`}
      style={{ left: x, top: y }}
    >
      {label}
    </div>
  );
}

function GraphEdge({
  left,
  top,
  width,
  active,
}: {
  left: string;
  top: string;
  width: string;
  active?: boolean;
}) {
  return (
    <div
      className={`absolute h-[2px] rounded-full ${
        active ? "bg-[#66FCF1] shadow-[0_0_18px_rgba(102,252,241,0.6)]" : "bg-[#45A29E]/50"
      }`}
      style={{ left, top, width }}
    />
  );
}
