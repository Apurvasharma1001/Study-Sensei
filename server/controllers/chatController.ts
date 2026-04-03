import type { NextFunction, Request, Response } from "express";
import { eq, desc, asc } from "drizzle-orm";
import {
  chatMessages,
  users,
  type SendChatInput,
} from "../../shared/schema";
import { db } from "../db";
import { tutorChat } from "../services/ai.service";
import { AIServiceError } from "../services/ai.service";

export const chatController = {
  async send(
    req: Request<unknown, unknown, SendChatInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.session.userId!;
      const userMessage = req.body.message;

      // Save user message
      await db.insert(chatMessages).values({
        userId,
        role: "user",
        content: userMessage,
      });

      // Fetch recent history for context (last 20 messages)
      const history = await db
        .select({ role: chatMessages.role, content: chatMessages.content })
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(20);

      // Reverse to chronological order
      history.reverse();

      // Get syllabus context if uploaded
      const [user] = await db
        .select({ syllabusText: users.syllabusText })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const syllabusText = user?.syllabusText ?? undefined;

      // Call AI
      const aiReply = await tutorChat(
        history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        syllabusText,
      );

      // Save AI response
      await db.insert(chatMessages).values({
        userId,
        role: "assistant",
        content: aiReply,
      });

      res.status(200).json({
        data: {
          reply: aiReply,
        },
      });
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

  async history(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session.userId!;
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy(asc(chatMessages.createdAt))
        .limit(limit)
        .offset(offset);

      res.status(200).json({ data: { messages } });
    } catch (error) {
      next(error);
    }
  },

  async clear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session.userId!;

      await db
        .delete(chatMessages)
        .where(eq(chatMessages.userId, userId));

      res.status(200).json({ data: { message: "Chat history cleared" } });
    } catch (error) {
      next(error);
    }
  },
};
