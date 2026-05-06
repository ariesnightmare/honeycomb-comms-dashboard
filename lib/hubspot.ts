/**
 * HubSpot CRM API v3 client.
 * Fetches live issuer campaign deals and normalises them into HubSpotDeal objects.
 */

import type { HubSpotDeal } from '@/types/campaign';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

const ACTIVE_PIPELINE_IDS = [
  process.env.HUBSPOT_MAIN_STREET_PIPELINE_ID ?? '31467447',
  process.env.HUBSPOT_CLIMATE_PIPELINE_ID ?? '828916633',
  process.env.HUBSPOT_CLIMATE_REFERRAL_PIPELINE_ID ?? '836173371',
];

// All deal properties to fetch from HubSpot
const DEAL_PROPERTIES = [
  'dealname',
  'offering_name_in_swarm',
  'pipeline',
  'dealstage',
  'launch_date',
  'form_c_end_date',
  'offering_end_date',
  'min_funding_amount',
  'max_funding_amount',
  'n04___50__to_minimum',
  'n05___minimum_met',
  'n72_hours_timestamp',
  'hs_is_closed',
  'interest_rate',
  'state',
  'strong_start_goal__10__',
  'advertising_consent',
].join(',');

function getHeaders(): HeadersInit {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN is not set');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

interface HubSpotDealResponse {
  id: string;
  properties: Record<string, string | null>;
}

interface HubSpotSearchResponse {
  results: HubSpotDealResponse[];
  paging?: {
    next?: { after: string; link: string };
  };
}

function parseNumber(val: string | null | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[,$]/g, ''));
  return isNaN(n) ? 0 : n;
}

function parseBool(val: string | null | undefined): boolean {
  if (!val) return false;
  return val === 'true' || val === '1' || val === 'yes';
}

function normaliseDeal(raw: HubSpotDealResponse): HubSpotDeal {
  const p = raw.properties;
  return {
    hubspot_deal_id: raw.id,
    offering_name_in_swarm: p.offering_name_in_swarm ?? p.dealname ?? '',
    dealname: p.dealname ?? '',
    pipeline: p.pipeline ?? '',
    dealstage: p.dealstage ?? '',
    launch_date: p.launch_date ?? null,
    form_c_end_date: p.form_c_end_date ?? null,
    min_funding_amount: parseNumber(p.min_funding_amount),
    max_funding_amount: parseNumber(p.max_funding_amount),
    n04___50__to_minimum: p.n04___50__to_minimum ?? null,
    n05___minimum_met: p.n05___minimum_met ?? null,
    n72_hours_timestamp: p.n72_hours_timestamp ?? null,
    hs_is_closed: parseBool(p.hs_is_closed),
    interest_rate: p.interest_rate ? parseFloat(p.interest_rate) : null,
    state: p.state ?? null,
    strong_start_goal__10__: p.strong_start_goal__10__ ? parseNumber(p.strong_start_goal__10__) : null,
    advertising_consent: parseBool(p.advertising_consent),
  };
}

/** Fetch all active deals across the relevant pipelines. Handles pagination. */
export async function fetchActiveDeals(): Promise<HubSpotDeal[]> {
  const url = `${HUBSPOT_API_BASE}/crm/v3/objects/deals/search`;
  const allDeals: HubSpotDeal[] = [];
  let after: string | undefined;

  // Get today's date as ISO string for close date filter
  const today = new Date().toISOString().split('T')[0];

  const basePayload = {
    filterGroups: [
      {
        filters: [
          { propertyName: 'hs_is_closed', operator: 'EQ', value: 'false' },
          { propertyName: 'form_c_end_date', operator: 'GTE', value: today },
          {
            propertyName: 'pipeline',
            operator: 'IN',
            values: ACTIVE_PIPELINE_IDS,
          },
        ],
      },
    ],
    properties: DEAL_PROPERTIES.split(','),
    limit: 100,
    sorts: [{ propertyName: 'form_c_end_date', direction: 'ASCENDING' }],
  };

  do {
    const payload = after ? { ...basePayload, after } : basePayload;

    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
      next: { revalidate: 0 }, // always fresh
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HubSpot API error ${res.status}: ${text}`);
    }

    const data: HubSpotSearchResponse = await res.json();
    allDeals.push(...data.results.map(normaliseDeal));
    after = data.paging?.next?.after;
  } while (after);

  return allDeals;
}

/** Fetch a single deal by HubSpot ID. */
export async function fetchDeal(dealId: string): Promise<HubSpotDeal | null> {
  const url = `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}?properties=${DEAL_PROPERTIES}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HubSpot API error ${res.status}`);
  const data: HubSpotDealResponse = await res.json();
  return normaliseDeal(data);
}
