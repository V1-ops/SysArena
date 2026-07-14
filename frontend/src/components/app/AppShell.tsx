import { PropsWithChildren } from "react";
import { Award, Flame, Home, Puzzle, Target, Trophy, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { playerProfile } from "../../data/challenges";
import { Pill } from "../common/Pill";

const navItems = [
  { label: "Home", icon: Home, to: "/" },
  { label: "Challenges", icon: Target, to: "/challenges" },
  { label: "Leaderboard", icon: Trophy, to: "/challenges" },
  { label: "Achievements", icon: Award, to: "/profile" },
  { label: "Profile", icon: User, to: "/profile" },
];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const cinematicPage = location.pathname.includes("/simulate/");

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#C5C6C7]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {!cinematicPage && (
          <aside className="hidden w-[270px] shrink-0 border-r border-white/5 bg-[#0A0E13] px-5 py-6 lg:flex lg:flex-col">
            <div className="mb-10 flex items-center gap-3 px-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#66FCF1]/20 bg-[#0F1820] shadow-[0_0_25px_rgba(102,252,241,0.12)]">
                <Puzzle className="h-5 w-5 text-[#66FCF1]" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">
                  EngineerVerse
                </p>
                <p className="text-xs text-[#C5C6C7]/50">Playable OS for engineers</p>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map(({ label, icon: Icon, to }) => (
                <NavLink
                  key={label}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-200",
                      isActive
                        ? "bg-[#1F2833] text-white shadow-[inset_0_0_0_1px_rgba(102,252,241,0.08)]"
                        : "text-[#C5C6C7]/72 hover:bg-[#12181f] hover:text-white"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn("h-4 w-4", isActive && "text-[#66FCF1]")} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto rounded-3xl border border-white/5 bg-[#10161d] p-4">
              <p className="mb-1 text-sm font-medium text-white">Current mission</p>
              <p className="text-sm leading-6 text-[#C5C6C7]/65">
                Build, simulate, and score systems that feel alive.
              </p>
            </div>
          </aside>
        )}

        <div className="flex min-h-screen flex-1 flex-col">
          {!cinematicPage && (
            <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0B0C10]/75 px-5 py-4 backdrop-blur-xl md:px-8 xl:px-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 lg:hidden">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#66FCF1]/20 bg-[#0F1820]">
                    <Puzzle className="h-5 w-5 text-[#66FCF1]" />
                  </div>
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

          <main className={cn("flex-1 px-5 py-6 md:px-8 xl:px-10", cinematicPage && "px-0 py-0")}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
