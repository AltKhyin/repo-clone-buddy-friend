// ABOUTME: Visual layout helpers overlay component with rulers, guidelines, and alignment tools

import React, { useRef, useEffect, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';

interface CanvasHelpersProps {
  width: number;
  height: number;
  zoom: number;
  offset: { x: number; y: number };
}

export function CanvasHelpers({ width, height, zoom, offset }: CanvasHelpersProps) {
  const { 
    showRulers, 
    showGuidelines,
    guidelines,
    addGuideline,
    removeGuideline,
    canvasTheme
  } = useEditorStore();

  const [isDraggingGuide, setIsDraggingGuide] = useState<{
    type: 'horizontal' | 'vertical';
    position: number;
    isNew?: boolean;
  } | null>(null);

  const rulersRef = useRef<SVGSVGElement>(null);

  // Convert canvas position to screen position
  const toScreenPosition = (canvasPos: number, isX: boolean) => {
    return canvasPos * zoom + (isX ? offset.x : offset.y);
  };

  // Convert screen position to canvas position
  const toCanvasPosition = React.useCallback((screenPos: number, isX: boolean) => {
    return (screenPos - (isX ? offset.x : offset.y)) / zoom;
  }, [offset.x, offset.y, zoom]);

  // Handle ruler click to add guideline
  const handleRulerClick = (e: React.MouseEvent, type: 'horizontal' | 'vertical') => {
    if (!showGuidelines) return;
    
    const rect = rulersRef.current?.getBoundingClientRect();
    if (!rect) return;

    const position = type === 'horizontal' 
      ? toCanvasPosition(e.clientY - rect.top, false)
      : toCanvasPosition(e.clientX - rect.left, true);

    addGuideline(type, Math.round(position));
  };

  // Handle guideline drag
  const handleGuidelineDrag = (e: React.MouseEvent, type: 'horizontal' | 'vertical', currentPos: number) => {
    e.stopPropagation();
    setIsDraggingGuide({ type, position: currentPos });
  };

  useEffect(() => {
    if (!isDraggingGuide) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = rulersRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newPosition = isDraggingGuide.type === 'horizontal'
        ? toCanvasPosition(e.clientY - rect.top, false)
        : toCanvasPosition(e.clientX - rect.left, true);

      // Remove old position
      removeGuideline(isDraggingGuide.type, isDraggingGuide.position);
      // Add new position
      addGuideline(isDraggingGuide.type, Math.round(newPosition));
      // Update dragging state
      setIsDraggingGuide({ ...isDraggingGuide, position: Math.round(newPosition) });
    };

    const handleMouseUp = () => {
      setIsDraggingGuide(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingGuide, addGuideline, removeGuideline, zoom, offset, toCanvasPosition]);

  // Use CSS custom properties for theme-aware colors
  const rulerColor = 'hsl(var(--muted-foreground))';
  const rulerTextColor = 'hsl(var(--muted-foreground))';
  const guidelineColor = 'hsl(var(--primary))';

  return (
    <svg 
      ref={rulersRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    >
      {/* Rulers */}
      {showRulers && (
        <>
          {/* Top Ruler */}
          <g className="pointer-events-auto">
            <rect 
              x={0} 
              y={0} 
              width={width} 
              height={20} 
              fill={canvasTheme === 'dark' ? '#18181b' : '#f9fafb'}
              stroke={rulerColor}
              strokeWidth={1}
              onClick={(e) => handleRulerClick(e, 'vertical')}
              style={{ cursor: 'pointer' }}
            />
            {/* Ruler markings */}
            {Array.from({ length: Math.ceil(width / (50 * zoom)) }).map((_, i) => {
              const x = toScreenPosition(i * 50, true);
              return (
                <g key={`h-ruler-${i}`}>
                  <line 
                    x1={x} 
                    y1={15} 
                    x2={x} 
                    y2={20} 
                    stroke={rulerColor}
                    strokeWidth={1}
                  />
                  {i % 2 === 0 && (
                    <text 
                      x={x} 
                      y={12} 
                      fill={rulerTextColor}
                      fontSize={10}
                      textAnchor="middle"
                    >
                      {i * 50}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Left Ruler */}
          <g className="pointer-events-auto">
            <rect 
              x={0} 
              y={20} 
              width={20} 
              height={height - 20} 
              fill={canvasTheme === 'dark' ? '#18181b' : '#f9fafb'}
              stroke={rulerColor}
              strokeWidth={1}
              onClick={(e) => handleRulerClick(e, 'horizontal')}
              style={{ cursor: 'pointer' }}
            />
            {/* Ruler markings */}
            {Array.from({ length: Math.ceil(height / (50 * zoom)) }).map((_, i) => {
              const y = toScreenPosition(i * 50, false) + 20;
              return (
                <g key={`v-ruler-${i}`}>
                  <line 
                    x1={15} 
                    y1={y} 
                    x2={20} 
                    y2={y} 
                    stroke={rulerColor}
                    strokeWidth={1}
                  />
                  {i % 2 === 0 && (
                    <text 
                      x={10} 
                      y={y + 3} 
                      fill={rulerTextColor}
                      fontSize={10}
                      textAnchor="middle"
                      transform={`rotate(-90, 10, ${y})`}
                    >
                      {i * 50}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Corner square */}
          <rect 
            x={0} 
            y={0} 
            width={20} 
            height={20} 
            fill={canvasTheme === 'dark' ? '#27272a' : '#e5e7eb'}
            stroke={rulerColor}
            strokeWidth={1}
          />
        </>
      )}

      {/* Guidelines */}
      {showGuidelines && (
        <g>
          {/* Horizontal guidelines */}
          {guidelines.horizontal.map(y => {
            const screenY = toScreenPosition(y, false) + (showRulers ? 20 : 0);
            return (
              <g key={`h-guide-${y}`} className="pointer-events-auto">
                <line
                  x1={showRulers ? 20 : 0}
                  y1={screenY}
                  x2={width}
                  y2={screenY}
                  stroke={guidelineColor}
                  strokeWidth={1}
                  strokeDasharray="5,5"
                  opacity={0.7}
                  style={{ cursor: 'ns-resize' }}
                  onMouseDown={(e) => handleGuidelineDrag(e, 'horizontal', y)}
                />
                {/* Guideline label */}
                <rect
                  x={showRulers ? 22 : 2}
                  y={screenY - 8}
                  width={30}
                  height={16}
                  fill={guidelineColor}
                  rx={2}
                />
                <text
                  x={showRulers ? 37 : 17}
                  y={screenY + 3}
                  fill="white"
                  fontSize={10}
                  textAnchor="middle"
                >
                  {y}
                </text>
              </g>
            );
          })}

          {/* Vertical guidelines */}
          {guidelines.vertical.map(x => {
            const screenX = toScreenPosition(x, true) + (showRulers ? 20 : 0);
            return (
              <g key={`v-guide-${x}`} className="pointer-events-auto">
                <line
                  x1={screenX}
                  y1={showRulers ? 20 : 0}
                  x2={screenX}
                  y2={height}
                  stroke={guidelineColor}
                  strokeWidth={1}
                  strokeDasharray="5,5"
                  opacity={0.7}
                  style={{ cursor: 'ew-resize' }}
                  onMouseDown={(e) => handleGuidelineDrag(e, 'vertical', x)}
                />
                {/* Guideline label */}
                <rect
                  x={screenX - 15}
                  y={showRulers ? 22 : 2}
                  width={30}
                  height={16}
                  fill={guidelineColor}
                  rx={2}
                />
                <text
                  x={screenX}
                  y={showRulers ? 33 : 13}
                  fill="white"
                  fontSize={10}
                  textAnchor="middle"
                >
                  {x}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}