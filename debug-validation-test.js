// ABOUTME: Test script to validate database content and identify validation failures

import { readFileSync } from 'fs';
import { z } from 'zod';

// Sample database content (from database query)
const sampleDatabaseContent = {
  "nodes": [
    {
      "id": "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd",
      "data": {
        "content": {
          "tiptapJSON": {
            "type": "doc",
            "content": [
              {
                "type": "paragraph",
                "attrs": {"textAlign": null},
                "content": [
                  {
                    "text": "Start typing test..",
                    "type": "text",
                    "marks": [
                      {"type": "fontFamily", "attrs": {"fontFamily": "BlinkMacSystemFont"}},
                      {"type": "fontSize", "attrs": {"fontSize": 32}},
                      {"type": "fontWeight", "attrs": {"fontWeight": 400}},
                      {"type": "textColor", "attrs": {"color": "hsl(var(--foreground))"}}
                    ]
                  }
                ]
              }
            ]
          },
          "htmlContent": "<p><span class=\"font-family-mark\" style=\"font-family: BlinkMacSystemFont\"><span class=\"font-size-mark\" style=\"font-size: 32px\"><span class=\"font-weight-mark\" style=\"font-weight: 400\"><span class=\"text-color-mark\" style=\"color: hsl(var(--foreground))\">Start typing test..</span></span></span></span></p>"
        },
        "paddingTop": 16,
        "borderWidth": 0,
        "paddingLeft": 16,
        "paddingRight": 16,
        "paddingBottom": 16,
        "desktopPadding": {
          "top": 8,
          "left": 8,
          "right": 30,
          "bottom": 16
        }
      },
      "type": "richBlock"
    },
    {
      "id": "5d706bc7-2498-460e-8a29-d9c8aeed9737",
      "data": {
        "content": "<p>Start typing...</p>",  // ❌ POTENTIAL ISSUE: content is string, not object
        "paddingTop": 16,
        "paddingLeft": 16,
        "paddingRight": 16,
        "paddingBottom": 16,
        "desktopPadding": {
          "top": 0,
          "left": 0,
          "right": 0,
          "bottom": 0
        }
      },
      "type": "richBlock"
    }
  ],
  "canvas": {
    "canvasWidth": 800,
    "gridColumns": 12,
    "canvasHeight": 600,
    "snapTolerance": 10
  },
  "version": "3.0.0",
  "metadata": {
    "createdAt": "2025-08-21T10:38:37.475Z",
    "updatedAt": "2025-08-21T10:38:37.475Z",
    "migratedFrom": "legacy-conflict-recovery",
    "editorVersion": "2.0.0"
  },
  "positions": {
    "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd": {
      "x": 100,
      "y": 100,
      "id": "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd",
      "width": 600,
      "height": 200
    },
    "5d706bc7-2498-460e-8a29-d9c8aeed9737": {
      "x": 100,
      "y": 1200,
      "id": "5d706bc7-2498-460e-8a29-d9c8aeed9737",
      "width": 600,
      "height": 200
    }
  },
  "mobilePositions": {
    "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd": {
      "x": 0,
      "y": 100,
      "id": "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd",
      "width": 375,
      "height": 200
    },
    "5d706bc7-2498-460e-8a29-d9c8aeed9737": {
      "x": 0,
      "y": 1200,
      "id": "5d706bc7-2498-460e-8a29-d9c8aeed9737",
      "width": 375,
      "height": 200
    }
  }
};

console.log('🧪 VALIDATION TEST: Testing database content against V3 schema...');
console.log('📊 Sample data nodes:', sampleDatabaseContent.nodes.length);
console.log('🎯 Potential issue detected: Node with content as string instead of object');
console.log();

try {
  // This would import the actual validation logic
  // const { validateStructuredContent } = await import('./src/types/editor.ts');
  // const validated = validateStructuredContent(sampleDatabaseContent);
  console.log('⚠️  Run this with: npm run tsx debug-validation-test.js');
} catch (error) {
  console.error('❌ VALIDATION FAILED:', error);
  if (error.errors) {
    error.errors.forEach((err, index) => {
      console.error(`Error ${index + 1}:`, err.message, 'at path:', err.path);
    });
  }
}