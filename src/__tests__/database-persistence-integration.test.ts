// ABOUTME: Comprehensive database persistence integration test with realistic scenarios

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEditorSaveMutation, useEditorLoadQuery, useEditorAutoSave } from '../../packages/hooks/useEditorPersistence';
import { StructuredContentV2, StructuredContentV3 } from '@/types/editor';
import React from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

// Helper to create React Query wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// Helper to generate valid test UUIDs
const generateTestUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

describe('Database Persistence Integration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Supabase mock
    const { supabase } = require('@/integrations/supabase/client');
    mockSupabase = supabase;
  });

  describe('Save Mutation Flow', () => {
    it('should handle new review creation (INSERT)', async () => {
      const testReviewId = '123';
      const testNodeId = generateTestUUID();
      
      const v3Content: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [{
          id: testNodeId,
          type: 'richBlock',
          data: {
            content: { htmlContent: '<p>New review content</p>' },
            backgroundColor: 'transparent',
            paddingX: 16,
            paddingY: 16,
            borderRadius: 8,
            borderWidth: 0,
            borderColor: '#e5e7eb',
          }
        }],
        positions: {
          [testNodeId]: { id: testNodeId, x: 100, y: 100, width: 600, height: 200 }
        },
        mobilePositions: {
          [testNodeId]: { id: testNodeId, x: 0, y: 0, width: 375, height: 200 }
        },
        canvas: { canvasWidth: 800, canvasHeight: 600, gridColumns: 12, snapTolerance: 10 },
        metadata: { 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(), 
          editorVersion: '2.0.0' 
        }
      };

      // Mock: No existing data (new review)
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } // No rows returned
            })
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: generateTestUUID(),
                review_id: 123,
                structured_content: v3Content,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              error: null
            })
          }))
        }))
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditorSaveMutation(), { wrapper });

      // Execute save mutation
      result.current.mutate({
        reviewId: testReviewId,
        structuredContent: v3Content
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify INSERT path was taken
      expect(mockSupabase.from).toHaveBeenCalledWith('review_editor_content');
      expect(result.current.data).toBeTruthy();
      expect(result.current.data?.review_id).toBe(123);
    });

    it('should handle existing review update (UPDATE)', async () => {
      const testReviewId = '456';
      const existingId = generateTestUUID();
      const testNodeId = generateTestUUID();
      
      const updatedV3Content: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [{
          id: testNodeId,
          type: 'richBlock',
          data: {
            content: { htmlContent: '<p>Updated content</p>' },
            backgroundColor: '#f0f9ff',
            paddingX: 24,
            paddingY: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#0ea5e9',
          }
        }],
        positions: {
          [testNodeId]: { id: testNodeId, x: 200, y: 150, width: 500, height: 300 }
        },
        mobilePositions: {
          [testNodeId]: { id: testNodeId, x: 0, y: 0, width: 375, height: 300 }
        },
        canvas: { canvasWidth: 800, canvasHeight: 600, gridColumns: 12, snapTolerance: 10 },
        metadata: { 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(), 
          editorVersion: '2.0.0' 
        }
      };

      // Mock: Existing data found
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: existingId },
              error: null
            })
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: existingId,
                  review_id: 456,
                  structured_content: updatedV3Content,
                  created_at: '2025-01-01T10:00:00Z',
                  updated_at: new Date().toISOString()
                },
                error: null
              })
            }))
          }))
        }))
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditorSaveMutation(), { wrapper });

      result.current.mutate({
        reviewId: testReviewId,
        structuredContent: updatedV3Content
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify UPDATE path was taken
      expect(result.current.data?.id).toBe(existingId);
      expect(result.current.data?.review_id).toBe(456);
    });

    it('should migrate V2 content during save', async () => {
      const testReviewId = '789';
      const testNodeId = generateTestUUID();
      
      const v2Content: StructuredContentV2 = {
        version: '2.0.0',
        nodes: [{
          id: testNodeId,
          type: 'richBlock',
          data: {
            content: { htmlContent: '<p>V2 content to migrate</p>' },
            backgroundColor: 'transparent',
            paddingX: 16,
            paddingY: 16,
            borderRadius: 8,
            borderWidth: 0,
            borderColor: '#e5e7eb',
          }
        }],
        layouts: {
          lg: [{ i: testNodeId, x: 0, y: 0, w: 8, h: 4 }],
          md: [{ i: testNodeId, x: 0, y: 0, w: 8, h: 4 }],
          sm: [{ i: testNodeId, x: 0, y: 0, w: 4, h: 4 }],
          xs: [{ i: testNodeId, x: 0, y: 0, w: 4, h: 4 }]
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editorVersion: '1.0.0'
        }
      };

      // Mock: No existing data, will insert migrated content
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' }
            })
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockImplementation(async () => {
              // Capture what would be saved to verify migration happened
              const insertCall = mockSupabase.from().insert;
              const savedContent = insertCall.mock.calls[0][0].structured_content;
              
              return {
                data: {
                  id: generateTestUUID(),
                  review_id: 789,
                  structured_content: savedContent, // Return what was actually saved
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                error: null
              };
            })
          }))
        }))
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditorSaveMutation(), { wrapper });

      result.current.mutate({
        reviewId: testReviewId,
        structuredContent: v2Content
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify V2 content was migrated to V3 during save
      const savedContent = result.current.data?.structured_content;
      expect(savedContent.version).toBe('3.0.0');
      expect(savedContent.positions).toBeDefined();
      expect(savedContent.mobilePositions).toBeDefined();
      expect(savedContent.canvas).toBeDefined();
      expect(savedContent.metadata?.migratedFrom).toBe('v2-layouts');
      
      // Verify positions were calculated from layouts
      expect(savedContent.positions[testNodeId]).toEqual({
        id: testNodeId,
        x: 0, // 0 * (800/12) = 0
        y: 0, // 0 * 50 = 0  
        width: 533.3333333333334, // 8 * (800/12)
        height: 200 // 4 * 50
      });
    });
  });

  describe('Load Query Flow', () => {
    it('should load and validate existing V3 content', async () => {
      const testReviewId = '101';
      const testNodeId = generateTestUUID();
      
      const existingV3Content: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [{
          id: testNodeId,
          type: 'richBlock',
          data: {
            content: { htmlContent: '<p>Existing content</p>' },
            backgroundColor: 'transparent',
            paddingX: 16,
            paddingY: 16,
            borderRadius: 8,
            borderWidth: 0,
            borderColor: '#e5e7eb',
          }
        }],
        positions: {
          [testNodeId]: { id: testNodeId, x: 100, y: 100, width: 600, height: 200 }
        },
        mobilePositions: {
          [testNodeId]: { id: testNodeId, x: 0, y: 0, width: 375, height: 200 }
        },
        canvas: { canvasWidth: 800, canvasHeight: 600, gridColumns: 12, snapTolerance: 10 },
        metadata: { 
          createdAt: '2025-01-01T10:00:00Z', 
          updatedAt: '2025-01-01T11:00:00Z', 
          editorVersion: '2.0.0' 
        }
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: generateTestUUID(),
                review_id: 101,
                structured_content: existingV3Content,
                created_at: '2025-01-01T10:00:00Z',
                updated_at: '2025-01-01T11:00:00Z'
              },
              error: null
            })
          }))
        }))
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditorLoadQuery(testReviewId), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.structured_content.version).toBe('3.0.0');
      expect(result.current.data?.structured_content.nodes).toHaveLength(1);
      expect(result.current.data?.structured_content.positions).toBeDefined();
      expect(result.current.data?.structured_content.mobilePositions).toBeDefined();
    });

    it('should handle no content found (new review)', async () => {
      const testReviewId = '404';

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // No rows returned
            })
          }))
        }))
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditorLoadQuery(testReviewId), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('Auto-Save Integration', () => {
    it('should trigger auto-save after debounce period', async () => {
      const testReviewId = '555';
      const testNodeId = generateTestUUID();
      
      const contentToSave: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [{
          id: testNodeId,
          type: 'richBlock',
          data: {
            content: { htmlContent: '<p>Auto-saved content</p>' },
            backgroundColor: 'transparent',
            paddingX: 16,
            paddingY: 16,
            borderRadius: 8,
            borderWidth: 0,
            borderColor: '#e5e7eb',
          }
        }],
        positions: {
          [testNodeId]: { id: testNodeId, x: 100, y: 100, width: 600, height: 200 }
        },
        mobilePositions: {
          [testNodeId]: { id: testNodeId, x: 0, y: 0, width: 375, height: 200 }
        },
        canvas: { canvasWidth: 800, canvasHeight: 600, gridColumns: 12, snapTolerance: 10 },
        metadata: { 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(), 
          editorVersion: '2.0.0' 
        }
      };

      // Mock successful auto-save
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' }
            })
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: generateTestUUID(),
                review_id: 555,
                structured_content: contentToSave,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              error: null
            })
          }))
        }))
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useEditorAutoSave(testReviewId, contentToSave, true, 100), // 100ms debounce for testing
        { wrapper }
      );

      // Initially not saving
      expect(result.current.isSaving).toBe(false);

      // Wait for auto-save to trigger
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      }, { timeout: 200 });

      expect(result.current.lastSaveResult).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const testReviewId = '999';
      const testContent: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [],
        positions: {},
        mobilePositions: {},
        canvas: { canvasWidth: 800, canvasHeight: 600, gridColumns: 12, snapTolerance: 10 },
        metadata: { 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(), 
          editorVersion: '2.0.0' 
        }
      };

      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection timeout', code: 'TIMEOUT' }
            })
          }))
        }))
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditorSaveMutation(), { wrapper });

      result.current.mutate({
        reviewId: testReviewId,
        structuredContent: testContent
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Failed to check existing editor content');
    });

    it('should handle invalid reviewId gracefully', async () => {
      const invalidReviewId = 'not-a-number';
      const testContent: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [],
        positions: {},
        mobilePositions: {},
        canvas: { canvasWidth: 800, canvasHeight: 600, gridColumns: 12, snapTolerance: 10 },
        metadata: { 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(), 
          editorVersion: '2.0.0' 
        }
      };

      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditorSaveMutation(), { wrapper });

      result.current.mutate({
        reviewId: invalidReviewId,
        structuredContent: testContent
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Invalid reviewId');
    });
  });
});