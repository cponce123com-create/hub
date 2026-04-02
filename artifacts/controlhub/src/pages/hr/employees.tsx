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
import { Plus, Search, Trash2, Eye, Users } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border-green-500/20",
  inactive: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  on_leave: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  suspended: "bg-red-500/15 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  on_leave: "De licencia",
  suspended: "Suspendido",
};

const contractLabels: Record<string, string> = {
  indefinite: "Indefinido",
  fixed_term: "Plazo fijo",
  part_time: "Part time",
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
    status: statusFilter !== "all" ? statusFilter : undefined,
    area: areaFilter !== "all" ? areaFilter : undefined,
    search: search || undefined,
  });

  const areas = [...new Set(employees?.map(e => e.area) ?? [])].filter(Boolean);

  const createMutation = useCreateEmployee({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEmployeesQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Empleado registrado" });
      },
    },
  });

  const deleteMutation = useDeleteEmployee({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEmployeesQueryKey(companyId) });
        setDeleteId(null);
        toast({ title: "Empleado eliminado" });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.documentId || !form.position || !form.area) {
      toast({ title: "Completa los campos requeridos", variant: "destructive" });
      return;
    }
    createMutation.mutate({ companyId, data: { ...form, email: form.email || undefined, phone: form.phone || undefined, site: form.site || undefined } });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Empleados</h1>
            <p className="text-muted-foreground text-sm mt-1">Directorio y gestion del personal</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setShowCreate(true); }} data-testid="button-create-employee">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Empleado
          </Button>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar empleados..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-employees" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-employee-status">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
              <SelectItem value="on_leave">De licencia</SelectItem>
              <SelectItem value="suspended">Suspendido</SelectItem>
            </SelectContent>
          </Select>
          {areas.length > 0 && (
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-40" data-testid="select-employee-area">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las areas</SelectItem>
                {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </div>
        ) : !employees?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No hay empleados registrados</p>
            <p className="text-sm mt-1">Agrega el primer empleado para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map(emp => (
              <div key={emp.id} className="rounded-lg border border-border/60 bg-card/50 p-4 flex items-start gap-3 hover:border-primary/30 transition-colors group" data-testid={`card-employee-${emp.id}`}>
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{emp.firstName} {emp.lastName}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${statusColors[emp.status] ?? ""}`}>
                      {statusLabels[emp.status] ?? emp.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{emp.position}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded">{emp.area}</span>
                    <span className="text-xs text-muted-foreground">{contractLabels[emp.contractType] ?? emp.contractType}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/hr/employees/${emp.id}`}>
                    <Button size="icon" variant="ghost" className="h-7 w-7" data-testid={`button-view-employee-${emp.id}`}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(emp.id)} data-testid={`button-delete-employee-${emp.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Empleado</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <Label>Nombres *</Label>
                <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} data-testid="input-employee-first-name" />
              </div>
              <div>
                <Label>Apellidos *</Label>
                <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} data-testid="input-employee-last-name" />
              </div>
              <div>
                <Label>DNI / Documento *</Label>
                <Input value={form.documentId} onChange={e => setForm(f => ({ ...f, documentId: e.target.value }))} data-testid="input-employee-document" />
              </div>
              <div>
                <Label>Cargo *</Label>
                <Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} data-testid="input-employee-position" />
              </div>
              <div>
                <Label>Area *</Label>
                <Input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="Operaciones, RRHH..." data-testid="input-employee-area" />
              </div>
              <div>
                <Label>Sede</Label>
                <Input value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))} data-testid="input-employee-site" />
              </div>
              <div>
                <Label>Tipo Contrato</Label>
                <Select value={form.contractType} onValueChange={v => setForm(f => ({ ...f, contractType: v }))}>
                  <SelectTrigger data-testid="select-employee-contract"><SelectValue /></SelectTrigger>
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
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-employee-status-form"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="on_leave">De licencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha Ingreso</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} data-testid="input-employee-start-date" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} data-testid="input-employee-email" />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} data-testid="input-employee-phone" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-employee">
                Registrar empleado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar empleado</AlertDialogTitle>
              <AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, employeeId: deleteId })} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
