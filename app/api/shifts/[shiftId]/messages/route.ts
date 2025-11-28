import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * SHIFT MESSAGES STORAGE
 * Messages are stored as: data/shifts/{shiftId}-messages.json
 */

const SHIFTS_DIR = path.join(process.cwd(), 'data', 'shifts');

interface ShiftMessage {
  id: string;
  text: string;
  senderRole: 'employee' | 'manager' | 'director' | string;
  createdAt: string;
  shiftId: string;
}

/**
 * Ensure directory exists
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Get messages file path for a shift
 */
function getMessagesFilePath(shiftId: string): string {
  return path.join(SHIFTS_DIR, `${shiftId}-messages.json`);
}

/**
 * Load messages for a shift
 */
async function loadShiftMessages(shiftId: string): Promise<ShiftMessage[]> {
  await ensureDirectoryExists(SHIFTS_DIR);
  
  const filePath = getMessagesFilePath(shiftId);
  
  try {
    await fs.access(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    // File doesn't exist, return empty array
    return [];
  }
}

/**
 * Save messages for a shift
 */
async function saveShiftMessages(shiftId: string, messages: ShiftMessage[]): Promise<void> {
  await ensureDirectoryExists(SHIFTS_DIR);
  
  const filePath = getMessagesFilePath(shiftId);
  await fs.writeFile(filePath, JSON.stringify(messages, null, 2), 'utf-8');
}

/**
 * GET /api/shifts/[shiftId]/messages
 * Get all messages for a shift
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shiftId: string } }
) {
  try {
    const { shiftId } = params;

    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: 'Shift ID is required' },
        { status: 400 }
      );
    }

    const messages = await loadShiftMessages(shiftId);

    // Sort by creation date (oldest first)
    const sortedMessages = messages.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json(sortedMessages);

  } catch (error: any) {
    console.error('[Get Shift Messages API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to load messages',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shifts/[shiftId]/messages
 * Create a new message for a shift
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { shiftId: string } }
) {
  try {
    const { shiftId } = params;
    const body = await request.json();
    const { text } = body;

    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: 'Shift ID is required' },
        { status: 400 }
      );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message text is required' },
        { status: 400 }
      );
    }

    // TODO: Get current user from session/auth
    // For now, we'll use a placeholder sender role
    // In production, get from auth: const user = await getCurrentUser();
    const senderRole = 'employee'; // TODO: get from auth

    // Load existing messages
    const existingMessages = await loadShiftMessages(shiftId);

    // Create new message
    const newMessage: ShiftMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      text: text.trim(),
      senderRole,
      createdAt: new Date().toISOString(),
      shiftId,
    };

    // Add to messages array
    const updatedMessages = [...existingMessages, newMessage];

    // Save messages
    await saveShiftMessages(shiftId, updatedMessages);

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error: any) {
    console.error('[Create Shift Message API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create message',
      },
      { status: 500 }
    );
  }
}










