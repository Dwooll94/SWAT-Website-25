/**
 * Avatar Download Script
 * Downloads team avatars from the FIRST API
 * Run this nightly during event season or before events
 *
 * Usage: node scripts/download-avatars.js [year] [--test-mode] [--teams team1,team2,...]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// FIRST API credentials (get from: https://frc-events.firstinspires.org/services/API)
const FIRST_API_USERNAME = process.env.FIRST_API_USERNAME || 'YOUR_USERNAME_HERE';
const FIRST_API_KEY = process.env.FIRST_API_KEY || 'YOUR_API_KEY_HERE';
const TBA_API_KEY = process.env.TBA_API_KEY; // Optional, for fallback only

const AVATAR_DIR = path.join(__dirname, '../frontend/public/teamavatars');
const CURRENT_YEAR = new Date().getFullYear();
const year = process.argv[2] || CURRENT_YEAR;
const isTestMode = process.argv.includes('--test-mode');

// Parse --teams argument for specific teams
const teamsArg = process.argv.find(arg => arg.startsWith('--teams='));
const specificTeams = teamsArg ? teamsArg.split('=')[1].split(',') : null;

// Ensure avatar directory exists
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  console.log(`Created avatar directory: ${AVATAR_DIR}`);
}

// Test mode teams (from LiveEventDisplay.tsx)
const TEST_MODE_TEAMS = [
  '1806', '254', '1678', '973', '1114', '118', '1987', '1986', '1730', '1710',
  '4522', '2345', '2457', '16', '6424', '125', '2056', '1023', '1939', '987',
  '4766', '935', '1825', '1756', '3284', '5098', '2001', '1785', '1763', '1764',
  '4959', '5119', '5126', '9410', '1108', '1208', '1802', '1827', '1997', '1847', '2410'
];

/**
 * Make HTTPS request to FIRST API
 */
function firstApiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${FIRST_API_USERNAME}:${FIRST_API_KEY}`).toString('base64');

    const options = {
      hostname: 'frc-api.firstinspires.org',
      path: endpoint,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`FIRST API error: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Make HTTPS request to TBA API (fallback only)
 */
function tbaRequest(endpoint) {
  if (!TBA_API_KEY) {
    return Promise.reject(new Error('TBA API key not set'));
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.thebluealliance.com',
      path: `/api/v3${endpoint}`,
      headers: {
        'X-TBA-Auth-Key': TBA_API_KEY
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`TBA API error: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Download avatar image from base64 data
 */
function saveAvatarFromBase64(teamNum, base64Data) {
  const teamKey = `frc${teamNum}`;
  const fileName = `${teamKey}.png`;
  const filePath = path.join(AVATAR_DIR, fileName);

  try {
    // Remove data URI prefix if present (e.g., "data:image/png;base64,")
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`  ✓ ${teamNum} (downloaded)`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${teamNum} (error: ${err.message})`);
    return false;
  }
}

/**
 * Download avatar from TBA as fallback
 */
function downloadAvatarFromTBA(year, teamKey) {
  return new Promise((resolve, reject) => {
    const teamNum = teamKey.replace('frc', '');
    const fileName = `${teamKey}.png`;
    const filePath = path.join(AVATAR_DIR, fileName);

    const url = `https://www.thebluealliance.com/avatar/${year}/${teamKey}.png`;

    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(filePath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`  ✓ ${teamNum} (TBA fallback)`);
          resolve();
        });
      } else if (res.statusCode === 404) {
        console.log(`  ⚠ ${teamNum} (no avatar)`);
        resolve();
      } else {
        console.log(`  ✗ ${teamNum} (HTTP ${res.statusCode})`);
        resolve();
      }
    }).on('error', (err) => {
      console.log(`  ✗ ${teamNum} (error: ${err.message})`);
      resolve();
    });
  });
}

/**
 * Get all avatars from FIRST API (paginated)
 */
async function downloadAllAvatarsFromFIRST() {
  console.log(`Fetching avatars from FIRST API for ${year}...`);

  let page = 1;
  let totalDownloaded = 0;
  let hasMorePages = true;

  while (hasMorePages) {
    try {
      console.log(`\nFetching page ${page}...`);
      const response = await firstApiRequest(`/v2.0/${year}/avatars?page=${page}`);

      if (response.teams && response.teams.length > 0) {
        console.log(`  Processing ${response.teams.length} teams...`);

        for (const team of response.teams) {
          if (team.encodedAvatar) {
            const teamNum = team.teamNumber;

            // Check if we should process this team
            if (specificTeams && !specificTeams.includes(teamNum.toString())) {
              continue;
            }

            // Skip if already exists and is recent
            const fileName = `frc${teamNum}.png`;
            const filePath = path.join(AVATAR_DIR, fileName);
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
              if (ageInDays < 7) {
                console.log(`  ✓ ${teamNum} (cached)`);
                continue;
              }
            }

            if (saveAvatarFromBase64(teamNum, team.encodedAvatar)) {
              totalDownloaded++;
            }
          }
        }

        // Check if there are more pages
        if (response.pageCurrent < response.pageTotal) {
          page++;
          // Small delay between pages
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMorePages = false;
        }
      } else {
        hasMorePages = false;
      }
    } catch (err) {
      console.error(`  Error fetching page ${page}: ${err.message}`);
      hasMorePages = false;
    }
  }

  console.log(`\n  Completed: ${totalDownloaded} avatars downloaded from FIRST API`);
  return totalDownloaded;
}

/**
 * Get teams from TBA for fallback
 */
async function getActiveEventTeamsFromTBA() {
  if (!TBA_API_KEY) {
    console.log('TBA API key not set, skipping TBA fallback');
    return [];
  }

  try {
    console.log(`\nFetching events from TBA for ${year}...`);
    const events = await tbaRequest(`/events/${year}`);

    // Filter to current and upcoming events (within 2 weeks)
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const activeEvents = events.filter(event => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      return endDate >= now && startDate <= twoWeeksFromNow;
    });

    console.log(`Found ${activeEvents.length} active/upcoming events`);

    const allTeams = new Set();

    for (const event of activeEvents) {
      console.log(`\nFetching teams for ${event.name} (${event.event_code})...`);
      try {
        const teams = await tbaRequest(`/event/${event.key}/teams/keys`);
        teams.forEach(teamKey => allTeams.add(teamKey));
        console.log(`  ${teams.length} teams`);

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`  Error fetching teams: ${err.message}`);
      }
    }

    return Array.from(allTeams);
  } catch (err) {
    console.error(`Error fetching events from TBA: ${err.message}`);
    return [];
  }
}

/**
 * Download specific teams from TBA as fallback
 */
async function downloadAvatarsFromTBA(teams) {
  console.log(`\nDownloading ${teams.length} avatars from TBA fallback...`);

  let completedCount = 0;

  for (const teamKey of teams) {
    try {
      await downloadAvatarFromTBA(year, teamKey);
      completedCount++;

      // Progress indicator
      if (completedCount % 10 === 0) {
        console.log(`  Progress: ${completedCount}/${teams.length} avatars`);
      }

      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.log(`  ✗ ${teamKey}: ${err.message}`);
    }
  }

  console.log(`\n  Completed: ${completedCount}/${teams.length} avatars from TBA`);
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Team Avatar Download Script');
  console.log('='.repeat(60));

  // Check for FIRST API credentials
  if (FIRST_API_USERNAME === 'YOUR_USERNAME_HERE' || FIRST_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('\n❌ Error: FIRST API credentials not set');
    console.error('Set them with:');
    console.error('  export FIRST_API_USERNAME="your_username"');
    console.error('  export FIRST_API_KEY="your_api_key"');
    console.error('\nGet credentials from: https://frc-events.firstinspires.org/services/API');
    process.exit(1);
  }

  if (isTestMode) {
    console.log('\n🧪 Test Mode: Downloading avatars for test teams only\n');

    // In test mode, download specific teams
    const testTeamNumbers = TEST_MODE_TEAMS;

    // Download all avatars but filter to test teams
    console.log(`Downloading avatars for ${testTeamNumbers.length} test teams...`);

    let downloaded = 0;
    for (const teamNum of testTeamNumbers) {
      const filePath = path.join(AVATAR_DIR, `frc${teamNum}.png`);

      // Check if cached
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays < 7) {
          console.log(`  ✓ ${teamNum} (cached)`);
          continue;
        }
      }

      // Need to fetch this team
      downloaded++;
    }

    if (downloaded > 0) {
      // For test mode, we'll download from TBA if available, otherwise FIRST
      if (TBA_API_KEY) {
        const teamKeys = testTeamNumbers.map(num => `frc${num}`);
        await downloadAvatarsFromTBA(teamKeys);
      } else {
        console.log('Fetching from FIRST API...');
        await downloadAllAvatarsFromFIRST();
      }
    } else {
      console.log('\n✅ All test team avatars already cached!');
    }
  } else if (specificTeams) {
    console.log(`\n📋 Downloading avatars for specific teams: ${specificTeams.join(', ')}\n`);

    // Download all from FIRST, filtering to specific teams
    await downloadAllAvatarsFromFIRST();
  } else {
    console.log(`\n🌐 Downloading all avatars for year ${year}\n`);

    // Download all avatars from FIRST API
    const downloaded = await downloadAllAvatarsFromFIRST();

    console.log(`\n✅ Downloaded ${downloaded} new/updated avatars from FIRST API`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Avatar download complete!');
  console.log(`📁 Avatars saved to: ${AVATAR_DIR}`);
  console.log('='.repeat(60));
}

// Run the script
main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
