/**
 * GET /api/cron/refresh — called by Vercel Cron at 6:00 AM daily.
 * Triggers a revalidation of the campaigns data cache.
 *
 * Configure in vercel.json:
 *   { "crons": [{ "path": "/api/cron/refresh", "schedule": "0 6 * * *" }] }
 *
 * The CRON_SECRET env var must match the Authorization header sent by Vercel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Revalidate the campaigns API route so next request fetches fresh data
    revalidatePath('/api/campaigns');
    revalidatePath('/');
    revalidatePath('/todo');
    revalidatePath('/calendar');
    revalidatePath('/campaigns');

    return NextResponse.json({
      ok: true,
      revalidatedAt: new Date().toISOString(),
      message: 'Dashboard data cache cleared — next request will refetch from HubSpot and PostHog',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Revalidation failed', detail: String(err) },
      { status: 500 }
    );
  }
}
