import { Router } from "express";
import { db, attendanceTable, employeesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { CreateAttendanceBody, UpdateAttendanceBody } from "@workspace/api-zod";

const router = Router();

router.get("/companies/:companyId/attendance", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const { employeeId, startDate, endDate, area, status } = req.query as Record<string, string>;
    const limit = Math.min(parseInt((req.query.limit as string) || "50"), 200);
    const offset = parseInt((req.query.offset as string) || "0");

    const conditions = [eq(attendanceTable.companyId, companyId)];
    if (employeeId) conditions.push(eq(attendanceTable.employeeId, parseInt(employeeId)));
    if (startDate) conditions.push(sql`${attendanceTable.date} >= ${startDate}`);
    if (endDate) conditions.push(sql`${attendanceTable.date} <= ${endDate}`);
    if (status) conditions.push(eq(attendanceTable.status, status));

    const records = await db
      .select({ att: attendanceTable, firstName: employeesTable.firstName, lastName: employeesTable.lastName, area: employeesTable.area })
      .from(attendanceTable)
      .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
      .where(and(...conditions))
      .orderBy(sql`${attendanceTable.date} DESC`)
      .limit(limit)
      .offset(offset);

    const filtered = area ? records.filter(r => r.area === area) : records;

    return res.json(filtered.map(r => ({
      ...r.att,
      employeeName: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
      area: r.area ?? "",
      hoursWorked: r.att.hoursWorked ? parseFloat(r.att.hoursWorked) : null,
      overtime: r.att.overtime ? parseFloat(r.att.overtime) : null,
      createdAt: r.att.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/companies/:companyId/attendance", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const parsed = CreateAttendanceBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const body = parsed.data;
    let hoursWorked: string | null = null;
    if (body.checkIn && body.checkOut) {
      const [inH, inM] = body.checkIn.split(":").map(Number);
      const [outH, outM] = body.checkOut.split(":").map(Number);
      const hours = (outH * 60 + outM - inH * 60 - inM) / 60;
      hoursWorked = Math.max(0, hours).toFixed(2);
    }
    const [att] = await db.insert(attendanceTable).values({
      companyId,
      employeeId: body.employeeId,
      date: body.date,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      hoursWorked,
      status: body.status || "present",
      notes: body.notes,
    }).returning();
    const emp = await db.query.employeesTable.findFirst({ where: eq(employeesTable.id, body.employeeId) });
    return res.status(201).json({
      ...att,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
      area: emp?.area ?? "",
      hoursWorked: att.hoursWorked ? parseFloat(att.hoursWorked) : null,
      overtime: att.overtime ? parseFloat(att.overtime) : null,
      createdAt: att.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/companies/:companyId/attendance/:attendanceId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const attendanceId = parseInt(req.params.attendanceId);
    if (isNaN(attendanceId)) return res.status(400).json({ error: "ID de registro inválido" });
    const parsed = UpdateAttendanceBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors });
    }
    const body = parsed.data;
    const updates: Record<string, unknown> = {};
    if (body.checkIn !== undefined) updates.checkIn = body.checkIn;
    if (body.checkOut !== undefined) updates.checkOut = body.checkOut;
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.checkIn && body.checkOut) {
      const [inH, inM] = body.checkIn.split(":").map(Number);
      const [outH, outM] = body.checkOut.split(":").map(Number);
      updates.hoursWorked = Math.max(0, (outH * 60 + outM - inH * 60 - inM) / 60).toFixed(2);
    }
    const [att] = await db.update(attendanceTable).set(updates).where(and(eq(attendanceTable.id, attendanceId), eq(attendanceTable.companyId, companyId))).returning();
    if (!att) return res.status(404).json({ error: "Not found" });
    const emp = await db.query.employeesTable.findFirst({ where: eq(employeesTable.id, att.employeeId) });
    return res.json({
      ...att,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
      area: emp?.area ?? "",
      hoursWorked: att.hoursWorked ? parseFloat(att.hoursWorked) : null,
      overtime: att.overtime ? parseFloat(att.overtime) : null,
      createdAt: att.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/companies/:companyId/attendance/:attendanceId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const attendanceId = parseInt(req.params.attendanceId);
    if (isNaN(attendanceId)) return res.status(400).json({ error: "ID de registro inválido" });
    await db.delete(attendanceTable).where(and(eq(attendanceTable.id, attendanceId), eq(attendanceTable.companyId, companyId)));
    return res.json({ message: "Record deleted" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
