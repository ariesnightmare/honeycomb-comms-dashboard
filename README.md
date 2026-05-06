# Honeycomb Portal — Issuer Communications Dashboard

Internal dashboard for the Honeycomb Portal comms/compliance team. Automatically computes what external communications need to be created and distributed for each live issuer campaign, based on FINRA content standards and an internal milestone-based policy.

## Quick start

```bash
cd honeycomb-comms-dashboard
npm install
cp .env.example .env.local
# Fill in your secrets in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Development with mock data

Set `USE_MOCK_DATA=true` in `.env.local` to run against the four sample campaigns from the project spec without needing live HubSpot/PostHog credentials:

```
USE_MOCK_DATA=true
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `HUBSPOT_ACCESS_TOKEN` | Yes (prod) | Private app token from HubSpot |
| `HUBSPOT_MAIN_STREET_PIPELINE_ID` | No | Default: `31467447` |
| `HUBSPOT_CLIMATE_PIPELINE_ID` | No | Default: `828916633` |
| `HUBSPOT_CLIMATE_REFERRAL_PIPELINE_ID` | No | Default: `836173371` |
| `POSTHOG_API_KEY` | Yes (prod) | Project API key (`phc_...`) |
| `POSTHOG_PROJECT_ID` | No | Default: `39093` |
| `POSTHOG_HOST` | No | Default: `https://us.posthog.com` |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | e.g. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `ALLOWED_EMAIL_DOMAINS` | No | Default: `honeycombcredit.com` |
| `CRON_SECRET` | Prod | Secret token for the 6am cron job |
| `USE_MOCK_DATA` | Dev | Set to `true` to skip live API calls |

## Tests

```bash
npm test
```

The milestone engine has a full unit test suite covering all four sample campaigns from the project spec. Run this before any changes to the business logic.

```bash
npm test -- --verbose
```

## Architecture

```
/app
  /api/campaigns     → fetches HubSpot + PostHog, runs milestone engine, returns JSON
  /api/auth          → NextAuth + Google OAuth
  /api/cron/refresh  → called by Vercel Cron at 6am daily
  /api/tasks/[id]    → PATCH to update task status
  /page.tsx          → This Week view (default)
  /todo              → To-Do by Channel
  /calendar          → Monthly Calendar
  /campaigns         → Campaign Status table

/lib
  milestoneEngine.ts → Pure function: Campaign[] → CommsTask[]
  dateUtils.ts       → Business day calculations (no weekends / federal holidays)
  hubspot.ts         → HubSpot CRM API v3 client
  posthog.ts         → PostHog HogQL client
  campaigns.ts       → Joins HubSpot + PostHog, orchestrates full load

/types              → TypeScript types (Campaign, CommsTask, MilestoneTier)
/components         → Reusable UI components
/hooks              → useDashboardData (TanStack Query)
/__tests__          → Milestone engine unit tests
```

## Milestone policy

| Milestone | Trigger | Channels unlocked |
|---|---|---|
| Launch | ≥10% of funding minimum | Social (Monday roundup), Newsletter (new offerings) |
| Strong Start | ≥25% of min within first 48hrs | Push (standalone), SMS (standalone) |
| Mid-Campaign | ≥50% of minimum | Social (standalone), Newsletter (mid-campaign highlight) |
| Closing | ≥50% funded AND ≤7 days to close | Email (Thursday roundup), Social (Thursday roundup), Push (standalone, high urgency), Newsletter (closing highlight) |
| Target Reached | ≥100% of minimum | Newsletter (target reached — highest priority) |

All 72-hour deadlines are in **business days** (Mon–Fri, excluding US federal holidays).

## Deployment

Deploy to Vercel — `vercel.json` configures the 6am cron job. Set all required environment variables in the Vercel project settings.

```bash
vercel deploy --prod
```

## Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3000/api/auth/callback/google` (dev) and your production URL to Authorized redirect URIs
4. Copy Client ID and Secret into your env vars
