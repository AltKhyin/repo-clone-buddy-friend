// ABOUTME: [DEPRECATED] Read-only block wrapper - REPLACED by UnifiedBlockWrapper with readOnly={true}
// 
// ⚠️ DEPRECATION NOTICE:
// This component has been DEPRECATED in favor of UnifiedBlockWrapper with readOnly={true}.
// 
// 🔄 MIGRATION PATH:
// Replace ReadOnlyBlockWrapper usage with:
//   <UnifiedBlockWrapper 
//     {...props} 
//     readOnly={true} 
//     selected={false} 
//     showResizeHandles={false} 
//     showDragHandle={false} 
//   />
//
// 🎯 BENEFITS OF MIGRATION:
// - Unified padding architecture (fixes mobile padding issues)
// - Identical rendering between editor and review modes  
// - Single source of truth for block wrapper logic
// - Better maintainability and consistency
//
// 📅 REMOVAL TIMELINE: Will be removed in next cleanup cycle

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ReadOnlyBlockWrapperProps {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  blockType: string;
  contentStyles?: React.CSSProperties;
  children: React.ReactNode;
  className?: string;
}

/**
 * ReadOnlyBlockWrapper provides positioning and content styling for read-only blocks
 * without any interactive features (hover, selection, resize, drag)
 */
export const ReadOnlyBlockWrapper = React.memo<ReadOnlyBlockWrapperProps>(
  ({
    id,
    width,
    height,
    x,
    y,
    blockType,
    contentStyles = {},
    children,
    className,
  }) => {
    // Container styles for positioning (matching UnifiedBlockWrapper but static)
    const containerStyles = useMemo(
      (): React.CSSProperties => ({
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        padding: 0,
        margin: 0,
        border: 'none',
        outline: 'none',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1, // Static z-index for read-only
        cursor: 'default', // Read-only cursor
        // No transitions or hover effects
        transition: 'none',
      }),
      [x, y, width, height]
    );

    // Content area styles (fills container exactly)
    const unifiedContentStyles = useMemo(
      (): React.CSSProperties => ({
        width: '100%',
        height: '100%',
        padding: 0,
        margin: 0,
        border: 'none',
        boxSizing: 'border-box',
        position: 'relative',
        // Apply custom content styles
        ...contentStyles,
        // Allow dropdown menus to overflow for rich blocks (tables), hide for others
        overflow: blockType === 'richBlock' ? 'visible' : 'hidden',
      }),
      [contentStyles, blockType]
    );

    return (
      <div
        className={cn('readonly-block-wrapper', className, `block-type-${blockType}`)}
        style={containerStyles}
        data-block-id={id}
        data-block-type={blockType}
        data-read-only="true"
        data-testid={`readonly-block-${id}`}
        // No event handlers - completely static
      >
        {/* Content Area - fills container exactly */}
        <div
          className="readonly-content-area"
          style={unifiedContentStyles}
          data-content-boundary="true"
        >
          {/* Media constraint enhancement for rich blocks */}
          {blockType === 'richBlock' ? (
            <div 
              className="rich-block-content-container"
              style={{
                width: '100%',
                height: '100%',
                // 🎯 MEDIA CONSTRAINT SYSTEM: Pass available content width to child media elements
                '--block-max-width': `${width}px`,
                '--block-content-width': `${width}px`,
                // CSS containment to prevent media overflow
                contain: 'layout style',
              } as React.CSSProperties}
            >
              {children}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    );
  }
);

ReadOnlyBlockWrapper.displayName = 'ReadOnlyBlockWrapper';