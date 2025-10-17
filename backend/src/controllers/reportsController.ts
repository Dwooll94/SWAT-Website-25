import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserModel } from '../models/User';

export const getStudentEmails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user has permission (admin or mentor)
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Only admins and mentors can access reports.' });
    }

    // Get all active students
    const allUsers = await UserModel.getAllUsers();
    const activeStudents = allUsers.filter(u => u.role === 'student' && u.is_active);

    // Get emails, preferring school email if it exists
    const emails = activeStudents
      .map(student => {
        const email = student.school_email && student.school_email.trim()
          ? student.school_email.trim()
          : student.email;
        return email;
      })
      .filter(email => email); // Remove any null/undefined

    const emailList = emails.join(', ');

    res.json({
      emails: emailList,
      count: emails.length
    });
  } catch (error) {
    console.error('Get student emails error:', error);
    res.status(500).json({ message: 'Server error fetching student emails' });
  }
};

export const getAllEmails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user has permission (admin or mentor)
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Only admins and mentors can access reports.' });
    }

    // Get all users
    const allUsers = await UserModel.getAllUsers();

    const emails: string[] = [];

    // Get active students (preferring school email)
    const activeStudents = allUsers.filter(u => u.role === 'student' && u.is_active);
    activeStudents.forEach(student => {
      const email = student.school_email && student.school_email.trim()
        ? student.school_email.trim()
        : student.email;
      if (email) {
        emails.push(email);
      }
    });

    // Get active mentors
    const activeMentors = allUsers.filter(u => u.role === 'mentor' && u.is_active);
    activeMentors.forEach(mentor => {
      if (mentor.email) {
        emails.push(mentor.email);
      }
    });

    // Get guardians for active students
    for (const student of activeStudents) {
      const guardians = await UserModel.getGuardians(student.id);
      guardians.forEach(guardian => {
        if (guardian.email && guardian.email.trim()) {
          emails.push(guardian.email.trim());
        }
      });
    }

    const emailList = emails.join(', ');

    res.json({
      emails: emailList,
      count: emails.length
    });
  } catch (error) {
    console.error('Get all emails error:', error);
    res.status(500).json({ message: 'Server error fetching all emails' });
  }
};

export const getFoodAllergies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user has permission (admin or mentor)
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Only admins and mentors can access reports.' });
    }

    // Get all users
    const allUsers = await UserModel.getAllUsers();

    // Collect all food allergies from students and mentors
    const allergiesData: Array<{ name: string; role: string; allergies: string }> = [];

    const activeStudents = allUsers.filter(u => u.role === 'student' && u.is_active);
    activeStudents.forEach(student => {
      if (student.food_allergies && student.food_allergies.trim()) {
        const name = student.first_name && student.last_name
          ? `${student.first_name} ${student.last_name}`
          : student.email;
        allergiesData.push({
          name,
          role: 'Student',
          allergies: student.food_allergies.trim()
        });
      }
    });

    const activeMentors = allUsers.filter(u => u.role === 'mentor' && u.is_active);
    activeMentors.forEach(mentor => {
      if (mentor.food_allergies && mentor.food_allergies.trim()) {
        const name = mentor.first_name && mentor.last_name
          ? `${mentor.first_name} ${mentor.last_name}`
          : mentor.email;
        allergiesData.push({
          name,
          role: 'Mentor',
          allergies: mentor.food_allergies.trim()
        });
      }
    });

    // Generate comma-separated list of all allergies
    const allAllergies = allergiesData.map(item => item.allergies).join(', ');

    res.json({
      allergies: allAllergies,
      detailed: allergiesData,
      count: allergiesData.length
    });
  } catch (error) {
    console.error('Get food allergies error:', error);
    res.status(500).json({ message: 'Server error fetching food allergies' });
  }
};
