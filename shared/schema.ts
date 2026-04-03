import {
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const TASK_STATUSES = ["todo", "in-progress", "completed"] as const;
export const CHAT_ROLES = ["user", "assistant"] as const;
export const SUBJECTS = [
  "Chemistry",
  "Math",
  "Physics",
  "History",
  "English",
  "Other",
] as const;

export const taskStatusSchema = z.enum(TASK_STATUSES);
export const chatRoleSchema = z.enum(CHAT_ROLES);
export const subjectSchema = z.enum(SUBJECTS);
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    avatarInitials: text("avatar_initials"),
    syllabusText: text("syllabus_text"),
    syllabusName: text("syllabus_name"),
    dailyTip: text("daily_tip"),
    tipGeneratedAt: timestamp("tip_generated_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    subject: text("subject").notNull(),
    status: text("status").notNull().default("todo"),
    estimatedMins: integer("estimated_mins").default(30),
    dueDate: text("due_date"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => [
    index("tasks_user_id_idx").on(table.userId),
    index("tasks_status_idx").on(table.userId, table.status),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("chat_messages_user_id_idx").on(table.userId, table.createdAt)],
);

export const quizResults = pgTable(
  "quiz_results",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    topic: text("topic").notNull(),
    score: integer("score").notNull(),
    totalQuestions: integer("total_questions").notNull().default(5),
    percentage: real("percentage").notNull(),
    takenAt: timestamp("taken_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("quiz_results_user_id_idx").on(table.userId, table.takenAt),
    index("quiz_results_topic_idx").on(table.userId, table.topic),
  ],
);

export const studySessions = pgTable(
  "study_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    subject: text("subject"),
    durationMins: integer("duration_mins").notNull(),
    sessionDate: text("session_date").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("study_sessions_user_id_idx").on(table.userId, table.sessionDate),
  ],
);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(50).optional(),
    avatarInitials: z
      .string()
      .trim()
      .min(1)
      .max(4)
      .regex(/^[A-Za-z]{1,4}$/, "Avatar initials must contain letters only")
      .transform((value) => value.toUpperCase())
      .optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.avatarInitials !== undefined,
    {
      message: "At least one field is required",
    },
  );

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(200),
  subject: subjectSchema,
  estimatedMins: z.number().int().min(5).max(480).optional().default(30),
  dueDate: dateStringSchema.optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    status: taskStatusSchema.optional(),
    estimatedMins: z.number().int().min(5).max(480).optional(),
    dueDate: dateStringSchema.optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.status !== undefined ||
      value.estimatedMins !== undefined ||
      value.dueDate !== undefined,
    {
      message: "At least one field is required",
    },
  );

export const taskFiltersSchema = z.object({
  status: taskStatusSchema.optional(),
  subject: subjectSchema.optional(),
});

export const sendChatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const generateQuizSchema = z.object({
  topic: z.string().trim().min(3).max(200),
});

export const saveQuizResultSchema = z.object({
  topic: z.string().trim().min(3).max(200),
  score: z.number().int().min(0).max(100),
  totalQuestions: z.number().int().min(1).max(20),
});

export const generateStudyPlanSchema = z.object({
  focusSubjects: z.array(subjectSchema).max(10).optional(),
  upcomingExams: z
    .array(
      z.object({
        subject: subjectSchema,
        date: dateStringSchema,
      }),
    )
    .max(20)
    .optional(),
});

export const createStudySessionSchema = z.object({
  subject: subjectSchema.optional(),
  durationMins: z.number().int().min(1).max(480),
  sessionDate: dateStringSchema,
});

export const aiMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string().trim().min(1),
});

export const quizQuestionSchema = z.object({
  question: z.string().trim().min(10).max(500),
  options: z.array(z.string().trim().min(1).max(200)).length(4),
  correct: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(5).max(500),
});

export const quizResponseSchema = z.object({
  questions: z.array(quizQuestionSchema).length(5),
});

export const publicUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string().email(),
  avatarInitials: z.string().nullable(),
  syllabusName: z.string().nullable(),
  hasSyllabus: z.boolean(),
  createdAt: z.string(),
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type ChatRole = z.infer<typeof chatRoleSchema>;
export type Subject = z.infer<typeof subjectSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
export type SendChatInput = z.infer<typeof sendChatSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
export type SaveQuizResultInput = z.infer<typeof saveQuizResultSchema>;
export type GenerateStudyPlanInput = z.infer<typeof generateStudyPlanSchema>;
export type CreateStudySessionInput = z.infer<typeof createStudySessionSchema>;
export type AIMessage = z.infer<typeof aiMessageSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizResponse = z.infer<typeof quizResponseSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;

export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type QuizResult = typeof quizResults.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
