import axios, { AxiosInstance } from 'axios';
import { EventModel, CurrentEvent, TeamEventStatus, EventMatch } from '../models/Event';
import { cleanJsonObject, ensureArray, ensureObject, makeDatabaseSafe } from '../utils/jsonUtils';

export interface TBAEvent {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  district?: {
    abbreviation: string;
    display_name: string;
    key: string;
  };
  city: string;
  state_prov: string;
  country: string;
  start_date: string;
  end_date: string;
  year: number;
  short_name: string;
  event_type_string: string;
  week?: number;
  address?: string;
  postal_code?: string;
  gmaps_place_id?: string;
  gmaps_url?: string;
  lat?: number;
  lng?: number;
  location_name?: string;
  timezone?: string;
  website?: string;
  first_event_id?: string;
  first_event_code?: string;
  webcasts?: Array<{
    type: string;
    channel: string;
    date?: string;
    file?: string;
  }>;
  division_keys?: string[];
  parent_event_key?: string;
  playoff_type?: number;
  playoff_type_string?: string;
}

export interface TBATeamEventStatus {
  qual?: {
    ranking?: {
      dq?: number;
      matches_played?: number;
      qual_average?: number;
      rank?: number;
      record?: {
        losses: number;
        ties: number;
        wins: number;
      };
      sort_orders?: number[];
      team_key: string;
    };
    num_teams?: number;
    status?: string;
  };
  alliance?: {
    backup?: {
      in?: string;
      out?: string;
    };
    name?: string;
    number?: number;
    pick?: number;
  };
  playoff?: {
    current_level_record?: {
      losses: number;
      ties: number;
      wins: number;
    };
    level?: string;
    playoff_average?: number;
    record?: {
      losses: number;
      ties: number;
      wins: number;
    };
    status?: string;
  };
  alliance_status_str?: string;
  playoff_status_str?: string;
  overall_status_str?: string;
  next_match_key?: string;
  last_match_key?: string;
}

export interface TBAMatch {
  key: string;
  comp_level: 'qm' | 'ef' | 'qf' | 'sf' | 'f';
  set_number: number;
  match_number: number;
  alliances: {
    red: {
      score: number;
      team_keys: string[];
      surrogate_team_keys?: string[];
      dq_team_keys?: string[];
    };
    blue: {
      score: number;
      team_keys: string[];
      surrogate_team_keys?: string[];
      dq_team_keys?: string[];
    };
  };
  winning_alliance: '' | 'red' | 'blue';
  event_key: string;
  time?: number;
  actual_time?: number;
  predicted_time?: number;
  post_result_time?: number;
  score_breakdown?: any;
  videos?: Array<{
    type: string;
    key: string;
  }>;
}

export interface TBAEventOprs {
  oprs: { [teamKey: string]: number };
  dprs: { [teamKey: string]: number };
  ccwms: { [teamKey: string]: number };
}

class TBAService {
  private api: AxiosInstance;
  private teamNumber: string = '1806';
  private teamKey: string = 'frc1806';

  constructor() {
    this.api = axios.create({
      baseURL: 'https://www.thebluealliance.com/api/v3',
      timeout: 10000,
    });

    this.initializeApiKey();
  }

  private async initializeApiKey() {
    try {
      const config = await EventModel.getConfig('tba_api_key');
      if (config?.value) {
        this.api.defaults.headers['X-TBA-Auth-Key'] = config.value;
      }

      const teamConfig = await EventModel.getConfig('team_number');
      if (teamConfig?.value) {
        this.teamNumber = teamConfig.value;
        this.teamKey = `frc${teamConfig.value}`;
      }
    } catch (error) {
      console.error('Failed to initialize TBA API key:', error);
    }
  }

  async updateApiKey(apiKey: string, userId?: string): Promise<void> {
    await EventModel.setConfig('tba_api_key', apiKey, 'The Blue Alliance API key', userId);
    this.api.defaults.headers['X-TBA-Auth-Key'] = apiKey;
  }

  async updateTeamNumber(teamNumber: string, userId?: string): Promise<void> {
    await EventModel.setConfig('team_number', teamNumber, 'FRC Team number for event tracking', userId);
    this.teamNumber = teamNumber;
    this.teamKey = `frc${teamNumber}`;
  }

  // Get current year
  private getCurrentYear(): number {
    return new Date().getFullYear();
  }

  // Check if we should be tracking events today
  async checkForActiveEvents(): Promise<boolean> {
    try {
      const year = this.getCurrentYear();
      const response = await this.api.get<TBAEvent[]>(`/team/${this.teamKey}/events/${year}`);
      const events = response.data;

      const today = new Date();
      //today.setHours(0, 0, 0, 0);

      let hasActiveEvent = false;

      // Deactivate all events first
      await EventModel.deactivateAllEvents();

      for (const event of events) {
        const startDate = new Date(event.start_date + "(" + event.timezone + ")");
        const endDate = new Date(event.end_date + "(" + event.timezone + ")");
        endDate.setHours(23, 59, 59, 999); // End of day

        const isActive = today >= startDate && today <= endDate;
        console.log('Is Event Active?', isActive, " today?", today.toString(), " startDate?", startDate.toString(), " endDate?", endDate.toString(), "timeZone?", event.timezone);

        // Store/update event in database
        const eventData: Omit<CurrentEvent, 'id' | 'created_at' | 'updated_at'> = {
          event_key: event.key,
          event_code: event.event_code,
          name: event.name,
          event_type: event.event_type,
          district_key: event.district?.key,
          city: event.city,
          state_prov: event.state_prov,
          country: event.country,
          start_date: startDate,
          end_date: endDate,
          year: event.year,
          week: event.week,
          address: event.address,
          playoff_type: event.playoff_type,
          timezone: event.timezone,
          website: event.website,
          first_event_id: event.first_event_id,
          first_event_code: event.first_event_code,
          webcasts: makeDatabaseSafe(event.webcasts),
          division_keys: makeDatabaseSafe(event.division_keys),
          parent_event_key: event.parent_event_key,
          is_active: isActive
        };

        // Debug logging for the problematic field
        console.log('Event webcasts type:', typeof event.webcasts);
        console.log('Event webcasts value:', event.webcasts);
        console.log('Processed webcasts:', eventData.webcasts);

        await EventModel.createOrUpdateEvent(eventData);

        if (isActive) {
          hasActiveEvent = true;
          console.log(`Active event detected: ${event.name} (${event.key})`);
        }
      }

      return hasActiveEvent;
    } catch (error) {
      console.error('Error checking for active events:', error);
      return false;
    }
  }

  // Get team event status for active event
  async updateTeamEventStatus(): Promise<void> {
    try {
      const activeEvent = await EventModel.getActiveEvent();
      if (!activeEvent) return;

      const response = await this.api.get<TBATeamEventStatus>(`/team/${this.teamKey}/event/${activeEvent.event_key}/status`);
      const status = response.data;

      // Also get OPRs
      let oprs: TBAEventOprs | null = null;
      try {
        const oprResponse = await this.api.get<TBAEventOprs>(`/event/${activeEvent.event_key}/oprs`);
        oprs = oprResponse.data;
      } catch (error) {
        console.log('OPRs not available yet for this event');
      }

      const statusData: Omit<TeamEventStatus, 'id' | 'updated_at'> = {
        team_key: this.teamKey,
        event_key: activeEvent.event_key,
        qual_ranking: status.qual?.ranking?.rank,
        qual_avg: status.qual?.ranking?.qual_average,
        qual_record: makeDatabaseSafe(status.qual?.ranking?.record),
        playoff_alliance: status.alliance?.number,
        playoff_record: makeDatabaseSafe(status.playoff?.record),
        playoff_status: status.playoff?.status,
        overall_status_str: status.overall_status_str,
        next_match_key: status.next_match_key,
        last_match_key: status.last_match_key,
        opr: oprs?.oprs[this.teamKey],
        dpr: oprs?.dprs[this.teamKey],
        ccwm: oprs?.ccwms[this.teamKey]
      };

      await EventModel.createOrUpdateTeamEventStatus(statusData);
    } catch (error) {
      console.error('Error updating team event status:', error);
    }
  }

  // Get matches for active event
  async updateEventMatches(): Promise<void> {
    try {
      const activeEvent = await EventModel.getActiveEvent();
      if (!activeEvent) return;

      const response = await this.api.get<TBAMatch[]>(`/event/${activeEvent.event_key}/matches`);
      const matches = response.data;

      for (const match of matches) {
        const matchData: Omit<EventMatch, 'id' | 'updated_at'> = {
          match_key: match.key,
          event_key: match.event_key,
          comp_level: match.comp_level,
          set_number: match.set_number,
          match_number: match.match_number,
          winning_alliance: match.winning_alliance === '' ? undefined : match.winning_alliance as 'red' | 'blue',
          red_alliance: makeDatabaseSafe({
            team_keys: match.alliances.red.team_keys || [],
            score: match.alliances.red.score,
            surrogate_team_keys: match.alliances.red.surrogate_team_keys || [],
            dq_team_keys: match.alliances.red.dq_team_keys || []
          }),
          blue_alliance: makeDatabaseSafe({
            team_keys: match.alliances.blue.team_keys || [],
            score: match.alliances.blue.score,
            surrogate_team_keys: match.alliances.blue.surrogate_team_keys || [],
            dq_team_keys: match.alliances.blue.dq_team_keys || []
          }),
          red_score: match.alliances.red.score,
          blue_score: match.alliances.blue.score,
          time: match.time,
          actual_time: match.actual_time,
          predicted_time: match.predicted_time,
          post_result_time: match.post_result_time,
          score_breakdown: makeDatabaseSafe(match.score_breakdown),
          videos: makeDatabaseSafe(match.videos)
        };

        await EventModel.createOrUpdateMatch(matchData);
      }

      console.log(`Updated ${matches.length} matches for event ${activeEvent.event_key}`);
    } catch (error) {
      console.error('Error updating event matches:', error);
    }
  }

  // Get comprehensive event summary for frontend
  async getEventSummary(): Promise<any> {
    try {
      const summary = await EventModel.getEventSummary(this.teamKey);
      if (!summary || !summary.event) return null;

      // Calculate additional derived data
      const eventSummary = {
        ...summary,
        teamKey: this.teamKey,
        teamNumber: this.teamNumber
      };

      // Add turnaround time calculation if we have next match
      if (summary.nextMatch && summary.event) {
        const matches = await EventModel.getEventMatches(summary.event.event_key, this.teamKey);
        const nextMatchIndex = matches.findIndex(m => m.match_key === summary.nextMatch.match_key);
        
        if (nextMatchIndex >= 0 && nextMatchIndex < matches.length - 1) {
          const matchAfterNext = matches[nextMatchIndex + 1];
          if (summary.nextMatch.predicted_time && matchAfterNext.predicted_time) {
            eventSummary.turnaroundTime = matchAfterNext.predicted_time - summary.nextMatch.predicted_time;
            
            // Determine alliance color for match after next
            const isRedAlliance = matchAfterNext.red_alliance.team_keys?.includes(this.teamKey);
            eventSummary.turnaroundAllianceColor = isRedAlliance ? 'red' : 'blue';
          }
        }
      }

      return eventSummary;
    } catch (error) {
      console.error('Error getting event summary:', error);
      return null;
    }
  }

  // Get match schedule for sidebar display
  async getMatchSchedule(): Promise<EventMatch[]> {
    try {
      const activeEvent = await EventModel.getActiveEvent();
      if (!activeEvent) return [];

      return await EventModel.getEventMatches(activeEvent.event_key, this.teamKey);
    } catch (error) {
      console.error('Error getting match schedule:', error);
      return [];
    }
  }

  // Process webhook data (called by webhook endpoint)
  async processWebhook(webhookData: any): Promise<void> {
    try {
      const messageType = webhookData.message_type;
      
      // Log webhook for debugging
      await EventModel.logWebhook({
        message_type: messageType,
        message_data: makeDatabaseSafe(webhookData),
        team_key: this.teamKey,
        event_key: webhookData.event_key,
        match_key: webhookData.match_key,
        processed: false
      });

      // Process based on message type
      switch (messageType) {
        case 'upcoming_match':
        case 'match_score':
          await this.updateEventMatches();
          await this.updateTeamEventStatus();
          break;
        case 'alliance_selection':
          await this.updateTeamEventStatus();
          break;
        case 'schedule_updated':
          await this.updateEventMatches();
          break;
        default:
          console.log(`Unhandled webhook message type: ${messageType}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }
}

export default new TBAService();