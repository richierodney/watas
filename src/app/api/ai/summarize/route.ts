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
    const { messages } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array required" },
        { status: 400 }
      );
    }

    const chatBlock = messages
      .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
      .join("\n\n");

    const model = await getOpenAIChatModel();
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are helping to turn a Q&A tutoring conversation into a presentable assignment solution summary. Your task:
- Produce a clear, well-structured summary that captures the main explanations and answers from the conversation.
- Do NOT remove important parts (definitions, steps, key reasoning). Keep it useful as an assignment solution.
- Use clear headings and short paragraphs. Format for readability.
- Output only the summary text, no meta-commentary.`,
        },
        {
          role: "user",
          content: `Turn this conversation into a presentable assignment solution summary. Keep all important content.\n\n${chatBlock}`,
        },
      ],
      max_completion_tokens: 4096,
    });

    const summary =
      completion.choices[0]?.message?.content ?? "Could not generate summary.";
    const usage = completion.usage;
    const userId = await getUserIdFromRequest(req);
    if (userId && usage) {
      await recordUsage(
        userId,
        "summarize",
        usage.prompt_tokens ?? 0,
        usage.completion_tokens ?? 0
      );
    }
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("OpenAI summarize error:", err);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
