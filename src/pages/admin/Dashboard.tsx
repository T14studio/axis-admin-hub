import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Home, FileText, Users, Plus, AlertTriangle, TrendingUp, UserPlus, Eye,
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
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
    const [leadsRes, propsRes, contractsRes] = await Promise.all([
      supabase.from("leads").select("*"),
      supabase.from("properties").select("*"),
      supabase.from("contracts").select("*, clients(full_name)"),
    ]);

    const leads = leadsRes.data || [];
    const props = propsRes.data || [];
    const contracts = contractsRes.data || [];

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
      expiringContracts: contracts.filter((c) => c.end_date && new Date(c.end_date) <= thirtyDays && new Date(c.end_date) > today).length,
      expiredContracts: contracts.filter((c) => c.end_date && new Date(c.end_date) < today && c.status !== "encerrado").length,
    });

    setRecentLeads(leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
    setRecentProperties(props.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
    setExpiringContracts(
      contracts.filter((c) => c.end_date && new Date(c.end_date) <= thirtyDays && c.status !== "encerrado")
        .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime()).slice(0, 5)
    );
  }

  const statusColors: Record<string, string> = {
    novo: "bg-primary/10 text-primary",
    em_atendimento: "bg-warning/10 text-warning",
    convertido: "bg-success/10 text-success",
    perdido: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => navigate("/admin/properties/new")}>
            <Plus className="h-4 w-4 mr-1" /> Novo Imóvel
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/admin/contracts/new")}>
            <Plus className="h-4 w-4 mr-1" /> Novo Contrato
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Leads" value={stats.totalLeads} icon={MessageSquare} variant="primary" onClick={() => navigate("/admin/leads")} />
        <StatCard title="Leads Novos" value={stats.newLeads} icon={UserPlus} variant="primary" onClick={() => navigate("/admin/leads")} />
        <StatCard title="Em Atendimento" value={stats.inProgressLeads} icon={TrendingUp} variant="warning" />
        <StatCard title="Convertidos" value={stats.convertedLeads} icon={Users} variant="success" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Imóveis Ativos" value={stats.activeProperties} icon={Home} variant="success" onClick={() => navigate("/admin/properties")} />
        <StatCard title="Imóveis Pendentes" value={stats.pendingProperties} icon={Home} variant="warning" />
        <StatCard title="Contratos Ativos" value={stats.activeContracts} icon={FileText} variant="primary" onClick={() => navigate("/admin/contracts")} />
        <StatCard title="Contratos Vencendo" value={stats.expiringContracts} icon={AlertTriangle} variant="destructive" />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Leads Recentes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/leads")}>
              <Eye className="h-4 w-4 mr-1" /> Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum lead cadastrado</p>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.email || lead.phone}</p>
                    </div>
                    <Badge variant="secondary" className={statusColors[lead.status] || ""}>
                      {lead.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Contracts Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Contratos Vencendo</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/contracts")}>
              <Eye className="h-4 w-4 mr-1" /> Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            {expiringContracts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum contrato próximo do vencimento</p>
            ) : (
              <div className="space-y-3">
                {expiringContracts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">#{c.contract_number}</p>
                      <p className="text-xs text-muted-foreground">{(c as any).clients?.full_name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                        {c.end_date ? format(new Date(c.end_date), "dd/MM/yyyy") : "-"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
