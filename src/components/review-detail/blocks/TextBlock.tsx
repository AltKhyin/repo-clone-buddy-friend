// ABOUTME: Enhanced text block component with improved typography and rich text support per [DOC_7] Visual System.

import React from 'react';

interface TextBlockData {
  content?: string;
  text?: string;
  html?: string;
  htmlContent?: string;
  format?: 'plain' | 'markdown' | 'html';
  className?: string;
  style?: 'body' | 'lead' | 'caption';
  headingLevel?: 1 | 2 | 3 | 4 | null;
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
  const textContent = data.content || data.text || data.html || data.htmlContent || '';

  if (!textContent) {
    return null;
  }

  // Check if this is a heading block
  const isHeading = Boolean(data.headingLevel);
  const headingLevel = data.headingLevel || 1;

  // Enhanced typography classes per [DOC_7] Visual System
  const getTextStyles = (style: string = 'body') => {
    const baseStyles = 'text-foreground leading-relaxed';

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

  // Get heading-specific styles
  const getHeadingStyles = (level: number) => {
    const baseStyles = 'text-foreground font-serif font-bold leading-tight';

    switch (level) {
      case 1:
        return `${baseStyles} text-3xl md:text-4xl mb-6`;
      case 2:
        return `${baseStyles} text-2xl md:text-3xl mb-5`;
      case 3:
        return `${baseStyles} text-xl md:text-2xl mb-4`;
      case 4:
        return `${baseStyles} text-lg md:text-xl mb-3`;
      default:
        return `${baseStyles} text-lg mb-3`;
    }
  };

  const textStyles = getTextStyles(data.style);
  const customClasses = data.className || '';

  // Handle heading rendering
  if (isHeading) {
    const headingStyles = getHeadingStyles(headingLevel);
    const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;

    // For headings, use HTML content if available, otherwise render as plain text
    if (data.format === 'html' || data.html || data.htmlContent) {
      return (
        <HeadingTag
          className={`${headingStyles} ${customClasses}`}
          dangerouslySetInnerHTML={{ __html: textContent }}
        />
      );
    }

    return <HeadingTag className={`${headingStyles} ${customClasses}`}>{textContent}</HeadingTag>;
  }

  // Handle different text formats with enhanced rendering
  if (data.format === 'html' || data.html || data.htmlContent) {
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

  return <div className="text-content">{processedText}</div>;
};

export default TextBlock;
