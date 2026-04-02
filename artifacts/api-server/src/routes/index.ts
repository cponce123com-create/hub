import { Router, type IRouter } from "express";
import { requireAuth, requireCompany } from "../middlewares/requireAuth";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import companiesRouter from "./companies";
import usersRouter from "./users";
import employeesRouter from "./employees";
import invoicesRouter from "./invoices";
import suppliersRouter from "./suppliers";
import attendanceRouter from "./attendance";
import documentsRouter from "./documents";
import announcementsRouter from "./announcements";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use(requireAuth);
router.use(adminRouter);
router.use("/companies/:companyId", requireCompany);

router.use(companiesRouter);
router.use(usersRouter);
router.use(employeesRouter);
router.use(invoicesRouter);
router.use(suppliersRouter);
router.use(attendanceRouter);
router.use(documentsRouter);
router.use(announcementsRouter);
router.use(dashboardRouter);
router.use(reportsRouter);

export default router;
