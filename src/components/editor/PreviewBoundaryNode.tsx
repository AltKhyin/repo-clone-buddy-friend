// ABOUTME: React Flow node component for preview boundary that's anchored in canvas coordinates and supports intelligent viewport conversion

import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Ruler, Smartphone, Monitor } from 'lucide-react';
import { ensureMasterDerivedLayouts } from '@/store/layoutUtils';

interface PreviewBoundaryNodeProps {
  data?: {
    showControls?: boolean;
    showMeasurements?: boolean;
  };
}

export const PreviewBoundaryNode: React.FC<PreviewBoundaryNodeProps> = ({ data = {} }) => {
  const { showControls = true, showMeasurements = false } = data;
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  const [measurementsVisible, setMeasurementsVisible] = useState(showMeasurements);
  // Get editor state for viewport information
  const { currentViewport, nodes, switchViewport, layouts } = useEditorStore();

  // Layout configuration based on current editor viewport (not screen size)
  const layoutConfig = {
    desktop: {
      columns: 12,
      gap: '2rem',
      maxWidth: '1200px', // Standard content width
      label: 'Desktop - 12 Columns',
      backgroundColor: 'bg-blue-50',
      borderColor: 'border-blue-400',
    },
    mobile: {
      columns: 1,
      gap: '1.5rem',
      maxWidth: '375px',   // Mobile device width
      label: 'Mobile - Single Column',
      backgroundColor: 'bg-green-50',
      borderColor: 'border-green-400',
    },
  };

  // Use editor viewport, not screen size - this is the key improvement
  const currentConfig = layoutConfig[currentViewport];

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
    `preview-boundary-${currentViewport}`,
    'pointer-events-none border-2 border-dashed',
    currentConfig.borderColor,
    currentConfig.backgroundColor,
    'bg-opacity-10',
    isVisible ? 'opacity-100' : 'opacity-0',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="relative" style={{ zIndex: -1 }}>
      {/* Simplified Controls */}
      {showControls && (
        <div className="absolute -top-12 right-0 z-50 flex space-x-1 pointer-events-auto">
          {/* Viewport Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => switchViewport(currentViewport === 'desktop' ? 'mobile' : 'desktop')}
            className={`bg-white border-gray-300 hover:bg-gray-50 ${
              currentViewport === 'mobile' ? 'text-green-600 border-green-300' : 'text-blue-600 border-blue-300'
            }`}
            title={`Switch to ${currentViewport === 'desktop' ? 'Mobile' : 'Desktop'} view`}
          >
            {currentViewport === 'desktop' ? (
              <Monitor className="w-4 h-4" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
            <span className="ml-1 text-xs">{currentViewport}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsVisible(!isVisible)}
            className="bg-white border-gray-300 hover:bg-gray-50"
            title="Toggle Preview Boundary"
          >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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
          width: currentConfig.maxWidth,
          minHeight: '800px',
          transition: 'opacity 0.3s ease',
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

        {/* Dimension Label with Layout Type */}
        <div 
          className={`absolute -top-8 left-0 px-2 py-1 rounded text-xs font-medium text-white ${
            currentViewport === 'mobile' ? 'bg-green-600' : 'bg-blue-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{currentConfig.label}</span>
            <span className="text-xs opacity-80">
              ({currentViewport === 'desktop' ? 'Master' : 'Derived'})
            </span>
          </div>
        </div>

        {/* Corner Markers with Viewport-Specific Colors */}
        <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${
          currentViewport === 'mobile' ? 'bg-green-600' : 'bg-blue-600'
        }`}></div>
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
          currentViewport === 'mobile' ? 'bg-green-600' : 'bg-blue-600'
        }`}></div>
        <div className={`absolute -bottom-1 -left-1 w-3 h-3 rounded-full ${
          currentViewport === 'mobile' ? 'bg-green-600' : 'bg-blue-600'
        }`}></div>
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
          currentViewport === 'mobile' ? 'bg-green-600' : 'bg-blue-600'
        }`}></div>

        {/* Enhanced Measurements with Viewport Details */}
        {measurementsVisible && (
          <div className="absolute -bottom-12 left-0 text-xs text-gray-600 bg-white px-2 py-1 rounded border space-y-1">
            <div className="flex gap-4">
              <span>Max Width: {currentConfig.maxWidth}</span>
              <span>Gap: {currentConfig.gap}</span>
              <span>Columns: {currentConfig.columns}</span>
            </div>
            <div className="flex gap-4 text-xs opacity-75">
              <span>Viewport: {currentViewport}</span>
              <span>Blocks: {nodes.length}</span>
              <span>Type: {currentViewport === 'desktop' ? 'Master Layout' : 'Derived Layout'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

PreviewBoundaryNode.displayName = 'PreviewBoundaryNode';
