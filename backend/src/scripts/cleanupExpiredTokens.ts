import { EmailVerificationService } from '../utils/emailVerification';

/**
 * Cleanup script for expired email verification tokens
 * Can be run as a cron job or scheduled task
 */
async function cleanupExpiredTokens() {
  try {
    console.log('Starting cleanup of expired email verification tokens...');
    await EmailVerificationService.cleanupExpiredTokens();
    console.log('Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during token cleanup:', error);
    process.exit(1);
  }
}

cleanupExpiredTokens();