import { Router } from "express";
import { db, documentsTable, employeesTable, usersTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import { CreateDocumentBody } from "@workspace/api-zod";

const router = Router();

router.get("/companies/:companyId/documents", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const { category, employeeId, search } = req.query as Record<string, string>;
    const limit = Math.min(parseInt((req.query.limit as string) || "50"), 200);
    const offset = parseInt((req.query.offset as string) || "0");

    const conditions = [eq(documentsTable.companyId, companyId)];
    if (category) conditions.push(eq(documentsTable.category, category));
    if (employeeId) conditions.push(eq(documentsTable.employeeId, parseInt(employeeId)));
    if (search) conditions.push(ilike(documentsTable.title, `%${search}%`));

    const docs = await db
      .select({ doc: documentsTable, firstName: employeesTable.firstName, lastName: employeesTable.lastName })
      .from(documentsTable)
      .leftJoin(employeesTable, eq(documentsTable.employeeId, employeesTable.id))
      .where(and(...conditions))
      .orderBy(sql`${documentsTable.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return res.json(docs.map(({ doc, firstName, lastName }) => ({
      ...doc,
      employeeName: firstName ? `${firstName} ${lastName}`.trim() : null,
      createdAt: doc.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/companies/:companyId/documents", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const parsed = CreateDocumentBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const body = parsed.data;
    const sessionUser = req.session?.userId
      ? await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.session.userId) })
      : null;
    const [doc] = await db.insert(documentsTable).values({
      companyId,
      employeeId: body.employeeId,
      title: body.title,
      category: body.category || "other",
      fileUrl: body.fileUrl,
      fileType: body.fileType,
      fileSize: body.fileSize,
      notes: body.notes,
      uploadedBy: sessionUser?.name ?? "Admin",
    }).returning();
    return res.status(201).json({ ...doc, employeeName: null, createdAt: doc.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/companies/:companyId/documents/:documentId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const documentId = parseInt(req.params.documentId);
    if (isNaN(documentId)) return res.status(400).json({ error: "ID de documento inválido" });
    const [result] = await db
      .select({ doc: documentsTable, firstName: employeesTable.firstName, lastName: employeesTable.lastName })
      .from(documentsTable)
      .leftJoin(employeesTable, eq(documentsTable.employeeId, employeesTable.id))
      .where(and(eq(documentsTable.id, documentId), eq(documentsTable.companyId, companyId)));
    if (!result) return res.status(404).json({ error: "Documento no encontrado" });
    return res.json({ ...result.doc, employeeName: result.firstName ? `${result.firstName} ${result.lastName}`.trim() : null, createdAt: result.doc.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/companies/:companyId/documents/:documentId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const documentId = parseInt(req.params.documentId);
    if (isNaN(documentId)) return res.status(400).json({ error: "ID de documento inválido" });
    const [deleted] = await db.delete(documentsTable).where(and(eq(documentsTable.id, documentId), eq(documentsTable.companyId, companyId))).returning({ id: documentsTable.id });
    if (!deleted) return res.status(404).json({ error: "Documento no encontrado" });
    return res.json({ message: "Documento eliminado" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
