import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface BenchmarkProps {
  currentValue: number;
  averageValue: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

export function PerformanceBenchmarkCard({ 
  currentValue, 
  averageValue, 
  label, 
  suffix = "", 
  prefix = "" 
}: BenchmarkProps) {
  const percentage = Math.round(((currentValue - averageValue) / averageValue) * 100);
  const isPositive = percentage >= 0;

  return (
    <Card className="border border-white/5 shadow-2xl bg-card/30 backdrop-blur-md overflow-hidden relative group transition-all duration-500 hover:bg-card/50">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-700 group-hover:scale-125 group-hover:-rotate-12">
        <Target className="h-24 w-24 text-primary" />
      </div>
      
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-transparent opacity-50" />

      <CardHeader className="pb-3 pt-6 px-6">
        <div className="flex items-center justify-between mb-1">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            BENCHMARK / {label}
          </CardTitle>
          <Zap className="h-3.5 w-3.5 text-accent opacity-50" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-6 pb-8">
        <div className="flex items-end gap-3">
          <span className="text-4xl font-black tracking-tighter text-foreground leading-none">
            {prefix}{currentValue}{suffix}
          </span>
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center text-[10px] font-black px-2 py-0.5 rounded-full mb-1 ${
              isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(percentage)}%
          </motion.div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-[9px] uppercase font-bold tracking-[0.1em] text-muted-foreground/80">
            <span className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              Média do Mercado
            </span>
            <span className="text-foreground">{prefix}{averageValue}{suffix}</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((currentValue / (averageValue * 1.4)) * 100, 100)}%` }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full relative ${isPositive ? "bg-primary" : "bg-destructive"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </motion.div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium">
            Sua performance está <span className={isPositive ? "text-emerald-500/80 font-bold" : "text-destructive/80 font-bold"}>
              {isPositive ? "SUPERANDO" : "ABAIXO DA"}
            </span> expectativa média regional.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
