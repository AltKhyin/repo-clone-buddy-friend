// ABOUTME: Standardized placeholder text constants for consistent UX across editor

export const PLACEHOLDERS = {
  // Quote block placeholders
  QUOTE_TEXT: 'Enter quote text...',
  QUOTE_ATTRIBUTION: 'Add attribution...',

  // Image block placeholders
  IMAGE_CAPTION: 'Add image caption...',
  IMAGE_ALT: 'Describe the image...',
  IMAGE_URL: 'Enter image URL...',

  // Key takeaway placeholders
  KEY_TAKEAWAY_TITLE: 'Key Takeaway',
  KEY_TAKEAWAY_SUBTITLE: 'Add subtitle...',
  KEY_TAKEAWAY_CONTENT: 'Enter key takeaway message...',

  // Poll block placeholders
  POLL_QUESTION: 'What is your opinion?',
  POLL_OPTION: 'Option',

  // Table block placeholders
  TABLE_CELL: 'Cell content...',
  TABLE_HEADER: 'Header',

  // Text block placeholders
  TEXT_CONTENT: 'Start typing...',

  // Common styling placeholders
  COLOR_HEX: '#3b82f6',
  COLOR_TRANSPARENT: 'transparent',
  URL_INPUT: 'Enter URL...',

  // Common labels
  CLICK_TO_EDIT: 'Click to edit...',
  CLICK_TO_ADD: 'Click to add',
  OPTIONAL: '(optional)',
} as const;

// Color constants for consistent styling
export const DEFAULT_COLORS = {
  BORDER: '#3b82f6',
  BACKGROUND_LIGHT: '#f8fafc',
  BACKGROUND_TRANSPARENT: 'transparent',
  TEXT_PRIMARY: '#1f2937',
  TEXT_SECONDARY: '#6b7280',
  TEXT_MUTED: '#9ca3af',
} as const;
