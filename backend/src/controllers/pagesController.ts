import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PageModel, CreatePageData, UpdatePageData } from '../models/Page';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAllPages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pages = await PageModel.getAllPages();
    res.json(pages);
  } catch (error) {
    console.error('Get all pages error:', error);
    res.status(500).json({ message: 'Server error fetching pages' });
  }
};

export const getPublishedPages = async (req: Request, res: Response) => {
  try {
    const pages = await PageModel.getPublishedPages();
    res.json(pages);
  } catch (error) {
    console.error('Get published pages error:', error);
    res.status(500).json({ message: 'Server error fetching published pages' });
  }
};

export const getPageBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const page = await PageModel.getPageBySlug(slug);

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Only return published pages for public requests
    if (!page.is_published) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    console.error('Get page by slug error:', error);
    res.status(500).json({ message: 'Server error fetching page' });
  }
};

export const getPageBySlugAuthenticated = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const page = await PageModel.getPageBySlug(slug);

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Authenticated users can see unpublished pages
    res.json(page);
  } catch (error) {
    console.error('Get page by slug (authenticated) error:', error);
    res.status(500).json({ message: 'Server error fetching page' });
  }
};

export const getPageById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const page = await PageModel.getPageById(parseInt(id));

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    console.error('Get page by ID error:', error);
    res.status(500).json({ message: 'Server error fetching page' });
  }
};

export const createPage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slug, title, content, is_published } = req.body;
    const userId = req.user!.userId;

    // Check if slug already exists
    const slugExists = await PageModel.checkSlugExists(slug);
    if (slugExists) {
      return res.status(400).json({ message: 'A page with this slug already exists' });
    }

    const pageData: CreatePageData = {
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
      title,
      content,
      is_published: is_published || false
    };

    const page = await PageModel.createPage(pageData, userId);

    res.status(201).json({
      message: 'Page created successfully',
      page
    });
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ message: 'Server error creating page' });
  }
};

export const updatePage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { slug, title, content, is_published } = req.body;
    const userId = req.user!.userId;

    const pageId = parseInt(id);
    const existingPage = await PageModel.getPageById(pageId);

    if (!existingPage) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Check if slug already exists (excluding current page)
    if (slug && slug !== existingPage.slug) {
      const slugExists = await PageModel.checkSlugExists(slug, pageId);
      if (slugExists) {
        return res.status(400).json({ message: 'A page with this slug already exists' });
      }
    }

    const pageData: UpdatePageData = {};
    if (slug !== undefined) pageData.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    if (title !== undefined) pageData.title = title;
    if (content !== undefined) pageData.content = content;
    if (is_published !== undefined) pageData.is_published = is_published;

    const updatedPage = await PageModel.updatePage(pageId, pageData, userId);

    res.json({
      message: 'Page updated successfully',
      page: updatedPage
    });
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ message: 'Server error updating page' });
  }
};

export const deletePage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pageId = parseInt(id);

    const existingPage = await PageModel.getPageById(pageId);
    if (!existingPage) {
      return res.status(404).json({ message: 'Page not found' });
    }

    const deleted = await PageModel.deletePage(pageId);
    
    if (deleted) {
      res.json({ message: 'Page deleted successfully' });
    } else {
      res.status(500).json({ message: 'Failed to delete page' });
    }
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ message: 'Server error deleting page' });
  }
};

export const publishPage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const pageId = parseInt(id);

    const page = await PageModel.publishPage(pageId, userId);
    
    if (page) {
      res.json({ message: 'Page published successfully', page });
    } else {
      res.status(404).json({ message: 'Page not found' });
    }
  } catch (error) {
    console.error('Publish page error:', error);
    res.status(500).json({ message: 'Server error publishing page' });
  }
};

export const unpublishPage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const pageId = parseInt(id);

    const page = await PageModel.unpublishPage(pageId, userId);
    
    if (page) {
      res.json({ message: 'Page unpublished successfully', page });
    } else {
      res.status(404).json({ message: 'Page not found' });
    }
  } catch (error) {
    console.error('Unpublish page error:', error);
    res.status(500).json({ message: 'Server error unpublishing page' });
  }
};