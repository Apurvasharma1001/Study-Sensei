import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SUBJECT_STATS } from "@/lib/mockData";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

export default function Analytics() {
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
            <CardDescription>Visualizing your strength across subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={SUBJECT_STATS}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
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
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Study Hours Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Time Invested</CardTitle>
            <CardDescription>Total hours spent per subject</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SUBJECT_STATS} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="studyHours" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]} 
                    barSize={32}
                  >
                    {SUBJECT_STATS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Heatmap Placeholder (using a grid for visual) */}
      <Card>
        <CardHeader>
          <CardTitle>Study Consistency Heatmap</CardTitle>
          <CardDescription>Daily study intensity over the last month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {Array.from({ length: 90 }).map((_, i) => {
              // Random intensity for visualization
              const intensity = Math.random();
              let bgClass = "bg-slate-100";
              if (intensity > 0.8) bgClass = "bg-green-600";
              else if (intensity > 0.6) bgClass = "bg-green-400";
              else if (intensity > 0.4) bgClass = "bg-green-300";
              else if (intensity > 0.2) bgClass = "bg-green-200";
              
              return (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-sm ${bgClass} hover:ring-2 ring-offset-1 ring-slate-400 transition-all cursor-pointer`} 
                  title={`Day ${i + 1}`}
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
