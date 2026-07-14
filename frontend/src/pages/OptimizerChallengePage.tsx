import { useEffect, useRef, useState } from "react";
import p5 from "p5";
import { ArrowLeft, Crosshair, Play, RotateCcw, Target, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

type GameMode = "manual" | "grid";
type ObjectiveId = "sphere" | "ellipse" | "rotated";
type Point = { x: number; y: number };
type Trail = { points: Point[]; color: string };
type Ball = { x: number; y: number; lr: number; color: string; trail: Point[]; done: boolean; failed: boolean; step: number };
type Objective = { id: ObjectiveId; label: string; formula: string; shape: "circle" | "ellipse" | "rotated"; normalizer: number; loss: (x: number, y: number) => number; gradient: (x: number, y: number) => Point };
type WeightSnapshot = { color: string; lr: number; x: number; y: number; gx: number; gy: number; loss: number };

const CANVAS_WIDTH = 760; const CANVAS_HEIGHT = 460; const MAX_STEPS = 180;
const START = { x: -170, y: 115 }; const COLORS = ["#fb7185", "#60a5fa", "#4ade80"];
const ROOT_TWO = Math.sqrt(2);
const OBJECTIVES: Record<ObjectiveId, Objective> = {
  sphere: { id: "sphere", label: "Sphere", formula: "x² + y²", shape: "circle", normalizer: 1, loss: (x, y) => x * x + y * y, gradient: (x, y) => ({ x: 2 * x, y: 2 * y }) },
  ellipse: { id: "ellipse", label: "Elliptic Bowl", formula: "x² + 3y²", shape: "ellipse", normalizer: 1 / 3, loss: (x, y) => x * x + 3 * y * y, gradient: (x, y) => ({ x: 2 * x, y: 6 * y }) },
  rotated: { id: "rotated", label: "Rotated Valley", formula: "0.2u² + 1.2v²", shape: "rotated", normalizer: 1 / 1.2, loss: (x, y) => { const u = (x + y) / ROOT_TWO; const v = (x - y) / ROOT_TWO; return 0.2 * u * u + 1.2 * v * v; }, gradient: (x, y) => { const u = (x + y) / ROOT_TWO; const v = (x - y) / ROOT_TWO; return { x: (0.4 * u + 2.4 * v) / ROOT_TWO, y: (0.4 * u - 2.4 * v) / ROOT_TWO }; } },
};

export function OptimizerChallengePage() {
  const canvasHost = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<p5 | null>(null);
  const configRef = useRef({ mode: "manual" as GameMode, objective: "sphere" as ObjectiveId, manual: 0.1, grid: [0.01, 0.1, 0.5] });
  const [objective, setObjective] = useState<ObjectiveId>("sphere");
  const [mode, setMode] = useState<GameMode>("manual"); const [manualRate, setManualRate] = useState(0.1);
  const [gridRates, setGridRates] = useState([0.01, 0.1, 0.5]); const [message, setMessage] = useState("Choose a learning rate, then run the optimizer.");
  const [running, setRunning] = useState(false); const [lastStep, setLastStep] = useState(0); const [weights, setWeights] = useState<WeightSnapshot[]>([]);

  useEffect(() => { configRef.current = { mode, objective, manual: manualRate, grid: gridRates }; }, [mode, objective, manualRate, gridRates]);

  useEffect(() => {
    if (!canvasHost.current) return;
    const sketch = (p: p5) => {
      let active: Ball[] = []; let ghosts: Trail[] = []; let finished = true;
      const distance = (point: Point) => Math.hypot(point.x, point.y);
      p.setup = () => { p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).parent(canvasHost.current!); p.frameRate(60); p.textFont("Inter, system-ui, sans-serif"); };
      p.draw = () => {
        const activeObjective = OBJECTIVES[configRef.current.objective];
        p.background("#081118"); drawObjectiveSurface(p, activeObjective); drawGhosts(p, ghosts);
        if (!finished) {
          // At 60fps, 30 frames gives a visible half-second gradient-descent jump.
          if (p.frameCount % 30 === 0) {
            active.forEach(stepBall);
            setLastStep(active[0]?.step ?? 0);
            setWeights(active.map((ball) => snapshotFor(ball, activeObjective)));
            if (active.every((ball) => ball.done || ball.failed)) finishRun();
          }
          drawGradientLines(p, active);
          drawBalls(p, active);
        } else {
          drawGradientLines(p, active);
          drawBalls(p, active);
        }
      };
      const stepBall = (ball: Ball) => { if (ball.done || ball.failed) return; const activeObjective = OBJECTIVES[configRef.current.objective]; const gradient = activeObjective.gradient(ball.x, ball.y); ball.x -= ball.lr * gradient.x * activeObjective.normalizer; ball.y -= ball.lr * gradient.y * activeObjective.normalizer; ball.step += 1; ball.trail.push({ x: ball.x, y: ball.y }); if (distance(ball) < 9) ball.done = true; if (Math.abs(ball.x) > p.width / 2 || Math.abs(ball.y) > p.height / 2) ball.failed = true; if (ball.step >= MAX_STEPS && !ball.done) ball.failed = true; };
      const finishRun = () => { if (finished) return; finished = true; const winner = active.find((ball) => ball.done); ghosts = [...ghosts, ...active.map((ball) => ({ points: ball.trail, color: ball.color }))]; setRunning(false); setLastStep(Math.max(...active.map((ball) => ball.step))); setMessage(configRef.current.mode === "manual" ? (winner ? "You Win / Optimized! The ball reached the global minimum." : "Failed — try adjusting the learning rate.") : (winner ? `Optimized! ${winner.lr} reached the minimum first.` : "No rate converged in time — widen your search.")); };
      const start = () => { const rates = configRef.current.mode === "manual" ? [configRef.current.manual] : configRef.current.grid; const activeObjective = OBJECTIVES[configRef.current.objective]; active = rates.map((lr, index) => ({ x: START.x, y: START.y, lr: Math.max(0.0001, Number(lr) || 0.1), color: COLORS[index], trail: [{ ...START }], done: false, failed: false, step: 0 })); finished = false; setWeights(active.map((ball) => snapshotFor(ball, activeObjective))); setMessage(configRef.current.mode === "manual" ? "Training… follow the gradient toward the center." : "Grid search running — every ball updates on the same clock."); setLastStep(0); setRunning(true); };
      (p as p5 & { startRun?: () => void; resetRun?: () => void }).startRun = start;
      (p as p5 & { startRun?: () => void; resetRun?: () => void }).resetRun = () => { active = []; ghosts = []; finished = true; setRunning(false); setLastStep(0); setWeights([]); setMessage("Choose a learning rate, then run the optimizer."); };
    };
    sketchRef.current = new p5(sketch); return () => { sketchRef.current?.remove(); sketchRef.current = null; };
  }, []);

  const startRun = () => (sketchRef.current as p5 & { startRun?: () => void })?.startRun?.(); const resetRun = () => (sketchRef.current as p5 & { resetRun?: () => void })?.resetRun?.();
  const updateGridRate = (index: number, value: string) => setGridRates((rates) => rates.map((rate, i) => i === index ? Number(value) : rate));
  const activeObjective = OBJECTIVES[objective];
  const selectObjective = (next: ObjectiveId) => { if (running) return; resetRun(); setObjective(next); };
  return <div className="min-h-screen bg-[#080d12] px-5 py-6 text-[#c5c6c7] md:px-8 xl:px-12"><div className="mx-auto max-w-[1440px]">
    <Link to="/challenges" className="mb-5 inline-flex items-center gap-2 text-sm text-[#c5c6c7]/70 hover:text-white"><ArrowLeft className="h-4 w-4" />Back to Challenges</Link>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-[#66fcf1]">Optimizer Challenge · Gradient Descent</p><h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Find the center without overshooting</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#c5c6c7]/65">Switch loss landscapes and compare normalized gradient updates.</p></div><div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm"><Target className="h-4 w-4 text-[#66fcf1]" />Gradient step {lastStep}/{MAX_STEPS}</div></div>
    <div className="mb-5 grid gap-3 sm:grid-cols-3">{(Object.keys(OBJECTIVES) as ObjectiveId[]).map((id) => <ObjectiveButton key={id} active={objective === id} disabled={running} label={OBJECTIVES[id].label} formula={OBJECTIVES[id].formula} onClick={() => selectObjective(id)} />)}</div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="overflow-hidden rounded-3xl border border-white/8 bg-[#0d151c] p-3 shadow-2xl"><div ref={canvasHost} className="flex min-h-[460px] items-center justify-center overflow-auto rounded-2xl bg-[#081118]" /></div>
      <aside className="rounded-3xl border border-white/8 bg-[#0d151c] p-6"><div className="flex gap-2 rounded-2xl bg-white/[0.04] p-1"><ModeButton active={mode === "manual"} onClick={() => !running && setMode("manual")}>Manual Search</ModeButton><ModeButton active={mode === "grid"} onClick={() => !running && setMode("grid")}>Grid Search</ModeButton></div><div className="mt-7"><p className="text-sm font-semibold text-white">Learning rate weapon</p><p className="mt-1 text-xs leading-5 text-[#c5c6c7]/60">Too small is slow. Too large can bounce outside the map.</p></div>
        {mode === "manual" ? <div className="mt-5"><div className="flex items-center justify-between"><label htmlFor="manual-rate" className="text-sm text-[#c5c6c7]/75">Learning Rate</label><output className="font-mono text-[#66fcf1]">{manualRate}</output></div><input id="manual-rate" className="mt-4 w-full accent-[#66fcf1]" type="range" min="0.001" max="0.8" step="0.001" value={manualRate} disabled={running} onChange={(event) => setManualRate(Number(event.target.value))} /><div className="mt-2 flex justify-between text-[11px] text-[#c5c6c7]/45"><span>0.001 · slow</span><span>0.1 · balanced</span><span>0.8 · risky</span></div><input className="mt-4 h-10 w-full rounded-xl border border-white/10 bg-[#091016] px-3 font-mono text-sm text-white" type="number" min="0.0001" max="1" step="0.001" value={manualRate} disabled={running} onChange={(event) => setManualRate(Number(event.target.value))} /></div> : <div className="mt-5 space-y-3">{gridRates.map((rate, index) => <label key={index} className="flex items-center gap-3 text-sm text-[#c5c6c7]/75"><span className="h-3 w-3 rounded-full" style={{ background: COLORS[index] }} />Rate {index + 1}<input className="ml-auto h-10 w-28 rounded-xl border border-white/10 bg-[#091016] px-3 font-mono text-sm text-white" type="number" min="0.0001" max="1" step="0.001" value={rate} disabled={running} onChange={(event) => updateGridRate(index, event.target.value)} /></label>)}</div>}
        <div className="mt-7 flex gap-3"><Button className="flex-1" size="lg" disabled={running} onClick={startRun}><Play className="h-4 w-4" />{mode === "manual" ? "Run" : "Run Grid Search"}</Button><Button variant="outline" size="lg" aria-label="Reset" onClick={resetRun}><RotateCcw className="h-4 w-4" /></Button></div><div className={`mt-6 rounded-2xl border p-4 ${message.includes("Win") || message.includes("Optimized") ? "border-[#66fcf1]/25 bg-[#66fcf1]/8" : "border-white/8 bg-white/[0.03]"}`}><div className="flex gap-3"><Crosshair className="mt-0.5 h-5 w-5 shrink-0 text-[#66fcf1]" /><p className="text-sm leading-6 text-[#c5c6c7]/80">{message}</p></div></div><div className="mt-5 space-y-2"><p className="text-xs font-semibold uppercase tracking-widest text-[#66fcf1]">Live weight updates</p>{weights.length ? weights.map((item, index) => <WeightCard key={`${item.lr}-${index}`} item={item} />) : <div className="rounded-xl bg-white/[0.03] p-3 text-xs text-[#c5c6c7]/50">Run the optimizer to inspect w and ∇L.</div>}</div><div className="mt-5 grid grid-cols-2 gap-3 text-xs text-[#c5c6c7]/60"><div className="rounded-xl bg-white/[0.03] p-3"><p>Goal</p><p className="mt-1 font-semibold text-white">Center minimum</p></div><div className="rounded-xl bg-white/[0.03] p-3"><p>Function</p><p className="mt-1 font-mono font-semibold text-white">{activeObjective.formula}</p></div></div>
      </aside></div><div className="mt-5 flex items-center gap-2 text-xs text-[#c5c6c7]/50"><Trophy className="h-4 w-4 text-[#facc15]" />Ghost trails stay on the map after every attempt so you can compare your learning-rate choices.</div></div></div>;
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${active ? "bg-[#66fcf1] text-[#081118]" : "text-[#c5c6c7]/60 hover:text-white"}`} onClick={onClick}>{children}</button>; }
function ObjectiveButton({ active, disabled, label, formula, onClick }: { active: boolean; disabled: boolean; label: string; formula: string; onClick: () => void }) { return <button disabled={disabled} onClick={onClick} className={`rounded-2xl border px-4 py-3 text-left transition ${active ? "border-[#66fcf1]/40 bg-[#66fcf1]/10" : "border-white/8 bg-[#0d151c] hover:border-white/15"}`}><span className="block text-sm font-semibold text-white">{label}</span><span className="mt-1 block font-mono text-xs text-[#66fcf1]/70">{formula}</span></button>; }
function WeightCard({ item }: { item: WeightSnapshot }) { return <div className="rounded-xl border border-white/7 bg-black/20 p-3 text-xs"><div className="flex items-center justify-between"><span className="font-semibold" style={{ color: item.color }}>η {item.lr}</span><span className="font-mono text-[#c5c6c7]/60">L {item.loss.toFixed(1)}</span></div><div className="mt-2 grid grid-cols-2 gap-2 font-mono text-white"><span>wₓ {item.x.toFixed(2)}</span><span>wᵧ {item.y.toFixed(2)}</span><span className="text-[#c5c6c7]/55">gₓ {item.gx.toFixed(2)}</span><span className="text-[#c5c6c7]/55">gᵧ {item.gy.toFixed(2)}</span></div></div>; }
function snapshotFor(ball: Ball, objective: Objective): WeightSnapshot { const gradient = objective.gradient(ball.x, ball.y); return { color: ball.color, lr: ball.lr, x: ball.x, y: ball.y, gx: gradient.x * objective.normalizer, gy: gradient.y * objective.normalizer, loss: objective.loss(ball.x, ball.y) * objective.normalizer }; }
function drawObjectiveSurface(p: p5, objective: Objective) {
  const center = { x: p.width / 2, y: p.height / 2 };
  p.push(); p.noStroke();
  for (let y = 0; y < p.height; y += 24) for (let x = 0; x < p.width; x += 24) { const loss = objective.loss(x - center.x, y - center.y) * objective.normalizer; const intensity = p.constrain(Math.sqrt(loss) / 260, 0, 1); p.fill(18 + intensity * 25, 35 + intensity * 18, 48 + intensity * 32, 150); p.rect(x, y, 25, 25); }
  p.translate(center.x, center.y); p.noFill();
  if (objective.shape === "rotated") p.rotate(Math.PI / 4);
  for (let radius = 34; radius <= 410; radius += 34) { p.stroke(102, 252, 241, Math.max(18, 80 - radius / 7)); p.strokeWeight(1); const height = objective.shape === "circle" ? radius : radius * 0.58; p.ellipse(0, 0, radius, height); }
  p.noStroke(); p.fill("#66fcf1"); p.circle(0, 0, 12); p.fill(255, 255, 255, 100); p.textAlign(p.CENTER, p.CENTER); p.textSize(11); if (objective.shape === "rotated") p.rotate(-Math.PI / 4); p.text("GLOBAL MINIMUM", 0, 23); p.pop();
}
function drawGhosts(p: p5, trails: Trail[]) { p.push(); p.noFill(); p.strokeWeight(2); trails.forEach((trail) => { p.stroke(trail.color + "55"); p.beginShape(); trail.points.forEach((point) => p.vertex(p.width / 2 + point.x, p.height / 2 + point.y)); p.endShape(); }); p.pop(); }
function drawGradientLines(p: p5, balls: Ball[]) {
  const center = { x: p.width / 2, y: p.height / 2 };
  p.push(); p.strokeWeight(1.5);
  for (const ball of balls) {
    const start = { x: p.width / 2 + ball.x, y: p.height / 2 + ball.y };
    const distance = Math.hypot(center.x - start.x, center.y - start.y);
    const segments = Math.max(1, Math.ceil(distance / 14));
    p.stroke(ball.color + "66");
    for (let segment = 0; segment < segments; segment += 2) {
      const from = segment / segments;
      const to = Math.min(1, (segment + 1) / segments);
      p.line(p.lerp(start.x, center.x, from), p.lerp(start.y, center.y, from), p.lerp(start.x, center.x, to), p.lerp(start.y, center.y, to));
    }
  }
  p.pop();
}
function drawBalls(p: p5, balls: Ball[]) { p.push(); balls.forEach((ball) => { p.noFill(); p.stroke(ball.color + "aa"); p.strokeWeight(2); p.beginShape(); ball.trail.forEach((point) => p.vertex(p.width / 2 + point.x, p.height / 2 + point.y)); p.endShape(); const point = { x: p.width / 2 + ball.x, y: p.height / 2 + ball.y }; p.noStroke(); p.fill(ball.color); p.circle(point.x, point.y, 18); p.fill(255, 255, 255, 190); p.circle(point.x - 3, point.y - 3, 4); p.fill(255, 255, 255, 175); p.textAlign(p.CENTER, p.BOTTOM); p.textSize(10); p.text(`w(${ball.x.toFixed(1)}, ${ball.y.toFixed(1)})`, point.x, point.y - 13); }); p.pop(); }
