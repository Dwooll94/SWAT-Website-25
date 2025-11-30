# Team Avatar Management

This directory contains scripts for managing team avatars used in the Live Event Display and Pit Display.

## Overview

The avatar system uses **local-only caching**:
1. **Local cache**: Avatars are pre-downloaded to `frontend/public/teamavatars/` from FIRST API
2. **No external fallback**: Missing avatars hide gracefully (no TBA requests)

This approach provides:
- **Reliability**: No external API dependencies during display
- **Performance**: Instant loading from local files (~10ms)
- **Offline capability**: Display works without internet
- **No rate limiting**: FIRST API has no rate limits, downloads all teams in 30-60 seconds
- **Faster downloads**: 15x faster than TBA (60 seconds vs 15 minutes for 150 teams)
- **Privacy**: No third-party requests during events

## Scripts

### download-avatars.js

Downloads team avatars from the FIRST API.

**Usage:**

```bash
# Download all avatars for a year (fast!)
node scripts/download-avatars.js

# Download avatars for specific year
node scripts/download-avatars.js 2025

# Download test mode teams only (for development)
node scripts/download-avatars.js --test-mode

# Download specific teams only
node scripts/download-avatars.js --teams=1806,254,1678
```

**Features:**
- Downloads from FIRST API (much faster, no rate limiting!)
- Downloads all teams in 30-60 seconds
- Caches avatars for 7 days (won't re-download if recent)
- Paginated downloads handle all teams automatically
- Test mode for downloading just the teams used in test data
- Optional filter to download specific teams only

**Environment Variables:**

```bash
# Set your FIRST API credentials (required)
export FIRST_API_USERNAME="your_username"
export FIRST_API_KEY="your_api_key"
```

Get FIRST API credentials at: https://frc-events.firstinspires.org/services/API

## NPM Scripts

Add these to `package.json` for easier use:

```json
{
  "scripts": {
    "avatars:download": "node scripts/download-avatars.js",
    "avatars:test": "node scripts/download-avatars.js --test-mode",
    "avatars:2025": "node scripts/download-avatars.js 2025"
  }
}
```

Then run with:

```bash
npm run avatars:download
npm run avatars:test
```

## Automated Downloads

### During Events

Set up a cron job to download avatars nightly during event season:

```bash
# Run at 2 AM every day during March-April
0 2 * 3-4 * cd /path/to/SWAT-Website-25 && FIRST_API_USERNAME="user" FIRST_API_KEY="key" node scripts/download-avatars.js
```

### With GitHub Actions

Create `.github/workflows/download-avatars.yml`:

```yaml
name: Download Team Avatars

on:
  schedule:
    # Run at 2 AM UTC daily during event season
    - cron: '0 2 * 3-4 *'
  workflow_dispatch: # Allow manual trigger

jobs:
  download-avatars:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Download Avatars
        env:
          FIRST_API_USERNAME: ${{ secrets.FIRST_API_USERNAME }}
          FIRST_API_KEY: ${{ secrets.FIRST_API_KEY }}
        run: node scripts/download-avatars.js

      - name: Commit and Push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add frontend/public/teamavatars/
          git commit -m "Update team avatars [skip ci]" || exit 0
          git push
```

## How It Works

### Frontend Avatar Loading

The avatar helper (`frontend/src/utils/avatarHelper.ts`) provides:

1. `getTeamAvatarUrl(year, teamKey)` - Returns local avatar URL
2. `handleAvatarError(event, year, teamKey)` - Falls back to TBA on error

Example usage:

```tsx
<img
  src={getTeamAvatarUrl(event.year, 'frc1806')}
  alt="1806"
  onError={(e) => handleAvatarError(e, event.year, 'frc1806')}
/>
```

### Avatar Loading Flow

```
1. Try: /teamavatars/frc1806.png (local)
   ↓ (if fails)
2. Try: https://www.thebluealliance.com/avatar/2025/frc1806.png (TBA)
   ↓ (if fails)
3. Hide image
```

## Directory Structure

```
scripts/
├── README.md              # This file
└── download-avatars.js    # Download script

frontend/
├── public/
│   └── teamavatars/       # Cached avatar images
│       ├── frc1806.png
│       ├── frc254.png
│       └── ...
└── src/
    └── utils/
        └── avatarHelper.ts # Avatar loading utilities
```

## Best Practices

1. **Before Events**: Run `npm run avatars:download` to pre-cache avatars
2. **During Events**: Set up automated nightly downloads
3. **Test Mode**: Use `npm run avatars:test` to quickly test with dev data
4. **Git**: Consider adding `frontend/public/teamavatars/*.png` to `.gitignore` if avatars are too large for repo

## Troubleshooting

### "FIRST API credentials not set"

Set your FIRST API credentials:

```bash
export FIRST_API_USERNAME="your_username"
export FIRST_API_KEY="your_api_key"
```

Get them from: https://frc-events.firstinspires.org/services/API

### Avatars not loading

Check that:
1. Avatars exist in `frontend/public/teamavatars/`
2. Filenames match format: `frc1806.png`
3. Development server is running (avatars served from `/teamavatars/`)

### Performance

The script uses the **FIRST API** which has no rate limiting:

- **Downloads all teams** in 30-60 seconds
- **Paginated downloads** handle thousands of teams automatically
- **No delays needed** - FIRST API is designed for bulk downloads
- **7-day caching** prevents unnecessary re-downloads

**For large events (100+ teams):** The script completes in under a minute. This is 15x faster than TBA!

**Why FIRST API is better:**
- No rate limiting (TBA: ~100 req/min)
- Bulk avatar download endpoint (TBA: one at a time)
- Base64-encoded data (TBA: image files requiring HTTP requests)
- Designed for event software (TBA: designed for web browsing)
