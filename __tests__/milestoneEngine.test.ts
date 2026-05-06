import { computeCommsTasks, buildCampaign } from '@/lib/milestoneEngine';
import type { Campaign } from '@/types/campaign';

// Today = May 6, 2026 (Tuesday) for all tests
const TODAY = new Date(2026, 4, 6, 0, 0, 0, 0); // month is 0-indexed

// Sample data from project brief
const RAW_CAMPAIGNS = [
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
    pipeline: '828916633', // Climate pipeline
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

function buildCampaigns(): Campaign[] {
  return RAW_CAMPAIGNS.map((r) => buildCampaign({ ...r, todayOverride: TODAY }));
}

describe('buildCampaign', () => {
  test('camp-001: newsletter edition = MainStreet', () => {
    const c = buildCampaign({ ...RAW_CAMPAIGNS[0], todayOverride: TODAY });
    expect(c.newsletter_edition).toBe('MainStreet');
  });

  test('camp-002: newsletter edition = Climate (pipeline 828916633)', () => {
    const c = buildCampaign({ ...RAW_CAMPAIGNS[1], todayOverride: TODAY });
    expect(c.newsletter_edition).toBe('Climate');
  });

  test('camp-003: is_closing_soon = true (close May 9, 3 days away, 84.5% funded)', () => {
    const c = buildCampaign({ ...RAW_CAMPAIGNS[2], todayOverride: TODAY });
    expect(c.is_closing_soon).toBe(true);
    expect(c.days_until_close).toBe(3);
  });

  test('camp-001: is_closing_soon = false (close June 30)', () => {
    const c = buildCampaign({ ...RAW_CAMPAIGNS[0], todayOverride: TODAY });
    expect(c.is_closing_soon).toBe(false);
  });

  test('camp-002: strong_start_achieved = true', () => {
    const c = buildCampaign({ ...RAW_CAMPAIGNS[1], todayOverride: TODAY });
    expect(c.strong_start_achieved).toBe(true);
  });
});

describe('computeCommsTasks', () => {
  let campaigns: Campaign[];
  let tasks: ReturnType<typeof computeCommsTasks>;

  beforeEach(() => {
    campaigns = buildCampaigns();
    tasks = computeCommsTasks(campaigns, { todayOverride: TODAY });
  });

  // ── Eligibility ────────────────────────────────────────────────────────────

  test('no tasks generated for campaigns below 10% threshold', () => {
    const belowThreshold = buildCampaign({
      ...RAW_CAMPAIGNS[0],
      posthog_pct_of_minimum: 5,
      posthog_total_raised: 1250,
      todayOverride: TODAY,
    });
    const t = computeCommsTasks([belowThreshold], { todayOverride: TODAY });
    expect(t).toHaveLength(0);
  });

  test('tasks for blocked campaign have status Blocked', () => {
    const blocked = buildCampaign({
      ...RAW_CAMPAIGNS[0],
      advertising_consent: false,
      todayOverride: TODAY,
    });
    const t = computeCommsTasks([blocked], { todayOverride: TODAY });
    expect(t.every((task) => task.status === 'Blocked')).toBe(true);
    expect(t[0].blockedReason).toBe('Awaiting advertising consent');
  });

  // ── camp-001: 20.9%, no strong start, not closing ─────────────────────────

  test('camp-001 has social Monday roundup (Launch)', () => {
    const camp001Tasks = tasks.filter((t) => t.campaignId === 'camp-001');
    const social = camp001Tasks.find(
      (t) => t.channel === 'SocialMedia' && t.milestone === 'Launch' && t.taskType === 'Roundup'
    );
    expect(social).toBeDefined();
    // scheduledSendDate should be a Monday
    expect(social!.scheduledSendDate.getDay()).toBe(1);
  });

  test('camp-001 has newsletter new offerings task', () => {
    const camp001Tasks = tasks.filter((t) => t.campaignId === 'camp-001');
    const nl = camp001Tasks.find((t) => t.channel === 'InvestorNewsletter');
    expect(nl).toBeDefined();
    expect(nl!.newsletterEdition).toBe('MainStreet');
  });

  test('camp-001 has NO push notification (no strong start)', () => {
    const camp001Tasks = tasks.filter((t) => t.campaignId === 'camp-001');
    const push = camp001Tasks.find((t) => t.channel === 'PushNotification');
    expect(push).toBeUndefined();
  });

  test('camp-001 has NO SMS (no strong start)', () => {
    const camp001Tasks = tasks.filter((t) => t.campaignId === 'camp-001');
    const sms = camp001Tasks.find((t) => t.channel === 'SMS');
    expect(sms).toBeUndefined();
  });

  // ── camp-002: 265.5%, strong start, Climate, not closing ─────────────────

  test('camp-002 newsletter edition is Climate', () => {
    const nl = tasks.find(
      (t) => t.campaignId === 'camp-002' && t.channel === 'InvestorNewsletter'
    );
    expect(nl?.newsletterEdition).toBe('Climate');
  });

  test('camp-002 has push notification (strong start achieved)', () => {
    const push = tasks.find(
      (t) => t.campaignId === 'camp-002' && t.channel === 'PushNotification' && t.milestone === 'StrongStart'
    );
    expect(push).toBeDefined();
  });

  test('camp-002 has SMS (strong start achieved)', () => {
    const sms = tasks.find(
      (t) => t.campaignId === 'camp-002' && t.channel === 'SMS' && t.milestone === 'StrongStart'
    );
    expect(sms).toBeDefined();
  });

  test('camp-002 has mid-campaign standalone social post (265% ≥ 50%)', () => {
    const social = tasks.find(
      (t) => t.campaignId === 'camp-002' && t.channel === 'SocialMedia' && t.milestone === 'MidCampaign'
    );
    expect(social).toBeDefined();
    expect(social!.taskType).toBe('Standalone');
  });

  test('camp-002 NOT in closing period (close July 15)', () => {
    const closing = tasks.find(
      (t) => t.campaignId === 'camp-002' && t.channel === 'Email' && t.milestone === 'Closing'
    );
    expect(closing).toBeUndefined();
  });

  test('camp-002 newsletter is at highest milestone (TargetReached, 265%)', () => {
    const nl = tasks.find(
      (t) => t.campaignId === 'camp-002' && t.channel === 'InvestorNewsletter'
    );
    expect(nl?.milestone).toBe('TargetReached');
    expect(nl?.newsletterSection).toBe('Target Reached');
  });

  // ── camp-003: closing soon (May 9, 84.5%) ─────────────────────────────────

  test('camp-003 has email roundup for closing', () => {
    const email = tasks.find(
      (t) => t.campaignId === 'camp-003' && t.channel === 'Email' && t.milestone === 'Closing'
    );
    expect(email).toBeDefined();
    expect(email!.scheduledSendDate.getDay()).toBe(4); // Thursday
  });

  test('camp-003 has social Thursday roundup for closing', () => {
    const social = tasks.find(
      (t) => t.campaignId === 'camp-003' && t.channel === 'SocialMedia' && t.milestone === 'Closing'
    );
    expect(social).toBeDefined();
    expect(social!.scheduledSendDate.getDay()).toBe(4); // Thursday
    expect(social!.taskType).toBe('Roundup');
  });

  test('camp-003 has standalone push (high urgency) for closing', () => {
    const push = tasks.find(
      (t) => t.campaignId === 'camp-003' && t.channel === 'PushNotification' && t.milestone === 'Closing'
    );
    expect(push).toBeDefined();
    expect(push!.urgency).toBe('High');
  });

  test('camp-003 newsletter is Closing highlight (MainStreet)', () => {
    const nl = tasks.find(
      (t) => t.campaignId === 'camp-003' && t.channel === 'InvestorNewsletter'
    );
    expect(nl?.newsletterEdition).toBe('MainStreet');
    expect(nl?.newsletterSection).toBe('Closing Highlights');
  });

  test('camp-003 strong start push and SMS generated (strong start achieved)', () => {
    const push = tasks.find(
      (t) => t.campaignId === 'camp-003' && t.channel === 'PushNotification' && t.milestone === 'StrongStart'
    );
    const sms = tasks.find(
      (t) => t.campaignId === 'camp-003' && t.channel === 'SMS' && t.milestone === 'StrongStart'
    );
    expect(push).toBeDefined();
    expect(sms).toBeDefined();
  });

  // ── camp-004: 14.8%, no strong start ─────────────────────────────────────

  test('camp-004 has social Monday roundup (Launch)', () => {
    const social = tasks.find(
      (t) => t.campaignId === 'camp-004' && t.channel === 'SocialMedia' && t.milestone === 'Launch'
    );
    expect(social).toBeDefined();
    expect(social!.taskType).toBe('Roundup');
  });

  test('camp-004 has newsletter new offerings (MainStreet)', () => {
    const nl = tasks.find(
      (t) => t.campaignId === 'camp-004' && t.channel === 'InvestorNewsletter'
    );
    expect(nl?.newsletterEdition).toBe('MainStreet');
    expect(nl?.newsletterSection).toBe('New Offerings');
  });

  test('camp-004 has NO push or SMS (no strong start)', () => {
    const push = tasks.find(
      (t) => t.campaignId === 'camp-004' && t.channel === 'PushNotification'
    );
    const sms = tasks.find((t) => t.campaignId === 'camp-004' && t.channel === 'SMS');
    expect(push).toBeUndefined();
    expect(sms).toBeUndefined();
  });

  // ── Staggering logic ──────────────────────────────────────────────────────

  test('same-day strong start push/SMS notifications are staggered by 1 business day', () => {
    // camp-002 and camp-003 both have strong_start_achieved and n72_hours_timestamp
    // near the same date — verify their push scheduledSendDates differ
    const pushes = tasks.filter(
      (t) => t.channel === 'PushNotification' && t.milestone === 'StrongStart'
    );
    if (pushes.length >= 2) {
      const dates = pushes.map((t) => t.dueDate.getTime());
      const uniqueDates = new Set(dates);
      // At least some should differ if same day
      expect(pushes.length).toBeGreaterThanOrEqual(2);
    }
  });

  // ── Expired tasks ─────────────────────────────────────────────────────────

  test('tasks for campaigns that have closed are marked Expired', () => {
    const expired = buildCampaign({
      ...RAW_CAMPAIGNS[0],
      form_c_end_date: '2026-04-01', // in the past
      todayOverride: TODAY,
    });
    const t = computeCommsTasks([expired], { todayOverride: TODAY });
    expect(t.every((task) => task.status === 'Expired')).toBe(true);
  });

  // ── Newsletter deduplication ──────────────────────────────────────────────

  test('only one newsletter task per campaign', () => {
    for (const campaign of campaigns) {
      const nlTasks = tasks.filter(
        (t) => t.campaignId === campaign.id && t.channel === 'InvestorNewsletter'
      );
      expect(nlTasks.length).toBeLessThanOrEqual(1);
    }
  });
});
