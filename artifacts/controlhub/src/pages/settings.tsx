import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useCompany } from "@/context/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Shield, Bell, User, Key, ChevronRight, Check, Command, Briefcase } from "lucide-react";

const modules = [
  { key: "finance", label: "Finanzas", description: "Gestión de facturas, proveedores y cuentas por pagar.", active: true },
  { key: "hr", label: "Recursos Humanos", description: "Directorio corporativo y expedientes digitales del personal.", active: true },
  { key: "attendance", label: "Control de Asistencia", description: "Tareo diario y monitoreo de la jornada laboral.", active: true },
  { key: "documents", label: "Gestión Documental", description: "Repositorio centralizado de archivos de la empresa.", active: true },
  { key: "announcements", label: "Comunicaciones", description: "Boletín informativo y notificaciones corporativas.", active: true },
  { key: "reports", label: "Inteligencia de Negocio", description: "Métricas clave y análisis visual del rendimiento.", active: true },
];

const roles = [
  { name: "Super Administrador", description: "Control total. Acceso a todos los módulos, configuración del sistema y gestión de roles.", color: "bg-red-500/15 text-red-500 border-red-500/20" },
  { name: "Director / Gerente", description: "Visión global. Acceso a reportes ejecutivos e indicadores clave de todas las áreas.", color: "bg-orange-500/15 text-orange-500 border-orange-500/20" },
  { name: "Analista RRHH", description: "Gestión del talento. Control sobre empleados, asistencia y repositorio documental HR.", color: "bg-blue-500/15 text-blue-500 border-blue-500/20" },
  { name: "Analista Financiero", description: "Control de caja. Acceso a facturación, proveedores y reportes económicos.", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" },
  { name: "Colaborador", description: "Acceso básico. Solo visualización de comunicados, su expediente y documentos propios.", color: "bg-muted text-muted-foreground border-border" },
];

export default function Settings() {
  const { user, company } = useCompany();
  const { toast } = useToast();

  const [companyForm, setCompanyForm] = useState({
    name: company?.name ?? "",
    ruc: company?.ruc ?? "",
    industry: company?.industry ?? "",
    address: company?.address ?? "",
    city: (company as unknown as Record<string, string>)?.city ?? "Lima",
    country: (company as unknown as Record<string, string>)?.country ?? "Peru",
  });

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });

  const handleSaveCompany = () => {
    toast({ title: "Datos empresariales actualizados", description: "La configuración de la empresa ha sido guardada." });
  };

  const handleSaveProfile = () => {
    toast({ title: "Perfil actualizado", description: "Tus datos personales han sido modificados." });
  };

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.next) {
      toast({ title: "Validación requerida", description: "Debes completar todos los campos de contraseña.", variant: "destructive" });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast({ title: "Validación fallida", description: "Las contraseñas nuevas no coinciden.", variant: "destructive" });
      return;
    }
    toast({ title: "Seguridad actualizada", description: "Tu contraseña ha sido cambiada exitosamente." });
    setPasswordForm({ current: "", next: "", confirm: "" });
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Command className="w-8 h-8 text-primary" />
            Configuración del Sistema
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Administra las preferencias de la empresa, tu perfil de usuario y la seguridad de la plataforma.</p>
        </div>

        <Tabs defaultValue="company" className="w-full" data-testid="settings-tabs">
          <TabsList className="bg-card border border-border/40 h-14 p-1 w-full justify-start rounded-xl overflow-x-auto overflow-y-hidden shadow-sm">
            <TabsTrigger value="company" className="rounded-lg h-11 px-6 text-base font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none" data-testid="tab-settings-company">
              <Building2 className="w-4 h-4 mr-2" /> Datos de Empresa
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg h-11 px-6 text-base font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none" data-testid="tab-settings-profile">
              <User className="w-4 h-4 mr-2" /> Cuenta de Usuario
            </TabsTrigger>
            <TabsTrigger value="modules" className="rounded-lg h-11 px-6 text-base font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none" data-testid="tab-settings-modules">
              <Briefcase className="w-4 h-4 mr-2" /> Ecosistema
            </TabsTrigger>
            <TabsTrigger value="roles" className="rounded-lg h-11 px-6 text-base font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none" data-testid="tab-settings-roles">
              <Shield className="w-4 h-4 mr-2" /> Control de Accesos
            </TabsTrigger>
          </TabsList>

          {/* Company tab */}
          <TabsContent value="company" className="mt-6">
            <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 bg-muted/10 border-b border-border/40 flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                  <Building2 className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-2xl tracking-tight">{company?.name ?? "Mi empresa"}</p>
                  <p className="text-base text-primary font-medium mt-1">Tenant ID: {company?.id ? String(company.id).padStart(4, '0') : "0001"}</p>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <Label className="text-foreground/80 font-medium">Razón Social</Label>
                  <Input value={companyForm.name} onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5 h-11 text-base bg-background/50" data-testid="input-company-name" />
                </div>
                <div>
                  <Label className="text-foreground/80 font-medium">RUC</Label>
                  <Input value={companyForm.ruc} onChange={e => setCompanyForm(f => ({ ...f, ruc: e.target.value }))} placeholder="20000000000" className="mt-1.5 h-11 font-mono text-base bg-background/50" data-testid="input-company-ruc" />
                </div>
                <div>
                  <Label className="text-foreground/80 font-medium">Sector Industrial</Label>
                  <Select value={companyForm.industry} onValueChange={v => setCompanyForm(f => ({ ...f, industry: v }))}>
                    <SelectTrigger className="mt-1.5 h-11 text-base bg-background/50" data-testid="select-company-industry"><SelectValue placeholder="Seleccionar sector" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mining">Minería y Extracción</SelectItem>
                      <SelectItem value="construction">Construcción y Obras</SelectItem>
                      <SelectItem value="retail">Comercio Minorista</SelectItem>
                      <SelectItem value="manufacturing">Manufactura</SelectItem>
                      <SelectItem value="services">Servicios Corporativos</SelectItem>
                      <SelectItem value="agro">Agroindustria</SelectItem>
                      <SelectItem value="logistics">Logística y Transporte</SelectItem>
                      <SelectItem value="technology">Tecnología de Información</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 pt-2 pb-1 border-b border-border/40 mb-2">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Localización Principal</h4>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-foreground/80 font-medium">Dirección Fiscal</Label>
                  <Input value={companyForm.address} onChange={e => setCompanyForm(f => ({ ...f, address: e.target.value }))} className="mt-1.5 h-11 text-base bg-background/50" data-testid="input-company-address" />
                </div>
                <div>
                  <Label className="text-foreground/80 font-medium">Ciudad / Departamento</Label>
                  <Input value={companyForm.city} onChange={e => setCompanyForm(f => ({ ...f, city: e.target.value }))} className="mt-1.5 h-11 text-base bg-background/50" data-testid="input-company-city" />
                </div>
                <div>
                  <Label className="text-foreground/80 font-medium">País</Label>
                  <Input value={companyForm.country} onChange={e => setCompanyForm(f => ({ ...f, country: e.target.value }))} disabled className="mt-1.5 h-11 text-base bg-muted/50 text-muted-foreground" data-testid="input-company-country" />
                </div>
              </div>
              <div className="p-6 md:p-8 pt-0 flex justify-end">
                <Button onClick={handleSaveCompany} size="lg" className="shadow-lg shadow-primary/20 text-base" data-testid="button-save-company">Guardar Configuración Empresarial</Button>
              </div>
            </div>
          </TabsContent>

          {/* Profile tab */}
          <TabsContent value="profile" className="mt-6 space-y-6">
            <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 bg-muted/10 border-b border-border/40 flex items-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                    {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "US"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-2xl tracking-tight">{user?.name}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-primary/15 text-primary border-primary/20 uppercase tracking-widest shadow-sm">
                      Perfil: {user?.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <Label className="text-foreground/80 font-medium">Nombre de Empleado</Label>
                  <Input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5 h-11 text-base bg-background/50" data-testid="input-profile-name" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-foreground/80 font-medium">Correo Electrónico Corporativo</Label>
                  <Input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} className="mt-1.5 h-11 text-base bg-background/50" data-testid="input-profile-email" />
                </div>
              </div>
              <div className="p-6 md:p-8 pt-0 flex justify-end">
                <Button onClick={handleSaveProfile} size="lg" className="shadow-lg shadow-primary/20 text-base" data-testid="button-save-profile">Actualizar Mi Cuenta</Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Key className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Seguridad de Acceso</h3>
                  <p className="text-sm text-muted-foreground">Actualiza tu contraseña regularmente para mantener la cuenta segura.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <Label className="text-foreground/80 font-medium">Contraseña Actual</Label>
                  <Input type="password" value={passwordForm.current} onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))} className="mt-1.5 h-11 bg-background/50" data-testid="input-current-password" />
                </div>
                <div>
                  <Label className="text-foreground/80 font-medium">Nueva Contraseña</Label>
                  <Input type="password" value={passwordForm.next} onChange={e => setPasswordForm(f => ({ ...f, next: e.target.value }))} className="mt-1.5 h-11 bg-background/50" data-testid="input-new-password" />
                </div>
                <div>
                  <Label className="text-foreground/80 font-medium">Verificar Nueva Contraseña</Label>
                  <Input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} className="mt-1.5 h-11 bg-background/50" data-testid="input-confirm-password" />
                </div>
              </div>
              <div className="flex justify-end mt-8">
                <Button onClick={handleChangePassword} variant="outline" size="lg" className="border-border/60 hover:bg-muted text-base" data-testid="button-change-password">Modificar Contraseña</Button>
              </div>
            </div>
          </TabsContent>

          {/* Modules tab */}
          <TabsContent value="modules" className="mt-6">
            <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 bg-muted/10 border-b border-border/40">
                <h3 className="font-bold text-2xl tracking-tight">Catálogo de Módulos</h3>
                <p className="text-base text-muted-foreground mt-2">Habilita las herramientas operativas que requiere tu empresa.</p>
              </div>
              <div className="divide-y divide-border/40">
                {modules.map(mod => (
                  <div key={mod.key} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                    <div>
                      <p className="font-bold text-lg">{mod.label}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{mod.description}</p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider shadow-sm ${mod.active ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                        {mod.active && <Check className="w-3.5 h-3.5" />}
                        {mod.active ? "Instalado" : "No Disponible"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Roles tab */}
          <TabsContent value="roles" className="mt-6">
            <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 bg-muted/10 border-b border-border/40">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-2xl tracking-tight">Arquitectura de Permisos</h3>
                </div>
                <p className="text-base text-muted-foreground mt-2">Jerarquía de acceso del sistema. Los roles se asignan a cada empleado desde el directorio corporativo.</p>
              </div>
              <div className="divide-y divide-border/40">
                {roles.map(role => (
                  <div key={role.name} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors group cursor-default">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 w-full">
                      <div className="shrink-0 w-48">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${role.color}`}>
                          {role.name}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{role.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hidden sm:block" />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
