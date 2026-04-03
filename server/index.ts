import "dotenv/config";

import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import session from "express-session";
import multer from "multer";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { pool } from "./db";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const app = express();
const httpServer = createServer(app);
const PgSession = connectPgSimple(session);
const sessionSecret = process.env.SESSION_SECRET;
const multipartUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      const allowedOrigins = new Set([
        process.env.CLIENT_ORIGIN ?? "http://localhost:5000",
        "http://localhost:5173",
        "http://localhost:5000",
      ]);

      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed"));
    },
  }),
);
app.use(
  session({
    store: new PgSession({
      pool,
      createTableIfMissing: true,
    }),
    secret: sessionSecret ?? "",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);
app.use((req, res, next) => {
  if (!req.is("multipart/form-data")) {
    next();
    return;
  }

  multipartUpload.any()(req, res, next);
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    if (typeof bodyJson === "object" && bodyJson !== null) {
      capturedJsonResponse = bodyJson as Record<string, unknown>;
    }

    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is required");
  }

  await registerRoutes(httpServer, app);

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        error: "File too large (max 10 MB)",
        code: "FILE_TOO_LARGE",
      });
      return;
    }

    const status =
      typeof err === "object" &&
      err !== null &&
      "statusCode" in err &&
      typeof err.statusCode === "number"
        ? err.statusCode
        : typeof err === "object" &&
            err !== null &&
            "status" in err &&
            typeof err.status === "number"
          ? err.status
          : 500;

    const code =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof err.code === "string"
        ? err.code
        : status >= 500
          ? "INTERNAL_SERVER_ERROR"
          : "REQUEST_FAILED";

    const message =
      status >= 500
        ? "Internal Server Error"
        : typeof err === "object" &&
            err !== null &&
            "message" in err &&
            typeof err.message === "string"
          ? err.message
          : "Request failed";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ error: message, code });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
