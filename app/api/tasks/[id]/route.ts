/**
 * PATCH /api/tasks/[id] — update a task's status.
 * In v1 this persists in-memory (per serverless invocation).
 * A future iteration should persist to a database (e.g. Supabase / Postgres).
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TaskStatus } from '@/types/commsTask';

// In-process store — survives only within the same server instance / request lifecycle.
// Replace with DB persistence in v2.
export const taskStatusStore = new Map<string, { status: TaskStatus; completedAt?: string }>();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { status } = body as { status: TaskStatus };

  const validStatuses: TaskStatus[] = ['Pending', 'InProgress', 'Sent', 'Blocked', 'Expired'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const update: { status: TaskStatus; completedAt?: string } = { status };
  if (status === 'Sent') {
    update.completedAt = new Date().toISOString();
  }

  taskStatusStore.set(params.id, update);

  return NextResponse.json({ id: params.id, ...update });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const stored = taskStatusStore.get(params.id);
  if (!stored) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json({ id: params.id, ...stored });
}
