import { Router } from "express";
import { db, companiesTable, employeesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { CreateCompanyBody, UpdateCompanyBody } from "@workspace/api-zod";

const router = Router();

router.get("/companies", async (req, res) => {
  try {
    const companies = await db.select().from(companiesTable).orderBy(companiesTable.name);
    const result = await Promise.all(
      companies.map(async (c) => {
        const [{ value }] = await db.select({ value: count() }).from(employeesTable).where(eq(employeesTable.companyId, c.id));
        return {
          ...c,
          activeModules: c.activeModules ?? [],
          employeeCount: Number(value),
          createdAt: c.createdAt.toISOString(),
        };
      })
    );
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/companies", async (req, res) => {
  try {
    const parsed = CreateCompanyBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const { name, ruc, currency, industry, address, email, phone, activeModules } = parsed.data;
    const [company] = await db.insert(companiesTable).values({
      name,
      ruc,
      currency,
      industry,
      address,
      email,
      phone,
      activeModules: activeModules ?? ["finance", "hr", "attendance", "documents", "announcements"],
    }).returning();
    return res.status(201).json({
      ...company,
      activeModules: company.activeModules ?? [],
      employeeCount: 0,
      createdAt: company.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:companyId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const company = await db.query.companiesTable.findFirst({ where: eq(companiesTable.id, companyId) });
    if (!company) return res.status(404).json({ error: "Company not found" });
    const [{ value }] = await db.select({ value: count() }).from(employeesTable).where(eq(employeesTable.companyId, companyId));
    return res.json({
      ...company,
      activeModules: company.activeModules ?? [],
      employeeCount: Number(value),
      createdAt: company.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/companies/:companyId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const parsed = UpdateCompanyBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const { name, ruc, currency, industry, address, email, phone, activeModules } = parsed.data;
    const [company] = await db.update(companiesTable).set({
      name, ruc, currency, industry, address, email, phone, activeModules,
    }).where(eq(companiesTable.id, companyId)).returning();
    if (!company) return res.status(404).json({ error: "Not found" });
    const [{ value }] = await db.select({ value: count() }).from(employeesTable).where(eq(employeesTable.companyId, companyId));
    return res.json({ ...company, activeModules: company.activeModules ?? [], employeeCount: Number(value), createdAt: company.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
