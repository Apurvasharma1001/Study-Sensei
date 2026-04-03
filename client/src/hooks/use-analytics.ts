import { useQuery } from "@tanstack/react-query";
import { apiGet, type ApiEnvelope } from "@/lib/api";

interface AnalyticsStats {
  totalStudyHours: number;
  tasksDone: number;
  tasksTotal: number;
  averageQuizScore: number;
  streakDays: number;
  readiness: string;
}

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

interface RecentQuiz {
  topic: string;
  percentage: number;
  takenAt: string;
}

export interface AnalyticsData {
  stats: AnalyticsStats;
  subjectMastery: SubjectMastery[];
  weeklyActivity: WeeklyDay[];
  heatmap: HeatmapEntry[];
  recentQuizzes: RecentQuiz[];
}

const ANALYTICS_KEY = ["/api/analytics"] as const;

export function useAnalytics() {
  return useQuery<ApiEnvelope<AnalyticsData>>({
    queryKey: ANALYTICS_KEY,
    queryFn: () =>
      apiGet<ApiEnvelope<AnalyticsData>>("/api/analytics") as Promise<
        ApiEnvelope<AnalyticsData>
      >,
    staleTime: 30_000, // refresh every 30s
  });
}
