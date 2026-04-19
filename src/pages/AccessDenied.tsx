import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX } from "lucide-react";

export default function AccessDenied() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center animate-fade-in">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta não está autorizada a acessar o painel administrativo. Entre em contato com o administrador.
          </p>
          <Button variant="outline" onClick={signOut} className="mt-4">
            Sair e usar outra conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
