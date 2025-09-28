import pool from '../config/database';

export interface EventConfig {
  id?: number;
  key: string;
  value: string | null;
  description: string | null;
  is_encrypted: boolean;
  updated_at?: Date;
  updated_by?: string;
}

export interface CurrentEvent {
  id?: number;
  event_key: string;
  event_code: string;
  name: string;
  event_type: number;
  district_key?: string;
  city?: string;
  state_prov?: string;
  country?: string;
  start_date: Date;
  end_date: Date;
  year: number;
  week?: number;
  address?: string;
  playoff_type?: number;
  timezone?: string;
  website?: string;
  first_event_id?: string;
  first_event_code?: string;
  webcasts?: any;
  division_keys?: any;
  parent_event_key?: string;
  is_active: boolean;
  updated_at?: Date;
  created_at?: Date;
}

export interface TeamEventStatus {
  id?: number;
  team_key: string;
  event_key: string;
  qual_ranking?: number;
  qual_avg?: number;
  qual_record?: {wins: number, losses: number, ties: number};
  playoff_alliance?: number;
  playoff_record?: {wins: number, losses: number, ties: number};
  playoff_status?: string;
  overall_status_str?: string;
  next_match_key?: string;
  last_match_key?: string;
  opr?: number;
  dpr?: number;
  ccwm?: number;
  updated_at?: Date;
}

export interface EventMatch {
  id?: number;
  match_key: string;
  event_key: string;
  comp_level: 'qm' | 'ef' | 'qf' | 'sf' | 'f';
  set_number?: number;
  match_number: number;
  winning_alliance?: 'red' | 'blue';
  red_alliance: any;
  blue_alliance: any;
  red_score?: number;
  blue_score?: number;
  time?: number;
  actual_time?: number;
  predicted_time?: number;
  post_result_time?: number;
  score_breakdown?: any;
  videos?: any;
  updated_at?: Date;
}

export interface EventStatsCache {
  id?: number;
  event_key: string;
  team_key: string;
  stat_type: string;
  stat_data: any;
  expires_at: Date;
  created_at?: Date;
}

export interface TBAWebhookLog {
  id?: number;
  message_type: string;
  message_data: any;
  team_key?: string;
  event_key?: string;
  match_key?: string;
  processed: boolean;
  error_message?: string;
  received_at?: Date;
  processed_at?: Date;
}

export class EventModel {
  // Event Configuration Methods
  static async getConfig(key: string): Promise<EventConfig | null> {
    const query = 'SELECT * FROM event_config WHERE key = $1';
    const result = await pool.query(query, [key]);
    return result.rows[0] || null;
  }

  static async setConfig(key: string, value: string, description?: string, userId?: string): Promise<EventConfig> {
    const query = `
      INSERT INTO event_config (key, value, description, updated_by) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key) DO UPDATE SET 
        value = $2, description = COALESCE($3, event_config.description), 
        updated_by = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [key, value, description, userId]);
    return result.rows[0];
  }

  static async getAllConfig(): Promise<EventConfig[]> {
    const query = 'SELECT * FROM event_config ORDER BY key';
    const result = await pool.query(query);
    return result.rows;
  }

  // Current Events Methods
  static async getActiveEvent(): Promise<CurrentEvent | null> {
    const query = 'SELECT * FROM current_events WHERE is_active = true ORDER BY start_date DESC LIMIT 1';
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  static async createOrUpdateEvent(eventData: Omit<CurrentEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CurrentEvent> {
    const query = `
      INSERT INTO current_events (
        event_key, event_code, name, event_type, district_key, city, state_prov, country,
        start_date, end_date, year, week, address, playoff_type, timezone, website,
        first_event_id, first_event_code, webcasts, division_keys, parent_event_key, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, $20::jsonb, $21, $22)
      ON CONFLICT (event_key) DO UPDATE SET 
        event_code = $2, name = $3, event_type = $4, district_key = $5, city = $6,
        state_prov = $7, country = $8, start_date = $9, end_date = $10, year = $11,
        week = $12, address = $13, playoff_type = $14, timezone = $15, website = $16,
        first_event_id = $17, first_event_code = $18, webcasts = $19::jsonb, division_keys = $20::jsonb,
        parent_event_key = $21, is_active = $22, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    // Ensure JSON fields are properly serialized
    const safeWebcasts = eventData.webcasts === null || eventData.webcasts === undefined 
      ? null : JSON.stringify(eventData.webcasts);
    const safeDivisionKeys = eventData.division_keys === null || eventData.division_keys === undefined 
      ? null : JSON.stringify(eventData.division_keys);
    
    const values = [
      eventData.event_key, eventData.event_code, eventData.name, eventData.event_type,
      eventData.district_key, eventData.city, eventData.state_prov, eventData.country,
      eventData.start_date, eventData.end_date, eventData.year, eventData.week,
      eventData.address, eventData.playoff_type, eventData.timezone, eventData.website,
      eventData.first_event_id, eventData.first_event_code, safeWebcasts,
      safeDivisionKeys, eventData.parent_event_key, eventData.is_active
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deactivateAllEvents(): Promise<void> {
    const query = 'UPDATE current_events SET is_active = false';
    await pool.query(query);
  }

  // Team Event Status Methods
  static async getTeamEventStatus(teamKey: string, eventKey: string): Promise<TeamEventStatus | null> {
    const query = 'SELECT * FROM team_event_status WHERE team_key = $1 AND event_key = $2';
    const result = await pool.query(query, [teamKey, eventKey]);
    return result.rows[0] || null;
  }

  static async createOrUpdateTeamEventStatus(statusData: Omit<TeamEventStatus, 'id' | 'updated_at'>): Promise<TeamEventStatus> {
    const query = `
      INSERT INTO team_event_status (
        team_key, event_key, qual_ranking, qual_avg, qual_record, playoff_alliance,
        playoff_record, playoff_status, overall_status_str, next_match_key, last_match_key,
        opr, dpr, ccwm
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (team_key, event_key) DO UPDATE SET
        qual_ranking = $3, qual_avg = $4, qual_record = $5, playoff_alliance = $6,
        playoff_record = $7, playoff_status = $8, overall_status_str = $9,
        next_match_key = $10, last_match_key = $11, opr = $12, dpr = $13, ccwm = $14,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [
      statusData.team_key, statusData.event_key, statusData.qual_ranking, statusData.qual_avg,
      statusData.qual_record, statusData.playoff_alliance, statusData.playoff_record,
      statusData.playoff_status, statusData.overall_status_str, statusData.next_match_key,
      statusData.last_match_key, statusData.opr, statusData.dpr, statusData.ccwm
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Event Matches Methods
  static async getEventMatches(eventKey: string, teamKey?: string): Promise<EventMatch[]> {
    let query = 'SELECT * FROM event_matches WHERE event_key = $1';
    const params: any[] = [eventKey];
    
    if (teamKey) {
      query += ` AND (red_alliance->'team_keys' ? $2 OR blue_alliance->'team_keys' ? $2)`;
      params.push(teamKey);
    }
    
    // Order by logical progression: quals first, then eliminations in order
    query += ` ORDER BY 
      CASE comp_level 
        WHEN 'qm' THEN 1 
        WHEN 'ef' THEN 2 
        WHEN 'qf' THEN 3 
        WHEN 'sf' THEN 4 
        WHEN 'f' THEN 5 
        ELSE 6 
      END, 
      COALESCE(set_number, 1), 
      match_number`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getNextMatch(eventKey: string, teamKey: string): Promise<EventMatch | null> {
    const query = `
      SELECT * FROM event_matches 
      WHERE event_key = $1 AND (red_alliance->'team_keys' ? $2 OR blue_alliance->'team_keys' ? $2)
      AND (time > EXTRACT(epoch FROM NOW()) OR time IS NULL OR ((red_score = -1 AND blue_score = -1)))
      ORDER BY 
        CASE comp_level 
          WHEN 'qm' THEN 1 
          WHEN 'ef' THEN 2 
          WHEN 'qf' THEN 3 
          WHEN 'sf' THEN 4 
          WHEN 'f' THEN 5 
          ELSE 6 
        END, 
        COALESCE(set_number, 1), 
        match_number LIMIT 1
    `;
    const result = await pool.query(query, [eventKey, teamKey]);
    return result.rows[0] || null;
  }

  static async getLastMatch(eventKey: string, teamKey: string): Promise<EventMatch | null> {
    const query = `
      SELECT * FROM event_matches 
      WHERE event_key = $1 AND (red_alliance->'team_keys' ? $2 OR blue_alliance->'team_keys' ? $2)
      AND (post_result_time IS NOT NULL OR (red_score > -1 AND blue_score > -1))
      ORDER BY 
        CASE comp_level 
          WHEN 'qm' THEN 1 
          WHEN 'ef' THEN 2 
          WHEN 'qf' THEN 3 
          WHEN 'sf' THEN 4 
          WHEN 'f' THEN 5 
          ELSE 6 
        END DESC, 
        COALESCE(set_number, 1) DESC, 
        match_number DESC LIMIT 1
    `;
    const result = await pool.query(query, [eventKey, teamKey]);
    return result.rows[0] || null;
  }

  static async createOrUpdateMatch(matchData: Omit<EventMatch, 'id' | 'updated_at'>): Promise<EventMatch> {
    const query = `
      INSERT INTO event_matches (
        match_key, event_key, comp_level, set_number, match_number, winning_alliance,
        red_alliance, blue_alliance, red_score, blue_score, time, actual_time,
        predicted_time, post_result_time, score_breakdown, videos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12, $13, $14, $15::jsonb, $16::jsonb)
      ON CONFLICT (match_key) DO UPDATE SET
        comp_level = $3, set_number = $4, match_number = $5, winning_alliance = $6,
        red_alliance = $7::jsonb, blue_alliance = $8::jsonb, red_score = $9, blue_score = $10,
        time = $11, actual_time = $12, predicted_time = $13, post_result_time = $14,
        score_breakdown = $15::jsonb, videos = $16::jsonb, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    // Ensure JSON fields are properly serialized
    const safeRedAlliance = matchData.red_alliance === null || matchData.red_alliance === undefined 
      ? null : JSON.stringify(matchData.red_alliance);
    const safeBlueAlliance = matchData.blue_alliance === null || matchData.blue_alliance === undefined 
      ? null : JSON.stringify(matchData.blue_alliance);
    const safeScoreBreakdown = matchData.score_breakdown === null || matchData.score_breakdown === undefined 
      ? null : JSON.stringify(matchData.score_breakdown);
    const safeVideos = matchData.videos === null || matchData.videos === undefined 
      ? null : JSON.stringify(matchData.videos);
    
    const values = [
      matchData.match_key, matchData.event_key, matchData.comp_level, matchData.set_number,
      matchData.match_number, matchData.winning_alliance, safeRedAlliance,
      safeBlueAlliance, matchData.red_score, matchData.blue_score, matchData.time,
      matchData.actual_time, matchData.predicted_time, matchData.post_result_time,
      safeScoreBreakdown, safeVideos
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Stats Cache Methods
  static async getCachedStat(eventKey: string, teamKey: string, statType: string): Promise<EventStatsCache | null> {
    const query = 'SELECT * FROM event_stats_cache WHERE event_key = $1 AND team_key = $2 AND stat_type = $3 AND expires_at > NOW()';
    const result = await pool.query(query, [eventKey, teamKey, statType]);
    return result.rows[0] || null;
  }

  static async setCachedStat(cacheData: Omit<EventStatsCache, 'id' | 'created_at'>): Promise<EventStatsCache> {
    const query = `
      INSERT INTO event_stats_cache (event_key, team_key, stat_type, stat_data, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (event_key, team_key, stat_type) DO UPDATE SET
        stat_data = $4, expires_at = $5, created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [
      cacheData.event_key, cacheData.team_key, cacheData.stat_type,
      cacheData.stat_data, cacheData.expires_at
    ]);
    return result.rows[0];
  }

  // Webhook Log Methods
  static async logWebhook(logData: Omit<TBAWebhookLog, 'id' | 'received_at'>): Promise<TBAWebhookLog> {
    const query = `
      INSERT INTO tba_webhook_logs (
        message_type, message_data, team_key, event_key, match_key, processed, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [
      logData.message_type, logData.message_data, logData.team_key,
      logData.event_key, logData.match_key, logData.processed, logData.error_message
    ]);
    return result.rows[0];
  }

  static async markWebhookProcessed(id: number, errorMessage?: string): Promise<void> {
    const query = 'UPDATE tba_webhook_logs SET processed = true, processed_at = CURRENT_TIMESTAMP, error_message = $1 WHERE id = $2';
    await pool.query(query, [errorMessage, id]);
  }

  // Utility Methods
  static async cleanupExpiredCache(): Promise<void> {
    const query = 'DELETE FROM event_stats_cache WHERE expires_at < NOW()';
    await pool.query(query);
  }

  static async getEventSummary(teamKey: string): Promise<any> {
    const activeEvent = await this.getActiveEvent();
    if (!activeEvent) return null;

    const teamStatus = await this.getTeamEventStatus(teamKey, activeEvent.event_key);
    const nextMatch = await this.getNextMatch(activeEvent.event_key, teamKey);
    const lastMatch = await this.getLastMatch(activeEvent.event_key, teamKey);

    return {
      event: activeEvent,
      teamStatus,
      nextMatch,
      lastMatch
    };
  }
}