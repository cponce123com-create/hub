import { Router } from "express";
import { db, employeesTable, attendanceTable, documentsTable } from "@workspace/db";
import { eq, and, ilike, or, count, sql } from "drizzle-orm";
import { CreateEmployeeBody, UpdateEmployeeBody } from "@workspace/api-zod";

const router = Router();

router.get("/companies/:companyId/employees", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const { area, status, search } = req.query as Record<string, string>;
    const limit = Math.min(parseInt((req.query.limit as string) || "50"), 200);
    const offset = parseInt((req.query.offset as string) || "0");

    const conditions = [eq(employeesTable.companyId, companyId)];
    if (area) conditions.push(eq(employeesTable.area, area));
    if (status) conditions.push(eq(employeesTable.status, status));
    if (search) {
      conditions.push(
        or(
          ilike(employeesTable.firstName, `%${search}%`),
          ilike(employeesTable.lastName, `%${search}%`),
          ilike(employeesTable.documentId, `%${search}%`),
        )!,
      );
    }

    const employees = await db.select().from(employeesTable).where(and(...conditions)).orderBy(employeesTable.firstName).limit(limit).offset(offset);

    return res.json(employees.map(e => ({
      ...e,
      startDate: e.startDate,
      createdAt: e.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/companies/:companyId/employees", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const parsed = CreateEmployeeBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const body = parsed.data;
    const [employee] = await db.insert(employeesTable).values({
      companyId,
      firstName: body.firstName,
      lastName: body.lastName,
      documentId: body.documentId,
      position: body.position,
      area: body.area,
      site: body.site,
      contractType: body.contractType || "indefinite",
      status: body.status || "active",
      startDate: body.startDate,
      email: body.email,
      phone: body.phone,
      address: body.address,
      emergencyContact: body.emergencyContact,
      emergencyPhone: body.emergencyPhone,
      notes: body.notes,
    }).returning();
    return res.status(201).json({ ...employee, startDate: employee.startDate, createdAt: employee.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/companies/:companyId/employees/:employeeId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) return res.status(400).json({ error: "ID de empleado inválido" });

    const employee = await db.query.employeesTable.findFirst({
      where: and(eq(employeesTable.id, employeeId), eq(employeesTable.companyId, companyId)),
    });
    if (!employee) return res.status(404).json({ error: "Empleado no encontrado" });

    // Attendance summary via SQL aggregation
    const attAgg = await db
      .select({ status: attendanceTable.status, cnt: count(), hours: sql<string>`coalesce(sum(${attendanceTable.hoursWorked}), 0)` })
      .from(attendanceTable)
      .where(and(eq(attendanceTable.employeeId, employeeId), eq(attendanceTable.companyId, companyId)))
      .groupBy(attendanceTable.status);

    let presentDays = 0, absentDays = 0, lateDays = 0, hoursWorked = 0;
    for (const row of attAgg) {
      if (row.status === "present") { presentDays = Number(row.cnt); hoursWorked += parseFloat(row.hours); }
      else if (row.status === "absent" || row.status === "unjustified_absence") absentDays += Number(row.cnt);
      else if (row.status === "late") { lateDays = Number(row.cnt); hoursWorked += parseFloat(row.hours); }
      else hoursWorked += parseFloat(row.hours);
    }

    // Document count
    const [{ value: docCount }] = await db.select({ value: count() }).from(documentsTable).where(
      and(eq(documentsTable.employeeId, employeeId), eq(documentsTable.companyId, companyId))
    );

    return res.json({
      ...employee,
      startDate: employee.startDate,
      createdAt: employee.createdAt.toISOString(),
      attendanceSummary: { presentDays, absentDays, lateDays, hoursWorked },
      documentCount: Number(docCount),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/companies/:companyId/employees/:employeeId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) return res.status(400).json({ error: "ID de empleado inválido" });
    const parsed = UpdateEmployeeBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const body = parsed.data;
    const [employee] = await db.update(employeesTable).set({
      firstName: body.firstName, lastName: body.lastName, position: body.position,
      area: body.area, site: body.site, contractType: body.contractType,
      status: body.status, email: body.email, phone: body.phone,
      address: body.address, emergencyContact: body.emergencyContact,
      emergencyPhone: body.emergencyPhone, notes: body.notes,
    }).where(and(eq(employeesTable.id, employeeId), eq(employeesTable.companyId, companyId))).returning();
    if (!employee) return res.status(404).json({ error: "Empleado no encontrado" });
    return res.json({ ...employee, startDate: employee.startDate, createdAt: employee.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/companies/:companyId/employees/:employeeId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: "ID de empresa inválido" });
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) return res.status(400).json({ error: "ID de empleado inválido" });
    const [deleted] = await db.delete(employeesTable).where(and(eq(employeesTable.id, employeeId), eq(employeesTable.companyId, companyId))).returning({ id: employeesTable.id });
    if (!deleted) return res.status(404).json({ error: "Empleado no encontrado" });
    return res.json({ message: "Empleado eliminado" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
