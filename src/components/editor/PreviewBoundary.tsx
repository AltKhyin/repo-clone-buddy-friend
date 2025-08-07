// ABOUTME: Preview boundary component showing final review page dimensions in the editor canvas

import React, { useState } from 'react';
import { useIsMobile } from '../../hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Ruler } from 'lucide-react';

interface PreviewBoundaryProps {
  showControls?: boolean;
  showMeasurements?: boolean;
  className?: string;
  canvasPosition?: { x: number; y: number };
}

export const PreviewBoundary: React.FC<PreviewBoundaryProps> = ({
  showControls = true,
  showMeasurements = false,
  className = '',
  canvasPosition = { x: 200, y: 100 },
}) => {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  const [measurementsVisible, setMeasurementsVisible] = useState(showMeasurements);

  // Layout configuration based on LayoutAwareRenderer
  const layoutConfig = {
    desktop: {
      columns: 12,
      gap: '2rem',
      maxWidth: '1200px', // Standard content width
      label: 'Desktop - 12 Columns',
    },
    mobile: {
      columns: 1,
      gap: '1.5rem',
      maxWidth: '100%',
      label: 'Mobile - Single Column',
    },
  };

  const currentConfig = isMobile ? layoutConfig.mobile : layoutConfig.desktop;

  // Generate grid column indicators
  const generateGridColumns = () => {
    return Array.from({ length: currentConfig.columns }, (_, index) => (
      <div
        key={index}
        data-testid="grid-column-indicator"
        className="grid-column-indicator bg-blue-100 border border-blue-300 opacity-30"
        style={{
          gridColumn: index + 1,
          minHeight: '100%',
          position: 'relative',
        }}
      >
        {measurementsVisible && index < currentConfig.columns - 1 && (
          <div className="absolute -right-4 top-2 text-xs text-blue-600 bg-white px-1 rounded">
            {currentConfig.gap}
          </div>
        )}
      </div>
    ));
  };

  const boundaryClasses = [
    'preview-boundary',
    isMobile ? 'preview-boundary-mobile' : 'preview-boundary-desktop',
    'pointer-events-none',
    'border-2 border-dashed border-blue-400',
    'bg-blue-50 bg-opacity-10',
    isVisible ? 'opacity-100' : 'opacity-0',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Controls - positioned relative to canvas position */}
      {showControls && (
        <div
          className="fixed z-50 flex space-x-2 pointer-events-auto"
          style={{
            left: `${canvasPosition.x + parseInt(currentConfig.maxWidth) + 20}px`,
            top: `${canvasPosition.y}px`,
          }}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsVisible(!isVisible)}
            className="bg-white border-gray-300 hover:bg-gray-50"
            title="Toggle Preview Boundary"
          >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="ml-1 text-xs">Preview</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setMeasurementsVisible(!measurementsVisible)}
            className="bg-white border-gray-300 hover:bg-gray-50"
            title="Toggle Measurements"
          >
            <Ruler className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Preview Boundary */}
      <div
        data-testid="preview-boundary"
        className={boundaryClasses}
        style={{
          left: `${canvasPosition.x}px`,
          top: `${canvasPosition.y}px`,
          width: currentConfig.maxWidth,
          minHeight: '800px',
          transition: 'opacity 0.3s ease',
          position: 'absolute',
        }}
      >
        {/* Grid Layout Visualization */}
        <div
          className="w-full h-full grid"
          style={{
            gridTemplateColumns: isMobile ? '1fr' : `repeat(${currentConfig.columns}, 1fr)`,
            gap: currentConfig.gap,
            padding: currentConfig.gap,
          }}
        >
          {generateGridColumns()}
        </div>

        {/* Dimension Label */}
        <div className="absolute -top-8 left-0 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
          {currentConfig.label}
        </div>

        {/* Corner Markers */}
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-600 rounded-full"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-600 rounded-full"></div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></div>

        {/* Measurements */}
        {measurementsVisible && (
          <div className="absolute -bottom-8 left-0 text-xs text-gray-600 bg-white px-2 py-1 rounded border">
            Max Width: {currentConfig.maxWidth} | Gap: {currentConfig.gap}
          </div>
        )}
      </div>
    </>
  );
};
