import { eq, desc } from "drizzle-orm";
import { tasks, quizResults, studySessions } from "../../shared/schema";
import { db } from "../db";

interface SubjectMastery {
  name: string;
  mastery: number;
  quizCount: number;
}

interface WeeklyDay {
  day: string;
  hours: number;
}

interface HeatmapEntry {
  date: string;
  intensity: number;
}

export interface AnalyticsData {
  stats: {
    totalStudyHours: number;
    tasksDone: number;
    tasksTotal: number;
    averageQuizScore: number;
    streakDays: number;
    readiness: string;
  };
  subjectMastery: SubjectMastery[];
  weeklyActivity: WeeklyDay[];
  heatmap: HeatmapEntry[];
  recentQuizzes: {
    topic: string;
    percentage: number;
    takenAt: string;
  }[];
}

function getDayName(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()] ?? "";
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

export async function getAnalyticsForUser(userId: number): Promise<AnalyticsData> {
  // --- Tasks stats ---
  const userTasks = await db
    .select({ status: tasks.status })
    .from(tasks)
    .where(eq(tasks.userId, userId));

  const tasksTotal = userTasks.length;
  const tasksDone = userTasks.filter((t) => t.status === "completed").length;

  // --- Quiz stats ---
  const quizzes = await db
    .select({
      topic: quizResults.topic,
      percentage: quizResults.percentage,
      takenAt: quizResults.takenAt,
    })
    .from(quizResults)
    .where(eq(quizResults.userId, userId))
    .orderBy(desc(quizResults.takenAt));

  const averageQuizScore =
    quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.percentage, 0) / quizzes.length)
      : 0;

  const recentQuizzes = quizzes.slice(0, 5).map((q) => ({
    topic: q.topic,
    percentage: Math.round(q.percentage),
    takenAt: q.takenAt.toISOString(),
  }));

  // --- Study sessions ---
  const sessions = await db
    .select({
      subject: studySessions.subject,
      durationMins: studySessions.durationMins,
      sessionDate: studySessions.sessionDate,
    })
    .from(studySessions)
    .where(eq(studySessions.userId, userId))
    .orderBy(desc(studySessions.sessionDate));

  const totalStudyMins = sessions.reduce((sum, s) => sum + s.durationMins, 0);
  const totalStudyHours = Math.round((totalStudyMins / 60) * 10) / 10;

  // --- Streak calculation ---
  const uniqueDates = Array.from(new Set(sessions.map((s) => s.sessionDate))).sort().reverse();
  let streakDays = 0;
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));

  if (uniqueDates.length > 0 && (uniqueDates[0] === today || uniqueDates[0] === yesterday)) {
    streakDays = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const current = new Date(uniqueDates[i - 1]! + "T00:00:00");
      const prev = new Date(uniqueDates[i]! + "T00:00:00");
      const diffDays = (current.getTime() - prev.getTime()) / 86400000;
      if (diffDays === 1) {
        streakDays++;
      } else {
        break;
      }
    }
  }

  // --- Readiness ---
  let readiness = "Low";
  if (tasksTotal === 0 && quizzes.length === 0) readiness = "Low";
  else if (averageQuizScore >= 80 && tasksDone >= tasksTotal * 0.7) readiness = "High";
  else if (averageQuizScore >= 60 || tasksDone >= tasksTotal * 0.5) readiness = "Medium";

  // --- Subject mastery (from quiz averages) ---
  const subjectMap = new Map<string, { total: number; count: number }>();
  for (const q of quizzes) {
    const existing = subjectMap.get(q.topic) ?? { total: 0, count: 0 };
    existing.total += q.percentage;
    existing.count += 1;
    subjectMap.set(q.topic, existing);
  }
  const subjectMastery: SubjectMastery[] = [];
  Array.from(subjectMap.entries()).forEach(([name, data]) => {
    subjectMastery.push({
      name,
      mastery: Math.round(data.total / data.count),
      quizCount: data.count,
    });
  });

  // --- Weekly activity (last 7 days) ---
  const weeklyActivity: WeeklyDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = formatDate(d);
    const dayMins = sessions
      .filter((s) => s.sessionDate === dateStr)
      .reduce((sum, s) => sum + s.durationMins, 0);
    weeklyActivity.push({
      day: getDayName(dateStr),
      hours: Math.round((dayMins / 60) * 10) / 10,
    });
  }

  // --- Heatmap (last 90 days) ---
  const heatmap: HeatmapEntry[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = formatDate(d);
    const dayMins = sessions
      .filter((s) => s.sessionDate === dateStr)
      .reduce((sum, s) => sum + s.durationMins, 0);

    let intensity = 0;
    if (dayMins > 0) intensity = 1;
    if (dayMins >= 30) intensity = 2;
    if (dayMins >= 60) intensity = 3;
    if (dayMins >= 120) intensity = 4;

    heatmap.push({ date: dateStr, intensity });
  }

  return {
    stats: {
      totalStudyHours,
      tasksDone,
      tasksTotal,
      averageQuizScore,
      streakDays,
      readiness,
    },
    subjectMastery,
    weeklyActivity,
    heatmap,
    recentQuizzes,
  };
}
