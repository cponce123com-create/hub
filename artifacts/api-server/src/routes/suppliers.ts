import { Router } from "express";
import { db, suppliersTable, invoicesTable } from "@workspace/db";
import { eq, and, ilike, count, sum, sql } from "drizzle-orm";

const router = Router();

router.get("/companies/:companyId/suppliers", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const { search } = req.query as Record<string, string>;
    const limit = Math.min(parseInt((req.query.limit as string) || "50"), 200);
    const offset = parseInt((req.query.offset as string) || "0");
    const conditions = [eq(suppliersTable.companyId, companyId)];
    if (search) conditions.push(ilike(suppliersTable.name, `%${search}%`));
    const suppliers = await db.select().from(suppliersTable).where(and(...conditions)).orderBy(suppliersTable.name).limit(limit).offset(offset);
    const result = await Promise.all(suppliers.map(async (s) => {
      const invRows = await db.select({ cnt: count(), total: sum(invoicesTable.amount) }).from(invoicesTable).where(eq(invoicesTable.supplierId, s.id));
      return {
        ...s,
        invoiceCount: Number(invRows[0]?.cnt ?? 0),
        totalBilled: parseFloat(invRows[0]?.total ?? "0"),
        createdAt: s.createdAt.toISOString(),
      };
    }));
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/companies/:companyId/suppliers", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const body = req.body;
    const [supplier] = await db.insert(suppliersTable).values({ companyId, ...body }).returning();
    return res.status(201).json({ ...supplier, invoiceCount: 0, totalBilled: 0, createdAt: supplier.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:companyId/suppliers/:supplierId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const supplierId = parseInt(req.params.supplierId);
    if (isNaN(supplierId)) return res.status(400).json({ error: "ID de proveedor inválido" });
    const supplier = await db.query.suppliersTable.findFirst({ where: and(eq(suppliersTable.id, supplierId), eq(suppliersTable.companyId, companyId)) });
    if (!supplier) return res.status(404).json({ error: "Not found" });
    const invRows = await db.select({ cnt: count(), total: sum(invoicesTable.amount) }).from(invoicesTable).where(eq(invoicesTable.supplierId, supplierId));
    return res.json({ ...supplier, invoiceCount: Number(invRows[0]?.cnt ?? 0), totalBilled: parseFloat(invRows[0]?.total ?? "0"), createdAt: supplier.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/companies/:companyId/suppliers/:supplierId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const supplierId = parseInt(req.params.supplierId);
    if (isNaN(supplierId)) return res.status(400).json({ error: "ID de proveedor inválido" });
    const body = req.body;
    const [supplier] = await db.update(suppliersTable).set(body).where(and(eq(suppliersTable.id, supplierId), eq(suppliersTable.companyId, companyId))).returning();
    if (!supplier) return res.status(404).json({ error: "Not found" });
    const invRows = await db.select({ cnt: count(), total: sum(invoicesTable.amount) }).from(invoicesTable).where(eq(invoicesTable.supplierId, supplierId));
    return res.json({ ...supplier, invoiceCount: Number(invRows[0]?.cnt ?? 0), totalBilled: parseFloat(invRows[0]?.total ?? "0"), createdAt: supplier.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/companies/:companyId/suppliers/:supplierId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const supplierId = parseInt(req.params.supplierId);
    if (isNaN(supplierId)) return res.status(400).json({ error: "ID de proveedor inválido" });
    await db.delete(suppliersTable).where(and(eq(suppliersTable.id, supplierId), eq(suppliersTable.companyId, companyId)));
    return res.json({ message: "Supplier deleted" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
