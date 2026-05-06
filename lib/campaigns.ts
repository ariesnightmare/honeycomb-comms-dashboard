/**
 * Joins HubSpot deal data with PostHog investment data,
 * builds Campaign objects, then runs the milestone engine.
 */

import type { Campaign } from '@/types/campaign';
import type { CommsTask } from '@/types/commsTask';
import { fetchActiveDeals } from './hubspot';
import { fetchAllCampaignFunding, fetchRaisedInFirst48Hours, buildPostHogMap } from './posthog';
import { buildCampaign, computeCommsTasks } from './milestoneEngine';

export interface DashboardData {
  campaigns: Campaign[];
  tasks: CommsTask[];
  lastSyncedAt: string; // ISO timestamp
}

/** Fetch and join all campaign data, compute milestone tasks. */
export async function loadDashboardData(): Promise<DashboardData> {
  const [hubspotDeals, posthogData] = await Promise.all([
    fetchActiveDeals(),
    fetchAllCampaignFunding(),
  ]);

  const posthogMap = buildPostHogMap(posthogData);

  // For campaigns with a launch date, check strong start (parallel fetch)
  const campaigns = await Promise.all(
    hubspotDeals.map(async (deal): Promise<Campaign> => {
      const phData = posthogMap.get(deal.offering_name_in_swarm);

      let totalRaised   = phData?.total_raised   ?? 0;
      let pctOfMin      = phData?.pct_of_minimum  ?? 0;

      // Recompute pct_of_minimum with source min if PostHog goal differs
      if (phData && deal.min_funding_amount && deal.min_funding_amount > 0) {
        pctOfMin = (totalRaised / deal.min_funding_amount) * 100;
      }

      let raisedIn48hrs = 0;
      let strongStart   = false;

      if (deal.launch_date && phData) {
        raisedIn48hrs = await fetchRaisedInFirst48Hours(
          deal.offering_name_in_swarm,
          deal.launch_date
        ).catch(() => 0);
        strongStart = raisedIn48hrs >= deal.min_funding_amount * 0.25;
      }

      return buildCampaign({
        ...deal,
        posthog_total_raised:    totalRaised,
        posthog_pct_of_minimum:  pctOfMin,
        strong_start_achieved:   strongStart,
        raised_in_first_48hrs:   raisedIn48hrs,
      });
    })
  );

  const tasks = computeCommsTasks(campaigns);

  return {
    campaigns,
    tasks,
    lastSyncedAt: new Date().toISOString(),
  };
}

/** Convenience: load just the sample/mock data for development. */
export function loadMockData(): DashboardData {
  const RAW = [
    {
      hubspot_deal_id: 'camp-001',
      offering_name_in_swarm: 'Harding House Brewing Co',
      pipeline: '31467447',
      launch_date: '2026-04-22',
      form_c_end_date: '2026-06-30',
      min_funding_amount: 25000,
      max_funding_amount: 75000,
      n04___50__to_minimum: null,
      n05___minimum_met: null,
      n72_hours_timestamp: '2026-04-24',
      hs_is_closed: false,
      posthog_total_raised: 5214,
      posthog_pct_of_minimum: 20.9,
      strong_start_achieved: false,
    },
    {
      hubspot_deal_id: 'camp-002',
      offering_name_in_swarm: 'Green Liberty Notes by Connecticut Green Bank - 16th Offer',
      pipeline: '828916633',
      launch_date: '2026-04-27',
      form_c_end_date: '2026-07-15',
      min_funding_amount: 50000,
      max_funding_amount: 500000,
      n04___50__to_minimum: '2026-04-28',
      n05___minimum_met: '2026-04-29',
      n72_hours_timestamp: '2026-04-29',
      hs_is_closed: false,
      posthog_total_raised: 132774,
      posthog_pct_of_minimum: 265.5,
      strong_start_achieved: true,
    },
    {
      hubspot_deal_id: 'camp-003',
      offering_name_in_swarm: 'The Marketplace and Tacos by Loteria Grill',
      pipeline: '31467447',
      launch_date: '2026-04-27',
      form_c_end_date: '2026-05-09',
      min_funding_amount: 25000,
      max_funding_amount: 50000,
      n04___50__to_minimum: '2026-04-30',
      n05___minimum_met: null,
      n72_hours_timestamp: '2026-04-29',
      hs_is_closed: false,
      posthog_total_raised: 21125,
      posthog_pct_of_minimum: 84.5,
      strong_start_achieved: true,
    },
    {
      hubspot_deal_id: 'camp-004',
      offering_name_in_swarm: 'Long Beach Mushrooms',
      pipeline: '31467447',
      launch_date: '2026-04-28',
      form_c_end_date: '2026-06-28',
      min_funding_amount: 75000,
      max_funding_amount: 124000,
      n04___50__to_minimum: null,
      n05___minimum_met: null,
      n72_hours_timestamp: '2026-04-30',
      hs_is_closed: false,
      posthog_total_raised: 11111,
      posthog_pct_of_minimum: 14.8,
      strong_start_achieved: false,
    },
  ];

  const campaigns = RAW.map((r) => buildCampaign(r));
  const tasks = computeCommsTasks(campaigns);
  return { campaigns, tasks, lastSyncedAt: new Date().toISOString() };
}
