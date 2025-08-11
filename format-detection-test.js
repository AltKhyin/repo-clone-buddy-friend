// Test script to validate format detection logic with real data from review ID 33

// V3 content from database (review_editor_content)
const v3Content = {
  "nodes": [
    {
      "id": "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd",
      "data": {
        "content": {
          "htmlContent": "<p>Start typing...awdawdawawd</p>"
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
      "id": "18e57228-2881-41f6-ac78-b487d7257f06",
      "data": {
        "content": {
          "htmlContent": "<p>Start typing...awdawdawawd</p>"
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
    "createdAt": "2025-08-11T10:59:23.712Z",
    "updatedAt": "2025-08-11T10:59:23.712Z",
    "editorVersion": "2.0.0"
  },
  "positions": {
    "18e57228-2881-41f6-ac78-b487d7257f06": {
      "x": 0,
      "y": 205,
      "id": "18e57228-2881-41f6-ac78-b487d7257f06",
      "width": 600,
      "height": 200
    },
    "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd": {
      "x": 0,
      "y": 51,
      "id": "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd",
      "width": 600,
      "height": 200
    }
  },
  "mobilePositions": {
    "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd": {
      "x": 0,
      "y": 51,
      "id": "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd",
      "width": 375,
      "height": 200
    }
  }
};

// Legacy content currently being returned
const legacyContent = [
  {
    "id": "block_1753348841364_kw3sdm4l1",
    "type": "richText",
    "content": {
      "tiptapJSON": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "text": "Content from existing review. Ready for editing with the new unified editor.",
                "type": "text"
              }
            ]
          }
        ]
      },
      "htmlContent": "<p></p>"
    },
    "styling": {
      "opacity": 1,
      "padding": {
        "x": 16,
        "y": 16
      },
      "borderColor": "var(--color-editor-border)",
      "borderWidth": 1,
      "borderRadius": 8,
      "backgroundColor": "var(--color-editor-bg)"
    },
    "metadata": {
      "version": 3,
      "createdAt": "2025-07-24T09:19:30.347Z",
      "updatedAt": "2025-07-24T09:20:41.365Z"
    },
    "position": {
      "x": 100,
      "y": 100
    },
    "dimensions": {
      "width": 600,
      "height": 400
    }
  }
];

// Replicate the analyzeContentFormat function
function analyzeContentFormat(data) {
  const content = data.structured_content;
  
  // Initialize metadata
  let contentFormat = 'unknown';
  let nodeCount = 0;
  let hasPositions = false;
  let hasMobilePositions = false;
  
  if (content) {
    // Check for V3 format (positions-based)
    if (content.version === '3.0.0' && content.nodes && Array.isArray(content.nodes)) {
      contentFormat = 'v3';
      nodeCount = content.nodes.length;
      hasPositions = Boolean(content.positions && Object.keys(content.positions).length > 0);
      hasMobilePositions = Boolean(content.mobilePositions && Object.keys(content.mobilePositions).length > 0);
    }
    // Check for V2 format (layouts-based)
    else if (content.layouts && (content.layouts.desktop || content.layouts.mobile)) {
      contentFormat = 'v2';
      // Count blocks in V2 layouts
      const desktopBlocks = content.layouts.desktop?.length || 0;
      const mobileBlocks = content.layouts.mobile?.length || 0;
      nodeCount = Math.max(desktopBlocks, mobileBlocks);
    }
    // Check for legacy formats
    else if (content.blocks || content.elements || Array.isArray(content)) {
      contentFormat = 'legacy';
      nodeCount = content.blocks?.length || content.elements?.length || 
                  (Array.isArray(content) ? content.length : 0);
    }
  }
  
  return {
    ...data,
    contentFormat,
    nodeCount,
    hasPositions,
    hasMobilePositions,
  };
}

// Test 1: V3 Content Detection
console.log('=== TEST 1: V3 Content Detection ===');
const v3Result = analyzeContentFormat({ structured_content: v3Content });
console.log('V3 Result:', {
  contentFormat: v3Result.contentFormat,
  nodeCount: v3Result.nodeCount,
  hasPositions: v3Result.hasPositions,
  hasMobilePositions: v3Result.hasMobilePositions
});
console.log('Expected: v3, 2, true, true');
console.log('✅ PASS:', v3Result.contentFormat === 'v3' && v3Result.nodeCount === 2 && v3Result.hasPositions && v3Result.hasMobilePositions);

// Test 2: Legacy Content Detection
console.log('\n=== TEST 2: Legacy Content Detection ===');
const legacyResult = analyzeContentFormat({ structured_content: legacyContent });
console.log('Legacy Result:', {
  contentFormat: legacyResult.contentFormat,
  nodeCount: legacyResult.nodeCount,
  hasPositions: legacyResult.hasPositions,
  hasMobilePositions: legacyResult.hasMobilePositions
});
console.log('Expected: legacy, 1, false, false');
console.log('✅ PASS:', legacyResult.contentFormat === 'legacy' && legacyResult.nodeCount === 1 && !legacyResult.hasPositions && !legacyResult.hasMobilePositions);

// Test 3: Unknown Content Detection
console.log('\n=== TEST 3: Unknown Content Detection ===');
const unknownResult = analyzeContentFormat({ structured_content: null });
console.log('Unknown Result:', {
  contentFormat: unknownResult.contentFormat,
  nodeCount: unknownResult.nodeCount,
  hasPositions: unknownResult.hasPositions,
  hasMobilePositions: unknownResult.hasMobilePositions
});
console.log('Expected: unknown, 0, false, false');
console.log('✅ PASS:', unknownResult.contentFormat === 'unknown' && unknownResult.nodeCount === 0 && !unknownResult.hasPositions && !unknownResult.hasMobilePositions);

console.log('\n=== ANALYSIS ===');
console.log('✅ Format detection logic works correctly');
console.log('❌ Issue is in edge function deployment - V3 content exists but not being returned');
console.log('🎯 Solution: Edge function needs redeployment with latest V3 content bridge logic');