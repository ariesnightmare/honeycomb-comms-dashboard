export type MilestoneTier =
  | 'Launch'
  | 'StrongStart'
  | 'MidCampaign'
  | 'Closing'
  | 'TargetReached';

// Newsletter milestone priority (highest = 1)
export const NEWSLETTER_MILESTONE_PRIORITY: Record<string, number> = {
  TargetReached:  1,
  NinetyPercent:  2,
  MidCampaign:    3, // 50% milestone
  Launch:         4,
};

export type NewsletterMilestoneKey =
  | 'TargetReached'
  | 'NinetyPercent'
  | 'MidCampaign'
  | 'Launch'
  | 'Closing';

export interface MilestoneResult {
  tier: MilestoneTier;
  triggeredAt: Date;
  isNew: boolean; // true = milestone just crossed, false = already been processed
}
