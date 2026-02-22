import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { getOpenAIChatModel } from "@/lib/ai-model";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id ?? null;
}

function normalizeMessageContent(
  raw: string | unknown[] | null | undefined
): string {
  if (raw == null) return "No response generated.";
  if (typeof raw === "string") return raw.trim() || "No response generated.";
  if (Array.isArray(raw)) {
    const text = raw
      .map((part) => (part && typeof part === "object" && "text" in part ? String((part as { text: string }).text) : ""))
      .join("");
    return text.trim() || "No response generated.";
  }
  return "No response generated.";
}

async function recordUsage(
  userId: string,
  endpoint: string,
  inputTokens: number,
  outputTokens: number
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key);
  await supabase.from("api_usage").insert({
    user_id: userId,
    endpoint,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    );
  }
  try {
    const body = await req.json();
    const { messages, assignmentContext } = body as {
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      assignmentContext: string;
    };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array required" },
        { status: 400 }
      );
    }

    const systemContent =
      assignmentContext &&
      assignmentContext.trim().length > 0
        ? `You are a tutor that produces assignment solutions. The assignment is:\n\n${assignmentContext}\n\nRules: Follow the assignment instructions STRICTLY. Give ONLY the required deliverable—e.g. if asked for a list of 50 items with descriptions, output exactly that: a direct list (1. ... 2. ... or similar), no introductions, no "here's how to approach", no tips, no extra commentary. Be straight to the point. Do as told.`
        : "You are a tutor that produces assignment solutions. Follow instructions strictly. Output only what is asked—direct and to the point. No extra explanations or tips.";

    const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemContent },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    const model = await getOpenAIChatModel();
    const completion = await openai.chat.completions.create({
      model,
      messages: apiMessages,
      max_completion_tokens: 2048,
    });

    const rawContent = completion.choices[0]?.message?.content;
    const assistantMessage = normalizeMessageContent(rawContent);
    const usage = completion.usage;
    const userId = await getUserIdFromRequest(req);
    if (userId && usage) {
      await recordUsage(
        userId,
        "chat",
        usage.prompt_tokens ?? 0,
        usage.completion_tokens ?? 0
      );
    }
    return NextResponse.json({ message: assistantMessage });
  } catch (err) {
    console.error("OpenAI chat error:", err);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
