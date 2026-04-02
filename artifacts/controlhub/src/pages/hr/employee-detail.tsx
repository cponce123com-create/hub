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
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, Users, Clock, Edit, FileDigit } from "lucide-react";

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
        <div className="space-y-6 max-w-5xl animate-in fade-in duration-500">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!employee) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Users className="w-16 h-16 opacity-20 mb-4" />
          <h2 className="text-xl font-bold mb-2">Expediente No Encontrado</h2>
          <p className="text-muted-foreground mb-6">El empleado que buscas no existe o ha sido eliminado.</p>
          <Link href="/hr/employees">
            <Button className="shadow-lg shadow-primary/20">Volver al Directorio</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl animate-in fade-in duration-500">
        <div>
          <Link href="/hr/employees" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4" data-testid="button-back-employees">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver al directorio
          </Link>
        </div>

        {/* Header Profile Card */}
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm relative">
          <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent absolute top-0 left-0 w-full opacity-50"></div>
          
          <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row gap-6 md:items-end">
            <Avatar className="h-28 w-28 shrink-0 border-4 border-card shadow-lg">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-3xl">
                {employee.firstName[0]}{employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{employee.firstName} {employee.lastName}</h1>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[employee.status] ?? ""}`}>
                      {statusLabels[employee.status] ?? employee.status}
                    </span>
                  </div>
                  <p className="text-lg text-primary font-medium">{employee.position} <span className="text-muted-foreground font-normal">en {employee.area}</span></p>
                </div>
                
                <Button variant="outline" className="shrink-0 bg-background/50 backdrop-blur-sm">
                  <Edit className="w-4 h-4 mr-2" /> Editar Legajo
                </Button>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground font-medium">
                {employee.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-foreground/40" /> {employee.email}</span>}
                {employee.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-foreground/40" /> {employee.phone}</span>}
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-foreground/40" /> Desde {employee.startDate}</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/40 border-t border-border/40 bg-muted/10">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{employee.attendanceSummary?.presentDays ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">Días Asistidos</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{employee.attendanceSummary?.absentDays ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">Faltas</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{employee.attendanceSummary?.lateDays ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">Tardanzas</p>
            </div>
            <div className="p-4 text-center bg-primary/5">
              <p className="text-2xl font-bold text-primary">{Number(employee.attendanceSummary?.hoursWorked ?? 0).toFixed(0)}<span className="text-base text-primary/70 ml-0.5">hrs</span></p>
              <p className="text-xs text-primary/70 mt-0.5 uppercase tracking-wider font-semibold">Total Acumulado</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="bg-card border border-border/40 h-12 p-1 w-full justify-start rounded-xl overflow-x-auto overflow-y-hidden">
            <TabsTrigger value="info" className="rounded-lg h-10 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none" data-testid="tab-employee-info">
              Información Personal
            </TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-lg h-10 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none" data-testid="tab-employee-announcements">
              Comunicados Recientes
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg h-10 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none" data-testid="tab-employee-documents">
              Documentos ({employee.documentCount ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
                  <FileDigit className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">Datos Contractuales</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground font-medium text-sm">Documento de Identidad</span>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{employee.documentId}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground font-medium text-sm">Modalidad de Contrato</span>
                    <span className="text-sm font-medium capitalize">{employee.contractType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground font-medium text-sm">Sede Asignada</span>
                    <span className="text-sm">{employee.site ?? "Central"}</span>
                  </div>
                  {employee.address && (
                    <div className="flex justify-between items-start py-1">
                      <span className="text-muted-foreground font-medium text-sm shrink-0">Dirección</span>
                      <span className="text-sm text-right leading-tight max-w-[200px]">{employee.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
                    <Phone className="w-5 h-5 text-destructive" />
                    <h3 className="font-semibold text-lg">Contacto de Emergencia</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col py-1">
                      <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider mb-1">Nombre del Contacto</span>
                      <span className="text-base font-medium">{employee.emergencyContact ?? "No especificado"}</span>
                    </div>
                    <div className="flex flex-col py-1">
                      <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider mb-1">Teléfono</span>
                      <span className="text-base font-medium">{employee.emergencyPhone ?? "No especificado"}</span>
                    </div>
                  </div>
                </div>

                {employee.notes && (
                  <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm bg-muted/5">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Observaciones de RRHH</h3>
                    <p className="text-sm leading-relaxed">{employee.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="mt-6">
            <div className="space-y-4">
              {!employee.recentAnnouncements?.length ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card border border-border/40 rounded-xl text-center">
                  <Clock className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="font-medium text-lg">No hay historial de comunicados</p>
                  <p className="text-sm text-muted-foreground">Este empleado no ha recibido notificaciones recientes.</p>
                </div>
              ) : (
                employee.recentAnnouncements.map((ann: any) => (
                  <div key={ann.id} className="rounded-xl border border-border/40 bg-card p-5 shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-base">{ann.title}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded">
                        {new Date(ann.createdAt).toLocaleDateString("es-PE")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <div className="flex flex-col items-center justify-center p-16 bg-card border border-border/40 rounded-xl text-center">
              <FileText className="w-16 h-16 text-primary/20 mb-6" />
              <h3 className="text-xl font-bold mb-2">Legajo Digital</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Este empleado tiene <strong className="text-foreground">{employee.documentCount ?? 0}</strong> documentos asociados en su expediente.
              </p>
              <Link href={`/documents?employeeId=${employee.id}`}>
                <Button className="shadow-lg shadow-primary/20" data-testid="link-to-documents">Explorar Repositorio</Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
