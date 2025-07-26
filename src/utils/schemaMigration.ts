// ABOUTME: Schema migration utilities for converting TableBlock and PollBlock to unified RichBlock

import { z } from 'zod';

// Legacy schemas for migration
const LegacyTableBlockDataSchema = z.object({
  htmlHeaders: z.array(z.string()),
  htmlRows: z.array(z.array(z.string())),
  headerStyle: z
    .object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
    })
    .optional(),
  alternatingRowColors: z.boolean().optional(),
  sortable: z.boolean().default(true),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
});

const LegacyPollBlockDataSchema = z.object({
  htmlQuestion: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      htmlText: z.string(),
      votes: z.number().default(0),
    })
  ),
  allowMultiple: z.boolean().default(false),
  showResults: z.boolean().default(true),
  totalVotes: z.number().default(0),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
});

// Legacy schemas for all remaining standalone block types
const LegacyTextBlockDataSchema = z.object({
  htmlContent: z.string(),
  headingLevel: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.null()])
    .optional(),
  fontSize: z.number().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  lineHeight: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  backgroundColor: z.string().optional(),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
});

const LegacyImageBlockDataSchema = z.object({
  src: z.string(),
  alt: z.string(),
  htmlCaption: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  borderRadius: z.number().optional(),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
});

const LegacyQuoteBlockDataSchema = z.object({
  htmlContent: z.string(),
  htmlCitation: z.string().optional(),
  authorImage: z.string().optional(),
  style: z.literal('default').default('default'),
  borderColor: z.string().optional(),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
});

const LegacyKeyTakeawayBlockDataSchema = z.object({
  htmlContent: z.string(),
  icon: z.string().optional(),
  theme: z.enum(['info', 'success', 'warning', 'error']),
  backgroundColor: z.string().optional(),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
});

const LegacyReferenceBlockDataSchema = z.object({
  authors: z.string(),
  year: z.number(),
  title: z.string(),
  source: z.string(),
  doi: z.string().optional(),
  url: z.string().optional(),
  formatted: z.string().optional(),
  htmlFormatted: z.string().optional(),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'overline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic', 'oblique']).optional(),
});

const LegacyVideoEmbedBlockDataSchema = z.object({
  url: z.string(),
  platform: z.enum(['youtube', 'vimeo']),
  autoplay: z.boolean().default(false),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
  borderRadius: z.number().optional(),
});

const LegacySeparatorBlockDataSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  color: z.string().optional(),
  thickness: z.number().default(1),
  width: z.enum(['full', 'half', 'quarter']).default('full'),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
});

// Modern RichBlock schema for reference
const RichBlockDataSchema = z.object({
  content: z.object({
    tiptapJSON: z.any().optional(),
    htmlContent: z.string().default('<p>Start typing...</p>'),
  }),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
});

export type LegacyTableBlockData = z.infer<typeof LegacyTableBlockDataSchema>;
export type LegacyPollBlockData = z.infer<typeof LegacyPollBlockDataSchema>;
export type LegacyTextBlockData = z.infer<typeof LegacyTextBlockDataSchema>;
export type LegacyImageBlockData = z.infer<typeof LegacyImageBlockDataSchema>;
export type LegacyQuoteBlockData = z.infer<typeof LegacyQuoteBlockDataSchema>;
export type LegacyKeyTakeawayBlockData = z.infer<typeof LegacyKeyTakeawayBlockDataSchema>;
export type LegacyReferenceBlockData = z.infer<typeof LegacyReferenceBlockDataSchema>;
export type LegacyVideoEmbedBlockData = z.infer<typeof LegacyVideoEmbedBlockDataSchema>;
export type LegacySeparatorBlockData = z.infer<typeof LegacySeparatorBlockDataSchema>;
export type RichBlockData = z.infer<typeof RichBlockDataSchema>;

/**
 * Generate unique IDs for migration
 */
const generateMigrationId = (): string => {
  return `migrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert legacy TableBlock data to RichBlock with TipTap table extension
 */
export const migrateTableBlockToRichBlock = (legacyData: LegacyTableBlockData): RichBlockData => {
  // Create TipTap JSON structure with custom table extension
  const tableId = generateMigrationId();

  // Convert HTML headers and rows to plain text for TipTap
  const headers = legacyData.htmlHeaders.map(
    header => header.replace(/<[^>]*>/g, '').trim() || 'Header'
  );

  const rows = legacyData.htmlRows.map(row =>
    row.map(cell => cell.replace(/<[^>]*>/g, '').trim() || '')
  );

  // Create TipTap document with table extension
  const tiptapJSON = {
    type: 'doc',
    content: [
      {
        type: 'customTable',
        attrs: {
          tableId,
          headers,
          rows,
          styling: {
            borderStyle: 'solid',
            borderWidth: legacyData.borderWidth || 1,
            borderColor: legacyData.borderColor || '#e2e8f0',
            backgroundColor: legacyData.headerStyle?.backgroundColor || 'transparent',
            headerBackgroundColor: legacyData.headerStyle?.backgroundColor || '#f8fafc',
            cellPadding: 12,
            textAlign: legacyData.textAlign || 'left',
            fontSize: legacyData.fontSize || 14,
            fontWeight: legacyData.fontWeight || 400,
            striped: legacyData.alternatingRowColors || false,
            compact: false,
          },
          settings: {
            sortable: legacyData.sortable ?? true,
            resizable: true,
            showHeaders: true,
            minRows: 1,
            maxRows: 50,
          },
        },
      },
    ],
  };

  // Generate HTML fallback for display
  const htmlContent = generateTableHTML(headers, rows, {
    borderStyle: 'solid',
    borderWidth: legacyData.borderWidth || 1,
    borderColor: legacyData.borderColor || '#e2e8f0',
    backgroundColor: legacyData.headerStyle?.backgroundColor || 'transparent',
    headerBackgroundColor: legacyData.headerStyle?.backgroundColor || '#f8fafc',
    cellPadding: 12,
    textAlign: legacyData.textAlign || 'left',
    fontSize: legacyData.fontSize || 14,
    fontWeight: legacyData.fontWeight || 400,
    striped: legacyData.alternatingRowColors || false,
  });

  return {
    content: {
      tiptapJSON,
      htmlContent,
    },
    // Copy over styling properties
    paddingX: legacyData.paddingX,
    paddingY: legacyData.paddingY,
    backgroundColor: legacyData.backgroundColor,
    borderRadius: legacyData.borderRadius,
    borderWidth: legacyData.borderWidth,
    borderColor: legacyData.borderColor,
    textAlign: legacyData.textAlign,
    color: legacyData.color,
    fontSize: legacyData.fontSize,
    fontFamily: legacyData.fontFamily,
    fontWeight: legacyData.fontWeight,
    lineHeight: legacyData.lineHeight,
    letterSpacing: legacyData.letterSpacing,
    textTransform: legacyData.textTransform,
    textDecoration: legacyData.textDecoration,
    fontStyle: legacyData.fontStyle,
  };
};

/**
 * Convert legacy PollBlock data to RichBlock with TipTap poll extension
 */
export const migratePollBlockToRichBlock = (legacyData: LegacyPollBlockData): RichBlockData => {
  // Create TipTap JSON structure with custom poll extension
  const pollId = generateMigrationId();

  // Convert HTML question and options to plain text for TipTap
  const question = legacyData.htmlQuestion.replace(/<[^>]*>/g, '').trim() || 'Poll Question';

  const options = legacyData.options.map(option => ({
    id: option.id || generateMigrationId(),
    text: option.htmlText.replace(/<[^>]*>/g, '').trim() || 'Option',
    votes: option.votes || 0,
  }));

  const totalVotes = legacyData.totalVotes || options.reduce((sum, opt) => sum + opt.votes, 0);

  // Create TipTap document with poll extension
  const tiptapJSON = {
    type: 'doc',
    content: [
      {
        type: 'customPoll',
        attrs: {
          pollId,
          question,
          options,
          settings: {
            allowMultiple: legacyData.allowMultiple || false,
            showResults: legacyData.showResults !== false,
            allowAnonymous: true,
            requireLogin: false,
          },
          metadata: {
            totalVotes,
            uniqueVoters: totalVotes, // Estimate
            createdAt: new Date().toISOString(),
          },
          styling: {
            questionFontSize: legacyData.fontSize || 18,
            questionFontWeight: legacyData.fontWeight || 600,
            optionFontSize: (legacyData.fontSize || 18) * 0.9,
            optionPadding: 12,
            borderRadius: legacyData.borderRadius || 8,
            borderWidth: legacyData.borderWidth || 1,
            borderColor: legacyData.borderColor || '#e2e8f0',
            backgroundColor: legacyData.backgroundColor || 'transparent',
            selectedColor: '#3b82f6',
            resultBarColor: '#60a5fa',
            textAlign: legacyData.textAlign || 'left',
            compact: false,
          },
          userVotes: [], // Start with no user votes
        },
      },
    ],
  };

  // Generate HTML fallback for display
  const htmlContent = generatePollHTML(question, options, {
    totalVotes,
    allowMultiple: legacyData.allowMultiple || false,
    showResults: legacyData.showResults !== false,
  });

  return {
    content: {
      tiptapJSON,
      htmlContent,
    },
    // Copy over styling properties
    paddingX: legacyData.paddingX,
    paddingY: legacyData.paddingY,
    backgroundColor: legacyData.backgroundColor,
    borderRadius: legacyData.borderRadius,
    borderWidth: legacyData.borderWidth,
    borderColor: legacyData.borderColor,
    textAlign: legacyData.textAlign,
    color: legacyData.color,
    fontSize: legacyData.fontSize,
    fontFamily: legacyData.fontFamily,
    fontWeight: legacyData.fontWeight,
    lineHeight: legacyData.lineHeight,
    letterSpacing: legacyData.letterSpacing,
    textTransform: legacyData.textTransform,
    textDecoration: legacyData.textDecoration,
    fontStyle: legacyData.fontStyle,
  };
};

/**
 * Generate HTML representation of table for fallback display
 */
function generateTableHTML(headers: string[], rows: string[][], styling: any): string {
  const borderStyle = `border: ${styling.borderWidth}px solid ${styling.borderColor}; border-collapse: collapse;`;
  const cellStyle = `padding: ${styling.cellPadding}px; border: 1px solid ${styling.borderColor}; text-align: ${styling.textAlign}; font-size: ${styling.fontSize}px;`;
  const headerStyle = `${cellStyle} background-color: ${styling.headerBackgroundColor}; font-weight: 600;`;

  let html = `<table style="${borderStyle}">`;

  // Headers
  if (headers.length > 0) {
    html += '<thead><tr>';
    headers.forEach(header => {
      html += `<th style="${headerStyle}">${header}</th>`;
    });
    html += '</tr></thead>';
  }

  // Body
  html += '<tbody>';
  rows.forEach((row, index) => {
    const rowBg = styling.striped && index % 2 === 1 ? 'background-color: #f8fafc;' : '';
    html += `<tr style="${rowBg}">`;
    row.forEach(cell => {
      html += `<td style="${cellStyle}">${cell}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  return html;
}

/**
 * Generate HTML representation of poll for fallback display
 */
function generatePollHTML(
  question: string,
  options: Array<{ id: string; text: string; votes: number }>,
  settings: { totalVotes: number; allowMultiple: boolean; showResults: boolean }
): string {
  let html = `<div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">`;

  // Question
  html += `<h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">${question}</h3>`;

  // Options
  options.forEach(option => {
    const percentage =
      settings.totalVotes > 0 ? Math.round((option.votes / settings.totalVotes) * 100) : 0;
    html += `<div style="margin: 8px 0; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">`;
    html += `<span>${option.text}</span>`;
    if (settings.showResults) {
      html += `<span style="font-weight: 500; color: #64748b;">${option.votes} (${percentage}%)</span>`;
    }
    html += `</div>`;
  });

  // Footer
  if (settings.totalVotes > 0) {
    html += `<div style="margin-top: 12px; font-size: 14px; color: #64748b; text-align: center;">`;
    html += `Total votes: ${settings.totalVotes}`;
    if (settings.allowMultiple) {
      html += ` • Multiple choice`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Convert legacy TextBlock data to RichBlock with TipTap content
 */
export const migrateTextBlockToRichBlock = (legacyData: LegacyTextBlockData): RichBlockData => {
  // Strip HTML tags and get plain text for TipTap
  const plainContent = legacyData.htmlContent.replace(/<[^>]*>/g, '').trim() || 'Content';

  // Determine if this should be a heading or paragraph
  const nodeType = legacyData.headingLevel ? `heading` : 'paragraph';
  const level = legacyData.headingLevel || undefined;

  // Create TipTap document structure
  const tiptapJSON = {
    type: 'doc',
    content: [
      {
        type: nodeType,
        ...(level && { attrs: { level } }),
        content: [
          {
            type: 'text',
            text: plainContent,
          },
        ],
      },
    ],
  };

  return {
    content: {
      tiptapJSON,
      htmlContent: legacyData.htmlContent, // Preserve original HTML
    },
    // Copy all styling properties
    paddingX: legacyData.paddingX,
    paddingY: legacyData.paddingY,
    backgroundColor: legacyData.backgroundColor,
    borderRadius: legacyData.borderRadius,
    borderWidth: legacyData.borderWidth,
    borderColor: legacyData.borderColor,
    textAlign: legacyData.textAlign,
    color: legacyData.color,
    fontSize: legacyData.fontSize,
    fontFamily: legacyData.fontFamily,
    fontWeight: legacyData.fontWeight,
    lineHeight: legacyData.lineHeight,
    letterSpacing: legacyData.letterSpacing,
    textTransform: legacyData.textTransform,
    textDecoration: legacyData.textDecoration,
  };
};

/**
 * Convert legacy ImageBlock data to RichBlock with TipTap image extension
 */
export const migrateImageBlockToRichBlock = (legacyData: LegacyImageBlockData): RichBlockData => {
  const imageId = generateMigrationId();

  // Create TipTap document with image and optional caption
  const content = [
    {
      type: 'image',
      attrs: {
        src: legacyData.src,
        alt: legacyData.alt,
        title: legacyData.alt,
        width: legacyData.width,
        height: legacyData.height,
      },
    },
  ];

  // Add caption if exists
  if (legacyData.htmlCaption) {
    const captionText = legacyData.htmlCaption.replace(/<[^>]*>/g, '').trim();
    if (captionText) {
      content.push({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: captionText,
            marks: [{ type: 'italic' }], // Style captions as italic
          },
        ],
      });
    }
  }

  const tiptapJSON = {
    type: 'doc',
    content,
  };

  // Generate HTML fallback
  let htmlContent = `<img src="${legacyData.src}" alt="${legacyData.alt}" style="max-width: 100%; height: auto;"`;
  if (legacyData.width) htmlContent += ` width="${legacyData.width}"`;
  if (legacyData.height) htmlContent += ` height="${legacyData.height}"`;
  htmlContent += ` />`;

  if (legacyData.htmlCaption) {
    htmlContent += `<p style="font-style: italic; margin-top: 8px;">${legacyData.htmlCaption}</p>`;
  }

  return {
    content: {
      tiptapJSON,
      htmlContent,
    },
    paddingX: legacyData.paddingX,
    paddingY: legacyData.paddingY,
    backgroundColor: legacyData.backgroundColor,
    borderRadius: legacyData.borderRadius,
    borderWidth: legacyData.borderWidth,
    borderColor: legacyData.borderColor,
    textAlign: legacyData.textAlign,
    color: legacyData.color,
    fontSize: legacyData.fontSize,
    fontFamily: legacyData.fontFamily,
    fontWeight: legacyData.fontWeight,
    lineHeight: legacyData.lineHeight,
    letterSpacing: legacyData.letterSpacing,
    textTransform: legacyData.textTransform,
    textDecoration: legacyData.textDecoration,
    fontStyle: legacyData.fontStyle,
  };
};

/**
 * Convert legacy QuoteBlock data to RichBlock with TipTap blockquote
 */
export const migrateQuoteBlockToRichBlock = (legacyData: LegacyQuoteBlockData): RichBlockData => {
  const quoteText = legacyData.htmlContent.replace(/<[^>]*>/g, '').trim() || 'Quote';
  const citationText = legacyData.htmlCitation?.replace(/<[^>]*>/g, '').trim();

  // Build blockquote content
  const blockquoteContent = [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: quoteText,
        },
      ],
    },
  ];

  // Add citation as separate paragraph if exists
  if (citationText) {
    blockquoteContent.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: `— ${citationText}`,
          marks: [{ type: 'italic' }],
        },
      ],
    });
  }

  const tiptapJSON = {
    type: 'doc',
    content: [
      {
        type: 'blockquote',
        content: blockquoteContent,
      },
    ],
  };

  // Generate HTML fallback with proper quote styling
  let htmlContent = `<blockquote style="border-left: 4px solid ${legacyData.borderColor || '#e2e8f0'}; padding-left: 16px; margin: 0; font-style: italic;">`;
  htmlContent += `<p>${legacyData.htmlContent}</p>`;
  if (legacyData.htmlCitation) {
    htmlContent += `<cite style="font-size: 0.9em; opacity: 0.8;">— ${legacyData.htmlCitation}</cite>`;
  }
  htmlContent += `</blockquote>`;

  return {
    content: {
      tiptapJSON,
      htmlContent,
    },
    paddingX: legacyData.paddingX,
    paddingY: legacyData.paddingY,
    backgroundColor: legacyData.backgroundColor,
    borderRadius: legacyData.borderRadius,
    borderWidth: legacyData.borderWidth,
    textAlign: legacyData.textAlign,
    color: legacyData.color,
    fontSize: legacyData.fontSize,
    fontFamily: legacyData.fontFamily,
    fontWeight: legacyData.fontWeight,
    lineHeight: legacyData.lineHeight,
    letterSpacing: legacyData.letterSpacing,
    textTransform: legacyData.textTransform,
    textDecoration: legacyData.textDecoration,
    fontStyle: legacyData.fontStyle,
  };
};

/**
 * Convert legacy KeyTakeawayBlock data to RichBlock with custom callout
 */
export const migrateKeyTakeawayBlockToRichBlock = (
  legacyData: LegacyKeyTakeawayBlockData
): RichBlockData => {
  const takeawayText = legacyData.htmlContent.replace(/<[^>]*>/g, '').trim() || 'Key Takeaway';
  const takeawayId = generateMigrationId();

  // Map theme to colors
  const themeColors = {
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    success: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    error: { bg: '#fee2e2', border: '#ef4444', text: '#dc2626' },
  };

  const colors = themeColors[legacyData.theme];

  // Create TipTap document with custom callout node
  const tiptapJSON = {
    type: 'doc',
    content: [
      {
        type: 'customCallout',
        attrs: {
          calloutId: takeawayId,
          type: legacyData.theme,
          icon: legacyData.icon || 'lightbulb',
          content: takeawayText,
          styling: {
            backgroundColor: legacyData.backgroundColor || colors.bg,
            borderColor: colors.border,
            textColor: legacyData.color || colors.text,
            borderWidth: 4,
            borderRadius: legacyData.borderRadius || 8,
            padding: 16,
          },
        },
      },
    ],
  };

  // Generate HTML fallback
  const htmlContent = `<div style="background-color: ${legacyData.backgroundColor || colors.bg}; border-left: 4px solid ${colors.border}; padding: 16px; border-radius: ${legacyData.borderRadius || 8}px; color: ${legacyData.color || colors.text};">
    <p style="margin: 0; font-weight: 500;">${legacyData.htmlContent}</p>
  </div>`;

  return {
    content: {
      tiptapJSON,
      htmlContent,
    },
    paddingX: legacyData.paddingX,
    paddingY: legacyData.paddingY,
    backgroundColor: legacyData.backgroundColor,
    borderRadius: legacyData.borderRadius,
    borderWidth: legacyData.borderWidth,
    borderColor: legacyData.borderColor,
    textAlign: legacyData.textAlign,
    color: legacyData.color,
    fontSize: legacyData.fontSize,
    fontFamily: legacyData.fontFamily,
    fontWeight: legacyData.fontWeight,
    lineHeight: legacyData.lineHeight,
    letterSpacing: legacyData.letterSpacing,
    textTransform: legacyData.textTransform,
    textDecoration: legacyData.textDecoration,
    fontStyle: legacyData.fontStyle,
  };
};

/**
 * Convert legacy ReferenceBlock data to RichBlock with formatted citation
 */
export const migrateReferenceBlockToRichBlock = (
  legacyData: LegacyReferenceBlockData
): RichBlockData => {
  const referenceId = generateMigrationId();

  // Use existing formatted citation or create one
  const formattedCitation =
    legacyData.htmlFormatted ||
    legacyData.formatted ||
    `${legacyData.authors} (${legacyData.year}). ${legacyData.title}. <em>${legacyData.source}</em>.`;

  // Create TipTap document with reference content
  const tiptapJSON = {
    type: 'doc',
    content: [
      {
        type: 'customReference',
        attrs: {
          referenceId,
          authors: legacyData.authors,
          year: legacyData.year,
          title: legacyData.title,
          source: legacyData.source,
          doi: legacyData.doi,
          url: legacyData.url,
          formattedCitation,
          styling: {
            fontSize: legacyData.fontSize || 14,
            fontWeight: legacyData.fontWeight || 400,
            lineHeight: legacyData.lineHeight || 1.4,
            textAlign: legacyData.textAlign || 'left',
            color: legacyData.color,
            backgroundColor: legacyData.backgroundColor,
            borderRadius: legacyData.borderRadius || 4,
            padding: 12,
          },
        },
      },
    ],
  };

  // Generate HTML fallback with proper academic formatting
  let htmlContent = `<div style="font-size: ${legacyData.fontSize || 14}px; line-height: ${legacyData.lineHeight || 1.4}; padding: 12px; background-color: ${legacyData.backgroundColor || '#f8fafc'}; border-radius: ${legacyData.borderRadius || 4}px; border-left: 3px solid #6b7280;">`;
  htmlContent += formattedCitation;

  if (legacyData.doi) {
    htmlContent += ` DOI: <a href="https://doi.org/${legacyData.doi}" target="_blank" style="color: #3b82f6;">${legacyData.doi}</a>`;
  }

  if (legacyData.url && !legacyData.doi) {
    htmlContent += ` <a href="${legacyData.url}" target="_blank" style="color: #3b82f6;">View Source</a>`;
  }

  htmlContent += `</div>`;

  return {
    content: {
      tiptapJSON,
      htmlContent,
    },
    paddingX: legacyData.paddingX,
    paddingY: legacyData.paddingY,
    backgroundColor: legacyData.backgroundColor,
    borderRadius: legacyData.borderRadius,
    borderWidth: legacyData.borderWidth,
    borderColor: legacyData.borderColor,
    textAlign: legacyData.textAlign,
    color: legacyData.color,
    fontSize: legacyData.fontSize,
    fontFamily: legacyData.fontFamily,
    fontWeight: legacyData.fontWeight,
    lineHeight: legacyData.lineHeight,
    letterSpacing: legacyData.letterSpacing,
    textTransform: legacyData.textTransform,
    textDecoration: legacyData.textDecoration,
    fontStyle: legacyData.fontStyle,
  };
};

/**
 * Convert legacy VideoEmbedBlock data to RichBlock with TipTap video extension
 */
export const migrateVideoEmbedBlockToRichBlock = (
  legacyData: LegacyVideoEmbedBlockData
): RichBlockData => {
  const videoId = generateMigrationId();

  // Create TipTap document with custom video embed node
  const tiptapJSON = {
    type: 'doc',
    content: [
      {
        type: 'customVideoEmbed',
        attrs: {
          videoId,
          url: legacyData.url,
          platform: legacyData.platform,
          autoplay: legacyData.autoplay || false,
          styling: {
            aspectRatio: '16/9',
            borderRadius: legacyData.borderRadius || 8,
            borderWidth: legacyData.borderWidth || 0,
            borderColor: legacyData.borderColor,
            backgroundColor: legacyData.backgroundColor,
          },
        },
      },
    ],
  };

  // Generate HTML fallback with responsive iframe
  const htmlContent = `<div style="position: relative; aspect-ratio: 16/9; background-color: ${legacyData.backgroundColor || 'transparent'}; border-radius: ${legacyData.borderRadius || 8}px; overflow: hidden;">
    <iframe 
      src="${legacyData.url}${legacyData.autoplay ? '&autoplay=1' : ''}" 
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
      allowfullscreen>
    </iframe>
  </div>`;

  return {
    content: {
      tiptapJSON,
      htmlContent,
    },
    paddingX: legacyData.paddingX,
    paddingY: legacyData.paddingY,
    backgroundColor: legacyData.backgroundColor,
    borderWidth: legacyData.borderWidth,
    borderColor: legacyData.borderColor,
    borderRadius: legacyData.borderRadius,
  };
};

/**
 * Convert legacy SeparatorBlock data to RichBlock with TipTap horizontal rule
 */
export const migrateSeparatorBlockToRichBlock = (
  legacyData: LegacySeparatorBlockData
): RichBlockData => {
  const separatorId = generateMigrationId();

  // Map width to percentage
  const widthMap = {
    full: '100%',
    half: '50%',
    quarter: '25%',
  };

  // Create TipTap document with custom separator node
  const tiptapJSON = {
    type: 'doc',
    content: [
      {
        type: 'customSeparator',
        attrs: {
          separatorId,
          style: legacyData.style,
          color: legacyData.color || '#e2e8f0',
          thickness: legacyData.thickness,
          width: legacyData.width,
          styling: {
            borderStyle: legacyData.style,
            borderColor: legacyData.color || '#e2e8f0',
            borderWidth: `${legacyData.thickness}px 0 0 0`,
            width: widthMap[legacyData.width],
            margin: legacyData.width !== 'full' ? '0 auto' : '0',
          },
        },
      },
    ],
  };

  // Generate HTML fallback
  const htmlContent = `<hr style="border: none; border-top: ${legacyData.thickness}px ${legacyData.style} ${legacyData.color || '#e2e8f0'}; width: ${widthMap[legacyData.width]}; margin: 16px ${legacyData.width !== 'full' ? 'auto' : '0'};" />`;

  return {
    content: {
      tiptapJSON,
      htmlContent,
    },
    paddingX: legacyData.paddingX,
    paddingY: legacyData.paddingY,
    backgroundColor: legacyData.backgroundColor,
    borderRadius: legacyData.borderRadius,
    borderWidth: legacyData.borderWidth,
    borderColor: legacyData.borderColor,
  };
};

/**
 * Detect if node data is legacy table block
 */
export const isLegacyTableBlock = (data: any): data is LegacyTableBlockData => {
  try {
    LegacyTableBlockDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

/**
 * Detect if node data is legacy poll block
 */
export const isLegacyPollBlock = (data: any): data is LegacyPollBlockData => {
  try {
    LegacyPollBlockDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

/**
 * Detect if node data is legacy text block
 */
export const isLegacyTextBlock = (data: any): data is LegacyTextBlockData => {
  try {
    LegacyTextBlockDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

/**
 * Detect if node data is legacy image block
 */
export const isLegacyImageBlock = (data: any): data is LegacyImageBlockData => {
  try {
    LegacyImageBlockDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

/**
 * Detect if node data is legacy quote block
 */
export const isLegacyQuoteBlock = (data: any): data is LegacyQuoteBlockData => {
  try {
    LegacyQuoteBlockDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

/**
 * Detect if node data is legacy key takeaway block
 */
export const isLegacyKeyTakeawayBlock = (data: any): data is LegacyKeyTakeawayBlockData => {
  try {
    LegacyKeyTakeawayBlockDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

/**
 * Detect if node data is legacy reference block
 */
export const isLegacyReferenceBlock = (data: any): data is LegacyReferenceBlockData => {
  try {
    LegacyReferenceBlockDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

/**
 * Detect if node data is legacy video embed block
 */
export const isLegacyVideoEmbedBlock = (data: any): data is LegacyVideoEmbedBlockData => {
  try {
    LegacyVideoEmbedBlockDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

/**
 * Detect if node data is legacy separator block
 */
export const isLegacySeparatorBlock = (data: any): data is LegacySeparatorBlockData => {
  try {
    LegacySeparatorBlockDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

/**
 * Auto-migrate node data if it's from legacy schema
 */
export const autoMigrateNodeData = (
  nodeType: string,
  data: any
): { migrated: boolean; data: any; newType?: string } => {
  // Check if this is a legacy table block
  if (nodeType === 'tableBlock' && isLegacyTableBlock(data)) {
    return {
      migrated: true,
      data: migrateTableBlockToRichBlock(data),
      newType: 'richBlock',
    };
  }

  // Check if this is a legacy poll block
  if (nodeType === 'pollBlock' && isLegacyPollBlock(data)) {
    return {
      migrated: true,
      data: migratePollBlockToRichBlock(data),
      newType: 'richBlock',
    };
  }

  // Check if this is a legacy text block
  if (nodeType === 'textBlock' && isLegacyTextBlock(data)) {
    return {
      migrated: true,
      data: migrateTextBlockToRichBlock(data),
      newType: 'richBlock',
    };
  }

  // Check if this is a legacy image block
  if (nodeType === 'imageBlock' && isLegacyImageBlock(data)) {
    return {
      migrated: true,
      data: migrateImageBlockToRichBlock(data),
      newType: 'richBlock',
    };
  }

  // Check if this is a legacy quote block
  if (nodeType === 'quoteBlock' && isLegacyQuoteBlock(data)) {
    return {
      migrated: true,
      data: migrateQuoteBlockToRichBlock(data),
      newType: 'richBlock',
    };
  }

  // Check if this is a legacy key takeaway block
  if (nodeType === 'keyTakeawayBlock' && isLegacyKeyTakeawayBlock(data)) {
    return {
      migrated: true,
      data: migrateKeyTakeawayBlockToRichBlock(data),
      newType: 'richBlock',
    };
  }

  // Check if this is a legacy reference block
  if (nodeType === 'referenceBlock' && isLegacyReferenceBlock(data)) {
    return {
      migrated: true,
      data: migrateReferenceBlockToRichBlock(data),
      newType: 'richBlock',
    };
  }

  // Check if this is a legacy video embed block
  if (nodeType === 'videoEmbedBlock' && isLegacyVideoEmbedBlock(data)) {
    return {
      migrated: true,
      data: migrateVideoEmbedBlockToRichBlock(data),
      newType: 'richBlock',
    };
  }

  // Check if this is a legacy separator block
  if (nodeType === 'separatorBlock' && isLegacySeparatorBlock(data)) {
    return {
      migrated: true,
      data: migrateSeparatorBlockToRichBlock(data),
      newType: 'richBlock',
    };
  }

  // No migration needed
  return {
    migrated: false,
    data,
  };
};

/**
 * Batch migrate an entire document
 */
export const migrateDocument = (nodes: Array<{ id: string; type: string; data: any }>) => {
  const migratedNodes = [];
  let migrationsPerformed = 0;

  for (const node of nodes) {
    const migration = autoMigrateNodeData(node.type, node.data);

    if (migration.migrated) {
      migrationsPerformed++;
      migratedNodes.push({
        ...node,
        type: migration.newType || node.type,
        data: migration.data,
      });
    } else {
      migratedNodes.push(node);
    }
  }

  return {
    nodes: migratedNodes,
    migrationsPerformed,
    migrationSummary: `Migrated ${migrationsPerformed} nodes from legacy schemas to unified RichBlock`,
  };
};

/**
 * Validation function to ensure migration was successful
 */
export const validateMigration = (
  originalData: any,
  migratedData: RichBlockData,
  nodeType:
    | 'table'
    | 'poll'
    | 'text'
    | 'image'
    | 'quote'
    | 'keyTakeaway'
    | 'reference'
    | 'videoEmbed'
    | 'separator'
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  try {
    // Validate the migrated data matches the schema
    RichBlockDataSchema.parse(migratedData);

    // Check that TipTap JSON exists and has correct structure
    if (!migratedData.content.tiptapJSON) {
      errors.push('TipTap JSON content is missing');
    } else {
      const content = migratedData.content.tiptapJSON;
      if (!content.type || content.type !== 'doc') {
        errors.push('TipTap JSON has invalid document structure');
      }

      if (!content.content || !Array.isArray(content.content)) {
        errors.push('TipTap JSON content array is missing');
      } else {
        // Map node types to expected TipTap node types
        const expectedNodeTypes = {
          table: 'customTable',
          poll: 'customPoll',
          text: ['paragraph', 'heading'],
          image: 'image',
          quote: 'blockquote',
          keyTakeaway: 'customCallout',
          reference: 'customReference',
          videoEmbed: 'customVideoEmbed',
          separator: 'customSeparator',
        };

        const expected = expectedNodeTypes[nodeType];

        if (Array.isArray(expected)) {
          // For node types that can be multiple types (e.g., text can be paragraph or heading)
          const hasCorrectNode = content.content.some((node: any) => expected.includes(node.type));
          if (!hasCorrectNode) {
            errors.push(
              `TipTap JSON does not contain expected node type (${expected.join(' or ')})`
            );
          }
        } else {
          // For node types with single expected type
          const hasCorrectNode = content.content.some((node: any) => node.type === expected);
          if (!hasCorrectNode) {
            errors.push(`TipTap JSON does not contain expected ${expected} node`);
          }
        }
      }
    }

    // Check that HTML content is generated
    if (!migratedData.content.htmlContent || migratedData.content.htmlContent.trim() === '') {
      errors.push('HTML content is missing or empty');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(
      `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return {
      valid: false,
      errors,
    };
  }
};
