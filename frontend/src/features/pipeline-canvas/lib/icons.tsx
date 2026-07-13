import {
  BadgeCheck,
  Bell,
  Binary,
  Code2,
  Database,
  FileText,
  Globe2,
  HelpCircle,
  ListChecks,
  MessageSquare,
  Scissors,
  Search,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Smartphone,
} from "lucide-react";

const iconMap = {
  BadgeCheck,
  Bell,
  Binary,
  Code2,
  Database,
  FileText,
  Globe2,
  ListChecks,
  MessageSquare,
  Scissors,
  Search,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Smartphone,
};

export function NodeIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = name && name in iconMap ? iconMap[name as keyof typeof iconMap] : HelpCircle;
  return <Icon className={className} />;
}
