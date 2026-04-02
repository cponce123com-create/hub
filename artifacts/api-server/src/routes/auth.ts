import { Router } from "express";
import { db, usersTable, companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Simple password check (demo: password is "password")
    const valid = password === "password" || user.passwordHash === password;
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const company = await db.query.companiesTable.findFirst({
      where: eq(companiesTable.id, user.companyId),
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    req.session = { userId: user.id, companyId: user.companyId };

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        companyName: company.name,
        avatar: user.avatar,
      },
      company: {
        id: company.id,
        name: company.name,
        ruc: company.ruc,
        logo: company.logo,
        currency: company.currency,
        industry: company.industry,
        address: company.address,
        email: company.email,
        phone: company.phone,
        activeModules: company.activeModules,
        employeeCount: 0,
        createdAt: company.createdAt.toISOString(),
      },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session = null;
  return res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res) => {
  try {
    const session = req.session as { userId?: number; companyId?: number } | null;
    if (!session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, session.userId),
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const company = await db.query.companiesTable.findFirst({
      where: eq(companiesTable.id, user.companyId),
    });

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      companyName: company?.name ?? "",
      avatar: user.avatar,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
