import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Calendar as CalendarIcon, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { SUBJECTS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Planner() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { data, isLoading, error } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();

  // Add task modal state
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState<string>("Other");
  const [newMins, setNewMins] = useState("30");
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);

  const tasks = data?.data?.tasks ?? [];
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const handleCreate = async () => {
    if (!newTitle.trim() || newTitle.length < 3) {
      toast({ title: "Title must be at least 3 characters", variant: "destructive" });
      return;
    }
    try {
      await createTask.mutateAsync({
        title: newTitle.trim(),
        subject: newSubject as any,
        estimatedMins: Number(newMins) || 30,
        dueDate: newDueDate ? format(newDueDate, "yyyy-MM-dd") : undefined,
      });
      setNewTitle("");
      setNewSubject("Other");
      setNewMins("30");
      setNewDueDate(undefined);
      setOpen(false);
      toast({ title: "Task created" });
    } catch {
      toast({ title: "Failed to create task", variant: "destructive" });
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await updateTask.mutateAsync({ id: taskId, status: newStatus as any });
    } catch {
      toast({ title: "Failed to update task", variant: "destructive" });
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast({ title: "Task deleted" });
    } catch {
      toast({ title: "Failed to delete task", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Spinner className="size-5" />
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Study Planner</h1>
          <p className="text-muted-foreground">Organize your syllabus into manageable tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Review Chapter 5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={newSubject} onValueChange={setNewSubject}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Minutes</Label>
                  <Input
                    type="number"
                    value={newMins}
                    onChange={(e) => setNewMins(e.target.value)}
                    min={5}
                    max={480}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newDueDate ? format(newDueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={newDueDate} onSelect={setNewDueDate} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreate} disabled={createTask.isPending}>
                  {createTask.isPending ? <><Spinner className="size-4" /> Creating...</> : "Create Task"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)] overflow-hidden">
        {/* Todo Column */}
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-slate-700 dark:text-slate-200">To Do</h3>
            <Badge variant="secondary" className="bg-slate-200 text-slate-700">{todoTasks.length}</Badge>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
            <div
              className="p-3 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-sm hover:border-slate-300 hover:text-slate-500 cursor-pointer transition-colors"
              onClick={() => setOpen(true)}
            >
              + Add new task
            </div>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex flex-col h-full bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-blue-700 dark:text-blue-300">In Progress</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">{inProgressTasks.length}</Badge>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        {/* Completed Column */}
        <div className="flex flex-col h-full bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-green-700 dark:text-green-300">Completed</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-700">{completedTasks.length}</Badge>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isCompleted
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    subject: string;
    status: string;
    estimatedMins: number | null;
    dueDate: string | null;
  };
  isCompleted?: boolean;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
}

function TaskCard({ task, isCompleted = false, onStatusChange, onDelete }: TaskCardProps) {
  const nextStatus =
    task.status === "todo" ? "in-progress" : task.status === "in-progress" ? "completed" : "todo";
  const actionLabel =
    task.status === "todo" ? "Start" : task.status === "in-progress" ? "Complete" : "Reopen";

  return (
    <Card className={`group hover:shadow-md transition-all duration-200 ${isCompleted ? "opacity-70 bg-slate-50" : ""}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
            {task.subject}
          </Badge>
          <div className="flex items-center gap-1">
            {task.estimatedMins && (
              <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3 mr-1" />
                {task.estimatedMins}m
              </div>
            )}
            <button
              onClick={() => onDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div>
          <h4 className={`font-semibold text-sm ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {task.title}
          </h4>
          {task.dueDate && (
            <p className="text-xs text-muted-foreground mt-1">
              Due {format(new Date(task.dueDate + "T00:00:00"), "MMM d")}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onStatusChange(task.id, nextStatus)}
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
