// ABOUTME: Enhanced TextStyle extension that properly handles lineHeight and other typography attributes

import { TextStyle } from '@tiptap/extension-text-style'

/**
 * Enhanced TextStyle extension that explicitly handles lineHeight and other typography attributes
 * 
 * PROBLEM SOLVED: The default TextStyle extension wasn't properly preserving lineHeight attributes,
 * leading to textStyle marks with `attrs: undefined`. This extension ensures proper attribute
 * handling for all typography features.
 */
export const EnhancedTextStyle = TextStyle.extend({
  name: 'textStyle',

  addAttributes() {
    return {
      // Preserve parent attributes (if any)
      ...this.parent?.(),

      // 🎯 EXPLICIT LINE HEIGHT SUPPORT: Ensure lineHeight is properly handled
      lineHeight: {
        default: null,
        parseHTML: element => {
          const lineHeight = element.style.lineHeight;
          // Parse both numeric (1.5) and unit values (1.5em, 24px)
          if (lineHeight) {
            const numericValue = parseFloat(lineHeight);
            return !isNaN(numericValue) ? numericValue : null;
          }
          return null;
        },
        renderHTML: attributes => {
          if (!attributes.lineHeight) {
            return {};
          }
          return {
            style: `line-height: ${attributes.lineHeight}`,
          };
        },
      },

      // 🎯 EXPLICIT TEXT DECORATION SUPPORT: Ensure textDecoration is properly handled
      textDecoration: {
        default: null,
        parseHTML: element => {
          const textDecoration = element.style.textDecoration;
          return textDecoration || null;
        },
        renderHTML: attributes => {
          if (!attributes.textDecoration) {
            return {};
          }
          return {
            style: `text-decoration: ${attributes.textDecoration}`,
          };
        },
      },

      // 🎯 FUTURE-PROOF: Add support for other typography attributes that might be needed
      textShadow: {
        default: null,
        parseHTML: element => {
          const textShadow = element.style.textShadow;
          return textShadow || null;
        },
        renderHTML: attributes => {
          if (!attributes.textShadow) {
            return {};
          }
          return {
            style: `text-shadow: ${attributes.textShadow}`,
          };
        },
      },
    };
  },

  // 🎯 DEBUGGING: Add debugging support for development
  addCommands() {
    return {
      ...this.parent?.(),
      
      // Custom command to set lineHeight with debugging
      setLineHeight: (lineHeight: number) => ({ commands }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[EnhancedTextStyle] 🎯 Setting lineHeight:', {
            lineHeight,
            isValidNumber: !isNaN(lineHeight),
            cleanedValue: Math.round(lineHeight * 10) / 10
          });
        }
        
        return commands.setMark(this.name, { lineHeight });
      },

      // Custom command to set textDecoration with debugging  
      setTextDecoration: (textDecoration: string) => ({ commands }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[EnhancedTextStyle] 🎯 Setting textDecoration:', {
            textDecoration,
            isValid: Boolean(textDecoration)
          });
        }
        
        return commands.setMark(this.name, { textDecoration });
      },
    };
  },

  // 🎯 ENHANCED DEBUGGING: Override parseHTML to add debugging
  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: element => {
          const attrs = {
            lineHeight: null,
            textDecoration: null,
            textShadow: null,
          };

          if (element instanceof HTMLElement) {
            // Parse lineHeight
            const lineHeight = element.style.lineHeight;
            if (lineHeight) {
              const numericValue = parseFloat(lineHeight);
              attrs.lineHeight = !isNaN(numericValue) ? numericValue : null;
            }

            // Parse textDecoration
            const textDecoration = element.style.textDecoration;
            if (textDecoration && textDecoration !== 'none') {
              attrs.textDecoration = textDecoration;
            }

            // Parse textShadow
            const textShadow = element.style.textShadow;
            if (textShadow && textShadow !== 'none') {
              attrs.textShadow = textShadow;
            }
          }

          // 🎯 DEBUG: Log parsing results in development
          if (process.env.NODE_ENV === 'development' && Object.values(attrs).some(v => v !== null)) {
            console.log('[EnhancedTextStyle] 📝 Parsed attributes from HTML:', {
              element: element.outerHTML.substring(0, 100) + '...',
              parsedAttrs: attrs,
              hasValidAttrs: Object.values(attrs).some(v => v !== null)
            });
          }

          // Return null if no relevant attributes found (don't create empty marks)
          return Object.values(attrs).some(v => v !== null) ? attrs : null;
        },
      },
    ];
  },

  // 🎯 ENHANCED RENDERING: Override renderHTML to ensure proper attribute rendering
  renderHTML({ HTMLAttributes }) {
    const styles: string[] = [];

    // Build style string from attributes
    if (HTMLAttributes.lineHeight) {
      styles.push(`line-height: ${HTMLAttributes.lineHeight}`);
    }
    if (HTMLAttributes.textDecoration) {
      styles.push(`text-decoration: ${HTMLAttributes.textDecoration}`);
    }
    if (HTMLAttributes.textShadow) {
      styles.push(`text-shadow: ${HTMLAttributes.textShadow}`);
    }

    // 🎯 DEBUG: Log rendering in development
    if (process.env.NODE_ENV === 'development' && styles.length > 0) {
      console.log('[EnhancedTextStyle] 🎨 Rendering textStyle mark:', {
        attributes: HTMLAttributes,
        generatedStyles: styles.join('; '),
        styleCount: styles.length
      });
    }

    return [
      'span',
      {
        ...HTMLAttributes,
        style: styles.length > 0 ? styles.join('; ') : undefined,
      },
      0,
    ];
  },
});

export default EnhancedTextStyle;