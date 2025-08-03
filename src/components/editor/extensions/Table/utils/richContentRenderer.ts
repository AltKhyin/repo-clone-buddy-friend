// ABOUTME: Safe rich content rendering utility for table cell display mode

/**
 * Safe HTML tags allowed in table cell display
 */
const SAFE_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
  'mark', 'small', 'sub', 'sup', 'code'
]);

/**
 * Dangerous attributes that should be removed
 */
const DANGEROUS_ATTRS = new Set([
  'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
  'onkeydown', 'onkeyup', 'onfocus', 'onblur', 'onsubmit'
]);

/**
 * Safely render rich HTML content for table cell display
 * Uses a simple but effective sanitization approach without external dependencies
 * @param richContent - HTML content from TipTap editor
 * @returns Sanitized HTML safe for display
 */
export function renderSafeRichContent(richContent: string): string {
  if (!richContent || richContent.trim() === '' || richContent.trim() === '<p></p>') {
    return '';
  }

  try {
    // Create a temporary DOM element for safe parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = richContent;

    // Recursively clean the content
    cleanElement(tempDiv);

    return tempDiv.innerHTML;
  } catch (error) {
    console.warn('Failed to sanitize rich content, falling back to plain text:', error);
    // Fallback: strip all HTML tags
    return richContent.replace(/<[^>]*>/g, '').trim();
  }
}

/**
 * Recursively clean an element and its children
 */
function cleanElement(element: Element): void {
  // Remove dangerous attributes from current element
  Array.from(element.attributes).forEach(attr => {
    if (DANGEROUS_ATTRS.has(attr.name.toLowerCase()) || attr.name.startsWith('on')) {
      element.removeAttribute(attr.name);
    }
  });

  // Process child nodes
  Array.from(element.childNodes).forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const childElement = node as Element;
      const tagName = childElement.tagName.toLowerCase();

      // Remove dangerous tags completely
      if (tagName === 'script' || tagName === 'object' || tagName === 'embed') {
        element.removeChild(node);
        return;
      }

      // Replace unknown tags with spans to preserve content
      if (!SAFE_TAGS.has(tagName)) {
        const span = document.createElement('span');
        span.innerHTML = childElement.innerHTML;
        // Copy safe attributes
        Array.from(childElement.attributes).forEach(attr => {
          if (!DANGEROUS_ATTRS.has(attr.name.toLowerCase()) && !attr.name.startsWith('on')) {
            span.setAttribute(attr.name, attr.value);
          }
        });
        element.replaceChild(span, node);
        cleanElement(span);
      } else {
        cleanElement(childElement);
      }
    }
  });
}

/**
 * Check if content contains rich formatting
 * @param content - HTML content to check
 * @returns true if content has HTML formatting beyond basic paragraphs
 */
export function hasRichFormatting(content: string): boolean {
  if (!content) return false;
  
  // Check for formatting tags beyond basic paragraph structure
  const formattingTags = /<(?!\/?(p|br)\b)[^>]*>/i;
  return formattingTags.test(content);
}

/**
 * Extract CSS classes for proper styling inheritance
 * @param content - HTML content 
 * @returns CSS classes that should be applied to the display container
 */
export function extractDisplayClasses(content: string): string[] {
  const classes = ['rich-content-display'];
  
  // Add classes based on content structure
  if (content.includes('<p>')) {
    classes.push('has-paragraphs');
  }
  
  if (hasRichFormatting(content)) {
    classes.push('has-rich-formatting');
  }
  
  return classes;
}

/**
 * Convert rich content to display-optimized HTML
 * Ensures proper styling and layout for table cell display
 */
export function optimizeForDisplay(richContent: string): {
  html: string;
  classes: string[];
  isEmpty: boolean;
} {
  const sanitizedHTML = renderSafeRichContent(richContent);
  const classes = extractDisplayClasses(sanitizedHTML);
  const isEmpty = !sanitizedHTML || sanitizedHTML.trim() === '';
  
  return {
    html: sanitizedHTML,
    classes,
    isEmpty
  };
}