import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  ativo: "bg-success/10 text-success",
  pendente: "bg-warning/10 text-warning",
  encerrado: "bg-muted text-muted-foreground",
  vencendo: "bg-destructive/10 text-destructive",
  vencido: "bg-destructive/10 text-destructive",
};

export default function ContractsPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { fetchContracts(); }, []);

  async function fetchContracts() {
    setLoading(true);
    const { data } = await supabase
      .from("contracts")
      .select(`
        id, contract_number, client_id, client_cpf, contract_type, start_date, end_date, status, value, created_at,
        clients (
          full_name
        )
      `)
      .order("created_at", { ascending: false });
    setContracts(data || []);
    setLoading(false);
  }

  const filtered = contracts.filter((c) => {
    const name = (c.clients?.full_name || "").toLowerCase();
    const cpf = c.client_cpf || "";
    const cleanSearch = search.replace(/\D/g, "");
    const cleanCpf = cpf.replace(/\D/g, "");
    
    const matchCpf = (cleanSearch && cleanCpf.includes(cleanSearch)) || cpf.includes(search);
    
    const match = !search ||
      (c.contract_number || "").toLowerCase().includes(search.toLowerCase()) ||
      matchCpf ||
      name.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return match && matchStatus;
  });

  const formatPrice = (v: number | null) => v ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-";

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === "ativo").length,
    pending: contracts.filter(c => c.status === "pendente").length,
    expiring: contracts.filter(c => c.status === "vencendo").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Gestão de Contratos</h1>
        <Button onClick={() => navigate("/admin/contracts/new")} className="shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> Novo Contrato
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/10">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Ativos</p>
            <p className="text-2xl font-bold text-success">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/10">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Pendentes</p>
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/10">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Vencendo</p>
            <p className="text-2xl font-bold text-destructive">{stats.expiring}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 bg-muted/30 backdrop-blur-sm">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-primary" />
              <Input placeholder="Buscar por CPF, número do contrato ou nome do cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 border-primary/20" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
                <SelectItem value="vencendo">Vencendo</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum contrato encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Contrato</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">CPF/CNPJ</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Data</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    let dateDisplay = "—";
                    try {
                      if (c.start_date) {
                        const start = format(new Date(c.start_date), "dd/MM/yy");
                        const end = c.end_date ? format(new Date(c.end_date), "dd/MM/yy") : "Indet.";
                        dateDisplay = `${start} - ${end}`;
                      } else if (c.created_at) {
                        dateDisplay = format(new Date(c.created_at), "dd/MM/yy");
                      }
                    } catch (e) {}
                    const clientName = c.clients?.full_name || "Sem nome";
                    const clientCpf = c.client_cpf || "";
                    const contractType = c.contract_type || "";
                    return (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/contracts/${c.id}`)}>
                        <TableCell className="font-medium">#{c.contract_number}</TableCell>
                        <TableCell>{clientName}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{clientCpf}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{contractType}</TableCell>
                        <TableCell>{formatPrice(c.value)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={STATUS_COLORS[c.status] || ""}>{c.status || "—"}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                          {dateDisplay}
                        </TableCell>
                        <TableCell><FileText className="h-4 w-4 text-muted-foreground" /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
