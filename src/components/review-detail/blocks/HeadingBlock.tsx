
// ABOUTME: Enhanced heading block component with improved hierarchy and collapsible functionality per Blueprint 05.

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface HeadingBlockData {
  text?: string;
  content?: string;
  level?: number;
  isCollapsible?: boolean;
  id?: string;
  className?: string;
}

interface HeadingBlockProps {
  data: HeadingBlockData;
}

const HeadingBlock: React.FC<HeadingBlockProps> = ({ data }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  console.log('HeadingBlock data:', data);

  if (!data) {
    return null;
  }

  const headingText = data.text || data.content || '';
  const level = Math.max(1, Math.min(6, data.level || 2)); // Clamp between 1-6
  const isCollapsible = data.isCollapsible || false;
  const headingId = data.id || headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (!headingText) {
    return null;
  }

  const handleToggle = () => {
    if (isCollapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Create the appropriate heading element
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  // Enhanced heading styles per [DOC_7] Visual System with better hierarchy
  const getHeadingClasses = (level: number) => {
    const baseClasses = "font-serif font-bold text-foreground leading-tight scroll-mt-20";
    const customClasses = data.className || '';
    
    switch (level) {
      case 1:
        return `${baseClasses} text-4xl md:text-5xl mb-8 ${customClasses}`;
      case 2:
        return `${baseClasses} text-3xl md:text-4xl mb-6 mt-12 first:mt-0 ${customClasses}`;
      case 3:
        return `${baseClasses} text-2xl md:text-3xl mb-4 mt-8 first:mt-0 ${customClasses}`;
      case 4:
        return `${baseClasses} text-xl md:text-2xl mb-3 mt-6 first:mt-0 ${customClasses}`;
      case 5:
        return `${baseClasses} text-lg md:text-xl mb-2 mt-4 first:mt-0 ${customClasses}`;
      case 6:
        return `${baseClasses} text-base md:text-lg mb-2 mt-3 first:mt-0 ${customClasses}`;
      default:
        return `${baseClasses} text-2xl md:text-3xl mb-4 mt-8 first:mt-0 ${customClasses}`;
    }
  };

  const headingClasses = getHeadingClasses(level);
  const interactiveClasses = isCollapsible 
    ? 'cursor-pointer flex items-center gap-3 hover:text-primary transition-colors group select-none' 
    : '';

  return (
    <HeadingTag 
      id={headingId}
      className={`${headingClasses} ${interactiveClasses}`}
      onClick={handleToggle}
      {...(isCollapsible && {
        role: 'button',
        'aria-expanded': !isCollapsed,
        'aria-controls': `${headingId}-content`,
        tabIndex: 0,
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }
      })}
    >
      {isCollapsible && (
        <span className="flex-shrink-0 transition-transform group-hover:scale-110">
          {isCollapsed ? 
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" /> : 
            <ChevronDown className="h-5 w-5 md:h-6 md:w-6" />
          }
        </span>
      )}
      <span className="flex-1">{headingText}</span>
    </HeadingTag>
  );
};

export default HeadingBlock;
