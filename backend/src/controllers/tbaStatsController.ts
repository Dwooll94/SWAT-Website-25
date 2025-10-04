import { Request, Response } from 'express';
import axios from 'axios';
import { EventModel } from '../models/Event';

interface TBATeamEventSimple {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  start_date: string;
  end_date: string;
  year: number;
}

interface TBAAward {
  event_key: string;
  award_type: number;
  name: string;
  recipient_list: Array<{
    team_key: string;
    awardee: string | null;
  }>;
  year: number;
}

interface TBAEventAlliance {
  name: string;
  backup: any;
  declines: string[];
  picks: string[];
  status: {
    playoff_average: number;
    level: string;
    record: {
      losses: number;
      wins: number;
      ties: number;
    };
    current_level_record: {
      losses: number;
      wins: number;
      ties: number;
    };
    status: string;
  };
}

class TBAStatsController {
  private async getApiKey(): Promise<string | null> {
    try {
      const config = await EventModel.getConfig('tba_api_key');
      return config?.value || null;
    } catch (error) {
      console.error('Failed to get TBA API key:', error);
      return null;
    }
  }

  private async getTeamNumber(req: Request): Promise<string> {
    const teamNumber = req.query.team as string;
    if (teamNumber) {
      return teamNumber;
    }
    try {
      const config = await EventModel.getConfig('team_number');
      return config?.value || '1806';
    } catch (error) {
      console.error('Failed to get team number:', error);
      return '1806';
    }
  }

  // Get regional win count (Winner or Finalist at regional events)
  async getRegionalWinCount(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        res.status(500).json({ error: 'TBA API key not configured' });
        return;
      }

      const teamNumber = await this.getTeamNumber(req);
      const teamKey = `frc${teamNumber}`;

      const response = await axios.get<TBAAward[]>(
        `https://www.thebluealliance.com/api/v3/team/${teamKey}/awards`,
        {
          headers: { 'X-TBA-Auth-Key': apiKey },
          timeout: 10000,
        }
      );

      const awards = response.data;

      // Regional winners and finalists (event_type 0-2 are regionals)
      const regionalWins = awards.filter(award => {
        const isWinnerOrFinalist = award.award_type === 1 || award.award_type === 2;
        // We'll need to check event type via event details if needed, but for now
        // we can approximate by checking if event_key contains 'regional' patterns
        return isWinnerOrFinalist;
      });

      const winnerCount = regionalWins.filter(a => a.award_type === 1).length;
      const finalistCount = regionalWins.filter(a => a.award_type === 2).length;

      res.json({
        teamKey,
        teamNumber,
        winners: winnerCount,
        finalists: finalistCount,
        total: regionalWins.length,
        awards: regionalWins
      });
    } catch (error: any) {
      console.error('Error getting regional win count:', error);
      res.status(500).json({ error: 'Failed to fetch regional win count', details: error.message });
    }
  }

  // Get event win count (all Winner awards)
  async getEventWinCount(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        res.status(500).json({ error: 'TBA API key not configured' });
        return;
      }

      const teamNumber = await this.getTeamNumber(req);
      const teamKey = `frc${teamNumber}`;

      const response = await axios.get<TBAAward[]>(
        `https://www.thebluealliance.com/api/v3/team/${teamKey}/awards`,
        {
          headers: { 'X-TBA-Auth-Key': apiKey },
          timeout: 10000,
        }
      );

      const awards = response.data;
      const eventWins = awards.filter(award => award.award_type === 1);

      res.json({
        teamKey,
        teamNumber,
        count: eventWins.length,
        wins: eventWins
      });
    } catch (error: any) {
      console.error('Error getting event win count:', error);
      res.status(500).json({ error: 'Failed to fetch event win count', details: error.message });
    }
  }

  // Get total award count
  async getAwardCount(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        res.status(500).json({ error: 'TBA API key not configured' });
        return;
      }

      const teamNumber = await this.getTeamNumber(req);
      const teamKey = `frc${teamNumber}`;

      const response = await axios.get<TBAAward[]>(
        `https://www.thebluealliance.com/api/v3/team/${teamKey}/awards`,
        {
          headers: { 'X-TBA-Auth-Key': apiKey },
          timeout: 10000,
        }
      );

      const awards = response.data;

      res.json({
        teamKey,
        teamNumber,
        count: awards.length,
        byYear: awards.reduce((acc, award) => {
          acc[award.year] = (acc[award.year] || 0) + 1;
          return acc;
        }, {} as Record<number, number>)
      });
    } catch (error: any) {
      console.error('Error getting award count:', error);
      res.status(500).json({ error: 'Failed to fetch award count', details: error.message });
    }
  }

  // Get events entered count
  async getEventsEntered(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        res.status(500).json({ error: 'TBA API key not configured' });
        return;
      }

      const teamNumber = await this.getTeamNumber(req);
      const teamKey = `frc${teamNumber}`;

      const response = await axios.get<TBATeamEventSimple[]>(
        `https://www.thebluealliance.com/api/v3/team/${teamKey}/events/simple`,
        {
          headers: { 'X-TBA-Auth-Key': apiKey },
          timeout: 10000,
        }
      );

      const events = response.data;

      res.json({
        teamKey,
        teamNumber,
        count: events.length,
        byYear: events.reduce((acc, event) => {
          acc[event.year] = (acc[event.year] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        firstYear: events.length > 0 ? Math.min(...events.map(e => e.year)) : null,
        lastYear: events.length > 0 ? Math.max(...events.map(e => e.year)) : null
      });
    } catch (error: any) {
      console.error('Error getting events entered:', error);
      res.status(500).json({ error: 'Failed to fetch events entered', details: error.message });
    }
  }

  // Get most recent event win
  async getMostRecentEventWin(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        res.status(500).json({ error: 'TBA API key not configured' });
        return;
      }

      const teamNumber = await this.getTeamNumber(req);
      const teamKey = `frc${teamNumber}`;

      const response = await axios.get<TBAAward[]>(
        `https://www.thebluealliance.com/api/v3/team/${teamKey}/awards`,
        {
          headers: { 'X-TBA-Auth-Key': apiKey },
          timeout: 10000,
        }
      );

      const awards = response.data;
      const eventWins = awards.filter(award => award.award_type === 1);

      // Sort by year descending
      eventWins.sort((a, b) => b.year - a.year);

      const mostRecent = eventWins.length > 0 ? eventWins[0] : null;

      // Fetch event name if we have a most recent win
      let eventName = null;
      if (mostRecent) {
        try {
          const eventResponse = await axios.get(
            `https://www.thebluealliance.com/api/v3/event/${mostRecent.event_key}`,
            {
              headers: { 'X-TBA-Auth-Key': apiKey },
              timeout: 10000,
            }
          );
          eventName = eventResponse.data.name;
        } catch (e) {
          console.error('Failed to fetch event name:', e);
          // If we can't get the event name, we'll just use null
        }
      }

      res.json({
        teamKey,
        teamNumber,
        mostRecentWin: mostRecent,
        eventName
      });
    } catch (error: any) {
      console.error('Error getting most recent event win:', error);
      res.status(500).json({ error: 'Failed to fetch most recent event win', details: error.message });
    }
  }

  // Get most recent event results
  async getMostRecentEventResults(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        res.status(500).json({ error: 'TBA API key not configured' });
        return;
      }

      const teamNumber = await this.getTeamNumber(req);
      const teamKey = `frc${teamNumber}`;

      const response = await axios.get<TBATeamEventSimple[]>(
        `https://www.thebluealliance.com/api/v3/team/${teamKey}/events/simple`,
        {
          headers: { 'X-TBA-Auth-Key': apiKey },
          timeout: 10000,
        }
      );

      const events = response.data;

      // Filter to only include past events (end_date is in the past)
      const now = new Date();
      const pastEvents = events.filter(event => {
        const endDate = new Date(event.end_date);
        return endDate < now;
      });

      // Sort by date descending
      pastEvents.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

      const mostRecentEvent = pastEvents.length > 0 ? pastEvents[0] : null;

      if (!mostRecentEvent) {
        res.json({
          teamKey,
          teamNumber,
          event: null,
          status: null,
          alliances: null,
          awards: null
        });
        return;
      }

      // Get detailed event status
      const [statusRes, alliancesRes, awardsRes] = await Promise.allSettled([
        axios.get(
          `https://www.thebluealliance.com/api/v3/team/${teamKey}/event/${mostRecentEvent.key}/status`,
          { headers: { 'X-TBA-Auth-Key': apiKey }, timeout: 10000 }
        ),
        axios.get<TBAEventAlliance[]>(
          `https://www.thebluealliance.com/api/v3/event/${mostRecentEvent.key}/alliances`,
          { headers: { 'X-TBA-Auth-Key': apiKey }, timeout: 10000 }
        ),
        axios.get<TBAAward[]>(
          `https://www.thebluealliance.com/api/v3/team/${teamKey}/event/${mostRecentEvent.key}/awards`,
          { headers: { 'X-TBA-Auth-Key': apiKey }, timeout: 10000 }
        )
      ]);

      res.json({
        teamKey,
        teamNumber,
        event: mostRecentEvent,
        status: statusRes.status === 'fulfilled' ? statusRes.value.data : null,
        alliances: alliancesRes.status === 'fulfilled' ? alliancesRes.value.data : null,
        awards: awardsRes.status === 'fulfilled' ? awardsRes.value.data : null
      });
    } catch (error: any) {
      console.error('Error getting most recent event results:', error);
      res.status(500).json({ error: 'Failed to fetch most recent event results', details: error.message });
    }
  }

  // Get most recent award
  async getMostRecentAward(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        res.status(500).json({ error: 'TBA API key not configured' });
        return;
      }

      const teamNumber = await this.getTeamNumber(req);
      const teamKey = `frc${teamNumber}`;

      const response = await axios.get<TBAAward[]>(
        `https://www.thebluealliance.com/api/v3/team/${teamKey}/awards`,
        {
          headers: { 'X-TBA-Auth-Key': apiKey },
          timeout: 10000,
        }
      );

      const awards = response.data;

      // Sort by year descending
      awards.sort((a, b) => b.year - a.year);

      const mostRecent = awards.length > 0 ? awards[0] : null;

      // Fetch event name if we have a most recent award
      let eventName = null;
      if (mostRecent) {
        try {
          const eventResponse = await axios.get(
            `https://www.thebluealliance.com/api/v3/event/${mostRecent.event_key}`,
            {
              headers: { 'X-TBA-Auth-Key': apiKey },
              timeout: 10000,
            }
          );
          eventName = eventResponse.data.name;
        } catch (e) {
          console.error('Failed to fetch event name:', e);
          // If we can't get the event name, we'll just use null
        }
      }

      res.json({
        teamKey,
        teamNumber,
        mostRecentAward: mostRecent,
        eventName
      });
    } catch (error: any) {
      console.error('Error getting most recent award:', error);
      res.status(500).json({ error: 'Failed to fetch most recent award', details: error.message });
    }
  }

  // Get awards by type using regex pattern
  async getAwardsByType(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        res.status(500).json({ error: 'TBA API key not configured' });
        return;
      }

      const teamNumber = await this.getTeamNumber(req);
      const teamKey = `frc${teamNumber}`;

      const pattern = req.query.pattern as string || '.*';
      const label = req.query.label as string || 'Awards';

      const response = await axios.get<TBAAward[]>(
        `https://www.thebluealliance.com/api/v3/team/${teamKey}/awards`,
        {
          headers: { 'X-TBA-Auth-Key': apiKey },
          timeout: 10000,
        }
      );

      const awards = response.data;

      // Filter awards by regex pattern
      let regex: RegExp;
      try {
        regex = new RegExp(pattern, 'i'); // case-insensitive
      } catch (e) {
        res.status(400).json({ error: 'Invalid regex pattern', details: (e as Error).message });
        return;
      }

      const matchingAwards = awards.filter(award => regex.test(award.name));

      res.json({
        teamKey,
        teamNumber,
        count: matchingAwards.length,
        awards: matchingAwards,
        pattern,
        label
      });
    } catch (error: any) {
      console.error('Error getting awards by type:', error);
      res.status(500).json({ error: 'Failed to fetch awards by type', details: error.message });
    }
  }
}

const controller = new TBAStatsController();

export const getRegionalWinCount = (req: Request, res: Response) => controller.getRegionalWinCount(req, res);
export const getEventWinCount = (req: Request, res: Response) => controller.getEventWinCount(req, res);
export const getAwardCount = (req: Request, res: Response) => controller.getAwardCount(req, res);
export const getEventsEntered = (req: Request, res: Response) => controller.getEventsEntered(req, res);
export const getMostRecentEventWin = (req: Request, res: Response) => controller.getMostRecentEventWin(req, res);
export const getMostRecentEventResults = (req: Request, res: Response) => controller.getMostRecentEventResults(req, res);
export const getMostRecentAward = (req: Request, res: Response) => controller.getMostRecentAward(req, res);
export const getAwardsByType = (req: Request, res: Response) => controller.getAwardsByType(req, res);
