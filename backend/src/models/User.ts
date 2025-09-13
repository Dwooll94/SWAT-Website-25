import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  school_email?: string;
  password_hash: string;
  role: 'student' | 'mentor' | 'admin';
  registration_status: 'initially_created' | 'contract_signed' | 'complete' | 'inactive';
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
  graduation_year?: number;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  first_name?: string;
  last_name?: string;
  phone?: string;
  food_allergies?: string;
  medical_conditions?: string;
  heard_about_team?: string;
  maintenance_access: boolean;
}

export interface CreateUserData {
  email: string;
  school_email?: string;
  password: string;
  graduation_year?: number;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  first_name?: string;
  last_name?: string;
  phone?: string;
  food_allergies?: string;
  medical_conditions?: string;
  heard_about_team?: string;
  subteam_preferences?: Array<{ subteam_id: number; preference_rank: number; is_interested: boolean }>;
  guardians?: Array<{ name: string; email?: string; phone?: string; relationship?: string }>;
}

export class UserModel {
  static async createUser(userData: CreateUserData): Promise<User> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const userResult = await client.query(
        `INSERT INTO users (
          email, school_email, password_hash, graduation_year, gender,
          first_name, last_name, phone, food_allergies, medical_conditions, heard_about_team
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          userData.email,
          userData.school_email,
          hashedPassword,
          userData.graduation_year,
          userData.gender,
          userData.first_name,
          userData.last_name,
          userData.phone,
          userData.food_allergies,
          userData.medical_conditions,
          userData.heard_about_team
        ]
      );

      const user = userResult.rows[0];

      if (userData.subteam_preferences) {
        for (const pref of userData.subteam_preferences) {
          await client.query(
            `INSERT INTO user_subteam_preferences (user_id, subteam_id, preference_rank, is_interested)
             VALUES ($1, $2, $3, $4)`,
            [user.id, pref.subteam_id, pref.preference_rank, pref.is_interested]
          );
        }
      }

      if (userData.guardians) {
        for (const guardian of userData.guardians) {
          await client.query(
            `INSERT INTO legal_guardians (user_id, name, email, phone, relationship)
             VALUES ($1, $2, $3, $4, $5)`,
            [user.id, guardian.name, guardian.email, guardian.phone, guardian.relationship]
          );
        }
      }

      await client.query('COMMIT');
      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateRegistrationStatus(userId: string, status: string): Promise<void> {
    await pool.query(
      'UPDATE users SET registration_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, userId]
    );
  }

  static async updateLastLogin(userId: string): Promise<void> {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  static async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );
  }

  static async updateContactInfo(userId: string, contactInfo: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    school_email?: string;
    food_allergies?: string;
    medical_conditions?: string;
  }): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query based on provided fields
    Object.entries(contactInfo).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return; // Nothing to update
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
    
    await pool.query(query, values);
  }

  static async updateGuardianInfo(userId: string, guardians: Array<{
    name: string;
    email?: string;
    phone?: string;
    relationship?: string;
  }>): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete existing guardians for this user
      await client.query('DELETE FROM legal_guardians WHERE user_id = $1', [userId]);

      // Insert new guardians
      for (const guardian of guardians) {
        await client.query(
          `INSERT INTO legal_guardians (user_id, name, email, phone, relationship)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, guardian.name, guardian.email || null, guardian.phone || null, guardian.relationship || null]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getGuardians(userId: string): Promise<Array<{
    id: number;
    name: string;
    email?: string;
    phone?: string;
    relationship?: string;
  }>> {
    const result = await pool.query(
      'SELECT id, name, email, phone, relationship FROM legal_guardians WHERE user_id = $1 ORDER BY id',
      [userId]
    );
    return result.rows;
  }

  static async resetAugustRegistrations(): Promise<void> {
    await pool.query(
      `UPDATE users 
       SET registration_status = 'contract_signed', updated_at = CURRENT_TIMESTAMP 
       WHERE registration_status = 'complete' AND is_active = true AND role = 'student'`
    );
  }

  static async deactivateExpiredUsers(): Promise<void> {
    await pool.query(
      `UPDATE users 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP 
       WHERE role = 'student' 
       AND graduation_year IS NOT NULL 
       AND CURRENT_DATE > MAKE_DATE(graduation_year, 8, 1)`
    );
  }

  static async createMentorInvitation(mentorData: {
    email: string;
    first_name?: string;
    last_name?: string;
    temporaryPassword: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(mentorData.temporaryPassword, 12);
    
    const result = await pool.query(
      `INSERT INTO users (
        email, password_hash, role, registration_status, first_name, last_name, maintenance_access
      ) VALUES ($1, $2, 'mentor', 'complete', $3, $4, true)
      RETURNING *`,
      [
        mentorData.email,
        hashedPassword,
        mentorData.first_name,
        mentorData.last_name
      ]
    );

    return result.rows[0];
  }

  static async getAllUsers(searchQuery?: string): Promise<Array<User & {guardian_count: number, guardians: Array<{email?: string, phone?: string}>, is_core_leadership?: boolean}>> {
    let query = `
      SELECT u.*, 
             COALESCE(g.guardian_count, 0) as guardian_count,
             COALESCE(
               json_agg(
                 json_build_object('email', lg.email, 'phone', lg.phone)
                 ORDER BY lg.id
               ) FILTER (WHERE lg.id IS NOT NULL), 
               '[]'::json
             ) as guardians,
             CASE WHEN sa.attribute_value = 'true' THEN true ELSE false END as is_core_leadership
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as guardian_count 
        FROM legal_guardians 
        GROUP BY user_id
      ) g ON u.id = g.user_id
      LEFT JOIN legal_guardians lg ON u.id = lg.user_id
      LEFT JOIN student_attributes sa ON u.id = sa.user_id AND sa.attribute_key = 'isCoreLeadership'
    `;
    
    const params: any[] = [];
    
    if (searchQuery && searchQuery.trim()) {
      query += ` WHERE (
        LOWER(u.first_name) LIKE LOWER($1) OR 
        LOWER(u.last_name) LIKE LOWER($1) OR 
        LOWER(u.email) LIKE LOWER($1) OR
        LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER($1)
      )`;
      params.push(`%${searchQuery.trim()}%`);
    }
    
    query += ` GROUP BY u.id, g.guardian_count, sa.attribute_value ORDER BY u.created_at DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    await pool.query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [isActive, userId]
    );
  }

  static async updateMaintenanceAccess(userId: string, hasAccess: boolean): Promise<void> {
    await pool.query(
      'UPDATE users SET maintenance_access = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hasAccess, userId]
    );
  }

  static async updateUserContactInfoAdmin(userId: string, contactInfo: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    school_email?: string;
    food_allergies?: string;
    medical_conditions?: string;
  }): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query based on provided fields
    Object.entries(contactInfo).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value === '' ? null : value);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return; // Nothing to update
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
    
    await pool.query(query, values);
  }

  static async deleteUser(userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete related records first (foreign key constraints)
      await client.query('DELETE FROM legal_guardians WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_subteam_preferences WHERE user_id = $1', [userId]);
      
      // Delete user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}