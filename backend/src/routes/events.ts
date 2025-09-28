import { Router } from 'express';
import { body } from 'express-validator';
import {
  getEventSummary,
  getMatchSchedule,
  checkActiveEvents,
  updateTeamStatus,
  updateEventMatches,
  getEventConfig,
  updateEventConfig,
  handleTBAWebhook,
  getWebhookLogs,
  cleanupCache,
  getEventSystemStatus
} from '../controllers/eventController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Event configuration validation
const configValidation = [
  body('key')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Configuration key must be between 1 and 100 characters'),
  body('value')
    .optional()
    .isString()
    .withMessage('Configuration value must be a string'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less')
];

// Public routes (no authentication required)
router.get('/summary', getEventSummary);
router.get('/matches', getMatchSchedule);
router.get('/status', getEventSystemStatus);

// TBA Webhook endpoint (no auth, but should validate signature)
router.post('/webhook/tba', handleTBAWebhook);

// Protected routes (require authentication)
// Admin/Mentor only routes
router.get('/config', authenticate, getEventConfig);
router.post('/config', authenticate, configValidation, updateEventConfig);
router.post('/check-events', authenticate, checkActiveEvents);
router.post('/update-status', authenticate, updateTeamStatus);
router.post('/update-matches', authenticate, updateEventMatches);
router.get('/webhook-logs', authenticate, getWebhookLogs);
router.post('/cleanup-cache', authenticate, cleanupCache);

export default router;