import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout";
import { useCompany } from "@/context/CompanyContext";
import {
  useListEmployees,
  useCreateEmployee,
  useDeleteEmployee,
  getListEmployeesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Eye, Users, Briefcase, MapPin, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border-green-500/20",
  inactive: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  on_leave: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  suspended: "bg-red-500/15 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  on_leave: "Licencia",
  suspended: "Suspendido",
};

const contractLabels: Record<string, string> = {
  indefinite: "Indefinido",
  fixed_term: "Plazo Fijo",
  part_time: "Part Time",
  intern: "Practicante",
  contractor: "Contratista",
};

interface EmployeeForm {
  firstName: string;
  lastName: string;
  documentId: string;
  position: string;
  area: string;
  site: string;
  contractType: string;
  status: string;
  startDate: string;
  email: string;
  phone: string;
}

const emptyForm: EmployeeForm = {
  firstName: "", lastName: "", documentId: "", position: "", area: "", site: "",
  contractType: "indefinite", status: "active", startDate: new Date().toISOString().split("T")[0],
  email: "", phone: "",
};

export default function Employees() {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);

  const { data: employees, isLoading } = useListEmployees(companyId, {
    query: { enabled: !!companyId, queryKey: getListEmployeesQueryKey(companyId) }
  });

  const areas = [...new Set(employees?.map(e => e.area) ?? [])].filter(Boolean);

  const filteredEmployees = employees?.filter(emp => {
    const matchStatus = statusFilter === "all" || emp.status === statusFilter;
    const matchArea = areaFilter === "all" || emp.area === areaFilter;
    const matchSearch = search ? 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) || 
      emp.documentId.includes(search) || 
      emp.position.toLowerCase().includes(search.toLowerCase()) 
      : true;
    return matchStatus && matchArea && matchSearch;
  });

  const createMutation = useCreateEmployee({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEmployeesQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Empleado registrado", description: "El legajo ha sido creado en el sistema." });
      },
    },
  });

  const deleteMutation = useDeleteEmployee({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEmployeesQueryKey(companyId) });
        setDeleteId(null);
        toast({ title: "Empleado eliminado", description: "Se ha removido el acceso y el registro." });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.documentId || !form.position || !form.area) {
      toast({ title: "Faltan datos requeridos", description: "Por favor, completa los campos con asterisco.", variant: "destructive" });
      return;
    }
    createMutation.mutate({ 
      companyId, 
      data: { 
        ...form, 
        email: form.email || undefined, 
        phone: form.phone || undefined, 
        site: form.site || undefined,
        contractType: form.contractType as any,
        status: form.status as any
      } 
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Fuerza Laboral</h1>
            <p className="text-muted-foreground mt-1 text-base">Directorio corporativo y expedientes digitales del personal.</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="shadow-lg shadow-primary/20" data-testid="button-create-employee">
            <Plus className="w-5 h-5 mr-2" /> Registrar Empleado
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border/40 shadow-sm">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre, cargo o documento..." 
              className="pl-9 h-10 bg-muted/50 border-border/50" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              data-testid="input-search-employees" 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-muted/50 border-border/50" data-testid="select-employee-status">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
              <SelectItem value="on_leave">De licencia</SelectItem>
              <SelectItem value="suspended">Suspendidos</SelectItem>
            </SelectContent>
          </Select>
          {areas.length > 0 && (
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 bg-muted/50 border-border/50" data-testid="select-employee-area">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-border/40 bg-card">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        ) : !filteredEmployees?.length ? (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-card rounded-xl border border-border/40 h-64">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-foreground">No se encontraron empleados</p>
            <p className="text-sm text-muted-foreground mt-1">Ajusta tu búsqueda o agrega personal a la base de datos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEmployees.map(emp => (
              <div key={emp.id} className="rounded-xl border border-border/40 bg-card hover:bg-card/80 transition-colors shadow-sm group flex flex-col relative" data-testid={`card-employee-${emp.id}`}>
                <div className="absolute top-3 right-3 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <Link href={`/hr/employees/${emp.id}`}>
                        <DropdownMenuItem className="cursor-pointer">
                          <Eye className="w-4 h-4 mr-2" /> Ver Expediente
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDeleteId(emp.id)} className="cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="p-5 flex-1 flex flex-col items-center text-center pt-8">
                  <Avatar className="h-16 w-16 shrink-0 border-2 border-background shadow-sm mb-3">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-base text-foreground leading-tight">{emp.firstName} {emp.lastName}</h3>
                  <p className="text-sm text-primary font-medium mt-1 mb-3">{emp.position}</p>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[emp.status] ?? ""}`}>
                    {statusLabels[emp.status] ?? emp.status}
                  </span>
                </div>
                
                <div className="border-t border-border/40 bg-muted/10 p-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Área</span>
                    <span className="font-medium text-foreground">{emp.area}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Sede</span>
                    <span className="font-medium text-foreground">{emp.site || "No asignada"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">Contrato</span>
                    <span className="font-medium text-foreground">{contractLabels[emp.contractType] ?? emp.contractType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-2xl bg-card border-border/40 shadow-2xl">
            <DialogHeader className="border-b border-border/40 pb-4">
              <DialogTitle className="text-xl">Alta de Nuevo Empleado</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="md:col-span-2 pt-1 pb-1">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-2">Datos Personales</h4>
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Nombres *</Label>
                <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="mt-1.5 h-10" data-testid="input-employee-first-name" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Apellidos *</Label>
                <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="mt-1.5 h-10" data-testid="input-employee-last-name" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">DNI / Pasaporte *</Label>
                <Input value={form.documentId} onChange={e => setForm(f => ({ ...f, documentId: e.target.value }))} className="mt-1.5 h-10 font-mono" data-testid="input-employee-document" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Email Corporativo</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1.5 h-10" data-testid="input-employee-email" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Teléfono</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1.5 h-10" data-testid="input-employee-phone" />
              </div>
              
              <div className="md:col-span-2 pt-4 pb-1">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-2">Posición en la Empresa</h4>
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Cargo *</Label>
                <Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="mt-1.5 h-10" data-testid="input-employee-position" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Área / Departamento *</Label>
                <Input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="Ej. Operaciones, Finanzas" className="mt-1.5 h-10" data-testid="input-employee-area" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Sede de Trabajo</Label>
                <Input value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))} className="mt-1.5 h-10" data-testid="input-employee-site" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Fecha de Ingreso</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="mt-1.5 h-10" data-testid="input-employee-start-date" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Tipo de Contrato</Label>
                <Select value={form.contractType} onValueChange={v => setForm(f => ({ ...f, contractType: v }))}>
                  <SelectTrigger className="mt-1.5 h-10" data-testid="select-employee-contract"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indefinite">Indefinido</SelectItem>
                    <SelectItem value="fixed_term">Plazo fijo</SelectItem>
                    <SelectItem value="part_time">Part time</SelectItem>
                    <SelectItem value="intern">Practicante</SelectItem>
                    <SelectItem value="contractor">Contratista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Estado Inicial</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1.5 h-10" data-testid="select-employee-status-form"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="on_leave">De licencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="border-t border-border/40 pt-4">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="shadow-lg shadow-primary/20" data-testid="button-submit-employee">
                Crear Legajo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent className="bg-card border-border/40">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">¿Desvincular empleado?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Estás a punto de eliminar este expediente permanentemente del sistema. Las referencias a este empleado en asistencias o historial se mantendrán huérfanas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, employeeId: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20">
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
