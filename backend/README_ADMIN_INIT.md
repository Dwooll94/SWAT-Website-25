# Admin Initialization System

The backend automatically detects if there are no admin accounts in the system and creates a default admin account on startup.

## How It Works

1. **Startup Check**: On every server startup, the system checks if any admin users exist in the database
2. **Admin Creation**: If no admin users are found, it creates a default admin account
3. **Password Generation**: A secure temporary password is automatically generated
4. **Email Notification**: The temporary password is sent via email to the configured admin address
5. **Logging**: All initialization activities are logged to the `system_logs` table

## Configuration

### Required Environment Variables

```env
# Admin email address for the default admin account
DEFAULT_ADMIN_EMAIL=admin@smithville.k12.mo.us

# Email configuration (all required for email functionality)
# Gmail SMTP Configuration with TLS support
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password_here
EMAIL_FROM=SWAT Team 1806 <noreply@team1806.com>

# Frontend URL (used in email links)
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup Instructions

For Google Gmail SMTP, you must:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this App Password as `EMAIL_PASS` (not your regular Gmail password)
3. **TLS Support**: The system automatically uses TLS encryption for secure email transmission

### Optional Configuration

- If `DEFAULT_ADMIN_EMAIL` is not set, it defaults to `admin@smithville.k12.mo.us`
- If email configuration is missing, the temporary password will be displayed in the console logs

## Admin Account Creation Process

### New Admin Account
If no user exists with the admin email:
1. Creates a new user record with admin role
2. Sets `role = 'admin'`
3. Sets `maintenance_access = true`
4. Sets `registration_status = 'approved'`
5. Sets `email_verified = true`

### Existing User Upgrade
If a user already exists with the admin email:
1. Updates their role to 'admin'
2. Grants maintenance access
3. Preserves existing user data

## Security Features

- **Secure Password Generation**: Uses cryptographically secure random bytes
- **Password Complexity**: 16-character passwords with mixed case, numbers, and special characters
- **Password Hashing**: Passwords are hashed with bcrypt (12 rounds)
- **Logging**: All initialization events are logged for audit purposes

## Email Template

The initialization email includes:
- S.W.A.T. Team branding
- Login credentials (email and temporary password)
- Security warning about changing the password
- Direct link to the admin login page
- Professional HTML formatting

## Troubleshooting

### Email Not Sent
If email configuration is missing or incorrect:
- The temporary password will be displayed in console logs
- Look for warning messages starting with "⚠️"
- Check that all EMAIL_* environment variables are set correctly

### Console Output Examples

**Successful initialization with email:**
```
✅ Admin initialization email sent successfully!
```

**Initialization without email service:**
```
⚠️  Email service not configured. Admin temporary password:
📧 Email: admin@smithville.k12.mo.us
🔑 Password: Ax9$mK2pL7qR3nW8
⚠️  Please save this password securely and change it after first login!
```

### Database Logging

All initialization events are logged to the `system_logs` table:
```sql
SELECT * FROM system_logs WHERE event_type LIKE 'admin_%' ORDER BY created_at DESC;
```

## Security Best Practices

1. **Change Default Password**: Always change the temporary password immediately after first login
2. **Secure Email**: Use a secure email service with app-specific passwords
3. **Environment Variables**: Never commit actual credentials to version control
4. **Monitor Logs**: Regularly check system logs for initialization events
5. **Backup Admin Access**: Consider creating multiple admin accounts for redundancy

## Manual Admin Creation

If you need to manually create an admin account:

```sql
-- Create admin user
INSERT INTO users (
    email, password_hash, first_name, last_name, role, 
    registration_status, maintenance_access, email_verified
) VALUES (
    'admin@example.com', 
    '$2b$12$hash_here', 
    'Admin', 'User', 'admin', 
    'approved', true, true
);
```

## System Requirements

- PostgreSQL database with the users table
- Node.js with nodemailer support
- SMTP email service (optional but recommended)
- Proper environment variable configuration