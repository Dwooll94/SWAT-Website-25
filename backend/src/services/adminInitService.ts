import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { emailService } from './emailService';

export class AdminInitService {
  private static readonly DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@smithville.k12.mo.us';
  private static readonly TEMP_PASSWORD_LENGTH = 16;

  static generateTemporaryPassword(): string {
    // Generate a secure random password with mixed case, numbers, and special characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    const randomArray = randomBytes(this.TEMP_PASSWORD_LENGTH);
    
    for (let i = 0; i < this.TEMP_PASSWORD_LENGTH; i++) {
      result += chars[randomArray[i] % chars.length];
    }
    
    return result;
  }

  static async checkAndInitializeAdmin(): Promise<void> {
    try {
      console.log('Checking for admin account initialization...');

      // Check if any admin users exist
      const adminCheckResult = await pool.query(
        `SELECT COUNT(*) as count FROM users WHERE role = 'admin'`
      );

      const adminCount = parseInt(adminCheckResult.rows[0].count);
      
      if (adminCount > 0) {
        console.log(`Found ${adminCount} existing admin account(s). No initialization needed.`);
        return;
      }

      console.log('No admin accounts found. Initializing default admin account...');

      // Check if a user with the default admin email already exists
      const existingUserResult = await pool.query(
        'SELECT id, role FROM users WHERE email = $1',
        [this.DEFAULT_ADMIN_EMAIL]
      );

      let userId: string;

      if (existingUserResult.rows.length > 0) {
        // User exists but is not admin - upgrade to admin
        const existingUser = existingUserResult.rows[0];
        userId = existingUser.id;
        
        console.log(`Upgrading existing user ${this.DEFAULT_ADMIN_EMAIL} to admin role...`);
        
        await pool.query(
          `UPDATE users SET 
           role = 'admin', 
           maintenance_access = true, 
           updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [userId]
        );
      } else {
        // Create new admin user
        console.log(`Creating new admin user with email ${this.DEFAULT_ADMIN_EMAIL}...`);
        
        const createUserResult = await pool.query(
          `INSERT INTO users (
            email, 
            password_hash, 
            first_name, 
            last_name, 
            role, 
            registration_status, 
            maintenance_access,
            email_verified,
            created_at, 
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id`,
          [
            this.DEFAULT_ADMIN_EMAIL,
            '', // Will be set below
            'System',
            'Administrator',
            'admin',
            'complete',
            true,
            true
          ]
        );
        
        userId = createUserResult.rows[0].id;
      }

      // Generate temporary password and update user
      const temporaryPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, userId]
      );

      console.log('Admin account initialized successfully.');

      // Send email with temporary password
      if (emailService.isConfigured()) {
        console.log(`Sending initialization email to ${this.DEFAULT_ADMIN_EMAIL}...`);
        
        const emailSent = await emailService.sendAdminInitializationEmail(
          this.DEFAULT_ADMIN_EMAIL,
          temporaryPassword
        );

        if (emailSent) {
          console.log('✅ Admin initialization email sent successfully!');
        } else {
          console.error('❌ Failed to send admin initialization email.');
          console.error('⚠️  TEMPORARY PASSWORD (save this securely):', temporaryPassword);
        }
      } else {
        console.warn('⚠️  Email service not configured. Admin temporary password:');
        console.warn('📧 Email:', this.DEFAULT_ADMIN_EMAIL);
        console.warn('🔑 Password:', temporaryPassword);
        console.warn('⚠️  Please save this password securely and change it after first login!');
      }

      // Log admin creation to database
      await pool.query(
        `INSERT INTO system_logs (event_type, description, metadata, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [
          'admin_initialization',
          'Default admin account initialized',
          JSON.stringify({
            admin_email: this.DEFAULT_ADMIN_EMAIL,
            user_id: userId,
            email_sent: emailService.isConfigured()
          })
        ]
      );

    } catch (error) {
      console.error('Failed to initialize admin account:', error);
      
      // Log error to database if possible
      try {
        await pool.query(
          `INSERT INTO system_logs (event_type, description, metadata, created_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [
            'admin_initialization_error',
            'Failed to initialize admin account',
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
              admin_email: this.DEFAULT_ADMIN_EMAIL
            })
          ]
        );
      } catch (logError) {
        console.error('Failed to log admin initialization error:', logError);
      }
    }
  }

  static async createSystemLogsTable(): Promise<void> {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_logs (
          id SERIAL PRIMARY KEY,
          event_type VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create index for better performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_system_logs_event_type_created_at 
        ON system_logs(event_type, created_at DESC)
      `);
    } catch (error) {
      console.error('Failed to create system_logs table:', error);
    }
  }
}