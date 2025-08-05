# [DOC_11] EVIDENS Color System Architecture

**Version**: 1.0  
**Date**: January 2025  
**Purpose**: Complete technical documentation for the EVIDENS unified color system implementation, including security features, testing patterns, and architectural decisions.

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Architecture](#2-component-architecture)
3. [Security Implementation](#3-security-implementation)
4. [Testing Framework](#4-testing-framework)
5. [Performance Optimization](#5-performance-optimization)
6. [Integration Patterns](#6-integration-patterns)

---

## 1. System Overview

The EVIDENS color system is built around a **unified, token-based approach** that provides:

- **Theme-aware color management** with automatic token resolution
- **Security-first CSS injection prevention** for all color inputs
- **Comprehensive testing coverage** with 112+ tests across security, performance, and integration
- **Centralized token management** eliminating code duplication
- **Performance-optimized** validation with sub-millisecond response times

### 1.1 Core Architecture Principles

1. **Token-First Design**: All colors use CSS custom properties (`hsl(var(--token))`) over hardcoded values
2. **Security-First Input Handling**: All user color inputs are sanitized against CSS injection attacks
3. **Centralized Management**: Single source of truth for all color tokens and validation logic
4. **Type-Safe Integration**: Full TypeScript support with comprehensive type definitions
5. **Performance Optimized**: O(1) Map lookups and memoized validation functions

---

## 2. Component Architecture

### 2.1 UnifiedColorPicker Component

**File**: `/src/components/editor/shared/UnifiedColorPicker.tsx`

The core component providing both theme token selection and custom color input:

```typescript
interface UnifiedColorPickerProps {
  value?: ColorValue;
  onColorSelect: (color: ColorValue) => void;
  onColorClear?: () => void;
  mode?: ColorSelectionMode; // 'tokens' | 'custom' | 'both'
  variant?: 'icon' | 'button' | 'input';
  // ... additional props
}
```

**Key Features**:
- Dual mode operation (theme tokens + custom colors)
- Automatic token validation and preview
- Accessibility-compliant color selection
- Security-validated custom color input

### 2.2 Color Token Management

**File**: `/src/utils/color-tokens.ts`

Centralized token management with comprehensive token definitions:

```typescript
// Complete token system
export const ALL_COLOR_TOKENS: ColorToken[] = [
  // Primary theme tokens
  { id: 'foreground', name: 'Default Text', value: 'hsl(var(--foreground))', category: 'primary' },
  { id: 'background', name: 'Background', value: 'hsl(var(--background))', category: 'primary' },
  
  // Semantic tokens
  { id: 'success', name: 'Success', value: 'hsl(var(--success))', category: 'semantic' },
  { id: 'destructive', name: 'Error', value: 'hsl(var(--destructive))', category: 'semantic' },
  
  // Editor-specific tokens
  { id: 'quote-border', name: 'Quote Border', value: 'hsl(var(--quote-border))', category: 'editor' },
  // ... comprehensive token definitions
];

// Performance-optimized token lookup
export const COLOR_TOKEN_MAP = new Map(
  ALL_COLOR_TOKENS.map(token => [token.id, token])
);
```

### 2.3 React Hook Integration

**File**: `/src/hooks/useColorTokens.ts`

Theme-aware React hook for color management:

```typescript
export function useColorTokens() {
  return {
    allTokens: ALL_COLOR_TOKENS,
    resolveColor: (value: string) => string,
    validateColor: (value: string) => ColorValidationResult,
    getPreviewColor: (value: string) => string,
    isToken: (value: string) => boolean,
    getTokensForUseCase: (useCase: string) => ColorToken[],
  };
}
```

---

## 3. Security Implementation

### 3.1 CSS Injection Prevention

**File**: `/src/utils/color-sanitization.ts`

**Critical Security Feature**: Prevents CSS injection attacks through user-provided color values.

```typescript
export function sanitizeColorForStyle(color: string | undefined): string {
  if (!color || typeof color !== 'string') {
    return 'transparent';
  }

  // Block dangerous CSS injection patterns
  const dangerousPatterns = [
    /javascript:/i,    // JavaScript URLs
    /expression\(/i,   // IE expression() functions
    /url\(/i,         // CSS url() functions
    /data:/i,         // Data URLs
    /@import/i,       // CSS imports
    /behavior:/i,     // IE behaviors
    /binding:/i,      // Mozilla bindings
  ];

  if (dangerousPatterns.some(pattern => pattern.test(color.trim()))) {
    console.warn(`Blocked potentially dangerous color value: ${color.trim()}`);
    return 'transparent';
  }

  if (!validateColorOrToken(color.trim())) {
    console.warn(`Invalid color format blocked: ${color.trim()}`);
    return 'transparent';
  }

  return color.trim();
}
```

**Security Coverage**:
- JavaScript injection prevention
- CSS expression blocking
- URL and data URI filtering
- Comprehensive input validation
- Safe fallback values

### 3.2 Safe DOM Injection

All color values injected into DOM are processed through sanitization:

```typescript
// Safe style injection pattern
{(() => {
  const sanitizedColors = sanitizeStyleColors({
    color: formData.text_color,
    borderColor: formData.border_color,
    backgroundColor: formData.background_color,
  });
  return (
    <Badge style={sanitizedColors} className="text-sm">
      {formData.label || 'Content'}
    </Badge>
  );
})()}
```

---

## 4. Testing Framework

### 4.1 Test Coverage Overview

**Total Test Count**: 112+ tests across multiple categories
**Coverage Areas**:
- Component interaction testing (24 tests)
- Security validation testing (28 tests)
- Token management testing (32 tests)
- Integration testing (23 tests)
- Performance validation (5+ tests)

### 4.2 Security Testing

**File**: `/src/utils/__tests__/color-sanitization.test.ts`

```typescript
describe('Color Sanitization Security', () => {
  it('should block CSS injection attempts', () => {
    expect(sanitizeColorForStyle('javascript:alert(1)')).toBe('transparent');
    expect(sanitizeColorForStyle('expression(alert(1))')).toBe('transparent');
    expect(sanitizeColorForStyle('url(javascript:alert(1))')).toBe('transparent');
  });

  it('should allow valid colors', () => {
    expect(sanitizeColorForStyle('#ff0000')).toBe('#ff0000');
    expect(sanitizeColorForStyle('hsl(var(--primary))')).toBe('hsl(var(--primary))');
  });
});
```

### 4.3 Component Testing

**File**: `/src/components/editor/shared/__tests__/UnifiedColorPicker.test.tsx`

```typescript
describe('UnifiedColorPicker Integration', () => {
  it('should handle token selection correctly', async () => {
    render(<UnifiedColorPicker onColorSelect={mockCallback} mode="tokens" />);
    
    const tokenButton = screen.getByLabelText('Select Primary color');
    await user.click(tokenButton);
    
    expect(mockCallback).toHaveBeenCalledWith('hsl(var(--primary))');
  });

  it('should validate custom color input', async () => {
    render(<UnifiedColorPicker onColorSelect={mockCallback} mode="custom" />);
    
    const input = screen.getByLabelText('Custom color input');
    await user.type(input, '#invalid');
    
    expect(screen.getByText(/Invalid color format/)).toBeInTheDocument();
  });
});
```

---

## 5. Performance Optimization

### 5.1 Validation Performance

**Benchmark Results**:
- Token validation: **0.002ms average**
- Color format validation: **0.001ms average**
- Map lookup vs array search: **35% faster**

### 5.2 Optimization Techniques

1. **Map-based Token Lookup**: O(1) complexity vs O(n) array searches
2. **Memoized Validation Functions**: Cached results for repeated validations
3. **Lazy Component Loading**: Color picker loaded only when needed
4. **Optimized Bundle Size**: 1.83kB reduction through code deduplication

```typescript
// Performance-optimized token lookup
export const COLOR_TOKEN_MAP = new Map(
  ALL_COLOR_TOKENS.map(token => [token.id, token])
);

export function getTokenById(id: string): ColorToken | undefined {
  return COLOR_TOKEN_MAP.get(id); // O(1) lookup
}
```

---

## 6. Integration Patterns

### 6.1 Component Integration

**Standard Implementation Pattern**:

```typescript
// Import centralized tokens and hooks
import { useColorTokens } from '@/hooks/useColorTokens';
import { TEXT_COLOR_TOKENS } from '@/constants/color-picker-tokens';
import { sanitizeStyleColors } from '@/utils/color-sanitization';

function MyComponent({ color }: { color: string }) {
  const { validateColor } = useColorTokens();
  
  // Validate and sanitize color
  const validation = validateColor(color);
  if (!validation.isValid) {
    console.warn('Invalid color:', validation.error);
  }
  
  const safeStyle = sanitizeStyleColors({ color });
  
  return <div style={safeStyle}>Content</div>;
}
```

### 6.2 Form Integration

**Centralized Color Handling**:

```typescript
import { useColorHandling } from '@/hooks/useColorHandling';

function FormComponent() {
  const [formData, setFormData] = useState(initialData);
  const { handleColorChange } = useColorHandling(setFormData);
  
  return (
    <UnifiedColorPicker
      value={formData.color}
      onColorSelect={(color) => handleColorChange('color', color)}
      mode="both"
      customTokens={TEXT_COLOR_TOKENS}
    />
  );
}
```

---

## 7. Architectural Decision Records

### 7.1 Token-Based vs Direct Color Values

**Decision**: Use CSS custom properties (`hsl(var(--token))`) over hardcoded hex values

**Rationale**:
- Automatic theme switching without component re-renders
- Centralized color management and consistency
- Better accessibility and user preference support
- Easier maintenance and design system evolution

### 7.2 Security-First Approach

**Decision**: Sanitize all user color inputs by default

**Rationale**:
- Prevent CSS injection attacks
- Ensure system security with user-generated content
- Maintain compliance with security best practices
- Provide safe fallbacks for invalid inputs

### 7.3 Centralized Hook Pattern

**Decision**: Single `useColorTokens` hook vs multiple specialized hooks

**Rationale**:
- Reduced bundle size through code sharing
- Consistent API across all components
- Easier testing and maintenance
- Better TypeScript inference and type safety

---

## 8. Migration and Compatibility

### 8.1 Legacy Component Support

All existing components continue to work with the new system through:
- Backward-compatible token names
- Automatic fallback values
- Progressive enhancement patterns

### 8.2 Future Extensibility

The system is designed for easy extension:
- Plugin-based token sets
- Custom validation rules
- Additional security patterns
- Enhanced theme support

---

## 9. Developer Guidelines

### 9.1 Adding New Color Tokens

1. Add token definition to `ALL_COLOR_TOKENS` in `/src/utils/color-tokens.ts`
2. Update CSS custom properties in `/src/index.css`
3. Add corresponding tests in `/__tests__/` files
4. Update documentation in this file

### 9.2 Security Considerations

- **Always** use `sanitizeColorForStyle()` for user inputs
- **Never** inject raw user color values into DOM
- **Test** all color inputs against injection patterns
- **Validate** color formats before processing

### 9.3 Performance Best Practices

- Use token lookups over array searches
- Memoize expensive validation operations
- Lazy load color picker components
- Cache validation results when possible

---

*This document represents the complete technical architecture of the EVIDENS color system as of January 2025. For implementation details, refer to the specific files mentioned throughout this documentation.*