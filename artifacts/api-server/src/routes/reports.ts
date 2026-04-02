import { Router } from "express";
import { db, invoicesTable, suppliersTable, employeesTable, attendanceTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

router.get("/companies/:companyId/reports/finance", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const { startDate, endDate } = req.query as Record<string, string>;

    const conditions = [eq(invoicesTable.companyId, companyId)];
    if (startDate) conditions.push(sql`${invoicesTable.issueDate} >= ${startDate}`);
    if (endDate) conditions.push(sql`${invoicesTable.issueDate} <= ${endDate}`);

    const invoices = await db
      .select({ invoice: invoicesTable, supplierName: suppliersTable.name })
      .from(invoicesTable)
      .leftJoin(suppliersTable, eq(invoicesTable.supplierId, suppliersTable.id))
      .where(and(...conditions));

    const total = invoices.reduce((s, { invoice }) => s + parseFloat(invoice.amount), 0);
    const paid = invoices.filter(({ invoice }) => invoice.status === "paid").reduce((s, { invoice }) => s + parseFloat(invoice.amount), 0);
    const pending = invoices.filter(({ invoice }) => invoice.status === "pending").reduce((s, { invoice }) => s + parseFloat(invoice.amount), 0);
    const overdue = invoices.filter(({ invoice }) => invoice.status === "overdue").reduce((s, { invoice }) => s + parseFloat(invoice.amount), 0);

    const statusGroups: Record<string, { count: number; amount: number }> = {};
    invoices.forEach(({ invoice }) => {
      if (!statusGroups[invoice.status]) statusGroups[invoice.status] = { count: 0, amount: 0 };
      statusGroups[invoice.status].count++;
      statusGroups[invoice.status].amount += parseFloat(invoice.amount);
    });

    const supplierGroups: Record<string, { invoiceCount: number; totalAmount: number }> = {};
    invoices.forEach(({ invoice, supplierName }) => {
      const name = supplierName ?? "Unknown";
      if (!supplierGroups[name]) supplierGroups[name] = { invoiceCount: 0, totalAmount: 0 };
      supplierGroups[name].invoiceCount++;
      supplierGroups[name].totalAmount += parseFloat(invoice.amount);
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().substring(0, 7);
      const label = d.toLocaleString("es-PE", { month: "short", year: "numeric" });
      const amount = invoices.filter(({ invoice }) => invoice.issueDate.startsWith(monthStr)).reduce((s, { invoice }) => s + parseFloat(invoice.amount), 0);
      monthlyTrend.push({ month: label, amount });
    }

    return res.json({
      period: `${startDate ?? "all"} - ${endDate ?? "all"}`,
      summary: { totalInvoiced: total, totalPaid: paid, totalPending: pending, totalOverdue: overdue },
      byStatus: Object.entries(statusGroups).map(([status, data]) => ({ status, count: data.count, amount: data.amount })),
      bySupplier: Object.entries(supplierGroups).map(([supplierName, data]) => ({ supplierName, ...data })).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10),
      monthlyTrend,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:companyId/reports/attendance", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const { startDate, endDate, employeeId } = req.query as Record<string, string>;

    const conditions = [eq(attendanceTable.companyId, companyId)];
    if (startDate) conditions.push(sql`${attendanceTable.date} >= ${startDate}`);
    if (endDate) conditions.push(sql`${attendanceTable.date} <= ${endDate}`);
    if (employeeId) conditions.push(eq(attendanceTable.employeeId, parseInt(employeeId)));

    const records = await db
      .select({ att: attendanceTable, firstName: employeesTable.firstName, lastName: employeesTable.lastName, area: employeesTable.area })
      .from(attendanceTable)
      .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
      .where(and(...conditions));

    const totalDays = records.length;
    const presentCount = records.filter(r => r.att.status === "present" || r.att.status === "late").length;
    const avgAttendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
    const totalHoursWorked = records.reduce((s, r) => s + parseFloat(r.att.hoursWorked || "0"), 0);
    const totalOvertime = records.reduce((s, r) => s + parseFloat(r.att.overtime || "0"), 0);

    const byEmployee: Record<string, { employeeName: string; area: string; presentDays: number; absentDays: number; lateDays: number; hoursWorked: number }> = {};
    records.forEach(r => {
      const key = `${r.att.employeeId}`;
      const name = r.firstName ? `${r.firstName} ${r.lastName}` : "Unknown";
      if (!byEmployee[key]) byEmployee[key] = { employeeName: name, area: r.area ?? "", presentDays: 0, absentDays: 0, lateDays: 0, hoursWorked: 0 };
      if (r.att.status === "present") byEmployee[key].presentDays++;
      else if (r.att.status === "absent" || r.att.status === "unjustified_absence") byEmployee[key].absentDays++;
      else if (r.att.status === "late") byEmployee[key].lateDays++;
      byEmployee[key].hoursWorked += parseFloat(r.att.hoursWorked || "0");
    });

    const byArea: Record<string, { attendanceRate: number; employeeCount: number; present: number; total: number }> = {};
    records.forEach(r => {
      const area = r.area ?? "Sin area";
      if (!byArea[area]) byArea[area] = { attendanceRate: 0, employeeCount: 0, present: 0, total: 0 };
      byArea[area].total++;
      if (r.att.status === "present" || r.att.status === "late") byArea[area].present++;
    });
    const employees2 = await db.select().from(employeesTable).where(eq(employeesTable.companyId, companyId));
    employees2.forEach(e => {
      const area = e.area;
      if (!byArea[area]) byArea[area] = { attendanceRate: 0, employeeCount: 0, present: 0, total: 0 };
      byArea[area].employeeCount++;
    });

    return res.json({
      period: `${startDate ?? "all"} - ${endDate ?? "all"}`,
      summary: { totalDays, avgAttendanceRate, totalHoursWorked, totalOvertime },
      byEmployee: Object.values(byEmployee),
      byArea: Object.entries(byArea).map(([area, data]) => ({ area, attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0, employeeCount: data.employeeCount })),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:companyId/reports/hr", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const employees = await db.select().from(employeesTable).where(eq(employeesTable.companyId, companyId));

    const statusGroups: Record<string, number> = {};
    const areaGroups: Record<string, number> = {};
    const contractGroups: Record<string, number> = {};

    employees.forEach(e => {
      statusGroups[e.status] = (statusGroups[e.status] ?? 0) + 1;
      areaGroups[e.area] = (areaGroups[e.area] ?? 0) + 1;
      contractGroups[e.contractType] = (contractGroups[e.contractType] ?? 0) + 1;
    });

    return res.json({
      summary: {
        totalEmployees: employees.length,
        byStatus: Object.entries(statusGroups).map(([status, count]) => ({ status, count })),
        byArea: Object.entries(areaGroups).map(([area, count]) => ({ area, count })).sort((a, b) => b.count - a.count),
        byContractType: Object.entries(contractGroups).map(([contractType, count]) => ({ contractType, count })),
      },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
