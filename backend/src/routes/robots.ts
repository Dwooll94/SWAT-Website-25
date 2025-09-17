import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/database';
import { authenticate, requireMaintenanceAccess } from '../middleware/auth';

const router = Router();

// Configure multer for robot image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../frontend/public/uploads/robots');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `robot-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all robots (public endpoint)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM robots ORDER BY year DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching robots:', error);
    res.status(500).json({ message: 'Server error fetching robots' });
  }
});

// Get a specific robot by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM robots WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Robot not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching robot:', error);
    res.status(500).json({ message: 'Server error fetching robot' });
  }
});

// Create new robot (maintenance access required)
router.post('/', authenticate, requireMaintenanceAccess, upload.single('image'), async (req, res) => {
  try {
    const { year, name, game, description, achievements, cad_link, code_link } = req.body;

    if (!year || !name || !game) {
      // Clean up uploaded file if validation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Year, name, and game are required' });
    }

    const yearNumber = parseInt(year);
    if (isNaN(yearNumber) || yearNumber < 1990 || yearNumber > new Date().getFullYear() + 1) {
      // Clean up uploaded file if validation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Valid year is required' });
    }

    // Check if robot for this year already exists
    const existingResult = await pool.query('SELECT id FROM robots WHERE year = $1', [yearNumber]);
    if (existingResult.rows.length > 0) {
      // Clean up uploaded file if robot already exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Robot for this year already exists' });
    }

    // Generate the web-accessible path for the image
    const imagePath = req.file ? `/uploads/robots/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO robots (year, name, game, description, image_path, achievements, cad_link, code_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [yearNumber, name.trim(), game.trim(), description || null, imagePath, achievements || null, cad_link || null, code_link || null]
    );

    res.status(201).json({
      message: 'Robot created successfully',
      robot: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating robot:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error creating robot' });
  }
});

// Update robot (maintenance access required)
router.put('/:id', authenticate, requireMaintenanceAccess, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { year, name, game, description, achievements, cad_link, code_link } = req.body;

    // Get existing robot to check for image replacement
    const existingResult = await pool.query('SELECT * FROM robots WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      // Clean up uploaded file if robot doesn't exist
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Robot not found' });
    }

    const existingRobot = existingResult.rows[0];
    let imagePath = existingRobot.image_path;

    // Handle new image upload
    if (req.file) {
      // Delete old image file if it exists
      if (existingRobot.image_path && existingRobot.image_path.startsWith('/uploads/')) {
        const oldFilePath = path.join(__dirname, '../../../frontend/public', existingRobot.image_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      imagePath = `/uploads/robots/${req.file.filename}`;
    }

    // Validate year if provided
    if (year) {
      const yearNumber = parseInt(year);
      if (isNaN(yearNumber) || yearNumber < 1990 || yearNumber > new Date().getFullYear() + 1) {
        // Clean up uploaded file if validation fails
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: 'Valid year is required' });
      }

      // Check if another robot for this year already exists
      const conflictResult = await pool.query(
        'SELECT id FROM robots WHERE year = $1 AND id != $2',
        [yearNumber, id]
      );
      if (conflictResult.rows.length > 0) {
        // Clean up uploaded file if conflict exists
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: 'Robot for this year already exists' });
      }
    }

    const result = await pool.query(
      `UPDATE robots 
       SET year = COALESCE($1, year),
           name = COALESCE($2, name),
           game = COALESCE($3, game),
           description = COALESCE($4, description),
           image_path = $5,
           achievements = COALESCE($6, achievements),
           cad_link = COALESCE($7, cad_link),
           code_link = COALESCE($8, code_link)
       WHERE id = $9 
       RETURNING *`,
      [
        year ? parseInt(year) : null,
        name?.trim() || null,
        game?.trim() || null,
        description || null,
        imagePath,
        achievements || null,
        cad_link || null,
        code_link || null,
        id
      ]
    );

    res.json({
      message: 'Robot updated successfully',
      robot: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating robot:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error updating robot' });
  }
});

// Delete robot (maintenance access required)
router.delete('/:id', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { id } = req.params;

    // Get robot to delete associated image
    const robotResult = await pool.query('SELECT * FROM robots WHERE id = $1', [id]);
    
    if (robotResult.rows.length === 0) {
      return res.status(404).json({ message: 'Robot not found' });
    }

    const robot = robotResult.rows[0];

    // Delete associated image file
    if (robot.image_path && robot.image_path.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../../frontend/public', robot.image_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete robot from database
    await pool.query('DELETE FROM robots WHERE id = $1', [id]);

    res.json({ message: 'Robot deleted successfully' });
  } catch (error) {
    console.error('Error deleting robot:', error);
    res.status(500).json({ message: 'Server error deleting robot' });
  }
});

export default router;