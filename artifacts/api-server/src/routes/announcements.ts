import { Router } from "express";
import { db, announcementsTable, announcementReadsTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";

const router = Router();

router.get("/companies/:companyId/announcements", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const { priority, area } = req.query as Record<string, string>;
    const session = req.session as { userId?: number } | null;
    const userId = session?.userId ?? 1;

    const conditions = [eq(announcementsTable.companyId, companyId)];
    if (priority) conditions.push(eq(announcementsTable.priority, priority));

    const announcements = await db.select().from(announcementsTable).where(and(...conditions)).orderBy(sql`${announcementsTable.createdAt} DESC`);

    const result = await Promise.all(announcements.map(async (a) => {
      const [{ value: readCount }] = await db.select({ value: count() }).from(announcementReadsTable).where(eq(announcementReadsTable.announcementId, a.id));
      const [readRecord] = await db.select().from(announcementReadsTable).where(and(eq(announcementReadsTable.announcementId, a.id), eq(announcementReadsTable.userId, userId)));
      return {
        ...a,
        readCount: Number(readCount),
        isRead: !!readRecord,
        createdAt: a.createdAt.toISOString(),
      };
    }));

    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/companies/:companyId/announcements", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const body = req.body;
    const [ann] = await db.insert(announcementsTable).values({
      companyId,
      title: body.title,
      content: body.content,
      priority: body.priority || "medium",
      targetType: body.targetType || "all",
      targetValue: body.targetValue,
      publishedBy: "Admin",
    }).returning();
    return res.status(201).json({ ...ann, readCount: 0, isRead: false, createdAt: ann.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/companies/:companyId/announcements/:announcementId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const announcementId = parseInt(req.params.announcementId);
    const body = req.body;
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.targetType !== undefined) updates.targetType = body.targetType;
    if (body.targetValue !== undefined) updates.targetValue = body.targetValue;
    const [ann] = await db.update(announcementsTable).set(updates).where(and(eq(announcementsTable.id, announcementId), eq(announcementsTable.companyId, companyId))).returning();
    if (!ann) return res.status(404).json({ error: "Not found" });
    const [{ value: readCount }] = await db.select({ value: count() }).from(announcementReadsTable).where(eq(announcementReadsTable.announcementId, announcementId));
    return res.json({ ...ann, readCount: Number(readCount), isRead: false, createdAt: ann.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/companies/:companyId/announcements/:announcementId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const announcementId = parseInt(req.params.announcementId);
    await db.delete(announcementReadsTable).where(eq(announcementReadsTable.announcementId, announcementId));
    await db.delete(announcementsTable).where(and(eq(announcementsTable.id, announcementId), eq(announcementsTable.companyId, companyId)));
    return res.json({ message: "Announcement deleted" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/companies/:companyId/announcements/:announcementId/read", async (req, res) => {
  try {
    const announcementId = parseInt(req.params.announcementId);
    const session = req.session as { userId?: number } | null;
    const userId = session?.userId ?? 1;
    const exists = await db.query.announcementReadsTable.findFirst({ where: and(eq(announcementReadsTable.announcementId, announcementId), eq(announcementReadsTable.userId, userId)) });
    if (!exists) {
      await db.insert(announcementReadsTable).values({ announcementId, userId });
    }
    return res.json({ message: "Marked as read" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
