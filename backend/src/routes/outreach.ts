import { Router } from 'express';
import pool from '../config/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { StudentAttributeModel } from '../models/StudentAttribute';

const router = Router();

interface LeaderboardEntry {
  user_id: string;
  first_name: string;
  last_name: string;
  graduation_year: number;
  years_on_team: number;
  total_points: number;
  events_organized: number;
  events_assisted: number;
  requirements_met: boolean;
  is_new_student: boolean;
  points_needed: number;
  events_needed: number;
}

// Get leaderboard data (all signed-in users can access)
router.get('/leaderboard', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    // Get all students with their YOT and calculate points
    const result = await pool.query(`
      WITH student_yot AS (
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.graduation_year,
          COALESCE(CAST(sa.attribute_value AS INTEGER), 0) as years_on_team
        FROM users u
        LEFT JOIN student_attributes sa ON u.id = sa.user_id AND sa.attribute_key = 'yearsOnTeam'
        WHERE u.role = 'student' AND u.is_active = true
      ),
      student_points AS (
        SELECT
          sop.user_id,
          SUM(sop.points_awarded) as total_points,
          SUM(CASE WHEN sop.participation_type = 'organizer' THEN 1 ELSE 0 END) as events_organized,
          SUM(CASE WHEN sop.participation_type = 'assistant' THEN 1 ELSE 0 END) as events_assisted
        FROM student_outreach_participation sop
        GROUP BY sop.user_id
      )
      SELECT
        sy.id as user_id,
        sy.first_name,
        sy.last_name,
        sy.graduation_year,
        sy.years_on_team,
        COALESCE(sp.total_points, 0) as total_points,
        COALESCE(sp.events_organized, 0) as events_organized,
        COALESCE(sp.events_assisted, 0) as events_assisted
      FROM student_yot sy
      LEFT JOIN student_points sp ON sy.id = sp.user_id
      ORDER BY COALESCE(sp.total_points, 0) DESC, sy.first_name, sy.last_name
    `);

    // Calculate requirements for each student
    const leaderboard: LeaderboardEntry[] = result.rows.map(row => {
      const isNewStudent = row.years_on_team <= 1;
      const requiredPoints = isNewStudent ? 10 : 18;
      const requiredEvents = isNewStudent ? 0 : 1;

      const pointsMet = row.total_points >= requiredPoints;
      const eventsMet = row.events_organized >= requiredEvents;
      const requirementsMet = pointsMet && eventsMet;

      return {
        user_id: row.user_id,
        first_name: row.first_name,
        last_name: row.last_name,
        graduation_year: row.graduation_year,
        years_on_team: row.years_on_team,
        total_points: row.total_points,
        events_organized: row.events_organized,
        events_assisted: row.events_assisted,
        requirements_met: requirementsMet,
        is_new_student: isNewStudent,
        points_needed: Math.max(0, requiredPoints - row.total_points),
        events_needed: Math.max(0, requiredEvents - row.events_organized)
      };
    });

    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

// Get all outreach events (for logging tab)
router.get('/events', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

    // Check if user has access (core leadership or mentors)
    const userCheck = await pool.query(
      'SELECT role, maintenance_access FROM users WHERE id = $1',
      [userId]
    );

    const user = userCheck.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasAccess = user.maintenance_access || user.role === 'mentor' || user.role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. Core leadership or mentor access required.' });
    }

    // Get all events with participation details
    const result = await pool.query(`
      SELECT
        oe.id,
        oe.event_name,
        oe.event_date,
        oe.event_description,
        oe.hours_length,
        oe.created_at,
        creator.first_name || ' ' || creator.last_name as created_by_name,
        COUNT(sop.id) as participant_count
      FROM outreach_events oe
      LEFT JOIN users creator ON oe.created_by = creator.id
      LEFT JOIN student_outreach_participation sop ON oe.id = sop.event_id
      GROUP BY oe.id, oe.event_name, oe.event_date, oe.event_description,
               oe.hours_length, oe.created_at, creator.first_name, creator.last_name
      ORDER BY oe.event_date DESC
    `);

    res.json({ events: result.rows });
  } catch (error) {
    console.error('Error fetching outreach events:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

// Get participants for a specific event
router.get('/events/:eventId/participants', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { eventId } = req.params;

    // Check if user has access
    const userCheck = await pool.query(
      'SELECT role, maintenance_access FROM users WHERE id = $1',
      [userId]
    );

    const user = userCheck.rows[0];
    const hasAccess = user.maintenance_access || user.role === 'mentor' || user.role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT
        sop.id,
        sop.user_id,
        u.first_name,
        u.last_name,
        sop.participation_type,
        sop.points_awarded,
        sop.notes
      FROM student_outreach_participation sop
      JOIN users u ON sop.user_id = u.id
      WHERE sop.event_id = $1
      ORDER BY u.first_name, u.last_name
    `, [eventId]);

    res.json({ participants: result.rows });
  } catch (error) {
    console.error('Error fetching event participants:', error);
    res.status(500).json({ message: 'Server error fetching participants' });
  }
});

// Create new outreach event
router.post('/events', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { event_name, event_date, event_description, hours_length } = req.body;

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

    const result = await pool.query(
      `INSERT INTO outreach_events (event_name, event_date, event_description, hours_length, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [event_name, event_date, event_description, hours_length, userId]
    );

    res.status(201).json({
      message: 'Event created successfully',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating outreach event:', error);
    res.status(500).json({ message: 'Server error creating event' });
  }
});

// Update an outreach event
router.put('/events/:eventId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { eventId } = req.params;
    const { event_name, event_date, event_description, hours_length } = req.body;

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

    // Get the old event to check if duration changed
    const oldEventResult = await pool.query(
      'SELECT hours_length FROM outreach_events WHERE id = $1',
      [eventId]
    );

    if (oldEventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const oldHoursLength = oldEventResult.rows[0].hours_length;
    const durationChanged = oldHoursLength !== hours_length;

    // Update the event
    const result = await pool.query(
      `UPDATE outreach_events
       SET event_name = $1, event_date = $2, event_description = $3, hours_length = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [event_name, event_date, event_description, hours_length, eventId]
    );

    // If duration changed, recalculate all participant points for this event
    if (durationChanged) {
      const newHoursLength = hours_length || 0;
      const newMultiplier = Math.floor(newHoursLength / 4) + 1;

      // Get all participants for this event
      const participants = await pool.query(
        'SELECT id, participation_type FROM student_outreach_participation WHERE event_id = $1',
        [eventId]
      );

      // Recalculate and update points for each participant
      for (const participant of participants.rows) {
        const basePoints = participant.participation_type === 'organizer' ? 8 : 5;
        const newPoints = basePoints * newMultiplier;

        await pool.query(
          'UPDATE student_outreach_participation SET points_awarded = $1 WHERE id = $2',
          [newPoints, participant.id]
        );
      }
    }

    res.json({
      message: 'Event updated successfully',
      event: result.rows[0],
      pointsRecalculated: durationChanged
    });
  } catch (error) {
    console.error('Error updating outreach event:', error);
    res.status(500).json({ message: 'Server error updating event' });
  }
});

// Add student participation to an event
router.post('/events/:eventId/participants', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { eventId } = req.params;
    const { student_id, participation_type, notes } = req.body;

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

    // Validate participation type and calculate points
    if (participation_type !== 'organizer' && participation_type !== 'assistant') {
      return res.status(400).json({ message: 'Invalid participation type' });
    }

    // Get event to calculate multiplier based on duration
    const eventResult = await pool.query(
      'SELECT hours_length FROM outreach_events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const hoursLength = eventResult.rows[0].hours_length || 0;

    // Calculate multiplier: floor(hours / 4) + 1
    // Examples: 0-3.99h = 1x, 4-7.99h = 2x, 8-11.99h = 3x
    // 3h 59m = floor(3.99/4) + 1 = 0 + 1 = 1x = 5pts for assisting
    // 4h = floor(4/4) + 1 = 1 + 1 = 2x = 10pts for assisting
    // 8h = floor(8/4) + 1 = 2 + 1 = 3x = 15pts for assisting
    const multiplier = Math.floor(hoursLength / 4) + 1;

    const basePoints = participation_type === 'organizer' ? 8 : 5;
    const points = basePoints * multiplier;

    const result = await pool.query(
      `INSERT INTO student_outreach_participation
       (user_id, event_id, participation_type, points_awarded, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [student_id, eventId, participation_type, points, notes, userId]
    );

    res.status(201).json({
      message: 'Participation recorded successfully',
      participation: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error recording participation:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ message: 'Student already has a participation record for this event' });
    }
    res.status(500).json({ message: 'Server error recording participation' });
  }
});

// Remove student participation from an event
router.delete('/events/:eventId/participants/:participationId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { participationId } = req.params;

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
      'DELETE FROM student_outreach_participation WHERE id = $1',
      [participationId]
    );

    res.json({ message: 'Participation removed successfully' });
  } catch (error) {
    console.error('Error removing participation:', error);
    res.status(500).json({ message: 'Server error removing participation' });
  }
});

// Delete an outreach event
router.delete('/events/:eventId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { eventId } = req.params;

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

    // Delete event (participation records will be cascade deleted)
    await pool.query('DELETE FROM outreach_events WHERE id = $1', [eventId]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error deleting event' });
  }
});

// Get all students for dropdown in event logging
router.get('/students', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

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

    const result = await pool.query(`
      SELECT
        id,
        first_name,
        last_name,
        email,
        graduation_year
      FROM users
      WHERE role = 'student' AND is_active = true
      ORDER BY first_name, last_name
    `);

    res.json({ students: result.rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error fetching students' });
  }
});

// Reset entire outreach leaderboard (admin only)
router.post('/reset-leaderboard', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

    // Check if user is admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    const user = userCheck.rows[0];
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators can reset the leaderboard.' });
    }

    // Delete all participation records first (due to foreign key)
    await pool.query('DELETE FROM student_outreach_participation');

    // Delete all events
    await pool.query('DELETE FROM outreach_events');

    res.json({
      message: 'Outreach leaderboard has been completely reset. All events and participation records have been deleted.'
    });
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    res.status(500).json({ message: 'Server error resetting leaderboard' });
  }
});

export default router;
