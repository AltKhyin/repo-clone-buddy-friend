// ABOUTME: Comprehensive tests for position data validation and sanitization system

import { describe, it, expect, beforeEach } from 'vitest';
import { PositionDataValidator } from '../positionDataValidator';
import { BlockPosition, NodeObject } from '@/types/editor';

describe('PositionDataValidator', () => {
  let validator: PositionDataValidator;
  
  beforeEach(() => {
    validator = new PositionDataValidator();
  });

  describe('detectPhantomPositions', () => {
    it('should detect phantom positions with non-existent node IDs', () => {
      const positions = {
        'real-id': { id: 'real-id', x: 0, y: 100, width: 200, height: 100 },
        'phantom-id-1': { id: 'phantom-id-1', x: 0, y: 5000, width: 100, height: 100 },
        'phantom-id-2': { id: 'phantom-id-2', x: 0, y: 3000, width: 100, height: 100 }
      };
      const nodes = [
        { id: 'real-id', type: 'richBlock', data: {} }
      ] as NodeObject[];
      
      const phantoms = validator.detectPhantomPositions(positions, nodes);
      
      expect(phantoms).toHaveLength(2);
      expect(phantoms).toContain('phantom-id-1');
      expect(phantoms).toContain('phantom-id-2');
      expect(phantoms).not.toContain('real-id');
    });

    it('should return empty array when all positions correspond to existing nodes', () => {
      const positions = {
        'node-1': { id: 'node-1', x: 0, y: 100, width: 200, height: 100 },
        'node-2': { id: 'node-2', x: 0, y: 250, width: 200, height: 100 }
      };
      const nodes = [
        { id: 'node-1', type: 'richBlock', data: {} },
        { id: 'node-2', type: 'richBlock', data: {} }
      ] as NodeObject[];
      
      const phantoms = validator.detectPhantomPositions(positions, nodes);
      
      expect(phantoms).toHaveLength(0);
    });

    it('should handle empty positions object', () => {
      const positions = {};
      const nodes = [{ id: 'node-1', type: 'richBlock', data: {} }] as NodeObject[];
      
      const phantoms = validator.detectPhantomPositions(positions, nodes);
      
      expect(phantoms).toHaveLength(0);
    });
  });

  describe('validatePositionBounds', () => {
    it('should not reject positions with high Y coordinates (reviews can be long)', () => {
      const positions = {
        'normal-pos': { id: 'normal-pos', x: 0, y: 100, width: 200, height: 100 },
        'long-content-pos': { id: 'long-content-pos', x: 0, y: 8000, width: 200, height: 100 }
      };
      const canvasConfig = { width: 800, minHeight: 400, gridColumns: 12 };
      
      const invalidPositions = validator.validatePositionBounds(positions, canvasConfig);
      
      // Should NOT reject high Y coordinates - reviews can be very long
      expect(invalidPositions).toHaveLength(0);
    });

    it('should detect positions with negative coordinates', () => {
      const positions = {
        'negative-pos': { id: 'negative-pos', x: -100, y: -50, width: 200, height: 100 }
      };
      const canvasConfig = { width: 800, minHeight: 400, gridColumns: 12 };
      
      const invalidPositions = validator.validatePositionBounds(positions, canvasConfig);
      
      expect(invalidPositions).toContain('negative-pos');
    });

    it('should detect positions extending beyond canvas width', () => {
      const positions = {
        'overflow-pos': { id: 'overflow-pos', x: 700, y: 100, width: 200, height: 100 }
      };
      const canvasConfig = { width: 800, minHeight: 400, gridColumns: 12 };
      
      const invalidPositions = validator.validatePositionBounds(positions, canvasConfig);
      
      expect(invalidPositions).toContain('overflow-pos');
    });

    it('should accept valid positions within reasonable bounds', () => {
      const positions = {
        'valid-pos-1': { id: 'valid-pos-1', x: 0, y: 100, width: 400, height: 200 },
        'valid-pos-2': { id: 'valid-pos-2', x: 200, y: 350, width: 300, height: 150 }
      };
      const canvasConfig = { width: 800, minHeight: 400, gridColumns: 12 };
      
      const invalidPositions = validator.validatePositionBounds(positions, canvasConfig);
      
      expect(invalidPositions).toHaveLength(0);
    });
  });

  describe('sanitizePositions', () => {
    it('should remove phantom positions while preserving valid ones', () => {
      const positions = {
        'valid-node': { id: 'valid-node', x: 0, y: 100, width: 200, height: 100 },
        'phantom-node': { id: 'phantom-node', x: 0, y: 5000, width: 100, height: 100 },
        'another-valid': { id: 'another-valid', x: 400, y: 200, width: 200, height: 150 }
      };
      const nodes = [
        { id: 'valid-node', type: 'richBlock', data: {} },
        { id: 'another-valid', type: 'richBlock', data: {} }
      ] as NodeObject[];
      const canvasConfig = { width: 800, minHeight: 400, gridColumns: 12 };
      
      const sanitized = validator.sanitizePositions(positions, nodes, canvasConfig);
      
      expect(Object.keys(sanitized)).toHaveLength(2);
      expect(sanitized['valid-node']).toBeDefined();
      expect(sanitized['another-valid']).toBeDefined();
      expect(sanitized['phantom-node']).toBeUndefined();
    });

    it('should keep positions with high Y coordinates (long reviews are valid)', () => {
      const positions = {
        'valid-pos': { id: 'valid-pos', x: 0, y: 100, width: 200, height: 100 },
        'long-content': { id: 'long-content', x: 0, y: 10000, width: 200, height: 100 }
      };
      const nodes = [
        { id: 'valid-pos', type: 'richBlock', data: {} },
        { id: 'long-content', type: 'richBlock', data: {} }
      ] as NodeObject[];
      const canvasConfig = { width: 800, minHeight: 400, gridColumns: 12 };
      
      const sanitized = validator.sanitizePositions(positions, nodes, canvasConfig);
      
      // Should keep both - high Y coordinates are valid for long reviews
      expect(Object.keys(sanitized)).toHaveLength(2);
      expect(sanitized['valid-pos']).toBeDefined();
      expect(sanitized['long-content']).toBeDefined();
    });

    it('should handle empty inputs gracefully', () => {
      const positions = {};
      const nodes = [] as NodeObject[];
      const canvasConfig = { width: 800, minHeight: 400, gridColumns: 12 };
      
      const sanitized = validator.sanitizePositions(positions, nodes, canvasConfig);
      
      expect(sanitized).toEqual({});
    });

    it('should preserve position properties exactly for valid positions', () => {
      const originalPosition = { id: 'test-node', x: 100, y: 200, width: 300, height: 150 };
      const positions = { 'test-node': originalPosition };
      const nodes = [{ id: 'test-node', type: 'richBlock', data: {} }] as NodeObject[];
      const canvasConfig = { width: 800, minHeight: 400, gridColumns: 12 };
      
      const sanitized = validator.sanitizePositions(positions, nodes, canvasConfig);
      
      expect(sanitized['test-node']).toEqual(originalPosition);
    });
  });

  describe('validatePositionIntegrity', () => {
    it('should return comprehensive validation report', () => {
      const positions = {
        'valid-node': { id: 'valid-node', x: 0, y: 100, width: 200, height: 100 },
        'phantom-node': { id: 'phantom-node', x: 0, y: 5000, width: 100, height: 100 },
        'invalid-bounds': { id: 'invalid-bounds', x: -100, y: 100, width: 200, height: 100 }
      };
      const nodes = [
        { id: 'valid-node', type: 'richBlock', data: {} },
        { id: 'invalid-bounds', type: 'richBlock', data: {} }
      ] as NodeObject[];
      const canvasConfig = { width: 800, minHeight: 400, gridColumns: 12 };
      
      const report = validator.validatePositionIntegrity(positions, nodes, canvasConfig);
      
      expect(report.isValid).toBe(false);
      expect(report.phantomPositions).toContain('phantom-node');
      expect(report.invalidBounds).toContain('invalid-bounds');
      expect(report.validPositions).toContain('valid-node');
      expect(report.totalPositions).toBe(3);
      expect(report.validCount).toBe(1);
    });

    it('should report valid state for clean position data', () => {
      const positions = {
        'node-1': { id: 'node-1', x: 0, y: 100, width: 200, height: 100 },
        'node-2': { id: 'node-2', x: 400, y: 200, width: 200, height: 150 }
      };
      const nodes = [
        { id: 'node-1', type: 'richBlock', data: {} },
        { id: 'node-2', type: 'richBlock', data: {} }
      ] as NodeObject[];
      const canvasConfig = { width: 800, minHeight: 400, gridColumns: 12 };
      
      const report = validator.validatePositionIntegrity(positions, nodes, canvasConfig);
      
      expect(report.isValid).toBe(true);
      expect(report.phantomPositions).toHaveLength(0);
      expect(report.invalidBounds).toHaveLength(0);
      expect(report.validCount).toBe(2);
    });
  });

  describe('calculateContentBounds', () => {
    it('should calculate correct content bottom edge', () => {
      const positions = {
        'node-1': { id: 'node-1', x: 0, y: 100, width: 200, height: 150 }, // bottom: 250
        'node-2': { id: 'node-2', x: 400, y: 300, width: 200, height: 200 }, // bottom: 500
        'node-3': { id: 'node-3', x: 100, y: 50, width: 200, height: 100 }  // bottom: 150
      };
      
      const bounds = validator.calculateContentBounds(positions);
      
      expect(bounds.bottomEdge).toBe(500);
      expect(bounds.rightEdge).toBe(600);
      expect(bounds.contentHeight).toBe(500);
      expect(bounds.contentWidth).toBe(600);
    });

    it('should handle empty positions', () => {
      const positions = {};
      
      const bounds = validator.calculateContentBounds(positions);
      
      expect(bounds.bottomEdge).toBe(0);
      expect(bounds.rightEdge).toBe(0);
      expect(bounds.contentHeight).toBe(0);
      expect(bounds.contentWidth).toBe(0);
    });
  });
});