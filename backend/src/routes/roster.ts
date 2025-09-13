import { Router } from 'express';
import pool from '../config/database';
import { authenticate, requireMaintenanceAccess, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

interface StudentWithSubteams {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  graduation_year: number;
  primary_subteam?: {
    id: number;
    name: string;
    is_captain: boolean;
  };
  secondary_subteams: {
    id: number;
    name: string;
    is_captain: boolean;
  }[];
  preferences: {
    id: number;
    name: string;
    preference_rank: number;
  }[];
}

// Get full roster organized by subteams (for management)
router.get('/management', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    
    // Check if user has access (core leadership, mentors, or admins)
    const userCheck = await pool.query(
      'SELECT role, maintenance_access FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userCheck.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions: core leadership students OR mentors/admins
    const hasAccess = user.maintenance_access || user.role === 'mentor' || user.role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. Core leadership, mentor, or admin access required.' });
    }

    // Get all students with their subteam assignments and preferences
    const result = await pool.query(`
      SELECT DISTINCT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.graduation_year,
        
        -- Primary subteam info
        primary_st.id as primary_subteam_id,
        primary_st.name as primary_subteam_name,
        primary_ss.is_captain as is_primary_captain,
        
        -- All subteam assignments (will be aggregated)
        ss.subteam_id as assigned_subteam_id,
        s.name as assigned_subteam_name,
        ss.is_primary as assignment_is_primary,
        ss.is_captain as assignment_is_captain,
        
        -- Preferences (will be aggregated)
        usp.subteam_id as preference_subteam_id,
        pref_s.name as preference_subteam_name,
        usp.preference_rank

      FROM users u
      LEFT JOIN student_subteams ss ON u.id = ss.user_id
      LEFT JOIN subteams s ON ss.subteam_id = s.id AND s.is_active = true
      LEFT JOIN student_subteams primary_ss ON u.id = primary_ss.user_id AND primary_ss.is_primary = true
      LEFT JOIN subteams primary_st ON primary_ss.subteam_id = primary_st.id
      LEFT JOIN user_subteam_preferences usp ON u.id = usp.user_id
      LEFT JOIN subteams pref_s ON usp.subteam_id = pref_s.id AND pref_s.is_active = true

      WHERE u.role = 'student' AND u.is_active = true
      ORDER BY u.first_name, u.last_name
    `);

    // Transform the flat result into structured data
    const studentsMap = new Map<string, StudentWithSubteams>();

    for (const row of result.rows) {
      if (!studentsMap.has(row.id)) {
        studentsMap.set(row.id, {
          id: row.id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          graduation_year: row.graduation_year,
          primary_subteam: row.primary_subteam_id ? {
            id: row.primary_subteam_id,
            name: row.primary_subteam_name,
            is_captain: row.is_primary_captain || false
          } : undefined,
          secondary_subteams: [],
          preferences: []
        });
      }

      const student = studentsMap.get(row.id)!;

      // Add secondary subteam assignments
      if (row.assigned_subteam_id && !row.assignment_is_primary) {
        const existing = student.secondary_subteams.find(st => st.id === row.assigned_subteam_id);
        if (!existing) {
          student.secondary_subteams.push({
            id: row.assigned_subteam_id,
            name: row.assigned_subteam_name,
            is_captain: row.assignment_is_captain || false
          });
        }
      }

      // Add preferences
      if (row.preference_subteam_id) {
        const existing = student.preferences.find(p => p.id === row.preference_subteam_id);
        if (!existing) {
          student.preferences.push({
            id: row.preference_subteam_id,
            name: row.preference_subteam_name,
            preference_rank: row.preference_rank || 999
          });
        }
      }
    }

    // Sort preferences by rank
    for (const student of studentsMap.values()) {
      student.preferences.sort((a, b) => a.preference_rank - b.preference_rank);
    }

    const students = Array.from(studentsMap.values());

    // Get subteams for organization
    const subteamsResult = await pool.query(
      'SELECT * FROM subteams WHERE is_active = true ORDER BY display_order, name'
    );

    res.json({
      students,
      subteams: subteamsResult.rows
    });
  } catch (error) {
    console.error('Error fetching roster management data:', error);
    res.status(500).json({ message: 'Server error fetching roster data' });
  }
});

// Get public roster (all signed-in users can see)
router.get('/public', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    // Get students organized by primary subteam
    const result = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.graduation_year,
        
        -- Primary subteam
        primary_st.id as primary_subteam_id,
        primary_st.name as primary_subteam_name,
        primary_ss.is_captain as is_captain
        
      FROM users u
      LEFT JOIN student_subteams primary_ss ON u.id = primary_ss.user_id AND primary_ss.is_primary = true
      LEFT JOIN subteams primary_st ON primary_ss.subteam_id = primary_st.id AND primary_st.is_active = true
      
      WHERE u.role = 'student' AND u.is_active = true
      ORDER BY primary_st.display_order NULLS LAST, primary_st.name NULLS LAST, u.first_name, u.last_name
    `);

    // Get all subteams
    const subteamsResult = await pool.query(
      'SELECT * FROM subteams WHERE is_active = true ORDER BY display_order, name'
    );

    res.json({
      students: result.rows,
      subteams: subteamsResult.rows
    });
  } catch (error) {
    console.error('Error fetching public roster:', error);
    res.status(500).json({ message: 'Server error fetching roster' });
  }
});

// Assign student to subteam
router.post('/assign', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { student_id, subteam_id, is_primary, is_captain } = req.body;

    // Check permissions
    const userCheck = await pool.query(
      'SELECT role, maintenance_access FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userCheck.rows[0];
    const hasAccess = user.maintenance_access || user.role === 'mentor' || user.role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If this is a primary assignment, remove any existing primary assignment
    if (is_primary) {
      await pool.query(
        'DELETE FROM student_subteams WHERE user_id = $1 AND is_primary = true',
        [student_id]
      );
    }

    // Check if assignment already exists
    const existingResult = await pool.query(
      'SELECT id FROM student_subteams WHERE user_id = $1 AND subteam_id = $2',
      [student_id, subteam_id]
    );

    if (existingResult.rows.length > 0) {
      // Update existing assignment
      await pool.query(
        'UPDATE student_subteams SET is_primary = $1, is_captain = $2 WHERE user_id = $3 AND subteam_id = $4',
        [is_primary || false, is_captain || false, student_id, subteam_id]
      );
    } else {
      // Create new assignment
      await pool.query(
        'INSERT INTO student_subteams (user_id, subteam_id, is_primary, is_captain) VALUES ($1, $2, $3, $4)',
        [student_id, subteam_id, is_primary || false, is_captain || false]
      );
    }

    res.json({ message: 'Student assigned successfully' });
  } catch (error) {
    console.error('Error assigning student:', error);
    res.status(500).json({ message: 'Server error assigning student' });
  }
});

// Remove student from subteam
router.delete('/assign', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { student_id, subteam_id } = req.body;

    // Check permissions
    const userCheck = await pool.query(
      'SELECT role, maintenance_access FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userCheck.rows[0];
    const hasAccess = user.maintenance_access || user.role === 'mentor' || user.role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await pool.query(
      'DELETE FROM student_subteams WHERE user_id = $1 AND subteam_id = $2',
      [student_id, subteam_id]
    );

    res.json({ message: 'Student removed from subteam successfully' });
  } catch (error) {
    console.error('Error removing student from subteam:', error);
    res.status(500).json({ message: 'Server error removing student' });
  }
});

export default router;