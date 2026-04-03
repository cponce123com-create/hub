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

    const attConditions = [eq(attendanceTable.companyId, companyId)];
    if (startDate) attConditions.push(sql`${attendanceTable.date} >= ${startDate}`);
    if (endDate) attConditions.push(sql`${attendanceTable.date} <= ${endDate}`);
    if (employeeId) attConditions.push(eq(attendanceTable.employeeId, parseInt(employeeId)));

    // Summary totals — full SQL aggregation, no JS reduce
    const [summaryRaw, byEmployeeRaw, byAreaAttRaw, byAreaEmpRaw] = await Promise.all([
      // Global summary: total rows, hours worked, overtime, and present count via FILTER
      db.select({
        totalDays: count(),
        totalHoursWorked: sql<string>`coalesce(sum(${attendanceTable.hoursWorked}), 0)`,
        totalOvertime: sql<string>`coalesce(sum(${attendanceTable.overtime}), 0)`,
        presentCount: sql<string>`count(*) filter (where ${attendanceTable.status} in ('present','late'))`,
      })
        .from(attendanceTable)
        .where(and(...attConditions)),

      // Per-employee breakdown via GROUP BY employee + status
      db.select({
        employeeId: attendanceTable.employeeId,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        area: employeesTable.area,
        status: attendanceTable.status,
        cnt: count(),
        hours: sql<string>`coalesce(sum(${attendanceTable.hoursWorked}), 0)`,
      })
        .from(attendanceTable)
        .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
        .where(and(...attConditions))
        .groupBy(attendanceTable.employeeId, employeesTable.firstName, employeesTable.lastName, employeesTable.area, attendanceTable.status),

      // Per-area attendance aggregation
      db.select({
        area: employeesTable.area,
        total: count(),
        present: sql<string>`count(*) filter (where ${attendanceTable.status} in ('present','late'))`,
      })
        .from(attendanceTable)
        .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
        .where(and(...attConditions))
        .groupBy(employeesTable.area),

      // Employee headcount per area (denominator)
      db.select({ area: employeesTable.area, cnt: count() })
        .from(employeesTable)
        .where(eq(employeesTable.companyId, companyId))
        .groupBy(employeesTable.area),
    ]);

    const { totalDays, totalHoursWorked, totalOvertime, presentCount } = summaryRaw[0];
    const totalDaysN = Number(totalDays);
    const presentCountN = Number(presentCount);
    const avgAttendanceRate = totalDaysN > 0 ? Math.round((presentCountN / totalDaysN) * 100) : 0;

    // Build per-employee map from GROUP BY rows
    const byEmployeeMap: Record<string, { employeeName: string; area: string; presentDays: number; absentDays: number; lateDays: number; hoursWorked: number }> = {};
    for (const row of byEmployeeRaw) {
      const key = String(row.employeeId);
      const name = row.firstName ? `${row.firstName} ${row.lastName ?? ""}`.trim() : "Desconocido";
      if (!byEmployeeMap[key]) byEmployeeMap[key] = { employeeName: name, area: row.area ?? "", presentDays: 0, absentDays: 0, lateDays: 0, hoursWorked: 0 };
      const cnt = Number(row.cnt);
      if (row.status === "present") byEmployeeMap[key].presentDays += cnt;
      else if (row.status === "absent" || row.status === "unjustified_absence") byEmployeeMap[key].absentDays += cnt;
      else if (row.status === "late") byEmployeeMap[key].lateDays += cnt;
      byEmployeeMap[key].hoursWorked += parseFloat(row.hours);
    }

    // Build per-area map from GROUP BY rows
    const empCountByArea = Object.fromEntries(byAreaEmpRaw.map(r => [r.area, Number(r.cnt)]));
    const byArea = byAreaAttRaw.map(row => {
      const total = Number(row.total);
      const present = Number(row.present);
      return {
        area: row.area ?? "Sin área",
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
        employeeCount: empCountByArea[row.area ?? ""] ?? 0,
      };
    });

    return res.json({
      period: `${startDate ?? "all"} - ${endDate ?? "all"}`,
      summary: {
        totalDays: totalDaysN,
        avgAttendanceRate,
        totalHoursWorked: parseFloat(totalHoursWorked),
        totalOvertime: parseFloat(totalOvertime),
      },
      byEmployee: Object.values(byEmployeeMap),
      byArea,
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
