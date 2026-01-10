// lib/db-support.ts
// Database functions for support system using Supabase

// TODO: This file needs to be migrated to use backend API
// import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type SupportSession = {
  id: string;
  cid: string;
  topic_id: number | null;
  user_name: string | null;
  user_id: string | null;
  email: string | null;
  created_at: string;
};

export type SupportMessage = {
  id: string;
  cid: string;
  author: "user" | "support";
  text: string;
  created_at: string;
  is_read: boolean;
};

/**
 * Get or create a support session by CID
 */
export async function getOrCreateSession(params: {
  cid: string;
  user_name?: string | null;
  user_id?: string | null;
  email?: string | null;
}): Promise<SupportSession> {
  // TODO: Migrate to backend API
  throw new Error('This function is deprecated and needs to be migrated to use backend API');
  // const supabase = createAdminSupabaseClient();

  /* OLD CODE - REMOVED
  const supabase = createAdminSupabaseClient();
  
  // Try to find existing session
  const { data: existing, error: findError } = await supabase
    .from("support_sessions")
    .select("*")
    .eq("cid", params.cid)
    .single();

  if (existing && !findError) {
    return existing as SupportSession;
  }

  // Create new session
  const { data: newSession, error: createError } = await supabase
    .from("support_sessions")
    .insert({
      cid: params.cid,
      topic_id: null,
      user_name: params.user_name || null,
      user_id: params.user_id || null,
      email: params.email || null,
    })
    .select()
    .single();

  if (createError || !newSession) {
    throw new Error(`Failed to create session: ${createError?.message || "Unknown error"}`);
  }

  return newSession as SupportSession;
  */ // END OLD CODE
}

/**
 * Update session with topic_id
 */
export async function updateSessionTopicId(
  cid: string,
  topicId: number
): Promise<void> {
  // TODO: Migrate to backend API
  throw new Error('This function is deprecated and needs to be migrated to use backend API');
  
  /* OLD CODE - REMOVED
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("support_sessions")
    .update({ topic_id: topicId })
    .eq("cid", cid);

  if (error) {
    throw new Error(`Failed to update session topic_id: ${error.message}`);
  }
  */ // END OLD CODE
}

/**
 * Get session by topic_id
 */
export async function getSessionByTopicId(
  topicId: number
): Promise<SupportSession | null> {
  // TODO: Migrate to backend API
  throw new Error('This function is deprecated and needs to be migrated to use backend API');
  
  /* OLD CODE - REMOVED
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("support_sessions")
    .select("*")
    .eq("topic_id", topicId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as SupportSession;
  */ // END OLD CODE
}

/**
 * Save a support message
 */
export async function saveSupportMessage(params: {
  cid: string;
  author: "user" | "support";
  text: string;
}): Promise<SupportMessage> {
  // TODO: Migrate to backend API
  throw new Error('This function is deprecated and needs to be migrated to use backend API');
  
  /* OLD CODE - REMOVED
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("support_messages")
    .insert({
      cid: params.cid,
      author: params.author,
      text: params.text.trim(),
      is_read: params.author === "user" ? true : false, // User messages are always "read"
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to save message: ${error?.message || "Unknown error"}`);
  }

  return data as SupportMessage;
  */ // END OLD CODE
}

/**
 * Get unread support messages for a CID
 * Returns messages and marks them as read
 */
export async function getAndMarkUnreadMessages(
  cid: string
): Promise<SupportMessage[]> {
  // TODO: Migrate to backend API
  throw new Error('This function is deprecated and needs to be migrated to use backend API');
  
  /* OLD CODE - REMOVED
  const supabase = createAdminSupabaseClient();

  // Get unread support messages
  const { data: messages, error: fetchError } = await supabase
    .from("support_messages")
    .select("*")
    .eq("cid", cid)
    .eq("author", "support")
    .eq("is_read", false)
    .order("created_at", { ascending: true });

  if (fetchError) {
    throw new Error(`Failed to fetch messages: ${fetchError.message}`);
  }

  if (!messages || messages.length === 0) {
    return [];
  }

  // Mark messages as read
  const messageIds = messages.map((m: any) => m.id);
  const { error: updateError } = await supabase
    .from("support_messages")
    .update({ is_read: true })
    .in("id", messageIds);

  if (updateError) {
    console.error("Failed to mark messages as read:", updateError);
    // Don't throw - we still want to return the messages
  }

  return messages as SupportMessage[];
  */ // END OLD CODE
}

