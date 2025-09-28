import * as cron from 'node-cron';
import tbaService from './tbaService';
import { EventModel } from '../models/Event';

class EventScheduler {
  private eventCheckJob: cron.ScheduledTask | null = null;
  private matchUpdateJob: cron.ScheduledTask | null = null;
  private cacheCleanupJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.setupScheduledTasks();
  }

  private setupScheduledTasks() {
    // Check for active events every hour (0 minute of every hour)
    this.eventCheckJob = cron.schedule('0 * * * *', async () => {
      await this.checkForActiveEvents();
    });
    this.eventCheckJob.stop();

    // Update match data every 5 minutes when events are active
    this.matchUpdateJob = cron.schedule('*/5 * * * *', async () => {
      await this.updateEventData();
    });
    this.matchUpdateJob.stop();

    // Clean up expired cache every day at 2 AM
    this.cacheCleanupJob = cron.schedule('0 2 * * *', async () => {
      await this.cleanupExpiredCache();
    });
    this.cacheCleanupJob.stop();

    console.log('📅 Event scheduler tasks configured');
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Event scheduler is already running');
      return;
    }

    try {
      // Check if event system is enabled
      const enableConfig = await EventModel.getConfig('enable_event_display');
      if (enableConfig?.value !== 'true') {
        console.log('📅 Event system is disabled, scheduler not started');
        return;
      }

      // Check if we have necessary configuration
      const apiKeyConfig = await EventModel.getConfig('tba_api_key');
      if (!apiKeyConfig?.value) {
        console.log('⚠️  No TBA API key configured, scheduler not started');
        return;
      }

      // Start scheduled tasks
      this.eventCheckJob?.start();
      this.matchUpdateJob?.start();
      this.cacheCleanupJob?.start();

      this.isRunning = true;
      console.log('🚀 Event scheduler started successfully');

      // Run initial check for active events
      await this.checkForActiveEvents();
    } catch (error) {
      console.error('❌ Failed to start event scheduler:', error);
    }
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.eventCheckJob?.stop();
    this.matchUpdateJob?.stop();
    this.cacheCleanupJob?.stop();

    this.isRunning = false;
    console.log('🛑 Event scheduler stopped');
  }

  private async checkForActiveEvents() {
    try {
      console.log('🔍 Checking for active events...');
      const hasActiveEvent = await tbaService.checkForActiveEvents();
      
      if (hasActiveEvent) {
        console.log('📅 Active event found, updating event data...');
        await this.updateEventData();
      } else {
        console.log('📅 No active events found');
      }
    } catch (error) {
      console.error('❌ Error checking for active events:', error);
    }
  }

  private async updateEventData() {
    try {
      const activeEvent = await EventModel.getActiveEvent();
      if (!activeEvent) {
        console.log('📅 No active event, skipping data update');
        return;
      }

      console.log(`🔄 Updating data for active event: ${activeEvent.name}`);
      
      // Update team status and match data in parallel
      await Promise.all([
        tbaService.updateTeamEventStatus(),
        tbaService.updateEventMatches()
      ]);

      console.log('✅ Event data update completed');
    } catch (error) {
      console.error('❌ Error updating event data:', error);
    }
  }

  private async cleanupExpiredCache() {
    try {
      console.log('🧹 Cleaning up expired cache...');
      await EventModel.cleanupExpiredCache();
      console.log('✅ Cache cleanup completed');
    } catch (error) {
      console.error('❌ Error during cache cleanup:', error);
    }
  }

  // Force update methods for manual triggering
  async forceEventCheck() {
    console.log('🔄 Manual event check triggered...');
    await this.checkForActiveEvents();
  }

  async forceDataUpdate() {
    console.log('🔄 Manual data update triggered...');
    await this.updateEventData();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      eventCheckRunning: this.eventCheckJob !== null,
      matchUpdateRunning: this.matchUpdateJob !== null,
      cacheCleanupRunning: this.cacheCleanupJob !== null
    };
  }

  // Restart scheduler (useful for config changes)
  async restart() {
    console.log('🔄 Restarting event scheduler...');
    this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await this.start();
  }
}

// Create and export singleton instance
export const eventScheduler = new EventScheduler();
export default eventScheduler;