import React, { useEffect, useRef, useState } from "react";
import p5 from "p5";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

const WIDTH = 860;
const HEIGHT = 470;
const GROUND = 390;
const MAX_STEPS = 110;
const STEP_EVERY_FRAMES = 12;
const ANGLE = -Math.PI / 5;
const TARGET = { x: 548, y: 272, radius: 34 };

const SCHEDULES = {
  manual: { label: "Manual Constant", formula: "η = custom", color: "#facc15", hint: "Use for a controlled baseline.", rate: (_, manual) => manual },
  inverse: { label: "Inverse Time", formula: "η₀ / (n + 1)", color: "#4ade80", hint: "Switch when movement starts oscillating.", rate: (n) => 0.45 / (n + 1) },
  half: { label: "Fast Half Decay", formula: "η₀ / 2ⁿ", color: "#60a5fa", hint: "Demonstrates steps freezing too early.", rate: (n) => 0.14 * Math.pow(0.5, n) },
  exponential: { label: "Exponential Decay", formula: "η₀ · 0.96ⁿ", color: "#c084fc", hint: "Use for a smooth gradual cool-down.", rate: (n) => 0.38 * Math.pow(0.96, n) },
  step: { label: "Step Decay", formula: "η₀ · 0.5⌊n/12⌋", color: "#fb923c", hint: "Switch after the loss plateaus.", rate: (n) => 0.42 * Math.pow(0.5, Math.floor(n / 12)) },
  cosine: { label: "Cosine Decay", formula: "ηmin + cosine(n)", color: "#22d3ee", hint: "Use for a fast start and soft landing.", rate: (n) => 0.04 + 0.36 * 0.5 * (1 + Math.cos(Math.PI * Math.min(n, 60) / 60)) },
};

function newSegment(id, point, manualRate) {
  const strategy = SCHEDULES[id];
  return { id, color: strategy.color, label: strategy.label, formula: id === "manual" ? `η = ${manualRate}` : strategy.formula, points: [{ ...point }] };
}

function updatePhysics(ball, manualRate) {
  const strategy = SCHEDULES[ball.scheduleId];
  const learningRate = strategy.rate(ball.segmentStep, manualRate);
  ball.currentRate = learningRate;
  ball.weights.forEach((weight, index) => { ball.weights[index] -= learningRate * 2 * weight; });
  ball.vx = 7.4 * Math.cos(ANGLE) + ball.weights[0] * 0.34;
  ball.vy += 0.075 + ball.weights[1] * 0.01;
  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.step += 1;
  ball.segmentStep += 1;
  ball.segments[ball.segments.length - 1].points.push({ x: ball.x, y: ball.y });
  if (Math.hypot(ball.x - TARGET.x, ball.y - TARGET.y) < TARGET.radius) ball.state = "won";
  else if (ball.x > WIDTH + 35 || ball.y > GROUND + 25 || ball.x < -35) { ball.state = "failed"; ball.reason = "the schedule diverged or crashed"; }
  else if (ball.step >= MAX_STEPS) { ball.state = "failed"; ball.reason = "the schedule became too slow"; }
}

function drawSegment(p, segment, ghost = false) {
  p.push();
  p.noFill();
  p.stroke(segment.color + (ghost ? "38" : "bb"));
  p.strokeWeight(ghost ? 2 : 3);
  p.beginShape();
  segment.points.forEach((point) => p.vertex(point.x, point.y));
  p.endShape();
  if (!ghost && segment.points.length) {
    const start = segment.points[0];
    p.noStroke(); p.fill(segment.color); p.circle(start.x, start.y, 10);
    p.fill(255, 255, 255, 175); p.textAlign(p.LEFT, p.BOTTOM); p.textSize(10); p.text(segment.formula, start.x + 8, start.y - 6);
  }
  p.pop();
}

function drawScene(p, ball, ghosts) {
  p.background("#081118");
  p.noStroke(); p.fill("#102832"); p.rect(0, 0, WIDTH, GROUND);
  p.fill("#132f2b"); p.rect(0, GROUND, WIDTH, HEIGHT - GROUND); p.fill("#1b493c"); p.rect(0, GROUND, WIDTH, 8);
  p.fill(255, 255, 255, 18); p.ellipse(150, 75, 120, 32); p.ellipse(210, 75, 100, 25); p.ellipse(710, 100, 160, 32);
  p.fill("#66fcf1"); p.circle(TARGET.x, TARGET.y, TARGET.radius * 2); p.fill("#0d252b"); p.circle(TARGET.x, TARGET.y, TARGET.radius * 1.3); p.fill("#66fcf1"); p.textAlign(p.CENTER, p.CENTER); p.textSize(11); p.text("TARGET", TARGET.x, TARGET.y);
  p.fill("#fb7185"); p.circle(74, GROUND - 14, 24); p.fill(255, 255, 255, 150); p.textSize(10); p.text("LAUNCH", 74, GROUND + 24);
  ghosts.forEach((run) => run.segments.forEach((segment) => drawSegment(p, segment, true)));
  if (!ball) return;
  ball.segments.forEach((segment) => drawSegment(p, segment));
  const strategy = SCHEDULES[ball.scheduleId];
  p.noStroke(); p.fill(strategy.color); p.circle(ball.x, ball.y, 23); p.fill(255, 255, 255, 200); p.circle(ball.x - 4, ball.y - 4, 5);
  p.fill("#66fcf1"); p.textAlign(p.LEFT, p.TOP); p.textSize(11); p.text(`${strategy.label}  ·  η ${ball.currentRate.toFixed(4)}`, 18, 18);
  p.fill(255, 255, 255, 145); p.text(`w₀ ${ball.weights[0].toFixed(3)}   w₁ ${ball.weights[1].toFixed(3)}`, 18, 38);
}

export default function PhysicsOptimizer() {
  const hostRef = useRef(null);
  const p5Ref = useRef(null);
  const manualRateRef = useRef(0.3);
  const [schedule, setSchedule] = useState("manual");
  const [manualRate, setManualRate] = useState(0.3);
  const [status, setStatus] = useState("ready");
  const [step, setStep] = useState(0);
  const [currentRate, setCurrentRate] = useState(0.3);
  const [switches, setSwitches] = useState([]);
  const [message, setMessage] = useState("Choose a strategy and launch.");

  useEffect(() => { manualRateRef.current = manualRate; }, [manualRate]);
  useEffect(() => {
    if (!hostRef.current) return;
    const sketch = (p) => {
      let ball = null;
      let ghosts = [];
      let settled = true;
      const finish = () => {
        if (!ball || settled) return;
        settled = true;
        ghosts = [...ghosts, { segments: ball.segments.map((segment) => ({ ...segment, points: [...segment.points] })) }];
        setStatus(ball.state);
        setMessage(ball.state === "won" ? "You Win — schedule reached the target!" : `Failed — ${ball.reason}.`);
      };
      p.setup = () => { p.createCanvas(WIDTH, HEIGHT).parent(hostRef.current); p.frameRate(60); p.textFont("Inter, system-ui, sans-serif"); };
      p.draw = () => {
        if (ball && !settled && p.frameCount % STEP_EVERY_FRAMES === 0) {
          updatePhysics(ball, manualRateRef.current);
          setStep(ball.step);
          setCurrentRate(ball.currentRate);
          if (ball.state !== "running") finish();
        }
        drawScene(p, ball, ghosts);
      };
      p.startRun = (id) => {
        const start = { x: 74, y: GROUND - 14 };
        const weights = Array.from({ length: 22 }, (_, index) => index === 0 ? -4 : index === 1 ? 2.2 : (index % 3 - 1) * 0.08);
        ball = { ...start, vx: 7.4 * Math.cos(ANGLE), vy: 7.4 * Math.sin(ANGLE), step: 0, segmentStep: 0, weights, scheduleId: id, currentRate: SCHEDULES[id].rate(0, manualRateRef.current), segments: [newSegment(id, start, manualRateRef.current)], state: "running", reason: "" };
        settled = false; setStatus("running"); setStep(0); setSwitches([]); setMessage("Flying — switch strategy to split the path.");
      };
      p.changeSchedule = (id) => {
        if (!ball || settled || !SCHEDULES[id] || ball.scheduleId === id) return;
        const previous = ball.scheduleId;
        ball.scheduleId = id;
        ball.segmentStep = 0;
        ball.segments.push(newSegment(id, { x: ball.x, y: ball.y }, manualRateRef.current));
        setSwitches((items) => [...items, { from: previous, to: id, step: ball.step }]);
      };
      p.resetRun = () => { ball = null; ghosts = []; settled = true; setStatus("ready"); setStep(0); setSwitches([]); setMessage("Choose a strategy and launch."); };
    };
    p5Ref.current = new p5(sketch);
    return () => { p5Ref.current?.remove(); p5Ref.current = null; };
  }, []);

  const selectSchedule = (id) => {
    setSchedule(id);
    if (status === "running") p5Ref.current?.changeSchedule?.(id);
  };
  const strategy = SCHEDULES[schedule];

  return <div className="min-h-screen bg-[#080d12] px-5 py-6 text-[#c5c6c7] md:px-8 xl:px-12"><div className="mx-auto max-w-[1480px]">
    <Link to="/challenges" className="mb-5 inline-flex items-center gap-2 text-sm text-[#c5c6c7]/70 hover:text-white">← Back to Challenges</Link>
    <header className="mb-6"><p className="text-xs uppercase tracking-[0.25em] text-[#66fcf1]">Gradient Optimizer Visualizing</p><h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Switch Learning Rates Mid-Flight</h1><p className="mt-2 text-sm text-[#c5c6c7]/60">Every switch creates a colored checkpoint and starts a new formula segment.</p></header>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]"><section className="rounded-3xl border border-white/8 bg-[#0d151c] p-3"><div ref={hostRef} className="flex min-h-[470px] items-center justify-center overflow-auto rounded-2xl bg-[#081118]" /><div className="mt-3 flex flex-wrap gap-4 px-2 text-xs text-[#c5c6c7]/55"><span>Gradient step {step}/{MAX_STEPS}</span><span>Current η {currentRate.toFixed(4)}</span><span>Path splits {switches.length}</span><span>w₀ → X · w₁ → Y</span></div></section>
      <aside className="rounded-3xl border border-white/8 bg-[#0d151c] p-6"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white">Learning-rate strategy</p><span className="h-3 w-3 rounded-full" style={{ backgroundColor: strategy.color }} /></div><p className="mt-1 font-mono text-xs text-[#66fcf1]">{strategy.formula}</p>{schedule === "manual" && <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-[#c5c6c7]/60">Manual η<input className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-[#091016] px-3 font-mono text-white" type="number" min="0.01" max="1.5" step="0.01" value={manualRate} disabled={status === "running"} onChange={(event) => setManualRate(Number(event.target.value))} /></label>}
        <div className="mt-5 grid max-h-[360px] gap-2 overflow-y-auto pr-1">{Object.entries(SCHEDULES).map(([id, item]) => <button key={id} onClick={() => selectSchedule(id)} className={`rounded-2xl border p-3 text-left transition ${schedule === id ? "border-[#66fcf1]/45 bg-[#66fcf1]/8" : "border-white/8 bg-white/[0.025] hover:border-white/15"}`}><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-sm font-semibold text-white">{item.label}</span></span><span className="mt-1 block font-mono text-[11px]" style={{ color: item.color }}>{item.formula}</span><span className="mt-1 block text-xs text-[#c5c6c7]/55">{item.hint}</span></button>)}</div>
        <div className="mt-5 flex gap-3"><Button className="flex-1" size="lg" disabled={status === "running"} onClick={() => p5Ref.current?.startRun?.(schedule)}>▶ Launch</Button><Button variant="outline" size="lg" onClick={() => p5Ref.current?.resetRun?.()} aria-label="Reset">↻</Button></div><div className={`mt-4 rounded-2xl border p-4 text-sm ${status === "won" ? "border-[#66fcf1]/30 bg-[#66fcf1]/10" : status === "failed" ? "border-[#fb7185]/25 bg-[#fb7185]/8" : "border-white/8 bg-white/[0.03]"}`}>{message}</div>
        {switches.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-semibold uppercase tracking-widest text-[#66fcf1]">Switch history</p>{switches.map((item, index) => <div key={`${item.step}-${index}`} className="rounded-xl bg-black/20 px-3 py-2 text-xs"><span style={{ color: SCHEDULES[item.from].color }}>{SCHEDULES[item.from].label}</span><span className="mx-2 text-white">→</span><span style={{ color: SCHEDULES[item.to].color }}>{SCHEDULES[item.to].label}</span><span className="float-right text-[#c5c6c7]/45">step {item.step}</span></div>)}</div>}
      </aside></div>
  </div></div>;
}
