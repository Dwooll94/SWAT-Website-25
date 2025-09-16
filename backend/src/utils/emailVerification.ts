import { randomBytes } from 'crypto';
import pool from '../config/database';

export interface EmailVerificationToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export class EmailVerificationService {
  static generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  static async createVerificationToken(userId: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    const result = await pool.query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING token',
      [userId, token, expiresAt]
    );

    return result.rows[0].token;
  }

  static async getTokenDetails(token: string): Promise<EmailVerificationToken | null> {
    const result = await pool.query(
      'SELECT * FROM email_verification_tokens WHERE token = $1',
      [token]
    );

    return result.rows[0] || null;
  }

  static async verifyToken(token: string): Promise<{ isValid: boolean; userId?: string; reason?: string }> {
    const tokenDetails = await this.getTokenDetails(token);

    if (!tokenDetails) {
      return { isValid: false, reason: 'Token not found' };
    }

    if (new Date() > tokenDetails.expires_at) {
      await this.deleteToken(token);
      return { isValid: false, reason: 'Token expired' };
    }

    return { isValid: true, userId: tokenDetails.user_id };
  }

  static async deleteToken(token: string): Promise<void> {
    await pool.query('DELETE FROM email_verification_tokens WHERE token = $1', [token]);
  }

  static async deleteUserTokens(userId: string): Promise<void> {
    await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
  }

  static async markEmailAsVerified(userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Mark email as verified
      await client.query(
        'UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
      
      // Delete all verification tokens for this user
      await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async resendVerificationToken(userId: string): Promise<string> {
    // Delete existing tokens for this user
    await this.deleteUserTokens(userId);
    
    // Create new token
    return await this.createVerificationToken(userId);
  }

  static async cleanupExpiredTokens(): Promise<void> {
    await pool.query('DELETE FROM email_verification_tokens WHERE expires_at < NOW()');
  }
}