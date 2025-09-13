import { Router } from 'express';
import { SubteamModel } from '../models/Subteam';
import { authenticate, requireMaintenanceAccess } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const subteams = await SubteamModel.getActiveSubteams();
    res.json(subteams);
  } catch (error) {
    console.error('Error fetching subteams:', error);
    res.status(500).json({ message: 'Server error fetching subteams' });
  }
});

router.get('/primary', async (req, res) => {
  try {
    const subteams = await SubteamModel.getPrimarySubteams();
    res.json(subteams);
  } catch (error) {
    console.error('Error fetching primary subteams:', error);
    res.status(500).json({ message: 'Server error fetching primary subteams' });
  }
});

router.get('/secondary', async (req, res) => {
  try {
    const subteams = await SubteamModel.getSecondarySubteams();
    res.json(subteams);
  } catch (error) {
    console.error('Error fetching secondary subteams:', error);
    res.status(500).json({ message: 'Server error fetching secondary subteams' });
  }
});

router.post('/', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { name, description, is_primary, display_order } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Subteam name is required' });
    }

    const subteam = await SubteamModel.createSubteam(
      name.trim(),
      description?.trim(),
      is_primary ?? true,
      display_order ?? 0
    );

    res.status(201).json({
      message: 'Subteam created successfully',
      subteam
    });
  } catch (error) {
    console.error('Error creating subteam:', error);
    res.status(500).json({ message: 'Server error creating subteam' });
  }
});

router.put('/:id', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const subteam = await SubteamModel.updateSubteam(parseInt(id), updates);
    
    if (!subteam) {
      return res.status(404).json({ message: 'Subteam not found' });
    }

    res.json({
      message: 'Subteam updated successfully',
      subteam
    });
  } catch (error) {
    console.error('Error updating subteam:', error);
    res.status(500).json({ message: 'Server error updating subteam' });
  }
});

router.delete('/:id', authenticate, requireMaintenanceAccess, async (req, res) => {
  try {
    const { id } = req.params;

    await SubteamModel.deleteSubteam(parseInt(id));
    
    res.json({ message: 'Subteam deleted successfully' });
  } catch (error) {
    console.error('Error deleting subteam:', error);
    res.status(500).json({ message: 'Server error deleting subteam' });
  }
});

export default router;