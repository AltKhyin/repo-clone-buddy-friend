// ABOUTME: Utility functions to extract inline marks from TipTap content for read-only rendering

/**
 * Extract typography marks from TipTap JSON content
 * This is needed for read-only components where EditorContent doesn't properly render marks
 */
interface TypographyMarks {
  lineHeight?: number;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: number;
  textTransform?: string;
  textDecoration?: string;
}

/**
 * Extract marks from a TipTap node recursively
 */
function extractMarksFromNode(node: any, marks: TypographyMarks = {}, depth: number = 0): TypographyMarks {
  if (!node) return marks;

  const indent = '  '.repeat(depth);

  // Extract marks from current node
  if (node.marks && Array.isArray(node.marks)) {
    node.marks.forEach((mark: any, markIndex: number) => {

      switch (mark.type) {
        case 'textStyle':
          
          if (mark.attrs) {
            if (mark.attrs.lineHeight) {
              marks.lineHeight = mark.attrs.lineHeight;
              // 🔍 LINE HEIGHT INVESTIGATION: Essential log for line height debugging
              console.log(`[TipTap Mark Extraction] ✅ FOUND lineHeight:`, mark.attrs.lineHeight);
            }
            if (mark.attrs.textColor) marks.textColor = mark.attrs.textColor;
            if (mark.attrs.textDecoration) marks.textDecoration = mark.attrs.textDecoration;
          }
          break;
        case 'fontFamily':
          if (mark.attrs?.fontFamily) marks.fontFamily = mark.attrs.fontFamily;
          break;
        case 'fontSize':
          if (mark.attrs?.fontSize) marks.fontSize = mark.attrs.fontSize;
          break;
        case 'fontWeight':
          if (mark.attrs?.fontWeight) marks.fontWeight = mark.attrs.fontWeight;
          break;
        case 'textColor':
          if (mark.attrs?.color || mark.attrs?.textColor) {
            marks.textColor = mark.attrs.color || mark.attrs.textColor;
          }
          break;
        case 'backgroundColor':
          if (mark.attrs?.backgroundColor) marks.backgroundColor = mark.attrs.backgroundColor;
          break;
        case 'letterSpacing':
          if (mark.attrs?.letterSpacing) marks.letterSpacing = mark.attrs.letterSpacing;
          break;
        case 'textTransform':
          if (mark.attrs?.textTransform) marks.textTransform = mark.attrs.textTransform;
          break;
        default:
          // Silently skip unknown marks
      }
    });
  }

  // Recursively extract from child nodes
  if (node.content && Array.isArray(node.content)) {
    node.content.forEach((child: any, childIndex: number) => {
      extractMarksFromNode(child, marks, depth + 1);
    });
  }

  return marks;
}

/**
 * Comprehensive search for typography marks across all possible locations
 * Fallback method that searches the entire document structure
 */
function deepSearchTypographyMarks(content: any): TypographyMarks {
  const marks: TypographyMarks = {};
  const visited = new Set(); // Prevent infinite loops
  
  function searchRecursively(obj: any, path: string = '') {
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
    visited.add(obj);
    
    // Check if this object has typography-related properties
    if (obj.lineHeight !== undefined) {
      // 🔍 LINE HEIGHT INVESTIGATION: Essential log for line height debugging
      console.log(`[TipTap Mark Extraction] 🔍 DEEP SEARCH lineHeight:`, obj.lineHeight);
      marks.lineHeight = obj.lineHeight;
    }
    if (obj.textColor !== undefined) marks.textColor = obj.textColor;
    if (obj.textDecoration !== undefined) marks.textDecoration = obj.textDecoration;
    if (obj.fontFamily !== undefined) marks.fontFamily = obj.fontFamily;
    if (obj.fontSize !== undefined) marks.fontSize = obj.fontSize;
    if (obj.fontWeight !== undefined) marks.fontWeight = obj.fontWeight;
    if (obj.backgroundColor !== undefined) marks.backgroundColor = obj.backgroundColor;
    if (obj.letterSpacing !== undefined) marks.letterSpacing = obj.letterSpacing;
    if (obj.textTransform !== undefined) marks.textTransform = obj.textTransform;
    
    // Recursively search in arrays and objects
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => searchRecursively(item, `${path}[${index}]`));
    } else {
      Object.entries(obj).forEach(([key, value]) => {
        searchRecursively(value, path ? `${path}.${key}` : key);
      });
    }
  }
  
  searchRecursively(content);
  
  // 🔍 LINE HEIGHT INVESTIGATION: Only log if line height found
  if (marks.lineHeight) {
    console.log('[TipTap Mark Extraction] 🔍 DEEP SEARCH SUCCESS:', {
      lineHeight: marks.lineHeight
    });
  }
  
  return marks;
}

/**
 * Alternative mark extraction using different parsing strategies
 */
function alternativeMarkExtraction(content: any): TypographyMarks {
  const marks: TypographyMarks = {};
  
  // Strategy 1: Look for style attributes in HTML-like structures
  if (content && typeof content === 'object') {
    const jsonStr = JSON.stringify(content);
    
    // Search for lineHeight in the serialized JSON
    const lineHeightMatch = jsonStr.match(/"lineHeight":\s*([0-9.]+)/);
    if (lineHeightMatch) {
      marks.lineHeight = parseFloat(lineHeightMatch[1]);
      // 🔍 LINE HEIGHT INVESTIGATION: Essential log for line height debugging
      console.log('[TipTap Mark Extraction] 🎯 JSON SEARCH lineHeight:', marks.lineHeight);
    }
    
    // Search for other typography properties
    const textColorMatch = jsonStr.match(/"textColor":\s*"([^"]+)"/);
    if (textColorMatch) marks.textColor = textColorMatch[1];
    
    const fontWeightMatch = jsonStr.match(/"fontWeight":\s*([0-9]+)/);
    if (fontWeightMatch) marks.fontWeight = parseInt(fontWeightMatch[1]);
  }
  
  return marks;
}

/**
 * Extract typography marks from TipTap JSON content
 * Returns the first set of marks found in the document
 */
export function extractTypographyMarks(tiptapContent: any): TypographyMarks {
  if (!tiptapContent) {
    return {};
  }

  try {
    // Handle both string JSON and parsed objects
    const content = typeof tiptapContent === 'string' 
      ? JSON.parse(tiptapContent) 
      : tiptapContent;


    // Primary extraction method
    const extractedMarks = extractMarksFromNode(content);
    
    // 🎯 FALLBACK EXTRACTION: If primary method didn't find line height, try alternative methods
    if (!extractedMarks.lineHeight) {
      // 🔍 LINE HEIGHT INVESTIGATION: Trying fallback methods
      
      // Fallback 1: Deep search the entire structure
      const deepSearchMarks = deepSearchTypographyMarks(content);
      Object.assign(extractedMarks, deepSearchMarks);
      
      // Fallback 2: Alternative parsing strategies
      if (!extractedMarks.lineHeight) {
        const alternativeMarks = alternativeMarkExtraction(content);
        Object.assign(extractedMarks, alternativeMarks);
      }
    }
    
    // 🔍 LINE HEIGHT INVESTIGATION: Only log if line height found
    if (extractedMarks.lineHeight) {
      console.log('[TipTap Mark Extraction] 🏁 LINE HEIGHT EXTRACTION SUCCESS:', {
        lineHeight: extractedMarks.lineHeight,
        method: extractMarksFromNode(content).lineHeight ? 'primary' : 'fallback'
      });
    }

    return extractedMarks;
  } catch (error) {
    console.error('[TipTap Mark Extraction] ❌ FAILED to extract marks:', {
      error: error,
      inputContent: tiptapContent,
      inputType: typeof tiptapContent
    });
    return {};
  }
}

/**
 * Extract typography marks from HTML content using regex patterns
 * Fallback method when TipTap JSON is not available
 */
export function extractTypographyMarksFromHTML(htmlContent: string): TypographyMarks {
  if (!htmlContent || typeof htmlContent !== 'string') return {};

  const marks: TypographyMarks = {};

  try {
    // Extract line-height from inline styles
    const lineHeightMatch = htmlContent.match(/line-height:\s*([0-9.]+)/i);
    if (lineHeightMatch) {
      marks.lineHeight = parseFloat(lineHeightMatch[1]);
    }

    // Extract color from inline styles
    const colorMatch = htmlContent.match(/color:\s*([^;]+)/i);
    if (colorMatch) {
      marks.textColor = colorMatch[1].trim();
    }

    // Extract background-color from inline styles
    const bgColorMatch = htmlContent.match(/background-color:\s*([^;]+)/i);
    if (bgColorMatch) {
      marks.backgroundColor = bgColorMatch[1].trim();
    }

    // Extract font-size from inline styles
    const fontSizeMatch = htmlContent.match(/font-size:\s*([0-9.]+)/i);
    if (fontSizeMatch) {
      marks.fontSize = parseFloat(fontSizeMatch[1]);
    }

    // Extract font-family from inline styles
    const fontFamilyMatch = htmlContent.match(/font-family:\s*([^;]+)/i);
    if (fontFamilyMatch) {
      marks.fontFamily = fontFamilyMatch[1].trim().replace(/['"]/g, '');
    }

    // Extract font-weight from inline styles
    const fontWeightMatch = htmlContent.match(/font-weight:\s*([0-9]+)/i);
    if (fontWeightMatch) {
      marks.fontWeight = parseInt(fontWeightMatch[1]);
    }

    // Extract letter-spacing from inline styles
    const letterSpacingMatch = htmlContent.match(/letter-spacing:\s*([0-9.-]+)/i);
    if (letterSpacingMatch) {
      marks.letterSpacing = parseFloat(letterSpacingMatch[1]);
    }

    // Extract text-transform from inline styles
    const textTransformMatch = htmlContent.match(/text-transform:\s*([^;]+)/i);
    if (textTransformMatch) {
      marks.textTransform = textTransformMatch[1].trim();
    }

    // Extract text-decoration from inline styles
    const textDecorationMatch = htmlContent.match(/text-decoration:\s*([^;]+)/i);
    if (textDecorationMatch) {
      marks.textDecoration = textDecorationMatch[1].trim();
    }

    return marks;
  } catch (error) {
    console.warn('[HTML Mark Extraction] Failed to extract marks:', error);
    return {};
  }
}

/**
 * Combine typography marks with block-level styles, giving priority to inline marks
 * NOTE: Excludes text-level properties (colors, fontWeight, etc.) to prevent contamination
 */
export function combineTypographyStyles(
  blockStyles: React.CSSProperties,
  inlineMarks: TypographyMarks
): React.CSSProperties {
  return {
    ...blockStyles,
    // Override block styles with inline marks ONLY for true block-level properties
    ...(inlineMarks.lineHeight && { lineHeight: inlineMarks.lineHeight }),
    ...(inlineMarks.fontSize && { fontSize: `${inlineMarks.fontSize}px` }),
    ...(inlineMarks.fontFamily && { fontFamily: inlineMarks.fontFamily }),
    
    // 🚫 TEXT-LEVEL PROPERTIES EXCLUDED: These should stay in TipTap marks, not contaminate block styles
    // Colors (highlighting/text color): Should be handled by TipTap rendering
    // ...(inlineMarks.textColor && { color: inlineMarks.textColor }),
    // ...(inlineMarks.backgroundColor && { backgroundColor: inlineMarks.backgroundColor }),
    // Font weight (bold/light): Should be handled by TipTap rendering  
    // ...(inlineMarks.fontWeight && { fontWeight: inlineMarks.fontWeight }),
    // Letter spacing: Should be handled by TipTap rendering
    // ...(inlineMarks.letterSpacing && { letterSpacing: `${inlineMarks.letterSpacing}px` }),
    // Text transform (CAPS): Should be handled by TipTap rendering
    // ...(inlineMarks.textTransform && { textTransform: inlineMarks.textTransform }),
    // Text decoration (underline): Should be handled by TipTap rendering
    // ...(inlineMarks.textDecoration && { textDecoration: inlineMarks.textDecoration }),
  };
}