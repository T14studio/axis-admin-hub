import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables as DBTables, TablesInsert } from "@/integrations/supabase/types";

type Client = DBTables<"clients">;

const emptyClient: TablesInsert<"clients"> = {
  full_name: "", cpf: "", phone: "", email: "", client_type: "pessoa_fisica",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<TablesInsert<"clients">>(emptyClient);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    setLoading(true);
    // Explicitly list columns to avoid errors if schema cache is out of sync for address/notes
    const { data } = await supabase
      .from("clients")
      .select("id, full_name, cpf, phone, email, client_type, created_at, updated_at")
      .order("full_name");
    setClients(data || []);
    setLoading(false);
  }

  function openNew() { setEditing(null); setForm(emptyClient); setDialogOpen(true); }
  function openEdit(c: Client) {
    setEditing(c);
    setForm({
      full_name: c.full_name, 
      cpf: c.cpf, 
      phone: c.phone || "", 
      email: c.email || "",
      client_type: c.client_type || "pessoa_fisica",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.full_name || !form.cpf || !form.email) { 
      toast.error("Nome, CPF e E-mail são obrigatórios"); return; 
    }
    
    setSaving(true);
    
    const payload = {
      full_name: form.full_name.trim(),
      cpf: form.cpf.replace(/\D/g, ""),
      email: form.email.toLowerCase().trim(),
      phone: form.phone?.trim() || null,
      client_type: form.client_type || "pessoa_fisica"
    };
    
    try {
      // Quick check for duplicates (optimistic)
      if (!editing) {
        const { data: existing } = await supabase
          .from("clients")
          .select("id")
          .or(`cpf.eq.${payload.cpf},email.eq.${payload.email}`)
          .maybeSingle();
        
        if (existing) {
          toast.error("Já existe um cliente com este CPF ou E-mail.");
          setSaving(false);
          return;
        }
      }

      if (editing) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Cliente atualizado");
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
        toast.success("Cliente criado");
      }
      
      setDialogOpen(false);
      fetchClients();
    } catch (err: any) {
      console.error("Erro ao salvar cliente:", err);
      toast.error(err.message || "Erro ao salvar o cliente");
    } finally {
      setSaving(false);
    }
  }

  const filtered = clients.filter((c) =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.cpf.includes(search)
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CPF..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead className="hidden md:table-cell">Telefone</TableHead>
                    <TableHead className="hidden md:table-cell">E-mail</TableHead>
                    <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(c)}>
                      <TableCell className="font-medium">{c.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.cpf}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{c.phone || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{c.email || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{(c.client_type || "").replace("_", " ")}</TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-full space-y-2"><Label>Nome Completo *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>CPF *</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>E-mail *</Label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" /></div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.client_type || "pessoa_fisica"} onValueChange={(v) => setForm({ ...form, client_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                  <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
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
