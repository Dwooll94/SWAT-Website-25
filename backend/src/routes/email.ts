import { Router } from 'express';
import { body } from 'express-validator';
import { getEmailRecipients, sendMassEmail } from '../controllers/emailController';
import { authenticate } from '../middleware/auth';

const router = Router();

const sendMassEmailValidation = [
  body('recipient_group').isString().isLength({ min: 1 }).withMessage('Recipient group is required'),
  body('recipients').isArray({ min: 1 }).withMessage('At least one recipient is required'),
  body('recipients.*.email').isEmail().withMessage('Valid email is required for each recipient'),
  body('recipients.*.name').isString().isLength({ min: 1 }).withMessage('Name is required for each recipient'),
  body('subject').isString().isLength({ min: 1, max: 200 }).withMessage('Subject must be 1-200 characters'),
  body('message').isString().isLength({ min: 1, max: 5000 }).withMessage('Message must be 1-5000 characters'),
  body('send_copy_to_sender').optional().isBoolean().withMessage('Send copy to sender must be a boolean')
];

// Get available email recipients
router.get('/recipients', authenticate, getEmailRecipients);

// Send mass email
router.post('/send-mass', authenticate, sendMassEmailValidation, sendMassEmail);

export default router;