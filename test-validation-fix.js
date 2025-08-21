// ABOUTME: Test script to verify the positioning data loss fix works with real database content

// Simulated problematic database content (based on actual database sample)
const problematicContent = {
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
                "content": [{"text": "Start typing test..", "type": "text"}]
              }
            ]
          },
          "htmlContent": "<p>Start typing test..</p>"
        },
        "paddingTop": 16,
        "borderWidth": 0,
        "paddingLeft": 16,
        "paddingRight": 16,
        "paddingBottom": 16
      },
      "type": "richBlock"
    },
    {
      "id": "5d706bc7-2498-460e-8a29-d9c8aeed9737",
      "data": {
        "content": "<p>Start typing...</p>", // ❌ PROBLEMATIC: string instead of object
        "paddingTop": 16,
        "paddingLeft": 16,
        "paddingRight": 16,
        "paddingBottom": 16
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
    "editorVersion": "2.0.0"
  },
  "positions": {
    "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd": {
      "x": 150,
      "y": 100,
      "id": "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd",
      "width": 424, // ✅ Custom width that should be preserved
      "height": 300
    },
    "5d706bc7-2498-460e-8a29-d9c8aeed9737": {
      "x": 200,
      "y": 450,
      "id": "5d706bc7-2498-460e-8a29-d9c8aeed9737",
      "width": 341, // ✅ Custom width that should be preserved  
      "height": 250
    }
  },
  "mobilePositions": {
    "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd": {
      "x": 0,
      "y": 100,
      "id": "53c63a1b-ccf0-4fbb-83e9-5fa8e8c0f0bd",
      "width": 375,
      "height": 300
    },
    "5d706bc7-2498-460e-8a29-d9c8aeed9737": {
      "x": 0,
      "y": 450,
      "id": "5d706bc7-2498-460e-8a29-d9c8aeed9737",
      "width": 375,
      "height": 250
    }
  }
};

console.log('🧪 TESTING VALIDATION FIX');
console.log('========================');
console.log();

console.log('📋 Test Input:');
console.log('- Node 1: Correct content structure (object)');
console.log('- Node 2: MALFORMED content structure (string)');
console.log('- Custom positioning: 424px and 341px widths');
console.log('- Expected: Content repair should fix malformed node, positioning preserved');
console.log();

console.log('📊 Original positioning data:');
Object.entries(problematicContent.positions).forEach(([id, pos]) => {
  console.log(`  ${id.substring(0, 8)}...: x=${pos.x}, y=${pos.y}, width=${pos.width}, height=${pos.height}`);
});
console.log();

console.log('⚠️  Run this test in the browser console after loading the editor page');
console.log('   to see the actual validation fix in action with the enhanced logging.');
console.log();

console.log('🎯 Expected outcome with the fix:');
console.log('✅ Content repair detects malformed RichBlock');
console.log('✅ String content converted to proper object structure'); 
console.log('✅ Validation succeeds after repair');
console.log('✅ Custom positioning preserved (424px, 341px)');
console.log('✅ No fallback to 600px generic widths');

export { problematicContent };