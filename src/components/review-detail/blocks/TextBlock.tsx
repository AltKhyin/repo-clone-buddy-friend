
// ABOUTME: Enhanced text block component with improved typography and rich text support per [DOC_7] Visual System.

import React from 'react';

interface TextBlockData {
  content?: string;
  text?: string;
  html?: string;
  format?: 'plain' | 'markdown' | 'html';
  className?: string;
  style?: 'body' | 'lead' | 'caption';
}

interface TextBlockProps {
  data: TextBlockData;
}

const TextBlock: React.FC<TextBlockProps> = ({ data }) => {
  console.log('TextBlock data:', data);

  if (!data) {
    return null;
  }

  // Get text content from various possible fields
  const textContent = data.content || data.text || data.html || '';

  if (!textContent) {
    return null;
  }

  // Enhanced typography classes per [DOC_7] Visual System
  const getTextStyles = (style: string = 'body') => {
    const baseStyles = "text-foreground leading-relaxed";
    
    switch (style) {
      case 'lead':
        return `${baseStyles} text-xl leading-7 font-medium text-muted-foreground`;
      case 'caption':
        return `${baseStyles} text-sm text-muted-foreground`;
      case 'body':
      default:
        return `${baseStyles} text-base leading-7`;
    }
  };

  const textStyles = getTextStyles(data.style);
  const customClasses = data.className || '';

  // Handle different text formats with enhanced rendering
  if (data.format === 'html' || data.html) {
    return (
      <div 
        className={`prose prose-neutral dark:prose-invert max-w-none prose-headings:font-serif prose-p:${textStyles} ${customClasses}`}
        dangerouslySetInnerHTML={{ __html: textContent }}
      />
    );
  }

  // Enhanced plain text rendering with proper line breaks
  const processedText = textContent
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map((line, index) => (
      <p key={index} className={`${textStyles} ${customClasses} ${index > 0 ? 'mt-4' : ''}`}>
        {line.trim()}
      </p>
    ));

  return (
    <div className="text-content">
      {processedText}
    </div>
  );
};

export default TextBlock;
