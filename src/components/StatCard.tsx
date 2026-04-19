import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  onClick?: () => void;
}

const variantClasses = {
  default: "bg-card/40 border-white/5",
  primary: "bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(79,152,163,0.05)]",
  success: "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(109,170,69,0.05)]",
  warning: "bg-amber-500/10 border-amber-500/20 shadow-[0_0_20px_rgba(232,175,52,0.05)]",
  destructive: "bg-destructive/10 border-destructive/20 shadow-[0_0_20px_rgba(187,101,59,0.05)]",
};

const iconContainerClasses = {
  default: "bg-white/5 text-muted-foreground",
  primary: "bg-primary/20 text-primary",
  success: "bg-emerald-500/20 text-emerald-500",
  warning: "bg-amber-500/20 text-amber-500",
  destructive: "bg-destructive/20 text-destructive",
};

export function StatCard({ title, value, icon: Icon, variant = "default", onClick }: StatCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border backdrop-blur-sm group overflow-hidden relative",
        variantClasses[variant],
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="p-5 flex items-center gap-5 relative z-10">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110",
          iconContainerClasses[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">{title}</p>
          <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
