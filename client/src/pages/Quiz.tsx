import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Play, Trophy, AlertCircle, CheckCircle2 } from "lucide-react";

const QUIZ_CATEGORIES = [
  { id: 1, title: "Organic Chemistry", questions: 20, time: "30 min", difficulty: "Hard", color: "bg-orange-100 text-orange-700" },
  { id: 2, title: "Calculus Limits", questions: 15, time: "25 min", difficulty: "Medium", color: "bg-blue-100 text-blue-700" },
  { id: 3, title: "World War II", questions: 10, time: "15 min", difficulty: "Easy", color: "bg-green-100 text-green-700" },
  { id: 4, title: "Newton's Laws", questions: 25, time: "40 min", difficulty: "Medium", color: "bg-purple-100 text-purple-700" },
];

export default function Quizzes() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Auto Quiz Generator</h1>
        <p className="text-muted-foreground">Practice with AI-generated questions tailored to your weak spots.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-heading font-bold">Recommended for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUIZ_CATEGORIES.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/50 group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`${quiz.color} border-none`}>
                      {quiz.difficulty}
                    </Badge>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">{quiz.title}</CardTitle>
                  <CardDescription>{quiz.questions} Questions • {quiz.time}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    Start Quiz <Play className="w-4 h-4 ml-2 fill-current" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden">
             <div className="relative z-10 flex justify-between items-center">
               <div>
                 <h3 className="text-xl font-bold mb-2">Generate Custom Quiz</h3>
                 <p className="text-slate-300 max-w-md mb-4">Need specific practice? Tell the AI exactly what topics to cover.</p>
                 <Button variant="secondary">Create Custom Quiz</Button>
               </div>
               <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
                 <Trophy className="w-8 h-8 text-yellow-400" />
               </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-heading font-bold">Performance History</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32 w-full justify-between px-2">
                {[40, 65, 55, 80, 75, 90, 85].map((h, i) => (
                  <div key={i} className="w-full bg-slate-100 rounded-t-md relative group">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md transition-all duration-500 group-hover:bg-primary/80" 
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
             <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
               <AlertCircle className="w-5 h-5 shrink-0" />
               <div className="text-sm">
                 <span className="font-semibold">Weak Spot:</span> Integration by Parts. Accuracy: 45%
               </div>
             </div>
             <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100">
               <CheckCircle2 className="w-5 h-5 shrink-0" />
               <div className="text-sm">
                 <span className="font-semibold">Mastered:</span> Newton's Laws. Accuracy: 98%
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
