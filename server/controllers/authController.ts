import bcrypt from "bcrypt";
import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import {
  type PublicUser,
  type UpdateProfileInput,
  users,
} from "../../shared/schema";
import { db } from "../db";

type PublicUserRow = {
  id: number;
  name: string;
  email: string;
  avatarInitials: string | null;
  syllabusName: string | null;
  syllabusText: string | null;
  createdAt: Date;
};

function getAvatarInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "SS";
  }

  return parts
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function toPublicUser(user: PublicUserRow): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarInitials: user.avatarInitials,
    syllabusName: user.syllabusName,
    hasSyllabus: Boolean(user.syllabusText),
    createdAt: user.createdAt.toISOString(),
  };
}

async function regenerateSession(req: Request): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function saveSession(req: Request, userId: number): Promise<void> {
  req.session.userId = userId;

  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function destroySession(req: Request): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function getUserProfile(userId: number): Promise<PublicUserRow | null> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarInitials: users.avatarInitials,
      syllabusName: users.syllabusName,
      syllabusText: users.syllabusText,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, req.body.email))
        .limit(1);

      if (existingUser.length > 0) {
        res.status(409).json({
          error: "Email already registered",
          code: "EMAIL_TAKEN",
        });
        return;
      }

      const passwordHash = await bcrypt.hash(req.body.password, 12);
      const [createdUser] = await db
        .insert(users)
        .values({
          name: req.body.name,
          email: req.body.email,
          passwordHash,
          avatarInitials: getAvatarInitials(req.body.name),
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarInitials: users.avatarInitials,
          syllabusName: users.syllabusName,
          syllabusText: users.syllabusText,
          createdAt: users.createdAt,
        });

      await regenerateSession(req);
      await saveSession(req, createdUser.id);

      res.status(201).json({
        data: {
          user: toPublicUser(createdUser),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          passwordHash: users.passwordHash,
          avatarInitials: users.avatarInitials,
          syllabusName: users.syllabusName,
          syllabusText: users.syllabusText,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.email, req.body.email))
        .limit(1);

      if (!user) {
        res.status(401).json({
          error: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        });
        return;
      }

      const isValid = await bcrypt.compare(req.body.password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({
          error: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        });
        return;
      }

      await regenerateSession(req);
      await saveSession(req, user.id);

      res.status(200).json({
        data: {
          user: toPublicUser(user),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.session) {
        await destroySession(req);
      }

      res.clearCookie("connect.sid");
      res.status(200).json({
        data: {
          message: "Logged out",
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await getUserProfile(req.session.userId!);

      if (!user) {
        res.status(404).json({
          error: "Not found",
          code: "NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        data: {
          user: toPublicUser(user),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(
    req: Request<unknown, unknown, UpdateProfileInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const updates: Partial<Pick<PublicUserRow, "name" | "avatarInitials">> = {};

      if (req.body.name !== undefined) {
        updates.name = req.body.name;
      }

      if (req.body.avatarInitials !== undefined) {
        updates.avatarInitials = req.body.avatarInitials;
      }

      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, req.session.userId!))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarInitials: users.avatarInitials,
          syllabusName: users.syllabusName,
          syllabusText: users.syllabusText,
          createdAt: users.createdAt,
        });

      if (!user) {
        res.status(404).json({
          error: "Not found",
          code: "NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        data: {
          user: toPublicUser(user),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [deletedUser] = await db
        .delete(users)
        .where(eq(users.id, req.session.userId!))
        .returning({ id: users.id });

      if (!deletedUser) {
        res.status(404).json({
          error: "Not found",
          code: "NOT_FOUND",
        });
        return;
      }

      await destroySession(req);
      res.clearCookie("connect.sid");

      res.status(200).json({
        data: {
          message: "Account deleted",
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
