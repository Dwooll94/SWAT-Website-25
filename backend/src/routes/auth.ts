import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { register, login, getProfile, updateRegistrationStatus, changePassword, updateContactInfo, updateGuardianInfo, inviteMentor, getAllUsers, updateUserStatus, updateMaintenanceAccess, updateUserContactInfoAdmin, deleteUser, deactivateOwnAccount, updateUserGuardianInfoAdmin, getUserGuardianInfoAdmin, updateCoreLeadership, updateUserRegistrationStatus, updateYearsOnTeam, verifyEmail, resendVerificationEmail, requestPasswordReset, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

const registerValidation = [
  body('email').isEmail().normalizeEmail({gmail_remove_dots: false}),
  body('school_email').optional({checkFalsy: true}).isEmail().normalizeEmail({gmail_remove_dots: false}),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('last_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('graduation_year').optional().isInt({ min: 2020, max: 2040 }),
  body('gender').optional().isIn(['male', 'female', 'non_binary', 'prefer_not_to_say']),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('food_allergies').optional().trim().isLength({ max: 1000 }),
  body('medical_conditions').optional().trim().isLength({ max: 1000 }),
  body('heard_about_team').optional().trim().isLength({ max: 500 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail({gmail_remove_dots: false}),
  body('password').notEmpty().withMessage('Password is required')
];

const statusValidation = [
  body('status').isIn(['initially_created', 'contract_signed', 'complete']).withMessage('Invalid status')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
];

const updateContactInfoValidation = [
  body('first_name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be 1-100 characters'),
  body('last_name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be 1-100 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number must be less than 20 characters'),
  body('school_email').optional({checkFalsy: true}).isEmail().normalizeEmail({gmail_remove_dots: false}).withMessage('Invalid school email'),
  body('food_allergies').optional().trim().isLength({ max: 1000 }).withMessage('Food allergies must be less than 1000 characters'),
  body('medical_conditions').optional().trim().isLength({ max: 1000 }).withMessage('Medical conditions must be less than 1000 characters')
];

const updateGuardianInfoValidation = [
  body('guardians').isArray().withMessage('Guardians must be an array'),
  body('guardians.*.name').trim().isLength({ min: 1, max: 100 }).withMessage('Guardian name must be 1-100 characters'),
  body('guardians.*.email').optional({checkFalsy: true}).isEmail().normalizeEmail({gmail_remove_dots: false}).withMessage('Invalid guardian email'),
  body('guardians.*.phone').optional().trim().isLength({ max: 20 }).withMessage('Guardian phone must be less than 20 characters'),
  body('guardians.*.relationship').optional().trim().isLength({ max: 50 }).withMessage('Relationship must be less than 50 characters')
];

const inviteMentorValidation = [
  body('email').isEmail().normalizeEmail({gmail_remove_dots: false}).withMessage('Valid email is required'),
  body('first_name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be 1-100 characters'),
  body('last_name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be 1-100 characters')
];

const updateUserStatusValidation = [
  body('is_active').isBoolean().withMessage('Status must be a boolean value')
];

const updateMaintenanceAccessValidation = [
  body('maintenance_access').isBoolean().withMessage('Maintenance access must be a boolean value')
];

const updateCoreLeadershipValidation = [
  body('is_core_leadership').isBoolean().withMessage('Core leadership must be a boolean value')
];

const updateYearsOnTeamValidation = [
  body('years_on_team').isInt({ min: 0, max: 20 }).withMessage('Years on team must be a number between 0 and 20')
];

const requestPasswordResetValidation = [
  body('email').isEmail().normalizeEmail({gmail_remove_dots: false}).withMessage('Valid email is required')
];

const resetPasswordValidation = [
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

// Configure multer for contract uploads
const contractStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../private/uploads/contracts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Get user info from authenticated request
    const userId = (req as any).user?.userId;
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `contract-${userId}-${timestamp}-${cleanName}`);
  }
});

const contractUpload = multer({
  storage: contractStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

const updateUserContactInfoAdminValidation = [
  body('first_name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be 1-100 characters'),
  body('last_name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be 1-100 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number must be less than 20 characters'),
  body('school_email').optional({checkFalsy: true}).isEmail().normalizeEmail({gmail_remove_dots: false}).withMessage('Invalid school email'),
  body('food_allergies').optional().trim().isLength({ max: 1000 }).withMessage('Food allergies must be less than 1000 characters'),
  body('medical_conditions').optional().trim().isLength({ max: 1000 }).withMessage('Medical conditions must be less than 1000 characters')
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', authenticate, getProfile);
router.put('/registration-status', authenticate, statusValidation, updateRegistrationStatus);
router.put('/change-password', authenticate, changePasswordValidation, changePassword);
router.put('/contact-info', authenticate, updateContactInfoValidation, updateContactInfo);
router.put('/guardian-info', authenticate, updateGuardianInfoValidation, updateGuardianInfo);
router.post('/invite-mentor', authenticate, inviteMentorValidation, inviteMentor);
router.put('/deactivate-account', authenticate, deactivateOwnAccount);

// Email verification routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Password reset routes
router.post('/request-password-reset', requestPasswordResetValidation, requestPasswordReset);
router.post('/reset-password/:token', resetPasswordValidation, resetPassword);

// Admin user management routes
router.get('/users', authenticate, getAllUsers);
router.put('/users/:userId/status', authenticate, updateUserStatusValidation, updateUserStatus);
router.put('/users/:userId/maintenance-access', authenticate, updateMaintenanceAccessValidation, updateMaintenanceAccess);
router.put('/users/:userId/contact-info', authenticate, updateUserContactInfoAdminValidation, updateUserContactInfoAdmin);
router.get('/users/:userId/guardian-info', authenticate, getUserGuardianInfoAdmin);
router.put('/users/:userId/guardian-info', authenticate, updateGuardianInfoValidation, updateUserGuardianInfoAdmin);
router.put('/users/:userId/core-leadership', authenticate, updateCoreLeadershipValidation, updateCoreLeadership);
router.put('/users/:userId/years-on-team', authenticate, updateYearsOnTeamValidation, updateYearsOnTeam);
router.put('/users/:userId/registration-status', authenticate, statusValidation, updateUserRegistrationStatus);
router.delete('/users/:userId', authenticate, deleteUser);

// Contract upload route
router.post('/upload-contract', authenticate, contractUpload.single('contract'), async (req, res) => {
  try {
    const { user } = req as any;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No contract file uploaded' });
    }

    // Import necessary modules for database operations
    const pool = require('../config/database').default;
    const { UserModel } = require('../models/User');

    // Check if user is in initially_created status
    const currentUser = await UserModel.findById(user.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.registration_status !== 'initially_created') {
      return res.status(400).json({ message: 'Contract upload is only available for users in initially_created status' });
    }

    // Store contract signature record
    const filePath = `/uploads/contracts/${req.file.filename}`;
    await pool.query(
      'INSERT INTO contract_signatures (user_id, file_path) VALUES ($1, $2)',
      [user.userId, filePath]
    );

    // Update user status to contract_signed
    await pool.query(
      'UPDATE users SET registration_status = $1 WHERE id = $2',
      ['contract_signed', user.userId]
    );

    res.json({
      message: 'Contract uploaded successfully',
      status: 'contract_signed'
    });
  } catch (error) {
    console.error('Error uploading contract:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error uploading contract' });
  }
});

// FIRST signup completion route
router.post('/complete-first-signup', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Import necessary modules for database operations
    const pool = require('../config/database').default;
    const { UserModel } = require('../models/User');

    // Check if user is in contract_signed status
    const currentUser = await UserModel.findById(user.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.registration_status !== 'contract_signed') {
      return res.status(400).json({ message: 'FIRST signup completion is only available for users in contract_signed status' });
    }

    // Update user status to complete
    await pool.query(
      'UPDATE users SET registration_status = $1 WHERE id = $2',
      ['complete', user.userId]
    );

    res.json({
      message: 'FIRST signup completed successfully',
      status: 'complete'
    });
  } catch (error) {
    console.error('Error completing FIRST signup:', error);
    res.status(500).json({ message: 'Server error completing FIRST signup' });
  }
});

export default router;