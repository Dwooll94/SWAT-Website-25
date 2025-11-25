import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  requireTLS?: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

interface EmailError extends Error {
  code?: string;
  response?: string;
  responseCode?: number;
  command?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;
  private lastEmailSentAt: number = 0;
  private readonly EMAIL_DELAY_MS = 1000; // 1 second delay between emails

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Check if email configuration is available
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Email configuration not found. Email functionality will be disabled.');
        return;
      }

      const emailConfig: EmailConfig = {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        requireTLS: true, // Force TLS encryption for Gmail
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          // Reject unauthorized certificates in production only
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      };

      this.transporter = nodemailer.createTransport(emailConfig);
      this.initialized = true;

      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isTransientError(error: EmailError): boolean {
    // Check for specific transient error codes
    const transientCodes = ['EENVELOPE', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED'];
    if (error.code && transientCodes.includes(error.code)) {
      return true;
    }

    // Check for transient SMTP response codes
    // 421 = Service not available (temporary)
    // 450 = Requested action not taken (mailbox busy)
    // 451 = Requested action aborted (local error)
    // 452 = Requested action not taken (insufficient storage)
    const transientResponseCodes = [421, 450, 451, 452];
    if (error.responseCode && transientResponseCodes.includes(error.responseCode)) {
      return true;
    }

    return false;
  }

  private async throttleEmail(): Promise<void> {
    const now = Date.now();
    const timeSinceLastEmail = now - this.lastEmailSentAt;

    if (timeSinceLastEmail < this.EMAIL_DELAY_MS) {
      const delayNeeded = this.EMAIL_DELAY_MS - timeSinceLastEmail;
      await this.sleep(delayNeeded);
    }

    this.lastEmailSentAt = Date.now();
  }

  async sendEmail(to: string, subject: string, text: string, html?: string, retryCount: number = 0): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      console.error('Email service not initialized or configured');
      return false;
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 10 * 60 * 1000; // 10 minutes

    try {
      // Throttle emails to avoid rate limiting
      await this.throttleEmail();

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      const emailError = error as EmailError;
      console.error('Failed to send email:', {
        to,
        subject,
        error: emailError.message,
        code: emailError.code,
        responseCode: emailError.responseCode,
        response: emailError.response
      });

      // Check if this is a transient error and we haven't exceeded retry limit
      if (this.isTransientError(emailError) && retryCount < MAX_RETRIES) {
        const waitTime = RETRY_DELAY_MS;
        console.log(`Transient error detected. Waiting ${waitTime / 1000 / 60} minutes before retry ${retryCount + 1}/${MAX_RETRIES}...`);

        await this.sleep(waitTime);

        console.log(`Retrying email to ${to} (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        return this.sendEmail(to, subject, text, html, retryCount + 1);
      }

      return false;
    }
  }

  async sendAdminInitializationEmail(adminEmail: string, temporaryPassword: string): Promise<boolean> {
    const subject = 'S.W.A.T. Team 1806 - Admin Account Initialization';
    
    const text = `
Hello,

Your S.W.A.T. Team 1806 website admin account has been initialized.

Login Details:
Email: ${adminEmail}
Temporary Password: ${temporaryPassword}

IMPORTANT: Please log in immediately and change your password for security reasons.

You can access the admin panel at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Best regards,
S.W.A.T. Team 1806 Website System
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #000000; color: #FFFFFF; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .credentials { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #005728; margin: 20px 0; }
        .warning { background-color: #fff3cd; padding: 10px; border: 1px solid #ffeaa7; border-radius: 4px; margin: 20px 0; }
        .footer { background-color: #005728; color: #FFFFFF; padding: 15px; text-align: center; margin-top: 30px; }
        .logo { font-family: Impact, sans-serif; font-size: 24px; letter-spacing: 1px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">S.W.A.T. TEAM 1806</div>
        <p>Admin Account Initialization</p>
    </div>
    
    <div class="content">
        <h2>Welcome, Administrator!</h2>
        
        <p>Your S.W.A.T. Team 1806 website admin account has been successfully initialized.</p>
        
        <div class="credentials">
            <h3>Login Credentials</h3>
            <p><strong>Email:</strong> ${adminEmail}</p>
            <p><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></p>
        </div>
        
        <div class="warning">
            <p><strong>⚠️ SECURITY NOTICE:</strong> This is a temporary password. Please log in immediately and change your password for security reasons.</p>
        </div>
        
        <p>You can access the admin panel by clicking the link below:</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background-color: #005728; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Login to Admin Panel</a></p>
        
        <p>If you have any questions or need assistance, please contact the technical team.</p>
    </div>
    
    <div class="footer">
        <p>&copy; 2025 S.W.A.T. Team 1806 - Smithville Warriors Advancing Technology</p>
    </div>
</body>
</html>
    `;

    return await this.sendEmail(adminEmail, subject, text, html);
  }

  async sendMentorInvitationEmail(mentorEmail: string, mentorName: string, temporaryPassword: string, inviterName: string): Promise<boolean> {
    const subject = 'S.W.A.T. Team 1806 - Mentor Invitation';
    
    const text = `
Hello ${mentorName || 'there'},

You have been invited to join S.W.A.T. Team 1806 as a mentor by ${inviterName}.

Login Details:
Email: ${mentorEmail}
Temporary Password: ${temporaryPassword}

IMPORTANT: Please log in immediately and change your password for security reasons.

You can access the mentor dashboard at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Welcome to the team!

Best regards,
S.W.A.T. Team 1806
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #000000; color: #FFFFFF; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .credentials { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #005728; margin: 20px 0; }
        .warning { background-color: #fff3cd; padding: 10px; border: 1px solid #ffeaa7; border-radius: 4px; margin: 20px 0; }
        .footer { background-color: #005728; color: #FFFFFF; padding: 15px; text-align: center; margin-top: 30px; }
        .logo { font-family: Impact, sans-serif; font-size: 24px; letter-spacing: 1px; }
        .welcome { background-color: #e8f5e8; padding: 15px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">S.W.A.T. TEAM 1806</div>
        <p>Mentor Invitation</p>
    </div>
    
    <div class="content">
        <h2>Welcome to S.W.A.T. Team 1806!</h2>
        
        <p>Hello ${mentorName || 'there'},</p>
        
        <div class="welcome">
            <p><strong>🎉 Congratulations!</strong> You have been invited to join S.W.A.T. Team 1806 as a mentor by <strong>${inviterName}</strong>.</p>
        </div>
        
        <p>As a mentor, you'll help guide and inspire the next generation of robotics enthusiasts while contributing to our team's success in FIRST Robotics Competition.</p>
        
        <div class="credentials">
            <h3>Login Credentials</h3>
            <p><strong>Email:</strong> ${mentorEmail}</p>
            <p><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></p>
        </div>
        
        <div class="warning">
            <p><strong>⚠️ SECURITY NOTICE:</strong> This is a temporary password. Please log in immediately and change your password for security reasons.</p>
        </div>
        
        <p>You can access your mentor dashboard by clicking the link below:</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background-color: #005728; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Login to Mentor Dashboard</a></p>
        
        <p>We're excited to have you on the team and look forward to working with you!</p>
        
        <p>If you have any questions or need assistance, please don't hesitate to reach out to the team leadership.</p>
    </div>
    
    <div class="footer">
        <p>&copy; 2025 S.W.A.T. Team 1806 - Smithville Warriors Advancing Technology</p>
    </div>
</body>
</html>
    `;

    return await this.sendEmail(mentorEmail, subject, text, html);
  }

  async sendEmailVerification(userEmail: string, userName: string, verificationToken: string): Promise<boolean> {
    const subject = 'S.W.A.T. Team 1806 - Verify Your Email Address';
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

    const text = `
Hello ${userName || 'there'},

Thank you for registering with S.W.A.T. Team 1806!

To complete your registration and access your account, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with us, you can safely ignore this email.

Best regards,
S.W.A.T. Team 1806
Smithville Warriors Advancing Technology
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #000000; color: #FFFFFF; padding: 20px; text-align: center; }
        .content { padding: 20px; max-width: 600px; margin: 0 auto; }
        .verification-box { background-color: #f0f8f0; padding: 20px; border-left: 4px solid #005728; margin: 20px 0; text-align: center; }
        .verify-button {
            display: inline-block;
            background-color: #005728;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
            font-weight: bold;
        }
        .verify-button:hover { background-color: #004520; }
        .warning { background-color: #fff3cd; padding: 10px; border: 1px solid #ffeaa7; border-radius: 4px; margin: 20px 0; }
        .footer { background-color: #005728; color: #FFFFFF; padding: 15px; text-align: center; margin-top: 30px; }
        .logo { font-family: Impact, sans-serif; font-size: 24px; letter-spacing: 1px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">S.W.A.T. TEAM 1806</div>
        <p>Email Verification Required</p>
    </div>

    <div class="content">
        <h2>Welcome to S.W.A.T. Team 1806!</h2>

        <p>Hello ${userName || 'there'},</p>

        <p>Thank you for registering with S.W.A.T. Team 1806! We're excited to have you join our robotics team community.</p>

        <div class="verification-box">
            <h3>📧 Email Verification Required</h3>
            <p>To complete your registration and access your account, please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="verify-button">Verify My Email Address</a>
            <p><small>This verification link will expire in 24 hours.</small></p>
        </div>

        <p>Once your email is verified, you'll be able to:</p>
        <ul>
            <li>Access your team dashboard</li>
            <li>Update your profile information</li>
            <li>Participate in team communications</li>
            <li>Track your progress through the registration process</li>
        </ul>

        <div class="warning">
            <p><strong>🛡️ Security Note:</strong> If you didn't create an account with S.W.A.T. Team 1806, you can safely ignore this email.</p>
        </div>

        <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
        <p><code>${verificationUrl}</code></p>
    </div>

    <div class="footer">
        <p>&copy; 2025 S.W.A.T. Team 1806 - Smithville Warriors Advancing Technology</p>
    </div>
</body>
</html>
    `;

    return await this.sendEmail(userEmail, subject, text, html);
  }

  async sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string): Promise<boolean> {
    const subject = 'S.W.A.T. Team 1806 - Password Reset Request';
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const text = `
Hello ${userName || 'there'},

We received a request to reset the password for your S.W.A.T. Team 1806 account.

To reset your password, please click the link below:

${resetUrl}

This password reset link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
S.W.A.T. Team 1806
Smithville Warriors Advancing Technology
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #000000; color: #FFFFFF; padding: 20px; text-align: center; }
        .content { padding: 20px; max-width: 600px; margin: 0 auto; }
        .reset-box { background-color: #f0f8f0; padding: 20px; border-left: 4px solid #005728; margin: 20px 0; text-align: center; }
        .reset-button {
            display: inline-block;
            background-color: #005728;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
            font-weight: bold;
        }
        .reset-button:hover { background-color: #004520; }
        .warning { background-color: #fff3cd; padding: 10px; border: 1px solid #ffeaa7; border-radius: 4px; margin: 20px 0; }
        .footer { background-color: #005728; color: #FFFFFF; padding: 15px; text-align: center; margin-top: 30px; }
        .logo { font-family: Impact, sans-serif; font-size: 24px; letter-spacing: 1px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">S.W.A.T. TEAM 1806</div>
        <p>Password Reset Request</p>
    </div>

    <div class="content">
        <h2>Reset Your Password</h2>

        <p>Hello ${userName || 'there'},</p>

        <p>We received a request to reset the password for your S.W.A.T. Team 1806 account.</p>

        <div class="reset-box">
            <h3>🔒 Password Reset</h3>
            <p>To reset your password, please click the button below:</p>
            <a href="${resetUrl}" class="reset-button">Reset My Password</a>
            <p><small>This password reset link will expire in 1 hour.</small></p>
        </div>

        <div class="warning">
            <p><strong>🛡️ Security Note:</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>

        <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
        <p><code>${resetUrl}</code></p>

        <p>For security reasons, this link will expire in 1 hour. If you need to reset your password after that time, you'll need to request a new password reset link.</p>
    </div>

    <div class="footer">
        <p>&copy; 2025 S.W.A.T. Team 1806 - Smithville Warriors Advancing Technology</p>
    </div>
</body>
</html>
    `;

    return await this.sendEmail(userEmail, subject, text, html);
  }

  async sendMassEmail({ 
    to, 
    recipientName, 
    subject, 
    message, 
    senderName, 
    senderRole, 
    senderEmail 
  }: {
    to: string;
    recipientName: string;
    subject: string;
    message: string;
    senderName: string;
    senderRole: string;
    senderEmail: string;
  }): Promise<boolean> {
    if (!this.initialized) {
      console.error('Email service not initialized');
      return false;
    }

    const text = `Hello ${recipientName},

${message}

---
This message was sent by ${senderName} (${senderRole}) via the S.W.A.T. Team 1806 website.

Best regards,
S.W.A.T. Team 1806
Smithville Warriors Advancing Technology

If you have any questions, please contact ${senderEmail}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #000000; color: #FFFFFF; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .message { background-color: #f9f9f9; padding: 20px; border-left: 4px solid #005728; margin: 20px 0; }
        .sender-info { background-color: #e8f5e8; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { background-color: #005728; color: #FFFFFF; padding: 15px; text-align: center; margin-top: 30px; }
        .logo { font-family: Impact, sans-serif; font-size: 24px; letter-spacing: 1px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">S.W.A.T. TEAM 1806</div>
        <p>Team Communication</p>
    </div>
    
    <div class="content">
        <h2>Hello ${recipientName},</h2>
        
        <div class="message">
            <p style="white-space: pre-wrap;">${message}</p>
        </div>
        
        <div class="sender-info">
            <p><strong>Message sent by:</strong> ${senderName} (${senderRole})</p>
            <p><strong>Contact email:</strong> ${senderEmail}</p>
        </div>
        
        <p>If you have any questions about this message, please contact ${senderEmail} directly.</p>
    </div>
    
    <div class="footer">
        <p>&copy; 2025 S.W.A.T. Team 1806 - Smithville Warriors Advancing Technology</p>
    </div>
</body>
</html>
    `;

    return await this.sendEmail(to, subject, text, html);
  }

  isConfigured(): boolean {
    return this.initialized;
  }
}

export const emailService = new EmailService();