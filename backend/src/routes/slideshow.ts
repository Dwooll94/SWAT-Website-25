import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/database';
import { authenticate, requireMaintenanceAccess } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../frontend/public/uploads/slideshow');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `slide-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 5MB limit
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

// Get all active slideshow images
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM slideshow_images WHERE is_active = true ORDER BY display_order, created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching slideshow images:', error);
    res.status(500).json({ message: 'Server error fetching slideshow images' });
  }
});

// Create new slideshow image
router.post('/', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { file_path, caption, display_order } = req.body;

    if (!file_path || file_path.trim().length === 0) {
      return res.status(400).json({ message: 'Image file path is required' });
    }

    const result = await pool.query(
      `INSERT INTO slideshow_images (file_path, caption, display_order)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [file_path.trim(), caption, display_order || 0]
    );

    res.status(201).json({
      message: 'Slideshow image created successfully',
      image: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating slideshow image:', error);
    res.status(500).json({ message: 'Server error creating slideshow image' });
  }
});

// Update slideshow image
router.put('/:id', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    const values = fields.map(field => updates[field]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await pool.query(
      `UPDATE slideshow_images SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Slideshow image not found' });
    }

    res.json({
      message: 'Slideshow image updated successfully',
      image: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating slideshow image:', error);
    res.status(500).json({ message: 'Server error updating slideshow image' });
  }
});

// Delete slideshow image
router.delete('/:id', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM slideshow_images WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Slideshow image not found' });
    }

    res.json({ message: 'Slideshow image deleted successfully' });
  } catch (error) {
    console.error('Error deleting slideshow image:', error);
    res.status(500).json({ message: 'Server error deleting slideshow image' });
  }
});

// Upload slideshow image
router.post('/upload', authenticate, requireMaintenanceAccess, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const { slot, caption } = req.body;
    const slotNumber = parseInt(slot);

    if (!slot || isNaN(slotNumber) || slotNumber < 1 || slotNumber > 8) {
      // Clean up uploaded file if slot is invalid
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Valid slot number (1-8) is required' });
    }

    // Generate the web-accessible path
    const webPath = `/uploads/slideshow/${req.file.filename}`;

    // Check if an image already exists in this slot
    const existingResult = await pool.query(
      'SELECT id, file_path FROM slideshow_images WHERE display_order = $1',
      [slotNumber]
    );

    if (existingResult.rows.length > 0) {
      // Update existing slot
      const oldImage = existingResult.rows[0];
      
      // Delete old image file if it exists and is not a default image
      if (oldImage.file_path && oldImage.file_path.startsWith('/uploads/')) {
        const oldFilePath = path.join(__dirname, '../../../frontend/public', oldImage.file_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      const result = await pool.query(
        'UPDATE slideshow_images SET file_path = $1, caption = $2, created_at = CURRENT_TIMESTAMP WHERE display_order = $3 RETURNING *',
        [webPath, caption || `Slide ${slotNumber}`, slotNumber]
      );

      res.json({
        message: `Slideshow image updated successfully in slot ${slotNumber}`,
        image: result.rows[0]
      });
    } else {
      // Create new slot
      const result = await pool.query(
        `INSERT INTO slideshow_images (file_path, display_order, is_active, caption)
         VALUES ($1, $2, true, $3)
         RETURNING *`,
        [webPath, slotNumber, caption || `Slide ${slotNumber}`]
      );

      res.json({
        message: `Slideshow image uploaded successfully to slot ${slotNumber}`,
        image: result.rows[0]
      });
    }
  } catch (error) {
    console.error('Error uploading slideshow image:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error uploading slideshow image' });
  }
});

export default router;