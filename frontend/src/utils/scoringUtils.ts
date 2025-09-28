/**
 * Utility functions for extracting ranking points from FRC match score breakdowns
 */

export interface RankingPointInfo {
  redRP: number;
  blueRP: number;
  redRPBreakdown: { [key: string]: boolean };
  blueRPBreakdown: { [key: string]: boolean };
}

/**
 * Extract ranking points from a match score breakdown based on game year
 * @param scoreBreakdown - The TBA score breakdown object
 * @param year - The competition year
 * @returns Ranking point information for both alliances
 */
export function extractRankingPoints(scoreBreakdown: any, year: number): RankingPointInfo | null {
  if (!scoreBreakdown || !scoreBreakdown.red || !scoreBreakdown.blue) {
    return null;
  }

  const red = scoreBreakdown.red;
  const blue = scoreBreakdown.blue;

  // Default structure
  const result: RankingPointInfo = {
    redRP: 0,
    blueRP: 0,
    redRPBreakdown: {},
    blueRPBreakdown: {}
  };

  switch (year) {
    case 2025: // REEFSCAPE
      result.redRP = (red.rp || 0);
      result.blueRP = (blue.rp || 0);
      
      result.redRPBreakdown = {
        'Barge Bonus': red.bargeBonusAchieved || false,
        'Coral Bonus': red.coralBonusAchieved || false
      };
      result.blueRPBreakdown = {
        'Barge Bonus': blue.bargeBonusAchieved || false,
        'Coral Bonus': blue.coralBonusAchieved || false
      };
      break;

    default:
      // For future years or unknown years, try to extract RP if available
      if (red.rp !== undefined && blue.rp !== undefined) {
        result.redRP = red.rp;
        result.blueRP = blue.rp;
      }
      break;
  }

  return result;
}

/**
 * Get the team's specific ranking points earned in a match
 * @param scoreBreakdown - The TBA score breakdown object  
 * @param year - The competition year
 * @param teamKey - The team's key (e.g. 'frc1806')
 * @param redAlliance - Array of red alliance team keys
 * @param blueAlliance - Array of blue alliance team keys
 * @returns The ranking points earned by the specific team
 */
export function getTeamRankingPoints(
  scoreBreakdown: any, 
  year: number, 
  teamKey: string, 
  redAlliance: string[], 
  blueAlliance: string[]
): { rp: number; breakdown: { [key: string]: boolean } } | null {
  const rpInfo = extractRankingPoints(scoreBreakdown, year);
  if (!rpInfo) return null;

  const isRedAlliance = redAlliance.includes(teamKey);
  const isBlueAlliance = blueAlliance.includes(teamKey);

  if (isRedAlliance) {
    return {
      rp: rpInfo.redRP,
      breakdown: rpInfo.redRPBreakdown
    };
  } else if (isBlueAlliance) {
    return {
      rp: rpInfo.blueRP,
      breakdown: rpInfo.blueRPBreakdown
    };
  }

  return null;
}