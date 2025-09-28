/**
 * Utility functions for handling JSON data to prevent double-escaping issues
 */

/**
 * Cleans an object to ensure it's properly serializable for PostgreSQL JSONB
 * This prevents double-escaping issues by ensuring objects are plain JavaScript objects
 * @param obj - The object to clean
 * @returns A clean, serializable object
 */
export function cleanJsonObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanJsonObject) as unknown as T;
  }

  if (typeof obj === 'object' && obj !== null) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanJsonObject(value);
    }
    return cleaned;
  }

  return obj;
}

/**
 * Safely handles JSON objects for database insertion
 * @param data - The data that might contain JSON objects
 * @returns Clean data ready for database insertion
 */
export function prepareForDatabase<T extends Record<string, any>>(data: T): T {
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      cleaned[key] = value;
    } else if (typeof value === 'object') {
      // Clean the object to prevent double-escaping
      cleaned[key] = cleanJsonObject(value);
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Validates that a value is a proper array (not a stringified array)
 * @param value - The value to check
 * @returns A proper array or empty array if invalid
 */
export function ensureArray<T>(value: any): T[] {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return [];
  }
  
  // Already an array - return clean copy
  if (Array.isArray(value)) {
    return value.map(cleanJsonObject);
  }
  
  // String that might be JSON array
  if (typeof value === 'string') {
    if (value.trim() === '') {
      return [];
    }
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(cleanJsonObject) : [];
    } catch {
      return [];
    }
  }
  
  return [];
}

/**
 * Validates that a value is a proper object (not a stringified object)
 * @param value - The value to check
 * @returns A proper object or undefined if invalid
 */
export function ensureObject<T>(value: any): T | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    return cleanJsonObject(value);
  }
  
  if (typeof value === 'string') {
    if (value.trim() === '' || value === '{}') {
      return undefined;
    }
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null 
        ? cleanJsonObject(parsed) 
        : undefined;
    } catch {
      return undefined;
    }
  }
  
  return undefined;
}

/**
 * Safely converts any value to a database-safe format
 * Specifically handles the double-escaping issue with PostgreSQL JSONB
 * @param value - The value to make database safe
 * @returns A value safe for database insertion
 */
export function makeDatabaseSafe(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  // If it's already a string that looks like JSON, parse it first
  if (typeof value === 'string') {
    // Check if it looks like a JSON string
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(value);
        return cleanJsonObject(parsed);
      } catch {
        // If parsing fails, return as-is
        return value;
      }
    }
    return value;
  }

  // For objects and arrays, clean them
  if (typeof value === 'object') {
    return cleanJsonObject(value);
  }

  return value;
}