import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Home, FileText, Users, Plus, AlertTriangle, TrendingUp, UserPlus, Eye, LayoutDashboard
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PremiumPageReveal } from "@/components/ui/premium-page-reveal";
import { PerformanceBenchmarkCard } from "@/components/PerformanceBenchmarkCard";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0, newLeads: 0, inProgressLeads: 0, convertedLeads: 0,
    activeProperties: 0, pendingProperties: 0,
    activeContracts: 0, expiringContracts: 0, expiredContracts: 0,
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: leadsData } = await supabase.from("leads").select("*");
      const { data: propsData } = await supabase.from("properties").select("*");
      const { data: contractsData } = await supabase.from("contracts").select("*");

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
      setRecentProperties(props.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5));
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
    em_atendimento: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    convertido: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    perdido: "bg-destructive/10 text-destructive border-destructive/20",
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Sincronizando dados administrativos...</p>
    </div>
  );

  return (
    <PremiumPageReveal className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight">
                Dashboard <span className="text-primary">Executivo</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-70">Visão Analítica / Ética Áxis</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" size="lg" onClick={() => navigate("/admin/properties/new")} className="bg-background/20 border-white/5 hover:bg-white/5 text-xs font-bold uppercase tracking-widest h-12 px-6 transition-all duration-300">
            <Plus className="h-4 w-4 mr-2" /> Novo Imóvel
          </Button>
          <Button size="lg" onClick={() => navigate("/admin/contracts/new")} className="shadow-2xl shadow-primary/40 text-xs font-bold uppercase tracking-widest h-12 px-6 transition-all duration-300 hover:scale-105 active:scale-95">
            <Plus className="h-4 w-4 mr-2" /> Novo Contrato
          </Button>
        </div>
      </div>

      {/* Benchmark section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Core / Benchmarks de Performance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PerformanceBenchmarkCard
            label="Conversão"
            currentValue={stats.totalLeads > 0 ? Math.round((stats.convertedLeads / stats.totalLeads) * 100) : 0}
            averageValue={18}
            suffix="%"
          />
          <PerformanceBenchmarkCard
            label="Atendimento"
            currentValue={stats.inProgressLeads}
            averageValue={12}
            label="Atendimento Ativo"
          />
          <PerformanceBenchmarkCard
            label="Volume Mensal"
            currentValue={stats.totalLeads}
            averageValue={45}
            label="Novos Leads"
          />
        </div>
      </section>

      {/* Stats Grid */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Data / Indicadores em Tempo Real</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total de Leads" value={stats.totalLeads} icon={MessageSquare} variant="primary" onClick={() => navigate("/admin/leads")} />
          <StatCard title="Leads Novos" value={stats.newLeads} icon={UserPlus} variant="primary" onClick={() => navigate("/admin/leads")} />
          <StatCard title="Em Atendimento" value={stats.inProgressLeads} icon={TrendingUp} variant="warning" />
          <StatCard title="Convertidos" value={stats.convertedLeads} icon={Users} variant="success" />
          <StatCard title="Imóveis Ativos" value={stats.activeProperties} icon={Home} variant="success" onClick={() => navigate("/admin/properties")} />
          <StatCard title="Imóveis Pendentes" value={stats.pendingProperties} icon={Home} variant="warning" />
          <StatCard title="Contratos Ativos" value={stats.activeContracts} icon={FileText} variant="primary" onClick={() => navigate("/admin/contracts")} />
          <StatCard title="Contratos Vencendo" value={stats.expiringContracts} icon={AlertTriangle} variant="destructive" />
        </div>
      </section>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="border border-white/5 bg-card/20 backdrop-blur-sm overflow-hidden shadow-2xl transition-all duration-500 hover:bg-card/30">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5 bg-white/[0.02] px-8 py-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-3 text-muted-foreground/80">
              <Users className="h-4 w-4 text-primary" />
              Leads Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/leads")} className="text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 text-primary h-8 px-4">
              Gerenciar <Eye className="h-3 w-3 ml-2" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 gap-4">
                <Users className="h-12 w-12 opacity-10" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum registro encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between px-8 py-5 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer group" onClick={() => navigate("/admin/leads")}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20 group-hover:scale-110 transition-transform">
                        {lead.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground/50 font-medium tracking-tight">{lead.email || lead.phone}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] font-black tracking-widest py-1 px-3 border-transparent bg-white/[0.03] uppercase", statusColors[lead.status])}>
                      {lead.status?.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-white/5 bg-card/20 backdrop-blur-sm overflow-hidden shadow-2xl transition-all duration-500 hover:bg-card/30">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5 bg-white/[0.02] px-8 py-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-3 text-muted-foreground/80">
              <FileText className="h-4 w-4 text-destructive" />
              Contratos em Risco
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/contracts")} className="text-[9px] font-black uppercase tracking-widest hover:bg-destructive/10 text-destructive h-8 px-4">
              Auditar Tudo <AlertTriangle className="h-3 w-3 ml-2" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {expiringContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 gap-4">
                <FileText className="h-12 w-12 opacity-10" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Estabilidade total nos contratos</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {expiringContracts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-8 py-5 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer group" onClick={() => navigate("/admin/contracts")}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20 group-hover:rotate-12 transition-transform">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground/90 group-hover:text-destructive transition-colors">Ref: {c.contract_number}</p>
                        <p className="text-[10px] text-muted-foreground/50 font-medium italic tracking-tight">Expiração iminente detectada</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-black tracking-tighter h-7 px-3">
                        {c.end_date ? format(new Date(c.end_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PremiumPageReveal>
  );
}
