import type { NewsletterEdition } from './campaign';
import type { MilestoneTier } from './milestone';

export type Channel =
  | 'SocialMedia'
  | 'Email'
  | 'PushNotification'
  | 'SMS'
  | 'InvestorNewsletter';

export type TaskType = 'Standalone' | 'Roundup';

export type TaskStatus = 'Pending' | 'InProgress' | 'Sent' | 'Blocked' | 'Expired';

export type Urgency = 'High' | 'Medium' | 'Low';

export interface CommsTask {
  id: string;
  campaignId: string;
  campaignName: string;
  campaignType: NewsletterEdition;
  channel: Channel;
  taskType: TaskType;
  milestone: MilestoneTier;
  dueDate: Date;           // Trigger date + 72 business hours
  scheduledSendDate: Date; // For roundups: next Monday or Thursday
  urgency: Urgency;
  status: TaskStatus;
  blockedReason?: string;  // e.g., "Awaiting advertising consent"
  notes?: string;
  completedAt?: Date;
  // Newsletter-specific
  newsletterEdition?: NewsletterEdition;
  newsletterSection?: string; // e.g., "New Offerings", "Closing Highlights"
}

export interface CommsTaskGroup {
  channel: Channel;
  tasks: CommsTask[];
}

export interface DailySchedule {
  date: Date;
  tasks: CommsTask[];
}

export interface WeeklySchedule {
  weekStart: Date;
  days: DailySchedule[];
}
