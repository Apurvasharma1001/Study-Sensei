import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(199, 89%, 48%)",
  "hsl(328, 85%, 57%)",
];

export default function Analytics() {
  const { data, isLoading } = useAnalytics();
  const analytics = data?.data;
  const subjectMastery = analytics?.subjectMastery ?? [];
  const heatmap = analytics?.heatmap ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Spinner className="size-5" />
        Loading analytics...
      </div>
    );
  }

  // Prepare subject data with colors for bar chart
  const subjectBarData = subjectMastery.map((s, i) => ({
    ...s,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Performance Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your learning patterns and mastery levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Mastery Radar */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Subject Mastery</CardTitle>
            <CardDescription>Visualizing your strength across quiz topics</CardDescription>
          </CardHeader>
          <CardContent>
            {subjectMastery.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground text-sm">
                <p>Take quizzes on different topics to see your mastery chart!</p>
              </div>
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectMastery}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Mastery"
                      dataKey="mastery"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Study Hours Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quiz Performance by Topic</CardTitle>
            <CardDescription>Average scores across your quiz topics</CardDescription>
          </CardHeader>
          <CardContent>
            {subjectBarData.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground text-sm">
                <p>No quiz data yet. Start taking quizzes!</p>
              </div>
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectBarData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Bar dataKey="mastery" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Study Consistency Heatmap</CardTitle>
          <CardDescription>Daily study intensity over the last 90 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {heatmap.map((entry, i) => {
              let bgClass = "bg-slate-100";
              if (entry.intensity === 4) bgClass = "bg-green-600";
              else if (entry.intensity === 3) bgClass = "bg-green-400";
              else if (entry.intensity === 2) bgClass = "bg-green-300";
              else if (entry.intensity === 1) bgClass = "bg-green-200";

              return (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-sm ${bgClass} hover:ring-2 ring-offset-1 ring-slate-400 transition-all cursor-pointer`}
                  title={`${entry.date}: ${
                    entry.intensity === 0 ? "No study" :
                    entry.intensity === 1 ? "< 30 min" :
                    entry.intensity === 2 ? "30-60 min" :
                    entry.intensity === 3 ? "1-2 hours" : "2+ hours"
                  }`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground justify-end">
            <span>Less</span>
            <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
