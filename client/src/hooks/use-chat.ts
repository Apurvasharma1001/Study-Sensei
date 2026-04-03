import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend, type ApiEnvelope } from "@/lib/api";
import type { SendChatInput } from "@shared/schema";

interface ChatMessageRow {
  id: number;
  userId: number;
  role: string;
  content: string;
  createdAt: string;
}

type HistoryPayload = { messages: ChatMessageRow[] };
type ReplyPayload = { reply: string };

const CHAT_KEY = ["/api/chat/history"] as const;

export function useChatHistory() {
  return useQuery<ApiEnvelope<HistoryPayload>>({
    queryKey: CHAT_KEY,
    queryFn: () =>
      apiGet<ApiEnvelope<HistoryPayload>>("/api/chat/history?limit=100") as Promise<
        ApiEnvelope<HistoryPayload>
      >,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (message: string) =>
      apiSend<ApiEnvelope<ReplyPayload>, SendChatInput>("POST", "/api/chat", {
        message,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CHAT_KEY });
    },
  });
}

export function useClearChat() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiSend<ApiEnvelope<{ message: string }>>("DELETE", "/api/chat/history"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CHAT_KEY });
    },
  });
}
