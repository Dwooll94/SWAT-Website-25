import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { UserModel } from '../models/User';

const router = Router();

// Get all site configuration (public endpoint)
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM site_config ORDER BY key');
    
    // Convert to key-value object
    const config: { [key: string]: string } = {};
    result.rows.forEach((row: any) => {
      config[row.key] = row.value;
    });
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching site configuration:', error);
    res.status(500).json({ message: 'Server error fetching configuration' });
  }
});

// Get specific config value (public endpoint)
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const result = await pool.query('SELECT * FROM site_config WHERE key = $1', [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Configuration key not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ message: 'Server error fetching configuration' });
  }
});

// Update site configuration (admin only)
router.put('/:key', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (!value) {
      return res.status(400).json({ message: 'Value is required' });
    }

    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admins can update configuration
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only admins can update site configuration.' });
    }

    // Check if key exists
    const existingResult = await pool.query('SELECT * FROM site_config WHERE key = $1', [key]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Configuration key not found' });
    }

    // Update the configuration
    const result = await pool.query(`
      UPDATE site_config 
      SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE key = $3 
      RETURNING *
    `, [value, currentUser.id, key]);

    res.json({
      message: 'Configuration updated successfully',
      config: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({ message: 'Server error updating configuration' });
  }
});

// Get all configuration with metadata (admin only)
router.get('/admin/all', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admins can view configuration metadata
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only admins can view configuration metadata.' });
    }

    const result = await pool.query(`
      SELECT sc.*, u.first_name || ' ' || u.last_name as updated_by_name
      FROM site_config sc
      LEFT JOIN users u ON sc.updated_by = u.id
      ORDER BY sc.key
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching configuration metadata:', error);
    res.status(500).json({ message: 'Server error fetching configuration' });
  }
});

export default router;