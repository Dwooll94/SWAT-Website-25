# Markdown + HTML Dynamic Page System

## Overview

The dynamic page system has been upgraded to support **Markdown with embedded HTML**, providing powerful content creation capabilities while maintaining security through sanitization.

## Features

### ✅ What's New

1. **Rich Markdown Editor** - Visual editor with live preview in admin interface
2. **Embedded HTML Support** - Mix HTML directly with Markdown content
3. **Server-side Processing** - Content is processed and sanitized on the backend
4. **XSS Protection** - Safe HTML sanitization prevents security vulnerabilities
5. **Enhanced Styling** - Custom CSS classes and inline styles
6. **Media Support** - Embed videos, iframes, and interactive elements

### 📋 Supported Elements

**Standard Markdown:**
- Headings (`# ## ###`)
- Lists (ordered and unordered)
- Links and images
- Code blocks with syntax highlighting
- Tables
- Blockquotes
- Task lists (`- [ ]` and `- [x]`)

**Embedded HTML:**
- Divs, spans, and semantic elements
- Buttons and interactive elements
- Iframes for embedding videos/content  
- Custom CSS classes and styles
- Tables with advanced formatting
- Media elements (video, audio)

## SWAT Team 1806 Styling Features

The markdown renderer now includes custom styling consistent with SWAT Team 1806's brand:

### 🎨 **Color Scheme**
- **SWAT Green** (`#005728`) - Primary brand color for headings, links, and accents
- **SWAT Black** (`#000000`) - Secondary color for text and emphasis  
- **Warrior Gold** (`#FFEB3B`) - Accent color for special highlights
- **Impact Font** - Bold headings that match team typography

### 📋 **Styled Elements**
- **Headings**: Green Impact font with underlines and left borders
- **Lists**: Green bullet points and numbering 
- **Links**: Green hover effects with smooth transitions
- **Tables**: Green headers with professional styling
- **Code**: Green-tinted backgrounds and borders
- **Buttons**: Team-colored with hover animations
- **Blockquotes**: Gradient backgrounds with green accents

## Usage Examples

### Basic Markdown with SWAT Styling
```markdown
# Welcome to SWAT Team 1806

## About Us
We are a **FIRST Robotics Competition** team dedicated to *innovation* and *excellence*.

- Founded in 2006  
- Based in Smithville, MO
- [Visit our website](https://example.com)

![Team Photo](https://example.com/team.jpg)
```

**Renders as:**
- H1: Large Impact font in SWAT Green with bottom border
- H2: Impact font in SWAT Black with left green border  
- Bold text: SWAT Black emphasis
- Italic text: SWAT Green-dark medium weight
- List: Green arrow bullets (▸) with proper spacing
- Links: SWAT Green with hover effects
- Images: Rounded with shadows and green border on hover

### Markdown + HTML with SWAT Branding
```markdown
# Team Updates

<div class="alert info">
  <h3>📢 Important Notice</h3>
  <p>Our next meeting is scheduled for <strong>January 15th at 6:00 PM</strong>.</p>
  <button onclick="alert('Meeting reminder set!')">Set Reminder</button>
</div>

## Recent Achievements
- Won **Excellence Award** at Regional Competition  
- Advanced to State Championship
- Qualified for World Championships

<div class="highlight featured">
  <h3>🏆 Championship Victory!</h3>
  <p>SWAT Team 1806 claimed victory at the Regional Championship with our robot <em>Warrior Bot</em>!</p>
  
  <table>
    <thead>
      <tr>
        <th>Match</th>
        <th>Alliance</th>
        <th>Score</th>
        <th>Ranking</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Qualification 1</td>
        <td>Red</td>
        <td>125</td>
        <td>2nd</td>
      </tr>
      <tr>
        <td>Finals</td>
        <td>Blue Captain</td>
        <td>187</td>
        <td>1st 🥇</td>
      </tr>
    </tbody>
  </table>
</div>

<iframe width="100%" height="315" src="https://www.youtube.com/embed/robotics-video" frameborder="0" allowfullscreen></iframe>
```

**SWAT-Themed Rendering:**
- **Alert boxes**: Green left border with light green background
- **Featured sections**: Gradient background using SWAT Green and Warrior Gold  
- **Tables**: Green headers with white text, alternating row colors
- **Buttons**: SWAT Green background with hover animations
- **All text**: Proper SWAT brand typography and spacing

### Interactive Elements
```markdown
# Robot Specifications

<details>
  <summary>Click to expand robot details</summary>
  
  ## Technical Specifications
  - Weight: 125 lbs
  - Dimensions: 28" x 38" x 84"
  - Drive System: Tank Drive
  
  <table class="spec-table">
    <thead>
      <tr style="background: #4caf50; color: white;">
        <th>Component</th>
        <th>Model</th>
        <th>Quantity</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Motors</td>
        <td>CIM Motors</td>
        <td>6</td>
      </tr>
      <tr>
        <td>Controllers</td>
        <td>Talon SRX</td>
        <td>4</td>
      </tr>
    </tbody>
  </table>
</details>
```

## Security & Sanitization

### ✅ Allowed HTML Elements
- Basic: `div`, `span`, `p`, `br`, `strong`, `em`, `b`, `i`, `u`
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Lists: `ul`, `ol`, `li`
- Links & Media: `a`, `img`, `video`, `audio`, `source`
- Tables: `table`, `thead`, `tbody`, `tr`, `th`, `td`
- Code: `pre`, `code`
- Interactive: `button`, `details`, `summary`
- Semantic: `article`, `section`, `aside`, `nav`, `header`, `footer`, `main`
- Embed: `iframe` (for trusted sources)

### ✅ Allowed Attributes
- Styling: `class`, `id`, `style`
- Links: `href`, `target`, `rel`
- Media: `src`, `alt`, `width`, `height`, `controls`
- Tables: `colspan`, `rowspan`, `scope`
- Data: `data-*` attributes
- Interactive: Basic event handlers (sanitized)

### ❌ Blocked/Sanitized
- `<script>` tags and JavaScript execution
- Malicious event handlers
- Dangerous protocols (javascript:, data: with scripts)
- Form elements (for security)
- Embedding from untrusted domains

## Admin Interface

### Page Editor Features
1. **Live Preview** - See rendered output as you type
2. **Syntax Highlighting** - Color-coded markdown and HTML
3. **Helpful Placeholders** - Example content to get started
4. **Auto-save** - Content is processed and saved automatically
5. **Validation** - Warnings for potentially problematic content

### Creating/Editing Pages
1. Navigate to **Maintenance → Pages** tab
2. Click **Add New Page** or edit existing page
3. Use the rich markdown editor with HTML support
4. Preview your content in real-time
5. Save and publish when ready

## Database Schema Changes

### New Columns in `pages` table:
- `processed_content` (TEXT) - Server-processed HTML ready for display
- `content_preview` (TEXT) - Plain text excerpt for search/listing

### Migration Required
Run the database migration:
```bash
cd database
./run_migration.sh migrations/005_add_processed_content_to_pages.sql
```

## Frontend Components

### MarkdownRenderer Component
Enhanced with new props:
```tsx
<MarkdownRenderer 
  content={pageContent}
  allowUnsafeHtml={false}          // For trusted content
  useProcessedContent={true}       // Use server-processed HTML
  className="custom-styling"
/>
```

## Backend Processing

Content flows through:
1. **Input** - Raw markdown + HTML from editor
2. **Processing** - Markdown parsed to HTML via `marked`
3. **Sanitization** - HTML cleaned via `DOMPurify`
4. **Storage** - Both raw and processed content stored
5. **Delivery** - Processed HTML sent to frontend

## Best Practices

### Content Creation
1. Start with standard Markdown for basic formatting
2. Add HTML only when Markdown isn't sufficient
3. Test content in preview mode before publishing
4. Use semantic HTML elements when possible
5. Keep embedded HTML simple and maintainable

### Security Considerations
1. Always use the sanitized output for public display
2. Don't embed untrusted third-party content
3. Be cautious with inline styles and scripts
4. Regularly review published content

### Performance Tips
1. Server-side processing reduces client-side work
2. Processed content is cached in database
3. Large embedded media should be optimized
4. Consider lazy loading for heavy content

## Migration from Previous System

Existing pages will continue to work normally. To take advantage of new features:

1. **Automatic** - New/edited pages use enhanced processing
2. **Manual** - Re-save existing pages to process with new system
3. **Bulk** - Contact admin for bulk migration if needed

## Support & Troubleshooting

### Common Issues
- **Styling not applied**: Check CSS class names and inline styles
- **HTML not rendering**: Verify elements are in allowed list
- **Content missing**: Check for sanitization removing elements
- **JavaScript not working**: Scripts are blocked for security

### Getting Help
1. Check this guide for supported features
2. Test content in preview mode
3. Contact team administrators for assistance
4. Report bugs via GitHub issues

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**