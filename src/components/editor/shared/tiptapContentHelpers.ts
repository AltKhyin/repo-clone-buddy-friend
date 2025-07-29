// ABOUTME: Utility functions for creating proper TipTap JSON content for Rich Block extensions

/**
 * Creates TipTap JSON content with a table node
 */
export function createTableContent(
  options: {
    rows?: number;
    cols?: number;
    withHeaderRow?: boolean;
    headers?: string[];
  } = {}
): any {
  const { rows = 3, cols = 3, withHeaderRow = true, headers = [] } = options;

  // Generate default headers if not provided
  const defaultHeaders =
    headers.length > 0
      ? headers.slice(0, cols)
      : Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);

  // Ensure headers array matches column count
  const finalHeaders = Array.from(
    { length: cols },
    (_, i) => defaultHeaders[i] || `Column ${i + 1}`
  );

  // Generate empty rows
  const emptyRows = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));

  // Generate unique table ID
  const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create TipTap JSON document with table node
  return {
    type: 'doc',
    content: [
      {
        type: 'customTable',
        attrs: {
          tableId,
          headers: withHeaderRow ? finalHeaders : [],
          rows: emptyRows,
          styling: {
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: '#e2e8f0',
            backgroundColor: 'transparent',
            headerBackgroundColor: '#f8fafc',
            cellPadding: 12,
            textAlign: 'left',
            fontSize: 14,
            fontWeight: 400,
            striped: false,
            compact: false,
          },
          settings: {
            sortable: false,
            resizable: true,
            showHeaders: withHeaderRow,
            minRows: 1,
            maxRows: 50,
          },
        },
      },
    ],
  };
}

// REMOVED: createPollContent - polls moved to community-only features

/**
 * Creates TipTap JSON content with a paragraph (for basic Rich Blocks)
 */
export function createParagraphContent(text: string = 'Start typing...'): any {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: text
          ? [
              {
                type: 'text',
                text,
              },
            ]
          : [],
      },
    ],
  };
}

/**
 * Converts TipTap JSON to HTML string for storage
 */
export function tiptapJsonToHtml(json: any): string {
  // This is a simplified conversion - in a real implementation,
  // you'd use TipTap's generateHTML function with the proper schema

  if (!json || !json.content) {
    return '<p>Start typing...</p>';
  }

  // Handle single nodes in content array
  const firstNode = json.content[0];

  if (firstNode.type === 'customTable') {
    // For tables, we'll use a special data attribute to preserve the full JSON
    return `<div data-tiptap-node="customTable" data-tiptap-attrs="${encodeURIComponent(JSON.stringify(firstNode.attrs))}"><table><tbody><tr><th>Table Loading...</th></tr></tbody></table></div>`;
  }

  // REMOVED: customPoll handling - polls moved to community-only features

  if (firstNode.type === 'paragraph') {
    const textContent = firstNode.content?.[0]?.text || 'Start typing...';
    return `<p>${textContent}</p>`;
  }

  return '<p>Start typing...</p>';
}

/**
 * Extracts TipTap JSON from HTML with embedded data attributes
 */
export function htmlToTiptapJson(html: string): any {
  // This handles the special case where we embedded TipTap node data in HTML

  // Check for table node
  const tableMatch = html.match(/data-tiptap-node="customTable".*?data-tiptap-attrs="([^"]+)"/);
  if (tableMatch) {
    try {
      const attrs = JSON.parse(decodeURIComponent(tableMatch[1]));
      return createTableContent({
        rows: attrs.rows?.length || 3,
        cols: attrs.headers?.length || 3,
        withHeaderRow: attrs.settings?.showHeaders || true,
        headers: attrs.headers || [],
      });
    } catch (error) {
      console.warn('Failed to parse table attrs from HTML:', error);
    }
  }

  // REMOVED: Poll handling - polls moved to community-only features

  // Default to paragraph content
  return createParagraphContent();
}
