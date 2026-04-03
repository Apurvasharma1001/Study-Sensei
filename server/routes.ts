import { Router, type Express } from "express";
import type { Server } from "http";
import {
  createStudySessionSchema,
  createTaskSchema,
  deleteAccountSchema,
  generateQuizSchema,
  generateStudyPlanSchema,
  loginSchema,
  registerSchema,
  saveQuizResultSchema,
  sendChatSchema,
  updateProfileSchema,
  updateTaskSchema,
} from "../shared/schema";
import { authController } from "./controllers/authController";
import { taskController } from "./controllers/taskController";
import { chatController } from "./controllers/chatController";
import { quizController } from "./controllers/quizController";
import { analyticsController } from "./controllers/analyticsController";
import { uploadController } from "./controllers/uploadController";
import { planController } from "./controllers/planController";
import { sessionController } from "./controllers/sessionController";
import { requireAuth } from "./middleware/requireAuth";
import { authRateLimiter, aiRateLimiter } from "./middleware/rateLimiter";
import { validateBody } from "./middleware/validateBody";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const router = Router();

  // --- Health ---
  router.get("/health", (_req, res) => {
    res.status(200).json({
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? "1.0.0",
      },
    });
  });

  // --- Auth ---
  router.post(
    "/auth/register",
    authRateLimiter,
    validateBody(registerSchema),
    authController.register,
  );
  router.post(
    "/auth/login",
    authRateLimiter,
    validateBody(loginSchema),
    authController.login,
  );
  router.post("/auth/logout", authController.logout);

  // --- User Profile ---
  router.get("/user/profile", requireAuth, authController.getProfile);
  router.patch(
    "/user/profile",
    requireAuth,
    validateBody(updateProfileSchema),
    authController.updateProfile,
  );
  router.delete(
    "/user/account",
    requireAuth,
    validateBody(deleteAccountSchema),
    authController.deleteAccount,
  );

  // --- Tasks ---
  router.get("/tasks", requireAuth, taskController.list);
  router.post(
    "/tasks",
    requireAuth,
    validateBody(createTaskSchema),
    taskController.create,
  );
  router.patch(
    "/tasks/:id",
    requireAuth,
    validateBody(updateTaskSchema),
    taskController.update,
  );
  router.delete("/tasks/:id", requireAuth, taskController.remove);

  // --- Chat ---
  router.post(
    "/chat",
    requireAuth,
    aiRateLimiter,
    validateBody(sendChatSchema),
    chatController.send,
  );
  router.get("/chat/history", requireAuth, chatController.history);
  router.delete("/chat/history", requireAuth, chatController.clear);

  // --- Quiz ---
  router.post(
    "/quiz/generate",
    requireAuth,
    aiRateLimiter,
    validateBody(generateQuizSchema),
    quizController.generate,
  );
  router.post(
    "/quiz/result",
    requireAuth,
    validateBody(saveQuizResultSchema),
    quizController.saveResult,
  );
  router.get("/quiz/history", requireAuth, quizController.history);

  // --- Analytics ---
  router.get("/analytics", requireAuth, analyticsController.get);

  // --- Upload ---
  router.post("/upload/syllabus", requireAuth, uploadController.syllabus);

  // --- Study Plan ---
  router.post(
    "/plan/generate",
    requireAuth,
    aiRateLimiter,
    validateBody(generateStudyPlanSchema),
    planController.generate,
  );
  router.get("/plan/daily-tip", requireAuth, planController.dailyTip);

  // --- Study Sessions ---
  router.post(
    "/sessions",
    requireAuth,
    validateBody(createStudySessionSchema),
    sessionController.create,
  );

  app.use("/api", router);

  return httpServer;
}
