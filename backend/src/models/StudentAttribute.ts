import pool from '../config/database';

export interface StudentAttribute {
  id: string;
  user_id: string;
  attribute_key: string;
  attribute_value: string;
}

export class StudentAttributeModel {
  static async getUserAttributes(userId: string): Promise<StudentAttribute[]> {
    const result = await pool.query(
      'SELECT * FROM student_attributes WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }

  static async getAttribute(userId: string, attributeKey: string): Promise<string | null> {
    const result = await pool.query(
      'SELECT attribute_value FROM student_attributes WHERE user_id = $1 AND attribute_key = $2',
      [userId, attributeKey]
    );
    return result.rows[0]?.attribute_value || null;
  }

  static async setAttribute(userId: string, attributeKey: string, attributeValue: string): Promise<void> {
    // First try to update existing attribute
    const updateResult = await pool.query(
      'UPDATE student_attributes SET attribute_value = $3 WHERE user_id = $1 AND attribute_key = $2',
      [userId, attributeKey, attributeValue]
    );
    
    // If no rows were updated, insert new attribute
    if (updateResult.rowCount === 0) {
      await pool.query(
        'INSERT INTO student_attributes (user_id, attribute_key, attribute_value) VALUES ($1, $2, $3)',
        [userId, attributeKey, attributeValue]
      );
    }
  }

  static async removeAttribute(userId: string, attributeKey: string): Promise<void> {
    await pool.query(
      'DELETE FROM student_attributes WHERE user_id = $1 AND attribute_key = $2',
      [userId, attributeKey]
    );
  }

  static async getAttributesByKey(attributeKey: string): Promise<StudentAttribute[]> {
    const result = await pool.query(
      'SELECT * FROM student_attributes WHERE attribute_key = $1',
      [attributeKey]
    );
    return result.rows;
  }

  static async getUsersWithAttribute(attributeKey: string, attributeValue?: string): Promise<string[]> {
    let query = 'SELECT user_id FROM student_attributes WHERE attribute_key = $1';
    const params: any[] = [attributeKey];
    
    if (attributeValue !== undefined) {
      query += ' AND attribute_value = $2';
      params.push(attributeValue);
    }
    
    const result = await pool.query(query, params);
    return result.rows.map(row => row.user_id);
  }

  // Convenience methods for isCoreLeadership
  static async isCoreLeadership(userId: string): Promise<boolean> {
    const value = await this.getAttribute(userId, 'isCoreLeadership');
    return value === 'true';
  }

  static async setCoreLeadership(userId: string, isCore: boolean): Promise<void> {
    if (isCore) {
      await this.setAttribute(userId, 'isCoreLeadership', 'true');
    } else {
      await this.removeAttribute(userId, 'isCoreLeadership');
    }
  }

  static async getCoreLeadershipUsers(): Promise<string[]> {
    return this.getUsersWithAttribute('isCoreLeadership', 'true');
  }
}