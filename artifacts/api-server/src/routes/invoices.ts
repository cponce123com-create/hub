import { Router } from "express";
import { db, invoicesTable, suppliersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { CreateInvoiceBody, UpdateInvoiceBody } from "@workspace/api-zod";

const router = Router();

router.get("/companies/:companyId/invoices", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const { status, supplierId, startDate, endDate } = req.query as Record<string, string>;
    const limit = Math.min(parseInt((req.query.limit as string) || "50"), 200);
    const offset = parseInt((req.query.offset as string) || "0");

    const conditions = [eq(invoicesTable.companyId, companyId)];
    if (status) conditions.push(eq(invoicesTable.status, status));
    if (supplierId) conditions.push(eq(invoicesTable.supplierId, parseInt(supplierId)));
    if (startDate) conditions.push(sql`${invoicesTable.issueDate} >= ${startDate}`);
    if (endDate) conditions.push(sql`${invoicesTable.issueDate} <= ${endDate}`);

    const invoices = await db
      .select({ invoice: invoicesTable, supplierName: suppliersTable.name })
      .from(invoicesTable)
      .leftJoin(suppliersTable, eq(invoicesTable.supplierId, suppliersTable.id))
      .where(and(...conditions))
      .orderBy(sql`${invoicesTable.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return res.json(invoices.map(({ invoice, supplierName }) => ({
      ...invoice,
      amount: parseFloat(invoice.amount),
      supplierName: supplierName ?? "Unknown",
      createdAt: invoice.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/companies/:companyId/invoices", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const parsed = CreateInvoiceBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const body = parsed.data;
    const [invoice] = await db.insert(invoicesTable).values({
      companyId,
      supplierId: body.supplierId,
      invoiceNumber: body.invoiceNumber,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      amount: body.amount.toString(),
      currency: body.currency || "PEN",
      status: body.status || "pending",
      category: body.category,
      costCenter: body.costCenter,
      notes: body.notes,
      fileUrl: body.fileUrl,
    }).returning();
    const supplier = await db.query.suppliersTable.findFirst({ where: eq(suppliersTable.id, body.supplierId) });
    return res.status(201).json({
      ...invoice,
      amount: parseFloat(invoice.amount),
      supplierName: supplier?.name ?? "Unknown",
      createdAt: invoice.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:companyId/invoices/:invoiceId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const invoiceId = parseInt(req.params.invoiceId);
    if (isNaN(invoiceId)) return res.status(400).json({ error: "ID de factura inválido" });
    const [result] = await db
      .select({ invoice: invoicesTable, supplierName: suppliersTable.name })
      .from(invoicesTable)
      .leftJoin(suppliersTable, eq(invoicesTable.supplierId, suppliersTable.id))
      .where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.companyId, companyId)));
    if (!result) return res.status(404).json({ error: "Not found" });
    return res.json({ ...result.invoice, amount: parseFloat(result.invoice.amount), supplierName: result.supplierName ?? "Unknown", createdAt: result.invoice.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/companies/:companyId/invoices/:invoiceId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const invoiceId = parseInt(req.params.invoiceId);
    if (isNaN(invoiceId)) return res.status(400).json({ error: "ID de factura inválido" });
    const parsed = UpdateInvoiceBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const body = parsed.data;
    const updates: Record<string, unknown> = {};
    if (body.supplierId !== undefined) updates.supplierId = body.supplierId;
    if (body.invoiceNumber !== undefined) updates.invoiceNumber = body.invoiceNumber;
    if (body.issueDate !== undefined) updates.issueDate = body.issueDate;
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate;
    if (body.amount !== undefined) updates.amount = body.amount.toString();
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.status !== undefined) updates.status = body.status;
    if (body.category !== undefined) updates.category = body.category;
    if (body.costCenter !== undefined) updates.costCenter = body.costCenter;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.fileUrl !== undefined) updates.fileUrl = body.fileUrl;
    const [invoice] = await db.update(invoicesTable).set(updates).where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.companyId, companyId))).returning();
    if (!invoice) return res.status(404).json({ error: "Not found" });
    const supplier = await db.query.suppliersTable.findFirst({ where: eq(suppliersTable.id, invoice.supplierId) });
    return res.json({ ...invoice, amount: parseFloat(invoice.amount), supplierName: supplier?.name ?? "Unknown", createdAt: invoice.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/companies/:companyId/invoices/:invoiceId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const invoiceId = parseInt(req.params.invoiceId);
    if (isNaN(invoiceId)) return res.status(400).json({ error: "ID de factura inválido" });
    await db.delete(invoicesTable).where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.companyId, companyId)));
    return res.json({ message: "Invoice deleted" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
