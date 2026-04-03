import type { NextFunction, Request, Response } from "express";
import { eq, desc } from "drizzle-orm";
import {
  quizResults,
  type GenerateQuizInput,
  type SaveQuizResultInput,
} from "../../shared/schema";
import { db } from "../db";
import { generateQuiz, AIServiceError } from "../services/ai.service";

export const quizController = {
  async generate(
    req: Request<unknown, unknown, GenerateQuizInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const quiz = await generateQuiz(req.body.topic);

      res.status(200).json({ data: { quiz } });
    } catch (error) {
      if (error instanceof AIServiceError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
        return;
      }
      next(error);
    }
  },

  async saveResult(
    req: Request<unknown, unknown, SaveQuizResultInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.session.userId!;
      const { topic, score, totalQuestions } = req.body;
      const percentage = (score / totalQuestions) * 100;

      const [result] = await db
        .insert(quizResults)
        .values({
          userId,
          topic,
          score,
          totalQuestions,
          percentage,
        })
        .returning();

      res.status(201).json({ data: { result } });
    } catch (error) {
      next(error);
    }
  },

  async history(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session.userId!;
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);

      const results = await db
        .select()
        .from(quizResults)
        .where(eq(quizResults.userId, userId))
        .orderBy(desc(quizResults.takenAt))
        .limit(limit)
        .offset(offset);

      res.status(200).json({ data: { results } });
    } catch (error) {
      next(error);
    }
  },
};
