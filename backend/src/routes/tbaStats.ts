import { Router } from 'express';
import {
  getRegionalWinCount,
  getEventWinCount,
  getAwardCount,
  getEventsEntered,
  getMostRecentEventWin,
  getMostRecentEventResults,
  getMostRecentAward,
  getAwardsByType
} from '../controllers/tbaStatsController';

const router = Router();

// All routes are public and support optional ?team=XXXX query parameter
router.get('/regional-wins', getRegionalWinCount);
router.get('/event-wins', getEventWinCount);
router.get('/awards', getAwardCount);
router.get('/events-entered', getEventsEntered);
router.get('/most-recent-win', getMostRecentEventWin);
router.get('/most-recent-results', getMostRecentEventResults);
router.get('/most-recent-award', getMostRecentAward);
router.get('/awards-by-type', getAwardsByType);

export default router;
