# Password Reset Feature Implementation

This document describes the password reset functionality that has been added to the SWAT Team 1806 website.

## Overview

Users can now reset their password by requesting a password reset link via email. The link expires after 1 hour for security reasons.

## Features Implemented

### Backend

1. **Database Schema**
   - New table: `password_reset_tokens`
   - Fields: `id`, `user_id`, `token`, `expires_at`, `created_at`
   - Indexes on `token` and `user_id` for performance
   - Location: [database/schema.sql](database/schema.sql:109-116)

2. **Password Reset Service**
   - File: [backend/src/utils/passwordReset.ts](backend/src/utils/passwordReset.ts)
   - Cryptographically secure token generation (32 bytes)
   - 1-hour token expiration
   - Token verification and cleanup methods

3. **Email Service Integration**
   - Added `sendPasswordResetEmail` method
   - Professional HTML email template with team branding
   - Location: [backend/src/services/emailService.ts](backend/src/services/emailService.ts:398-483)

4. **API Endpoints**
   - `POST /api/auth/request-password-reset` - Request password reset
   - `POST /api/auth/reset-password/:token` - Reset password with token
   - Location: [backend/src/controllers/authController.ts](backend/src/controllers/authController.ts:856-949)

5. **Security Features**
   - Email enumeration prevention (always returns success message)
   - Token expires after 1 hour
   - One-time use tokens (deleted after successful reset)
   - Password strength validation (minimum 8 characters)
   - All tokens for user are deleted after successful reset

### Frontend

1. **Forgot Password Page**
   - Route: `/forgot-password`
   - Clean, user-friendly interface
   - Success message after email sent
   - Location: [frontend/src/pages/ForgotPassword.tsx](frontend/src/pages/ForgotPassword.tsx)

2. **Reset Password Page**
   - Route: `/reset-password/:token`
   - Password confirmation field
   - Client-side password validation
   - Auto-redirect to login after success
   - Location: [frontend/src/pages/ResetPassword.tsx](frontend/src/pages/ResetPassword.tsx)

3. **Login Page Update**
   - Added "Forgot password?" link next to password field
   - Location: [frontend/src/pages/Login.tsx](frontend/src/pages/Login.tsx:94-99)

## User Flow

1. User clicks "Forgot password?" on login page
2. User enters email address on forgot password page
3. System sends password reset email (if account exists)
4. User receives email with reset link
5. User clicks link in email (valid for 1 hour)
6. User enters and confirms new password
7. System resets password and redirects to login
8. User logs in with new password

## Email Template

The password reset email includes:
- Team branding (SWAT Team 1806 colors and logo)
- Clear instructions
- Prominent "Reset My Password" button
- Link expiration notice (1 hour)
- Security notice about ignoring unsolicited emails
- Fallback plain text link

## Security Considerations

### Implemented
- ✅ Cryptographically secure random tokens (32 bytes)
- ✅ Short token expiration (1 hour)
- ✅ One-time use tokens
- ✅ Email enumeration prevention
- ✅ Password strength validation
- ✅ Inactive user check
- ✅ Token cleanup after use
- ✅ HTTPS recommended for production

### Recommendations
- Consider adding rate limiting per email address
- Monitor password reset attempts for abuse
- Add logging for security audits
- Consider implementing CAPTCHA for reset requests

## Testing the Feature

### Manual Testing Steps

1. **Request Password Reset**
   ```bash
   curl -X POST http://localhost:3001/api/auth/request-password-reset \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com"}'
   ```

2. **Check Email**
   - Verify email is received
   - Check token in link is properly formatted
   - Confirm email template displays correctly

3. **Reset Password**
   ```bash
   curl -X POST http://localhost:3001/api/auth/reset-password/{token} \
     -H "Content-Type: application/json" \
     -d '{"newPassword": "newSecurePassword123"}'
   ```

4. **Test Login**
   - Attempt login with old password (should fail)
   - Attempt login with new password (should succeed)

### Edge Cases to Test
- Non-existent email addresses
- Expired tokens
- Already used tokens
- Invalid tokens
- Password too short
- Inactive user accounts
- Multiple reset requests

## Files Modified/Created

### Backend
- ✅ `database/schema.sql` - Added password_reset_tokens table
- ✅ `backend/src/utils/passwordReset.ts` - New service
- ✅ `backend/src/services/emailService.ts` - Added email method
- ✅ `backend/src/controllers/authController.ts` - Added endpoints
- ✅ `backend/src/routes/auth.ts` - Added routes

### Frontend
- ✅ `frontend/src/pages/ForgotPassword.tsx` - New page
- ✅ `frontend/src/pages/ResetPassword.tsx` - New page
- ✅ `frontend/src/pages/Login.tsx` - Added link
- ✅ `frontend/src/App.tsx` - Added routes

### Database
- ✅ Created `password_reset_tokens` table
- ✅ Created indexes for performance

## Environment Variables

No new environment variables required. Uses existing email configuration:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=robotics@smithville.k12.mo.us
EMAIL_PASS=<app_password>
EMAIL_FROM=S.W.A.T. Team 1806 <robotics@smithville.k12.mo.us>
FRONTEND_URL=http://192.168.1.175:3000
```

## Maintenance Tasks

### Periodic Cleanup
The system includes a cleanup method for expired tokens:

```typescript
await PasswordResetService.cleanupExpiredTokens();
```

Consider running this:
- Via cron job (daily or weekly)
- On application startup
- Before creating new tokens

### Monitoring
Monitor the following:
- Number of reset requests per day
- Failed reset attempts
- Token expiration rates
- Email delivery failures

## Future Enhancements

Potential improvements to consider:
1. Rate limiting per IP/email address
2. Two-factor authentication option
3. Password history (prevent reuse)
4. Account lockout after multiple failed attempts
5. Admin notification for suspicious activity
6. SMS-based password reset option
7. Security questions as additional verification

## Support

If users have issues with password reset:
1. Check spam/junk folders for reset email
2. Verify email address is correct
3. Request new reset link if expired
4. Contact admin if account is inactive
5. Check email service configuration

---

**Implementation Date:** 2025-11-24
**Implemented By:** Claude Code
**Pattern Based On:** Email verification system
