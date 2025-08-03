// ABOUTME: Unified DOM-first table detection utility that eliminates ProseMirror dependency and performance bottlenecks

export interface TableDetectionResult {
  isTableCell: boolean;
  tableId?: string;
  cellPosition?: { row: number; col: number };
  confidence: 'high' | 'medium' | 'low';
  method: 'dom' | 'prosemirror' | 'hybrid';
  elementType?: string;
  parentChain?: string[];
}

interface CacheEntry {
  result: TableDetectionResult;
  timestamp: number;
  elementId?: string;
}

class TableDetectionCache {
  private cache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;
  private maxAge = 5000; // 5 seconds cache TTL
  private maxSize = 100;

  private generateKey(element: HTMLElement): string {
    // Create stable key based on element properties
    const testId = element.getAttribute('data-testid') || '';
    const blockId = this.findBlockId(element) || '';
    const tagName = element.tagName.toLowerCase();
    const classList = Array.from(element.classList).sort().join(',');
    
    return `${tagName}:${testId}:${blockId}:${classList}`;
  }

  private findBlockId(element: HTMLElement): string | null {
    let current: HTMLElement | null = element;
    while (current) {
      if (current.hasAttribute('data-block-id')) {
        return current.getAttribute('data-block-id');
      }
      current = current.parentElement;
    }
    return null;
  }

  get(element: HTMLElement): TableDetectionResult | null {
    const key = this.generateKey(element);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return entry.result;
  }

  set(element: HTMLElement, result: TableDetectionResult): void {
    const key = this.generateKey(element);
    
    // Implement LRU eviction if cache is too large
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      elementId: element.id
    });
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)) * 100 : 0
    };
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

// Global cache instance
const detectionCache = new TableDetectionCache();

/**
 * Core DOM-first table cell detection
 * This is the replacement for the problematic ProseMirror-based findParentCell
 */
export function detectTableContext(element: HTMLElement | null): TableDetectionResult {
  // Handle null/undefined input gracefully
  if (!element || !(element instanceof HTMLElement)) {
    return {
      isTableCell: false,
      confidence: 'high',
      method: 'dom',
      elementType: 'null'
    };
  }

  // Check cache first for performance
  const cachedResult = detectionCache.get(element);
  if (cachedResult) {
    return cachedResult;
  }

  let current: HTMLElement | null = element;
  const parentChain: string[] = [];
  
  while (current) {
    parentChain.push(current.tagName.toLowerCase());
    
    // PRIMARY DETECTION: Check for table cell data attributes (our standard)
    if (current.hasAttribute('data-testid')) {
      const testId = current.getAttribute('data-testid');
      if (testId?.startsWith('table-cell-')) {
        const result = parseTableCellTestId(current, testId, parentChain);
        detectionCache.set(element, result);
        return result;
      }
    }
    
    // SECONDARY DETECTION: Check for standard table cell elements
    if (current.tagName === 'TD' || current.tagName === 'TH') {
      const result = analyzeStandardTableCell(current, parentChain);
      detectionCache.set(element, result);
      return result;
    }
    
    // TERTIARY DETECTION: Check for table cell containers
    if (current.classList.contains('table-cell-container') ||
        current.classList.contains('rich-cell-editor') ||
        current.classList.contains('cell-display-content')) {
      
      // Look for parent table cell
      const parentCell = current.closest('[data-testid^="table-cell-"], td, th');
      if (parentCell instanceof HTMLElement) {
        const result = detectTableContext(parentCell);
        detectionCache.set(element, result);
        return result;
      }
    }
    
    // Move up the DOM tree
    current = current.parentElement;
  }
  
  // No table cell found - return negative result
  const result: TableDetectionResult = {
    isTableCell: false,
    confidence: 'high',
    method: 'dom',
    elementType: element.tagName.toLowerCase(),
    parentChain
  };
  
  detectionCache.set(element, result);
  return result;
}

/**
 * Parse table cell from our standard data-testid format
 */
function parseTableCellTestId(
  cellElement: HTMLElement, 
  testId: string,
  parentChain: string[]
): TableDetectionResult {
  const match = testId.match(/table-cell-(-?\d+)-(\d+)/);
  
  if (!match) {
    return {
      isTableCell: false,
      confidence: 'medium',
      method: 'dom',
      elementType: cellElement.tagName.toLowerCase(),
      parentChain
    };
  }
  
  const row = parseInt(match[1]);
  const col = parseInt(match[2]);
  const isHeader = row === -1; // -1 indicates header row
  
  // Find the table container to get the table ID
  const tableContainer = findTableContainer(cellElement);
  const tableId = tableContainer?.getAttribute('data-block-id');
  
  if (!tableId) {
    return {
      isTableCell: true,
      confidence: 'medium',
      method: 'dom',
      cellPosition: { row, col },
      elementType: cellElement.tagName.toLowerCase(),
      parentChain
    };
  }
  
  return {
    isTableCell: true,
    tableId,
    cellPosition: { row, col },
    confidence: 'high',
    method: 'dom',
    elementType: cellElement.tagName.toLowerCase(),
    parentChain
  };
}

/**
 * Analyze standard HTML table cells (td/th)
 */
function analyzeStandardTableCell(
  cellElement: HTMLElement,
  parentChain: string[]
): TableDetectionResult {
  const tableContainer = findTableContainer(cellElement);
  const tableId = tableContainer?.getAttribute('data-block-id');
  
  // Try to determine position within table
  const row = findRowIndex(cellElement);
  const col = findColumnIndex(cellElement);
  
  return {
    isTableCell: true,
    tableId,
    cellPosition: row !== -1 && col !== -1 ? { row, col } : undefined,
    confidence: tableId ? 'high' : 'medium',
    method: 'dom',
    elementType: cellElement.tagName.toLowerCase(),
    parentChain
  };
}

/**
 * Find the table container element
 */
function findTableContainer(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;
  
  while (current) {
    // Look for our block structure
    if (current.hasAttribute('data-block-id')) {
      // Verify it contains a table
      if (current.querySelector('table')) {
        return current;
      }
    }
    
    // Look for table element
    if (current.tagName === 'TABLE') {
      // Check if parent has block ID
      const parent = current.parentElement;
      if (parent?.hasAttribute('data-block-id')) {
        return parent;
      }
      return current;
    }
    
    current = current.parentElement;
  }
  
  return null;
}

/**
 * Find row index within table
 */
function findRowIndex(cellElement: HTMLElement): number {
  const row = cellElement.closest('tr');
  if (!row) return -1;
  
  const table = row.closest('table');
  if (!table) return -1;
  
  const rows = Array.from(table.querySelectorAll('tr'));
  return rows.indexOf(row);
}

/**
 * Find column index within row
 */
function findColumnIndex(cellElement: HTMLElement): number {
  const row = cellElement.closest('tr');
  if (!row) return -1;
  
  const cells = Array.from(row.querySelectorAll('td, th'));
  return cells.indexOf(cellElement);
}

/**
 * Performance benchmark function for testing
 */
export function benchmarkDetection(
  element: HTMLElement, 
  iterations: number = 1000
): {
  avgTimeMs: number;
  totalProseMirrorCalls: number;
} {
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    detectTableContext(element);
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  return {
    avgTimeMs: totalTime / iterations,
    totalProseMirrorCalls: 0 // DOM-based approach uses zero ProseMirror calls
  };
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return detectionCache.getStats();
}

/**
 * Clear detection cache (useful for testing)
 */
export function clearCache() {
  detectionCache.clear();
}

/**
 * Advanced detection for complex scenarios
 */
export function detectTableContextAdvanced(
  element: HTMLElement,
  options: {
    includeProseMirrorFallback?: boolean;
    cacheEnabled?: boolean;
    maxTraversalDepth?: number;
  } = {}
): TableDetectionResult {
  const {
    cacheEnabled = true,
    maxTraversalDepth = 10
  } = options;
  
  // Use main detection function
  let result = detectTableContext(element);
  
  // If we didn't find a table cell and ProseMirror fallback is enabled,
  // we could add that here in the future, but for now DOM-first is sufficient
  
  return result;
}

/**
 * Validate that an element is actually within a table structure
 */
export function validateTableStructure(element: HTMLElement): {
  isValid: boolean;
  tableElement: HTMLElement | null;
  issues: string[];
} {
  const issues: string[] = [];
  let tableElement: HTMLElement | null = null;
  
  // Find table element
  let current: HTMLElement | null = element;
  while (current) {
    if (current.tagName === 'TABLE') {
      tableElement = current;
      break;
    }
    current = current.parentElement;
  }
  
  if (!tableElement) {
    issues.push('No parent table element found');
    return { isValid: false, tableElement: null, issues };
  }
  
  // Validate table structure
  const rows = tableElement.querySelectorAll('tr');
  if (rows.length === 0) {
    issues.push('Table has no rows');
  }
  
  const cells = tableElement.querySelectorAll('td, th');
  if (cells.length === 0) {
    issues.push('Table has no cells');
  }
  
  return {
    isValid: issues.length === 0,
    tableElement,
    issues
  };
}

// Development utilities
if (process.env.NODE_ENV === 'development') {
  // Make detection utilities available in global scope for debugging
  (window as any).__tableDetection = {
    detectTableContext,
    getCacheStats,
    clearCache,
    benchmarkDetection,
    validateTableStructure,
    cache: detectionCache
  };
}