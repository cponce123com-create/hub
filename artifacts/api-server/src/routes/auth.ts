import { Router } from "express";
import { db, usersTable, companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
});

router.post("/auth/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña son requeridos" });
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const company = await db.query.companiesTable.findFirst({
      where: eq(companiesTable.id, user.companyId),
    });

    if (!company) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    req.session.userId = user.id;
    req.session.companyId = user.companyId;
    req.session.role = user.role;
    await new Promise<void>((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve())),
    );

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
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) req.log.error(err);
    res.clearCookie("connect.sid");
    return res.json({ message: "Sesión cerrada" });
  });
});

router.get("/auth/me", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
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
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
