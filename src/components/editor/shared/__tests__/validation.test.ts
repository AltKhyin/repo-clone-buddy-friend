// ABOUTME: Comprehensive tests for Rich Block editor validation utilities

import { describe, it, expect } from 'vitest';
import {
  validateTableData,
  validatePollData,
  sanitizeTableData,
  sanitizePollData,
  safeUpdateTableData,
  safeUpdatePollData,
  TABLE_LIMITS,
  POLL_LIMITS,
} from '../validation';
import { TableData } from '../../extensions/Table/TableExtension';
import { PollData } from '../../extensions/Poll/PollExtension';

describe('Table Validation', () => {
  describe('validateTableData', () => {
    it('should validate valid table data', () => {
      const validData: Partial<TableData> = {
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['John', '25', 'NYC'],
          ['Jane', '30', 'LA'],
        ],
        styling: {
          fontSize: 14,
          cellPadding: 12,
          borderWidth: 1,
        },
      };

      const result = validateTableData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject table with too many columns', () => {
      const invalidData: Partial<TableData> = {
        headers: Array(TABLE_LIMITS.MAX_COLUMNS + 1).fill('Column'),
        rows: [],
      };

      const result = validateTableData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Table cannot have more than ${TABLE_LIMITS.MAX_COLUMNS} columns`
      );
    });

    it('should reject table with too many rows', () => {
      const invalidData: Partial<TableData> = {
        headers: ['Column 1'],
        rows: Array(TABLE_LIMITS.MAX_ROWS + 1).fill(['Cell']),
      };

      const result = validateTableData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Table cannot have more than ${TABLE_LIMITS.MAX_ROWS} rows`);
    });

    it('should reject headers that are too long', () => {
      const invalidData: Partial<TableData> = {
        headers: ['A'.repeat(TABLE_LIMITS.MAX_HEADER_LENGTH + 1)],
        rows: [],
      };

      const result = validateTableData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Header 1 exceeds maximum length of ${TABLE_LIMITS.MAX_HEADER_LENGTH} characters`
      );
    });

    it('should reject cells that are too long', () => {
      const invalidData: Partial<TableData> = {
        headers: ['Column 1'],
        rows: [['A'.repeat(TABLE_LIMITS.MAX_CELL_LENGTH + 1)]],
      };

      const result = validateTableData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Cell at row 1, column 1 exceeds maximum length of ${TABLE_LIMITS.MAX_CELL_LENGTH} characters`
      );
    });

    it('should warn about duplicate headers', () => {
      const dataWithDuplicates: Partial<TableData> = {
        headers: ['Name', 'Name', 'Age'],
        rows: [],
      };

      const result = validateTableData(dataWithDuplicates);
      expect(result.warnings).toContain('Duplicate headers found: Name');
    });

    it('should warn about inconsistent row lengths', () => {
      const inconsistentData: Partial<TableData> = {
        headers: ['A', 'B', 'C'],
        rows: [['1', '2']], // Missing one cell
      };

      const result = validateTableData(inconsistentData);
      expect(result.warnings).toContain('Row 1 has 2 cells but table has 3 columns');
    });

    it('should reject invalid styling values', () => {
      const invalidStyling: Partial<TableData> = {
        headers: ['Column 1'],
        rows: [['Cell']],
        styling: {
          fontSize: 100, // Too large
          cellPadding: -5, // Negative
          borderWidth: 20, // Too large
        },
      };

      const result = validateTableData(invalidStyling);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Font size must be between 8 and 72 pixels');
      expect(result.errors).toContain('Cell padding must be between 0 and 50 pixels');
      expect(result.errors).toContain('Border width must be between 0 and 10 pixels');
    });
  });

  describe('sanitizeTableData', () => {
    it('should sanitize table with excessive columns', () => {
      const excessiveData: Partial<TableData> = {
        headers: Array(TABLE_LIMITS.MAX_COLUMNS + 5).fill('Column'),
        rows: [Array(TABLE_LIMITS.MAX_COLUMNS + 5).fill('Cell')],
      };

      const sanitized = sanitizeTableData(excessiveData);
      expect(sanitized.headers).toHaveLength(TABLE_LIMITS.MAX_COLUMNS);
      expect(sanitized.rows[0]).toHaveLength(TABLE_LIMITS.MAX_COLUMNS);
    });

    it('should ensure minimum table structure', () => {
      const emptyData: Partial<TableData> = {};

      const sanitized = sanitizeTableData(emptyData);
      expect(sanitized.headers).toHaveLength(1);
      expect(sanitized.rows).toHaveLength(1);
      expect(sanitized.rows[0]).toHaveLength(1);
    });

    it('should clamp styling values', () => {
      const invalidStyling: Partial<TableData> = {
        styling: {
          fontSize: 100,
          cellPadding: -5,
          borderWidth: 20,
        },
      };

      const sanitized = sanitizeTableData(invalidStyling);
      expect(sanitized.styling.fontSize).toBe(72); // Clamped to max
      expect(sanitized.styling.cellPadding).toBe(0); // Clamped to min
      expect(sanitized.styling.borderWidth).toBe(10); // Clamped to max
    });
  });

  describe('safeUpdateTableData', () => {
    it('should return valid data when update is valid', () => {
      const currentData: Partial<TableData> = {
        headers: ['Name'],
        rows: [['John']],
      };
      const updates: Partial<TableData> = {
        headers: ['Name', 'Age'],
        rows: [['John', '25']],
      };

      const { data, validation } = safeUpdateTableData(currentData, updates);
      expect(validation.isValid).toBe(true);
      expect(data.headers).toEqual(['Name', 'Age']);
    });

    it('should return sanitized data when update is invalid', () => {
      const currentData: Partial<TableData> = {
        headers: ['Name'],
        rows: [['John']],
      };
      const invalidUpdates: Partial<TableData> = {
        headers: Array(TABLE_LIMITS.MAX_COLUMNS + 1).fill('Column'),
      };

      const { data, validation } = safeUpdateTableData(currentData, invalidUpdates);
      expect(validation.isValid).toBe(false);
      expect(data.headers).toHaveLength(TABLE_LIMITS.MAX_COLUMNS);
    });
  });
});

describe('Poll Validation', () => {
  describe('validatePollData', () => {
    it('should validate valid poll data', () => {
      const validData: Partial<PollData> = {
        question: 'What is your favorite color?',
        options: [
          { id: '1', text: 'Red', votes: 5 },
          { id: '2', text: 'Blue', votes: 3 },
        ],
        metadata: {
          totalVotes: 8,
          uniqueVoters: 8,
        },
        styling: {
          questionFontSize: 18,
          optionFontSize: 16,
          optionPadding: 12,
        },
      };

      const result = validatePollData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject question that is too short', () => {
      const invalidData: Partial<PollData> = {
        question: 'Hi?', // Too short
        options: [{ id: '1', text: 'Yes', votes: 0 }],
      };

      const result = validatePollData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Poll question must be at least ${POLL_LIMITS.MIN_QUESTION_LENGTH} characters long`
      );
    });

    it('should reject question that is too long', () => {
      const invalidData: Partial<PollData> = {
        question: 'A'.repeat(POLL_LIMITS.MAX_QUESTION_LENGTH + 1),
        options: [{ id: '1', text: 'Yes', votes: 0 }],
      };

      const result = validatePollData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Poll question cannot exceed ${POLL_LIMITS.MAX_QUESTION_LENGTH} characters`
      );
    });

    it('should reject too many options', () => {
      const tooManyOptions = Array(POLL_LIMITS.MAX_OPTIONS + 1)
        .fill(null)
        .map((_, i) => ({ id: `${i}`, text: `Option ${i}`, votes: 0 }));

      const invalidData: Partial<PollData> = {
        question: 'Choose an option',
        options: tooManyOptions,
      };

      const result = validatePollData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Poll cannot have more than ${POLL_LIMITS.MAX_OPTIONS} options`
      );
    });

    it('should reject options that are too long', () => {
      const invalidData: Partial<PollData> = {
        question: 'Choose an option',
        options: [
          {
            id: '1',
            text: 'A'.repeat(POLL_LIMITS.MAX_OPTION_LENGTH + 1),
            votes: 0,
          },
        ],
      };

      const result = validatePollData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Option 1 cannot exceed ${POLL_LIMITS.MAX_OPTION_LENGTH} characters`
      );
    });

    it('should reject negative vote counts', () => {
      const invalidData: Partial<PollData> = {
        question: 'Choose an option',
        options: [{ id: '1', text: 'Option 1', votes: -5 }],
      };

      const result = validatePollData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Option 1 cannot have negative votes');
    });

    it('should warn about duplicate options', () => {
      const duplicateData: Partial<PollData> = {
        question: 'Choose an option',
        options: [
          { id: '1', text: 'Same', votes: 0 },
          { id: '2', text: 'Same', votes: 0 },
        ],
      };

      const result = validatePollData(duplicateData);
      expect(result.warnings).toContain('Duplicate option text: "Same"');
    });

    it('should warn about inconsistent vote metadata', () => {
      const inconsistentData: Partial<PollData> = {
        question: 'Choose an option',
        options: [{ id: '1', text: 'Option', votes: 0 }],
        metadata: {
          totalVotes: 5,
          uniqueVoters: 10, // More unique voters than total votes
        },
      };

      const result = validatePollData(inconsistentData);
      expect(result.warnings).toContain(
        'Unique voters count exceeds total votes (possible data inconsistency)'
      );
    });

    it('should reject invalid styling values', () => {
      const invalidStyling: Partial<PollData> = {
        question: 'Choose an option',
        options: [{ id: '1', text: 'Option', votes: 0 }],
        styling: {
          questionFontSize: 60, // Too large
          optionFontSize: 5, // Too small
          optionPadding: 50, // Too large
        },
      };

      const result = validatePollData(invalidStyling);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question font size must be between 12 and 48 pixels');
      expect(result.errors).toContain('Option font size must be between 10 and 32 pixels');
      expect(result.errors).toContain('Option padding must be between 4 and 40 pixels');
    });
  });

  describe('sanitizePollData', () => {
    it('should sanitize poll with excessive options', () => {
      const excessiveData: Partial<PollData> = {
        question: 'Choose an option',
        options: Array(POLL_LIMITS.MAX_OPTIONS + 5)
          .fill(null)
          .map((_, i) => ({ id: `${i}`, text: `Option ${i}`, votes: 0 })),
      };

      const sanitized = sanitizePollData(excessiveData);
      expect(sanitized.options).toHaveLength(POLL_LIMITS.MAX_OPTIONS);
    });

    it('should ensure minimum poll structure', () => {
      const emptyData: Partial<PollData> = {};

      const sanitized = sanitizePollData(emptyData);
      expect(sanitized.question).toBeTruthy();
      expect(sanitized.options).toHaveLength(2); // Default minimum options
    });

    it('should clamp styling values', () => {
      const invalidStyling: Partial<PollData> = {
        styling: {
          questionFontSize: 60,
          optionFontSize: 5,
          optionPadding: 50,
        },
      };

      const sanitized = sanitizePollData(invalidStyling);
      expect(sanitized.styling.questionFontSize).toBe(48); // Clamped to max
      expect(sanitized.styling.optionFontSize).toBe(10); // Clamped to min
      expect(sanitized.styling.optionPadding).toBe(40); // Clamped to max
    });

    it('should fix negative vote counts', () => {
      const negativeVotes: Partial<PollData> = {
        options: [{ id: '1', text: 'Option', votes: -5 }],
        metadata: {
          totalVotes: -10,
          uniqueVoters: -3,
        },
      };

      const sanitized = sanitizePollData(negativeVotes);
      expect(sanitized.options[0].votes).toBe(0);
      expect(sanitized.metadata.totalVotes).toBe(0);
      expect(sanitized.metadata.uniqueVoters).toBe(0);
    });
  });

  describe('safeUpdatePollData', () => {
    it('should return valid data when update is valid', () => {
      const currentData: Partial<PollData> = {
        question: 'Old question',
        options: [{ id: '1', text: 'Option 1', votes: 0 }],
      };
      const updates: Partial<PollData> = {
        question: 'New question',
      };

      const { data, validation } = safeUpdatePollData(currentData, updates);
      expect(validation.isValid).toBe(true);
      expect(data.question).toBe('New question');
    });

    it('should return sanitized data when update is invalid', () => {
      const currentData: Partial<PollData> = {
        question: 'Valid question',
        options: [{ id: '1', text: 'Option 1', votes: 0 }],
      };
      const invalidUpdates: Partial<PollData> = {
        options: Array(POLL_LIMITS.MAX_OPTIONS + 1)
          .fill(null)
          .map((_, i) => ({ id: `${i}`, text: `Option ${i}`, votes: 0 })),
      };

      const { data, validation } = safeUpdatePollData(currentData, invalidUpdates);
      expect(validation.isValid).toBe(false);
      expect(data.options).toHaveLength(POLL_LIMITS.MAX_OPTIONS);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle null and undefined gracefully', () => {
    const tableResult = validateTableData({});
    expect(tableResult).toBeDefined();

    const pollResult = validatePollData({});
    expect(pollResult).toBeDefined();
  });

  it('should handle malformed data structures', () => {
    const malformedTable = validateTableData({
      headers: 'not an array' as any,
      rows: [{ not: 'an array' }] as any,
    });
    expect(malformedTable.isValid).toBe(false);

    const malformedPoll = validatePollData({
      options: 'not an array' as any,
      metadata: 'not an object' as any,
    });
    expect(malformedPoll.isValid).toBe(false);
  });
});
