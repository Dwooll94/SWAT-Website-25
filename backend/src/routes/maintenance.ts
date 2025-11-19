import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { UserModel } from '../models/User';

const router = Router();

// Configure multer for proposed change uploads
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const { change_type } = req.body;
    let uploadDir;
    
    if (change_type === 'robot' || change_type === 'robot_delete') {
      uploadDir = path.join(__dirname, '../../../frontend/public/uploads/proposals/robots');
    } else {
      uploadDir = path.join(__dirname, '../../../frontend/public/uploads/proposals');
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const { change_type } = req.body;
    
    if (change_type === 'robot' || change_type === 'robot_delete') {
      cb(null, `robot-proposal-${uniqueSuffix}${path.extname(file.originalname)}`);
    } else {
      cb(null, `proposal-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
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

// Configure multer for page images
const pageImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../frontend/public/uploads/pages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `page-image-${timestamp}-${sanitizedName}`);
  }
});

const pageImageUpload = multer({
  storage: pageImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed'));
    }
  }
});

// Get all proposed changes (for mentors/admins)
router.get('/proposals', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only mentors and admins can view all proposals
    if (currentUser.role !== 'admin' && currentUser.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Only mentors and admins can view proposals.' });
    }

    const result = await pool.query(`
      SELECT 
        p.*,
        u.first_name || ' ' || u.last_name as proposed_by_name,
        ru.first_name || ' ' || ru.last_name as reviewed_by_name
      FROM proposed_changes p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users ru ON p.reviewed_by = ru.id
      ORDER BY 
        CASE WHEN p.status = 'pending' THEN 0 ELSE 1 END,
        p.created_at DESC
    `);

    // Parse the proposed_data JSON for each row
    const processedRows = result.rows.map(row => ({
      ...row,
      proposed_data: typeof row.proposed_data === 'string' ? JSON.parse(row.proposed_data) : row.proposed_data
    }));
    
    res.json(processedRows);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ message: 'Server error fetching proposals' });
  }
});

// Upload image for pages
router.post('/upload-page-image', authenticate, pageImageUpload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const webPath = `/uploads/pages/${req.file.filename}`;
    const markdownEmbed = `![Image description](${webPath})`;
    
    res.json({
      message: 'Image uploaded successfully',
      file_path: webPath,
      markdown: markdownEmbed,
      filename: req.file.filename,
      original_name: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading page image:', error);
    res.status(500).json({ message: 'Server error uploading image' });
  }
});

// Get uploaded page images
router.get('/page-images', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../../../frontend/public/uploads/pages');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ images: [] });
    }

    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });

    const images = imageFiles.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      const webPath = `/uploads/pages/${filename}`;
      
      return {
        filename,
        web_path: webPath,
        markdown: `![Image description](${webPath})`,
        size: stats.size,
        uploaded_at: stats.birthtime,
        original_name: filename.replace(/^page-image-\d+-/, '')
      };
    });

    // Sort by upload date, newest first
    images.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());

    res.json({ images });
  } catch (error) {
    console.error('Error fetching page images:', error);
    res.status(500).json({ message: 'Server error fetching images' });
  }
});

// Delete page image
router.delete('/page-images/:filename', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { filename } = req.params;
    
    // Security check: ensure filename only contains safe characters
    if (!/^page-image-\d+-[a-zA-Z0-9._-]+$/.test(filename)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    const filePath = path.join(__dirname, '../../../frontend/public/uploads/pages', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting page image:', error);
    res.status(500).json({ message: 'Server error deleting image' });
  }
});

// Propose a change (students can use this)
router.post('/propose', authenticate, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { change_type, target_table, target_id, description, slot, caption, year, name, game, achievements, sponsor_name, sponsor_url, sponsor_tier, resource_title, resource_description, resource_url, resource_file_path, category_id, category_name, category_description, subteam_name, subteam_description, is_primary, display_order, proposed_data } = req.body;

    if (change_type === 'slideshow_image') {
      // Handle slideshow image proposals
      if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded' });
      }

      const slotNumber = parseInt(slot);
      if (!slot || isNaN(slotNumber) || slotNumber < 1 || slotNumber > 8) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Valid slot number (1-8) is required' });
      }

      const webPath = `/uploads/proposals/${req.file.filename}`;
      const proposedData = {
        slot: slotNumber,
        file_path: webPath,
        caption: caption || `Slide ${slotNumber}`
      };

      const result = await pool.query(`
        INSERT INTO proposed_changes (
          user_id, change_type, target_table, proposed_data, status, description
        ) VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *
      `, [
        currentUser.id,
        'slideshow_image',
        'slideshow_images',
        JSON.stringify(proposedData),
        description || `Proposed slideshow image change for slot ${slotNumber}`
      ]);

      return res.status(201).json({
        message: 'Change proposed successfully and is awaiting review',
        proposal: result.rows[0]
      });
    }

    if (change_type === 'robot' || change_type === 'robot_delete') {
      // Handle robot proposals
      if (!year || !name || !game) {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: 'Year, name, and game are required for robot proposals' });
      }

      let proposedData: any = {
        year: parseInt(year),
        name: name.trim(),
        game: game.trim(),
        robot_description: req.body.description[0] || null,
        achievements: achievements || null,
        cad_link: req.body.cad_link || null,
        code_link: req.body.code_link || null
      };

      if (req.file) {
        const webPath = `/uploads/proposals/robots/${req.file.filename}`;
        proposedData.image_path = webPath;
      }

      const result = await pool.query(`
        INSERT INTO proposed_changes (
          user_id, change_type, target_table, target_id, proposed_data, status, description
        ) VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *
      `, [
        currentUser.id,
        change_type,
        target_table || 'robots',
        target_id ? parseInt(target_id) : null,
        JSON.stringify(proposedData),
        description || `Proposed robot ${change_type === 'robot_delete' ? 'deletion' : 'change'}`
      ]);

      return res.status(201).json({
        message: 'Robot change proposed successfully and is awaiting review',
        proposal: result.rows[0]
      });
    }

    if (change_type === 'resource' || change_type === 'resource_delete' || change_type === 'resource_category' || change_type === 'resource_category_delete') {
      // Handle resource and resource category proposals
      let proposedData: any = {};

      if (change_type === 'resource') {
        if (!resource_title || !category_id) {
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({ message: 'Resource title and category are required' });
        }

        proposedData = {
          title: resource_title.trim(),
          description: resource_description,
          url: resource_url,
          file_path: resource_file_path,
          category_id: parseInt(category_id),
          display_order: parseInt(req.body.display_order) || 0
        };
      } else if (change_type === 'resource_category') {
        if (!category_name) {
          return res.status(400).json({ message: 'Category name is required' });
        }

        proposedData = {
          name: category_name.trim(),
          description: category_description,
          display_order: parseInt(req.body.display_order) || 0
        };
      }

      const result = await pool.query(`
        INSERT INTO proposed_changes (
          user_id, change_type, target_table, target_id, proposed_data, status, description
        ) VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *
      `, [
        currentUser.id,
        change_type,
        change_type.includes('category') ? 'resource_categories' : 'resources',
        target_id ? parseInt(target_id) : null,
        JSON.stringify(proposedData),
        description || `Proposed ${change_type.replace('_', ' ')}`
      ]);

      return res.status(201).json({
        message: 'Resource change proposed successfully and is awaiting review',
        proposal: result.rows[0]
      });
    }

    if (change_type === 'sponsor' || change_type === 'sponsor_delete') {
      // Handle sponsor proposals
      if (change_type === 'sponsor' && (!sponsor_name || !sponsor_tier)) {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: 'Sponsor name and tier are required for sponsor proposals' });
      }

      let proposedData: any = {};

      if (change_type === 'sponsor') {
        proposedData = {
          name: sponsor_name.trim(),
          tier: sponsor_tier,
          website_url: sponsor_url || null,
          display_order: parseInt(req.body.display_order) || 0
        };

        if (req.file) {
          const webPath = `/uploads/proposals/${req.file.filename}`;
          proposedData.logo_path = webPath;
        }
      }

      const result = await pool.query(`
        INSERT INTO proposed_changes (
          user_id, change_type, target_table, target_id, proposed_data, status, description
        ) VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *
      `, [
        currentUser.id,
        change_type,
        target_table || 'sponsors',
        target_id ? parseInt(target_id) : null,
        JSON.stringify(proposedData),
        description || `Proposed sponsor ${change_type === 'sponsor_delete' ? 'deletion' : 'change'}`
      ]);

      return res.status(201).json({
        message: 'Sponsor change proposed successfully and is awaiting review',
        proposal: result.rows[0]
      });
    }

    if (change_type === 'subteam_create' || change_type === 'subteam_update' || change_type === 'subteam_delete') {
      // Handle subteam proposals
      let processedData = proposed_data;

      if (change_type === 'subteam_create' || change_type === 'subteam_update') {
        // Validate required fields for create/update
        if (!processedData || !processedData.name) {
          return res.status(400).json({ message: 'Subteam name is required' });
        }

        // Ensure data consistency
        processedData = {
          name: processedData.name.trim(),
          description: processedData.description || null,
          is_primary: processedData.is_primary === true || processedData.is_primary === 'true',
          display_order: parseInt(processedData.display_order) || 0
        };
      }

      const result = await pool.query(`
        INSERT INTO proposed_changes (
          user_id, change_type, target_table, target_id, proposed_data, status, description
        ) VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *
      `, [
        currentUser.id,
        change_type,
        'subteams',
        target_id ? parseInt(target_id) : null,
        JSON.stringify(processedData),
        description || `Proposed subteam ${change_type === 'subteam_delete' ? 'deletion' : change_type === 'subteam_update' ? 'update' : 'creation'}`
      ]);

      return res.status(201).json({
        message: 'Subteam change proposed successfully and is awaiting review',
        proposal: result.rows[0]
      });
    }

    if (change_type === 'page' || change_type === 'page_delete') {
      // Handle page proposals
      let processedData = proposed_data;

      if (change_type === 'page') {
        // Validate required fields for page create/update
        if (!processedData || !processedData.title || !processedData.slug) {
          return res.status(400).json({ message: 'Page title and slug are required' });
        }

        // Ensure data consistency
        processedData = {
          ...processedData,
          slug: processedData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
          is_published: !!processedData.is_published
        };
      }

      const result = await pool.query(`
        INSERT INTO proposed_changes (
          user_id, change_type, target_table, target_id, proposed_data, status, description
        ) VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *
      `, [
        currentUser.id,
        change_type,
        'pages',
        target_id ? parseInt(target_id) : null,
        JSON.stringify(processedData),
        description || `Proposed page ${change_type === 'page_delete' ? 'deletion' : (target_id ? 'update' : 'creation')}`
      ]);

      return res.status(201).json({
        message: 'Page change proposed successfully and is awaiting review',
        proposal: result.rows[0]
      });
    }

    // If we get here, it's an unsupported change type
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: 'Unsupported change type' });

  } catch (error) {
    console.error('Error creating proposal:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error creating proposal' });
  }
});

// Approve or reject a proposal
router.put('/proposals/:id/:action', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id, action } = req.params;
    const { notes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject"' });
    }

    const currentUser = await UserModel.findById(req.user!.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only mentors and admins can approve/reject
    if (currentUser.role !== 'admin' && currentUser.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Only mentors and admins can review proposals.' });
    }

    // Get the proposal
    const proposalResult = await pool.query(
      'SELECT * FROM proposed_changes WHERE id = $1 AND status = \'pending\'',
      [id]
    );

    if (proposalResult.rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found or already processed' });
    }

    const proposal = proposalResult.rows[0];

    if (action === 'approve') {
      // Apply the proposed change
      const proposedData = typeof proposal.proposed_data === 'string' 
        ? JSON.parse(proposal.proposed_data) 
        : proposal.proposed_data;
      
      if (proposal.change_type === 'slideshow_image') {
        // Move the file from proposals to slideshow directory
        const proposalsPath = path.join(__dirname, '../../../frontend/public/uploads/proposals');
        const slideshowPath = path.join(__dirname, '../../../frontend/public/uploads/slideshow');
        
        if (!fs.existsSync(slideshowPath)) {
          fs.mkdirSync(slideshowPath, { recursive: true });
        }

        const originalFilename = path.basename(proposedData.file_path);
        const newFilename = originalFilename.replace('proposal-', 'slide-');
        const oldFilePath = path.join(proposalsPath, originalFilename);
        const newFilePath = path.join(slideshowPath, newFilename);

        if (fs.existsSync(oldFilePath)) {
          fs.renameSync(oldFilePath, newFilePath);
        }

        const newWebPath = `/uploads/slideshow/${newFilename}`;

        // Check if an image already exists in this slot and delete it
        const existingResult = await pool.query(
          'SELECT id, file_path FROM slideshow_images WHERE display_order = $1',
          [proposedData.slot]
        );

        if (existingResult.rows.length > 0) {
          const oldImage = existingResult.rows[0];
          
          // Delete old image file if it exists and is not a default image
          if (oldImage.file_path && oldImage.file_path.startsWith('/uploads/')) {
            const oldFilePath = path.join(__dirname, '../../../frontend/public', oldImage.file_path);
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }

          // Update existing slot
          await pool.query(
            'UPDATE slideshow_images SET file_path = $1, caption = $2, updated_at = CURRENT_TIMESTAMP WHERE display_order = $3',
            [newWebPath, proposedData.caption, proposedData.slot]
          );
        } else {
          // Create new slot
          await pool.query(
            'INSERT INTO slideshow_images (file_path, display_order, is_active, caption) VALUES ($1, $2, true, $3)',
            [newWebPath, proposedData.slot, proposedData.caption]
          );
        }
      } else if (proposal.change_type === 'robot') {
        // Handle robot creation/update
        let imagePath = null;
        
        if (proposedData.image_path) {
          // Move the image from proposals to robots directory
          const proposalsPath = path.join(__dirname, '../../../frontend/public/uploads/proposals/robots');
          const robotsPath = path.join(__dirname, '../../../frontend/public/uploads/robots');
          
          if (!fs.existsSync(robotsPath)) {
            fs.mkdirSync(robotsPath, { recursive: true });
          }

          const originalFilename = path.basename(proposedData.image_path);
          const newFilename = originalFilename.replace('robot-proposal-', 'robot-');
          const oldFilePath = path.join(proposalsPath, originalFilename);
          const newFilePath = path.join(robotsPath, newFilename);

          if (fs.existsSync(oldFilePath)) {
            fs.renameSync(oldFilePath, newFilePath);
            imagePath = `/uploads/robots/${newFilename}`;
          }
        }

        if (proposal.target_id) {
          // Update existing robot
          const existingResult = await pool.query('SELECT * FROM robots WHERE id = $1', [proposal.target_id]);
          if (existingResult.rows.length > 0) {
            const existingRobot = existingResult.rows[0];
            
            // Delete old image if being replaced
            if (imagePath && existingRobot.image_path && existingRobot.image_path.startsWith('/uploads/')) {
              const oldFilePath = path.join(__dirname, '../../../frontend/public', existingRobot.image_path);
              if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
              }
            }

            await pool.query(
              'UPDATE robots SET year = $1, name = $2, game = $3, description = $4, achievements = $5, image_path = COALESCE($6, image_path), cad_link = $7, code_link = $8 WHERE id = $9',
              [proposedData.year, proposedData.name, proposedData.game, proposedData.robot_description, proposedData.achievements, imagePath, proposedData.cad_link || null, proposedData.code_link || null, proposal.target_id]
            );
          }
        } else {
          // Create new robot
          await pool.query(
            'INSERT INTO robots (year, name, game, description, achievements, image_path, cad_link, code_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [proposedData.year, proposedData.name, proposedData.game, proposedData.robot_description, proposedData.achievements, imagePath, proposedData.cad_link || null, proposedData.code_link || null]
          );
        }
      } else if (proposal.change_type === 'robot_delete') {
        // Handle robot deletion
        if (proposal.target_id) {
          const robotResult = await pool.query('SELECT * FROM robots WHERE id = $1', [proposal.target_id]);
          if (robotResult.rows.length > 0) {
            const robot = robotResult.rows[0];
            
            // Delete associated image file
            if (robot.image_path && robot.image_path.startsWith('/uploads/')) {
              const filePath = path.join(__dirname, '../../../frontend/public', robot.image_path);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }

            await pool.query('DELETE FROM robots WHERE id = $1', [proposal.target_id]);
          }
        }
      } else if (proposal.change_type === 'sponsor') {
        // Handle sponsor creation/update
        let logoPath = null;
        
        if (proposedData.logo_path) {
          // Move the image from proposals to sponsors directory
          const proposalsPath = path.join(__dirname, '../../../frontend/public/uploads/proposals');
          const sponsorsPath = path.join(__dirname, '../../../frontend/public/uploads/sponsors');
          
          if (!fs.existsSync(sponsorsPath)) {
            fs.mkdirSync(sponsorsPath, { recursive: true });
          }

          const originalFilename = path.basename(proposedData.logo_path);
          const newFilename = originalFilename.replace('proposal-', 'sponsor-');
          const oldFilePath = path.join(proposalsPath, originalFilename);
          const newFilePath = path.join(sponsorsPath, newFilename);

          if (fs.existsSync(oldFilePath)) {
            fs.renameSync(oldFilePath, newFilePath);
            logoPath = `/uploads/sponsors/${newFilename}`;
          }
        }

        if (proposal.target_id) {
          // Update existing sponsor
          const existingResult = await pool.query('SELECT * FROM sponsors WHERE id = $1', [proposal.target_id]);
          if (existingResult.rows.length > 0) {
            const existingSponsor = existingResult.rows[0];
            
            // Delete old logo if being replaced
            if (logoPath && existingSponsor.logo_path && existingSponsor.logo_path.startsWith('/uploads/')) {
              const oldFilePath = path.join(__dirname, '../../../frontend/public', existingSponsor.logo_path);
              if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
              }
            }

            await pool.query(
              'UPDATE sponsors SET name = $1, tier = $2, website_url = $3, display_order = $4, logo_path = COALESCE($5, logo_path) WHERE id = $6',
              [proposedData.name, proposedData.tier, proposedData.website_url, proposedData.display_order, logoPath, proposal.target_id]
            );
          }
        } else {
          // Create new sponsor
          await pool.query(
            'INSERT INTO sponsors (name, tier, website_url, display_order, logo_path) VALUES ($1, $2, $3, $4, $5)',
            [proposedData.name, proposedData.tier, proposedData.website_url, proposedData.display_order, logoPath]
          );
        }
      } else if (proposal.change_type === 'resource') {
        // Handle resource creation/update
        if (proposal.target_id) {
          // Update existing resource
          await pool.query(
            'UPDATE resources SET title = $1, description = $2, url = $3, file_path = $4, category_id = $5, display_order = $6 WHERE id = $7',
            [proposedData.title, proposedData.description, proposedData.url, proposedData.file_path, proposedData.category_id, proposedData.display_order, proposal.target_id]
          );
        } else {
          // Create new resource
          await pool.query(
            'INSERT INTO resources (title, description, url, file_path, category_id, display_order) VALUES ($1, $2, $3, $4, $5, $6)',
            [proposedData.title, proposedData.description, proposedData.url, proposedData.file_path, proposedData.category_id, proposedData.display_order]
          );
        }
      } else if (proposal.change_type === 'resource_delete') {
        // Handle resource deletion
        if (proposal.target_id) {
          await pool.query('DELETE FROM resources WHERE id = $1', [proposal.target_id]);
        }
      } else if (proposal.change_type === 'resource_category') {
        // Handle resource category creation/update
        if (proposal.target_id) {
          // Update existing category
          await pool.query(
            'UPDATE resource_categories SET name = $1, description = $2, display_order = $3 WHERE id = $4',
            [proposedData.name, proposedData.description, proposedData.display_order, proposal.target_id]
          );
        } else {
          // Create new category
          await pool.query(
            'INSERT INTO resource_categories (name, description, display_order) VALUES ($1, $2, $3)',
            [proposedData.name, proposedData.description, proposedData.display_order]
          );
        }
      } else if (proposal.change_type === 'resource_category_delete') {
        // Handle resource category deletion
        if (proposal.target_id) {
          // First check if there are resources in this category
          const resourcesCheck = await pool.query('SELECT id FROM resources WHERE category_id = $1 LIMIT 1', [proposal.target_id]);
          if (resourcesCheck.rows.length === 0) {
            await pool.query('DELETE FROM resource_categories WHERE id = $1', [proposal.target_id]);
          }
        }
      } else if (proposal.change_type === 'sponsor_delete') {
        // Handle sponsor deletion
        if (proposal.target_id) {
          const sponsorResult = await pool.query('SELECT * FROM sponsors WHERE id = $1', [proposal.target_id]);
          if (sponsorResult.rows.length > 0) {
            const sponsor = sponsorResult.rows[0];
            
            // Delete associated logo file
            if (sponsor.logo_path && sponsor.logo_path.startsWith('/uploads/')) {
              const filePath = path.join(__dirname, '../../../frontend/public', sponsor.logo_path);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }

            await pool.query('DELETE FROM sponsors WHERE id = $1', [proposal.target_id]);
          }
        }
      } else if (proposal.change_type === 'subteam_create') {
        // Handle subteam creation
        await pool.query(
          'INSERT INTO subteams (name, description, is_primary, display_order) VALUES ($1, $2, $3, $4)',
          [proposedData.name, proposedData.description, proposedData.is_primary, proposedData.display_order]
        );
      } else if (proposal.change_type === 'subteam_update') {
        // Handle subteam update
        if (proposal.target_id) {
          await pool.query(
            'UPDATE subteams SET name = $1, description = $2, is_primary = $3, display_order = $4 WHERE id = $5',
            [proposedData.name, proposedData.description, proposedData.is_primary, proposedData.display_order, proposal.target_id]
          );
        }
      } else if (proposal.change_type === 'subteam_delete') {
        // Handle subteam deletion
        if (proposal.target_id) {
          // First check if there are students assigned to this subteam
          const assignmentsCheck = await pool.query('SELECT id FROM student_subteams WHERE subteam_id = $1 LIMIT 1', [proposal.target_id]);
          if (assignmentsCheck.rows.length === 0) {
            // Safe to delete - no student assignments
            await pool.query('DELETE FROM subteams WHERE id = $1', [proposal.target_id]);
          } else {
            // Mark as inactive instead of deleting to preserve data integrity
            await pool.query('UPDATE subteams SET is_active = false WHERE id = $1', [proposal.target_id]);
          }
        }
      } else if (proposal.change_type === 'page') {
        // Handle page creation/update
        if (proposal.target_id) {
          // Update existing page
          await pool.query(
            'UPDATE pages SET slug = $1, title = $2, content = $3, is_published = $4, updated_by = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6',
            [proposedData.slug, proposedData.title, proposedData.content, proposedData.is_published, proposal.requested_by, proposal.target_id]
          );
        } else {
          // Create new page
          await pool.query(
            'INSERT INTO pages (slug, title, content, is_published, created_by) VALUES ($1, $2, $3, $4, $5)',
            [proposedData.slug, proposedData.title, proposedData.content, proposedData.is_published, proposal.requested_by]
          );
        }
      } else if (proposal.change_type === 'page_delete') {
        // Handle page deletion
        if (proposal.target_id) {
          await pool.query('DELETE FROM pages WHERE id = $1', [proposal.target_id]);
        }
      }
    } else if (action === 'reject') {
      // Clean up the proposed file
      const proposedData = typeof proposal.proposed_data === 'string' 
        ? JSON.parse(proposal.proposed_data) 
        : proposal.proposed_data;
        
      if (proposal.change_type === 'slideshow_image') {
        const filePath = path.join(__dirname, '../../../frontend/public', proposedData.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else if (proposal.change_type === 'robot' && proposedData.image_path) {
        // Clean up robot proposal image
        const filePath = path.join(__dirname, '../../../frontend/public', proposedData.image_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else if (proposal.change_type === 'sponsor' && proposedData.logo_path) {
        // Clean up sponsor proposal logo
        const filePath = path.join(__dirname, '../../../frontend/public', proposedData.logo_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      // robot_delete and sponsor_delete proposals don't need file cleanup as they don't have images
    }

    // Update proposal status
    const updateResult = await pool.query(`
      UPDATE proposed_changes 
      SET 
        status = $1, 
        review_comments = $2, 
        reviewed_by = $3, 
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $4 
      RETURNING *
    `, [action === 'approve' ? 'approved' : 'rejected', notes, currentUser.id, id]);

    res.json({
      message: `Proposal ${action}d successfully`,
      proposal: updateResult.rows[0]
    });
  } catch (error) {
    console.error(`Error ${req.params.action}ing proposal:`, error);
    res.status(500).json({ message: `Server error ${req.params.action}ing proposal` });
  }
});

// Admin endpoint to manually trigger registration reset and YOT increment
router.post('/reset-registrations', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

    // Check if user is admin
    const user = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (!user.rows[0] || user.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators can reset registrations.' });
    }

    // Execute registration reset and YOT increment
    await UserModel.resetAugustRegistrations();

    res.json({
      message: 'Student registrations reset to "contract_signed" and Years on Team incremented successfully'
    });
  } catch (error) {
    console.error('Error resetting registrations:', error);
    res.status(500).json({ message: 'Server error resetting registrations' });
  }
});

export default router;