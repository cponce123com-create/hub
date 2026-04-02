import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  next();
}

export function requireCompany(req: Request, res: Response, next: NextFunction): void {
  const companyId = parseInt(req.params.companyId as string);
  if (isNaN(companyId)) {
    res.status(400).json({ error: "ID de empresa inválido" });
    return;
  }
  if (companyId !== req.session?.companyId) {
    res.status(403).json({ error: "Acceso denegado" });
    return;
  }
  next();
}
