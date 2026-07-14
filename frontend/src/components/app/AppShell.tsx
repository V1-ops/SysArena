import { useEffect, useState, type PropsWithChildren } from "react";
import { Flame, Gauge, Home, Menu, Pin, Puzzle, Target, User, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { challenges, playerProfile } from "../../data/challenges";
import { getActiveChallengeId } from "../../lib/challenge-session";
import { Pill } from "../common/Pill";

const navItems = [
  { label: "Home", icon: Home, to: "/" },
  { label: "Challenges", icon: Target, to: "/challenges" },
  { label: "Optimizers", icon: Gauge, to: "/optimizers", special: true },
  { label: "Profile", icon: User, to: "/profile" },
];

const SIDEBAR_PIN_KEY = "engineerverse-sidebar-pinned";

function SidebarContent({ expanded, isPinned, onTogglePin, onNavigate, activeChallenge, pathname }: { expanded: boolean; isPinned: boolean; onTogglePin: () => void; onNavigate?: () => void; activeChallenge?: { title: string; summary: string }; pathname: string }) {
  return (
    <>
      <div className={cn("mb-10 flex items-center gap-3", expanded ? "px-3" : "justify-center px-0")}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#66FCF1]/20 bg-[#0F1820] shadow-[0_0_25px_rgba(102,252,241,0.12)]">
          <Puzzle className="h-5 w-5 text-[#66FCF1]" />
        </div>
        <div className={cn("min-w-0 overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none", expanded ? "max-w-[180px] translate-x-0 opacity-100" : "max-w-0 -translate-x-2 opacity-0")} aria-hidden={!expanded}>
          <p className="whitespace-nowrap text-lg font-semibold tracking-tight text-white">EngineerVerse</p>
          <p className="whitespace-nowrap text-xs text-[#C5C6C7]/50">Playable OS for engineers</p>
        </div>
      </div>

      <nav className="space-y-2" aria-label="Primary navigation">
        {navItems.map(({ label, icon: Icon, to, special }) => {
          const isActive = label === "Home"
            ? pathname === "/"
            : label === "Challenges"
              ? pathname === "/challenges" || pathname.startsWith("/challenge/") || pathname.startsWith("/build/") || pathname.startsWith("/simulate/") || pathname.startsWith("/result/")
              : label === "Optimizers"
                ? pathname === "/optimizers" || pathname.startsWith("/optimizer/") || pathname.startsWith("/physics-optimizer/")
                : pathname === "/profile";

          return (
          <Link
            key={label}
            to={to}
            title={!expanded ? label : undefined}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300",
              !expanded && "justify-center px-3",
              special && "border border-[#66FCF1]/15 bg-[linear-gradient(135deg,rgba(102,252,241,0.10),rgba(69,162,158,0.04))] hover:border-[#66FCF1]/40",
              isActive
                ? special
                  ? "bg-[linear-gradient(135deg,rgba(102,252,241,0.20),rgba(69,162,158,0.12))] text-white shadow-[0_0_24px_rgba(102,252,241,0.12),inset_0_0_0_1px_rgba(102,252,241,0.16)]"
                  : "bg-[#1F2833] text-white shadow-[inset_0_0_0_1px_rgba(102,252,241,0.08)]"
                : "text-[#C5C6C7]/72 hover:bg-[#12181f] hover:text-white"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-105", isActive && "text-[#66FCF1]")} />
            <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-200 ease-out motion-reduce:transition-none", expanded ? "max-w-[160px] translate-x-0 opacity-100" : "max-w-0 -translate-x-2 opacity-0")} aria-hidden={!expanded}>{label}</span>
          </Link>
          );
        })}
      </nav>

      <div className={cn("mt-auto overflow-hidden rounded-3xl border border-white/5 bg-[#10161d] transition-all duration-200 ease-out motion-reduce:transition-none", expanded ? "max-h-64 translate-y-0 p-4 opacity-100" : "max-h-0 translate-y-2 border-transparent p-0 opacity-0")} aria-hidden={!expanded}>
          <p className="mb-1 text-xs uppercase tracking-[0.16em] text-[#45A29E]">{activeChallenge ? "Active challenge" : "Current mission"}</p>
          <p className="text-sm font-medium text-white">{activeChallenge?.title ?? "Build, simulate, and score"}</p>
          <p className="mt-1 text-sm leading-6 text-[#C5C6C7]/65">{activeChallenge?.summary ?? "Systems that feel alive."}</p>
      </div>

      <button
        type="button"
        onClick={onTogglePin}
        title={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
        aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
        aria-pressed={isPinned}
        className={cn(
          "mt-4 flex items-center justify-center rounded-xl border p-2 transition hover:border-[#66FCF1]/35 hover:text-[#66FCF1]",
          isPinned ? "border-[#66FCF1]/30 bg-[#66FCF1]/10 text-[#66FCF1]" : "border-white/8 bg-[#10161d] text-[#C5C6C7]/60",
          expanded && "self-end"
        )}
      >
        <Pin className="h-4 w-4" />
      </button>
    </>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const cinematicPage = location.pathname.includes("/simulate/");
  const [isPinned, setIsPinned] = useState(() => window.localStorage.getItem(SIDEBAR_PIN_KEY) === "true");
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState(() => getActiveChallengeId());
  const expanded = isPinned || isHovered || mobileOpen;
  const activeChallenge = challenges.find((challenge) => challenge.id === activeChallengeId);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_PIN_KEY, String(isPinned));
  }, [isPinned]);

  useEffect(() => {
    setMobileOpen(false);
    setActiveChallengeId(getActiveChallengeId());
  }, [location.pathname]);

  const togglePin = () => setIsPinned((current) => !current);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#C5C6C7]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {!cinematicPage && (
          <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "relative hidden shrink-0 flex-col border-r border-white/5 bg-[#0A0E13] px-3 py-6 transition-[width] duration-300 ease-out lg:flex",
              expanded ? "sticky top-0 z-30 h-screen max-h-screen w-[270px]" : "sticky top-0 z-30 h-screen max-h-screen w-[76px]"
            )}
            aria-label="Application sidebar"
          >
            <SidebarContent expanded={expanded} isPinned={isPinned} onTogglePin={togglePin} activeChallenge={activeChallenge} pathname={location.pathname} />
          </aside>
        )}

        {mobileOpen && !cinematicPage && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-[#020608]/75 backdrop-blur-sm" />
            <aside className="relative flex h-full w-[min(86vw,300px)] flex-col border-r border-white/10 bg-[#0A0E13] px-5 py-6 shadow-[20px_0_80px_rgba(0,0,0,0.45)]">
              <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute right-4 top-4 rounded-lg border border-white/8 p-2 text-[#C5C6C7]/65 hover:text-white">
                <X className="h-4 w-4" />
              </button>
              <SidebarContent expanded isPinned={isPinned} onTogglePin={togglePin} onNavigate={() => setMobileOpen(false)} activeChallenge={activeChallenge} pathname={location.pathname} />
            </aside>
          </div>
        )}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {!cinematicPage && (
            <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0B0C10]/75 px-5 py-4 backdrop-blur-xl md:px-8 xl:px-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 lg:hidden">
                  <button type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-xl border border-white/8 bg-[#101820] p-2 text-[#C5C6C7]/75 hover:border-[#66FCF1]/35 hover:text-white">
                    <Menu className="h-4 w-4" />
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#66FCF1]/20 bg-[#0F1820]"><Puzzle className="h-5 w-5 text-[#66FCF1]" /></div>
                  <span className="text-lg font-semibold text-white">EngineerVerse</span>
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-3">
                  <Pill icon={Flame} label={`${playerProfile.streakDays} Day Streak`} />
                  <Pill label={`${playerProfile.totalXp.toLocaleString()} XP`} />
                  <Pill label={`${playerProfile.score} Score`} />
                </div>
              </div>
            </header>
          )}

          <main className={cn("flex-1 px-5 py-6 md:px-8 xl:px-10", cinematicPage && "px-0 py-0")}>{children}</main>
        </div>
      </div>
    </div>
  );
}
