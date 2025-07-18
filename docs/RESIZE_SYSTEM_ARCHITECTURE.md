# EVIDENS Editor Resize System Architecture

## Executive Summary

This document outlines the architectural redesign of the EVIDENS editor's resize system to eliminate the "blocks flying away" issue through systematic fixes to position feedback loops, state race conditions, and constraint application order.

## Problem Analysis

### Critical Issues Identified

1. **Position Feedback Loops** - Using current position instead of resize start coordinates
2. **State Race Conditions** - Concurrent resize operations causing state corruption
3. **Boundary Constraint Conflicts** - Incorrect constraint application order
4. **Minimum Size Edge Cases** - Position adjustment during size enforcement
5. **Zoom Scaling Inconsistencies** - Inconsistent coordinate scaling
6. **Grid Snapping Interference** - Snapping applied before other constraints

### Root Cause: Position Feedback Loop

The primary issue was in `WYSIWYGCanvas.tsx:196-221` where resize calculations used current position values:

```typescript
// PROBLEMATIC CODE (OLD)
newX = position.x + (resizeStartSize.width - newWidth);
```

This created exponential error accumulation as each resize operation used the previous operation's result.

## Architectural Solution

### 1. ResizeCalculator Class

**Purpose**: Centralized, deterministic resize calculation engine

**Key Features**:

- Uses resize start coordinates exclusively
- Applies constraints in strict order
- Immutable calculations prevent state corruption
- Comprehensive validation and error handling

```typescript
class ResizeCalculator {
  calculateResize(resizeState, currentMousePosition, zoom): ResizeCalculation {
    // 1. Calculate raw resize from START position
    const rawCalculation = this.calculateRawResize(startPosition, deltaX, deltaY);

    // 2. Apply constraints in strict order
    result = this.applySizeConstraints(result); // Minimum sizes
    result = this.applyPositionConstraints(result); // Canvas bounds
    result = this.applyCanvasConstraints(result); // Width limits
    result = this.applyGridSnapping(result); // Grid alignment

    return result;
  }
}
```

### 2. useResizeSystem Hook

**Purpose**: Stateful resize management with operation locking

**Key Features**:

- Debounced updates prevent race conditions
- Operation locks prevent concurrent modifications
- Immutable state snapshots
- Automatic cleanup on unmount

```typescript
export function useResizeSystem(blockPosition, zoom, onPositionChange) {
  const [resizeState, setResizeState] = useState({
    startBlockPosition: blockPosition, // CRITICAL: Snapshot start position
    startBlockSize: { width, height },
    // ...
  });

  const debouncedUpdatePosition = useCallback(
    debounce(onPositionChange, 16), // 60fps
    [onPositionChange]
  );

  return { startResize, updateResize, endResize };
}
```

### 3. Enhanced DraggableBlock Component

**Purpose**: Integrated drag and resize with proper event handling

**Key Features**:

- Separated drag and resize operations
- Operation locks prevent conflicts
- Proper event propagation control
- Unified status management

### 4. Constraint Application Order

**Critical Fix**: Constraints now apply in strict order to prevent conflicts:

```typescript
enum ConstraintOrder {
  SIZE_MINIMUMS = 1, // Enforce minimum dimensions first
  POSITION_BOUNDS = 2, // Ensure position is within canvas
  CANVAS_BOUNDS = 3, // Ensure block doesn't exceed canvas
  GRID_SNAPPING = 4, // Apply snapping last to avoid conflicts
}
```

## Implementation Strategy

### Phase 1: Core Architecture (TDD)

- ✅ Create comprehensive test suite
- ✅ Implement ResizeCalculator class
- ✅ Create useResizeSystem hook
- ✅ Build ResizeHandle components

### Phase 2: Integration

- ✅ Update DraggableBlock component
- ✅ Integrate with WYSIWYGCanvas
- ✅ Add enhanced validation
- ✅ Implement operation locking

### Phase 3: Validation

- ✅ Run comprehensive test suite
- ✅ Performance optimization
- ✅ Edge case handling
- ✅ Documentation completion

## Technical Specifications

### Coordinate System

- **Canvas**: 800px fixed width
- **Grid**: 12-column system (~66.67px columns)
- **Zoom**: 0.5x to 2.0x scaling
- **Snap Tolerance**: 10px grid alignment

### Constraints

- **Minimum Size**: 50px × 30px
- **Maximum Size**: Canvas boundaries
- **Position Bounds**: 0,0 to canvas dimensions
- **Grid Snapping**: Optional 10px tolerance

### Performance

- **Debounced Updates**: 16ms (60fps)
- **Operation Locking**: Prevents race conditions
- **Immutable State**: Eliminates side effects
- **Selective Updates**: Only changed properties

## Testing Strategy

### Unit Tests

- ResizeCalculator constraint application
- useResizeSystem state management
- Position calculation accuracy
- Boundary constraint validation

### Integration Tests

- Drag and resize interaction
- Zoom scaling consistency
- Multi-block operations
- Canvas boundary behavior

### Performance Tests

- Rapid resize operations
- Memory leak detection
- CPU usage optimization
- Frame rate consistency

## Migration Guide

### For Existing Code

1. **Replace WYSIWYGCanvas.tsx**:

   ```typescript
   // OLD: Direct resize calculation
   import { WYSIWYGCanvas } from './WYSIWYGCanvas';

   // NEW: Architectural resize system
   import { WYSIWYGCanvas } from './WYSIWYGCanvas.fixed';
   ```

2. **Update DraggableBlock Usage**:

   ```typescript
   // OLD: Inline resize handling
   <DraggableBlock onResize={handleResize} />

   // NEW: Integrated resize system
   <DraggableBlock onPositionChange={handlePositionChange} />
   ```

3. **Import ResizeSystem**:
   ```typescript
   import { useResizeSystem, ResizeHandle } from './ResizeSystem';
   ```

## Quality Assurance

### Code Quality

- **TypeScript**: Full type safety
- **Immutability**: Prevents state corruption
- **Pure Functions**: Deterministic calculations
- **Error Handling**: Comprehensive validation

### Performance

- **Debouncing**: Prevents excessive updates
- **Operation Locking**: Eliminates race conditions
- **Selective Updates**: Optimized re-renders
- **Memory Management**: Automatic cleanup

### Maintainability

- **Separation of Concerns**: Clear responsibilities
- **Testability**: Comprehensive test coverage
- **Documentation**: Extensive inline comments
- **Error Messages**: Descriptive debugging

## Future Enhancements

### Planned Features

1. **Multi-block Selection**: Resize multiple blocks simultaneously
2. **Aspect Ratio Locking**: Maintain proportions during resize
3. **Smart Snapping**: Snap to other block boundaries
4. **Undo/Redo**: Resize operation history
5. **Accessibility**: Keyboard resize controls

### Performance Optimizations

1. **Web Workers**: Offload calculations
2. **RequestAnimationFrame**: Smooth animations
3. **Virtualization**: Large canvas optimization
4. **Caching**: Position calculation cache

## Conclusion

The architectural redesign eliminates the "blocks flying away" issue through:

1. **Position Feedback Loop Prevention**: Using resize start coordinates exclusively
2. **State Race Condition Elimination**: Debounced updates and operation locking
3. **Constraint Order Enforcement**: Strict application sequence
4. **Comprehensive Validation**: Multiple safety checks
5. **Test-Driven Development**: Extensive test coverage

This solution provides a stable, performant, and maintainable resize system that scales with the EVIDENS editor's requirements while maintaining the existing API compatibility.

---

_Document Version: 1.0_  
_Last Updated: 2024-01-17_  
_Author: Claude (Anthropic)_
