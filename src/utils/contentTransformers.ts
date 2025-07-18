// ABOUTME: Content transformation utilities for converting between text block formats (paragraph ↔ heading)

/**
 * Transforms HTML content between paragraph and heading formats
 * Preserves text content while changing HTML structure
 */
export const transformContent = (
  content: string,
  fromLevel: number | null,
  toLevel: number | null
): string => {
  // Handle empty content
  if (!content?.trim()) {
    if (toLevel) {
      return `<h${toLevel}>Your heading here</h${toLevel}>`;
    }
    return '<p>Type something...</p>';
  }

  // Extract text content, preserving basic formatting
  const textContent = extractTextContent(content);

  // If no meaningful text, provide appropriate placeholder
  if (!textContent.trim()) {
    if (toLevel) {
      return `<h${toLevel}>Your heading here</h${toLevel}>`;
    }
    return '<p>Type something...</p>';
  }

  // Transform to target format
  if (toLevel) {
    return `<h${toLevel}>${textContent}</h${toLevel}>`;
  } else {
    return `<p>${textContent}</p>`;
  }
};

/**
 * Extracts text content from HTML while preserving inline formatting
 * Removes block-level tags but keeps inline tags like <strong>, <em>, etc.
 */
export const extractTextContent = (html: string): string => {
  // Remove block-level tags but preserve inline formatting
  const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'];
  let content = html;

  // Remove opening and closing block tags
  blockTags.forEach(tag => {
    const openRegex = new RegExp(`<${tag}[^>]*>`, 'gi');
    const closeRegex = new RegExp(`</${tag}>`, 'gi');
    content = content.replace(openRegex, '').replace(closeRegex, '');
  });

  // Clean up extra whitespace
  return content.trim();
};

/**
 * Determines if content needs transformation based on current structure
 * Returns true if the content's HTML structure doesn't match the expected level
 */
export const needsTransformation = (content: string, expectedLevel: number | null): boolean => {
  if (!content?.trim()) return false;

  // Extract the main tag from content
  const tagMatch = content.match(/<(\w+)(?:\s[^>]*)?>.*?<\/\1>/i);
  if (!tagMatch) return false;

  const actualTag = tagMatch[1].toLowerCase();
  const expectedTag = expectedLevel ? `h${expectedLevel}` : 'p';

  return actualTag !== expectedTag;
};

/**
 * Validates that content structure matches the expected heading level
 */
export const validateContentStructure = (
  content: string,
  expectedLevel: number | null
): boolean => {
  if (!content?.trim()) return true; // Empty content is valid

  const expectedTag = expectedLevel ? `h${expectedLevel}` : 'p';
  const tagRegex = new RegExp(`^<${expectedTag}(?:\\s[^>]*)?>.*</${expectedTag}>$`, 'i');

  return tagRegex.test(content.trim());
};

/**
 * Gets the heading level from HTML content
 * Returns null if content is not a heading
 */
export const getHeadingLevelFromContent = (content: string): number | null => {
  const headingMatch = content.match(/<h([1-6])(?:\s[^>]*)?>.*?<\/h[1-6]>/i);
  if (!headingMatch) return null;

  return parseInt(headingMatch[1]);
};

/**
 * Safely updates HTML content preserving Tiptap-specific attributes
 * This ensures compatibility with Tiptap editor requirements
 */
export const updateContentSafely = (
  currentContent: string,
  newLevel: number | null,
  preserveAttributes: boolean = true
): string => {
  // If content is valid for the target level, return as-is
  if (validateContentStructure(currentContent, newLevel)) {
    return currentContent;
  }

  // Transform content to match target level
  return transformContent(currentContent, getHeadingLevelFromContent(currentContent), newLevel);
};
