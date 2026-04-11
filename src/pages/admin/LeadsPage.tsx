import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables as DBTables, TablesInsert } from "@/integrations/supabase/types";

type Lead = DBTables<"leads">;
const STATUSES = ["novo", "em_atendimento", "qualificado", "visita_agendada", "proposta", "convertido", "perdido"] as const;

const statusColors: Record<string, string> = {
  novo: "bg-primary/10 text-primary",
  em_atendimento: "bg-warning/10 text-warning",
  qualificado: "bg-accent text-accent-foreground",
  visita_agendada: "bg-success/10 text-success",
  proposta: "bg-primary/10 text-primary",
  convertido: "bg-success/10 text-success",
  perdido: "bg-destructive/10 text-destructive",
};

const emptyLead: TablesInsert<"leads"> = {
  name: "", phone: "", email: "", origin: "", interest: "", interest_type: "",
  initial_message: "", status: "novo", responsible: "", notes: "",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<TablesInsert<"leads">>(emptyLead);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }

  function openNew() { setEditing(null); setForm(emptyLead); setDialogOpen(true); }
  function openEdit(lead: Lead) {
    setEditing(lead);
    setForm({
      name: lead.name, phone: lead.phone || "", email: lead.email || "",
      origin: lead.origin || "", interest: lead.interest || "", interest_type: lead.interest_type || "",
      initial_message: lead.initial_message || "", status: lead.status,
      responsible: lead.responsible || "", notes: lead.notes || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("leads").update(form).eq("id", editing.id);
      if (error) toast.error(error.message); else toast.success("Lead atualizado");
    } else {
      const { error } = await supabase.from("leads").insert(form);
      if (error) toast.error(error.message); else toast.success("Lead criado");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchLeads();
  }

  const filtered = leads.filter((l) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.phone || "").includes(search);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, e-mail ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum lead encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">E-mail</TableHead>
                    <TableHead className="hidden md:table-cell">Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Origem</TableHead>
                    <TableHead className="hidden lg:table-cell">Data</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(lead)}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{lead.email || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{lead.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[lead.status] || ""}>
                          {lead.status?.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{lead.origin || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {(() => {
                          try { return format(new Date(lead.created_at), "dd/MM/yyyy"); } catch (e) { return "-"; }
                        })()}
                      </TableCell>
                      <TableCell><Edit className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Input value={form.origin || ""} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Site, WhatsApp, Indicação..." />
            </div>
            <div className="space-y-2">
              <Label>Interesse</Label>
              <Input value={form.interest || ""} onChange={(e) => setForm({ ...form, interest: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Interesse</Label>
              <Input value={form.interest_type || ""} onChange={(e) => setForm({ ...form, interest_type: e.target.value })} placeholder="Compra, Aluguel..." />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status || "novo"} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={form.responsible || ""} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
            </div>
            <div className="col-span-full space-y-2">
              <Label>Mensagem Inicial</Label>
              <Textarea value={form.initial_message || ""} onChange={(e) => setForm({ ...form, initial_message: e.target.value })} rows={2} />
            </div>
            <div className="col-span-full space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
