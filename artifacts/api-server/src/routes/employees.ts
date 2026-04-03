import { Router } from "express";
import { db, employeesTable, attendanceTable, documentsTable, announcementsTable } from "@workspace/db";
import { eq, and, ilike, or, count, sql } from "drizzle-orm";
import { CreateEmployeeBody, UpdateEmployeeBody } from "@workspace/api-zod";

const router = Router();

router.get("/companies/:companyId/employees", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
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
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/companies/:companyId/employees", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
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
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:companyId/employees/:employeeId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) return res.status(400).json({ error: "ID de empleado inválido" });

    const employee = await db.query.employeesTable.findFirst({
      where: and(eq(employeesTable.id, employeeId), eq(employeesTable.companyId, companyId)),
    });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // Attendance summary
    const attendanceRecords = await db.select().from(attendanceTable).where(
      and(eq(attendanceTable.employeeId, employeeId), eq(attendanceTable.companyId, companyId))
    );
    const presentDays = attendanceRecords.filter(a => a.status === "present").length;
    const absentDays = attendanceRecords.filter(a => a.status === "absent").length;
    const lateDays = attendanceRecords.filter(a => a.status === "late").length;
    const hoursWorked = attendanceRecords.reduce((sum, a) => sum + parseFloat(a.hoursWorked || "0"), 0);

    // Document count
    const [{ value: docCount }] = await db.select({ value: count() }).from(documentsTable).where(
      and(eq(documentsTable.employeeId, employeeId), eq(documentsTable.companyId, companyId))
    );

    // Recent announcements
    const announcements = await db.select().from(announcementsTable).where(eq(announcementsTable.companyId, companyId)).orderBy(sql`${announcementsTable.createdAt} DESC`).limit(3);

    return res.json({
      ...employee,
      startDate: employee.startDate,
      createdAt: employee.createdAt.toISOString(),
      attendanceSummary: { presentDays, absentDays, lateDays, hoursWorked },
      recentAnnouncements: announcements.map(a => ({
        ...a, readCount: 0, isRead: false, createdAt: a.createdAt.toISOString()
      })),
      documentCount: Number(docCount),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/companies/:companyId/employees/:employeeId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
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
    if (!employee) return res.status(404).json({ error: "Not found" });
    return res.json({ ...employee, startDate: employee.startDate, createdAt: employee.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/companies/:companyId/employees/:employeeId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) return res.status(400).json({ error: "ID de empleado inválido" });
    await db.delete(employeesTable).where(and(eq(employeesTable.id, employeeId), eq(employeesTable.companyId, companyId)));
    return res.json({ message: "Employee deleted" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
