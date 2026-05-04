import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Loader2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import type { Tables as DBTables } from "@/integrations/supabase/types";

type AdminUser = DBTables<"admin_users">;
const ROLES = ["admin_master", "admin_operacional", "comercial", "administrativo", "financeiro"] as const;

const roleLabels: Record<string, string> = {
  admin_master: "Admin Master",
  admin_operacional: "Admin Operacional",
  comercial: "Comercial",
  administrativo: "Administrativo",
  financeiro: "Financeiro",
};

export default function UsersPage() {
  const { adminUser: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin_operacional" as string, active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase.from("admin_users").select("id, name, email, role, active, created_at, user_id").order("name");
    setUsers(data || []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "admin_operacional", active: true });
    setDialogOpen(true);
  }

  function openEdit(u: AdminUser) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, active: u.active });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.email) { toast.error("Nome e e-mail são obrigatórios"); return; }
    setSaving(true);

    if (editing) {
      const { error } = await supabase.from("admin_users").update({
        name: form.name, email: form.email, role: form.role as any, active: form.active,
      }).eq("id", editing.id);
      if (error) toast.error(error.message); else toast.success("Usuário atualizado");
    } else {
      if (!form.password || form.password.length < 6) {
        toast.error("Senha obrigatória (mínimo 6 caracteres)");
        setSaving(false);
        return;
      }
      // Create auth user first, then admin_users entry
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email, password: form.password,
      });
      if (authErr || !authData.user) {
        toast.error(authErr?.message || "Erro ao criar usuário");
        setSaving(false);
        return;
      }
      const { error } = await supabase.from("admin_users").insert({
        user_id: authData.user.id, name: form.name, email: form.email,
        role: form.role as any, active: form.active,
      });
      if (error) toast.error(error.message); else toast.success("Usuário criado com sucesso");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchUsers();
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Usuários & Acesso</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Usuário</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum usuário cadastrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(u)}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell><Badge variant="secondary">{roleLabels[u.role] || u.role}</Badge></TableCell>
                      <TableCell>
                        {u.active
                          ? <Badge variant="secondary" className="bg-success/10 text-success"><UserCheck className="h-3 w-3 mr-1" />Ativo</Badge>
                          : <Badge variant="secondary" className="bg-destructive/10 text-destructive"><UserX className="h-3 w-3 mr-1" />Inativo</Badge>
                        }
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>E-mail *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editing} /></div>
            {!editing && (
              <div className="space-y-2"><Label>Senha *</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} /></div>
            )}
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
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
