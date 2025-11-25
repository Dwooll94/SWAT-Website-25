import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { UserModel, CreateUserData } from '../models/User';
import { StudentAttributeModel } from '../models/StudentAttribute';
import { SubteamModel } from '../models/Subteam';
import { generateToken, extractGraduationYear, isValidSchoolEmail } from '../utils/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';
import { EmailVerificationService } from '../utils/emailVerification';
import { PasswordResetService } from '../utils/passwordReset';
import { randomBytes } from 'crypto';

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email,
      school_email,
      password,
      graduation_year,
      gender,
      first_name,
      last_name,
      phone,
      food_allergies,
      medical_conditions,
      heard_about_team,
      subteam_preferences,
      guardians
    } = req.body;

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    if (school_email && await UserModel.findByEmail(school_email)) {
      return res.status(400).json({ message: 'User with this school email already exists' });
    }

    let finalGraduationYear = graduation_year;
    if (school_email && isValidSchoolEmail(school_email)) {
      const extractedYear = extractGraduationYear(school_email);
      if (extractedYear) {
        finalGraduationYear = extractedYear;
      }
    }

    const userData: CreateUserData = {
      email,
      school_email,
      password,
      graduation_year: finalGraduationYear,
      gender,
      first_name,
      last_name,
      phone,
      food_allergies,
      medical_conditions,
      heard_about_team,
      subteam_preferences,
      guardians
    };

    const user = await UserModel.createUser(userData);
    
    // Generate email verification token
    const verificationToken = await EmailVerificationService.createVerificationToken(user.id);
    
    // Send verification email
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const emailSent = await emailService.sendEmailVerification(
      user.email,
      userName || 'User',
      verificationToken
    );

    if (!emailSent) {
      console.error('Failed to send verification email to:', user.email);
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email and click the verification link to activate your account.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        registration_status: user.registration_status,
        first_name: user.first_name,
        last_name: user.last_name,
        email_verified: user.email_verified
      },
      verificationEmailSent: emailSent
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const isValidPassword = await UserModel.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified (except for mentors and admins who might be invited)
    if (!user.email_verified && user.role === 'student') {
      return res.status(403).json({ 
        message: 'Please verify your email address before signing in. Check your email for the verification link.',
        email_verified: false,
        user_id: user.id
      });
    }

    await UserModel.updateLastLogin(user.id);
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        registration_status: user.registration_status,
        first_name: user.first_name,
        last_name: user.last_name,
        maintenance_access: user.maintenance_access
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const subteamPreferences = await SubteamModel.getUserPreferences(user.id);
    const guardians = await UserModel.getGuardians(user.id);

    res.json({
      id: user.id,
      email: user.email,
      school_email: user.school_email,
      role: user.role,
      registration_status: user.registration_status,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      graduation_year: user.graduation_year,
      gender: user.gender,
      food_allergies: user.food_allergies,
      medical_conditions: user.medical_conditions,
      heard_about_team: user.heard_about_team,
      maintenance_access: user.maintenance_access,
      subteamPreferences,
      guardians
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

export const updateRegistrationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const userId = req.user!.userId;

    const validStatuses = ['initially_created', 'contract_signed', 'complete'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid registration status' });
    }

    await UserModel.updateRegistrationStatus(userId, status);

    res.json({ message: 'Registration status updated successfully' });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Server error updating status' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    // Get current user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await UserModel.validatePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    await UserModel.updatePassword(userId, newPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
};

export const updateContactInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      first_name,
      last_name,
      phone,
      school_email,
      food_allergies,
      medical_conditions
    } = req.body;
    const userId = req.user!.userId;

    // Check if school_email is already taken by another user
    if (school_email) {
      const existingUser = await UserModel.findByEmail(school_email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'School email is already in use by another account' });
      }
    }

    // Update contact information
    await UserModel.updateContactInfo(userId, {
      first_name,
      last_name,
      phone,
      school_email,
      food_allergies,
      medical_conditions
    });

    res.json({ message: 'Contact information updated successfully' });
  } catch (error) {
    console.error('Contact info update error:', error);
    res.status(500).json({ message: 'Server error updating contact information' });
  }
};

export const updateGuardianInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { guardians } = req.body;
    const userId = req.user!.userId;

    // Validate that we have at least one guardian
    if (!guardians || guardians.length === 0) {
      return res.status(400).json({ message: 'At least one guardian is required' });
    }

    // Update guardian information
    await UserModel.updateGuardianInfo(userId, guardians);

    res.json({ message: 'Guardian information updated successfully' });
  } catch (error) {
    console.error('Guardian info update error:', error);
    res.status(500).json({ message: 'Server error updating guardian information' });
  }
};

const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  const randomArray = randomBytes(12);
  for (let i = 0; i < 12; i++) {
    result += chars[randomArray[i] % chars.length];
  }
  return result;
};

export const inviteMentor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin or mentor
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'mentor')) {
      return res.status(403).json({ message: 'Access denied. Only admins and mentors can invite new mentors.' });
    }

    const { email, first_name, last_name } = req.body;

    // Check if user with this email already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Create mentor account
    const mentor = await UserModel.createMentorInvitation({
      email,
      first_name,
      last_name,
      temporaryPassword
    });

    // Send invitation email
    const inviterName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email;
    const mentorName = `${first_name || ''} ${last_name || ''}`.trim();
    
    const emailSent = await emailService.sendMentorInvitationEmail(
      email,
      mentorName,
      temporaryPassword,
      inviterName
    );

    if (!emailSent) {
      console.error('Failed to send mentor invitation email');
      // Still return success since the account was created
    }

    res.status(201).json({
      message: 'Mentor invitation sent successfully',
      mentor: {
        id: mentor.id,
        email: mentor.email,
        first_name: mentor.first_name,
        last_name: mentor.last_name,
        role: mentor.role
      },
      emailSent
    });
  } catch (error) {
    console.error('Mentor invitation error:', error);
    res.status(500).json({ message: 'Server error sending mentor invitation' });
  }
};

export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin or mentor
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'mentor')) {
      return res.status(403).json({ message: 'Access denied. Only admins and mentors can view user list.' });
    }

    const searchQuery = req.query.search as string;
    const users = await UserModel.getAllUsers(searchQuery);

    // Remove sensitive information
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      school_email: user.school_email,
      role: user.role,
      registration_status: user.registration_status,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      graduation_year: user.graduation_year,
      gender: user.gender,
      food_allergies: user.food_allergies,
      medical_conditions: user.medical_conditions,
      heard_about_team: user.heard_about_team,
      maintenance_access: user.maintenance_access,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
      guardian_count: user.guardian_count,
      guardians: user.guardians || [],
      is_core_leadership: user.is_core_leadership,
      years_on_team: user.years_on_team || 0
    }));

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

export const updateUserStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators can modify user status.' });
    }

    const { userId } = req.params;
    const { is_active } = req.body;

    // Prevent admin from deactivating themselves
    if (userId === currentUser.id) {
      return res.status(400).json({ message: 'You cannot modify your own status.' });
    }

    // Check if target user exists
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await UserModel.updateUserStatus(userId, is_active);

    res.json({ message: `User ${is_active ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
};

export const updateMaintenanceAccess = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators can modify maintenance access.' });
    }

    const { userId } = req.params;
    const { maintenance_access } = req.body;

    // Check if target user exists
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await UserModel.updateMaintenanceAccess(userId, maintenance_access);

    res.json({ message: `Maintenance access ${maintenance_access ? 'granted' : 'revoked'} successfully` });
  } catch (error) {
    console.error('Update maintenance access error:', error);
    res.status(500).json({ message: 'Server error updating maintenance access' });
  }
};

export const updateUserContactInfoAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin or mentor
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'mentor')) {
      return res.status(403).json({ message: 'Access denied. Only admins and mentors can modify user information.' });
    }

    const { userId } = req.params;
    const {
      first_name,
      last_name,
      phone,
      school_email,
      food_allergies,
      medical_conditions
    } = req.body;

    // Check if target user exists
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if school_email is already taken by another user
    if (school_email) {
      const existingUser = await UserModel.findByEmail(school_email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'School email is already in use by another account' });
      }
    }

    // Update contact information
    await UserModel.updateUserContactInfoAdmin(userId, {
      first_name,
      last_name,
      phone,
      school_email,
      food_allergies,
      medical_conditions
    });

    res.json({ message: 'User contact information updated successfully' });
  } catch (error) {
    console.error('Admin contact info update error:', error);
    res.status(500).json({ message: 'Server error updating user contact information' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators can delete users.' });
    }

    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    // Check if target user exists
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    await UserModel.deleteUser(userId);

    res.json({ 
      message: `User ${targetUser.first_name ? `${targetUser.first_name} ${targetUser.last_name}` : targetUser.email} has been permanently deleted` 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

export const deactivateOwnAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get current user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only students and mentors can deactivate their own accounts
    // Admins should use the admin interface or contact support
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Administrators cannot deactivate their own accounts. Please contact system support.' });
    }

    // Check if already inactive
    if (!user.is_active) {
      return res.status(400).json({ message: 'Account is already deactivated' });
    }

    // Deactivate the account
    await UserModel.updateUserStatus(userId, false);

    res.json({ 
      message: 'Your account has been deactivated successfully. Contact an administrator if you need to reactivate it.' 
    });
  } catch (error) {
    console.error('Self deactivation error:', error);
    res.status(500).json({ message: 'Server error deactivating account' });
  }
};

export const getUserGuardianInfoAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin or mentor
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'mentor')) {
      return res.status(403).json({ message: 'Access denied. Only admins and mentors can view guardian information.' });
    }

    const { userId } = req.params;

    // Check if target user exists
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get guardians for this user
    const guardians = await UserModel.getGuardians(userId);

    res.json({ guardians });
  } catch (error) {
    console.error('Get user guardians error:', error);
    res.status(500).json({ message: 'Server error fetching guardian information' });
  }
};

export const updateUserGuardianInfoAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin or mentor
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'mentor')) {
      return res.status(403).json({ message: 'Access denied. Only admins and mentors can modify guardian information.' });
    }

    const { userId } = req.params;
    const { guardians } = req.body;

    // Validate that we have at least one guardian for students
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role === 'student' && (!guardians || guardians.length === 0)) {
      return res.status(400).json({ message: 'At least one guardian is required for students' });
    }

    // Update guardian information
    await UserModel.updateGuardianInfo(userId, guardians);

    const contactLabel = (targetUser.role === 'mentor' || targetUser.role === 'admin') ? 'emergency contacts' : 'guardians';
    res.json({ message: `User ${contactLabel} updated successfully` });
  } catch (error) {
    console.error('Admin guardian info update error:', error);
    res.status(500).json({ message: 'Server error updating guardian information' });
  }
};

export const updateCoreLeadership = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators can modify core leadership status.' });
    }

    const { userId } = req.params;
    const { is_core_leadership } = req.body;

    // Check if target user exists and is a student
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role !== 'student') {
      return res.status(400).json({ message: 'Core leadership status can only be set for students' });
    }

    // Update core leadership status
    await StudentAttributeModel.setCoreLeadership(userId, is_core_leadership);

    res.json({
      message: `Student ${is_core_leadership ? 'granted' : 'removed from'} core leadership successfully`
    });
  } catch (error) {
    console.error('Update core leadership error:', error);
    res.status(500).json({ message: 'Server error updating core leadership status' });
  }
};

export const updateYearsOnTeam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators can modify years on team.' });
    }

    const { userId } = req.params;
    const { years_on_team } = req.body;

    // Check if target user exists and is a student
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role !== 'student') {
      return res.status(400).json({ message: 'Years on team can only be set for students' });
    }

    // Update years on team
    await StudentAttributeModel.setYearsOnTeam(userId, years_on_team);

    res.json({
      message: `Student years on team updated to ${years_on_team} successfully`
    });
  } catch (error) {
    console.error('Update years on team error:', error);
    res.status(500).json({ message: 'Server error updating years on team' });
  }
};

export const updateUserRegistrationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin or mentor
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'mentor')) {
      return res.status(403).json({ message: 'Access denied. Only admins and mentors can modify registration status.' });
    }

    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ['initially_created', 'contract_signed', 'complete'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid registration status' });
    }

    // Check if target user exists
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await UserModel.updateRegistrationStatus(userId, status);

    res.json({ message: 'User registration status updated successfully' });
  } catch (error) {
    console.error('Update user registration status error:', error);
    res.status(500).json({ message: 'Server error updating registration status' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const verification = await EmailVerificationService.verifyToken(token);
    
    if (!verification.isValid) {
      return res.status(400).json({ 
        message: verification.reason === 'Token expired' 
          ? 'Verification link has expired. Please request a new verification email.' 
          : 'Invalid verification token.' 
      });
    }

    await EmailVerificationService.markEmailAsVerified(verification.userId!);

    res.json({ message: 'Email verified successfully! You can now access your account.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {;

    // Get user details
    const user = await UserModel.findByEmail(req.body.user_email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = await EmailVerificationService.resendVerificationToken(user.id);

    // Send verification email
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const emailSent = await emailService.sendEmailVerification(
      user.email,
      userName || 'User',
      verificationToken
    );

    if (!emailSent) {
      console.error('Failed to send verification email');
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ message: 'Server error sending verification email' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await UserModel.findByEmail(email);

    // For security reasons, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate password reset token
    const resetToken = await PasswordResetService.createResetToken(user.id);

    // Send password reset email
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const emailSent = await emailService.sendPasswordResetEmail(
      user.email,
      userName || 'User',
      resetToken
    );

    if (!emailSent) {
      console.error('Failed to send password reset email');
      return res.status(500).json({ message: 'Failed to send password reset email' });
    }

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Server error processing password reset request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long'
      });
    }

    // Verify the reset token
    const verification = await PasswordResetService.verifyToken(token);

    if (!verification.isValid) {
      return res.status(400).json({
        message: verification.reason === 'Token expired'
          ? 'Password reset link has expired. Please request a new one.'
          : 'Invalid password reset token.'
      });
    }

    // Update the user's password
    await UserModel.updatePassword(verification.userId!, newPassword);

    // Delete the used token and any other tokens for this user
    await PasswordResetService.deleteUserTokens(verification.userId!);

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};