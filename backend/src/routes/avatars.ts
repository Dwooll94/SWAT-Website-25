import { Router, Request, Response } from 'express';
import https from 'https';

const router = Router();

/**
 * GET /api/avatars/:year/:teamNumber
 * Proxy endpoint for FIRST API avatar requests
 * Bypasses CORS by making the request server-side
 */
router.get('/:year/:teamNumber', async (req: Request, res: Response) => {
  const { year, teamNumber } = req.params;

  // Validate inputs
  if (!year || !teamNumber) {
    return res.status(400).json({ error: 'Year and team number are required' });
  }

  const yearNum = parseInt(year);
  const teamNum = parseInt(teamNumber);

  if (isNaN(yearNum) || isNaN(teamNum)) {
    return res.status(400).json({ error: 'Year and team number must be valid numbers' });
  }

  // Get FIRST API credentials from environment
  const username = process.env.FIRST_API_USERNAME;
  const apiKey = process.env.FIRST_API_KEY;

  if (!username || !apiKey) {
    console.error('FIRST API credentials not configured');
    return res.status(503).json({ error: 'Avatar service not configured' });
  }

  try {
    // Create Basic Auth header
    const auth = Buffer.from(`${username}:${apiKey}`).toString('base64');

    // Make request to FIRST API
    const options = {
      hostname: 'frc-api.firstinspires.org',
      path: `/v2.0/${yearNum}/avatars?teamNumber=${teamNum}`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    };

    https.get(options, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        if (apiRes.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);

            // Extract avatar data
            if (jsonData.teams && jsonData.teams.length > 0 && jsonData.teams[0].encodedAvatar) {
              const base64Data = jsonData.teams[0].encodedAvatar;

              // Return avatar data
              res.json({
                success: true,
                data: base64Data,
                teamNumber: teamNum
              });
            } else {
              res.status(404).json({ error: 'Avatar not found' });
            }
          } catch (parseError) {
            console.error('Failed to parse FIRST API response:', parseError);
            res.status(500).json({ error: 'Failed to parse avatar data' });
          }
        } else {
          console.warn(`FIRST API returned status ${apiRes.statusCode} for team ${teamNum}`);
          res.status(apiRes.statusCode || 500).json({ error: 'Failed to fetch avatar from FIRST API' });
        }
      });
    }).on('error', (error) => {
      console.error(`Error fetching avatar for team ${teamNum}:`, error);
      res.status(500).json({ error: 'Failed to fetch avatar' });
    });
  } catch (error) {
    console.error('Error in avatar proxy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
