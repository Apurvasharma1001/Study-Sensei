import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Clock, Target, Trophy, Flame, BrainCircuit } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { useLocation } from "wouter";
import heroImage from "@/assets/ai-study-hero.png";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useAnalytics();
  const { user } = useAuth();

  const analytics = data?.data;
  const stats = analytics?.stats;
  const weeklyActivity = analytics?.weeklyActivity ?? [];
  const recentQuizzes = analytics?.recentQuizzes ?? [];

  const firstName = user?.name?.split(" ")[0] ?? "Student";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Spinner className="size-5" />
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
          <div className="space-y-4">
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none backdrop-blur-md">
              <Flame className="w-3 h-3 mr-1 text-orange-300" />
              {stats?.streakDays ?? 0} Day Streak
            </Badge>
            <h1 className="text-4xl md:text-5xl font-heading font-bold leading-tight">
              Ready to crush your goals today, {firstName}?
            </h1>
            <p className="text-indigo-100 text-lg max-w-md">
              {stats?.averageQuizScore && stats.averageQuizScore < 70
                ? "Focus on your weak areas to improve your scores!"
                : "You're doing great! Keep up the momentum."}
            </p>
            <Button
              size="lg"
              className="bg-white text-indigo-600 hover:bg-indigo-50 border-none font-semibold mt-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              onClick={() => setLocation("/tutor")}
            >
              Start Studying
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <div className="hidden md:flex justify-end relative">
            <img
              src={heroImage}
              alt="AI Study Assistant"
              className="w-full max-w-sm object-cover rounded-2xl shadow-2xl border-4 border-white/20 backdrop-blur-sm rotate-3 hover:rotate-0 transition-transform duration-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Study Time</p>
              <h3 className="text-2xl font-bold font-heading">{stats?.totalStudyHours ?? 0}h</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Tasks Done</p>
              <h3 className="text-2xl font-bold font-heading">
                {stats?.tasksDone ?? 0}/{stats?.tasksTotal ?? 0}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Avg Score</p>
              <h3 className="text-2xl font-bold font-heading">{stats?.averageQuizScore ?? 0}%</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Readiness</p>
              <h3 className="text-2xl font-bold font-heading">{stats?.readiness ?? "—"}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Activity Chart */}
          <section>
            <h2 className="text-xl font-heading font-bold mb-4">Study Activity</h2>
            <Card>
              <CardContent className="p-6">
                {weeklyActivity.length > 0 && weeklyActivity.some((d) => d.hours > 0) ? (
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyActivity}>
                        <XAxis
                          dataKey="day"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "transparent" }}
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        />
                        <Bar
                          dataKey="hours"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    <p>No study sessions recorded this week. Start studying to see your activity!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Recent Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Recent Quizzes</CardTitle>
              <CardDescription>Your latest performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentQuizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No quizzes taken yet.</p>
              ) : (
                recentQuizzes.map((quiz, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{quiz.topic}</span>
                      <span className="text-muted-foreground">{quiz.percentage}%</span>
                    </div>
                    <Progress value={quiz.percentage} className="h-2" />
                  </div>
                ))
              )}
              <Button
                className="w-full mt-4"
                variant="secondary"
                onClick={() => setLocation("/quizzes")}
              >
                Take New Quiz
              </Button>
            </CardContent>
          </Card>

          {/* Exam Readiness */}
          <Card className="bg-linear-to-br from-slate-900 to-slate-800 text-white border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-400" />
                Exam Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-5xl font-bold font-heading bg-clip-text text-transparent bg-linear-to-r from-green-400 to-emerald-500">
                  {stats?.averageQuizScore ?? 0}%
                </div>
                <p className="text-slate-400 text-sm mt-2">
                  {(stats?.averageQuizScore ?? 0) >= 80
                    ? "You're on track! Keep it up."
                    : (stats?.averageQuizScore ?? 0) >= 60
                      ? "Good progress. Focus on weak areas."
                      : "Keep studying and taking quizzes to improve!"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
