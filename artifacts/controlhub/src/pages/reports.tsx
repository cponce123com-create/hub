import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useCompany } from "@/context/CompanyContext";
import {
  useGetFinanceReport,
  useGetAttendanceReport,
  useGetHrReport,
} from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus, Users, FileText, Calendar, DollarSign, PieChart as PieIcon, LineChart as LineIcon, Activity, Clock } from "lucide-react";

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#c084fc", "#fb923c"];

function StatCard({ label, value, sub, icon: Icon, trend }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="absolute -right-4 -top-4 opacity-[0.03] pointer-events-none">
        <Icon className="w-32 h-32" />
      </div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10 shadow-inner">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-foreground relative z-10">{value}</p>
      {sub && (
        <div className="flex items-center gap-1.5 mt-2 relative z-10">
          {trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-500" />}
          {trend === "down" && <TrendingDown className="w-4 h-4 text-destructive" />}
          {trend === "neutral" && <Minus className="w-4 h-4 text-muted-foreground" />}
          <p className="text-sm font-medium text-muted-foreground">{sub}</p>
        </div>
      )}
    </div>
  );
}

const now = new Date();
const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
const defaultEndDate = now.toISOString().split("T")[0];

export default function Reports() {
  const { companyId } = useCompany();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const { data: financeReport, isLoading: loadingFinance } = useGetFinanceReport(companyId, { startDate, endDate }, { query: { enabled: !!companyId }});
  const { data: attReport, isLoading: loadingAtt } = useGetAttendanceReport(companyId, { startDate, endDate }, { query: { enabled: !!companyId }});
  const { data: hrReport, isLoading: loadingHr } = useGetHrReport(companyId, { query: { enabled: !!companyId }});

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary" />
              Inteligencia de Negocio
            </h1>
            <p className="text-muted-foreground text-base mt-2">Métricas clave y análisis visual del rendimiento corporativo.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-3 rounded-xl border border-border/50">
            <div className="flex items-center gap-2">
              <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Desde</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40 h-9 bg-card border-border/50 shadow-sm" data-testid="input-report-start-date" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Hasta</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40 h-9 bg-card border-border/50 shadow-sm" data-testid="input-report-end-date" />
            </div>
          </div>
        </div>

        <Tabs defaultValue="finance" className="w-full" data-testid="reports-tabs">
          <TabsList className="bg-card border border-border/40 h-14 p-1 w-full justify-start rounded-xl overflow-x-auto overflow-y-hidden shadow-sm">
            <TabsTrigger value="finance" className="rounded-lg h-11 px-6 text-base font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none" data-testid="tab-finance-report">
              <DollarSign className="w-4 h-4 mr-2" /> Área Financiera
            </TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg h-11 px-6 text-base font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none" data-testid="tab-attendance-report">
              <Calendar className="w-4 h-4 mr-2" /> Control de Asistencia
            </TabsTrigger>
            <TabsTrigger value="hr" className="rounded-lg h-11 px-6 text-base font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none" data-testid="tab-hr-report">
              <Users className="w-4 h-4 mr-2" /> Recursos Humanos
            </TabsTrigger>
          </TabsList>

          {/* FINANCE TAB */}
          <TabsContent value="finance" className="mt-6 space-y-6">
            {loadingFinance ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    label="Emisión Total"
                    value={`S/ ${Number(financeReport?.summary?.totalInvoiced ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={FileText}
                  />
                  <StatCard
                    label="Liquidez / Pagado"
                    value={`S/ ${Number(financeReport?.summary?.totalPaid ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={TrendingUp}
                    trend="up"
                    sub="Flujo saliente"
                  />
                  <StatCard
                    label="Deuda Pendiente"
                    value={`S/ ${Number(financeReport?.summary?.totalPending ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    trend="neutral"
                    sub="Por procesar"
                  />
                  <StatCard
                    label="Riesgo Vencido"
                    value={`S/ ${Number(financeReport?.summary?.totalOverdue ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={TrendingDown}
                    trend={financeReport?.summary?.totalOverdue ? "down" : "neutral"}
                    sub="Atención requerida"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {financeReport?.monthlyTrend && financeReport.monthlyTrend.length > 0 && (
                    <div className="col-span-1 lg:col-span-2 rounded-xl border border-border/40 bg-card p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <LineIcon className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-lg">Histórico de Facturación</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={financeReport.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                          <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickMargin={10} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `S/${value/1000}k`} tickMargin={10} />
                          <Tooltip 
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} 
                            itemStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                            formatter={(value: number) => [`S/ ${value.toLocaleString()}`, "Monto"]}
                          />
                          <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {financeReport?.byStatus && financeReport.byStatus.length > 0 && (
                    <div className="col-span-1 rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-6">
                        <PieIcon className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-lg">Estado de Cartera</h3>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center gap-6">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={financeReport.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2}>
                              {financeReport.byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="w-full space-y-3">
                          {financeReport.byStatus.map((s, i) => (
                            <div key={s.status} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                <span className="capitalize font-medium text-foreground">{s.status}</span>
                              </div>
                              <span className="font-bold">{s.count} doc.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {financeReport?.bySupplier && financeReport.bySupplier.length > 0 && (
                  <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-6">Concentración de Proveedores (Top)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={financeReport.bySupplier.map(s => ({ name: s.supplierName, total: s.totalAmount }))} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                        <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `S/${value/1000}k`} />
                        <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={120} />
                        <Tooltip 
                          cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} 
                          formatter={(v: number) => [`S/ ${v.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`, "Monto"]} 
                        />
                        <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ATTENDANCE TAB */}
          <TabsContent value="attendance" className="mt-6 space-y-6">
            {loadingAtt ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Jornadas Procesadas" value={attReport?.summary?.totalDays ?? 0} icon={Calendar} sub="En el periodo" />
                  <StatCard
                    label="Horas Efectivas"
                    value={`${Number(attReport?.summary?.totalHoursWorked ?? 0).toFixed(0)}h`}
                    icon={Clock}
                    trend="up"
                    sub="Fuerza laboral"
                  />
                  <StatCard
                    label="KPI de Asistencia"
                    value={`${attReport?.summary?.avgAttendanceRate ?? 0}%`}
                    icon={TrendingUp}
                    trend={Number(attReport?.summary?.avgAttendanceRate ?? 0) >= 90 ? "up" : "down"}
                    sub={Number(attReport?.summary?.avgAttendanceRate ?? 0) >= 90 ? "Óptimo" : "Alerta de ausentismo"}
                  />
                  <StatCard
                    label="Horas Extras"
                    value={`${Number(attReport?.summary?.totalOvertime ?? 0).toFixed(0)}h`}
                    icon={Calendar}
                    sub="Costo adicional"
                  />
                </div>

                {attReport?.byArea && attReport.byArea.length > 0 && (
                  <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-6">Tasa de Cumplimiento por Área</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={attReport.byArea} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                        <XAxis dataKey="area" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickMargin={10} />
                        <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} tickMargin={10} />
                        <Tooltip 
                          cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} 
                          formatter={(v: number) => [`${v}%`, "Asistencia"]} 
                        />
                        <Bar dataKey="attendanceRate" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {attReport?.byEmployee && attReport.byEmployee.length > 0 && (
                  <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
                    <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
                      <h3 className="font-bold text-lg">Consolidado por Empleado</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border/40 hover:bg-transparent bg-muted/10">
                            <TableHead className="font-semibold h-12 text-muted-foreground">Colaborador</TableHead>
                            <TableHead className="font-semibold text-muted-foreground">Área / Sede</TableHead>
                            <TableHead className="font-semibold text-right text-muted-foreground">Presencias</TableHead>
                            <TableHead className="font-semibold text-right text-muted-foreground">Ausencias</TableHead>
                            <TableHead className="font-semibold text-right text-muted-foreground">Tardanzas</TableHead>
                            <TableHead className="font-semibold text-right text-muted-foreground">Horas Netas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attReport.byEmployee.map((r, i) => (
                            <TableRow key={i} className="border-border/40 hover:bg-muted/30">
                              <TableCell className="font-medium text-foreground">{r.employeeName}</TableCell>
                              <TableCell>
                                <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium">{r.area}</span>
                              </TableCell>
                              <TableCell className="text-right font-bold text-emerald-500">{r.presentDays}</TableCell>
                              <TableCell className="text-right font-bold text-destructive">{r.absentDays}</TableCell>
                              <TableCell className="text-right font-bold text-yellow-500">{r.lateDays}</TableCell>
                              <TableCell className="text-right font-bold">{Number(r.hoursWorked).toFixed(0)} <span className="text-muted-foreground font-normal text-xs">hrs</span></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* HR TAB */}
          <TabsContent value="hr" className="mt-6 space-y-6">
            {loadingHr ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Total Plantilla" value={hrReport?.summary?.totalEmployees ?? 0} icon={Users} sub="Registros históricos" />
                  <StatCard
                    label="Personal Activo"
                    value={hrReport?.summary?.byStatus?.find(s => s.status === "active")?.count ?? 0}
                    icon={Users}
                    trend="up"
                    sub="En funciones"
                  />
                  <StatCard
                    label="Permisos / Licencias"
                    value={hrReport?.summary?.byStatus?.find(s => s.status === "on_leave")?.count ?? 0}
                    icon={Users}
                    sub="Temporalmente inactivos"
                  />
                  <StatCard
                    label="Estructura"
                    value={hrReport?.summary?.byArea?.length ?? 0}
                    icon={Users}
                    sub="Departamentos operativos"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {hrReport?.summary?.byArea && hrReport.summary.byArea.length > 0 && (
                    <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <PieIcon className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-lg">Distribución por Áreas</h3>
                      </div>
                      <div className="flex flex-col items-center">
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie data={hrReport.summary.byArea} dataKey="count" nameKey="area" cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={2}>
                              {hrReport.summary.byArea.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="w-full mt-4 grid grid-cols-2 gap-3">
                          {hrReport.summary.byArea.map((a, i) => (
                            <div key={a.area} className="flex items-center justify-between text-sm bg-muted/30 px-3 py-2 rounded-lg">
                              <div className="flex items-center gap-2 truncate">
                                <div className="h-3 w-3 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                <span className="font-medium truncate">{a.area}</span>
                              </div>
                              <span className="font-bold">{a.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {hrReport?.summary?.byContractType && hrReport.summary.byContractType.length > 0 && (
                    <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-lg">Modalidades Contractuales</h3>
                      </div>
                      <div className="space-y-5 pt-4">
                        {hrReport.summary.byContractType.map((c, i) => {
                          const total = hrReport.summary.totalEmployees ?? 1;
                          const pct = Math.round((c.count / total) * 100);
                          return (
                            <div key={c.contractType} className="group">
                              <div className="flex justify-between items-end mb-2">
                                <span className="font-semibold text-foreground capitalize tracking-tight text-sm">{c.contractType.replace("_", " ")}</span>
                                <div className="text-right">
                                  <span className="font-bold text-lg">{c.count}</span>
                                  <span className="text-xs text-muted-foreground ml-2 font-medium bg-muted px-1.5 py-0.5 rounded">{pct}%</span>
                                </div>
                              </div>
                              <div className="h-3 bg-muted rounded-full overflow-hidden border border-border/20 shadow-inner">
                                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
