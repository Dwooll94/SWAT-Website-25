import pool from '../config/database';

export interface Subteam {
  id: number;
  name: string;
  description?: string;
  is_primary: boolean;
  display_order: number;
  is_active: boolean;
}

export interface SubteamPreference {
  id: number;
  user_id: string;
  subteam_id: number;
  preference_rank?: number;
  is_interested: boolean;
}

export class SubteamModel {
  static async getActiveSubteams(): Promise<Subteam[]> {
    const result = await pool.query(
      'SELECT * FROM subteams WHERE is_active = true ORDER BY display_order, name'
    );
    return result.rows;
  }

  static async getPrimarySubteams(): Promise<Subteam[]> {
    const result = await pool.query(
      'SELECT * FROM subteams WHERE is_active = true AND is_primary = true ORDER BY display_order, name'
    );
    return result.rows;
  }

  static async getSecondarySubteams(): Promise<Subteam[]> {
    const result = await pool.query(
      'SELECT * FROM subteams WHERE is_active = true AND is_primary = false ORDER BY display_order, name'
    );
    return result.rows;
  }

  static async getUserPreferences(userId: string): Promise<SubteamPreference[]> {
    const result = await pool.query(
      `SELECT usp.*, s.name as subteam_name, s.description as subteam_description
       FROM user_subteam_preferences usp
       JOIN subteams s ON usp.subteam_id = s.id
       WHERE usp.user_id = $1
       ORDER BY usp.preference_rank NULLS LAST, s.display_order`,
      [userId]
    );
    return result.rows;
  }

  static async createSubteam(name: string, description?: string, isPrimary = true, displayOrder = 0): Promise<Subteam> {
    const result = await pool.query(
      `INSERT INTO subteams (name, description, is_primary, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, isPrimary, displayOrder]
    );
    return result.rows[0];
  }

  static async updateSubteam(id: number, updates: Partial<Subteam>): Promise<Subteam> {
    const fields = Object.keys(updates).filter(key => updates[key as keyof Subteam] !== undefined);
    const values = fields.map(field => updates[field as keyof Subteam]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await pool.query(
      `UPDATE subteams SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  static async deleteSubteam(id: number): Promise<void> {
    await pool.query('DELETE FROM subteams WHERE id = $1', [id]);
  }
}