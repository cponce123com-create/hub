import { Router } from "express";
import { db, invoicesTable, employeesTable, attendanceTable, documentsTable, announcementsTable, announcementReadsTable } from "@workspace/db";
import { eq, and, count, sum, sql, inArray } from "drizzle-orm";
import { getLast6MonthsLabels } from "../lib/helpers";

const router = Router();

router.get("/companies/:companyId/dashboard/summary", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const userId = req.session?.userId ?? 1;
    const today = new Date().toISOString().split("T")[0];
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    // Finance metrics via SQL aggregation (no full table scan)
    const financeAgg = await db
      .select({ status: invoicesTable.status, total: sum(invoicesTable.amount), cnt: count() })
      .from(invoicesTable)
      .where(eq(invoicesTable.companyId, companyId))
      .groupBy(invoicesTable.status);

    let totalPending = 0, totalOverdue = 0, totalPaid = 0, overdueCount = 0, upcomingCount = 0, invoiceCount = 0;
    for (const row of financeAgg) {
      const amt = parseFloat(row.total ?? "0");
      const cnt = Number(row.cnt);
      invoiceCount += cnt;
      if (row.status === "pending") { totalPending = amt; }
      if (row.status === "overdue") { totalOverdue = amt; overdueCount = cnt; }
      if (row.status === "paid") { totalPaid = amt; }
      if (row.status === "scheduled") { upcomingCount = cnt; }
    }

    // HR metrics via SQL aggregation
    const hrAgg = await db
      .select({ status: employeesTable.status, cnt: count() })
      .from(employeesTable)
      .where(eq(employeesTable.companyId, companyId))
      .groupBy(employeesTable.status);

    let totalEmployees = 0, activeEmployees = 0, onLeaveEmployees = 0;
    for (const row of hrAgg) {
      totalEmployees += Number(row.cnt);
      if (row.status === "active") activeEmployees = Number(row.cnt);
      if (row.status === "on_leave") onLeaveEmployees = Number(row.cnt);
    }

    const [{ newThisMonth }] = await db
      .select({ newThisMonth: count() })
      .from(employeesTable)
      .where(and(eq(employeesTable.companyId, companyId), sql`${employeesTable.startDate} >= ${firstOfMonth.toISOString().split("T")[0]}`));

    // Attendance today — small dataset (single day)
    const todayAttendance = await db
      .select({ status: attendanceTable.status, cnt: count() })
      .from(attendanceTable)
      .where(and(eq(attendanceTable.companyId, companyId), sql`${attendanceTable.date} = ${today}`))
      .groupBy(attendanceTable.status);

    let presentToday = 0, absentToday = 0, lateToday = 0;
    for (const row of todayAttendance) {
      if (row.status === "present") presentToday = Number(row.cnt);
      if (row.status === "absent") absentToday = Number(row.cnt);
      if (row.status === "late") lateToday = Number(row.cnt);
    }
    const attendanceRate = activeEmployees > 0 ? Math.round(((presentToday + lateToday) / Math.max(1, activeEmployees)) * 100) : 0;

    // Documents
    const [{ totalDocuments }] = await db.select({ totalDocuments: count() }).from(documentsTable).where(eq(documentsTable.companyId, companyId));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [{ recentUploads }] = await db.select({ recentUploads: count() }).from(documentsTable).where(and(eq(documentsTable.companyId, companyId), sql`${documentsTable.createdAt} >= ${sevenDaysAgo.toISOString()}`));

    // Announcements — single query for urgent + total, then one query for read count
    const annAgg = await db
      .select({ priority: announcementsTable.priority, cnt: count(), id: announcementsTable.id })
      .from(announcementsTable)
      .where(eq(announcementsTable.companyId, companyId))
      .groupBy(announcementsTable.priority, announcementsTable.id);

    const allAnnIds = annAgg.map(r => r.id);
    let totalActive = 0, urgentCount = 0;
    for (const row of annAgg) {
      totalActive++;
      if (row.priority === "urgent") urgentCount++;
    }

    let unreadCount = totalActive;
    if (allAnnIds.length > 0) {
      const [{ readCount }] = await db
        .select({ readCount: count() })
        .from(announcementReadsTable)
        .where(and(eq(announcementReadsTable.userId, userId), inArray(announcementReadsTable.announcementId, allAnnIds)));
      unreadCount = totalActive - Number(readCount);
    }

    // Invoice trend (last 6 months) — limited date range query
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const trendInvoices = await db
      .select({ issueDate: invoicesTable.issueDate, status: invoicesTable.status, amount: invoicesTable.amount })
      .from(invoicesTable)
      .where(and(eq(invoicesTable.companyId, companyId), sql`${invoicesTable.issueDate} >= ${sixMonthsAgo.toISOString().split("T")[0]}`));

    const months = getLast6MonthsLabels().map(({ monthStr, label }) => {
      const monthInvoices = trendInvoices.filter(inv => inv.issueDate.startsWith(monthStr));
      return {
        month: label,
        paid: monthInvoices.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.amount), 0),
        pending: monthInvoices.filter(i => i.status === "pending").reduce((s, i) => s + parseFloat(i.amount), 0),
        overdue: monthInvoices.filter(i => i.status === "overdue").reduce((s, i) => s + parseFloat(i.amount), 0),
      };
    });

    return res.json({
      finance: { totalPending, totalOverdue, totalPaid, invoiceCount, overdueCount, upcomingCount },
      hr: { totalEmployees, activeEmployees, onLeaveEmployees, newThisMonth: Number(newThisMonth) },
      attendance: { presentToday, absentToday, lateToday, attendanceRate },
      documents: { totalDocuments: Number(totalDocuments), recentUploads: Number(recentUploads) },
      announcements: { totalActive, unreadCount, urgentCount },
      invoiceTrend: months,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/companies/:companyId/dashboard/alerts", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const alerts: Array<{
      id: string; type: string; title: string; message: string;
      severity: string; entityId: number | null; entityType: string | null; createdAt: string;
    }> = [];

    const overdueInvoices = await db.select({ id: invoicesTable.id, invoiceNumber: invoicesTable.invoiceNumber, amount: invoicesTable.amount })
      .from(invoicesTable).where(and(eq(invoicesTable.companyId, companyId), eq(invoicesTable.status, "overdue")));
    overdueInvoices.slice(0, 5).forEach(inv => {
      alerts.push({
        id: `inv-overdue-${inv.id}`,
        type: "invoice_overdue",
        title: "Factura vencida",
        message: `Factura #${inv.invoiceNumber} por S/ ${parseFloat(inv.amount).toLocaleString()} está vencida`,
        severity: "error",
        entityId: inv.id,
        entityType: "invoice",
        createdAt: new Date().toISOString(),
      });
    });

    const urgentAnn = await db.select().from(announcementsTable).where(and(eq(announcementsTable.companyId, companyId), eq(announcementsTable.priority, "urgent")));
    urgentAnn.slice(0, 3).forEach(ann => {
      alerts.push({
        id: `ann-urgent-${ann.id}`,
        type: "general",
        title: "Comunicado urgente",
        message: ann.title,
        severity: "warning",
        entityId: ann.id,
        entityType: "announcement",
        createdAt: ann.createdAt.toISOString(),
      });
    });

    return res.json(alerts);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/companies/:companyId/dashboard/activity", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const limit = parseInt((req.query as Record<string, string>).limit || "20");

    const recentInvoices = await db.select().from(invoicesTable).where(eq(invoicesTable.companyId, companyId)).orderBy(sql`${invoicesTable.createdAt} DESC`).limit(5);
    const recentEmployees = await db.select().from(employeesTable).where(eq(employeesTable.companyId, companyId)).orderBy(sql`${employeesTable.createdAt} DESC`).limit(5);
    const recentAnn = await db.select().from(announcementsTable).where(eq(announcementsTable.companyId, companyId)).orderBy(sql`${announcementsTable.createdAt} DESC`).limit(5);
    const recentDocs = await db.select().from(documentsTable).where(eq(documentsTable.companyId, companyId)).orderBy(sql`${documentsTable.createdAt} DESC`).limit(5);

    const activities = [
      ...recentInvoices.map(i => ({ id: `inv-${i.id}`, type: "invoice_created", action: "Factura registrada", entityName: `#${i.invoiceNumber}`, performedBy: "Admin", module: "finance", createdAt: i.createdAt.toISOString() })),
      ...recentEmployees.map(e => ({ id: `emp-${e.id}`, type: "employee_added", action: "Empleado registrado", entityName: `${e.firstName} ${e.lastName}`, performedBy: "Admin", module: "hr", createdAt: e.createdAt.toISOString() })),
      ...recentAnn.map(a => ({ id: `ann-${a.id}`, type: "announcement_published", action: "Comunicado publicado", entityName: a.title, performedBy: a.publishedBy, module: "announcements", createdAt: a.createdAt.toISOString() })),
      ...recentDocs.map(d => ({ id: `doc-${d.id}`, type: "document_uploaded", action: "Documento subido", entityName: d.title, performedBy: d.uploadedBy, module: "documents", createdAt: d.createdAt.toISOString() })),
    ];

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json(activities.slice(0, limit));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
