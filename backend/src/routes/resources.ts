import { Router } from 'express';
import pool from '../config/database';
import { authenticate, requireMaintenanceAccess, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all resource categories with their resources
router.get('/', async (req, res) => {
  try {
    const categoriesResult = await pool.query(
      'SELECT * FROM resource_categories WHERE is_active = true ORDER BY display_order, name'
    );

    const categories = [];
    for (const category of categoriesResult.rows) {
      const resourcesResult = await pool.query(
        'SELECT * FROM resources WHERE category_id = $1 AND is_active = true ORDER BY display_order, title',
        [category.id]
      );
      
      categories.push({
        ...category,
        resources: resourcesResult.rows
      });
    }

    res.json(categories);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Server error fetching resources' });
  }
});

// Get resources by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const result = await pool.query(
      'SELECT * FROM resources WHERE category_id = $1 AND is_active = true ORDER BY display_order, title',
      [categoryId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching resources by category:', error);
    res.status(500).json({ message: 'Server error fetching resources' });
  }
});

// Create new resource category
router.post('/categories', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { name, description, display_order } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const result = await pool.query(
      `INSERT INTO resource_categories (name, description, display_order)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), description, display_order || 0]
    );

    res.status(201).json({
      message: 'Resource category created successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating resource category:', error);
    res.status(500).json({ message: 'Server error creating resource category' });
  }
});

// Create new resource
router.post('/', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { title, description, url, file_path, category_id, display_order } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Resource title is required' });
    }

    if (!category_id) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO resources (title, description, url, file_path, category_id, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title.trim(), description, url, file_path, category_id, display_order || 0]
    );

    res.status(201).json({
      message: 'Resource created successfully',
      resource: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ message: 'Server error creating resource' });
  }
});

// Update resource
router.put('/:id', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    const values = fields.map(field => updates[field]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await pool.query(
      `UPDATE resources SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({
      message: 'Resource updated successfully',
      resource: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ message: 'Server error updating resource' });
  }
});

// Update resource category
router.put('/categories/:id', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    const values = fields.map(field => updates[field]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await pool.query(
      `UPDATE resource_categories SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Resource category not found' });
    }

    res.json({
      message: 'Resource category updated successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating resource category:', error);
    res.status(500).json({ message: 'Server error updating resource category' });
  }
});

// Delete resource
router.delete('/:id', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM resources WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: 'Server error deleting resource' });
  }
});

// Delete resource category
router.delete('/categories/:id', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has resources
    const resourcesCheck = await pool.query('SELECT id FROM resources WHERE category_id = $1 LIMIT 1', [id]);
    if (resourcesCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Cannot delete category with existing resources' });
    }

    const result = await pool.query('DELETE FROM resource_categories WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Resource category not found' });
    }

    res.json({ message: 'Resource category deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource category:', error);
    res.status(500).json({ message: 'Server error deleting resource category' });
  }
});

// Proposal routes for students with maintenance access
router.post('/propose', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { change_type, target_id, target_table, proposed_data, description } = req.body;
    const user_id = req.user?.userId;

    // Check if user has maintenance access
    const userCheck = await pool.query('SELECT maintenance_access FROM users WHERE id = $1', [user_id]);
    if (!userCheck.rows[0]?.maintenance_access) {
      return res.status(403).json({ message: 'Maintenance access required' });
    }

    const result = await pool.query(
      `INSERT INTO proposed_changes (user_id, change_type, target_table, target_id, proposed_data, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, change_type, target_table || 'resources', target_id, JSON.stringify(proposed_data), description]
    );

    res.status(201).json({
      message: 'Resource change proposal submitted successfully',
      proposal: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating resource proposal:', error);
    res.status(500).json({ message: 'Server error creating resource proposal' });
  }
});

router.get('/proposals', authenticate, requireMaintenanceAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(`
      SELECT pc.*, u.first_name, u.last_name, u.email
      FROM proposed_changes pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.target_table IN ('resources', 'resource_categories')
      ORDER BY pc.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching resource proposals:', error);
    res.status(500).json({ message: 'Server error fetching resource proposals' });
  }
});

export default router;