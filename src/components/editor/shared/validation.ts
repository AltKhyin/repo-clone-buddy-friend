// ABOUTME: Validation utilities for Rich Block editor components with comprehensive error handling

import { TableData } from '../extensions/Table/TableExtension';
import { PollData, PollOption } from '../extensions/Poll/PollExtension';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Table data validation limits
 */
export const TABLE_LIMITS = {
  MAX_ROWS: 50,
  MAX_COLUMNS: 20,
  MAX_CELL_LENGTH: 500,
  MAX_HEADER_LENGTH: 100,
  MIN_ROWS: 1,
  MIN_COLUMNS: 1,
} as const;

/**
 * Poll data validation limits
 */
export const POLL_LIMITS = {
  MAX_OPTIONS: 20,
  MAX_QUESTION_LENGTH: 500,
  MAX_OPTION_LENGTH: 200,
  MIN_OPTIONS: 1,
  MIN_QUESTION_LENGTH: 5,
  MIN_OPTION_LENGTH: 1,
} as const;

/**
 * Sanitize and validate table data
 */
export function validateTableData(data: Partial<TableData>): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Validate headers
  if (data.headers) {
    if (!Array.isArray(data.headers)) {
      result.errors.push('Headers must be an array');
      result.isValid = false;
    } else {
      if (data.headers.length < TABLE_LIMITS.MIN_COLUMNS) {
        result.errors.push(`Table must have at least ${TABLE_LIMITS.MIN_COLUMNS} column`);
        result.isValid = false;
      }

      if (data.headers.length > TABLE_LIMITS.MAX_COLUMNS) {
        result.errors.push(`Table cannot have more than ${TABLE_LIMITS.MAX_COLUMNS} columns`);
        result.isValid = false;
      }

      // Validate individual headers
      data.headers.forEach((header, index) => {
        if (typeof header !== 'string') {
          result.errors.push(`Header ${index + 1} must be a string`);
          result.isValid = false;
        } else if (header.length > TABLE_LIMITS.MAX_HEADER_LENGTH) {
          result.errors.push(
            `Header ${index + 1} exceeds maximum length of ${TABLE_LIMITS.MAX_HEADER_LENGTH} characters`
          );
          result.isValid = false;
        }
      });

      // Check for duplicate headers
      const duplicateHeaders = data.headers.filter(
        (header, index) => data.headers!.indexOf(header) !== index && header.trim() !== ''
      );
      if (duplicateHeaders.length > 0) {
        result.warnings.push(`Duplicate headers found: ${duplicateHeaders.join(', ')}`);
      }
    }
  }

  // Validate rows
  if (data.rows) {
    if (!Array.isArray(data.rows)) {
      result.errors.push('Rows must be an array');
      result.isValid = false;
    } else {
      if (data.rows.length < TABLE_LIMITS.MIN_ROWS) {
        result.errors.push(`Table must have at least ${TABLE_LIMITS.MIN_ROWS} row`);
        result.isValid = false;
      }

      if (data.rows.length > TABLE_LIMITS.MAX_ROWS) {
        result.errors.push(`Table cannot have more than ${TABLE_LIMITS.MAX_ROWS} rows`);
        result.isValid = false;
      }

      // Validate row structure and cell content
      data.rows.forEach((row, rowIndex) => {
        if (!Array.isArray(row)) {
          result.errors.push(`Row ${rowIndex + 1} must be an array`);
          result.isValid = false;
          return;
        }

        // Check column count consistency
        if (data.headers && Array.isArray(data.headers) && row.length !== data.headers.length) {
          result.warnings.push(
            `Row ${rowIndex + 1} has ${row.length} cells but table has ${data.headers.length} columns`
          );
        }

        // Validate individual cells
        row.forEach((cell, cellIndex) => {
          if (typeof cell !== 'string') {
            result.errors.push(
              `Cell at row ${rowIndex + 1}, column ${cellIndex + 1} must be a string`
            );
            result.isValid = false;
          } else if (cell.length > TABLE_LIMITS.MAX_CELL_LENGTH) {
            result.errors.push(
              `Cell at row ${rowIndex + 1}, column ${cellIndex + 1} exceeds maximum length of ${TABLE_LIMITS.MAX_CELL_LENGTH} characters`
            );
            result.isValid = false;
          }
        });
      });
    }
  }

  // Validate styling options
  if (data.styling) {
    const { fontSize, cellPadding, borderWidth } = data.styling;

    if (fontSize !== undefined && (fontSize < 8 || fontSize > 72)) {
      result.errors.push('Font size must be between 8 and 72 pixels');
      result.isValid = false;
    }

    if (cellPadding !== undefined && (cellPadding < 0 || cellPadding > 50)) {
      result.errors.push('Cell padding must be between 0 and 50 pixels');
      result.isValid = false;
    }

    if (borderWidth !== undefined && (borderWidth < 0 || borderWidth > 10)) {
      result.errors.push('Border width must be between 0 and 10 pixels');
      result.isValid = false;
    }
  }

  return result;
}

/**
 * Sanitize and validate poll data
 */
export function validatePollData(data: Partial<PollData>): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Validate question
  if (data.question !== undefined) {
    if (typeof data.question !== 'string') {
      result.errors.push('Poll question must be a string');
      result.isValid = false;
    } else {
      const trimmedQuestion = data.question.trim();

      if (trimmedQuestion.length < POLL_LIMITS.MIN_QUESTION_LENGTH) {
        result.errors.push(
          `Poll question must be at least ${POLL_LIMITS.MIN_QUESTION_LENGTH} characters long`
        );
        result.isValid = false;
      }

      if (trimmedQuestion.length > POLL_LIMITS.MAX_QUESTION_LENGTH) {
        result.errors.push(
          `Poll question cannot exceed ${POLL_LIMITS.MAX_QUESTION_LENGTH} characters`
        );
        result.isValid = false;
      }
    }
  }

  // Validate options
  if (data.options) {
    if (!Array.isArray(data.options)) {
      result.errors.push('Poll options must be an array');
      result.isValid = false;
    } else {
      if (data.options.length < POLL_LIMITS.MIN_OPTIONS) {
        result.errors.push(`Poll must have at least ${POLL_LIMITS.MIN_OPTIONS} option`);
        result.isValid = false;
      }

      if (data.options.length > POLL_LIMITS.MAX_OPTIONS) {
        result.errors.push(`Poll cannot have more than ${POLL_LIMITS.MAX_OPTIONS} options`);
        result.isValid = false;
      }

      // Validate individual options
      const optionTexts: string[] = [];
      data.options.forEach((option, index) => {
        if (!isValidPollOption(option)) {
          result.errors.push(`Option ${index + 1} has invalid structure`);
          result.isValid = false;
          return;
        }

        const trimmedText = option.text.trim();

        if (trimmedText.length < POLL_LIMITS.MIN_OPTION_LENGTH) {
          result.errors.push(
            `Option ${index + 1} must be at least ${POLL_LIMITS.MIN_OPTION_LENGTH} character long`
          );
          result.isValid = false;
        }

        if (trimmedText.length > POLL_LIMITS.MAX_OPTION_LENGTH) {
          result.errors.push(
            `Option ${index + 1} cannot exceed ${POLL_LIMITS.MAX_OPTION_LENGTH} characters`
          );
          result.isValid = false;
        }

        if (option.votes < 0) {
          result.errors.push(`Option ${index + 1} cannot have negative votes`);
          result.isValid = false;
        }

        // Check for duplicates
        if (optionTexts.includes(trimmedText) && trimmedText !== '') {
          result.warnings.push(`Duplicate option text: "${trimmedText}"`);
        }
        optionTexts.push(trimmedText);
      });
    }
  }

  // Validate metadata
  if (data.metadata) {
    const { totalVotes, uniqueVoters } = data.metadata;

    if (totalVotes !== undefined && totalVotes < 0) {
      result.errors.push('Total votes cannot be negative');
      result.isValid = false;
    }

    if (uniqueVoters !== undefined && uniqueVoters < 0) {
      result.errors.push('Unique voters cannot be negative');
      result.isValid = false;
    }

    // Logical validation
    if (totalVotes !== undefined && uniqueVoters !== undefined && uniqueVoters > totalVotes) {
      result.warnings.push('Unique voters count exceeds total votes (possible data inconsistency)');
    }
  }

  // Validate styling options
  if (data.styling) {
    const { questionFontSize, optionFontSize, optionPadding } = data.styling;

    if (questionFontSize !== undefined && (questionFontSize < 12 || questionFontSize > 48)) {
      result.errors.push('Question font size must be between 12 and 48 pixels');
      result.isValid = false;
    }

    if (optionFontSize !== undefined && (optionFontSize < 10 || optionFontSize > 32)) {
      result.errors.push('Option font size must be between 10 and 32 pixels');
      result.isValid = false;
    }

    if (optionPadding !== undefined && (optionPadding < 4 || optionPadding > 40)) {
      result.errors.push('Option padding must be between 4 and 40 pixels');
      result.isValid = false;
    }
  }

  return result;
}

/**
 * Check if poll option has valid structure
 */
function isValidPollOption(option: any): option is PollOption {
  return (
    typeof option === 'object' &&
    option !== null &&
    typeof option.id === 'string' &&
    typeof option.text === 'string' &&
    typeof option.votes === 'number' &&
    option.id.length > 0
  );
}

/**
 * Sanitize table data by removing invalid content
 */
export function sanitizeTableData(data: Partial<TableData>): TableData {
  const sanitized: TableData = {
    headers: [],
    rows: [],
    styling: {
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      backgroundColor: 'transparent',
      headerBackgroundColor: '#f8fafc',
      cellPadding: 12,
      textAlign: 'left',
      fontSize: 14,
      fontWeight: 400,
      striped: false,
      compact: false,
    },
    settings: {
      sortable: false,
      resizable: true,
      showHeaders: true,
      minRows: 1,
      maxRows: 50,
    },
  };

  // Sanitize headers
  if (data.headers && Array.isArray(data.headers)) {
    sanitized.headers = data.headers
      .slice(0, TABLE_LIMITS.MAX_COLUMNS)
      .map(header =>
        typeof header === 'string' ? header.slice(0, TABLE_LIMITS.MAX_HEADER_LENGTH) : ''
      );
  }

  // Ensure minimum columns
  if (sanitized.headers.length === 0) {
    sanitized.headers = ['Column 1'];
  }

  // Sanitize rows
  if (data.rows && Array.isArray(data.rows)) {
    sanitized.rows = data.rows.slice(0, TABLE_LIMITS.MAX_ROWS).map(row => {
      if (!Array.isArray(row)) return Array(sanitized.headers.length).fill('');

      // Adjust row length to match headers
      const sanitizedRow = row
        .slice(0, sanitized.headers.length)
        .map(cell => (typeof cell === 'string' ? cell.slice(0, TABLE_LIMITS.MAX_CELL_LENGTH) : ''));

      // Pad with empty strings if needed
      while (sanitizedRow.length < sanitized.headers.length) {
        sanitizedRow.push('');
      }

      return sanitizedRow;
    });
  }

  // Ensure minimum rows
  if (sanitized.rows.length === 0) {
    sanitized.rows = [Array(sanitized.headers.length).fill('')];
  }

  // Merge styling with defaults
  if (data.styling) {
    sanitized.styling = { ...sanitized.styling, ...data.styling };

    // Clamp styling values
    if (sanitized.styling.fontSize !== undefined) {
      sanitized.styling.fontSize = Math.max(8, Math.min(72, sanitized.styling.fontSize));
    }
    if (sanitized.styling.cellPadding !== undefined) {
      sanitized.styling.cellPadding = Math.max(0, Math.min(50, sanitized.styling.cellPadding));
    }
    if (sanitized.styling.borderWidth !== undefined) {
      sanitized.styling.borderWidth = Math.max(0, Math.min(10, sanitized.styling.borderWidth));
    }
  }

  // Merge settings with defaults
  if (data.settings) {
    sanitized.settings = { ...sanitized.settings, ...data.settings };
  }

  return sanitized;
}

/**
 * Sanitize poll data by removing invalid content
 */
export function sanitizePollData(data: Partial<PollData>): PollData {
  const sanitized: PollData = {
    question: '',
    options: [],
    settings: {
      allowMultiple: false,
      showResults: true,
      allowAnonymous: true,
      requireLogin: false,
    },
    metadata: {
      totalVotes: 0,
      uniqueVoters: 0,
      createdAt: new Date().toISOString(),
    },
    styling: {
      questionFontSize: 18,
      questionFontWeight: 600,
      optionFontSize: 16,
      optionPadding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      backgroundColor: 'transparent',
      selectedColor: '#3b82f6',
      resultBarColor: '#60a5fa',
      textAlign: 'left',
      compact: false,
    },
  };

  // Sanitize question
  if (typeof data.question === 'string') {
    sanitized.question = data.question.slice(0, POLL_LIMITS.MAX_QUESTION_LENGTH);
  }

  // Default question if empty
  if (!sanitized.question || sanitized.question.trim().length < POLL_LIMITS.MIN_QUESTION_LENGTH) {
    sanitized.question = 'What is your opinion?';
  }

  // Sanitize options
  if (data.options && Array.isArray(data.options)) {
    sanitized.options = data.options
      .slice(0, POLL_LIMITS.MAX_OPTIONS)
      .filter(isValidPollOption)
      .map(option => ({
        id: option.id,
        text: option.text.slice(0, POLL_LIMITS.MAX_OPTION_LENGTH),
        votes: Math.max(0, option.votes),
      }));
  }

  // Ensure minimum options
  if (sanitized.options.length === 0) {
    sanitized.options = [
      { id: `option-1-${Date.now()}`, text: 'Option 1', votes: 0 },
      { id: `option-2-${Date.now()}`, text: 'Option 2', votes: 0 },
    ];
  }

  // Merge settings with defaults
  if (data.settings) {
    sanitized.settings = { ...sanitized.settings, ...data.settings };
  }

  // Sanitize metadata
  if (data.metadata) {
    sanitized.metadata = { ...sanitized.metadata, ...data.metadata };
    sanitized.metadata.totalVotes = Math.max(0, sanitized.metadata.totalVotes || 0);
    sanitized.metadata.uniqueVoters = Math.max(0, sanitized.metadata.uniqueVoters || 0);
  }

  // Merge styling with defaults
  if (data.styling) {
    sanitized.styling = { ...sanitized.styling, ...data.styling };

    // Clamp styling values
    if (sanitized.styling.questionFontSize !== undefined) {
      sanitized.styling.questionFontSize = Math.max(
        12,
        Math.min(48, sanitized.styling.questionFontSize)
      );
    }
    if (sanitized.styling.optionFontSize !== undefined) {
      sanitized.styling.optionFontSize = Math.max(
        10,
        Math.min(32, sanitized.styling.optionFontSize)
      );
    }
    if (sanitized.styling.optionPadding !== undefined) {
      sanitized.styling.optionPadding = Math.max(4, Math.min(40, sanitized.styling.optionPadding));
    }
  }

  return sanitized;
}

/**
 * Utility for handling validation in React components
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: string[],
    public readonly warnings: string[] = []
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Safe update wrapper that validates before applying changes
 */
export function safeUpdateTableData(
  currentData: Partial<TableData>,
  updates: Partial<TableData>
): { data: TableData; validation: ValidationResult } {
  const mergedData = { ...currentData, ...updates };
  const validation = validateTableData(mergedData);

  // If validation fails, return sanitized data
  const data = validation.isValid ? (mergedData as TableData) : sanitizeTableData(mergedData);

  return { data, validation };
}

/**
 * Safe update wrapper that validates before applying changes
 */
export function safeUpdatePollData(
  currentData: Partial<PollData>,
  updates: Partial<PollData>
): { data: PollData; validation: ValidationResult } {
  const mergedData = { ...currentData, ...updates };
  const validation = validatePollData(mergedData);

  // If validation fails, return sanitized data
  const data = validation.isValid ? (mergedData as PollData) : sanitizePollData(mergedData);

  return { data, validation };
}
