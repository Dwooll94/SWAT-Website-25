import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { UserModel } from '../models/User';
import { StudentAttributeModel } from '../models/StudentAttribute';
import { AuthenticatedRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';

export const getEmailRecipients = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user has permission (admin, mentor, or core leadership student)
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasPermission = currentUser.role === 'admin' || 
                         currentUser.role === 'mentor' || 
                         (currentUser.role === 'student' && await StudentAttributeModel.isCoreLeadership(currentUser.id));

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied. Only admins, mentors, or core leadership students can access email functionality.' });
    }

    // Get all users with their attributes
    const allUsers = await UserModel.getAllUsers();
    const coreLeadershipIds = await StudentAttributeModel.getCoreLeadershipUsers();
    
    // Prepare base user arrays
    const activeStudents = allUsers.filter(u => u.role === 'student' && u.is_active).map(u => ({
      id: u.id,
      name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email,
      email: u.email,
      role: u.role,
      is_core_leadership: u.is_core_leadership
    }));

    const activeMentors = allUsers.filter(u => u.role === 'mentor' && u.is_active).map(u => ({
      id: u.id,
      name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email,
      email: u.email,
      role: u.role
    }));

    const guardians: Array<{
      id: string;
      name: string;
      email: string;
      relationship?: string;
      student_name: string;
    }> = [];

    // Build recipient groups with the requested combinations
    const recipients = {
      students_guardians_mentors: [...activeStudents, ...activeMentors], // Will add guardians below
      students_and_mentors: [...activeStudents, ...activeMentors],
      students_only: [...activeStudents]
    };

    // Get guardians for students and add them to the first group
    for (const user of allUsers.filter(u => u.role === 'student' && u.is_active)) {
      const userGuardians = await UserModel.getGuardians(user.id);
      userGuardians.forEach(guardian => {
        if (guardian.email && guardian.email.trim()) {
          const guardianRecord = {
            id: `guardian_${guardian.id}`,
            name: guardian.name,
            email: guardian.email,
            relationship: guardian.relationship,
            student_name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email
          };
          guardians.push(guardianRecord);
          // Add guardians to the first group (students, guardians, and mentors)
          recipients.students_guardians_mentors.push({
            id: guardianRecord.id,
            name: guardianRecord.name,
            email: guardianRecord.email,
            role: 'guardian' as any
          });
        }
      });
    }

    res.json(recipients);
  } catch (error) {
    console.error('Get email recipients error:', error);
    res.status(500).json({ message: 'Server error fetching email recipients' });
  }
};

export const sendMassEmail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user has permission
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasPermission = currentUser.role === 'admin' || 
                         currentUser.role === 'mentor' || 
                         (currentUser.role === 'student' && await StudentAttributeModel.isCoreLeadership(currentUser.id));

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied. Only admins, mentors, or core leadership students can send mass emails.' });
    }

    const { recipient_group, recipients, subject, message, send_copy_to_sender } = req.body;

    // Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'At least one recipient is required' });
    }

    // Build sender information
    const senderName = currentUser.first_name && currentUser.last_name 
      ? `${currentUser.first_name} ${currentUser.last_name}` 
      : currentUser.email;
    
    const senderRole = currentUser.role === 'student' && await StudentAttributeModel.isCoreLeadership(currentUser.id)
      ? 'Core Leadership Student'
      : currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

    // Send emails
    const emailPromises = recipients.map((recipient: any) => 
      emailService.sendMassEmail({
        to: recipient.email,
        recipientName: recipient.name,
        subject,
        message,
        senderName,
        senderRole,
        senderEmail: currentUser.email
      })
    );

    if (send_copy_to_sender) {
      emailPromises.push(
        emailService.sendMassEmail({
          to: currentUser.email,
          recipientName: senderName,
          subject: `[COPY] ${subject}`,
          message: `This is a copy of the mass email you sent to ${recipients.length} recipient(s).\n\n---\n\n${message}`,
          senderName,
          senderRole,
          senderEmail: currentUser.email
        })
      );
    }

    await Promise.all(emailPromises);

    res.json({ 
      message: `Mass email sent successfully to ${recipients.length} recipient(s)${send_copy_to_sender ? ' (copy sent to sender)' : ''}` 
    });
  } catch (error) {
    console.error('Send mass email error:', error);
    res.status(500).json({ message: 'Server error sending mass email' });
  }
};