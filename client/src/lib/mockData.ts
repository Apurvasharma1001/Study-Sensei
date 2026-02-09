export interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: Date;
  status: 'todo' | 'in-progress' | 'completed';
  estimatedTime: number; // minutes
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  score?: number;
  totalQuestions: number;
  completedAt?: Date;
}

export interface SubjectStats {
  name: string;
  studyHours: number;
  mastery: number; // 0-100
  color: string;
}

export const TASKS: Task[] = [
  {
    id: '1',
    title: 'Review Organic Chemistry Basics',
    subject: 'Chemistry',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    status: 'todo',
    estimatedTime: 45
  },
  {
    id: '2',
    title: 'Calculus: Integration Practice',
    subject: 'Mathematics',
    dueDate: new Date(),
    status: 'in-progress',
    estimatedTime: 60
  },
  {
    id: '3',
    title: 'History: World War II Essay',
    subject: 'History',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    status: 'todo',
    estimatedTime: 90
  },
  {
    id: '4',
    title: 'Physics: Laws of Motion Quiz',
    subject: 'Physics',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    status: 'completed',
    estimatedTime: 30
  }
];

export const RECENT_QUIZZES: Quiz[] = [
  {
    id: 'q1',
    title: 'Algebra Foundations',
    subject: 'Mathematics',
    score: 85,
    totalQuestions: 20,
    completedAt: new Date(new Date().setDate(new Date().getDate() - 1))
  },
  {
    id: 'q2',
    title: 'Cellular Respiration',
    subject: 'Biology',
    score: 92,
    totalQuestions: 15,
    completedAt: new Date(new Date().setDate(new Date().getDate() - 2))
  },
  {
    id: 'q3',
    title: 'Atomic Structure',
    subject: 'Chemistry',
    totalQuestions: 10
  }
];

export const SUBJECT_STATS: SubjectStats[] = [
  { name: 'Mathematics', studyHours: 24, mastery: 78, color: 'var(--color-chart-1)' },
  { name: 'Physics', studyHours: 18, mastery: 65, color: 'var(--color-chart-2)' },
  { name: 'Chemistry', studyHours: 15, mastery: 82, color: 'var(--color-chart-3)' },
  { name: 'Biology', studyHours: 12, mastery: 90, color: 'var(--color-chart-4)' },
  { name: 'History', studyHours: 8, mastery: 95, color: 'var(--color-chart-5)' }
];

export const WEEKLY_ACTIVITY = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 3.8 },
  { day: 'Wed', hours: 1.5 },
  { day: 'Thu', hours: 4.2 },
  { day: 'Fri', hours: 3.0 },
  { day: 'Sat', hours: 5.5 },
  { day: 'Sun', hours: 2.0 },
];
