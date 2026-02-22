import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAdminSession } from "@/lib/admin-session";
import { getOpenAIChatModel } from "@/lib/ai-model";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    );
  }
  try {
    const body = await req.json();
    const { text } = body as { text: string };
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "text required" },
        { status: 400 }
      );
    }

    const model = await getOpenAIChatModel();
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an editor. Your task is to turn the user's raw text into a clear, well-formatted assignment question or description.
- Fix grammar and clarity.
- Remove redundancy; keep all important requirements and instructions.
- Format for readability (short paragraphs, lists if helpful).
- Output valid JSON only, no markdown code fence, with two keys:
  "curatedText": the full curated assignment text (string).
  "edits": array of changes, each object with:
    - "type": either "deleted" or "edited"
    - "from": the original phrase/sentence (for both types)
    - "to": the replacement (only for "edited"; omit for "deleted")
  Keep each "from"/"to" short (phrase or one sentence). List the main changes only.`,
        },
        {
          role: "user",
          content: text.trim(),
        },
      ],
      max_completion_tokens: 2048,
    });

    const raw =
      completion.choices[0]?.message?.content?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw;
    let parsed: { curatedText?: string; edits?: Array<{ type: string; from?: string; to?: string }> };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { curatedText: raw, edits: [] };
    }
    const curatedText =
      typeof parsed.curatedText === "string"
        ? parsed.curatedText
        : raw;
    const edits = Array.isArray(parsed.edits)
      ? parsed.edits.filter(
          (e) =>
            e &&
            (e.type === "deleted" || e.type === "edited") &&
            (e.from != null || e.to != null)
        )
      : [];

    return NextResponse.json({ curatedText, edits });
  } catch (err) {
    console.error("OpenAI curate error:", err);
    return NextResponse.json(
      { error: "Failed to curate text" },
      { status: 500 }
    );
  }
}
