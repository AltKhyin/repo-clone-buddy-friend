// ABOUTME: Content update handler that synchronizes TipTap content with only true block-level typography properties (excludes text-level properties to prevent contamination)

import { extractTypographyMarks } from '@/utils/tiptap-mark-extraction';

/**
 * Enhanced content update handler that extracts typography marks from TipTap content
 * and synchronizes them with block-level data properties for consistent styling
 */
export function createEnhancedContentUpdateHandler(
  updateNode: (nodeId: string, updates: any) => void,
  currentData: any,
  onDebug?: (message: string, data?: any) => void
) {
  return (nodeId: string, htmlContent: string, tiptapJSON?: any) => {
    const debug = onDebug || (() => {});
    
    debug('[ContentUpdateHandler] Processing content update:', {
      nodeId,
      hasHTML: Boolean(htmlContent),
      hasJSON: Boolean(tiptapJSON),
      htmlLength: htmlContent?.length || 0
    });

    // Extract typography marks from TipTap JSON content
    let extractedMarks = {};
    if (tiptapJSON) {
      try {
        extractedMarks = extractTypographyMarks(tiptapJSON);
        debug('[ContentUpdateHandler] 🎯 EXTRACTED MARKS FROM TIPTAP:', {
          nodeId,
          extractedMarks,
          hasLineHeight: Boolean(extractedMarks.lineHeight)
        });
      } catch (error) {
        debug('[ContentUpdateHandler] ❌ Mark extraction failed:', error);
      }
    }

    // Prepare content updates
    const contentUpdates = {
      ...currentData.content,
      htmlContent,
      // 🎯 DUAL CONTENT SYNC: Update both HTML and JSON simultaneously
      ...(tiptapJSON && { tiptapJSON }),
    };

    // Prepare block-level typography updates (from extracted marks)
    const blockUpdates = {
      ...currentData,
      content: contentUpdates,
      // 🎯 TYPOGRAPHY SYNC: Update ONLY true block-level properties from TipTap marks
      // These properties affect the entire block and should sync to maintain layout consistency
      ...(extractedMarks.lineHeight && { lineHeight: extractedMarks.lineHeight }),
      ...(extractedMarks.fontSize && { fontSize: extractedMarks.fontSize }),
      ...(extractedMarks.fontFamily && { fontFamily: extractedMarks.fontFamily }),
      
      // 🚫 TEXT-LEVEL SYNC REMOVED: These should remain isolated to selected text only
      // fontWeight (bold/light): Should apply to selections, not entire blocks
      // letterSpacing (kerning): Should apply to selections, not entire blocks  
      // textTransform (CAPS/lowercase): Should apply to selections, not entire blocks
      // textDecoration (underline/strikethrough): Should apply to selections, not entire blocks
      // textColor & backgroundColor: Should apply to selections, not entire blocks
      // ...(extractedMarks.fontWeight && { fontWeight: extractedMarks.fontWeight }),
      // ...(extractedMarks.letterSpacing && { letterSpacing: extractedMarks.letterSpacing }),
      // ...(extractedMarks.textTransform && { textTransform: extractedMarks.textTransform }),
      // ...(extractedMarks.textDecoration && { textDecoration: extractedMarks.textDecoration }),
      // ...(extractedMarks.textColor && { color: extractedMarks.textColor }),
      // ...(extractedMarks.backgroundColor && { backgroundColor: extractedMarks.backgroundColor }),
    };

    debug('[ContentUpdateHandler] 🎯 BLOCK UPDATES:', {
      nodeId,
      oldData: currentData,
      newData: blockUpdates,
      changedProperties: Object.keys(extractedMarks)
    });

    // Update the node with synchronized content and block properties
    updateNode(nodeId, {
      data: blockUpdates,
    });
  };
}

/**
 * Enhanced content update handler with comprehensive debugging
 */
export function createDebugContentUpdateHandler(
  updateNode: (nodeId: string, updates: any) => void,
  currentData: any,
  enableDebug = true
) {
  const debug = enableDebug 
    ? (message: string, data?: any) => console.log(message, data)
    : () => {};

  return createEnhancedContentUpdateHandler(updateNode, currentData, debug);
}