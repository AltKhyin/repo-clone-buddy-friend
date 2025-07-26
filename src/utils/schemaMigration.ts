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
  nodeType: 'table' | 'poll'
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
        const expectedNodeType = nodeType === 'table' ? 'customTable' : 'customPoll';
        const hasCorrectNode = content.content.some((node: any) => node.type === expectedNodeType);
        if (!hasCorrectNode) {
          errors.push(`TipTap JSON does not contain expected ${expectedNodeType} node`);
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
