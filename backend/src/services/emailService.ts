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

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;

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

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      console.error('Email service not initialized or configured');
      return false;
    }

    try {
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
      console.error('Failed to send email:', error);
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