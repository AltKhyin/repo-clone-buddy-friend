# Heading Collapsible Content Strategy

## Overview

This document outlines the implementation strategy for future collapsible content functionality based on H1-H6 headings in rich text blocks.

## Current Implementation Status

### ✅ Phase 1: H1-H6 Heading Infrastructure (COMPLETED)
- **TipTap Integration**: H1-H6 headings fully supported via StarterKit configuration
- **Toolbar Controls**: All H1-H6 buttons implemented in UnifiedToolbar
- **Markdown Shortcuts**: Complete markdown syntax support (# through ######)
- **Type Definitions**: Heading structure metadata added to RichBlockDataSchema

### 🔮 Phase 2: Future Collapsible Implementation (PLANNED)

## Technical Architecture

### Heading Structure Metadata

The `RichBlockDataSchema` now includes optional heading structure metadata:

```typescript
headingStructure?: {
  headingNodes: Array<{
    level: 1 | 2 | 3 | 4 | 5 | 6;
    text: string;
    position: number; // Position in TipTap document
    id: string; // Unique ID for collapsible grouping
  }>;
  lastAnalyzed?: string; // ISO timestamp
}
```

### Content Hierarchy Detection

Future implementation will use TipTap document traversal to detect heading hierarchy:

```typescript
// Example heading detection hook (for future implementation)
const useHeadingStructure = (editor: Editor) => {
  return useMemo(() => {
    if (!editor) return [];
    
    const headings: HeadingNode[] = [];
    
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading' && node.attrs.level) {
        headings.push({
          level: node.attrs.level,
          text: node.textContent,
          position: pos,
          id: `heading-${pos}`, // Unique ID for collapsible functionality
        });
      }
    });
    
    return headings;
  }, [editor?.state.doc]);
};
```

## Collapsible Content Grouping Strategy

### Content Sectioning Algorithm

1. **Heading Detection**: Scan TipTap document for H1-H6 nodes
2. **Content Grouping**: Group content between headings based on hierarchy
3. **Collapse State**: Track expand/collapse state per heading ID
4. **DOM Manipulation**: Show/hide content blocks based on state

### Example Content Structure

```
H1: Introduction
  - Paragraph 1
  - Paragraph 2
  - H2: Background
    - Paragraph 3
    - H3: History
      - Paragraph 4
  - H2: Methodology
    - Paragraph 5
H1: Results
  - Paragraph 6
```

### Collapsible Behavior

- **H1 Collapse**: Hides all content until next H1 (including nested H2-H6)
- **H2 Collapse**: Hides content until next H2 or parent H1 (including nested H3-H6)
- **Hierarchy Respect**: Child headings respect parent collapse state

## Implementation Requirements

### Database Schema
- No database changes needed (metadata stored in existing RichBlockData)
- Heading structure computed dynamically from TipTap content

### UI Components
- **Collapse Indicators**: Chevron icons next to headings
- **Smooth Animations**: CSS transitions for content show/hide
- **Accessibility**: ARIA attributes for screen readers

### State Management
- **Local State**: Collapse state managed in component or hook
- **Persistence**: Optional - save collapse preferences to localStorage

## Integration Points

### Existing Systems
- **UnifiedBlockWrapper**: Already supports any content type - no changes needed
- **TipTap Editor**: Heading detection works with existing editor instance
- **Drag/Resize**: Collapsible functionality won't interfere with positioning

### Future Extensions
- **Outline Navigation**: Generate document outline from heading structure
- **Deep Linking**: Link to specific sections by heading ID
- **Export Features**: Include/exclude collapsed sections in exports

## Development Approach

### Phase 2.1: Heading Detection Hook
1. Create `useHeadingStructure` hook
2. Implement TipTap document traversal
3. Test heading detection across all levels

### Phase 2.2: Collapsible UI Components
1. Add collapse indicators to headings
2. Implement show/hide content logic
3. Add smooth animations

### Phase 2.3: State Management
1. Track collapse state per heading
2. Implement hierarchy-aware collapsing
3. Add persistence options

### Phase 2.4: Testing & Refinement
1. Test with complex document structures
2. Ensure accessibility compliance
3. Performance optimization for large documents

## EVIDENS Compliance

- **[L]everage**: Uses existing TipTap heading infrastructure
- **[E]xtend**: Extends current heading system without breaking changes
- **[V]erify**: Reactive patterns for heading detection
- **[E]liminate**: No duplicate heading detection systems
- **[R]educe**: Minimal complexity added to existing editor

## Risk Mitigation

### Performance Considerations
- **Document Size**: Heading detection scales with document size
- **Re-computation**: Cache heading structure, update only on content change
- **Memory Usage**: Clean up heading structure on component unmount

### Compatibility
- **Backward Compatibility**: Optional metadata doesn't break existing content
- **Migration**: No migration needed - computed from existing TipTap content
- **Fallback**: System works without heading structure metadata

---

*This strategy document provides the foundation for implementing collapsible content functionality while maintaining the existing clean heading infrastructure.*