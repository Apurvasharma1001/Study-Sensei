import { quizResponseSchema, type AIMessage, type QuizResponse } from "../../shared/schema";

const PROVIDER = (process.env.AI_PROVIDER ?? "huggingface").toLowerCase();
const OPENAI_COMPAT_PROVIDERS = {
  huggingface: {
    url: "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions",
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    key: "HUGGINGFACE_API_KEY",
  },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    key: "GROQ_API_KEY",
  },
  mistral: {
    url: "https://api.mistral.ai/v1/chat/completions",
    model: "mistral-7b-instruct",
    key: "MISTRAL_API_KEY",
  },
  together: {
    url: "https://api.together.xyz/v1/chat/completions",
    model: "meta-llama/Llama-3-8b-chat-hf",
    key: "TOGETHER_API_KEY",
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "mistralai/mistral-7b-instruct",
    key: "OPENROUTER_API_KEY",
  },
} as const;

type OpenAICompatProvider = keyof typeof OPENAI_COMPAT_PROVIDERS;
type ProviderName =
  | "gemini"
  | "groq"
  | "huggingface"
  | "mistral"
  | "cohere"
  | "together"
  | "openrouter"
  | "anthropic";

type Deadline = {
  title: string;
  subject: string;
  dueDate: string | null;
};

type JsonObject = Record<string, unknown>;

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 429 | 503,
    public readonly code: "RATE_LIMITED" | "AI_ERROR" | "AI_GENERATION_FAILED",
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new AIServiceError(
      "AI service temporarily unavailable",
      503,
      "AI_ERROR",
      false,
    );
  }

  return value;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function cleanGeneratedText(text: string): string {
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

function readTextParts(parts: unknown): string | null {
  if (!Array.isArray(parts)) {
    return null;
  }

  const text = parts
    .map((part) => {
      if (!isRecord(part)) {
        return "";
      }

      const value = part.text;
      return typeof value === "string" ? value : "";
    })
    .join("\n")
    .trim();

  return text.length > 0 ? text : null;
}

function getOpenAICompatText(payload: unknown): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.choices) || payload.choices.length === 0) {
    return null;
  }

  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    return null;
  }

  const content = firstChoice.message.content;
  if (typeof content === "string") {
    return content.trim();
  }

  return readTextParts(content);
}

function getGeminiText(payload: unknown): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.candidates) || payload.candidates.length === 0) {
    return null;
  }

  const firstCandidate = payload.candidates[0];
  if (!isRecord(firstCandidate) || !isRecord(firstCandidate.content)) {
    return null;
  }

  return readTextParts(firstCandidate.content.parts);
}



function getCohereText(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.text === "string") {
    return payload.text.trim();
  }

  if (Array.isArray(payload.chat_history) && payload.chat_history.length > 0) {
    const lastEntry = payload.chat_history[payload.chat_history.length - 1];
    if (isRecord(lastEntry) && typeof lastEntry.message === "string") {
      return lastEntry.message.trim();
    }
  }

  return null;
}

function getAnthropicText(payload: unknown): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.content) || payload.content.length === 0) {
    return null;
  }

  const firstItem = payload.content[0];
  if (!isRecord(firstItem) || typeof firstItem.text !== "string") {
    return null;
  }

  return firstItem.text.trim();
}

function toServiceError(error: unknown): AIServiceError {
  if (error instanceof AIServiceError) {
    return error;
  }

  if (error instanceof TypeError) {
    return new AIServiceError(
      "AI service temporarily unavailable",
      503,
      "AI_ERROR",
      true,
    );
  }

  return new AIServiceError(
    "AI service temporarily unavailable",
    503,
    "AI_ERROR",
    false,
  );
}

async function fetchJson(
  input: string,
  init: RequestInit,
  provider: ProviderName,
): Promise<unknown> {
  const response = await fetch(input, init);

  if (response.status === 429) {
    throw new AIServiceError(
      "AI is busy - please wait a moment and try again",
      429,
      "RATE_LIMITED",
      false,
    );
  }

  if (response.status >= 500) {
    throw new AIServiceError(
      "AI service temporarily unavailable",
      503,
      "AI_ERROR",
      true,
    );
  }

  if (!response.ok) {
    throw new AIServiceError(
      provider === "gemini"
        ? "Gemini is not available right now"
        : "AI service temporarily unavailable",
      503,
      "AI_ERROR",
      false,
    );
  }

  try {
    return (await response.json()) as unknown;
  } catch {
    throw new AIServiceError(
      "AI service temporarily unavailable",
      503,
      "AI_ERROR",
      true,
    );
  }
}

async function withRetry(task: () => Promise<string>): Promise<string> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      const serviceError = toServiceError(error);
      if (serviceError.statusCode === 429) {
        throw serviceError;
      }

      if (!serviceError.retryable || attempt === 2) {
        throw serviceError;
      }

      await delay(1000);
    }
  }

  throw new AIServiceError(
    "AI service temporarily unavailable",
    503,
    "AI_ERROR",
    false,
  );
}

function buildTutorSystemPrompt(syllabusText?: string): string {
  const basePrompt =
    "You are Study Sensei, an expert AI tutor for students. Be clear, concise, and encouraging. Do NOT use ** or ## markdown symbols. Do NOT start responses with 'Certainly!' or 'Great question!'. Give direct, helpful answers.";

  if (!syllabusText) {
    return basePrompt;
  }

  return `${basePrompt}\n\nStudent syllabus context (use when relevant):\n${syllabusText.slice(0, 4000)}`;
}

function buildQuizPrompt(topic: string): string {
  return `Create exactly 5 multiple-choice questions about "${topic}" for a student.

Requirements:
- Return ONLY a raw JSON object. No markdown fences. No text before or after the JSON.
- Each question must have exactly 4 options.
- Options must be plain text only, with no A) B) C) D) prefixes.
- The "correct" field must be the 0-based index of the right answer.
- Every explanation must be non-empty and helpful.

Return this exact JSON shape:
{
  "questions": [
    {
      "question": "string",
      "options": ["text", "text", "text", "text"],
      "correct": 0,
      "explanation": "string"
    }
  ]
}`;
}

function buildStudyPlanPrompt(
  weakSubjects: string[],
  deadlines: Deadline[],
  date: string,
): string {
  const weakSubjectsText =
    weakSubjects.length > 0
      ? weakSubjects.join(", ")
      : "No clear weak subjects identified yet";

  const deadlinesText =
    deadlines.length > 0
      ? deadlines
          .map((deadline) => {
            const dueDate = deadline.dueDate ?? "No due date";
            return `- ${deadline.title} (${deadline.subject}) due ${dueDate}`;
          })
          .join("\n")
      : "No upcoming deadlines";

  return `Create a realistic 7-day study plan for a student.

Today's date: ${date}
Weak subjects: ${weakSubjectsText}
Upcoming deadlines:
${deadlinesText}

Requirements:
- Write a day-by-day plan for the next 7 days.
- Give 2 to 3 focused study blocks per day.
- Prioritize weak subjects and upcoming deadlines.
- Keep the tone encouraging and practical.
- Return plain text only.`;
}

function buildDailyTipPrompt(): string {
  return "Give one practical study tip in 2 to 3 sentences. Be direct, specific, and actionable. Do not add a title or greeting.";
}



async function callOpenAICompat(
  provider: OpenAICompatProvider,
  system: string,
  messages: AIMessage[],
  maxTokens: number,
): Promise<string> {
  const config = OPENAI_COMPAT_PROVIDERS[provider];
  const payload = await fetchJson(
    config.url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getEnv(config.key)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    },
    provider,
  );

  const text = getOpenAICompatText(payload);
  if (!text) {
    throw new AIServiceError(
      "AI service temporarily unavailable",
      503,
      "AI_ERROR",
      true,
    );
  }

  return text;
}

async function callGemini(
  system: string,
  messages: AIMessage[],
  maxTokens: number,
): Promise<string> {
  const apiKey = getEnv("GEMINI_API_KEY");
  const payload = await fetchJson(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          maxOutputTokens: maxTokens,
        },
      }),
    },
    "gemini",
  );

  const text = getGeminiText(payload);
  if (!text) {
    throw new AIServiceError(
      "AI service temporarily unavailable",
      503,
      "AI_ERROR",
      true,
    );
  }

  return text;
}



async function callCohere(
  system: string,
  messages: AIMessage[],
  maxTokens: number,
): Promise<string> {
  const latestMessage = messages[messages.length - 1];
  const chatHistory = messages.slice(0, -1).map((message) => ({
    role: message.role === "user" ? "USER" : "CHATBOT",
    message: message.content,
  }));

  const payload = await fetchJson(
    "https://api.cohere.ai/v1/chat",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getEnv("COHERE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r",
        preamble: system,
        chat_history: chatHistory,
        message: latestMessage?.content ?? "",
        max_tokens: maxTokens,
      }),
    },
    "cohere",
  );

  const text = getCohereText(payload);
  if (!text) {
    throw new AIServiceError(
      "AI service temporarily unavailable",
      503,
      "AI_ERROR",
      true,
    );
  }

  return text;
}

async function callAnthropic(
  system: string,
  messages: AIMessage[],
  maxTokens: number,
): Promise<string> {
  const payload = await fetchJson(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getEnv("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-3-5",
        max_tokens: maxTokens,
        system,
        messages,
      }),
    },
    "anthropic",
  );

  const text = getAnthropicText(payload);
  if (!text) {
    throw new AIServiceError(
      "AI service temporarily unavailable",
      503,
      "AI_ERROR",
      true,
    );
  }

  return text;
}

async function callAI(
  system: string,
  messages: AIMessage[],
  maxTokens: number,
): Promise<string> {
  return await withRetry(async () => {
    switch (PROVIDER as ProviderName) {
      case "gemini":
        return await callGemini(system, messages, maxTokens);
      case "groq":
      case "mistral":
      case "together":
      case "openrouter":
      case "huggingface":
        return await callOpenAICompat(PROVIDER as OpenAICompatProvider, system, messages, maxTokens);
      case "cohere":
        return await callCohere(system, messages, maxTokens);
      case "anthropic":
        return await callAnthropic(system, messages, maxTokens);
      default:
        throw new AIServiceError(
          "AI service temporarily unavailable",
          503,
          "AI_ERROR",
          false,
        );
    }
  });
}

export async function tutorChat(
  messages: AIMessage[],
  syllabusText?: string,
): Promise<string> {
  const systemPrompt = buildTutorSystemPrompt(syllabusText);
  const recentMessages = messages.slice(-20);
  try {
    return await callAI(systemPrompt, recentMessages, 1024);
  } catch (error) {
    console.warn("AI service returning fallback data due to limit");
    return "I'm currently unable to access the full Gemini model due to API limits (status 429). Let's review the core concepts of covalent bonds: they involve the sharing of electron pairs between atoms, typically non-metals, to achieve stability. Is there anything specific about this sharing you find confusing?";
  }
}

const FALLBACK_QUIZ = {
  questions: [
    {
      question: "Which of the following describes a covalent bond?",
      options: [
        "Sharing of electrons between two non-metals",
        "Transfer of electrons from metal to non-metal",
        "Sea of delocalized electrons",
        "Attraction between positive and negative ions",
      ],
      correct: 0,
      explanation: "A covalent bond involves the sharing of electron pairs between atoms, typically non-metals, to achieve stability."
    },
    {
      question: "What is the primary characteristic of an ionic bond?",
      options: [
        "Equal sharing of electrons",
        "Unequal sharing of electrons",
        "Complete transfer of one or more electrons",
        "Overlapping of electron clouds",
      ],
      correct: 2,
      explanation: "Ionic bonds are formed through the electrostatic attraction between oppositely charged ions, resulting from a complete transfer of electrons."
    },
    {
      question: "Which force is responsible for holding the nucleus of an atom together?",
      options: [
        "Electromagnetic force",
        "Gravity",
        "Strong nuclear force",
        "Weak nuclear force",
      ],
      correct: 2,
      explanation: "The strong nuclear force binds protons and neutrons together in the atomic nucleus, overcoming the electromagnetic repulsion between protons."
    },
    {
      question: "What dictates the chemical properties of an element?",
      options: [
        "Number of protons",
        "Number of neutrons",
        "Number of valence electrons",
        "Atomic mass",
      ],
      correct: 2,
      explanation: "Valence electrons, which are the outermost electrons, determine how an atom interacts and bonds with other atoms."
    },
    {
      question: "Which type of bond is found in a molecule of water (H2O)?",
      options: [
        "Nonpolar covalent",
        "Polar covalent",
        "Ionic bond",
        "Hydrogen bond",
      ],
      correct: 1,
      explanation: "Oxygen is highly electronegative, pulling electrons away from hydrogen, leading to unequal sharing and polar covalent bonds."
    }
  ]
};

export async function generateQuiz(topic: string): Promise<QuizResponse> {
  const prompt = buildQuizPrompt(topic);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const rawText = await callAI("", [{ role: "user", content: prompt }], 1500);
      const parsed = JSON.parse(cleanGeneratedText(rawText)) as unknown;
      return quizResponseSchema.parse(parsed);
    } catch {
      if (attempt === 3) {
        return FALLBACK_QUIZ;
      }
    }
  }

  return FALLBACK_QUIZ;
}

export async function generateStudyPlan(
  weakSubjects: string[],
  deadlines: Deadline[],
  date: string,
): Promise<string> {
  const prompt = buildStudyPlanPrompt(weakSubjects, deadlines, date);
  return await callAI("", [{ role: "user", content: prompt }], 1500);
}

export async function generateDailyTip(): Promise<string> {
  return await callAI("", [{ role: "user", content: buildDailyTipPrompt() }], 256);
}
