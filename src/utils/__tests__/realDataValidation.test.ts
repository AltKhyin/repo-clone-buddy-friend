// ABOUTME: Test validator with real corrupted mobile position data from logs

import { describe, it, expect } from 'vitest';
import { PositionDataValidator } from '../positionDataValidator';

describe('Real Data Validation', () => {
  it('should detect and fix phantom positions from actual mobile data', () => {
    const validator = new PositionDataValidator();
    
    // Real mobile positions from logs showing contentBottomEdge: 5260 (problematic)
    const mobilePositions = {
      // These are the real existing nodes
      "0496d2d1-c3bf-458f-9f10-4c021c35f208": { id: "0496d2d1-c3bf-458f-9f10-4c021c35f208", x: 0, y: 1117, width: 375, height: 229 },
      "0966e13b-419e-49c2-97d0-5f2f5473c26b": { id: "0966e13b-419e-49c2-97d0-5f2f5473c26b", x: 15, y: 1574, width: 339, height: 178 },
      "1fea1376-cd03-4e24-a622-2c612ea35cc4": { id: "1fea1376-cd03-4e24-a622-2c612ea35cc4", x: 8, y: 159, width: 354, height: 454 },
      
      // These are likely phantom positions causing the excessive height (notice extreme Y values)
      "4828e8a6-0fc8-4dc7-9211-7118a16e6cf4": { id: "4828e8a6-0fc8-4dc7-9211-7118a16e6cf4", x: 0, y: 4840, width: 375, height: 200 },
      "51dfaa2e-8cd3-48a8-8c6e-3532a14d4a06": { id: "51dfaa2e-8cd3-48a8-8c6e-3532a14d4a06", x: 0, y: 4620, width: 375, height: 200 },
      "6d87051a-82e6-4fda-b4fe-2b69131b036c": { id: "6d87051a-82e6-4fda-b4fe-2b69131b036c", x: 0, y: 5060, width: 375, height: 200 },
      "a8440518-8437-4436-8c94-113414b7bf92": { id: "a8440518-8437-4436-8c94-113414b7bf92", x: 0, y: 4129, width: 375, height: 200 }
    };
    
    // Real nodes from the imported content (only these should have positions)
    const actualNodes = [
      { id: "1fea1376-cd03-4e24-a622-2c612ea35cc4", type: "richBlock", data: {} },
      { id: "6ef398db-863a-4496-848e-79c122187cca", type: "richBlock", data: {} },
      { id: "50cf28bc-c24f-4123-97cc-c5c2c6e805e4", type: "richBlock", data: {} },
      { id: "0496d2d1-c3bf-458f-9f10-4c021c35f208", type: "richBlock", data: {} },
      { id: "fba13274-cbd3-4bf7-a3a5-f00b7b03b85b", type: "richBlock", data: {} },
      { id: "7582e1fa-5445-4494-b47e-2f1e237c6a79", type: "richBlock", data: {} },
      { id: "f2c330b9-e31a-47b3-bb84-e5d8402e6445", type: "richBlock", data: {} },
      { id: "b33cf40d-fc2b-4685-8e68-a6fb042ab07b", type: "richBlock", data: {} },
      { id: "0966e13b-419e-49c2-97d0-5f2f5473c26b", type: "richBlock", data: {} }
      // Notice: phantom position IDs are NOT in this node list
    ];
    
    const mobileCanvasConfig = { width: 375, minHeight: 300, gridColumns: 1 };
    
    // Generate report showing the problem
    const report = validator.generateSanitizationReport(mobilePositions, actualNodes, mobileCanvasConfig);
    
    console.log('📊 REAL DATA VALIDATION REPORT:');
    console.log('Original height:', report.original.calculatedHeight);
    console.log('Sanitized height:', report.sanitized.calculatedHeight);
    console.log('Height reduction:', report.improvement.heightReduction);
    console.log('Phantoms eliminated:', report.improvement.phantomsEliminated);
    console.log('Original content bounds:', report.original.contentBounds);
    console.log('Sanitized content bounds:', report.sanitized.contentBounds);
    console.log('Original phantom positions:', report.original.phantomPositions);
    console.log('Original invalid bounds:', report.original.invalidBounds);
    
    // Validate that we detect the phantom positions
    expect(report.original.phantomPositions.length).toBeGreaterThan(0);
    expect(report.original.phantomPositions).toContain("4828e8a6-0fc8-4dc7-9211-7118a16e6cf4");
    expect(report.original.phantomPositions).toContain("51dfaa2e-8cd3-48a8-8c6e-3532a14d4a06");
    expect(report.original.phantomPositions).toContain("6d87051a-82e6-4fda-b4fe-2b69131b036c");
    expect(report.original.phantomPositions).toContain("a8440518-8437-4436-8c94-113414b7bf92");
    
    // Validate height reduction based on content bounds (5260 -> 1752 = 3508px reduction)
    const originalContentHeight = report.original.contentBounds.bottomEdge;
    const sanitizedContentHeight = report.sanitized.contentBounds.bottomEdge;
    const actualContentReduction = originalContentHeight - sanitizedContentHeight;
    
    expect(actualContentReduction).toBeGreaterThan(3000); // Content bounds should reduce significantly
    expect(report.sanitized.calculatedHeight).toBeLessThan(2000); // Should be reasonable height
    
    // Validate that legitimate positions are preserved
    expect(report.sanitized.validPositions).toContain("0496d2d1-c3bf-458f-9f10-4c021c35f208");
    expect(report.sanitized.validPositions).toContain("0966e13b-419e-49c2-97d0-5f2f5473c26b");
    expect(report.sanitized.validPositions).toContain("1fea1376-cd03-4e24-a622-2c612ea35cc4");
    
    console.log('✅ Phantom position detection and sanitization working correctly!');
  });
});