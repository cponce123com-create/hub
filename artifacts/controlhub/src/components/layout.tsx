import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Calendar,
  Files,
  Megaphone,
  BarChart,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { icon: LayoutDashboard, label: "Inicio", href: "/" },
  { icon: FileText, label: "Facturas", href: "/finance/invoices" },
  { icon: Building2, label: "Proveedores", href: "/finance/suppliers" },
  { icon: Users, label: "Empleados", href: "/hr/employees" },
  { icon: Calendar, label: "Asistencia", href: "/attendance" },
  { icon: Files, label: "Documentos", href: "/documents" },
  { icon: Megaphone, label: "Comunicados", href: "/announcements" },
  { icon: BarChart, label: "Reportes", href: "/reports" },
  { icon: Settings, label: "Configuración", href: "/settings" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, company, logout } = useCompany();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        setLocation("/login");
      },
    });
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 border-b border-border/40 flex items-center px-4 md:px-6 bg-card/50 backdrop-blur-sm z-10 shrink-0">
            <SidebarTrigger className="-ml-2 mr-2" />
            <div className="font-semibold text-sm tracking-tight text-muted-foreground flex items-center">
              {company?.name || "ControlHub"}
            </div>
            <div className="ml-auto flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
              )}
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const [location] = useLocation();
  const { user, company, logout } = useCompany();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();
  const { state } = useSidebar();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        setLocation("/login");
      },
    });
  };

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="h-14 flex items-center px-4 border-b border-border/40">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          {state === "expanded" && <span>ControlHub</span>}
        </div>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={location === item.href || (item.href !== "/" && location.startsWith(item.href))}
                tooltip={item.label}
              >
                <Link href={item.href} data-testid={`nav-${item.label.toLowerCase()}`}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40 p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground" 
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {state === "expanded" && <span>Cerrar sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
