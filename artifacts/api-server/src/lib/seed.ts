import { db } from "@workspace/db";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import {
  companiesTable,
  usersTable,
  employeesTable,
  suppliersTable,
  invoicesTable,
  attendanceTable,
  documentsTable,
  announcementsTable,
} from "@workspace/db";

export async function ensureSuperAdmin() {
  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, "superadmin@controlhub.io"),
  });
  if (existing) return;

  const passwordHash = await bcrypt.hash("Admin2024!", 12);

  let platformCompany = await db.query.companiesTable.findFirst({
    where: eq(companiesTable.ruc, "00000000000"),
  });

  if (!platformCompany) {
    const [created] = await db
      .insert(companiesTable)
      .values({
        name: "ControlHub Platform",
        ruc: "00000000000",
        currency: "PEN",
        industry: "Plataforma SaaS",
        address: "Lima, Perú",
        email: "admin@controlhub.io",
        phone: "+51 1 000-0000",
        activeModules: ["finance", "hr", "attendance", "documents", "announcements"],
      })
      .returning();
    platformCompany = created!;
  }

  await db.insert(usersTable).values({
    companyId: platformCompany.id,
    email: "superadmin@controlhub.io",
    name: "Super Administrador",
    passwordHash,
    role: "superadmin",
  });
}

export async function seedIfEmpty() {
  const existing = await db.query.companiesTable.findFirst({
    where: eq(companiesTable.ruc, "20123456789"),
  });
  if (existing) return;

  const passwordHash = await bcrypt.hash("password", 12);

  const [company] = await db
    .insert(companiesTable)
    .values({
      name: "Minera Andina SAC",
      ruc: "20123456789",
      currency: "PEN",
      industry: "Minería",
      address: "Av. Javier Prado Este 2400, San Borja, Lima",
      email: "contacto@mineraandina.pe",
      phone: "+51 1 234-5678",
      activeModules: ["finance", "hr", "attendance", "documents", "announcements"],
    })
    .returning();

  await db.insert(usersTable).values([
    {
      companyId: company.id,
      email: "admin@mineraandina.pe",
      name: "Carlos Mendoza",
      passwordHash,
      role: "admin",
    },
    {
      companyId: company.id,
      email: "rrhh@mineraandina.pe",
      name: "Ana Torres",
      passwordHash,
      role: "hr",
    },
    {
      companyId: company.id,
      email: "finanzas@mineraandina.pe",
      name: "Luis García",
      passwordHash,
      role: "finance",
    },
  ]);

  const [s1, s2] = await db
    .insert(suppliersTable)
    .values([
      {
        companyId: company.id,
        name: "Ferreycorp SAA",
        ruc: "20100128056",
        contactName: "Jorge Huamani",
        email: "ventas@ferreycorp.pe",
        phone: "+51 1 200-1000",
        address: "Av. Argentina 5390, Callao",
        notes: "Proveedor de maquinaria pesada",
      },
      {
        companyId: company.id,
        name: "Sodimac Peru SA",
        ruc: "20349598474",
        contactName: "Maria Reyes",
        email: "empresas@sodimac.com.pe",
        phone: "+51 1 611-1000",
        address: "Av. Universitaria 3351, Lima",
        notes: "Proveedor de materiales de construcción",
      },
    ])
    .returning();

  await db.insert(invoicesTable).values([
    {
      companyId: company.id,
      supplierId: s1.id,
      invoiceNumber: "F001-000123",
      notes: "Alquiler de excavadora CAT 390",
      amount: "85000.00",
      currency: "PEN",
      status: "pending",
      issueDate: "2024-01-15",
      dueDate: "2024-02-15",
    },
    {
      companyId: company.id,
      supplierId: s2.id,
      invoiceNumber: "F002-000456",
      notes: "Materiales de construcción - Lote #47",
      amount: "12500.00",
      currency: "PEN",
      status: "paid",
      issueDate: "2024-01-10",
      dueDate: "2024-02-10",
    },
    {
      companyId: company.id,
      supplierId: s1.id,
      invoiceNumber: "F001-000089",
      notes: "Mantenimiento preventivo maquinaria pesada",
      amount: "4800.00",
      currency: "USD",
      status: "overdue",
      issueDate: "2023-12-01",
      dueDate: "2024-01-01",
    },
    {
      companyId: company.id,
      supplierId: s2.id,
      invoiceNumber: "F002-000312",
      notes: "EPP y equipos de seguridad - 50 unidades",
      amount: "9200.00",
      currency: "PEN",
      status: "approved",
      issueDate: "2024-01-20",
      dueDate: "2024-02-20",
    },
  ]);

  const [e1, e2, e3, e4] = await db
    .insert(employeesTable)
    .values([
      {
        companyId: company.id,
        firstName: "Roberto",
        lastName: "Huanca Quispe",
        documentId: "42381956",
        position: "Operador de Maquinaria",
        area: "Operaciones",
        site: "Unidad Minera Norte",
        contractType: "indefinite",
        status: "active",
        startDate: "2021-03-15",
        email: "r.huanca@mineraandina.pe",
        phone: "+51 987 654 321",
      },
      {
        companyId: company.id,
        firstName: "Carmen",
        lastName: "Vasquez Flores",
        documentId: "47293810",
        position: "Contadora Senior",
        area: "Finanzas",
        site: "Oficina Lima",
        contractType: "indefinite",
        status: "active",
        startDate: "2019-07-01",
        email: "c.vasquez@mineraandina.pe",
        phone: "+51 976 543 210",
      },
      {
        companyId: company.id,
        firstName: "Pedro",
        lastName: "Condori Mamani",
        documentId: "43920175",
        position: "Técnico en Geología",
        area: "Geología",
        site: "Unidad Minera Sur",
        contractType: "fixed",
        status: "active",
        startDate: "2022-01-10",
        email: "p.condori@mineraandina.pe",
        phone: "+51 965 432 109",
      },
      {
        companyId: company.id,
        firstName: "Silvia",
        lastName: "Mamani Apaza",
        documentId: "48107364",
        position: "Jefa de Recursos Humanos",
        area: "RRHH",
        site: "Oficina Lima",
        contractType: "indefinite",
        status: "active",
        startDate: "2020-04-20",
        email: "s.mamani@mineraandina.pe",
        phone: "+51 954 321 098",
      },
    ])
    .returning();

  const today = new Date().toISOString().split("T")[0]!;
  await db.insert(attendanceTable).values([
    { companyId: company.id, employeeId: e1.id, date: today, status: "present", checkIn: "07:55", checkOut: "17:10", hoursWorked: "9.25" },
    { companyId: company.id, employeeId: e2.id, date: today, status: "present", checkIn: "08:02", checkOut: "17:30", hoursWorked: "9.47" },
    { companyId: company.id, employeeId: e3.id, date: today, status: "late", checkIn: "08:45", checkOut: "17:00", hoursWorked: "8.25" },
    { companyId: company.id, employeeId: e4.id, date: today, status: "absent" },
  ]);

  await db.insert(documentsTable).values([
    {
      companyId: company.id,
      title: "Reglamento Interno de Trabajo 2024",
      category: "RRHH",
      fileUrl: "#",
      fileType: "pdf",
      fileSize: 2458624,
      uploadedBy: "Carlos Mendoza",
      notes: "Versión actualizada del reglamento interno de la empresa.",
    },
    {
      companyId: company.id,
      title: "Balance General - Diciembre 2023",
      category: "Finanzas",
      fileUrl: "#",
      fileType: "xlsx",
      fileSize: 845000,
      uploadedBy: "Carlos Mendoza",
      notes: "Estados financieros auditados del ejercicio 2023.",
    },
    {
      companyId: company.id,
      title: "Contrato Marco - Ferreycorp 2024",
      category: "Legal",
      fileUrl: "#",
      fileType: "pdf",
      fileSize: 1234567,
      uploadedBy: "Carlos Mendoza",
      notes: "Contrato de servicios con proveedor estratégico.",
    },
    {
      companyId: company.id,
      title: "Manual de Seguridad en Operaciones Mineras",
      category: "Seguridad",
      fileUrl: "#",
      fileType: "pdf",
      fileSize: 5678901,
      uploadedBy: "Carlos Mendoza",
      notes: "Procedimientos de seguridad industrial para minas.",
    },
  ]);

  await db.insert(announcementsTable).values([
    {
      companyId: company.id,
      title: "Cierre de Operaciones por Fiestas Patrias",
      content: "Se comunica a todo el personal que las oficinas permanecerán cerradas los días 28 y 29 de julio. Los servicios esenciales operarán con guardia mínima según el cronograma publicado en el portal interno.",
      publishedBy: "Carlos Mendoza",
      priority: "high",
      targetType: "all",
    },
    {
      companyId: company.id,
      title: "Nuevo sistema de marcación biométrica",
      content: "A partir del 1 de febrero se implementará el nuevo sistema de control de asistencia biométrico en todas las instalaciones. El área de RRHH programará sesiones de capacitación durante la última semana de enero.",
      publishedBy: "Carlos Mendoza",
      priority: "medium",
      targetType: "all",
    },
    {
      companyId: company.id,
      title: "Actualización de beneficios 2024",
      content: "El directorio ha aprobado una mejora del paquete de beneficios para todos los colaboradores a partir del 1 de marzo. Los cambios incluyen seguro médico ampliado, bono de desempeño trimestral y subsidio de transporte aumentado.",
      publishedBy: "Carlos Mendoza",
      priority: "low",
      targetType: "all",
    },
  ]);
}
