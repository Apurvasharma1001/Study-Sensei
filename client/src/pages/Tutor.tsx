import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hi John! I'm your AI Study Companion. I noticed you have a Chemistry test coming up. Would you like to review 'Organic Chemistry' concepts or practice some quiz questions?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5)
  },
  {
    id: '2',
    role: 'user',
    content: "Let's review the basics of Hydrocarbons first.",
    timestamp: new Date(Date.now() - 1000 * 60 * 2)
  },
  {
    id: '3',
    role: 'assistant',
    content: "Great choice! Hydrocarbons are organic compounds consisting entirely of hydrogen and carbon. \n\nThey are the simplest organic compounds and can be classified into:\n1. **Alkanes** (single bonds)\n2. **Alkenes** (double bonds)\n3. **Alkynes** (triple bonds)\n\nWould you like a quick example for each?",
    timestamp: new Date(Date.now())
  }
];

export default function Tutor() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages([...messages, newMessage]);
    setInputValue("");
    
    // Mock response
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "That's a great question! I'm analyzing your syllabus to give you the most relevant answer...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <span className="bg-primary/10 p-2 rounded-xl text-primary"><Bot className="w-8 h-8" /></span>
          AI Tutor
        </h1>
        <p className="text-muted-foreground ml-14">Ask me anything about your syllabus. I learn as you learn.</p>
      </div>

      <div className="flex-1 bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className={`w-10 h-10 border-2 ${message.role === 'assistant' ? 'bg-primary/10 border-primary/20' : 'bg-secondary/20 border-secondary/50'}`}>
                  {message.role === 'assistant' ? (
                    <AvatarFallback className="text-primary"><Sparkles className="w-5 h-5" /></AvatarFallback>
                  ) : (
                    <AvatarFallback className="text-foreground"><User className="w-5 h-5" /></AvatarFallback>
                  )}
                </Avatar>
                
                <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xs ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-muted/50 text-foreground rounded-tl-none border border-border/50'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'assistant' && (
                    <div className="flex gap-2 mt-2 ml-1">
                      <button className="text-muted-foreground hover:text-green-600 transition-colors p-1"><ThumbsUp className="w-4 h-4" /></button>
                      <button className="text-muted-foreground hover:text-red-500 transition-colors p-1"><ThumbsDown className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t border-border">
          <div className="relative flex items-center">
            <Input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about Organic Chemistry..."
              className="pr-12 py-6 rounded-full shadow-sm border-muted-foreground/20 focus-visible:ring-primary/20 text-base pl-6"
            />
            <Button 
              size="icon" 
              className="absolute right-2 rounded-full h-10 w-10 bg-primary hover:bg-primary/90 shadow-md transition-transform hover:scale-105 active:scale-95"
              onClick={handleSend}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-center mt-3 gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">/explain</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">/quiz</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">/summary</span>
          </div>
        </div>
      </div>
    </div>
  );
}
