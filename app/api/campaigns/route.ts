import { NextResponse } from 'next/server';
import { loadDashboardData, loadMockData } from '@/lib/campaigns';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

export async function GET() {
  try {
    const data = USE_MOCK ? loadMockData() : await loadDashboardData();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[campaigns/route] Error loading dashboard data:', err);
    return NextResponse.json(
      { error: 'Failed to load campaign data', detail: String(err) },
      { status: 500 }
    );
  }
}

// Allow CORS for the internal dashboard
export const dynamic = 'force-dynamic';
