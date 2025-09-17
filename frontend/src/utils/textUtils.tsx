import React from 'react';

/**
 * Utility function to render text with preserved newlines
 * Converts text with \n characters to React elements with <br /> tags
 */
export const renderTextWithNewlines = (text: string | null | undefined, className?: string): React.ReactNode => {
  if (!text) return null;
  if (typeof text != 'string') return null;
  
  return (
    <span className={className}>
      {text.split('\n').map((line, index, array) => (
        <React.Fragment key={index}>
          {line}
          {index < array.length - 1 && <br />}
        </React.Fragment>
      ))}
    </span>
  );
};

/**
 * Utility function to preserve newlines in CSS
 * Returns appropriate CSS class for preserving whitespace
 */
export const getPreserveNewlinesClass = () => 'whitespace-pre-wrap';

/**
 * Utility function to truncate text while preserving newlines
 * Useful for showing previews in lists
 */
export const truncateTextWithNewlines = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return '';
  
  const truncated = text.substring(0, maxLength);
  if (text.length <= maxLength) return truncated;
  
  return truncated + '...';
};