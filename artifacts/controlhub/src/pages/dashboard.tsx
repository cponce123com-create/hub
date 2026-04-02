import { useCompany } from "@/context/CompanyContext";
import { AppLayout } from "@/components/layout";
import {
  useGetDashboardSummary,
  useGetRecentActivity,
  useGetDashboardAlerts
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, AlertTriangle, Users, Calendar, ArrowUpRight, ArrowDownRight, Clock, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { companyId } = useCompany();

  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary(companyId, {
    query: { enabled: !!companyId }
  });

  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity(companyId, { limit: 10 }, {
    query: { enabled: !!companyId }
  });

  const { data: alerts, isLoading: loadingAlerts } = useGetDashboardAlerts(companyId, {
    query: { enabled: !!companyId }
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Centro de Mando</h1>
          <p className="text-muted-foreground mt-1.5 text-base">Visión ejecutiva en tiempo real de tus operaciones empresariales.</p>
        </div>

        {/* KPI Cards */}
        {loadingSummary ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-border/40 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/3 mb-2 mt-2" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : summary ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/40 shadow-sm bg-card hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cuentas por Pagar</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  S/ {summary.finance.totalPending.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center text-primary font-medium">
                    {summary.finance.invoiceCount} facturas
                  </span>
                  <span>pendientes</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-sm bg-card hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Riesgo Financiero</CardTitle>
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">
                  S/ {summary.finance.totalOverdue.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center text-destructive font-medium">
                    {summary.finance.overdueCount} facturas
                  </span>
                  <span>vencidas</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-sm bg-card hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fuerza Laboral</CardTitle>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{summary.hr.activeEmployees}</div>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center text-blue-400 font-medium">
                    {summary.hr.newThisMonth} nuevos
                  </span>
                  <span>este mes</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-sm bg-card hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Asistencia Diaria</CardTitle>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{summary.attendance.attendanceRate}%</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1.5 text-xs">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-normal rounded-sm px-1.5">
                      {summary.attendance.presentToday} P
                    </Badge>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-normal rounded-sm px-1.5">
                      {summary.attendance.absentToday} A
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">Hoy</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Main Chart */}
          <Card className="col-span-1 lg:col-span-5 border-border/40 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tendencia de Facturación</CardTitle>
              <CardDescription>Evolución de facturas pagadas vs pendientes en los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="pl-0 pr-4 pb-4">
              {summary?.invoiceTrend ? (
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary.invoiceTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <XAxis 
                        dataKey="month" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={10} 
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `S/${value/1000}k`}
                        tickMargin={10}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          color: 'hsl(var(--foreground))'
                        }} 
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="paid" 
                        name="Pagadas"
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPaid)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--chart-2))" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="pending" 
                        name="Pendientes"
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPending)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--chart-1))" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center">
                  <Skeleton className="h-[300px] w-full rounded-xl mx-6" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts Panel */}
          <Card className="col-span-1 lg:col-span-2 border-border/40 shadow-sm bg-card overflow-hidden flex flex-col">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                  Alertas
                </CardTitle>
                {alerts?.length ? (
                  <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/20 font-medium">
                    {alerts.length} nuevas
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              <div className="divide-y divide-border/40">
                {loadingAlerts ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))
                ) : alerts?.length ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-4 hover:bg-muted/30 transition-colors group cursor-default">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-medium ${alert.severity === 'error' ? 'text-destructive' : alert.severity === 'warning' ? 'text-orange-400' : 'text-primary'}`}>
                          {alert.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                          {format(new Date(alert.createdAt), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                    <ShieldAlert className="w-8 h-8 opacity-20 mb-3" />
                    <p className="text-sm font-medium">No hay alertas activas</p>
                    <p className="text-xs mt-1">Todo está funcionando correctamente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingActivity ? (
              <div className="divide-y divide-border/40">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity?.length ? (
              <div className="divide-y divide-border/40">
                {activity.map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{item.performedBy.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{item.performedBy}</span> <span className="text-muted-foreground">{item.action}</span> <span className="font-medium">{item.entityName}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
                          {item.module}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.createdAt), "d MMM, h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No se ha registrado actividad reciente.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
