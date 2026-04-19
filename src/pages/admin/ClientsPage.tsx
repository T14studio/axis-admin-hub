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
  full_name: "", cpf: "", phone: "", email: "", address: "", client_type: "pessoa_fisica", notes: "",
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
    const { data } = await supabase.from("clients").select("*").order("full_name");
    setClients(data || []);
    setLoading(false);
  }

  function openNew() { setEditing(null); setForm(emptyClient); setDialogOpen(true); }
  function openEdit(c: Client) {
    setEditing(c);
    setForm({
      full_name: c.full_name, cpf: c.cpf, phone: c.phone || "", email: c.email || "",
      address: c.address || "", client_type: c.client_type || "pessoa_fisica", notes: c.notes || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.full_name || !form.cpf) { toast.error("Nome e CPF são obrigatórios"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("clients").update(form).eq("id", editing.id);
      if (error) toast.error(error.message); else toast.success("Cliente atualizado");
    } else {
      const { error } = await supabase.from("clients").insert(form);
      if (error) toast.error(error.message); else toast.success("Cliente criado");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchClients();
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
            <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
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
            <div className="col-span-full space-y-2"><Label>Endereço</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="col-span-full space-y-2"><Label>Observações</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
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
