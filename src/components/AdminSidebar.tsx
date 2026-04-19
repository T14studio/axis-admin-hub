import {
  LayoutDashboard, Users, Building2, FileText, UserCheck, Settings, MessageSquare, Home,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Leads", url: "/admin/leads", icon: MessageSquare },
  { title: "Imóveis", url: "/admin/properties", icon: Home },
  { title: "Contratos", url: "/admin/contracts", icon: FileText },
  { title: "Clientes", url: "/admin/clients", icon: Users },
  { title: "Usuários", url: "/admin/users", icon: UserCheck },
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup className="px-4 py-6">
          <SidebarGroupLabel className="mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-foreground tracking-widest text-sm leading-tight">ÉTICA</span>
                  <span className="text-[10px] text-muted-foreground font-medium tracking-[0.2em] leading-tight">ÁXIS HUB</span>
                </div>
              )}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="h-11 px-3 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin"} 
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground group transition-colors" 
                      activeClassName="bg-white/5 text-primary shadow-[inset_0_0_20px_rgba(79,152,163,0.05)] border border-primary/10"
                    >
                      <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                      {!collapsed && <span className="font-medium tracking-wide">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
