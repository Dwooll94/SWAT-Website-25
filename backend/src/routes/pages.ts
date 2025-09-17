import { Router } from 'express';
import { body } from 'express-validator';
import { 
  getAllPages, 
  getPublishedPages, 
  getPageBySlug, 
  getPageBySlugAuthenticated,
  getPageById,
  createPage, 
  updatePage, 
  deletePage, 
  publishPage, 
  unpublishPage 
} from '../controllers/pagesController';
import { authenticate } from '../middleware/auth';

const router = Router();

const pageValidation = [
  body('slug')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Slug must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Slug can only contain letters, numbers, and hyphens'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string'),
  body('is_published')
    .optional()
    .isBoolean()
    .withMessage('Published status must be a boolean')
];

const updatePageValidation = [
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Slug must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Slug can only contain letters, numbers, and hyphens'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string'),
  body('is_published')
    .optional()
    .isBoolean()
    .withMessage('Published status must be a boolean')
];

// Public routes
router.get('/published', getPublishedPages);
router.get('/slug/:slug', getPageBySlug);

// Protected routes (require authentication)
router.get('/', authenticate, getAllPages);
router.get('/slug-auth/:slug', authenticate, getPageBySlugAuthenticated);
router.get('/:id', authenticate, getPageById);
router.post('/', authenticate, pageValidation, createPage);
router.put('/:id', authenticate, updatePageValidation, updatePage);
router.delete('/:id', authenticate, deletePage);
router.patch('/:id/publish', authenticate, publishPage);
router.patch('/:id/unpublish', authenticate, unpublishPage);

export default router;