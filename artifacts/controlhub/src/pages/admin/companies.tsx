import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCompany } from "@/context/CompanyContext";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  FileText,
  LogOut,
  Command,
  ArrowRight,
  Globe,
  ShieldCheck,
} from "lucide-react";

interface CompanyStats {
  id: number;
  name: string;
  ruc: string;
  industry: string;
  currency: string;
  address: string;
  email: string;
  phone: string;
  activeModules: string[];
  createdAt: string;
  stats: {
    employees: number;
    invoices: number;
    users: number;
  };
}

export default function AdminCompanies() {
  const { logout, setCompanyId, setActiveCompany } = useCompany();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const { data: companies, isLoading } = useQuery<CompanyStats[]>({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const res = await fetch("/api/admin/companies", { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar empresas");
      return res.json();
    },
  });

  const handleManage = (company: CompanyStats) => {
    setCompanyId(company.id);
    setActiveCompany({ id: company.id, name: company.name });
    setLocation("/");
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        setLocation("/login");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-foreground">ControlHub</span>
              <span className="ml-2 text-xs text-muted-foreground font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Panel Global
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border/50">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Super Administrador</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Empresas registradas
          </h1>
          <p className="text-muted-foreground text-base">
            Gestiona todas las organizaciones de la plataforma ControlHub desde aquí.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 rounded-xl bg-card border border-border/40 animate-pulse" />
            ))}
          </div>
        ) : !companies || companies.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No hay empresas registradas</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
              <span className="font-medium text-foreground text-base">
                {companies.length} {companies.length === 1 ? "empresa" : "empresas"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {companies.map((company) => (
                <Card
                  key={company.id}
                  className="border-border/40 bg-card/70 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base font-semibold text-foreground leading-tight truncate">
                            {company.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            RUC: {company.ruc}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs border-border/50 text-muted-foreground">
                        {company.currency}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{company.industry}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-background/60 border border-border/30">
                        <p className="text-lg font-bold text-foreground">{company.stats.users}</p>
                        <p className="text-xs text-muted-foreground">Usuarios</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-background/60 border border-border/30">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          <p className="text-lg font-bold text-foreground">{company.stats.employees}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Empleados</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-background/60 border border-border/30">
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <p className="text-lg font-bold text-foreground">{company.stats.invoices}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Facturas</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {company.activeModules.slice(0, 3).map((mod) => (
                        <Badge key={mod} variant="secondary" className="text-xs px-2 py-0 font-normal">
                          {mod}
                        </Badge>
                      ))}
                      {company.activeModules.length > 3 && (
                        <Badge variant="secondary" className="text-xs px-2 py-0 font-normal">
                          +{company.activeModules.length - 3}
                        </Badge>
                      )}
                    </div>

                    <Button
                      className="w-full gap-2 group-hover:shadow-primary/20 group-hover:shadow-md transition-all"
                      size="sm"
                      onClick={() => handleManage(company)}
                    >
                      Gestionar empresa
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
