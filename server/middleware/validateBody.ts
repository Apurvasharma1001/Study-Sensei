import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export function validateBody<TSchema extends ZodTypeAny>(
  schema: TSchema,
): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: result.error.issues[0]?.message ?? "Validation failed",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
