import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout";
import { useCompany } from "@/context/CompanyContext";
import {
  useGetEmployee,
  getGetEmployeeQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, Users, Clock } from "lucide-react";

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

export default function EmployeeDetail() {
  const params = useParams<{ id: string }>();
  const employeeId = parseInt(params.id ?? "0");
  const { companyId } = useCompany();

  const { data: employee, isLoading } = useGetEmployee(companyId, employeeId, {
    query: { enabled: !!employeeId, queryKey: getGetEmployeeQueryKey(companyId, employeeId) },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4 max-w-4xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  if (!employee) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Empleado no encontrado</p>
          <Link href="/hr/employees">
            <Button variant="outline" className="mt-4">Volver al directorio</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Link href="/hr/employees">
            <Button variant="ghost" size="sm" data-testid="button-back-employees">
              <ArrowLeft className="w-4 h-4 mr-2" /> Empleados
            </Button>
          </Link>
        </div>

        {/* Header card */}
        <div className="rounded-lg border border-border/60 bg-card/50 p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                {employee.firstName[0]}{employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold">{employee.firstName} {employee.lastName}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusColors[employee.status] ?? ""}`}>
                  {statusLabels[employee.status] ?? employee.status}
                </span>
              </div>
              <p className="text-muted-foreground mt-1">{employee.position} &middot; {employee.area}</p>
              <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-muted-foreground">
                {employee.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{employee.email}</span>}
                {employee.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{employee.phone}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Ingreso: {employee.startDate}</span>
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/40">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{employee.attendanceSummary?.presentDays ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Dias presentes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{employee.attendanceSummary?.absentDays ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Ausencias</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{employee.attendanceSummary?.lateDays ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Tardanzas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{Number(employee.attendanceSummary?.hoursWorked ?? 0).toFixed(0)}h</p>
              <p className="text-xs text-muted-foreground mt-1">Horas trabajadas</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="info">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="info" data-testid="tab-employee-info">Informacion</TabsTrigger>
            <TabsTrigger value="announcements" data-testid="tab-employee-announcements">Comunicados</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-employee-documents">
              Documentos ({employee.documentCount ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="rounded-lg border border-border/60 bg-card/50 p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Datos personales</p>
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Documento</dt>
                    <dd className="font-mono">{employee.documentId}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Tipo contrato</dt>
                    <dd>{employee.contractType}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Sede</dt>
                    <dd>{employee.site ?? "-"}</dd>
                  </div>
                  {employee.address && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Direccion</dt>
                      <dd className="text-right max-w-48">{employee.address}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Contacto emergencia</p>
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Nombre</dt>
                    <dd>{employee.emergencyContact ?? "-"}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Telefono</dt>
                    <dd>{employee.emergencyPhone ?? "-"}</dd>
                  </div>
                </dl>
                {employee.notes && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Notas</p>
                    <p className="text-sm text-muted-foreground">{employee.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="mt-4">
            <div className="space-y-3">
              {!employee.recentAnnouncements?.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No hay comunicados recientes</div>
              ) : (
                employee.recentAnnouncements.map((ann: { id: number; title: string; content: string; priority: string; createdAt: string }) => (
                  <div key={ann.id} className="rounded-lg border border-border/60 bg-card/50 p-4">
                    <p className="font-medium text-sm">{ann.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(ann.createdAt).toLocaleDateString("es-PE")}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <div className="text-center py-8 text-muted-foreground text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>{employee.documentCount ?? 0} documentos en el legajo digital</p>
              <Link href="/documents">
                <Button variant="outline" size="sm" className="mt-3" data-testid="link-to-documents">Ver documentos</Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
