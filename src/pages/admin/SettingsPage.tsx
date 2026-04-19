import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Database, Shield, Globe, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast.error("Erro ao atualizar senha", { description: error.message });
    } else {
      toast.success("Senha atualizada com sucesso");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Dados da Imobiliária</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><p className="text-sm text-muted-foreground">Empresa</p><p className="text-sm font-medium text-foreground">Axis Imobiliária</p></div>
            <div><p className="text-sm text-muted-foreground">CNPJ</p><p className="text-sm font-medium text-foreground">—</p></div>
            <div><p className="text-sm text-muted-foreground">Telefone</p><p className="text-sm font-medium text-foreground">—</p></div>
            <div><p className="text-sm text-muted-foreground">E-mail</p><p className="text-sm font-medium text-foreground">—</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Segurança (Alterar Senha)</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Digitar nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repetir nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Atualizar Senha
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Integrações</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Lovable Cloud</p>
                <p className="text-xs text-muted-foreground">Banco de dados, autenticação e storage</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success">Conectado</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Permissões & Acesso</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Acesso ao painel é restrito a administradores autorizados</p>
            <p>• Login por e-mail e senha (único por usuário)</p>
            <p>• Usuários inativos são automaticamente bloqueados</p>
            <p>• Todas as tabelas possuem Row Level Security (RLS)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Publicação de Imóveis</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Imóveis com status <Badge variant="secondary" className="bg-success/10 text-success mx-1">ativo</Badge> e publicação <Badge variant="secondary" className="bg-success/10 text-success mx-1">ativada</Badge> aparecem no site automaticamente</p>
            <p>• O site consulta diretamente a tabela <code className="bg-muted px-1 rounded">properties</code> filtrando por <code className="bg-muted px-1 rounded">published = true AND status = 'ativo'</code></p>
            <p>• Alterações no painel são refletidas em tempo real no site</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
