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
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus, Users, FileText, Calendar, DollarSign } from "lucide-react";

const CHART_COLORS = ["#6370f0", "#22d3ee", "#4ade80", "#facc15", "#f87171", "#c084fc", "#fb923c"];

function StatCard({ label, value, sub, icon: Icon, trend }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" && <TrendingUp className="w-3 h-3 text-green-400" />}
          {trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
          {trend === "neutral" && <Minus className="w-3 h-3 text-muted-foreground" />}
          <p className="text-xs text-muted-foreground">{sub}</p>
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

  const { data: financeReport, isLoading: loadingFinance } = useGetFinanceReport(companyId, { startDate, endDate });
  const { data: attReport, isLoading: loadingAtt } = useGetAttendanceReport(companyId, { startDate, endDate });
  const { data: hrReport, isLoading: loadingHr } = useGetHrReport(companyId);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes y Analisis</h1>
          <p className="text-muted-foreground text-sm mt-1">Metricas, tendencias y KPIs empresariales</p>
        </div>

        <div className="flex items-center gap-4 bg-card/50 border border-border/60 rounded-lg px-4 py-3">
          <p className="text-sm text-muted-foreground font-medium">Periodo:</p>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Desde</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40 h-8 text-sm" data-testid="input-report-start-date" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Hasta</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40 h-8 text-sm" data-testid="input-report-end-date" />
          </div>
        </div>

        <Tabs defaultValue="finance" data-testid="reports-tabs">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="finance" data-testid="tab-finance-report">Finanzas</TabsTrigger>
            <TabsTrigger value="attendance" data-testid="tab-attendance-report">Asistencia</TabsTrigger>
            <TabsTrigger value="hr" data-testid="tab-hr-report">Recursos Humanos</TabsTrigger>
          </TabsList>

          {/* FINANCE TAB */}
          <TabsContent value="finance" className="mt-4 space-y-6">
            {loadingFinance ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Total facturado"
                    value={`S/ ${Number(financeReport?.summary?.totalInvoiced ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                  />
                  <StatCard
                    label="Total pagado"
                    value={`S/ ${Number(financeReport?.summary?.totalPaid ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={TrendingUp}
                    trend="up"
                  />
                  <StatCard
                    label="Por pagar"
                    value={`S/ ${Number(financeReport?.summary?.totalPending ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={FileText}
                    trend="neutral"
                  />
                  <StatCard
                    label="Vencido"
                    value={`S/ ${Number(financeReport?.summary?.totalOverdue ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={TrendingDown}
                    trend={financeReport?.summary?.totalOverdue ? "down" : "neutral"}
                  />
                </div>

                {financeReport?.monthlyTrend && financeReport.monthlyTrend.length > 0 && (
                  <div className="rounded-lg border border-border/60 bg-card/50 p-5">
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Tendencia mensual de facturacion</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={financeReport.monthlyTrend} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={{ fill: "hsl(215 20.2% 65.1%)", fontSize: 11 }} />
                        <YAxis tick={{ fill: "hsl(215 20.2% 65.1%)", fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 32% 17%)", borderRadius: "6px", color: "#fff" }} />
                        <Line type="monotone" dataKey="amount" stroke="hsl(235 86% 65%)" strokeWidth={2} dot={{ fill: "hsl(235 86% 65%)", r: 4 }} name="Monto (S/)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {financeReport?.bySupplier && financeReport.bySupplier.length > 0 && (
                  <div className="rounded-lg border border-border/60 bg-card/50 p-5">
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Top proveedores por monto</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={financeReport.bySupplier.map(s => ({ name: s.supplierName, total: s.totalAmount }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" tick={{ fill: "hsl(215 20.2% 65.1%)", fontSize: 11 }} />
                        <YAxis tick={{ fill: "hsl(215 20.2% 65.1%)", fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 32% 17%)", borderRadius: "6px", color: "#fff" }} formatter={(v: number) => [`S/ ${v.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`, "Monto"]} />
                        <Bar dataKey="total" fill="hsl(235 86% 65%)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {financeReport?.byStatus && financeReport.byStatus.length > 0 && (
                  <div className="rounded-lg border border-border/60 bg-card/50 p-5">
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Distribucion por estado</h3>
                    <div className="flex items-center justify-center gap-8 flex-wrap">
                      <ResponsiveContainer width={200} height={200}>
                        <PieChart>
                          <Pie data={financeReport.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={85} paddingAngle={2}>
                            {financeReport.byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 32% 17%)", borderRadius: "6px", color: "#fff" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {financeReport.byStatus.map((s, i) => (
                          <div key={s.status} className="flex items-center gap-2 text-sm">
                            <div className="h-3 w-3 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="capitalize">{s.status}</span>
                            <span className="text-muted-foreground ml-auto pl-4">{s.count} facturas</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ATTENDANCE TAB */}
          <TabsContent value="attendance" className="mt-4 space-y-6">
            {loadingAtt ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total registros" value={attReport?.summary?.totalDays ?? 0} icon={Calendar} />
                  <StatCard
                    label="Horas trabajadas"
                    value={`${Number(attReport?.summary?.totalHoursWorked ?? 0).toFixed(0)}h`}
                    icon={Calendar}
                    trend="up"
                  />
                  <StatCard
                    label="Tasa de asistencia"
                    value={`${attReport?.summary?.avgAttendanceRate ?? 0}%`}
                    icon={TrendingUp}
                    trend={Number(attReport?.summary?.avgAttendanceRate ?? 0) >= 90 ? "up" : "down"}
                    sub={Number(attReport?.summary?.avgAttendanceRate ?? 0) >= 90 ? "Excelente" : "Requiere atencion"}
                  />
                  <StatCard
                    label="Horas extras"
                    value={`${Number(attReport?.summary?.totalOvertime ?? 0).toFixed(0)}h`}
                    icon={Calendar}
                  />
                </div>

                {attReport?.byArea && attReport.byArea.length > 0 && (
                  <div className="rounded-lg border border-border/60 bg-card/50 p-5">
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Tasa de asistencia por area (%)</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={attReport.byArea} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="area" tick={{ fill: "hsl(215 20.2% 65.1%)", fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: "hsl(215 20.2% 65.1%)", fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 32% 17%)", borderRadius: "6px", color: "#fff" }} formatter={(v: number) => [`${v}%`, "Tasa asistencia"]} />
                        <Bar dataKey="attendanceRate" fill="hsl(152 69% 31%)" radius={[3, 3, 0, 0]} name="Tasa %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {attReport?.byEmployee && attReport.byEmployee.length > 0 && (
                  <div className="rounded-lg border border-border/60 overflow-hidden">
                    <div className="px-5 py-3 border-b border-border/40">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Detalle por empleado</h3>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/60 hover:bg-transparent">
                          <TableHead className="text-muted-foreground font-medium">Empleado</TableHead>
                          <TableHead className="text-muted-foreground font-medium">Area</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-right">Presentes</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-right">Ausencias</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-right">Tardanzas</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-right">Horas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attReport.byEmployee.map(r => (
                          <TableRow key={r.employeeName} className="border-border/60">
                            <TableCell className="font-medium">{r.employeeName}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{r.area}</TableCell>
                            <TableCell className="text-right text-green-400 font-semibold">{r.presentDays}</TableCell>
                            <TableCell className="text-right text-red-400 font-semibold">{r.absentDays}</TableCell>
                            <TableCell className="text-right text-yellow-400 font-semibold">{r.lateDays}</TableCell>
                            <TableCell className="text-right font-semibold">{Number(r.hoursWorked).toFixed(0)}h</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* HR TAB */}
          <TabsContent value="hr" className="mt-4 space-y-6">
            {loadingHr ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total empleados" value={hrReport?.summary?.totalEmployees ?? 0} icon={Users} />
                  <StatCard
                    label="Activos"
                    value={hrReport?.summary?.byStatus?.find(s => s.status === "active")?.count ?? 0}
                    icon={Users}
                    trend="up"
                  />
                  <StatCard
                    label="En licencia"
                    value={hrReport?.summary?.byStatus?.find(s => s.status === "on_leave")?.count ?? 0}
                    icon={Users}
                  />
                  <StatCard
                    label="Areas"
                    value={hrReport?.summary?.byArea?.length ?? 0}
                    icon={Users}
                    sub="Unidades organizativas"
                  />
                </div>

                {hrReport?.summary?.byArea && hrReport.summary.byArea.length > 0 && (
                  <div className="rounded-lg border border-border/60 bg-card/50 p-5">
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Distribucion por area</h3>
                    <div className="flex items-center justify-center gap-8 flex-wrap">
                      <ResponsiveContainer width={220} height={220}>
                        <PieChart>
                          <Pie data={hrReport.summary.byArea} dataKey="count" nameKey="area" cx="50%" cy="50%" outerRadius={95} paddingAngle={2}>
                            {hrReport.summary.byArea.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 32% 17%)", borderRadius: "6px", color: "#fff" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {hrReport.summary.byArea.map((a, i) => (
                          <div key={a.area} className="flex items-center gap-3 text-sm">
                            <div className="h-3 w-3 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span>{a.area}</span>
                            <span className="ml-auto pl-4 font-semibold">{a.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {hrReport?.summary?.byContractType && hrReport.summary.byContractType.length > 0 && (
                  <div className="rounded-lg border border-border/60 bg-card/50 p-5">
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Por tipo de contrato</h3>
                    <div className="space-y-3">
                      {hrReport.summary.byContractType.map((c, i) => {
                        const total = hrReport.summary.totalEmployees ?? 1;
                        const pct = Math.round((c.count / total) * 100);
                        return (
                          <div key={c.contractType}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{c.contractType.replace("_", " ")}</span>
                              <span className="text-muted-foreground">{c.count} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
