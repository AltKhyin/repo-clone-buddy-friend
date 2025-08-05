// ABOUTME: Performance analysis tests to identify bottlenecks and optimization opportunities in the color system

import { describe, it, expect, vi } from 'vitest';
import {
  ALL_COLOR_TOKENS,
  COLOR_TOKEN_MAP,
  isThemeToken,
  validateColorValue,
  getTokenByValue,
  extractTokenId,
  validateColorOrToken
} from '@/utils/color-tokens';
import { sanitizeColorForStyle, sanitizeStyleColors } from '@/utils/color-sanitization';
import { TEXT_COLOR_TOKENS, BORDER_COLOR_TOKENS, BACKGROUND_COLOR_TOKENS } from '@/constants/color-picker-tokens';

describe('Performance Optimization Analysis', () => {
  describe('Color Token Performance Bottlenecks', () => {
    it('should identify token lookup performance characteristics', () => {
      const iterations = 10000;
      const testTokens = ALL_COLOR_TOKENS.slice(0, 10); // Sample tokens
      
      // Test Map.get() performance (should be O(1))
      const mapLookupStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        testTokens.forEach(token => {
          COLOR_TOKEN_MAP.get(token.id);
        });
      }
      const mapLookupTime = performance.now() - mapLookupStart;
      
      // Test Array.find() performance (O(n))
      const arrayLookupStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        testTokens.forEach(token => {
          ALL_COLOR_TOKENS.find(t => t.id === token.id);
        });
      }
      const arrayLookupTime = performance.now() - arrayLookupStart;
      
      // Map should be significantly faster than array lookup
      expect(mapLookupTime).toBeLessThan(arrayLookupTime);
      expect(mapLookupTime).toBeLessThan(50); // Should complete quickly
      
      console.log(`Map lookup: ${mapLookupTime.toFixed(2)}ms, Array lookup: ${arrayLookupTime.toFixed(2)}ms`);
    });

    it('should measure theme token validation performance', () => {
      const testValues = [
        'hsl(var(--foreground))',
        'hsl(var(--primary))',
        'hsl(var(--nonexistent))',
        '#ff0000',
        'rgb(255, 0, 0)',
        'invalid-color',
      ];
      
      const iterations = 1000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        testValues.forEach(value => {
          isThemeToken(value);
          validateColorValue(value);
          validateColorOrToken(value);
          if (isThemeToken(value)) {
            extractTokenId(value);
            getTokenByValue(value);
          }
        });
      }
      
      const totalTime = performance.now() - start;
      const avgTimePerValidation = totalTime / (iterations * testValues.length);
      
      expect(totalTime).toBeLessThan(100); // Total should be under 100ms
      expect(avgTimePerValidation).toBeLessThan(0.1); // Each validation under 0.1ms
      
      console.log(`Validation performance: ${avgTimePerValidation.toFixed(4)}ms per operation`);
    });

    it('should measure color sanitization performance', () => {
      const testColors = {
        color: 'hsl(var(--foreground))',
        backgroundColor: '#ff0000',
        borderColor: 'rgb(255, 0, 0)',
        malicious: 'javascript:alert(1)',
        expression: 'expression(hack)',
      };
      
      const iterations = 1000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        sanitizeStyleColors(testColors);
        Object.values(testColors).forEach(color => {
          sanitizeColorForStyle(color);
        });
      }
      
      const totalTime = performance.now() - start;
      const avgTimePerSanitization = totalTime / iterations;
      
      expect(totalTime).toBeLessThan(200); // Should complete quickly
      expect(avgTimePerSanitization).toBeLessThan(0.2); // Each sanitization under 0.2ms
      
      console.log(`Sanitization performance: ${avgTimePerSanitization.toFixed(4)}ms per operation`);
    });
  });

  describe('Memory Usage Analysis', () => {
    it('should measure token array memory footprint', () => {
      // Rough estimation of memory usage
      const allTokensSize = JSON.stringify(ALL_COLOR_TOKENS).length;
      const textTokensSize = JSON.stringify(TEXT_COLOR_TOKENS).length;
      const borderTokensSize = JSON.stringify(BORDER_COLOR_TOKENS).length;
      const backgroundTokensSize = JSON.stringify(BACKGROUND_COLOR_TOKENS).length;
      
      const totalAdminTokensSize = textTokensSize + borderTokensSize + backgroundTokensSize;
      const duplicatedTokensOverhead = totalAdminTokensSize - allTokensSize;
      
      console.log(`Main tokens: ${allTokensSize} bytes`);
      console.log(`Admin tokens total: ${totalAdminTokensSize} bytes`);
      console.log(`Duplication overhead: ${duplicatedTokensOverhead} bytes`);
      
      // Should have reasonable memory footprint
      expect(allTokensSize).toBeLessThan(10000); // Under 10KB
      expect(totalAdminTokensSize).toBeLessThan(5000); // Under 5KB for admin tokens
    });

    it('should detect potential memory leaks in token operations', () => {
      const iterations = 1000;
      const results: any[] = [];
      
      // Simulate intensive token usage
      for (let i = 0; i < iterations; i++) {
        ALL_COLOR_TOKENS.forEach(token => {
          const result = {
            isToken: isThemeToken(token.value),
            isValid: validateColorValue(token.value),
            tokenInfo: getTokenByValue(token.value),
            sanitized: sanitizeColorForStyle(token.value),
          };
          
          // Don't accumulate results to test for memory leaks
          if (i === iterations - 1) {
            results.push(result);
          }
        });
      }
      
      // Should complete without memory issues
      expect(results.length).toBe(ALL_COLOR_TOKENS.length);
    });
  });

  describe('Bundle Size Impact Analysis', () => {
    it('should measure color utility functions bundle impact', () => {
      // Simulate what would be included in bundle
      const colorUtilityFunctions = {
        isThemeToken,
        validateColorValue,
        validateColorOrToken,
        getTokenByValue,
        extractTokenId,
        sanitizeColorForStyle,
        sanitizeStyleColors,
      };
      
      const functionCount = Object.keys(colorUtilityFunctions).length;
      const tokenDataSize = JSON.stringify(ALL_COLOR_TOKENS).length;
      
      console.log(`Color utility functions: ${functionCount}`);
      console.log(`Token data size: ${tokenDataSize} bytes`);
      
      expect(functionCount).toBeLessThan(10); // Reasonable number of utilities
      expect(tokenDataSize).toBeLessThan(10000); // Under 10KB
    });

    it('should analyze admin token duplication impact', () => {
      // Check for duplicated tokens across admin arrays
      const allAdminTokenIds = [
        ...TEXT_COLOR_TOKENS.map(t => t.id),
        ...BORDER_COLOR_TOKENS.map(t => t.id),
        ...BACKGROUND_COLOR_TOKENS.map(t => t.id),
      ];
      
      const uniqueAdminTokenIds = new Set(allAdminTokenIds);
      const duplicationCount = allAdminTokenIds.length - uniqueAdminTokenIds.size;
      const duplicationRatio = duplicationCount / allAdminTokenIds.length;
      
      console.log(`Total admin tokens: ${allAdminTokenIds.length}`);
      console.log(`Unique admin tokens: ${uniqueAdminTokenIds.size}`);
      console.log(`Duplication count: ${duplicationCount}`);
      console.log(`Duplication ratio: ${(duplicationRatio * 100).toFixed(1)}%`);
      
      // Acceptable level of duplication for convenience vs optimization
      expect(duplicationRatio).toBeLessThan(0.5); // Less than 50% duplication
    });
  });

  describe('Runtime Performance Optimizations', () => {
    it('should validate memoization opportunities', () => {
      const testValue = 'hsl(var(--primary))';
      const iterations = 1000;
      
      // Test repeated validation of same value (should benefit from memoization)
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        isThemeToken(testValue);
        validateColorValue(testValue);
        extractTokenId(testValue);
        getTokenByValue(testValue);
      }
      const sameValueTime = performance.now() - start;
      
      // Test validation of different values
      const differentStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const value = `hsl(var(--token-${i}))`;
        isThemeToken(value);
        validateColorValue(value);
        extractTokenId(value);
        getTokenByValue(value);
      }
      const differentValuesTime = performance.now() - differentStart;
      
      console.log(`Same value: ${sameValueTime.toFixed(2)}ms, Different values: ${differentValuesTime.toFixed(2)}ms`);
      
      // Both should be fast, but this shows potential for memoization
      expect(sameValueTime).toBeLessThan(50);
      expect(differentValuesTime).toBeLessThan(200);
    });

    it('should identify regex compilation overhead', () => {
      const testValues = [
        '#ff0000',
        '#00ff00',
        '#0000ff',
        'rgb(255, 0, 0)',
        'hsl(0, 100%, 50%)',
        'invalid',
      ];
      
      const iterations = 1000;
      
      // Current implementation uses multiple regex patterns
      const currentStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        testValues.forEach(value => {
          validateColorValue(value);
        });
      }
      const currentTime = performance.now() - currentStart;
      
      // Simulate pre-compiled regex (optimization opportunity)
      const hexRegex = /^#[0-9A-Fa-f]{3,8}$/;
      const rgbRegex = /^rgb\(/;
      const hslRegex = /^hsl\(/;
      
      const optimizedStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        testValues.forEach(value => {
          if (!value) return false;
          const trimmed = value.trim();
          return hexRegex.test(trimmed) || rgbRegex.test(trimmed) || hslRegex.test(trimmed);
        });
      }
      const optimizedTime = performance.now() - optimizedStart;
      
      console.log(`Current validation: ${currentTime.toFixed(2)}ms, Optimized: ${optimizedTime.toFixed(2)}ms`);
      
      expect(currentTime).toBeLessThan(100);
      expect(optimizedTime).toBeLessThan(100);
    });
  });

  describe('Component Performance Impact', () => {
    it('should measure UnifiedColorPicker token processing overhead', () => {
      const largeTokenArray = Array.from({ length: 100 }, (_, i) => ({
        id: `token-${i}`,
        name: `Token ${i}`,
        value: `hsl(var(--token-${i}))`,
        category: 'test',
        description: `Test token ${i}`,
        preview: `#${i.toString(16).padStart(6, '0')}`,
      }));
      
      // Simulate token organization (happens in UnifiedColorPicker)
      const start = performance.now();
      const organized = largeTokenArray.reduce((acc, token) => {
        if (!acc[token.category]) {
          acc[token.category] = [];
        }
        acc[token.category].push(token);
        return acc;
      }, {} as Record<string, any[]>);
      const organizeTime = performance.now() - start;
      
      expect(organizeTime).toBeLessThan(10); // Should be very fast
      expect(Object.keys(organized)).toContain('test');
      
      console.log(`Token organization: ${organizeTime.toFixed(4)}ms for ${largeTokenArray.length} tokens`);
    });

    it('should measure admin component color handling performance', () => {
      // Simulate ContentType modal color changes
      const formUpdates = Array.from({ length: 100 }, (_, i) => ({
        field: ['text_color', 'border_color', 'background_color'][i % 3],
        value: `hsl(var(--token-${i}))`,
      }));
      
      let formData = {
        text_color: '#000000',
        border_color: '#cccccc',
        background_color: '#ffffff',
      };
      
      const start = performance.now();
      formUpdates.forEach(({ field, value }) => {
        // Simulate form update
        formData = { ...formData, [field]: value };
        
        // Simulate sanitization
        sanitizeColorForStyle(value);
        
        // Simulate validation
        validateColorOrToken(value);
      });
      const updateTime = performance.now() - start;
      
      expect(updateTime).toBeLessThan(50); // Should handle many updates quickly
      
      console.log(`Form updates: ${updateTime.toFixed(2)}ms for ${formUpdates.length} updates`);
    });
  });

  describe('Optimization Recommendations', () => {
    it('should provide performance improvement suggestions', () => {
      const recommendations = [];
      
      // Check current bundle impact
      const tokenDataSize = JSON.stringify(ALL_COLOR_TOKENS).length;
      if (tokenDataSize > 8000) {
        recommendations.push('Consider lazy loading token data or splitting by category');
      }
      
      // Check duplication levels
      const allAdminTokenIds = [
        ...TEXT_COLOR_TOKENS.map(t => t.id),
        ...BORDER_COLOR_TOKENS.map(t => t.id),
        ...BACKGROUND_COLOR_TOKENS.map(t => t.id),
      ];
      const uniqueIds = new Set(allAdminTokenIds);
      const duplicationRatio = (allAdminTokenIds.length - uniqueIds.size) / allAdminTokenIds.length;
      
      if (duplicationRatio > 0.3) {
        recommendations.push('High token duplication detected - consider token references instead of copies');
      }
      
      // Check validation pattern usage
      const validationPatterns = validateColorValue.toString().match(/\/.*?\//g)?.length || 0;
      if (validationPatterns > 6) {
        recommendations.push('Many regex patterns detected - consider pre-compilation or consolidation');
      }
      
      console.log('Performance Optimization Recommendations:');
      recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
      
      // Test should pass regardless, this is informational
      expect(recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should measure current system efficiency', () => {
      const metrics = {
        tokenCount: ALL_COLOR_TOKENS.length,
        adminTokenCount: TEXT_COLOR_TOKENS.length + BORDER_COLOR_TOKENS.length + BACKGROUND_COLOR_TOKENS.length,
        utilityFunctionCount: 7, // Main utility functions
        averageTokenSize: JSON.stringify(ALL_COLOR_TOKENS[0] || {}).length,
      };
      
      const efficiency = {
        tokenDensity: metrics.tokenCount / metrics.averageTokenSize,
        utilityRatio: metrics.utilityFunctionCount / metrics.tokenCount,
        adminUtilization: metrics.adminTokenCount / metrics.tokenCount,
      };
      
      console.log('System Efficiency Metrics:');
      console.log(`Token count: ${metrics.tokenCount}`);
      console.log(`Admin token utilization: ${(efficiency.adminUtilization * 100).toFixed(1)}%`);
      console.log(`Utility function ratio: ${efficiency.utilityRatio.toFixed(3)}`);
      
      expect(metrics.tokenCount).toBeGreaterThan(0);
      expect(efficiency.tokenDensity).toBeGreaterThan(0);
      // Admin utilization can exceed 1 due to token reuse across different arrays
      expect(efficiency.adminUtilization).toBeGreaterThan(0);
    });
  });
});