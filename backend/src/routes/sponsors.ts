import { Router } from 'express';
import pool from '../config/database';
import { authenticate, requireMaintenanceAccess, AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer configuration for sponsor logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../frontend/public/uploads/sponsors');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `sponsor-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

router.get('/', async (req, res) => {
  try {
    const { tier } = req.query;
    let query = 'SELECT * FROM sponsors WHERE is_active = true';
    let queryParams = [];

    if (tier) {
      query += ' AND tier = $1';
      queryParams.push(tier);
    }

    query += ' ORDER BY display_order, name';

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    res.status(500).json({ message: 'Server error fetching sponsors' });
  }
});

router.post('/', authenticate, requireMaintenanceAccess, upload.single('logo'), async (req, res) => {
  try {
    const { name, website_url, display_order, tier } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Sponsor name is required' });
    }

    if (tier && !['title_sponsor', 'gold', 'warrior', 'black', 'green'].includes(tier)) {
      return res.status(400).json({ message: 'Invalid sponsor tier' });
    }

    let logoPath = null;
    if (req.file) {
      logoPath = `/uploads/sponsors/${req.file.filename}`;
    }

    const result = await pool.query(
      `INSERT INTO sponsors (name, logo_path, website_url, display_order, tier)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), logoPath, website_url, parseInt(display_order) || 0, tier || 'green']
    );

    res.status(201).json({
      message: 'Sponsor created successfully',
      sponsor: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating sponsor:', error);
    res.status(500).json({ message: 'Server error creating sponsor' });
  }
});

router.put('/:id', authenticate, requireMaintenanceAccess, upload.single('logo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, website_url, display_order, tier } = req.body;

    if (name && name.trim().length === 0) {
      return res.status(400).json({ message: 'Sponsor name cannot be empty' });
    }

    if (tier && !['title_sponsor', 'gold', 'warrior', 'black', 'green'].includes(tier)) {
      return res.status(400).json({ message: 'Invalid sponsor tier' });
    }

    // Get existing sponsor to handle logo replacement
    const existingResult = await pool.query('SELECT * FROM sponsors WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Sponsor not found' });
    }

    const existingSponsor = existingResult.rows[0];
    let logoPath = null;

    // Handle new logo upload
    if (req.file) {
      // Delete old logo file if it exists
      if (existingSponsor.logo_path && existingSponsor.logo_path.startsWith('/uploads/sponsors/')) {
        const oldFilePath = path.join(__dirname, '../../../frontend/public', existingSponsor.logo_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      logoPath = `/uploads/sponsors/${req.file.filename}`;
    }

    // Build dynamic query based on provided fields
    const updates = [];
    const values = [id];
    let paramIndex = 2;

    if (name?.trim()) {
      updates.push(`name = $${paramIndex}`);
      values.push(name.trim());
      paramIndex++;
    }

    if (logoPath !== null) {
      updates.push(`logo_path = $${paramIndex}`);
      values.push(logoPath);
      paramIndex++;
    }

    if (website_url !== undefined) {
      updates.push(`website_url = $${paramIndex}`);
      values.push(website_url);
      paramIndex++;
    }

    if (display_order !== undefined) {
      updates.push(`display_order = $${paramIndex}`);
      values.push(display_order || 0);
      paramIndex++;
    }

    if (tier) {
      updates.push(`tier = $${paramIndex}`);
      values.push(tier);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    //updates.push('updated_at = CURRENT_TIMESTAMP');

    const result = await pool.query(
      `UPDATE sponsors SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    res.json({
      message: 'Sponsor updated successfully',
      sponsor: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating sponsor:', error);
    res.status(500).json({ message: 'Server error updating sponsor' });
  }
});

router.delete('/:id', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM sponsors WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sponsor not found' });
    }

    const deletedSponsor = result.rows[0];
    
    // Delete associated logo file if it exists
    if (deletedSponsor.logo_path && deletedSponsor.logo_path.startsWith('/uploads/sponsors/')) {
      const filePath = path.join(__dirname, '../../../frontend/public', deletedSponsor.logo_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ message: 'Sponsor deleted successfully' });
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    res.status(500).json({ message: 'Server error deleting sponsor' });
  }
});

// Proposal routes for students with maintenance access
router.post('/propose', authenticate, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    const { change_type, target_id, sponsor_name, sponsor_url, sponsor_tier, display_order, description } = req.body;
    const user_id = req.user?.userId;

    // Check if user has maintenance access
    const userCheck = await pool.query('SELECT maintenance_access FROM users WHERE id = $1', [user_id]);
    if (!userCheck.rows[0]?.maintenance_access) {
      return res.status(403).json({ message: 'Maintenance access required' });
    }

    // Build proposed data object
    const proposedData: any = {};
    
    if (change_type === 'sponsor') {
      proposedData.name = sponsor_name;
      proposedData.tier = sponsor_tier;
      proposedData.website_url = sponsor_url || null;
      proposedData.display_order = parseInt(display_order) || 0;
      
      if (req.file) {
        const logoPath = `/uploads/proposals/${req.file.filename}`;
        proposedData.logo_path = logoPath;
      }
    }

    const result = await pool.query(
      `INSERT INTO proposed_changes (user_id, change_type, target_table, target_id, proposed_data, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, change_type, 'sponsors', target_id ? parseInt(target_id) : null, JSON.stringify(proposedData), description]
    );

    res.status(201).json({
      message: 'Sponsor change proposal submitted successfully',
      proposal: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating sponsor proposal:', error);
    res.status(500).json({ message: 'Server error creating sponsor proposal' });
  }
});

router.get('/proposals', authenticate, requireMaintenanceAccess, async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT pc.*, u.first_name, u.last_name, u.email
      FROM proposed_changes pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.target_table = 'sponsors'
      ORDER BY pc.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sponsor proposals:', error);
    res.status(500).json({ message: 'Server error fetching sponsor proposals' });
  }
});

export default router;