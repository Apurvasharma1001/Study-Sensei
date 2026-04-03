import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend, type ApiEnvelope } from "@/lib/api";
import type { CreateTaskInput, UpdateTaskInput } from "@shared/schema";

interface TaskRow {
  id: number;
  userId: number;
  title: string;
  subject: string;
  status: string;
  estimatedMins: number | null;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

type TasksPayload = { tasks: TaskRow[] };
type TaskPayload = { task: TaskRow };

const TASKS_KEY = ["/api/tasks"] as const;

export function useTasks(filters?: { status?: string; subject?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.subject) params.set("subject", filters.subject);
  const url = params.toString() ? `/api/tasks?${params}` : "/api/tasks";

  return useQuery<ApiEnvelope<TasksPayload>>({
    queryKey: ["/api/tasks", filters],
    queryFn: () => apiGet<ApiEnvelope<TasksPayload>>(url) as Promise<ApiEnvelope<TasksPayload>>,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskInput) =>
      apiSend<ApiEnvelope<TaskPayload>, CreateTaskInput>("POST", "/api/tasks", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/tasks"] });
      void qc.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTaskInput & { id: number }) =>
      apiSend<ApiEnvelope<TaskPayload>, UpdateTaskInput>("PATCH", `/api/tasks/${id}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/tasks"] });
      void qc.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiSend<ApiEnvelope<{ message: string }>>("DELETE", `/api/tasks/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/tasks"] });
      void qc.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
  });
}
