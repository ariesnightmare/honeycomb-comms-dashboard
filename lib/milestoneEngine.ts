/**
 * Milestone Engine — pure function that computes all eligible CommsTask objects
 * for an array of Campaign objects. No side effects, no I/O.
 *
 * Core compliance rules:
 * - No comms go out until a campaign crosses 10% of funding minimum
 * - Each milestone tier unlocks specific channel tasks
 * - 72-hour windows are in BUSINESS DAYS
 * - For standalone comms (push/SMS) when multiple campaigns hit the same milestone
 *   on the same day, stagger by one business day each
 * - Newsletter deduplication: only highest-priority milestone per campaign per cycle
 * - Closing-soon roundups regenerate each Thursday the campaign remains eligible
 */

import type { Campaign } from '@/types/campaign';
import type { CommsTask, Channel, TaskType, Urgency, TaskStatus } from '@/types/commsTask';
import type { MilestoneTier } from '@/types/milestone';
import {
  addBusinessDays,
  nextMonday,
  nextThursday,
  calendarDaysBetween,
  today,
  formatDateISO,
} from './dateUtils';

let taskIdCounter = 0;
function makeId(campaignId: string, channel: Channel, milestone: MilestoneTier): string {
  return `${campaignId}-${channel}-${milestone}-${++taskIdCounter}`;
}

// ── Thresholds ───────────────────────────────────────────────────────────────

const LAUNCH_THRESHOLD         = 10;   // % of minimum
const STRONG_START_THRESHOLD   = 25;   // % of minimum within 48hrs of launch
const MID_CAMPAIGN_THRESHOLD   = 50;   // % of minimum
const CLOSING_THRESHOLD        = 50;   // % of minimum (must also be within 7 days)
const CLOSING_DAYS_WINDOW      = 7;    // calendar days until close
const TARGET_THRESHOLD         = 100;  // % of minimum (minimum met)
const NINETY_THRESHOLD         = 90;   // % of minimum

// ── Helper builders ──────────────────────────────────────────────────────────

function buildTask(
  campaign: Campaign,
  channel: Channel,
  taskType: TaskType,
  milestone: MilestoneTier,
  triggerDate: Date,
  scheduledSendDate: Date,
  urgency: Urgency,
  status: TaskStatus,
  opts: Partial<Pick<CommsTask, 'blockedReason' | 'notes' | 'newsletterEdition' | 'newsletterSection'>> = {}
): CommsTask {
  const dueDate = addBusinessDays(triggerDate, 3); // 72 business hours = 3 business days
  return {
    id: makeId(campaign.id, channel, milestone),
    campaignId: campaign.id,
    campaignName: campaign.name,
    campaignType: campaign.newsletter_edition,
    channel,
    taskType,
    milestone,
    dueDate,
    scheduledSendDate,
    urgency,
    status,
    newsletterEdition: channel === 'InvestorNewsletter' ? campaign.newsletter_edition : undefined,
    ...opts,
  };
}

// ── Block check ──────────────────────────────────────────────────────────────

function shouldBlock(campaign: Campaign): { blocked: boolean; reason?: string } {
  if (!campaign.advertising_consent) {
    return { blocked: true, reason: 'Awaiting advertising consent' };
  }
  if (!campaign.is_good_standing) {
    return { blocked: true, reason: 'Campaign not in good standing' };
  }
  return { blocked: false };
}

// ── Highest newsletter milestone for a campaign ──────────────────────────────

type NewsletterPriorityKey = 'TargetReached' | 'NinetyPercent' | 'MidCampaign' | 'Launch' | 'Closing';

function highestNewsletterMilestone(campaign: Campaign): NewsletterPriorityKey | null {
  if (campaign.pct_of_minimum >= TARGET_THRESHOLD)       return 'TargetReached';
  if (campaign.pct_of_minimum >= NINETY_THRESHOLD)       return 'NinetyPercent';
  // Closing period urgency takes precedence over mid-campaign standard highlight
  // when the campaign is in its closing window (per expected output: camp-003)
  if (campaign.is_closing_soon)                          return 'Closing';
  if (campaign.pct_of_minimum >= MID_CAMPAIGN_THRESHOLD) return 'MidCampaign';
  if (campaign.pct_of_minimum >= LAUNCH_THRESHOLD)       return 'Launch';
  return null;
}

// ── Newsletter milestone → task config ───────────────────────────────────────

function newsletterSectionLabel(key: NewsletterPriorityKey): string {
  switch (key) {
    case 'TargetReached':  return 'Target Reached';
    case 'NinetyPercent':  return '90% to Target';
    case 'MidCampaign':    return 'Mid-Campaign Highlight';
    case 'Closing':        return 'Closing Highlights';
    case 'Launch':         return 'New Offerings';
  }
}

function newsletterMilestoneToTier(key: NewsletterPriorityKey): MilestoneTier {
  switch (key) {
    case 'TargetReached':  return 'TargetReached';
    case 'NinetyPercent':  return 'MidCampaign';
    case 'MidCampaign':    return 'MidCampaign';
    case 'Closing':        return 'Closing';
    case 'Launch':         return 'Launch';
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

export interface MilestoneEngineOptions {
  /** Override today's date for testing */
  todayOverride?: Date;
  /**
   * Map from campaignId → ISO date string of when the campaign first crossed
   * each milestone, used to stagger same-day standalone comms.
   * Key: `${campaignId}:${milestone}`, Value: ISO date string
   */
  milestoneTriggerDates?: Map<string, string>;
}

export function computeCommsTasks(
  campaigns: Campaign[],
  opts: MilestoneEngineOptions = {}
): CommsTask[] {
  taskIdCounter = 0; // reset for deterministic output in tests
  const now = opts.todayOverride ?? today();
  const tasks: CommsTask[] = [];

  // Group tracker for same-day standalone comms staggering
  // Key: `${channel}:${milestone}:${ISO date}` → count of campaigns already assigned
  const standaloneSameDayCount = new Map<string, number>();

  for (const campaign of campaigns) {
    // Skip already closed deals
    if (campaign.hs_is_closed) continue;

    // Skip campaigns that haven't crossed launch threshold
    if (campaign.pct_of_minimum < LAUNCH_THRESHOLD) continue;

    // Determine if campaign is expired (close date in the past)
    const isExpired = campaign.close_date !== null && campaign.close_date < now;

    const blockCheck = shouldBlock(campaign);
    const status: TaskStatus = isExpired ? 'Expired' : blockCheck.blocked ? 'Blocked' : 'Pending';
    const blockedReason = blockCheck.blocked ? blockCheck.reason : undefined;

    const launchDate = campaign.launch_date ?? now;

    // ── LAUNCH milestone tasks (10% crossed) ─────────────────────────────────
    // Social: Monday roundup
    tasks.push(buildTask(
      campaign,
      'SocialMedia', 'Roundup', 'Launch',
      launchDate,
      nextMonday(launchDate),
      'Low',
      status,
      { blockedReason, notes: 'Weekly Monday roundup — new offering inclusion' }
    ));

    // Newsletter: new offerings section (next Monday)
    const nlKey = highestNewsletterMilestone(campaign);
    // We handle newsletter deduplication at the end — emit per campaign
    if (nlKey) {
      const nlSection = newsletterSectionLabel(nlKey);
      const nlMilestone = newsletterMilestoneToTier(nlKey);
      const nlTrigger = campaign.n04_50pct_date ?? campaign.launch_date ?? now;
      tasks.push(buildTask(
        campaign,
        'InvestorNewsletter', 'Roundup', nlMilestone,
        nlTrigger,
        nextMonday(nlTrigger),
        nlKey === 'Closing' || nlKey === 'TargetReached' ? 'High' : 'Medium',
        status,
        {
          blockedReason,
          newsletterEdition: campaign.newsletter_edition,
          newsletterSection: nlSection,
          notes: `${campaign.newsletter_edition} Newsletter — ${nlSection}`,
        }
      ));
    }

    // ── STRONG START tasks (25% in first 48hrs) ───────────────────────────────
    if (campaign.strong_start_achieved) {
      const ssDate = campaign.n72_hours_timestamp ?? addBusinessDays(launchDate, 1);

      // Stagger push notifications if multiple campaigns same day
      const pushKey = `PushNotification:StrongStart:${formatDateISO(ssDate)}`;
      const pushOffset = standaloneSameDayCount.get(pushKey) ?? 0;
      standaloneSameDayCount.set(pushKey, pushOffset + 1);
      const pushDate = addBusinessDays(ssDate, pushOffset);

      tasks.push(buildTask(
        campaign,
        'PushNotification', 'Standalone', 'StrongStart',
        pushDate,
        addBusinessDays(pushDate, 3),
        'High',
        status,
        { blockedReason, notes: 'Strong Start — standalone push notification' }
      ));

      // Stagger SMS
      const smsKey = `SMS:StrongStart:${formatDateISO(ssDate)}`;
      const smsOffset = standaloneSameDayCount.get(smsKey) ?? 0;
      standaloneSameDayCount.set(smsKey, smsOffset + 1);
      const smsDate = addBusinessDays(ssDate, smsOffset);

      tasks.push(buildTask(
        campaign,
        'SMS', 'Standalone', 'StrongStart',
        smsDate,
        addBusinessDays(smsDate, 3),
        'High',
        status,
        { blockedReason, notes: 'Strong Start — standalone SMS' }
      ));
    }

    // ── MID-CAMPAIGN tasks (50% of minimum) ──────────────────────────────────
    if (campaign.pct_of_minimum >= MID_CAMPAIGN_THRESHOLD) {
      const midDate = campaign.n04_50pct_date ?? now;

      // Social: standalone post
      tasks.push(buildTask(
        campaign,
        'SocialMedia', 'Standalone', 'MidCampaign',
        midDate,
        addBusinessDays(midDate, 3),
        'Medium',
        status,
        { blockedReason, notes: 'Mid-campaign standalone social post' }
      ));
      // Newsletter handled via deduplication above
    }

    // ── CLOSING PERIOD tasks (50%+ funded AND ≤7 days to close) ─────────────
    if (campaign.is_closing_soon) {
      // Email: Thursday roundup
      tasks.push(buildTask(
        campaign,
        'Email', 'Roundup', 'Closing',
        now,
        nextThursday(now),
        'High',
        status,
        { blockedReason, notes: 'Closing-soon weekly Thursday email roundup' }
      ));

      // Social: Thursday roundup
      tasks.push(buildTask(
        campaign,
        'SocialMedia', 'Roundup', 'Closing',
        now,
        nextThursday(now),
        'High',
        status,
        { blockedReason, notes: 'Closing-soon weekly Thursday social roundup' }
      ));

      // Push: standalone, high urgency
      const closingPushKey = `PushNotification:Closing:${formatDateISO(now)}`;
      const closingPushOffset = standaloneSameDayCount.get(closingPushKey) ?? 0;
      standaloneSameDayCount.set(closingPushKey, closingPushOffset + 1);
      const closingPushDate = addBusinessDays(now, closingPushOffset);

      tasks.push(buildTask(
        campaign,
        'PushNotification', 'Standalone', 'Closing',
        closingPushDate,
        addBusinessDays(closingPushDate, 3),
        'High',
        status,
        { blockedReason, notes: 'Closing-soon standalone push — high urgency' }
      ));
    }

    // ── TARGET REACHED tasks (100%+ of minimum) ───────────────────────────────
    if (campaign.pct_of_minimum >= TARGET_THRESHOLD) {
      // Already captured in newsletter deduplication above
      // No additional channel tasks defined in spec beyond newsletter
    }
  }

  // ── Mark expired tasks ────────────────────────────────────────────────────
  return tasks.map((t) => {
    const campaign = campaigns.find((c) => c.id === t.campaignId);
    if (
      campaign?.close_date &&
      campaign.close_date < now &&
      t.status === 'Pending'
    ) {
      return { ...t, status: 'Expired' as TaskStatus };
    }
    return t;
  });
}

/** Helper: build Campaign from combined HubSpot + PostHog data (test-friendly). */
export function buildCampaign(raw: {
  hubspot_deal_id: string;
  offering_name_in_swarm: string;
  dealname?: string;
  pipeline: string;
  launch_date: string | null;
  form_c_end_date: string | null;
  min_funding_amount: number;
  max_funding_amount: number;
  n04___50__to_minimum: string | null;
  n05___minimum_met: string | null;
  n72_hours_timestamp: string | null;
  hs_is_closed: boolean;
  posthog_total_raised: number;
  posthog_pct_of_minimum: number;
  strong_start_achieved: boolean;
  raised_in_first_48hrs?: number;
  advertising_consent?: boolean;
  is_good_standing?: boolean;
  todayOverride?: Date;
}): Campaign {
  const now = raw.todayOverride ?? today();
  const parseDate = (s: string | null) => s ? new Date(s + 'T00:00:00') : null;

  const closeDate = parseDate(raw.form_c_end_date);
  const launchDate = parseDate(raw.launch_date);

  const daysUntilClose = closeDate ? calendarDaysBetween(now, closeDate) : null;
  const pctOfMin = raw.posthog_pct_of_minimum;
  const isClosingSoon = (
    daysUntilClose !== null &&
    daysUntilClose <= CLOSING_DAYS_WINDOW &&
    daysUntilClose >= 0 &&
    pctOfMin >= CLOSING_THRESHOLD
  );

  // Derive newsletter edition from pipeline
  const CLIMATE_PIPELINES = [
    process.env.HUBSPOT_CLIMATE_PIPELINE_ID ?? '828916633',
    process.env.HUBSPOT_CLIMATE_REFERRAL_PIPELINE_ID ?? '836173371',
  ];
  const newsletterEdition = CLIMATE_PIPELINES.includes(raw.pipeline) ? 'Climate' : 'MainStreet';

  return {
    id: raw.hubspot_deal_id,
    name: raw.offering_name_in_swarm,
    dealname: raw.dealname ?? raw.offering_name_in_swarm,
    pipeline: raw.pipeline,
    newsletter_edition: newsletterEdition,
    launch_date: launchDate,
    close_date: closeDate,
    n72_hours_timestamp: parseDate(raw.n72_hours_timestamp),
    n04_50pct_date: parseDate(raw.n04___50__to_minimum),
    n05_min_met_date: parseDate(raw.n05___minimum_met),
    min_funding_amount: raw.min_funding_amount,
    max_funding_amount: raw.max_funding_amount,
    total_raised: raw.posthog_total_raised,
    raised_in_first_48hrs: raw.raised_in_first_48hrs ?? 0,
    pct_of_minimum: pctOfMin,
    pct_of_maximum: (raw.posthog_total_raised / raw.max_funding_amount) * 100,
    days_until_close: daysUntilClose,
    is_closing_soon: isClosingSoon,
    strong_start_achieved: raw.strong_start_achieved,
    advertising_consent: raw.advertising_consent ?? true,
    is_good_standing: raw.is_good_standing ?? true,
    hs_is_closed: raw.hs_is_closed,
    has_close_date: closeDate !== null,
    interest_rate: null,
    state: null,
    status: raw.hs_is_closed ? 'closed' : 'active',
  };
}
