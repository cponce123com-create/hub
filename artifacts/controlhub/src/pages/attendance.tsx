import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useCompany } from "@/context/CompanyContext";
import {
  useListAttendance,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
  useListEmployees,
  getListAttendanceQueryKey,
  getListEmployeesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Calendar, Clock, UserCheck, UserX, AlertCircle, MoreHorizontal } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusColors: Record<string, string> = {
  present: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  absent: "bg-destructive/15 text-destructive border-destructive/20",
  late: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20",
  on_leave: "bg-blue-500/15 text-blue-500 border-blue-500/20",
  vacation: "bg-purple-500/15 text-purple-500 border-purple-500/20",
  sick_leave: "bg-orange-500/15 text-orange-500 border-orange-500/20",
  justified_absence: "bg-cyan-500/15 text-cyan-500 border-cyan-500/20",
  unjustified_absence: "bg-red-700/15 text-red-600 border-red-700/20",
};

const statusLabels: Record<string, string> = {
  present: "Presente",
  absent: "Ausente",
  late: "Tardanza",
  on_leave: "Permiso",
  vacation: "Vacaciones",
  sick_leave: "Enfermedad",
  justified_absence: "Falta Justificada",
  unjustified_absence: "Falta Injustificada",
};

interface AttForm {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  notes: string;
}

const emptyForm: AttForm = {
  employeeId: "", date: new Date().toISOString().split("T")[0],
  checkIn: "08:00", checkOut: "17:00", status: "present", notes: "",
};

export default function Attendance() {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [dateFilter, setDateFilter] = useState(today);
  const [areaFilter, setAreaFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<AttForm>(emptyForm);

  const { data: records, isLoading } = useListAttendance(companyId, {
    startDate: dateFilter || undefined,
    endDate: dateFilter || undefined,
    area: areaFilter !== "all" ? areaFilter : undefined,
  }, {
    query: { enabled: !!companyId, queryKey: getListAttendanceQueryKey(companyId) },
  });

  const { data: employees } = useListEmployees(companyId, undefined, { query: { enabled: !!companyId, queryKey: getListEmployeesQueryKey(companyId) } });
  const areas = [...new Set(employees?.map(e => e.area) ?? [])].filter(Boolean);

  const createMutation = useCreateAttendance({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAttendanceQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Asistencia registrada", description: "El registro ha sido guardado exitosamente." });
      },
    },
  });

  const updateMutation = useUpdateAttendance({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAttendanceQueryKey(companyId) });
        setEditId(null);
        toast({ title: "Registro actualizado", description: "Los cambios han sido guardados." });
      },
    },
  });

  const deleteMutation = useDeleteAttendance({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAttendanceQueryKey(companyId) });
        setDeleteId(null);
        toast({ title: "Registro eliminado", description: "La asistencia ha sido borrada." });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.employeeId && !editId) {
      toast({ title: "Falta información", description: "Selecciona un empleado para registrar la asistencia.", variant: "destructive" });
      return;
    }
    const data = {
      employeeId: parseInt(form.employeeId),
      date: form.date,
      checkIn: form.checkIn || undefined,
      checkOut: form.checkOut || undefined,
      status: form.status as any,
      notes: form.notes || undefined,
    };
    if (editId) {
      updateMutation.mutate({ companyId, attendanceId: editId, data: { checkIn: form.checkIn, checkOut: form.checkOut, status: form.status as any, notes: form.notes } });
    } else {
      createMutation.mutate({ companyId, data });
    }
  };

  const openEdit = (r: NonNullable<typeof records>[number]) => {
    setForm({ employeeId: String(r.employeeId), date: r.date, checkIn: r.checkIn ?? "", checkOut: r.checkOut ?? "", status: r.status, notes: r.notes ?? "" });
    setEditId(r.id);
  };

  const presentCount = records?.filter(r => r.status === "present").length ?? 0;
  const absentCount = records?.filter(r => r.status === "absent" || r.status === "unjustified_absence").length ?? 0;
  const lateCount = records?.filter(r => r.status === "late").length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Control de Asistencia</h1>
            <p className="text-muted-foreground mt-1 text-base">Tareo diario y monitoreo de la jornada laboral.</p>
          </div>
          <Button onClick={() => { setForm({ ...emptyForm, date: dateFilter }); setEditId(null); setShowCreate(true); }} className="shadow-lg shadow-primary/20" data-testid="button-create-attendance">
            <Plus className="w-5 h-5 mr-2" /> Registrar Asistencia
          </Button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/40 bg-card p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Presentes</p>
              <p className="text-3xl font-bold text-emerald-500">{presentCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Ausencias</p>
              <p className="text-3xl font-bold text-destructive">{absentCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <UserX className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Tardanzas</p>
              <p className="text-3xl font-bold text-yellow-500">{lateCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border/40 shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full sm:w-48 h-10 bg-muted/50 border-border/50" data-testid="input-date-filter" />
          </div>
          {areas.length > 0 && (
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-10 bg-muted/50 border-border/50" data-testid="select-area-filter">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent bg-muted/20">
                  <TableHead className="font-semibold text-muted-foreground h-12">Empleado</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Área</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Fecha</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Entrada</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Salida</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Horas</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Estado</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j} className="py-4"><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !records?.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Calendar className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium text-foreground">No hay registros de asistencia</p>
                        <p className="text-sm mt-1">No se encontró información para la fecha seleccionada.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map(r => (
                    <TableRow key={r.id} className="border-border/40 hover:bg-muted/30 transition-colors group" data-testid={`row-attendance-${r.id}`}>
                      <TableCell className="font-medium text-foreground">{r.employeeName}</TableCell>
                      <TableCell>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-secondary text-secondary-foreground">{r.area}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.date}</TableCell>
                      <TableCell className="font-mono text-sm font-medium">{r.checkIn || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="font-mono text-sm font-medium">{r.checkOut || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="font-semibold text-primary">{r.hoursWorked ? `${Number(r.hoursWorked).toFixed(1)}h` : "-"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[r.status] ?? ""}`}>
                          {statusLabels[r.status] ?? r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => openEdit(r)} className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteId(r.id)} className="cursor-pointer text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={showCreate || !!editId} onOpenChange={open => { if (!open) { setShowCreate(false); setEditId(null); } }}>
          <DialogContent className="sm:max-w-md bg-card border-border/40 shadow-2xl">
            <DialogHeader className="border-b border-border/40 pb-4">
              <DialogTitle className="text-xl">{editId ? "Editar Registro" : "Registrar Asistencia"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 py-4">
              {!editId && (
                <div className="col-span-2">
                  <Label className="text-foreground/80 font-medium">Empleado *</Label>
                  <Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v }))}>
                    <SelectTrigger className="mt-1.5 h-10" data-testid="select-att-employee"><SelectValue placeholder="Seleccionar colaborador" /></SelectTrigger>
                    <SelectContent>
                      {employees?.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-foreground/80 font-medium">Fecha *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mt-1.5 h-10" data-testid="input-att-date" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Estado *</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1.5 h-10" data-testid="select-att-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Presente</SelectItem>
                    <SelectItem value="absent">Ausente</SelectItem>
                    <SelectItem value="late">Tardanza</SelectItem>
                    <SelectItem value="on_leave">Permiso</SelectItem>
                    <SelectItem value="vacation">Vacaciones</SelectItem>
                    <SelectItem value="sick_leave">Enfermedad</SelectItem>
                    <SelectItem value="justified_absence">Falta Justificada</SelectItem>
                    <SelectItem value="unjustified_absence">Falta Injustificada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Hora de Ingreso</Label>
                <Input type="time" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} className="mt-1.5 h-10 font-mono" data-testid="input-att-check-in" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Hora de Salida</Label>
                <Input type="time" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} className="mt-1.5 h-10 font-mono" data-testid="input-att-check-out" />
              </div>
              <div className="col-span-2">
                <Label className="text-foreground/80 font-medium">Observaciones (Opcional)</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="mt-1.5 resize-none bg-muted/30" placeholder="Motivos de tardanza, ausencia, etc." data-testid="textarea-att-notes" />
              </div>
            </div>
            <DialogFooter className="border-t border-border/40 pt-4">
              <Button variant="ghost" onClick={() => { setShowCreate(false); setEditId(null); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="shadow-lg shadow-primary/20" data-testid="button-submit-attendance">
                {editId ? "Guardar Cambios" : "Confirmar Registro"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent className="bg-card border-border/40">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">¿Eliminar registro?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Esta acción eliminará el registro de asistencia y afectará las horas contabilizadas del empleado para esta fecha.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, attendanceId: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
