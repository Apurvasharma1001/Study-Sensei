import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Send, Bot, User, Sparkles, Trash2 } from "lucide-react";
import { useChatHistory, useSendMessage, useClearChat } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";

export default function Tutor() {
  const { data, isLoading: historyLoading } = useChatHistory();
  const sendMessage = useSendMessage();
  const clearChat = useClearChat();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = data?.data?.messages ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, sendMessage.isPending]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const msg = inputValue.trim();
    setInputValue("");

    try {
      await sendMessage.mutateAsync(msg);
    } catch (error) {
      toast({
        title: "AI Tutor Error",
        description: error instanceof Error ? error.message : "Could not get a response",
        variant: "destructive",
      });
    }
  };

  const handleClear = async () => {
    try {
      await clearChat.mutateAsync();
      toast({ title: "Chat cleared" });
    } catch {
      toast({ title: "Failed to clear chat", variant: "destructive" });
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <span className="bg-primary/10 p-2 rounded-xl text-primary"><Bot className="w-8 h-8" /></span>
            AI Tutor
          </h1>
          <p className="text-muted-foreground ml-14">Ask me anything about your syllabus. I learn as you learn.</p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={clearChat.isPending}
            className="text-muted-foreground"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex-1 bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Spinner className="size-4" /> Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-primary/10 p-4 rounded-2xl mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">Start a Conversation</h3>
                <p className="text-muted-foreground max-w-sm">
                  Ask a question about any topic. If you've uploaded a syllabus, I'll use it as context.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className={`w-10 h-10 border-2 shrink-0 ${message.role === "assistant" ? "bg-primary/10 border-primary/20" : "bg-secondary/20 border-secondary/50"}`}>
                    {message.role === "assistant" ? (
                      <AvatarFallback className="text-primary"><Sparkles className="w-5 h-5" /></AvatarFallback>
                    ) : (
                      <AvatarFallback className="text-foreground"><User className="w-5 h-5" /></AvatarFallback>
                    )}
                  </Avatar>

                  <div className={`flex flex-col max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xs ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted/50 text-foreground rounded-tl-none border border-border/50"
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {sendMessage.isPending && (
              <div className="flex gap-4">
                <Avatar className="w-10 h-10 border-2 bg-primary/10 border-primary/20 shrink-0">
                  <AvatarFallback className="text-primary"><Sparkles className="w-5 h-5" /></AvatarFallback>
                </Avatar>
                <div className="p-4 rounded-2xl rounded-tl-none bg-muted/50 border border-border/50 shadow-xs">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="size-4" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t border-border">
          <div className="relative flex items-center">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask a question..."
              className="pr-12 py-6 rounded-full shadow-sm border-muted-foreground/20 focus-visible:ring-primary/20 text-base pl-6"
              disabled={sendMessage.isPending}
            />
            <Button
              size="icon"
              className="absolute right-2 rounded-full h-10 w-10 bg-primary hover:bg-primary/90 shadow-md transition-transform hover:scale-105 active:scale-95"
              onClick={handleSend}
              disabled={sendMessage.isPending || !inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
