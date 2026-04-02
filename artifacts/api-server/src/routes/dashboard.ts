import { Router } from "express";
import { db, invoicesTable, employeesTable, attendanceTable, documentsTable, announcementsTable, announcementReadsTable } from "@workspace/db";
import { eq, and, count, sum, sql, gte, lte } from "drizzle-orm";

const router = Router();

router.get("/companies/:companyId/dashboard/summary", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const session = req.session as { userId?: number } | null;
    const userId = session?.userId ?? 1;
    const today = new Date().toISOString().split("T")[0];

    // Finance metrics
    const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.companyId, companyId));
    const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.amount), 0);
    const overdueCount = invoices.filter(i => i.status === "overdue").length;
    const upcomingCount = invoices.filter(i => i.status === "scheduled").length;

    // HR metrics
    const employees = await db.select().from(employeesTable).where(eq(employeesTable.companyId, companyId));
    const activeEmployees = employees.filter(e => e.status === "active").length;
    const onLeaveEmployees = employees.filter(e => e.status === "on_leave").length;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = employees.filter(e => new Date(e.startDate) >= thisMonth).length;

    // Attendance today
    const todayAttendance = await db.select().from(attendanceTable).where(
      and(eq(attendanceTable.companyId, companyId), sql`${attendanceTable.date} = ${today}`)
    );
    const presentToday = todayAttendance.filter(a => a.status === "present").length;
    const absentToday = todayAttendance.filter(a => a.status === "absent").length;
    const lateToday = todayAttendance.filter(a => a.status === "late").length;
    const attendanceRate = activeEmployees > 0 ? Math.round(((presentToday + lateToday) / Math.max(1, activeEmployees)) * 100) : 0;

    // Documents
    const [{ value: totalDocuments }] = await db.select({ value: count() }).from(documentsTable).where(eq(documentsTable.companyId, companyId));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDocs = await db.select().from(documentsTable).where(and(eq(documentsTable.companyId, companyId), sql`${documentsTable.createdAt} >= ${sevenDaysAgo.toISOString()}`));

    // Announcements
    const allAnnouncements = await db.select().from(announcementsTable).where(eq(announcementsTable.companyId, companyId));
    const urgentCount = allAnnouncements.filter(a => a.priority === "urgent").length;
    const unreadCount = await Promise.all(allAnnouncements.map(async (a) => {
      const r = await db.query.announcementReadsTable.findFirst({ where: and(eq(announcementReadsTable.announcementId, a.id), eq(announcementReadsTable.userId, userId)) });
      return !r;
    })).then(arr => arr.filter(Boolean).length);

    // Invoice trend (last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().substring(0, 7);
      const monthLabel = d.toLocaleString("es-PE", { month: "short", year: "numeric" });
      const monthInvoices = invoices.filter(inv => inv.issueDate.startsWith(monthStr));
      months.push({
        month: monthLabel,
        paid: monthInvoices.filter(inv => inv.status === "paid").reduce((s, inv) => s + parseFloat(inv.amount), 0),
        pending: monthInvoices.filter(inv => inv.status === "pending").reduce((s, inv) => s + parseFloat(inv.amount), 0),
        overdue: monthInvoices.filter(inv => inv.status === "overdue").reduce((s, inv) => s + parseFloat(inv.amount), 0),
      });
    }

    return res.json({
      finance: { totalPending, totalOverdue, totalPaid, invoiceCount: invoices.length, overdueCount, upcomingCount },
      hr: { totalEmployees: employees.length, activeEmployees, onLeaveEmployees, newThisMonth },
      attendance: { presentToday, absentToday, lateToday, attendanceRate },
      documents: { totalDocuments: Number(totalDocuments), recentUploads: recentDocs.length },
      announcements: { totalActive: allAnnouncements.length, unreadCount, urgentCount },
      invoiceTrend: months,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:companyId/dashboard/alerts", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const today = new Date().toISOString().split("T")[0];
    const alerts: Array<{
      id: string; type: string; title: string; message: string;
      severity: string; entityId: number | null; entityType: string | null; createdAt: string;
    }> = [];

    // Overdue invoices
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

    // Announcements urgent
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
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:companyId/dashboard/activity", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const limit = parseInt((req.query as Record<string, string>).limit || "20");

    // Combine recent items from various tables for activity feed
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
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
