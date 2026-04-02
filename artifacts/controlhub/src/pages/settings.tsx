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
import { Building2, Shield, Bell, User, Key, ChevronRight, Check } from "lucide-react";

const modules = [
  { key: "finance", label: "Finanzas", description: "Facturas, proveedores y cuentas por pagar", active: true },
  { key: "hr", label: "Recursos Humanos", description: "Directorio de empleados y contratos", active: true },
  { key: "attendance", label: "Asistencia / Tareo", description: "Control diario de asistencia", active: true },
  { key: "documents", label: "Documentos", description: "Repositorio documental centralizado", active: true },
  { key: "announcements", label: "Comunicados", description: "Muro de avisos internos", active: true },
  { key: "reports", label: "Reportes", description: "Metricas y analisis empresariales", active: true },
];

const roles = [
  { name: "Administrador", description: "Acceso total a todos los modulos y configuracion", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  { name: "Gerente", description: "Acceso a reportes y modulos de su area", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  { name: "RRHH", description: "Gestion de empleados, asistencia y documentos", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  { name: "Finanzas", description: "Acceso a facturas, proveedores y reportes financieros", color: "bg-green-500/15 text-green-400 border-green-500/20" },
  { name: "Empleado", description: "Solo visualizacion de comunicados y su perfil", color: "bg-gray-500/15 text-gray-400 border-gray-500/20" },
];

export default function Settings() {
  const { user, company } = useCompany();
  const { toast } = useToast();

  const [companyForm, setCompanyForm] = useState({
    name: company?.name ?? "",
    ruc: company?.ruc ?? "",
    industry: company?.industry ?? "",
    address: company?.address ?? "",
    city: company?.city ?? "Lima",
    country: company?.country ?? "Peru",
  });

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });

  const handleSaveCompany = () => {
    toast({ title: "Configuracion guardada" });
  };

  const handleSaveProfile = () => {
    toast({ title: "Perfil actualizado" });
  };

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.next) {
      toast({ title: "Completa todos los campos", variant: "destructive" });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast({ title: "Las contrasenas no coinciden", variant: "destructive" });
      return;
    }
    toast({ title: "Contrasena actualizada" });
    setPasswordForm({ current: "", next: "", confirm: "" });
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
          <p className="text-muted-foreground text-sm mt-1">Ajusta la empresa, tu perfil y los permisos del sistema</p>
        </div>

        <Tabs defaultValue="company" data-testid="settings-tabs">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="company" data-testid="tab-settings-company">Empresa</TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-settings-profile">Mi perfil</TabsTrigger>
            <TabsTrigger value="modules" data-testid="tab-settings-modules">Modulos</TabsTrigger>
            <TabsTrigger value="roles" data-testid="tab-settings-roles">Roles</TabsTrigger>
          </TabsList>

          {/* Company tab */}
          <TabsContent value="company" className="mt-4">
            <div className="rounded-lg border border-border/60 bg-card/50 p-6 space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-border/40">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{company?.name ?? "Mi empresa"}</p>
                  <p className="text-sm text-muted-foreground">Empresa #{company?.id ?? 1}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre de la empresa</Label>
                  <Input value={companyForm.name} onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} data-testid="input-company-name" />
                </div>
                <div>
                  <Label>RUC</Label>
                  <Input value={companyForm.ruc} onChange={e => setCompanyForm(f => ({ ...f, ruc: e.target.value }))} placeholder="20xxxxxxxxx" data-testid="input-company-ruc" />
                </div>
                <div>
                  <Label>Industria / Sector</Label>
                  <Select value={companyForm.industry} onValueChange={v => setCompanyForm(f => ({ ...f, industry: v }))}>
                    <SelectTrigger data-testid="select-company-industry"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mining">Mineria</SelectItem>
                      <SelectItem value="construction">Construccion</SelectItem>
                      <SelectItem value="retail">Comercio</SelectItem>
                      <SelectItem value="manufacturing">Manufactura</SelectItem>
                      <SelectItem value="services">Servicios</SelectItem>
                      <SelectItem value="agro">Agroexportacion</SelectItem>
                      <SelectItem value="logistics">Logistica</SelectItem>
                      <SelectItem value="technology">Tecnologia</SelectItem>
                      <SelectItem value="finance">Finanzas</SelectItem>
                      <SelectItem value="health">Salud</SelectItem>
                      <SelectItem value="education">Educacion</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ciudad</Label>
                  <Input value={companyForm.city} onChange={e => setCompanyForm(f => ({ ...f, city: e.target.value }))} data-testid="input-company-city" />
                </div>
                <div className="col-span-2">
                  <Label>Direccion fiscal</Label>
                  <Input value={companyForm.address} onChange={e => setCompanyForm(f => ({ ...f, address: e.target.value }))} data-testid="input-company-address" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveCompany} data-testid="button-save-company">Guardar cambios</Button>
              </div>
            </div>
          </TabsContent>

          {/* Profile tab */}
          <TabsContent value="profile" className="mt-4 space-y-4">
            <div className="rounded-lg border border-border/60 bg-card/50 p-6 space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-border/40">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                    {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{user?.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-primary/15 text-primary border-primary/20 uppercase tracking-wider`}>
                    {user?.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nombre completo</Label>
                  <Input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} data-testid="input-profile-name" />
                </div>
                <div className="col-span-2">
                  <Label>Email</Label>
                  <Input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} data-testid="input-profile-email" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} data-testid="button-save-profile">Actualizar perfil</Button>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/50 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Key className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Cambiar contrasena</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Contrasena actual</Label>
                  <Input type="password" value={passwordForm.current} onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))} data-testid="input-current-password" />
                </div>
                <div>
                  <Label>Nueva contrasena</Label>
                  <Input type="password" value={passwordForm.next} onChange={e => setPasswordForm(f => ({ ...f, next: e.target.value }))} data-testid="input-new-password" />
                </div>
                <div>
                  <Label>Confirmar contrasena</Label>
                  <Input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} data-testid="input-confirm-password" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} variant="outline" data-testid="button-change-password">Cambiar contrasena</Button>
              </div>
            </div>
          </TabsContent>

          {/* Modules tab */}
          <TabsContent value="modules" className="mt-4">
            <div className="rounded-lg border border-border/60 bg-card/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/40">
                <h3 className="font-semibold">Modulos del sistema</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Activa o desactiva funcionalidades segun las necesidades de tu empresa</p>
              </div>
              <div className="divide-y divide-border/40">
                {modules.map(mod => (
                  <div key={mod.key} className="px-5 py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{mod.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${mod.active ? "bg-green-500/15 text-green-400 border-green-500/20" : "bg-gray-500/15 text-gray-400 border-gray-500/20"}`}>
                        {mod.active && <Check className="w-3 h-3" />}
                        {mod.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Roles tab */}
          <TabsContent value="roles" className="mt-4">
            <div className="rounded-lg border border-border/60 bg-card/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Roles y permisos</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">Roles definidos del sistema para control de accesos</p>
              </div>
              <div className="divide-y divide-border/40">
                {roles.map(role => (
                  <div key={role.name} className="px-5 py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${role.color}`}>
                        {role.name}
                      </span>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
