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
  Command,
  Search,
  Bell,
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navGroups = [
  {
    label: "General",
    items: [
      { icon: LayoutDashboard, label: "Inicio", href: "/" },
      { icon: Megaphone, label: "Comunicados", href: "/announcements" },
    ]
  },
  {
    label: "Finanzas",
    items: [
      { icon: FileText, label: "Facturas", href: "/finance/invoices" },
      { icon: Building2, label: "Proveedores", href: "/finance/suppliers" },
    ]
  },
  {
    label: "Recursos Humanos",
    items: [
      { icon: Users, label: "Empleados", href: "/hr/employees" },
      { icon: Calendar, label: "Asistencia", href: "/attendance" },
      { icon: Files, label: "Documentos", href: "/documents" },
    ]
  },
  {
    label: "Analitica",
    items: [
      { icon: BarChart, label: "Reportes", href: "/reports" },
    ]
  }
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
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background/95">
          <header className="h-16 border-b border-border/40 flex items-center px-4 md:px-6 bg-card/60 backdrop-blur-xl z-10 shrink-0 sticky top-0 shadow-sm">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="-ml-2" />
              <div className="hidden md:flex items-center relative max-w-md w-full">
                <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
                <Input placeholder="Buscar facturas, empleados, reportes..." className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded-full w-full" />
              </div>
            </div>
            <div className="ml-auto flex items-center space-x-3">
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
              </Button>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2">
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="w-full cursor-pointer flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configuracion</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-400 focus:text-red-400 cursor-pointer" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesion</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const [location] = useLocation();
  const { company } = useCompany();
  const { state } = useSidebar();

  return (
    <Sidebar className="border-r border-border/40 bg-card">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/40">
        <Link href="/" className="flex items-center gap-3 font-bold text-lg tracking-tight text-foreground hover:opacity-90 transition-opacity w-full">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
            <Command className="w-5 h-5" />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="leading-none">{company?.name || "ControlHub"}</span>
              <span className="text-[10px] text-muted-foreground font-normal mt-0.5 tracking-wider uppercase">Empresa</span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-4 scrollbar-hide">
        {navGroups.map((group, i) => (
          <SidebarGroup key={i} className="mb-2">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 mb-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.href || (item.href !== "/" && location.startsWith(item.href))}
                      tooltip={item.label}
                      className="rounded-md mx-2 h-9 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium transition-all"
                    >
                      <Link href={item.href} data-testid={`nav-${item.label.toLowerCase()}`}>
                        <item.icon className="w-4 h-4 mr-2" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configuracion" className="rounded-md h-9">
              <Link href="/settings" data-testid="nav-settings">
                <Settings className="w-4 h-4 mr-2" />
                <span>Configuracion</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
