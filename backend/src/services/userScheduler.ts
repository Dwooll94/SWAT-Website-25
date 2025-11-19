import * as cron from 'node-cron';
import { UserModel } from '../models/User';

class UserScheduler {
  private registrationResetJob: cron.ScheduledTask | null = null;
  private userDeactivationJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.setupScheduledTasks();
  }

  private setupScheduledTasks() {
    // Reset registrations and increment YOT on August 1st at 3 AM
    // Cron format: '0 3 1 8 *' = minute hour day month dayOfWeek
    this.registrationResetJob = cron.schedule('0 3 1 8 *', async () => {
      await this.resetRegistrationsAndIncrementYOT();
    });
    this.registrationResetJob.stop();

    // Deactivate expired users daily at 4 AM
    this.userDeactivationJob = cron.schedule('0 4 * * *', async () => {
      await this.deactivateExpiredUsers();
    });
    this.userDeactivationJob.stop();

    console.log('👥 User scheduler tasks configured');
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  User scheduler is already running');
      return;
    }

    try {
      // Start scheduled tasks
      this.registrationResetJob?.start();
      this.userDeactivationJob?.start();

      this.isRunning = true;
      console.log('🚀 User scheduler started successfully');
    } catch (error) {
      console.error('❌ Failed to start user scheduler:', error);
    }
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.registrationResetJob?.stop();
    this.userDeactivationJob?.stop();

    this.isRunning = false;
    console.log('🛑 User scheduler stopped');
  }

  private async resetRegistrationsAndIncrementYOT() {
    try {
      console.log('🔄 Starting August registration reset and YOT increment...');
      await UserModel.resetAugustRegistrations();
      console.log('✅ August registration reset and YOT increment completed');
    } catch (error) {
      console.error('❌ Error resetting registrations and incrementing YOT:', error);
    }
  }

  private async deactivateExpiredUsers() {
    try {
      console.log('🔍 Checking for expired users to deactivate...');
      await UserModel.deactivateExpiredUsers();
      console.log('✅ Expired user deactivation completed');
    } catch (error) {
      console.error('❌ Error deactivating expired users:', error);
    }
  }

  // Force methods for manual triggering
  async forceRegistrationReset() {
    console.log('🔄 Manual registration reset and YOT increment triggered...');
    await this.resetRegistrationsAndIncrementYOT();
  }

  async forceUserDeactivation() {
    console.log('🔄 Manual user deactivation triggered...');
    await this.deactivateExpiredUsers();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      registrationResetScheduled: this.registrationResetJob !== null,
      userDeactivationScheduled: this.userDeactivationJob !== null
    };
  }

  // Restart scheduler
  async restart() {
    console.log('🔄 Restarting user scheduler...');
    this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await this.start();
  }
}

// Create and export singleton instance
export const userScheduler = new UserScheduler();
export default userScheduler;
