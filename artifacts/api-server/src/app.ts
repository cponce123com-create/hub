import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

// Simple in-memory session
declare module "express" {
  interface Request {
    session: { userId?: number; companyId?: number } | null;
  }
}

const sessions: Record<string, { userId: number; companyId: number }> = {};

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser(process.env.SESSION_SECRET || "controlhub-secret-key"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use((req, _res, next) => {
  const sessionId = req.cookies?.sessionId;
  if (sessionId && sessions[sessionId]) {
    req.session = sessions[sessionId];
  } else {
    req.session = null;
  }
  // Allow setting session
  const originalJson = _res.json.bind(_res);
  _res.json = function (body) {
    if (req.session && !req.cookies?.sessionId) {
      const sid = Math.random().toString(36).slice(2);
      sessions[sid] = req.session as { userId: number; companyId: number };
      _res.cookie("sessionId", sid, { httpOnly: true, secure: false, sameSite: "lax" });
    }
    return originalJson(body);
  };
  next();
});

// Patch session setter
app.use((req, res, next) => {
  const setSession = (val: { userId: number; companyId: number } | null) => {
    if (val) {
      const sid = Math.random().toString(36).slice(2);
      sessions[sid] = val;
      res.cookie("sessionId", sid, { httpOnly: true, secure: false, sameSite: "lax" });
    } else {
      const sessionId = req.cookies?.sessionId;
      if (sessionId) {
        delete sessions[sessionId];
        res.clearCookie("sessionId");
      }
    }
    req.session = val;
  };
  Object.defineProperty(req, "session", {
    get() { return this._session ?? null; },
    set(val) {
      if (val && val.userId) {
        const sid = Math.random().toString(36).slice(2);
        sessions[sid] = val;
        res.cookie("sessionId", sid, { httpOnly: true, secure: false, sameSite: "lax" });
      } else if (val === null) {
        const sessionId = req.cookies?.sessionId;
        if (sessionId) {
          delete sessions[sessionId];
          res.clearCookie("sessionId");
        }
      }
      this._session = val;
    },
    configurable: true,
  });
  next();
});

app.use("/api", router);

export default app;
