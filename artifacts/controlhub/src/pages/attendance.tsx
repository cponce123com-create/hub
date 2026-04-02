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
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
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

const statusColors: Record<string, string> = {
  present: "bg-green-500/15 text-green-400 border-green-500/20",
  absent: "bg-red-500/15 text-red-400 border-red-500/20",
  late: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  on_leave: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  vacation: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  sick_leave: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  justified_absence: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  unjustified_absence: "bg-red-700/15 text-red-500 border-red-700/20",
};

const statusLabels: Record<string, string> = {
  present: "Presente",
  absent: "Ausente",
  late: "Tardanza",
  on_leave: "Permiso",
  vacation: "Vacaciones",
  sick_leave: "Enfermedad",
  justified_absence: "Falta justificada",
  unjustified_absence: "Falta injustificada",
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
  });

  const { data: employees } = useListEmployees(companyId);
  const areas = [...new Set(employees?.map(e => e.area) ?? [])].filter(Boolean);

  const createMutation = useCreateAttendance({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAttendanceQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Asistencia registrada" });
      },
    },
  });

  const updateMutation = useUpdateAttendance({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAttendanceQueryKey(companyId) });
        setEditId(null);
        toast({ title: "Registro actualizado" });
      },
    },
  });

  const deleteMutation = useDeleteAttendance({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAttendanceQueryKey(companyId) });
        setDeleteId(null);
        toast({ title: "Registro eliminado" });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.employeeId && !editId) {
      toast({ title: "Selecciona un empleado", variant: "destructive" });
      return;
    }
    const data = {
      employeeId: parseInt(form.employeeId),
      date: form.date,
      checkIn: form.checkIn || undefined,
      checkOut: form.checkOut || undefined,
      status: form.status,
      notes: form.notes || undefined,
    };
    if (editId) {
      updateMutation.mutate({ companyId, attendanceId: editId, data: { checkIn: form.checkIn, checkOut: form.checkOut, status: form.status, notes: form.notes } });
    } else {
      createMutation.mutate({ companyId, data });
    }
  };

  const openEdit = (r: typeof records extends Array<infer T> ? T : never) => {
    setForm({ employeeId: String(r.employeeId), date: r.date, checkIn: r.checkIn ?? "", checkOut: r.checkOut ?? "", status: r.status, notes: r.notes ?? "" });
    setEditId(r.id);
  };

  const presentCount = records?.filter(r => r.status === "present").length ?? 0;
  const absentCount = records?.filter(r => r.status === "absent" || r.status === "unjustified_absence").length ?? 0;
  const lateCount = records?.filter(r => r.status === "late").length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tareo y Asistencia</h1>
            <p className="text-muted-foreground text-sm mt-1">Control diario de asistencia del personal</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setShowCreate(true); }} data-testid="button-create-attendance">
            <Plus className="w-4 h-4 mr-2" /> Registrar
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border/60 bg-card/50 p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{presentCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Presentes</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/50 p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{absentCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Ausentes</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/50 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{lateCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Tardanzas</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" data-testid="input-date-filter" />
          </div>
          {areas.length > 0 && (
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-40" data-testid="select-area-filter">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las areas</SelectItem>
                {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Empleado</TableHead>
                <TableHead className="text-muted-foreground font-medium">Area</TableHead>
                <TableHead className="text-muted-foreground font-medium">Fecha</TableHead>
                <TableHead className="text-muted-foreground font-medium">Entrada</TableHead>
                <TableHead className="text-muted-foreground font-medium">Salida</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Horas</TableHead>
                <TableHead className="text-muted-foreground font-medium">Estado</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/60">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !records?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No hay registros para esta fecha</p>
                  </TableCell>
                </TableRow>
              ) : (
                records.map(r => (
                  <TableRow key={r.id} className="border-border/60" data-testid={`row-attendance-${r.id}`}>
                    <TableCell className="font-medium">{r.employeeName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.area}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.date}</TableCell>
                    <TableCell className="font-mono text-sm">{r.checkIn ?? "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{r.checkOut ?? "-"}</TableCell>
                    <TableCell className="text-right font-semibold">{r.hoursWorked ? `${Number(r.hoursWorked).toFixed(1)}h` : "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusColors[r.status] ?? ""}`}>
                        {statusLabels[r.status] ?? r.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)} data-testid={`button-edit-att-${r.id}`}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)} data-testid={`button-delete-att-${r.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={showCreate || !!editId} onOpenChange={open => { if (!open) { setShowCreate(false); setEditId(null); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar registro" : "Registrar asistencia"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              {!editId && (
                <div className="col-span-2">
                  <Label>Empleado *</Label>
                  <Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v }))}>
                    <SelectTrigger data-testid="select-att-employee"><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
                    <SelectContent>
                      {employees?.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} data-testid="input-att-date" />
              </div>
              <div>
                <Label>Estado *</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-att-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Presente</SelectItem>
                    <SelectItem value="absent">Ausente</SelectItem>
                    <SelectItem value="late">Tardanza</SelectItem>
                    <SelectItem value="on_leave">Permiso</SelectItem>
                    <SelectItem value="vacation">Vacaciones</SelectItem>
                    <SelectItem value="sick_leave">Enfermedad</SelectItem>
                    <SelectItem value="justified_absence">Falta justificada</SelectItem>
                    <SelectItem value="unjustified_absence">Falta injustificada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora entrada</Label>
                <Input type="time" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} data-testid="input-att-check-in" />
              </div>
              <div>
                <Label>Hora salida</Label>
                <Input type="time" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} data-testid="input-att-check-out" />
              </div>
              <div className="col-span-2">
                <Label>Observaciones</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} data-testid="textarea-att-notes" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditId(null); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-attendance">
                {editId ? "Guardar" : "Registrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar registro</AlertDialogTitle>
              <AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, attendanceId: deleteId })} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
