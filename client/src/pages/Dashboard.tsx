import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TASKS, RECENT_QUIZZES, WEEKLY_ACTIVITY } from "@/lib/mockData";
import { ArrowRight, Clock, Target, Trophy, Flame, BrainCircuit } from "lucide-react";
import heroImage from "@/assets/ai-study-hero.png";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from "recharts";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
          <div className="space-y-4">
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none backdrop-blur-md">
              <Flame className="w-3 h-3 mr-1 text-orange-300" /> 
              3 Day Streak
            </Badge>
            <h1 className="text-4xl md:text-5xl font-heading font-bold leading-tight">
              Ready to crush your goals today, John?
            </h1>
            <p className="text-indigo-100 text-lg max-w-md">
              Your AI tutor suggests reviewing <span className="font-semibold text-white">Organic Chemistry</span> based on your recent quiz performance.
            </p>
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 border-none font-semibold mt-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
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
              <h3 className="text-2xl font-bold font-heading">24.5h</h3>
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
              <h3 className="text-2xl font-bold font-heading">12/15</h3>
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
              <h3 className="text-2xl font-bold font-heading">88%</h3>
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
              <h3 className="text-2xl font-bold font-heading">High</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Upcoming Tasks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold">Upcoming Tasks</h2>
              <Button variant="link" className="text-primary">View Planner</Button>
            </div>
            <div className="space-y-3">
              {TASKS.map((task) => (
                <div key={task.id} className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-all">
                  <div className={`w-3 h-3 rounded-full ${
                    task.status === 'completed' ? 'bg-green-500' : 
                    task.status === 'in-progress' ? 'bg-orange-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">{task.subject} • {task.estimatedTime} mins</p>
                  </div>
                  <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    Start
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Activity Chart */}
          <section>
            <h2 className="text-xl font-heading font-bold mb-4">Study Activity</h2>
            <Card>
              <CardContent className="p-6">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={WEEKLY_ACTIVITY}>
                      <XAxis 
                        dataKey="day" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
              {RECENT_QUIZZES.map((quiz) => (
                <div key={quiz.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{quiz.title}</span>
                    <span className="text-muted-foreground">{quiz.score ? `${quiz.score}%` : 'Pending'}</span>
                  </div>
                  <Progress value={quiz.score || 0} className="h-2" />
                </div>
              ))}
              <Button className="w-full mt-4" variant="secondary">Take New Quiz</Button>
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
                  85%
                </div>
                <p className="text-slate-400 text-sm mt-2">You're on track! Keep focusing on Chemistry.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
