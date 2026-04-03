import type { NextFunction, Request, Response } from "express";
import { getAnalyticsForUser } from "../services/analytics.service";

export const analyticsController = {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session.userId!;
      const analytics = await getAnalyticsForUser(userId);

      res.status(200).json({ data: analytics });
    } catch (error) {
      next(error);
    }
  },
};
