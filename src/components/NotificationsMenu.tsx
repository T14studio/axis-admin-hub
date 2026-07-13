import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchRecentActivity();
    
    // Opcional: Listen to real-time changes
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        () => fetchRecentActivity()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchRecentActivity() {
    // Pegar leads recentes como "notificações"
    const { data: leads } = await supabase
      .from("leads")
      .select("id, name, created_at, status")
      .order("created_at", { ascending: false })
      .limit(5);

    if (leads) {
      setNotifications(leads);
      setUnreadCount(leads.filter(l => new Date(l.created_at).getTime() > Date.now() - 3600000).length); // Exemplo: últimos 1h
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-gold/10 transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-primary text-[10px] border-2 border-background"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl border-primary/10">
        <DropdownMenuLabel className="p-4 font-semibold text-sm border-b">
          Atividade Recente
        </DropdownMenuLabel>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma atividade recente.
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="p-4 focus:bg-muted/50 cursor-default border-b last:border-0 items-start flex-col gap-1">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-xs">Novo Lead: {n.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Um novo lead entrou pelo sistema e aguarda atendimento.
                </p>
                <Badge variant="outline" className="text-[9px] h-4 border-primary/20 text-primary/80 mt-1">
                  {n.status}
                </Badge>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <div className="p-2 border-t text-center">
          <Button variant="ghost" size="sm" className="w-full text-xs text-primary hover:text-primary hover:bg-primary/5">
            Ver todas as notificações
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
