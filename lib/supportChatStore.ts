import { promises as fs } from 'fs';
import path from 'path';

export interface SupportMessage {
  id: string;           // uuid
  cid: string;          // conversation id
  author: "client" | "support";
  text: string;
  createdAt: string;    // ISO
}

// Base directory for support messages storage
const SUPPORT_MESSAGES_FILE = path.join(process.cwd(), 'data', 'support-messages.json');

/**
 * Ensures the data directory exists
 */
async function ensureDataDirectory(): Promise<void> {
  const dataDir = path.dirname(SUPPORT_MESSAGES_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

/**
 * Reads all messages from the storage file
 */
async function readMessages(): Promise<SupportMessage[]> {
  try {
    await fs.access(SUPPORT_MESSAGES_FILE);
    const content = await fs.readFile(SUPPORT_MESSAGES_FILE, 'utf-8');
    const messages: SupportMessage[] = JSON.parse(content);
    return messages;
  } catch {
    // File doesn't exist yet, return empty array
    return [];
  }
}

/**
 * Writes all messages to the storage file
 */
async function writeMessages(messages: SupportMessage[]): Promise<void> {
  await ensureDataDirectory();
  const content = JSON.stringify(messages, null, 2);
  await fs.writeFile(SUPPORT_MESSAGES_FILE, content, 'utf-8');
}

/**
 * Adds a new support message to the storage
 */
export async function addSupportMessage(msg: SupportMessage): Promise<void> {
  const messages = await readMessages();
  messages.push(msg);
  await writeMessages(messages);
}

/**
 * Gets all messages for a specific conversation ID (CID)
 * Optionally filters by messages created after a specific timestamp
 */
export async function getMessagesByCid(cid: string, since?: string): Promise<SupportMessage[]> {
  const messages = await readMessages();
  
  // Filter by CID
  let filtered = messages.filter(msg => msg.cid === cid);
  
  // Filter by timestamp if provided
  if (since) {
    const sinceDate = new Date(since);
    filtered = filtered.filter(msg => {
      const msgDate = new Date(msg.createdAt);
      return msgDate > sinceDate;
    });
  }
  
  // Sort by createdAt ascending
  filtered.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB;
  });
  
  return filtered;
}

