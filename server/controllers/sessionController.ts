import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import {
  studySessions,
  type CreateStudySessionInput,
} from "../../shared/schema";
import { db } from "../db";

export const sessionController = {
  async create(
    req: Request<unknown, unknown, CreateStudySessionInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.session.userId!;

      const [session] = await db
        .insert(studySessions)
        .values({
          userId,
          subject: req.body.subject,
          durationMins: req.body.durationMins,
          sessionDate: req.body.sessionDate,
        })
        .returning();

      res.status(201).json({ data: { session } });
    } catch (error) {
      next(error);
    }
  },
};
