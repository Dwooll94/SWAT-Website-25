# Text Newline Handling

This document describes the text newline handling implementation for the SWAT Team 1806 website.

## Overview

The website now properly handles newline characters (`\n`) in text content, preserving line breaks when displaying multi-line text such as robot descriptions, resource descriptions, achievements, and review comments.

## Implementation

### Utility Functions

The `src/utils/textUtils.tsx` file provides utility functions for handling text with newlines:

- `renderTextWithNewlines(text, className?)`: Converts text with `\n` characters to React elements with `<br />` tags
- `getPreserveNewlinesClass()`: Returns CSS class for preserving whitespace (alternative approach)
- `truncateTextWithNewlines(text, maxLength)`: Truncates text while preserving newline structure

### Updated Components

The following components have been updated to handle newlines properly:

1. **Robots.tsx**
   - Robot descriptions and achievements now preserve newlines

2. **Maintenance.tsx**
   - Robot descriptions and achievements in the admin interface
   - Resource and category descriptions
   - Review comments for proposals
   - All proposal data displays

3. **Resources.tsx**
   - Resource and category descriptions

## Usage Examples

### Basic Usage
```tsx
import { renderTextWithNewlines } from '../utils/textUtils';

// In JSX:
<div className="description">
  {renderTextWithNewlines(robot.description)}
</div>
```

### With Truncation
```tsx
import { renderTextWithNewlines, truncateTextWithNewlines } from '../utils/textUtils';

// For preview text:
<div className="preview">
  {renderTextWithNewlines(truncateTextWithNewlines(robot.description, 200))}
</div>
```

### Alternative CSS Approach
```tsx
import { getPreserveNewlinesClass } from '../utils/textUtils';

// Using CSS approach:
<div className={`description ${getPreserveNewlinesClass()}`}>
  {robot.description}
</div>
```

## Input Guidelines

When entering text content in forms (robot descriptions, achievements, etc.), users can now:

- Press Enter to create line breaks
- Use multiple paragraphs for better formatting
- Create lists with line separators
- Maintain formatting for readability

## Database Considerations

The database stores text content as-is, including newline characters. No special encoding or processing is needed at the database level.

## Benefits

1. **Improved Readability**: Multi-line content is displayed with proper formatting
2. **Better User Experience**: Content creators can format text naturally
3. **Consistency**: All text content across the site handles newlines uniformly
4. **Flexibility**: Both truncated previews and full content preserve formatting

## Technical Details

- Uses React Fragments to avoid extra DOM nodes
- Preserves all text content while only converting `\n` to `<br />`
- Maintains accessibility by keeping text content readable
- No security issues as text is properly escaped by React

## Future Enhancements

Consider these potential improvements:

1. Rich text editor integration
2. Markdown support for more advanced formatting
3. Preview mode in text areas
4. Auto-formatting for common patterns (lists, etc.)

## Testing

To test newline handling:

1. Enter multi-line text in any description field
2. Save the content
3. Verify line breaks are preserved in the display
4. Check both full content and truncated previews
5. Test in different components (robots, resources, etc.)