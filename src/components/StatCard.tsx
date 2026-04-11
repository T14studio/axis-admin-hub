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
  default: "bg-card",
  primary: "bg-primary/5 border-primary/20",
  success: "bg-success/5 border-success/20",
  warning: "bg-warning/5 border-warning/20",
  destructive: "bg-destructive/5 border-destructive/20",
};

const iconClasses = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function StatCard({ title, value, icon: Icon, variant = "default", onClick }: StatCardProps) {
  return (
    <Card
      className={cn("transition-all hover:shadow-md", variantClasses[variant], onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50", iconClasses[variant])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
