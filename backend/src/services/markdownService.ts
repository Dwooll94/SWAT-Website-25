import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { gfmHeadingId} from 'marked-gfm-heading-id';

const options = {
	prefix: "swat-",
};

// Configure marked for better HTML support
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
});

marked.use(gfmHeadingId(options));
// Create a DOM window for DOMPurify (needed in Node.js environment)
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// Configure DOMPurify to be more permissive but still safe
const ALLOWED_TAGS = [
  // Basic HTML tags
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'div',
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Lists
  'ul', 'ol', 'li',
  // Links and media
  'a', 'img', 'video', 'audio', 'source',
  // Tables
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  // Code
  'pre', 'code',
  // Quotes and separators
  'blockquote', 'hr',
  // Formatting
  'sup', 'sub', 'mark', 'del', 'ins',
  // Semantic HTML
  'article', 'section', 'aside', 'nav', 'header', 'footer', 'main',
  // Interactive elements (use with caution)
  'button', 'details', 'summary',
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id', 'style', 'target', 'rel',
  'width', 'height', 'controls', 'autoplay', 'loop', 'muted',
  'colspan', 'rowspan', 'align', 'valign',
  'data-*', // Allow data attributes
];

interface MarkdownProcessingOptions {
  allowUnsafeHtml?: boolean;
  customSanitizeConfig?: any;
}

export class MarkdownService {
  /**
   * Process markdown content with embedded HTML
   * @param content Raw markdown content with potential HTML
   * @param options Processing options
   * @returns Processed and sanitized HTML
   */
  static processMarkdown(content: string, options: MarkdownProcessingOptions = {}): string {
    try {
      if (!content || typeof content !== 'string') {
        return '';
      }

      // First, process the markdown (this will convert markdown to HTML while preserving existing HTML)
      const htmlContent = marked.parse(content) as string;

      // Then sanitize the HTML to prevent XSS attacks
      const sanitizeConfig = options.customSanitizeConfig || {
        ALLOWED_TAGS: ALLOWED_TAGS,
        ALLOWED_ATTR: ALLOWED_ATTR,
        ALLOW_DATA_ATTR: true,
        KEEP_CONTENT: true,
        // Allow some inline styles for basic formatting
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      };

      if (options.allowUnsafeHtml) {
        // For admin/trusted content, be less restrictive
        sanitizeConfig.ALLOWED_TAGS = [...ALLOWED_TAGS, 'script', 'style', 'iframe'];
        sanitizeConfig.ALLOWED_ATTR = [...ALLOWED_ATTR, 'onclick', 'onload', 'onerror'];
      }

      const sanitizedContent = purify.sanitize(htmlContent, sanitizeConfig);

      return sanitizedContent.toString();
    } catch (error) {
      console.error('Error processing markdown:', error);
      // Return the original content as a fallback, but escaped for safety
      return this.escapeHtml(content);
    }
  }

  /**
   * Extract plain text from markdown/HTML content
   * @param content Markdown or HTML content
   * @returns Plain text
   */
  static extractPlainText(content: string): string {
    try {
      if (!content) return '';
      
      // First process markdown to HTML
      const htmlContent = marked.parse(content) as string;
      
      // Then strip all HTML tags
      const plainText = htmlContent.replace(/<[^>]*>/g, '');
      
      // Clean up extra whitespace
      return plainText.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error('Error extracting plain text:', error);
      return content;
    }
  }

  /**
   * Create a preview/excerpt from markdown content
   * @param content Markdown content
   * @param maxLength Maximum length of preview
   * @returns Preview text
   */
  static createPreview(content: string, maxLength: number = 200): string {
    const plainText = this.extractPlainText(content);
    
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    // Find the last space before the limit to avoid cutting words
    let cutoff = plainText.lastIndexOf(' ', maxLength);
    if (cutoff === -1) cutoff = maxLength;
    
    return plainText.substring(0, cutoff) + '...';
  }

  /**
   * Validate markdown content for common issues
   * @param content Markdown content
   * @returns Validation results
   */
  static validateMarkdown(content: string): { isValid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      if (!content || typeof content !== 'string') {
        errors.push('Content must be a non-empty string');
        return { isValid: false, warnings, errors };
      }

      // Check for common markdown issues
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Check for unescaped HTML that might be problematic
        const scriptTags = line.match(/<script[^>]*>/gi);
        if (scriptTags) {
          warnings.push(`Line ${lineNum}: Script tags detected. They will be sanitized.`);
        }
        
        // Check for broken links
        const links = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
        if (links) {
          links.forEach(link => {
            const urlMatch = link.match(/\]\(([^)]+)\)/);
            if (urlMatch && urlMatch[1]) {
              const url = urlMatch[1];
              if (!url.match(/^(https?:\/\/|mailto:|tel:|#)/)) {
                warnings.push(`Line ${lineNum}: Potentially invalid link URL: ${url}`);
              }
            }
          });
        }
        
        // Check for broken image references
        const images = line.match(/!\[([^\]]*)\]\(([^)]+)\)/g);
        if (images) {
          images.forEach(img => {
            const urlMatch = img.match(/\]\(([^)]+)\)/);
            if (urlMatch && urlMatch[1]) {
              const url = urlMatch[1];
              if (!url.match(/^(https?:\/\/|data:|\/)/)) {
                warnings.push(`Line ${lineNum}: Potentially invalid image URL: ${url}`);
              }
            }
          });
        }
      });

      // Try to process the markdown to catch parsing errors
      marked.parse(content);

    } catch (error) {
      errors.push(`Markdown parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Escape HTML characters for safety
   * @param text Text to escape
   * @returns Escaped text
   */
  private static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

export default MarkdownService;