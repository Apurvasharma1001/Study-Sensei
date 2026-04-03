import type { NextFunction, Request, Response } from "express";
import { and, eq, desc, asc } from "drizzle-orm";
import {
  tasks,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "../../shared/schema";
import { db } from "../db";

export const taskController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session.userId!;
      const status = req.query.status as string | undefined;
      const subject = req.query.subject as string | undefined;

      const conditions = [eq(tasks.userId, userId)];
      if (status) conditions.push(eq(tasks.status, status));
      if (subject) conditions.push(eq(tasks.subject, subject));

      const userTasks = await db
        .select()
        .from(tasks)
        .where(and(...conditions))
        .orderBy(asc(tasks.createdAt));

      res.status(200).json({ data: { tasks: userTasks } });
    } catch (error) {
      next(error);
    }
  },

  async create(
    req: Request<unknown, unknown, CreateTaskInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.session.userId!;

      const [task] = await db
        .insert(tasks)
        .values({
          userId,
          title: req.body.title,
          subject: req.body.subject,
          estimatedMins: req.body.estimatedMins ?? 30,
          dueDate: req.body.dueDate,
          status: "todo",
        })
        .returning();

      res.status(201).json({ data: { task } });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session.userId!;
      const taskId = Number(req.params.id);
      const body = req.body as UpdateTaskInput;

      if (Number.isNaN(taskId)) {
        res.status(400).json({ error: "Invalid task ID", code: "VALIDATION_ERROR" });
        return;
      }

      const updates: Record<string, unknown> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.status !== undefined) {
        updates.status = body.status;
        if (body.status === "completed") {
          updates.completedAt = new Date();
        } else {
          updates.completedAt = null;
        }
      }
      if (body.estimatedMins !== undefined) updates.estimatedMins = body.estimatedMins;
      if (body.dueDate !== undefined) updates.dueDate = body.dueDate;

      const [task] = await db
        .update(tasks)
        .set(updates)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
        .returning();

      if (!task) {
        res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
        return;
      }

      res.status(200).json({ data: { task } });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session.userId!;
      const taskId = Number(req.params.id);

      if (Number.isNaN(taskId)) {
        res.status(400).json({ error: "Invalid task ID", code: "VALIDATION_ERROR" });
        return;
      }

      const [deleted] = await db
        .delete(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
        .returning({ id: tasks.id });

      if (!deleted) {
        res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
        return;
      }

      res.status(200).json({ data: { message: "Task deleted" } });
    } catch (error) {
      next(error);
    }
  },
};
