import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { users } from "../../shared/schema";
import { db } from "../db";
import { extractTextFromPdf } from "../services/pdf.service";

export const uploadController = {
  async syllabus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session.userId!;
      const files = req.files as Express.Multer.File[] | undefined;
      const file = files?.[0];

      if (!file) {
        res.status(400).json({ error: "No file uploaded", code: "VALIDATION_ERROR" });
        return;
      }

      if (file.mimetype !== "application/pdf") {
        res.status(400).json({ error: "Only PDF files are allowed", code: "VALIDATION_ERROR" });
        return;
      }

      const text = await extractTextFromPdf(file.buffer);

      if (text.trim().length === 0) {
        res.status(400).json({
          error: "Could not extract text from this PDF",
          code: "EXTRACTION_FAILED",
        });
        return;
      }

      await db
        .update(users)
        .set({
          syllabusText: text,
          syllabusName: file.originalname,
        })
        .where(eq(users.id, userId));

      res.status(200).json({
        data: {
          message: "Syllabus uploaded successfully",
          syllabusName: file.originalname,
          characterCount: text.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
