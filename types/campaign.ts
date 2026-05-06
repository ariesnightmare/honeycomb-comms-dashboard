export type NewsletterEdition = 'MainStreet' | 'Climate';

export type CampaignStatus = 'active' | 'closed' | 'flagged';

export interface HubSpotDeal {
  hubspot_deal_id: string;
  offering_name_in_swarm: string;
  dealname: string;
  pipeline: string;
  dealstage: string;
  launch_date: string | null;            // YYYY-MM-DD
  form_c_end_date: string | null;        // YYYY-MM-DD (preferred over offering_end_date)
  min_funding_amount: number;
  max_funding_amount: number;
  n04___50__to_minimum: string | null;   // Date HubSpot logged 50% milestone
  n05___minimum_met: string | null;      // Date HubSpot logged 100% minimum
  n72_hours_timestamp: string | null;    // 72 business hours after launch
  hs_is_closed: boolean;
  interest_rate: number | null;
  state: string | null;
  strong_start_goal__10__: number | null; // 10% of minimum (not the strong start threshold)
  advertising_consent?: boolean;          // Must be true for comms to go out
}

export interface PostHogCampaignData {
  campaignName: string;
  campaignMinimumFundingGoal: number;
  campaignMaximumFundingGoal: number;
  total_raised: number;
  first_investment: string | null;
  last_investment: string | null;
  pct_of_minimum: number;
  raised_in_first_48hrs?: number;
}

export interface Campaign {
  // Identity
  id: string;
  name: string;
  dealname: string;
  pipeline: string;
  newsletter_edition: NewsletterEdition;

  // Dates
  launch_date: Date | null;
  close_date: Date | null;
  n72_hours_timestamp: Date | null;
  n04_50pct_date: Date | null;    // HubSpot-logged 50% milestone date
  n05_min_met_date: Date | null;  // HubSpot-logged minimum met date

  // Funding
  min_funding_amount: number;
  max_funding_amount: number;
  total_raised: number;
  raised_in_first_48hrs: number;

  // Computed
  pct_of_minimum: number;
  pct_of_maximum: number;
  days_until_close: number | null;
  is_closing_soon: boolean;
  strong_start_achieved: boolean;

  // Compliance
  advertising_consent: boolean;
  is_good_standing: boolean;
  hs_is_closed: boolean;
  has_close_date: boolean;

  // Metadata
  interest_rate: number | null;
  state: string | null;
  status: CampaignStatus;
}
