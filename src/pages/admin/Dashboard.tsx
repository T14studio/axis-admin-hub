import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Home, FileText, Users, Plus, AlertTriangle, TrendingUp, UserPlus, Eye, LayoutDashboard, Zap
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PremiumPageReveal } from "@/components/ui/premium-page-reveal";
import { PerformanceBenchmarkCard } from "@/components/PerformanceBenchmarkCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0, newLeads: 0, inProgressLeads: 0, convertedLeads: 0,
    activeProperties: 0, pendingProperties: 0,
    activeContracts: 0, expiringContracts: 0, expiredContracts: 0,
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: leadsData } = await supabase.from("leads").select("id, status, name, email, phone, created_at");
      const { data: propsData } = await supabase.from("properties").select("id, status, published");
      const { data: contractsData } = await supabase.from("contracts").select("id, status, end_date, contract_number");

      const leads = Array.isArray(leadsData) ? [...leadsData] : [];
      const props = Array.isArray(propsData) ? [...propsData] : [];
      const contracts = Array.isArray(contractsData) ? [...contractsData] : [];

      const today = new Date();
      const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      setStats({
        totalLeads: leads.length,
        newLeads: leads.filter((l) => l.status === "novo").length,
        inProgressLeads: leads.filter((l) => l.status === "em_atendimento").length,
        convertedLeads: leads.filter((l) => l.status === "convertido").length,
        activeProperties: props.filter((p) => p.status === "ativo" && p.published).length,
        pendingProperties: props.filter((p) => p.status === "rascunho").length,
        activeContracts: contracts.filter((c) => c.status === "ativo").length,
        expiringContracts: contracts.filter((c) => {
          if (!c.end_date) return false;
          const d = new Date(c.end_date);
          return d instanceof Date && !isNaN(d.getTime()) && d <= thirtyDays && d > today;
        }).length,
        expiredContracts: contracts.filter((c) => {
          if (!c.end_date) return false;
          const d = new Date(c.end_date);
          return d instanceof Date && !isNaN(d.getTime()) && d < today && c.status !== "encerrado";
        }).length,
      });

      setRecentLeads(leads.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5));
      setExpiringContracts(
        contracts.filter((c) => {
          if (!c.end_date) return false;
          const d = new Date(c.end_date);
          return d instanceof Date && !isNaN(d.getTime()) && d <= thirtyDays && c.status !== "encerrado";
        })
        .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime()).slice(0, 5)
      );
    } catch (error) {
      console.error("Dashboard: Error in fetchData", error);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    novo: "bg-primary/10 text-primary border-primary/20",
    em_atendimento: "bg-warning/10 text-warning border-warning/20",
    convertido: "bg-success/10 text-success border-success/20",
    perdido: "bg-destructive/10 text-destructive border-destructive/20",
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-6">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Iniciando Sincronização Analítica</p>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <PremiumPageReveal className="space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 border-b border-border/30 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[inset_0_0_20px_rgba(214,177,111,0.1)]">
              <LayoutDashboard className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter text-foreground leading-tight">
                Painel <span className="text-primary italic">Executivo</span>
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[9px] font-black text-success uppercase tracking-wider">Live Hub</span>
                </div>
                <span className="text-border">|</span>
                <p className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-[0.25em]">Visão Analítica / Ética Áxis</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate("/admin/properties/new")} 
            className="bg-card/40 border-border/40 hover:bg-primary/5 hover:border-primary/30 text-[10px] font-black uppercase tracking-[0.2em] h-14 px-8 transition-all duration-500 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2 text-primary" /> Novo Imóvel
          </Button>
          <Button 
            size="lg" 
            onClick={() => navigate("/admin/contracts/new")} 
            className="bg-primary text-primary-foreground hover:bg-accent shadow-[0_10px_30px_rgba(214,177,111,0.2)] text-[10px] font-black uppercase tracking-[0.2em] h-14 px-8 transition-all duration-500 hover:scale-105 active:scale-95 rounded-xl border border-primary/20"
          >
            <Zap className="h-4 w-4 mr-2" /> Novo Contrato
          </Button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-16"
      >
        {/* Benchmarks Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-primary opacity-60" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Market / Performance Benchmarks</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-border/40 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PerformanceBenchmarkCard
              label="Taxa Conversão"
              currentValue={stats.totalLeads > 0 ? Math.round((stats.convertedLeads / stats.totalLeads) * 100) : 0}
              averageValue={18}
              suffix="%"
            />
            <PerformanceBenchmarkCard
              label="Leads Ativos"
              currentValue={stats.inProgressLeads}
              averageValue={12}
            />
            <PerformanceBenchmarkCard
              label="Novos Leads"
              currentValue={stats.newLeads}
              averageValue={25}
            />
          </div>
        </section>

        {/* Core Indicators */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-primary opacity-60" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Data / Indicadores de Fluxo</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-border/40 to-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard title="Leads Totais" value={stats.totalLeads} icon={MessageSquare} variant="primary" onClick={() => navigate("/admin/leads")} />
            <StatCard title="Novos Hoje" value={stats.newLeads} icon={UserPlus} variant="primary" />
            <StatCard title="Em Negociação" value={stats.inProgressLeads} icon={TrendingUp} variant="warning" />
            <StatCard title="Sucesso/Sales" value={stats.convertedLeads} icon={Users} variant="success" />
            <StatCard title="Inventário Ativo" value={stats.activeProperties} icon={Home} variant="success" onClick={() => navigate("/admin/properties")} />
            <StatCard title="Aguardando Visto" value={stats.pendingProperties} icon={Home} variant="warning" />
            <StatCard title="Gestão Contratos" value={stats.activeContracts} icon={FileText} variant="primary" onClick={() => navigate("/admin/contracts")} />
            <StatCard title="Alertas Prazo" value={stats.expiringContracts} icon={AlertTriangle} variant="destructive" />
          </div>
        </section>

        {/* Intelligence Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Recent Leads */}
          <motion.div variants={itemVariants}>
            <Card className="border border-border/30 bg-[#1c1b19]/30 backdrop-blur-md overflow-hidden shadow-2xl transition-all duration-700 hover:bg-[#1c1b19]/50">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-border/20 bg-white/[0.01] px-8 py-7">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-foreground/70">
                  <span className="h-4 w-1 bg-primary rounded-full" />
                  Recent Intelligence / Leads
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin/leads")} className="text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 text-primary/80 h-9 px-5 rounded-lg border border-transparent hover:border-primary/10 transition-all">
                  Ver Hub <Eye className="h-3.5 w-3.5 ml-2" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {recentLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30 gap-4">
                    <Users className="h-16 w-16 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Registros...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {recentLeads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between px-8 py-6 hover:bg-white/[0.03] transition-all duration-500 cursor-pointer group" onClick={() => navigate("/admin/leads")}>
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-sm border border-primary/10 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500">
                            {lead.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-bold text-foreground/90 group-hover:text-primary transition-colors duration-300">{lead.name}</p>
                            <p className="text-[11px] text-muted-foreground/50 font-medium tracking-tight truncate max-w-[150px] sm:max-w-xs">{lead.email || lead.phone}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn("text-[9px] font-black tracking-widest py-1.5 px-4 rounded-full border-transparent bg-white/[0.03] uppercase transition-all duration-500 group-hover:border-current", statusColors[lead.status])}>
                          {lead.status?.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Expiring Contracts */}
          <motion.div variants={itemVariants}>
            <Card className="border border-border/30 bg-[#1c1b19]/30 backdrop-blur-md overflow-hidden shadow-2xl transition-all duration-700 hover:bg-[#201f1d]/50">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-border/20 bg-white/[0.01] px-8 py-7">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-foreground/70">
                  <span className="h-4 w-1 bg-destructive/60 rounded-full" />
                  At-Risk Intelligence / Contratos
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin/contracts")} className="text-[10px] font-black uppercase tracking-widest hover:bg-destructive/5 text-destructive/80 h-9 px-5 rounded-lg border border-transparent hover:border-destructive/10 transition-all">
                  Auditar <AlertTriangle className="h-3.5 w-3.5 ml-2" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {expiringContracts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30 gap-4">
                    <FileText className="h-16 w-16 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Estabilidade Operacional Detectada</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {expiringContracts.map((c) => (
                      <div key={c.id} className="flex items-center justify-between px-8 py-6 hover:bg-white/[0.03] transition-all duration-500 cursor-pointer group" onClick={() => navigate("/admin/contracts")}>
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-xl bg-destructive/5 flex items-center justify-center text-destructive border border-destructive/10 group-hover:rotate-6 transition-all duration-500">
                            <AlertTriangle className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-bold text-foreground/90 group-hover:text-destructive transition-colors duration-300">Ref: {c.contract_number}</p>
                            <p className="text-[11px] text-muted-foreground/60 font-medium tracking-tight italic">Exposição de risco iminente</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20 text-[11px] font-black tracking-tighter h-8 px-4 rounded-lg">
                            {c.end_date ? format(new Date(c.end_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </PremiumPageReveal>
  );
}
