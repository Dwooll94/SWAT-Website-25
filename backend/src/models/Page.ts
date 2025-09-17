import pool from '../config/database';

export interface Page {
  id: number;
  slug: string;
  title: string;
  content?: string;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
  created_by_name?: string;
  updated_by_name?: string;
}

export interface CreatePageData {
  slug: string;
  title: string;
  content?: string;
  is_published?: boolean;
}

export interface UpdatePageData {
  slug?: string;
  title?: string;
  content?: string;
  is_published?: boolean;
}

export class PageModel {
  static async createPage(pageData: CreatePageData, userId: string): Promise<Page> {
    const result = await pool.query(
      `INSERT INTO pages (slug, title, content, is_published, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $5)
       RETURNING *`,
      [
        pageData.slug,
        pageData.title,
        pageData.content || '',
        pageData.is_published || false,
        userId
      ]
    );

    return result.rows[0];
  }

  static async getAllPages(): Promise<Page[]> {
    const result = await pool.query(`
      SELECT p.*, 
             u1.first_name || ' ' || u1.last_name AS created_by_name,
             u2.first_name || ' ' || u2.last_name AS updated_by_name
      FROM pages p
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      ORDER BY p.updated_at DESC
    `);

    return result.rows;
  }

  static async getPublishedPages(): Promise<Page[]> {
    const result = await pool.query(`
      SELECT p.*, 
             u1.first_name || ' ' || u1.last_name AS created_by_name,
             u2.first_name || ' ' || u2.last_name AS updated_by_name
      FROM pages p
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      WHERE p.is_published = true
      ORDER BY p.updated_at DESC
    `);

    return result.rows;
  }

  static async getPageBySlug(slug: string): Promise<Page | null> {
    const result = await pool.query(`
      SELECT p.*, 
             u1.first_name || ' ' || u1.last_name AS created_by_name,
             u2.first_name || ' ' || u2.last_name AS updated_by_name
      FROM pages p
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      WHERE p.slug = $1
    `, [slug]);

    return result.rows[0] || null;
  }

  static async getPageById(id: number): Promise<Page | null> {
    const result = await pool.query(`
      SELECT p.*, 
             u1.first_name || ' ' || u1.last_name AS created_by_name,
             u2.first_name || ' ' || u2.last_name AS updated_by_name
      FROM pages p
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      WHERE p.id = $1
    `, [id]);

    return result.rows[0] || null;
  }

  static async updatePage(id: number, pageData: UpdatePageData, userId: string): Promise<Page | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(pageData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return this.getPageById(id);
    }

    updateFields.push(`updated_by = $${paramCount}`, `updated_at = CURRENT_TIMESTAMP`);
    values.push(userId, id);

    const query = `UPDATE pages SET ${updateFields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async deletePage(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM pages WHERE id = $1', [id]);
    return result.rowCount? result.rowCount > 0 : false;
  }

  static async checkSlugExists(slug: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT id FROM pages WHERE slug = $1';
    const params = [slug];

    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId.toString());
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0;
  }

  static async publishPage(id: number, userId: string): Promise<Page | null> {
    const result = await pool.query(`
      UPDATE pages 
      SET is_published = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `, [userId, id]);

    return result.rows[0] || null;
  }

  static async unpublishPage(id: number, userId: string): Promise<Page | null> {
    const result = await pool.query(`
      UPDATE pages 
      SET is_published = false, updated_by = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `, [userId, id]);

    return result.rows[0] || null;
  }
}