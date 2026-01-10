import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type SupportAuthor = "user" | "support";

export interface SupportMessage {
  id: string;
  cid: string;          // conversation id
  author: SupportAuthor;
  text: string;
  createdAt: string;    // ISO
}

/**
 * Gets all support messages for a specific conversation ID (CID)
 * Returns messages ordered by creation time ascending
 */
export async function getSupportMessages(cid: string): Promise<SupportMessage[]> {
  // TODO: Replace with new API client
  throw new Error('Temporarily disabled for migration');
  /* const supabase = createAdminSupabaseClient();
  
  const { data, error } = await supabase
    .from("support_messages")
    .select("id, client_id, sender, text, created_at")
    .eq("client_id", cid)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getSupportMessages] error", error);
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    cid: row.client_id,
    author: (row.sender === "client" ? "user" : "support") as SupportAuthor,
    text: row.text ?? "",
    createdAt: row.created_at,
  })); */
}

/**
 * Adds a new support message to the database
 */
export async function addSupportMessage(msg: SupportMessage): Promise<void> {
  // TODO: Replace with new API client
  throw new Error('Temporarily disabled for migration');
  /* const supabase = createAdminSupabaseClient();
  
  // Convert author: "user" -> sender: "client", author: "support" -> sender: "support"
  const sender = msg.author === "user" ? "client" : "support";
  
  const { error } = await supabase.from("support_messages").insert({
    id: msg.id,
    client_id: msg.cid,
    sender: sender,
    text: msg.text,
    created_at: msg.createdAt,
  });

  if (error) {
    console.error("[addSupportMessage] error", error);
    throw error;
  } */
}

