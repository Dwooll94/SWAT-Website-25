# Email Verification System

This document describes the email verification system implemented for the SWAT Team 1806 website.

## Overview

The email verification system ensures that users must verify their email address before they can access their account. This helps maintain data integrity and prevents spam registrations.

## How It Works

### Registration Flow
1. User completes registration form
2. Account is created with `email_verified = false`
3. Verification email is sent with a unique token
4. User receives success message but cannot log in yet
5. User must click verification link in email
6. Email is marked as verified, user can now log in

### Login Flow
1. User attempts to log in
2. System checks if email is verified
3. If not verified (for students), login is blocked with verification prompt
4. User can request new verification email from login screen

## Database Schema

### New Table: `email_verification_tokens`
```sql
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Updated Table: `users`
- Added `email_verified BOOLEAN DEFAULT false`

## API Endpoints

### POST /auth/register
- Modified to send verification email instead of auto-login
- Returns registration success message

### GET /auth/verify-email/:token
- Verifies email using token
- Marks user as verified
- Deletes verification token

### POST /auth/resend-verification
- Requires authentication
- Generates new verification token
- Sends new verification email

### POST /auth/login
- Modified to check email verification status
- Blocks unverified students from logging in

## Frontend Components

### New Pages
- `/verify-email/:token` - Email verification confirmation page

### New Components
- `EmailVerificationPrompt` - Modal for resending verification email
- Updated `Register` component with success step
- Updated `Login` component with verification handling

## Configuration

### Environment Variables
Make sure your `.env` file includes email service configuration:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@swatteam1806.org
FRONTEND_URL=https://your-domain.com
```

## Migration

To apply the email verification system to an existing database:

1. Run the migration script:
```bash
cd database
./run_migration.sh migrations/001_add_email_verification.sql
```

2. Restart the backend application

## Maintenance

### Token Cleanup
Email verification tokens expire after 24 hours. To clean up expired tokens:

```bash
cd backend
npm run cleanup-tokens
```

Or run the cleanup script directly:
```bash
npx ts-node src/scripts/cleanupExpiredTokens.ts
```

Consider setting up a daily cron job for token cleanup.

## Security Considerations

1. **Token Expiration**: Tokens expire after 24 hours
2. **Secure Token Generation**: Uses cryptographically secure random bytes
3. **Single Use**: Tokens are deleted after successful verification
4. **Database Constraints**: Unique constraint on tokens prevents collisions
5. **Role-Based Verification**: Only students require email verification (mentors/admins are pre-verified)

## Testing

To test the email verification system:

1. Register a new student account
2. Check that no JWT token is returned
3. Verify that login is blocked before email verification
4. Check email for verification link
5. Click verification link and confirm success
6. Attempt login again and verify it succeeds

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check EMAIL_* environment variables
   - Verify SMTP credentials
   - Check firewall/network settings

2. **Verification links not working**
   - Ensure FRONTEND_URL is correct
   - Check token expiration
   - Verify database connection

3. **Users can't log in**
   - Check `email_verified` status in database
   - Verify user role (mentors/admins should be pre-verified)
   - Check for expired tokens

### Database Queries

Check verification status:
```sql
SELECT id, email, email_verified, role FROM users WHERE email = 'user@example.com';
```

Check pending verification tokens:
```sql
SELECT u.email, t.token, t.expires_at 
FROM email_verification_tokens t 
JOIN users u ON t.user_id = u.id;
```

Manually verify a user (emergency use only):
```sql
UPDATE users SET email_verified = true WHERE email = 'user@example.com';
```