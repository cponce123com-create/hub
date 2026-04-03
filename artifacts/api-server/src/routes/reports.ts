import { Router } from "express";
import { db, invoicesTable, suppliersTable, employeesTable, attendanceTable } from "@workspace/db";
import { eq, and, sql, count, sum } from "drizzle-orm";
import { getLast6MonthsLabels } from "../lib/helpers";

const router = Router();

router.get("/companies/:companyId/reports/finance", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const { startDate, endDate } = req.query as Record<string, string>;

    const conditions = [eq(invoicesTable.companyId, companyId)];
    if (startDate) conditions.push(sql`${invoicesTable.issueDate} >= ${startDate}`);
    if (endDate) conditions.push(sql`${invoicesTable.issueDate} <= ${endDate}`);

    // SQL aggregation by status
    const byStatusRaw = await db
      .select({ status: invoicesTable.status, cnt: count(), total: sum(invoicesTable.amount) })
      .from(invoicesTable)
      .where(and(...conditions))
      .groupBy(invoicesTable.status);

    let totalInvoiced = 0, totalPaid = 0, totalPending = 0, totalOverdue = 0;
    const byStatus = byStatusRaw.map(row => {
      const amt = parseFloat(row.total ?? "0");
      totalInvoiced += amt;
      if (row.status === "paid") totalPaid = amt;
      if (row.status === "pending") totalPending = amt;
      if (row.status === "overdue") totalOverdue = amt;
      return { status: row.status, count: Number(row.cnt), amount: amt };
    });

    // SQL aggregation by supplier (top 10)
    const bySupplierRaw = await db
      .select({
        supplierName: suppliersTable.name,
        invoiceCount: count(),
        totalAmount: sum(invoicesTable.amount),
      })
      .from(invoicesTable)
      .leftJoin(suppliersTable, eq(invoicesTable.supplierId, suppliersTable.id))
      .where(and(...conditions))
      .groupBy(suppliersTable.name)
      .orderBy(sql`sum(${invoicesTable.amount}) DESC`)
      .limit(10);

    const bySupplier = bySupplierRaw.map(row => ({
      supplierName: row.supplierName ?? "Desconocido",
      invoiceCount: Number(row.invoiceCount),
      totalAmount: parseFloat(row.totalAmount ?? "0"),
    }));

    // Monthly trend — limited date range for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const trendInvoices = await db
      .select({ issueDate: invoicesTable.issueDate, amount: invoicesTable.amount })
      .from(invoicesTable)
      .where(and(eq(invoicesTable.companyId, companyId), sql`${invoicesTable.issueDate} >= ${sixMonthsAgo.toISOString().split("T")[0]}`));

    const monthlyTrend = getLast6MonthsLabels().map(({ monthStr, label }) => ({
      month: label,
      amount: trendInvoices.filter(i => i.issueDate.startsWith(monthStr)).reduce((s, i) => s + parseFloat(i.amount), 0),
    }));

    return res.json({
      period: `${startDate ?? "all"} - ${endDate ?? "all"}`,
      summary: { totalInvoiced, totalPaid, totalPending, totalOverdue },
      byStatus,
      bySupplier,
      monthlyTrend,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/companies/:companyId/reports/attendance", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
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
      const name = r.firstName ? `${r.firstName} ${r.lastName}` : "Desconocido";
      if (!byEmployee[key]) byEmployee[key] = { employeeName: name, area: r.area ?? "", presentDays: 0, absentDays: 0, lateDays: 0, hoursWorked: 0 };
      if (r.att.status === "present") byEmployee[key].presentDays++;
      else if (r.att.status === "absent" || r.att.status === "unjustified_absence") byEmployee[key].absentDays++;
      else if (r.att.status === "late") byEmployee[key].lateDays++;
      byEmployee[key].hoursWorked += parseFloat(r.att.hoursWorked || "0");
    });

    const byArea: Record<string, { attendanceRate: number; employeeCount: number; present: number; total: number }> = {};
    records.forEach(r => {
      const area = r.area ?? "Sin área";
      if (!byArea[area]) byArea[area] = { attendanceRate: 0, employeeCount: 0, present: 0, total: 0 };
      byArea[area].total++;
      if (r.att.status === "present" || r.att.status === "late") byArea[area].present++;
    });

    // SQL aggregation for employee count per area
    const areaCountRows = await db
      .select({ area: employeesTable.area, cnt: count() })
      .from(employeesTable)
      .where(eq(employeesTable.companyId, companyId))
      .groupBy(employeesTable.area);

    areaCountRows.forEach(row => {
      if (!byArea[row.area]) byArea[row.area] = { attendanceRate: 0, employeeCount: 0, present: 0, total: 0 };
      byArea[row.area].employeeCount = Number(row.cnt);
    });

    return res.json({
      period: `${startDate ?? "all"} - ${endDate ?? "all"}`,
      summary: { totalDays, avgAttendanceRate, totalHoursWorked, totalOvertime },
      byEmployee: Object.values(byEmployee),
      byArea: Object.entries(byArea).map(([area, data]) => ({ area, attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0, employeeCount: data.employeeCount })),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/companies/:companyId/reports/hr", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });

    // SQL aggregation by status
    const byStatusRaw = await db
      .select({ status: employeesTable.status, cnt: count() })
      .from(employeesTable)
      .where(eq(employeesTable.companyId, companyId))
      .groupBy(employeesTable.status);

    const byAreaRaw = await db
      .select({ area: employeesTable.area, cnt: count() })
      .from(employeesTable)
      .where(eq(employeesTable.companyId, companyId))
      .groupBy(employeesTable.area)
      .orderBy(sql`count(*) DESC`);

    const byContractRaw = await db
      .select({ contractType: employeesTable.contractType, cnt: count() })
      .from(employeesTable)
      .where(eq(employeesTable.companyId, companyId))
      .groupBy(employeesTable.contractType);

    const totalEmployees = byStatusRaw.reduce((s, r) => s + Number(r.cnt), 0);

    return res.json({
      summary: {
        totalEmployees,
        byStatus: byStatusRaw.map(r => ({ status: r.status, count: Number(r.cnt) })),
        byArea: byAreaRaw.map(r => ({ area: r.area, count: Number(r.cnt) })),
        byContractType: byContractRaw.map(r => ({ contractType: r.contractType, count: Number(r.cnt) })),
      },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
