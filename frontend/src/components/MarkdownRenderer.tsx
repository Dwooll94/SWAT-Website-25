import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import 'highlight.js/styles/github-dark.css';
import './markdown-content.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  allowUnsafeHtml?: boolean; // For admin/trusted content
  useProcessedContent?: boolean; // If true, treat content as pre-processed HTML
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '', 
  allowUnsafeHtml = false,
  useProcessedContent = false 
}) => {
  // Configure sanitization - be more permissive for admin content
  const sanitizeSchema = allowUnsafeHtml ? {
    // Allow more tags for trusted content
    tagNames: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img', 'video', 'audio', 'source',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'pre', 'code',
      'blockquote', 'hr',
      'sup', 'sub', 'mark', 'del', 'ins',
      'article', 'section', 'aside', 'nav', 'header', 'footer', 'main',
      'button', 'details', 'summary',
      'iframe', 'embed', 'object', 'param'
    ],
    attributes: {
      '*': ['className', 'id', 'style', 'title', 'data*'],
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'width', 'height'],
      'video': ['src', 'controls', 'autoplay', 'loop', 'muted', 'width', 'height'],
      'audio': ['src', 'controls', 'autoplay', 'loop', 'muted'],
      'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
      'td': ['colspan', 'rowspan'],
      'th': ['colspan', 'rowspan', 'scope'],
    }
  } : undefined; // Use default (safer) sanitization for public content

  // If we're using pre-processed content from the backend, render it directly
  if (useProcessedContent) {
    return (
      <div 
        className={`markdown-content prose prose-lg max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Configure rehype plugins
  const rehypePlugins: any[] = [
    rehypeRaw, // Allow HTML in markdown
    rehypeHighlight, // Syntax highlighting for code blocks
    sanitizeSchema ? [rehypeSanitize, sanitizeSchema] : rehypeSanitize
  ];

  return (
    <div className={`markdown-content prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
        components={{
          // Customize headings with SWAT Team 1806 colors
          h1: ({ children, ...props }) => (
            <h1 className="text-4xl font-impact text-swat-green mb-6 border-b-4 border-swat-green pb-3 mt-8 first:mt-0" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-3xl font-impact text-swat-black mb-4 mt-8 border-l-4 border-swat-green pl-4" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-2xl font-bold text-swat-green-dark mb-3 mt-6" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-xl font-bold text-swat-green mb-2 mt-5" {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 className="text-lg font-semibold text-swat-black mb-2 mt-4" {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 className="text-base font-semibold text-gray-700 mb-1 mt-3" {...props}>
              {children}
            </h6>
          ),
          
          // Style paragraphs with proper SWAT spacing
          p: ({ children, ...props }) => (
            <p className="text-gray-800 leading-relaxed mb-4 text-lg" {...props}>
              {children}
            </p>
          ),
          
          // Style links with SWAT green theme
          a: ({ children, href, ...props }) => (
            <a 
              className="text-swat-green hover:text-swat-green-light underline font-semibold transition-colors duration-200"
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            >
              {children}
            </a>
          ),
          
          // Style lists with SWAT theme
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-6 space-y-2 ml-4 [&_li]:text-gray-800 [&_li]:text-lg [&_li:marker]:text-swat-green [&_li:marker]:text-xl" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-6 space-y-2 ml-4 [&_li]:text-gray-800 [&_li]:text-lg [&_li:marker]:text-swat-green [&_li:marker]:font-bold" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li 
              className="text-gray-800 text-lg leading-relaxed" 
              {...props}
            >
              {children}
            </li>
          ),
          
          // Style blockquotes with DISTINCTIVE styling (different from headings)
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="relative bg-slate-50 border-2 border-slate-200 border-l-6 border-l-slate-500 p-6 pl-12 my-8 italic text-slate-600 rounded-xl shadow-md font-serif before:content-['\201C'] before:absolute before:left-3 before:top-1 before:text-5xl before:text-slate-500 before:font-serif before:leading-none"
              {...props}
            >
              <div className="text-lg leading-relaxed font-normal">
                {children}
              </div>
            </blockquote>
          ),
          
          // Style code blocks with SWAT colors
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code 
                  className="bg-swat-green/10 text-swat-green-dark px-2 py-1 rounded font-mono text-sm border border-swat-green/20"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          
          pre: ({ children, ...props }) => (
            <pre 
              className="bg-swat-black text-swat-white p-6 rounded-lg overflow-x-auto mb-6 text-sm shadow-lg border border-swat-green/20"
              {...props}
            >
              {children}
            </pre>
          ),
          
          // Style tables with SWAT branding
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-6 rounded-lg shadow-lg border border-gray-200">
              <table className="min-w-full border-collapse" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-swat-green text-swat-white" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th className="border-b-2 border-swat-green-light px-6 py-4 text-left font-bold uppercase tracking-wide text-sm" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border-b border-gray-200 px-6 py-4 text-gray-800" {...props}>
              {children}
            </td>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="bg-white divide-y divide-gray-200" {...props}>
              {children}
            </tbody>
          ),
          
          // Style horizontal rules with SWAT accent
          hr: ({ ...props }) => (
            <hr className="border-t-4 border-swat-green my-8 rounded-full" {...props} />
          ),
          
          // Style images with SWAT theme
          img: ({ src, alt, ...props }) => (
            <img 
              className="max-w-full h-auto rounded-lg shadow-lg mb-6 mx-auto border-2 border-gray-200 hover:border-swat-green transition-colors duration-300"
              src={src}
              alt={alt}
              {...props}
            />
          ),
          
          // Style strong/bold text with SWAT colors
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-swat-black" {...props}>
              {children}
            </strong>
          ),
          
          // Style emphasis/italic text
          em: ({ children, ...props }) => (
            <em className="italic text-swat-green-dark font-medium" {...props}>
              {children}
            </em>
          ),

          // Custom button styling for HTML buttons
          button: ({ children, ...props }) => (
            <button 
              className="bg-swat-green hover:bg-swat-green-light text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg mx-1 my-1" 
              {...props}
            >
              {children}
            </button>
          ),

          // Custom div styling for special containers
          div: ({ children, className, ...props }) => {
            // Check for common alert/info box classes
            if (className?.includes('alert') || className?.includes('notice') || className?.includes('info')) {
              return (
                <div 
                  className={`bg-swat-green/10 border-l-4 border-swat-green p-4 my-4 rounded-r-lg ${className || ''}`} 
                  {...props}
                >
                  {children}
                </div>
              );
            }
            // Check for highlight boxes
            if (className?.includes('highlight') || className?.includes('featured')) {
              return (
                <div 
                  className={`bg-gradient-to-r from-swat-green/5 to-warrior-gold/5 border border-swat-green/20 p-6 my-6 rounded-lg shadow-sm ${className || ''}`} 
                  {...props}
                >
                  {children}
                </div>
              );
            }
            return (
              <div className={className} {...props}>
                {children}
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;