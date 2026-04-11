import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Database, Shield, Globe } from "lucide-react";

export default function SettingsPage() {
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
