'use client';

import type { Channel } from '@/types/commsTask';
import { cn } from '@/lib/utils';

const CHANNEL_CONFIG: Record<Channel, { label: string; icon: string; color: string }> = {
  SocialMedia:       { label: 'Social',       icon: '📱', color: 'bg-blue-600/20 text-blue-300 border-blue-600/30' },
  Email:             { label: 'Email',         icon: '📧', color: 'bg-violet-600/20 text-violet-300 border-violet-600/30' },
  InvestorNewsletter:{ label: 'Newsletter',    icon: '📰', color: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30' },
  PushNotification:  { label: 'Push',          icon: '🔔', color: 'bg-amber-600/20 text-amber-300 border-amber-600/30' },
  SMS:               { label: 'SMS',           icon: '💬', color: 'bg-pink-600/20 text-pink-300 border-pink-600/30' },
};

interface ChannelBadgeProps {
  channel: Channel;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function ChannelBadge({ channel, size = 'md', showIcon = true }: ChannelBadgeProps) {
  const cfg = CHANNEL_CONFIG[channel];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border font-medium',
        cfg.color,
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
      )}
    >
      {showIcon && <span>{cfg.icon}</span>}
      {cfg.label}
    </span>
  );
}

export function channelDotColor(channel: Channel): string {
  const map: Record<Channel, string> = {
    SocialMedia:        'bg-blue-500',
    Email:              'bg-violet-500',
    InvestorNewsletter: 'bg-emerald-500',
    PushNotification:   'bg-amber-500',
    SMS:                'bg-pink-500',
  };
  return map[channel];
}
