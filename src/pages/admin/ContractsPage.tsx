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
    const { data } = await supabase.from("contracts").select("*, clients(full_name)").order("created_at", { ascending: false });
    setContracts(data || []);
    setLoading(false);
  }

  const filtered = contracts.filter((c) => {
    const match = !search ||
      c.contract_number.toLowerCase().includes(search.toLowerCase()) ||
      c.client_cpf.includes(search) ||
      (c.clients?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return match && matchStatus;
  });

  const formatPrice = (v: number | null) => v ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
        <Button onClick={() => navigate("/admin/contracts/new")}><Plus className="h-4 w-4 mr-1" /> Novo Contrato</Button>
      </div>

      {/* CPF Search Prominent */}
      <Card className="border-primary/20 bg-primary/5">
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
                    <TableHead className="hidden md:table-cell">CPF</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Vigência</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/contracts/${c.id}`)}>
                      <TableCell className="font-medium">#{c.contract_number}</TableCell>
                      <TableCell>{c.clients?.full_name || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{c.client_cpf}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{c.contract_type}</TableCell>
                      <TableCell>{formatPrice(c.value)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_COLORS[c.status] || ""}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                        {format(new Date(c.start_date), "dd/MM/yy")} - {c.end_date ? format(new Date(c.end_date), "dd/MM/yy") : "Indeterminado"}
                      </TableCell>
                      <TableCell><FileText className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
