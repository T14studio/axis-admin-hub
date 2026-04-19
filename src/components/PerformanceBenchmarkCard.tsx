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
    <Card className="border border-border/40 shadow-2xl bg-[#1c1b19]/40 backdrop-blur-md overflow-hidden relative group transition-all duration-700 hover:bg-[#201f1d]/60">
      {/* Abstract Background Element */}
      <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-1000 group-hover:scale-110 group-hover:-rotate-6">
        <Target className="h-32 w-32 text-primary" />
      </div>
      
      {/* Decorative Left Border Accent */}
      <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-primary/60 via-primary/20 to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-700" />

      <CardHeader className="pb-3 pt-6 px-6">
        <div className="flex items-center justify-between mb-1">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors duration-500" />
            BENCHMARK / {label}
          </CardTitle>
          <Zap className="h-4 w-4 text-accent/40 group-hover:text-accent transition-colors duration-700" />
        </div>
      </CardHeader>

      <CardContent className="space-y-7 px-6 pb-8">
        <div className="flex items-end gap-4">
          <span className="text-5xl font-black tracking-tighter text-foreground leading-none">
            {prefix}{currentValue}{suffix}
          </span>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`flex items-center text-[11px] font-bold px-3 py-1 rounded-full mb-1 border ${
              isPositive 
                ? "bg-success/5 text-success border-success/20" 
                : "bg-destructive/5 text-destructive border-destructive/20"
            }`}
          >
            {isPositive ? <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> : <TrendingDown className="h-3.5 w-3.5 mr-1.5" />}
            {Math.abs(percentage)}%
          </motion.div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-[0.15em] text-muted-foreground/70">
            <span className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-border" />
              Média do Mercado
            </span>
            <span className="text-foreground font-black">{prefix}{averageValue}{suffix}</span>
          </div>
          <div className="h-1.5 w-full bg-[#2a2927] rounded-full overflow-hidden border border-border/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((currentValue / (averageValue * 1.4)) * 100, 100)}%` }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className={`h-full rounded-full relative shadow-[0_0_10px_rgba(214,177,111,0.2)] ${
                isPositive ? "bg-gradient-to-r from-primary to-accent" : "bg-destructive/80"
              }`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-[shimmer_3s_infinite]" />
            </motion.div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border/30">
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed font-medium">
            Seu desempenho está <span className={isPositive ? "text-success/90 font-bold" : "text-destructive/90 font-bold"}>
              {isPositive ? "SUPERANDO" : "ABAIXO DA"}
            </span> expectativa média do setor para este período.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
