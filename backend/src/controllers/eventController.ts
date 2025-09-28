import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import tbaService from '../services/tbaService';
import { EventModel } from '../models/Event';

// Get current event summary for homepage display
export const getEventSummary = async (req: Request, res: Response) => {
  try {
    const summary = await tbaService.getEventSummary();
    res.json(summary);
  } catch (error) {
    console.error('Get event summary error:', error);
    res.status(500).json({ message: 'Server error fetching event summary' });
  }
};

// Get match schedule for sidebar display
export const getMatchSchedule = async (req: Request, res: Response) => {
  try {
    const schedule = await tbaService.getMatchSchedule();
    res.json(schedule);
  } catch (error) {
    console.error('Get match schedule error:', error);
    res.status(500).json({ message: 'Server error fetching match schedule' });
  }
};

// Admin only: Check for active events manually
export const checkActiveEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hasActiveEvent = await tbaService.checkForActiveEvents();
    res.json({ 
      hasActiveEvent,
      message: hasActiveEvent ? 'Active events found and updated' : 'No active events found'
    });
  } catch (error) {
    console.error('Check active events error:', error);
    res.status(500).json({ message: 'Server error checking for active events' });
  }
};

// Admin only: Force update team event status
export const updateTeamStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await tbaService.updateTeamEventStatus();
    res.json({ message: 'Team event status updated successfully' });
  } catch (error) {
    console.error('Update team status error:', error);
    res.status(500).json({ message: 'Server error updating team status' });
  }
};

// Admin only: Force update event matches
export const updateEventMatches = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await tbaService.updateEventMatches();
    res.json({ message: 'Event matches updated successfully' });
  } catch (error) {
    console.error('Update event matches error:', error);
    res.status(500).json({ message: 'Server error updating event matches' });
  }
};

// Admin only: Get event configuration
export const getEventConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await EventModel.getAllConfig();
    
    // Don't return sensitive values in API response
    const safeConfig = config.map(item => ({
      ...item,
      value: item.is_encrypted ? '***ENCRYPTED***' : item.value
    }));
    
    res.json(safeConfig);
  } catch (error) {
    console.error('Get event config error:', error);
    res.status(500).json({ message: 'Server error fetching event configuration' });
  }
};

// Admin only: Update event configuration
export const updateEventConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key, value, description } = req.body;
    const userId = req.user!.userId;

    if (!key || value === undefined) {
      return res.status(400).json({ message: 'Key and value are required' });
    }

    // Handle special configuration updates
    if (key === 'tba_api_key' && value) {
      await tbaService.updateApiKey(value, userId);
    } else if (key === 'team_number' && value) {
      await tbaService.updateTeamNumber(value, userId);
    } else {
      await EventModel.setConfig(key, value, description, userId);
    }

    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Update event config error:', error);
    res.status(500).json({ message: 'Server error updating configuration' });
  }
};

// TBA Webhook endpoint (no auth required, but should validate signature)
export const handleTBAWebhook = async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;
    
    // TODO: Validate webhook signature using webhook secret
    // For now, we'll process all webhooks
    
    await tbaService.processWebhook(webhookData);
    
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('TBA webhook error:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
};

// Admin only: Get webhook logs for debugging
export const getWebhookLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const query = `
      SELECT * FROM tba_webhook_logs 
      ORDER BY received_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const pool = require('../utils/database');
    const result = await pool.query(query, [limit, offset]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get webhook logs error:', error);
    res.status(500).json({ message: 'Server error fetching webhook logs' });
  }
};

// Admin only: Clean up expired cache
export const cleanupCache = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await EventModel.cleanupExpiredCache();
    res.json({ message: 'Cache cleanup completed successfully' });
  } catch (error) {
    console.error('Cache cleanup error:', error);
    res.status(500).json({ message: 'Server error during cache cleanup' });
  }
};

// Get event system status
export const getEventSystemStatus = async (req: Request, res: Response) => {
  try {
    const activeEvent = await EventModel.getActiveEvent();
    const enableConfig = await EventModel.getConfig('enable_event_display');
    const teamConfig = await EventModel.getConfig('team_number');
    const apiKeyConfig = await EventModel.getConfig('tba_api_key');
    
    const status = {
      isEnabled: enableConfig?.value === 'true',
      hasActiveEvent: !!activeEvent,
      activeEvent: activeEvent ? {
        name: activeEvent.name,
        event_code: activeEvent.event_code,
        start_date: activeEvent.start_date,
        end_date: activeEvent.end_date
      } : null,
      teamNumber: teamConfig?.value || '1806',
      hasApiKey: !!(apiKeyConfig?.value && apiKeyConfig.value.length > 0),
      lastUpdated: activeEvent?.updated_at
    };
    
    res.json(status);
  } catch (error) {
    console.error('Get event system status error:', error);
    res.status(500).json({ message: 'Server error fetching system status' });
  }
};