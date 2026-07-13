import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  onClick?: () => void;
}

const variantClasses = {
  default: "bg-[#1c1b19]/60 border-border/40",
  primary: "bg-primary/5 border-primary/20",
  success: "bg-success/5 border-success/20",
  warning: "bg-warning/5 border-warning/20",
  destructive: "bg-destructive/5 border-destructive/20",
};

const iconContainerClasses = {
  default: "bg-white/5 text-muted-foreground",
  primary: "bg-primary/20 text-primary shadow-[0_0_15px_rgba(214,177,111,0.15)]",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  destructive: "bg-destructive/20 text-destructive",
};

export function StatCard({ title, value, icon: Icon, variant = "default", onClick }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Card
        className={cn(
          "transition-all duration-500 border backdrop-blur-sm group overflow-hidden relative",
          variantClasses[variant],
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <CardContent className="p-6 flex items-center gap-5 relative z-10">
          <div className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-700 shadow-sm",
            "group-hover:rotate-[8deg] group-hover:scale-110",
            iconContainerClasses[variant]
          )}>
            <Icon className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 group-hover:text-primary/80 transition-colors duration-500">
              {title}
            </p>
            <p className="text-3xl font-extrabold text-foreground tracking-tight flex items-baseline gap-1">
              {value}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
