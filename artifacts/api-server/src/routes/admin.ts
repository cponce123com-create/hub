import { Router } from "express";
import { db, companiesTable, usersTable, employeesTable, invoicesTable } from "@workspace/db";
import { eq, count, ne } from "drizzle-orm";
import { requireSuperAdmin } from "../middlewares/requireAuth";

const router = Router();

router.get("/admin/companies", requireSuperAdmin, async (req, res) => {
  try {
    const companies = await db.query.companiesTable.findMany({
      where: ne(companiesTable.ruc, "00000000000"),
      orderBy: (t, { asc }) => asc(t.name),
    });

    const result = await Promise.all(
      companies.map(async (company) => {
        const [empRow] = await db
          .select({ total: count() })
          .from(employeesTable)
          .where(eq(employeesTable.companyId, company.id));

        const [invRow] = await db
          .select({ total: count() })
          .from(invoicesTable)
          .where(eq(invoicesTable.companyId, company.id));

        const [userRow] = await db
          .select({ total: count() })
          .from(usersTable)
          .where(eq(usersTable.companyId, company.id));

        return {
          id: company.id,
          name: company.name,
          ruc: company.ruc,
          industry: company.industry,
          currency: company.currency,
          address: company.address,
          email: company.email,
          phone: company.phone,
          activeModules: company.activeModules,
          createdAt: company.createdAt.toISOString(),
          stats: {
            employees: empRow?.total ?? 0,
            invoices: invRow?.total ?? 0,
            users: userRow?.total ?? 0,
          },
        };
      })
    );

    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
