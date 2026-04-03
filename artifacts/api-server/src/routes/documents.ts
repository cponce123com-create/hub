import { Router } from "express";
import { db, documentsTable, employeesTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import { CreateDocumentBody } from "@workspace/api-zod";

const router = Router();

router.get("/companies/:companyId/documents", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
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
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/companies/:companyId/documents", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const parsed = CreateDocumentBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const body = parsed.data;
    const [doc] = await db.insert(documentsTable).values({
      companyId,
      employeeId: body.employeeId,
      title: body.title,
      category: body.category || "other",
      fileUrl: body.fileUrl,
      fileType: body.fileType,
      fileSize: body.fileSize,
      notes: body.notes,
      uploadedBy: (req.body as Record<string, string>).uploadedBy || "Admin",
    }).returning();
    return res.status(201).json({ ...doc, employeeName: null, createdAt: doc.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:companyId/documents/:documentId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const documentId = parseInt(req.params.documentId);
    if (isNaN(documentId)) return res.status(400).json({ error: "ID de documento inválido" });
    const [result] = await db
      .select({ doc: documentsTable, firstName: employeesTable.firstName, lastName: employeesTable.lastName })
      .from(documentsTable)
      .leftJoin(employeesTable, eq(documentsTable.employeeId, employeesTable.id))
      .where(and(eq(documentsTable.id, documentId), eq(documentsTable.companyId, companyId)));
    if (!result) return res.status(404).json({ error: "Not found" });
    return res.json({ ...result.doc, employeeName: result.firstName ? `${result.firstName} ${result.lastName}`.trim() : null, createdAt: result.doc.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/companies/:companyId/documents/:documentId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const documentId = parseInt(req.params.documentId);
    if (isNaN(documentId)) return res.status(400).json({ error: "ID de documento inválido" });
    await db.delete(documentsTable).where(and(eq(documentsTable.id, documentId), eq(documentsTable.companyId, companyId)));
    return res.json({ message: "Document deleted" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
