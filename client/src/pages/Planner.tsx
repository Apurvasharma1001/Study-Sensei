import { useState } from "react";
// Removed unused dnd imports
import { TASKS, Task } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Planner() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Study Planner</h1>
          <p className="text-muted-foreground">Organize your syllabus into manageable tasks.</p>
        </div>
        <div className="flex items-center gap-3">
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)] overflow-hidden">
        {/* Todo Column */}
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-slate-700 dark:text-slate-200">To Do</h3>
            <Badge variant="secondary" className="bg-slate-200 text-slate-700">3</Badge>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {TASKS.filter(t => t.status === 'todo').map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
            <div className="p-3 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-sm hover:border-slate-300 hover:text-slate-500 cursor-pointer transition-colors">
              + Add new task
            </div>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex flex-col h-full bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-blue-700 dark:text-blue-300">In Progress</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">1</Badge>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {TASKS.filter(t => t.status === 'in-progress').map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* Completed Column */}
        <div className="flex flex-col h-full bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-green-700 dark:text-green-300">Completed</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-700">1</Badge>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {TASKS.filter(t => t.status === 'completed').map(task => (
              <TaskCard key={task.id} task={task} isCompleted />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, isCompleted = false }: { task: Task, isCompleted?: boolean }) {
  return (
    <Card className={`group hover:shadow-md transition-all duration-200 cursor-pointer ${isCompleted ? 'opacity-70 bg-slate-50' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
            {task.subject}
          </Badge>
          {task.estimatedTime && (
            <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3 mr-1" />
              {task.estimatedTime}m
            </div>
          )}
        </div>
        <div>
          <h4 className={`font-semibold text-sm ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Due {format(task.dueDate, "MMM d")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
