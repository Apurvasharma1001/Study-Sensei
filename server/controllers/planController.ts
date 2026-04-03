import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import {
  quizResults,
  tasks,
  type GenerateStudyPlanInput,
} from "../../shared/schema";
import { db } from "../db";
import { generateStudyPlan, generateDailyTip, AIServiceError } from "../services/ai.service";
import { users } from "../../shared/schema";

export const planController = {
  async generate(
    req: Request<unknown, unknown, GenerateStudyPlanInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.session.userId!;

      // Determine weak subjects from quiz scores (avg below 70%)
      const quizzes = await db
        .select({ topic: quizResults.topic, percentage: quizResults.percentage })
        .from(quizResults)
        .where(eq(quizResults.userId, userId));

      const subjectScores = new Map<string, { total: number; count: number }>();
      for (const q of quizzes) {
        const existing = subjectScores.get(q.topic) ?? { total: 0, count: 0 };
        existing.total += q.percentage;
        existing.count += 1;
        subjectScores.set(q.topic, existing);
      }

      const autoWeakSubjects: string[] = [];
      Array.from(subjectScores.entries()).forEach(([subject, data]) => {
        if (data.total / data.count < 70) {
          autoWeakSubjects.push(subject);
        }
      });

      const weakSubjects = req.body.focusSubjects ?? autoWeakSubjects;

      // Get upcoming task deadlines
      const upcomingTasks = await db
        .select({
          title: tasks.title,
          subject: tasks.subject,
          dueDate: tasks.dueDate,
        })
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .orderBy(tasks.dueDate)
        .limit(10);

      const deadlines = upcomingTasks
        .filter((t) => t.dueDate)
        .map((t) => ({
          title: t.title,
          subject: t.subject,
          dueDate: t.dueDate,
        }));

      if (req.body.upcomingExams) {
        for (const exam of req.body.upcomingExams) {
          deadlines.push({
            title: `Exam: ${exam.subject}`,
            subject: exam.subject,
            dueDate: exam.date,
          });
        }
      }

      const today = new Date().toISOString().split("T")[0]!;
      const plan = await generateStudyPlan(weakSubjects, deadlines, today);

      res.status(200).json({ data: { plan } });
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

  async dailyTip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session.userId!;

      // Check cached tip
      const [user] = await db
        .select({ dailyTip: users.dailyTip, tipGeneratedAt: users.tipGeneratedAt })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user?.dailyTip && user.tipGeneratedAt) {
        const hoursSince = (Date.now() - user.tipGeneratedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 24) {
          res.status(200).json({ data: { tip: user.dailyTip } });
          return;
        }
      }

      const tip = await generateDailyTip();

      await db
        .update(users)
        .set({ dailyTip: tip, tipGeneratedAt: new Date() })
        .where(eq(users.id, userId));

      res.status(200).json({ data: { tip } });
    } catch (error) {
      if (error instanceof AIServiceError) {
        // Return a fallback tip instead of an error
        res.status(200).json({
          data: {
            tip: "Break your study sessions into 25-minute focused blocks with 5-minute breaks. This Pomodoro technique helps maintain concentration and prevents burnout.",
          },
        });
        return;
      }
      next(error);
    }
  },
};
