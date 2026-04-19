import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { NotificationsMenu } from "@/components/NotificationsMenu";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background selection:bg-primary/20">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-8 shrink-0 sticky top-0 z-40 transition-all duration-300">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-all duration-300 h-10 w-10 rounded-lg" />
              <div className="h-6 w-[1px] bg-border/50 hidden sm:block" />
              <div className="hidden sm:flex flex-col gap-0.5">
                <span className="text-sm font-bold text-foreground tracking-[0.2em] uppercase leading-none">Axis Hub</span>
                <span className="text-[9px] text-muted-foreground font-medium tracking-[0.1em] uppercase opacity-60">Ethics Administration</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <NotificationsMenu />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut} 
                  title="Sair"
                  className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all duration-300"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-8 w-[1px] bg-border/50 mx-2" />
              <UserAvatar />
            </div>
          </header>
          
          <main className="flex-1 p-6 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
