import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { NotificationsMenu } from "@/components/NotificationsMenu";
import { UserAvatar } from "@/components/UserAvatar";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background selection:bg-primary/20">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-xl px-8 shrink-0 sticky top-0 z-40 transition-all">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="hover:bg-white/10 transition-colors h-10 w-10" />
              <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />
              <div className="hidden sm:flex flex-col gap-0.5">
                <span className="text-sm font-bold text-foreground tracking-[0.2em] uppercase leading-none">Axis Hub</span>
                <span className="text-[9px] text-muted-foreground font-medium tracking-[0.1em] uppercase opacity-80">Ethics Administration</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <NotificationsMenu />
              </div>
              <div className="h-8 w-[1px] bg-white/5 mx-2" />
              <UserAvatar />
            </div>
          </header>
          <main className="flex-1 p-6 md:p-8 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
