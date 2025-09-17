import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Customize headings with team colors
          h1: ({ children, ...props }) => (
            <h1 className="text-4xl font-impact text-swat-green mb-6 border-b-2 border-swat-green pb-2" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-3xl font-impact text-swat-black mb-4 mt-8" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-2xl font-bold text-swat-black mb-3 mt-6" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-xl font-bold text-swat-green mb-2 mt-4" {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 className="text-lg font-semibold text-swat-black mb-2 mt-3" {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 className="text-base font-semibold text-gray-700 mb-1 mt-2" {...props}>
              {children}
            </h6>
          ),
          
          // Style paragraphs
          p: ({ children, ...props }) => (
            <p className="text-gray-800 leading-relaxed mb-4" {...props}>
              {children}
            </p>
          ),
          
          // Style links with team colors
          a: ({ children, href, ...props }) => (
            <a 
              className="text-swat-green hover:text-swat-green/80 underline font-medium transition-colors"
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            >
              {children}
            </a>
          ),
          
          // Style lists
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 ml-4" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 ml-4" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-gray-800" {...props}>
              {children}
            </li>
          ),
          
          // Style blockquotes with team accent
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="border-l-4 border-swat-green bg-gray-50 pl-4 py-2 my-4 italic text-gray-700"
              {...props}
            >
              {children}
            </blockquote>
          ),
          
          // Style code blocks
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code 
                  className="bg-gray-100 text-swat-black px-1 py-0.5 rounded text-sm font-mono"
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
              className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm"
              {...props}
            >
              {children}
            </pre>
          ),
          
          // Style tables
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-300" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-swat-green text-white" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-gray-300 px-4 py-2 text-left font-semibold" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-300 px-4 py-2" {...props}>
              {children}
            </td>
          ),
          
          // Style horizontal rules
          hr: ({ ...props }) => (
            <hr className="border-t-2 border-swat-green my-8" {...props} />
          ),
          
          // Style images
          img: ({ src, alt, ...props }) => (
            <img 
              className="max-w-full h-auto rounded-lg shadow-md mb-4 mx-auto"
              src={src}
              alt={alt}
              {...props}
            />
          ),
          
          // Style strong/bold text
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-swat-black" {...props}>
              {children}
            </strong>
          ),
          
          // Style emphasis/italic text
          em: ({ children, ...props }) => (
            <em className="italic text-gray-700" {...props}>
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;