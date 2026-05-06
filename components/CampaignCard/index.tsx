'use client';

import type { Campaign } from '@/types/campaign';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { MilestoneTag } from '@/components/MilestoneTag';
import type { MilestoneTier } from '@/types/milestone';
import { ExternalLink, AlertTriangle, Calendar } from 'lucide-react';

function currentMilestone(campaign: Campaign): MilestoneTier {
  if (campaign.pct_of_minimum >= 100) return 'TargetReached';
  if (campaign.is_closing_soon) return 'Closing';
  if (campaign.pct_of_minimum >= 50) return 'MidCampaign';
  if (campaign.strong_start_achieved) return 'StrongStart';
  return 'Launch';
}

interface CampaignCardProps {
  campaign: Campaign;
  tasksPending: number;
  tasksSent: number;
  compact?: boolean;
}

export function CampaignCard({ campaign, tasksPending, tasksSent, compact = false }: CampaignCardProps) {
  const milestone = currentMilestone(campaign);
  const pctBar = Math.min(campaign.pct_of_minimum, 100);

  return (
    <div className="rounded-lg border border-stone-700 bg-stone-800 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-stone-100 truncate text-sm">{campaign.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-stone-400">{campaign.newsletter_edition}</span>
            {!campaign.has_close_date && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <AlertTriangle size={10} />
                No close date
              </span>
            )}
          </div>
        </div>
        <MilestoneTag milestone={milestone} size="sm" />
      </div>

      {/* Funding bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-stone-400">
          <span>{formatCurrency(campaign.total_raised)} raised</span>
          <span>
            {formatPercent(campaign.pct_of_minimum)} of min
            {' · '}
            {formatPercent(campaign.pct_of_maximum)} of max
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-stone-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${pctBar}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-stone-500">
          <span>Min: {formatCurrency(campaign.min_funding_amount)}</span>
          <span>Max: {formatCurrency(campaign.max_funding_amount)}</span>
        </div>
      </div>

      {!compact && (
        <>
          {/* Closing soon */}
          {campaign.days_until_close !== null && (
            <div className={`flex items-center gap-1.5 text-xs ${campaign.is_closing_soon ? 'text-red-400 font-medium' : 'text-stone-400'}`}>
              <Calendar size={12} />
              {campaign.days_until_close === 0
                ? 'Closes today'
                : campaign.days_until_close > 0
                  ? `Closes in ${campaign.days_until_close} day${campaign.days_until_close !== 1 ? 's' : ''}`
                  : 'Closed'}
            </div>
          )}

          {/* Task counts */}
          <div className="flex items-center justify-between text-xs text-stone-400 pt-1 border-t border-stone-700">
            <span>
              <span className="text-amber-400 font-semibold">{tasksPending}</span> pending
              {' · '}
              <span className="text-emerald-400 font-semibold">{tasksSent}</span> sent
            </span>
            <a
              href={`https://app.hubspot.com/contacts/deals/${campaign.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-stone-500 hover:text-stone-300 transition-colors"
            >
              HubSpot <ExternalLink size={10} />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
