import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Play, Trophy, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend, type ApiEnvelope } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { QuizQuestion } from "@shared/schema";

interface QuizResult {
  id: number;
  topic: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  takenAt: string;
}

// --- Quiz states ---
type QuizState =
  | { phase: "topic" }
  | { phase: "generating" }
  | { phase: "playing"; questions: QuizQuestion[]; current: number; answers: (number | null)[] }
  | { phase: "results"; questions: QuizQuestion[]; answers: number[]; score: number; topic: string };

export default function Quizzes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [topic, setTopic] = useState("");
  const [state, setState] = useState<QuizState>({ phase: "topic" });

  // Quiz history
  const historyQuery = useQuery<ApiEnvelope<{ results: QuizResult[] }>>({
    queryKey: ["/api/quiz/history"],
    queryFn: () =>
      apiGet<ApiEnvelope<{ results: QuizResult[] }>>("/api/quiz/history") as Promise<
        ApiEnvelope<{ results: QuizResult[] }>
      >,
  });

  const generateMutation = useMutation({
    mutationFn: (t: string) =>
      apiSend<ApiEnvelope<{ quiz: { questions: QuizQuestion[] } }>, { topic: string }>(
        "POST",
        "/api/quiz/generate",
        { topic: t },
      ),
    onSuccess: (data) => {
      setState({
        phase: "playing",
        questions: data.data.quiz.questions,
        current: 0,
        answers: Array(data.data.quiz.questions.length).fill(null),
      });
    },
    onError: (err) => {
      setState({ phase: "topic" });
      toast({
        title: "Quiz generation failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { topic: string; score: number; totalQuestions: number }) =>
      apiSend<ApiEnvelope<unknown>, typeof payload>("POST", "/api/quiz/result", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/quiz/history"] });
      void qc.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
  });

  const handleGenerate = () => {
    if (topic.trim().length < 3) {
      toast({ title: "Topic must be at least 3 characters", variant: "destructive" });
      return;
    }
    setState({ phase: "generating" });
    generateMutation.mutate(topic.trim());
  };

  const handleAnswer = (optionIndex: number) => {
    if (state.phase !== "playing") return;
    const newAnswers = [...state.answers];
    newAnswers[state.current] = optionIndex;
    setState({ ...state, answers: newAnswers });
  };

  const handleNext = () => {
    if (state.phase !== "playing") return;
    if (state.current < state.questions.length - 1) {
      setState({ ...state, current: state.current + 1 });
    } else {
      // Calculate score
      const answers = state.answers as number[];
      const score = state.questions.reduce((acc, q, i) => acc + (q.correct === answers[i] ? 1 : 0), 0);
      setState({ phase: "results", questions: state.questions, answers, score, topic });

      // Save to DB
      saveMutation.mutate({ topic, score, totalQuestions: state.questions.length });
    }
  };

  const history = historyQuery.data?.data?.results ?? [];

  // --- GENERATING STATE ---
  if (state.phase === "generating") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Spinner className="size-8" />
        <p className="text-muted-foreground font-medium">AI is creating your quiz on "{topic}"...</p>
        <p className="text-xs text-muted-foreground">This may take 5-10 seconds</p>
      </div>
    );
  }

  // --- PLAYING STATE ---
  if (state.phase === "playing") {
    const q = state.questions[state.current]!;
    const selected = state.answers[state.current];

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            Question {state.current + 1} of {state.questions.length}
          </Badge>
          <Progress value={((state.current + 1) / state.questions.length) * 100} className="w-32 h-2" />
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">{q.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selected === i
                    ? "border-primary bg-primary/5 text-foreground font-medium"
                    : "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                }`}
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-sm font-semibold mr-3">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleNext}
              disabled={selected === null}
            >
              {state.current < state.questions.length - 1 ? (
                <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
              ) : (
                <>Finish Quiz <CheckCircle2 className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- RESULTS STATE ---
  if (state.phase === "results") {
    const percentage = Math.round((state.score / state.questions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <Card className="shadow-lg text-center p-8">
          <div className="mb-4">
            <Trophy className={`w-16 h-16 mx-auto ${percentage >= 80 ? "text-yellow-500" : percentage >= 60 ? "text-blue-500" : "text-muted-foreground"}`} />
          </div>
          <h2 className="text-3xl font-heading font-bold mb-2">
            {state.score} / {state.questions.length}
          </h2>
          <p className="text-xl font-semibold text-primary mb-1">{percentage}%</p>
          <p className="text-muted-foreground mb-6">
            {percentage >= 80 ? "Excellent work!" : percentage >= 60 ? "Good effort!" : "Keep practicing!"}
          </p>
          <Button onClick={() => { setState({ phase: "topic" }); setTopic(""); }}>
            Take Another Quiz
          </Button>
        </Card>

        <div className="space-y-4">
          <h3 className="font-heading font-bold text-lg">Review Answers</h3>
          {state.questions.map((q, i) => {
            const isCorrect = q.correct === state.answers[i];
            return (
              <Card key={i} className={`border-l-4 ${isCorrect ? "border-l-green-500" : "border-l-red-500"}`}>
                <CardContent className="p-4 space-y-2">
                  <p className="font-medium">{q.question}</p>
                  <p className="text-sm">
                    Your answer: <span className={isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                      {q.options[state.answers[i]]}
                    </span>
                  </p>
                  {!isCorrect && (
                    <p className="text-sm text-green-600">
                      Correct: {q.options[q.correct]}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{q.explanation}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // --- TOPIC SELECTION STATE ---
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Auto Quiz Generator</h1>
        <p className="text-muted-foreground">Practice with AI-generated questions tailored to your weak spots.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Generate Quiz */}
          <Card className="bg-slate-900 text-white overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Generate a Quiz</h3>
                    <p className="text-slate-300 text-sm">Enter any topic and AI will create 5 MCQs for you.</p>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                      placeholder="e.g. Organic Chemistry, Newton's Laws..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 flex-1"
                    />
                    <Button
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending}
                      variant="secondary"
                    >
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-heading font-bold">Quiz History</h2>
          {history.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p className="text-sm">No quizzes taken yet. Generate one above!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 8).map((result) => (
                <Card key={result.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{result.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(result.takenAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          result.percentage >= 80
                            ? "border-green-200 bg-green-50 text-green-700"
                            : result.percentage >= 60
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-red-200 bg-red-50 text-red-700"
                        }
                      >
                        {Math.round(result.percentage)}%
                      </Badge>
                    </div>
                    <Progress value={result.percentage} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
