/**
 * PostHog Query API client.
 * Uses HogQL to aggregate investment data from the 'Investment Made' event.
 */

import type { PostHogCampaignData } from '@/types/campaign';

const POSTHOG_HOST       = process.env.POSTHOG_HOST       ?? 'https://us.posthog.com';
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID ?? '39093';

function getHeaders(): HeadersInit {
  const key = process.env.POSTHOG_API_KEY;
  if (!key) throw new Error('POSTHOG_API_KEY is not set');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

interface HogQLResponse {
  results: unknown[][];
  columns: string[];
  error?: string;
}

async function runHogQL(query: string): Promise<HogQLResponse> {
  const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog API error ${res.status}: ${text}`);
  }

  return res.json();
}

/** Fetch total raised + timing for all campaigns with successful investments in the last 90 days. */
export async function fetchAllCampaignFunding(): Promise<PostHogCampaignData[]> {
  const query = `
    SELECT
      properties.campaignName,
      properties.campaignMinimumFundingGoal,
      properties.campaignMaximumFundingGoal,
      sum(toFloat(properties.investmentAmount)) AS total_raised,
      min(timestamp) AS first_investment,
      max(timestamp) AS last_investment,
      round(
        sum(toFloat(properties.investmentAmount))
          / toFloat(properties.campaignMinimumFundingGoal) * 100,
        1
      ) AS pct_of_minimum
    FROM events
    WHERE event = 'Investment Made'
      AND properties.status = 'successful'
      AND timestamp >= now() - interval 90 day
    GROUP BY
      properties.campaignName,
      properties.campaignMinimumFundingGoal,
      properties.campaignMaximumFundingGoal
    ORDER BY last_investment DESC
  `;

  const data = await runHogQL(query);
  return data.results.map((row) => ({
    campaignName:                 String(row[0] ?? ''),
    campaignMinimumFundingGoal:   parseFloat(String(row[1] ?? '0')),
    campaignMaximumFundingGoal:   parseFloat(String(row[2] ?? '0')),
    total_raised:                 parseFloat(String(row[3] ?? '0')),
    first_investment:             row[4] ? String(row[4]) : null,
    last_investment:              row[5] ? String(row[5]) : null,
    pct_of_minimum:               parseFloat(String(row[6] ?? '0')),
  }));
}

/** Fetch investments raised within 48 hours of launch for strong-start detection. */
export async function fetchRaisedInFirst48Hours(
  campaignName: string,
  launchDate: string // YYYY-MM-DD
): Promise<number> {
  const query = `
    SELECT
      sum(toFloat(properties.investmentAmount)) AS raised_in_first_48hrs
    FROM events
    WHERE event = 'Investment Made'
      AND properties.status = 'successful'
      AND properties.campaignName = '${campaignName.replace(/'/g, "\\'")}'
      AND timestamp <= toDateTime('${launchDate}') + interval 48 hour
  `;

  const data = await runHogQL(query);
  if (!data.results?.[0]?.[0]) return 0;
  return parseFloat(String(data.results[0][0])) || 0;
}

/** Build a name-keyed map of PostHog data for fast O(1) lookups. */
export function buildPostHogMap(
  data: PostHogCampaignData[]
): Map<string, PostHogCampaignData> {
  return new Map(data.map((d) => [d.campaignName, d]));
}
