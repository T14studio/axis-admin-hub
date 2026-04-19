import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables as DBTables, TablesInsert } from "@/integrations/supabase/types";
import { PremiumPageReveal } from "@/components/ui/premium-page-reveal";
import { motion, AnimatePresence } from "framer-motion";

type Lead = DBTables<"leads">;
const STATUSES = ["novo", "em_atendimento", "qualificado", "visita_agendada", "proposta", "convertido", "perdido"] as const;

const statusColors: Record<string, string> = {
  novo: "bg-primary/10 text-primary border-primary/20",
  em_atendimento: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  qualificado: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  visita_agendada: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  proposta: "bg-primary/10 text-primary border-primary/20",
  convertido: "bg-success/10 text-success border-success/20",
  perdido: "bg-destructive/10 text-destructive border-destructive/20",
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
    <PremiumPageReveal className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            Gestão de Leads
          </h1>
          <p className="text-muted-foreground text-sm">Gerencie e qualifique seus contatos de forma eficiente.</p>
        </div>
        <Button onClick={openNew} className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <Plus className="h-4 w-4 mr-2" /> Novo Lead
        </Button>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-border/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome, e-mail ou telefone..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-colors" 
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-56 bg-background/50 border-border/50">
                <SelectValue placeholder="Filtrar por Status" />
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
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">Carregando leads...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
              <div className="p-3 bg-muted rounded-full">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Nenhum lead encontrado</p>
              <p className="text-xs text-muted-foreground">Tente ajustar seus filtros de busca.</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Nome</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-xs uppercase tracking-wider">Contato</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">Status</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-xs uppercase tracking-wider">Origem</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-xs uppercase tracking-wider">Data de Cadastro</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((lead, index) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="group border-b border-border/40 cursor-pointer hover:bg-primary/5 transition-colors"
                        onClick={() => openEdit(lead)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm group-hover:text-primary transition-colors">{lead.name}</span>
                            <span className="text-[10px] text-muted-foreground lg:hidden">
                              {lead.origin || "Origem não informada"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium">{lead.email || "-"}</span>
                            <span className="text-[11px] text-muted-foreground">{lead.phone || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`capitalize font-medium text-[10px] py-0 px-2 ${statusColors[lead.status]}`}>
                            {lead.status?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground italic">{lead.origin || "-"}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {(() => {
                              try { return format(new Date(lead.created_at), "dd 'de' MMM, yyyy", { locale: ptBR }); } catch (e) { return "-"; }
                            })()}
                          </span>
                        </TableCell>
                        <TableCell className="p-0 pr-4">
                          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-2 hover:bg-primary/10 rounded-full transition-colors">
                              <Edit className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-primary/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editing ? "Editar Perfil do Lead" : "Cadastrar Novo Lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider opacity-70">Nome Completo</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider opacity-70">E-mail de Contato</Label>
              <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider opacity-70">WhatsApp / Telefone</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider opacity-70">Canal de Origem</Label>
              <Input value={form.origin || ""} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Site, Ads, WhatsApp..." className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider opacity-70">Status de Atendimento</Label>
              <Select value={form.status || "novo"} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider opacity-70">Consultor Responsável</Label>
              <Input value={form.responsible || ""} onChange={(e) => setForm({ ...form, responsible: e.target.value })} className="bg-muted/30" />
            </div>
            <div className="col-span-full space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider opacity-70">Interesse Primário</Label>
              <Input value={form.interest || ""} onChange={(e) => setForm({ ...form, interest: e.target.value })} placeholder="Ex: Apartamento no Centro, Terreno..." className="bg-muted/30" />
            </div>
            <div className="col-span-full space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider opacity-70">Notas e Observações Internas</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="bg-muted/30 resize-none" />
            </div>
          </div>
          <DialogFooter className="border-t pt-4 gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="hover:bg-destructive/5 hover:text-destructive transition-colors">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="px-8 shadow-lg shadow-primary/20">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? "Salvar Alterações" : "Efetivar Cadastro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PremiumPageReveal>
  );
}
