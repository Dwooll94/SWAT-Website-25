import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getStudentEmails, getAllEmails, getFoodAllergies } from '../controllers/reportsController';

const router = Router();

// Reports routes - all require authentication
router.get('/student-emails', authenticate, getStudentEmails);
router.get('/all-emails', authenticate, getAllEmails);
router.get('/food-allergies', authenticate, getFoodAllergies);

export default router;
