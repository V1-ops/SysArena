import { LucideIcon, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

export function GameCard({
  icon: Icon,
  title,
  description,
  meta,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  meta: string;
}) {
  return (
    <Card className="group transition-all duration-200 hover:-translate-y-1 hover:border-[#66FCF1]/15 hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#66FCF1]/12 bg-[#101820] text-[#66FCF1]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#45A29E]">
            {meta}
          </p>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-sm leading-6 text-[#C5C6C7]/65">{description}</p>
        </div>
        <div className="mt-auto">
          <Button variant="ghost" className="px-0 text-[#66FCF1] hover:bg-transparent">
            Explore <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
