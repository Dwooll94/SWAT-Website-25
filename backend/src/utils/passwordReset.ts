import { randomBytes } from 'crypto';
import pool from '../config/database';

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export class PasswordResetService {
  static generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  static async createResetToken(userId: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    const result = await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING token',
      [userId, token, expiresAt]
    );

    return result.rows[0].token;
  }

  static async getTokenDetails(token: string): Promise<PasswordResetToken | null> {
    const result = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1',
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
    await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
  }

  static async deleteUserTokens(userId: string): Promise<void> {
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
  }

  static async resendResetToken(userId: string): Promise<string> {
    // Delete existing tokens for this user
    await this.deleteUserTokens(userId);

    // Create new token
    return await this.createResetToken(userId);
  }

  static async cleanupExpiredTokens(): Promise<void> {
    await pool.query('DELETE FROM password_reset_tokens WHERE expires_at < NOW()');
  }
}
