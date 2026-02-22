import { createAdminClient } from "./supabase-admin";

const SETTINGS_KEY = "openai_chat_model";
const DEFAULT_MODEL = "gpt-4o";

export async function getOpenAIChatModel(): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    if (error || !data?.value) {
      return process.env.OPENAI_CHAT_MODEL || DEFAULT_MODEL;
    }
    return data.value;
  } catch {
    return process.env.OPENAI_CHAT_MODEL || DEFAULT_MODEL;
  }
}

export async function setOpenAIChatModel(model: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: SETTINGS_KEY, value: model, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) {
      console.warn("ai-model setOpenAIChatModel:", error.message, error.code);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("ai-model setOpenAIChatModel:", msg);
    return { ok: false, error: msg };
  }
}
