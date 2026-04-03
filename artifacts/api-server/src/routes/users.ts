import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import { CreateUserBody, UpdateUserBody } from "@workspace/api-zod";

const router = Router();

router.get("/companies/:companyId/users", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const users = await db.select().from(usersTable).where(eq(usersTable.companyId, companyId)).orderBy(usersTable.name);
    return res.json(users.map(u => ({
      id: u.id, email: u.email, name: u.name, role: u.role, companyId: u.companyId, isActive: u.isActive, createdAt: u.createdAt.toISOString()
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/companies/:companyId/users", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const parsed = CreateUserBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const { email, name, role, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({
      companyId, email, name, passwordHash, role: role || "employee", isActive: true,
    }).returning();
    return res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId, isActive: user.isActive, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/companies/:companyId/users/:userId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const userId = parseInt(req.params.userId);
    const parsed = UpdateUserBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const { name, role, isActive } = parsed.data;
    const [user] = await db.update(usersTable).set({ name, role, isActive }).where(and(eq(usersTable.id, userId), eq(usersTable.companyId, companyId))).returning();
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.json({ id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId, isActive: user.isActive, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/companies/:companyId/users/:userId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const userId = parseInt(req.params.userId);
    await db.delete(usersTable).where(and(eq(usersTable.id, userId), eq(usersTable.companyId, companyId)));
    return res.json({ message: "User deleted" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
