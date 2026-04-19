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
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-[#0d0c0b]">
      <SidebarContent>
        <SidebarGroup className="px-4 py-8">
          <SidebarGroupLabel className="mb-10 px-2 h-auto">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(214,177,111,0.1)]">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-foreground tracking-[0.2em] text-sm leading-tight">ÉTICA</span>
                  <span className="text-[10px] text-muted-foreground font-medium tracking-[0.3em] leading-tight opacity-70">ÁXIS HUB</span>
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
                    className="h-12 px-3 transition-all duration-300 rounded-lg group"
                  >
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin"} 
                      className={`flex items-center gap-3 w-full transition-all duration-300 ${
                        isActive(item.url) ? "shadow-sm" : "hover:bg-primary/5"
                      }`} 
                      activeClassName="bg-primary/10 text-primary border border-primary/10"
                    >
                      <item.icon className={`h-5 w-5 transition-all duration-300 ${
                        isActive(item.url) ? "text-primary" : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"
                      }`} />
                      {!collapsed && (
                        <span className={`font-medium tracking-wide transition-colors duration-300 ${
                          isActive(item.url) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        }`}>
                          {item.title}
                        </span>
                      )}
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
