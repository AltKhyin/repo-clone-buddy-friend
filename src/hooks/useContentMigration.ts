// ABOUTME: Content migration system for upgrading from legacy formats to structured content v2.0

import React, { useCallback } from 'react';
import { z } from 'zod';
import { StructuredContentV2, validateStructuredContent, generateNodeId } from '@/types/editor';
import { useToast } from '@/hooks/use-toast';

// Legacy content schemas for migration
const LegacyContentV1Schema = z.object({
  version: z.literal('1.0.0').optional(),
  blocks: z.array(z.object({
    id: z.string(),
    type: z.string(),
    content: z.any(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }).optional(),
  })),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
});

const LegacyHTMLContentSchema = z.object({
  htmlContent: z.string(),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
});

type LegacyContentV1 = z.infer<typeof LegacyContentV1Schema>;
type LegacyHTMLContent = z.infer<typeof LegacyHTMLContentSchema>;

export interface MigrationResult {
  success: boolean;
  migratedContent?: StructuredContentV2;
  errors: string[];
  warnings: string[];
  migrationReport: {
    sourceFormat: string;
    targetFormat: string;
    blocksProcessed: number;
    blocksMigrated: number;
    blocksFailed: number;
  };
}

export interface MigrationState {
  isMigrating: boolean;
  migrationProgress: number;
  currentOperation: string;
  migrationError: Error | null;
}

export function useContentMigration() {
  const { toast } = useToast();
  
  const [migrationState, setMigrationState] = React.useState<MigrationState>({
    isMigrating: false,
    migrationProgress: 0,
    currentOperation: '',
    migrationError: null,
  });

  // Detect content format
  const detectContentFormat = useCallback((content: any): string => {
    try {
      // Check for v2.0 format
      if (content?.version === '2.0.0' && content?.nodes && content?.layouts) {
        return 'structured-v2';
      }

      // Check for v1.0 format
      if (content?.blocks && Array.isArray(content.blocks)) {
        return 'structured-v1';
      }

      // Check for HTML content
      if (typeof content === 'string' || content?.htmlContent) {
        return 'html';
      }

      // Check for raw JSON with block-like structure
      if (content && typeof content === 'object' && !content.version) {
        return 'unknown-json';
      }

      return 'unknown';
    } catch (error) {
      console.error('Error detecting content format:', error);
      return 'invalid';
    }
  }, []);

  // Migrate from v1.0 to v2.0
  const migrateFromV1 = useCallback(async (legacyContent: LegacyContentV1): Promise<StructuredContentV2> => {
    setMigrationState(prev => ({ ...prev, currentOperation: 'Migrating blocks from v1.0' }));

    const nodes = [];
    const desktopItems = [];
    let blocksFailed = 0;

    for (let i = 0; i < legacyContent.blocks.length; i++) {
      const block = legacyContent.blocks[i];
      
      setMigrationState(prev => ({ 
        ...prev, 
        migrationProgress: (i / legacyContent.blocks.length) * 100,
        currentOperation: `Migrating block ${i + 1} of ${legacyContent.blocks.length}: ${block.type}`
      }));

      try {
        // Migrate block data based on type
        let migratedData;
        switch (block.type) {
          case 'text':
          case 'textBlock':
            migratedData = {
              htmlContent: block.content?.text || block.content?.htmlContent || '<p>Empty text block</p>',
              fontSize: block.content?.fontSize,
              textAlign: block.content?.textAlign,
              color: block.content?.color,
            };
            break;

          case 'heading':
          case 'headingBlock':
            migratedData = {
              htmlContent: block.content?.text || block.content?.htmlContent || 'Heading',
              level: block.content?.level || 1,
              textAlign: block.content?.textAlign,
              color: block.content?.color,
            };
            break;

          case 'image':
          case 'imageBlock':
            migratedData = {
              src: block.content?.src || block.content?.url || '',
              alt: block.content?.alt || '',
              caption: block.content?.caption || '',
              width: block.content?.width,
              height: block.content?.height,
            };
            break;

          default:
            // Generic migration for unknown block types
            migratedData = block.content || {};
        }

        // Create v2.0 node
        const newNode = {
          id: block.id || generateNodeId(),
          type: block.type.endsWith('Block') ? block.type : `${block.type}Block`,
          data: migratedData,
        };

        nodes.push(newNode);

        // Create layout item
        const layoutItem = {
          nodeId: newNode.id,
          x: Math.floor(Math.random() * 8), // Random grid position
          y: i * 2, // Stack vertically
          w: 6, // Half width by default
          h: 2, // Standard height
        };

        desktopItems.push(layoutItem);

      } catch (error) {
        console.error(`Failed to migrate block ${block.id}:`, error);
        blocksFailed++;
      }
    }

    // Create v2.0 structure
    const migratedContent: StructuredContentV2 = {
      version: '2.0.0',
      nodes,
      layouts: {
        desktop: {
          gridSettings: { columns: 12 },
          items: desktopItems,
        },
        mobile: {
          gridSettings: { columns: 4 },
          items: desktopItems.map(item => ({
            ...item,
            x: 0,
            w: 4, // Full width on mobile
          })),
        },
      },
      metadata: {
        createdAt: legacyContent.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        editorVersion: '2.0.0',
      },
    };

    if (blocksFailed > 0) {
      console.warn(`Migration completed with ${blocksFailed} failed blocks`);
    }

    return migratedContent;
  }, []);

  // Migrate from HTML content
  const migrateFromHTML = useCallback(async (htmlContent: string): Promise<StructuredContentV2> => {
    setMigrationState(prev => ({ ...prev, currentOperation: 'Converting HTML to structured content' }));

    // Create a single text block with the HTML content
    const nodeId = generateNodeId();
    const migratedContent: StructuredContentV2 = {
      version: '2.0.0',
      nodes: [{
        id: nodeId,
        type: 'textBlock',
        data: {
          htmlContent: htmlContent || '<p>Empty content</p>',
        },
      }],
      layouts: {
        desktop: {
          gridSettings: { columns: 12 },
          items: [{
            nodeId,
            x: 0,
            y: 0,
            w: 12, // Full width
            h: 4,  // Standard height
          }],
        },
        mobile: {
          gridSettings: { columns: 4 },
          items: [{
            nodeId,
            x: 0,
            y: 0,
            w: 4, // Full width on mobile
            h: 4,
          }],
        },
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        editorVersion: '2.0.0',
      },
    };

    return migratedContent;
  }, []);

  // Main migration function
  const migrateContent = useCallback(async (content: any): Promise<MigrationResult> => {
    setMigrationState({
      isMigrating: true,
      migrationProgress: 0,
      currentOperation: 'Detecting content format...',
      migrationError: null,
    });

    const errors: string[] = [];
    const warnings: string[] = [];
    let migratedContent: StructuredContentV2 | undefined;
    let sourceFormat = 'unknown';
    let blocksProcessed = 0;
    let blocksMigrated = 0;
    let blocksFailed = 0;

    try {
      sourceFormat = detectContentFormat(content);
      
      setMigrationState(prev => ({ 
        ...prev, 
        migrationProgress: 10,
        currentOperation: `Detected format: ${sourceFormat}` 
      }));

      switch (sourceFormat) {
        case 'structured-v2':
          // Already in correct format, just validate
          migratedContent = validateStructuredContent(content);
          blocksProcessed = migratedContent.nodes.length;
          blocksMigrated = blocksProcessed;
          warnings.push('Content is already in v2.0 format');
          break;

        case 'structured-v1':
          // Migrate from v1.0
          const v1Content = LegacyContentV1Schema.parse(content);
          blocksProcessed = v1Content.blocks.length;
          migratedContent = await migrateFromV1(v1Content);
          blocksMigrated = migratedContent.nodes.length;
          blocksFailed = blocksProcessed - blocksMigrated;
          break;

        case 'html':
          // Migrate from HTML
          const htmlContent = typeof content === 'string' ? content : content.htmlContent;
          blocksProcessed = 1;
          migratedContent = await migrateFromHTML(htmlContent);
          blocksMigrated = 1;
          break;

        default:
          throw new Error(`Unsupported content format: ${sourceFormat}`);
      }

      // Final validation
      setMigrationState(prev => ({ 
        ...prev, 
        migrationProgress: 90,
        currentOperation: 'Validating migrated content...' 
      }));

      if (migratedContent) {
        migratedContent = validateStructuredContent(migratedContent);
      }

      setMigrationState(prev => ({ 
        ...prev, 
        migrationProgress: 100,
        currentOperation: 'Migration completed successfully' 
      }));

      toast({
        title: "Migration Successful",
        description: `Successfully migrated ${blocksMigrated} blocks to v2.0 format`,
      });

      return {
        success: true,
        migratedContent,
        errors,
        warnings,
        migrationReport: {
          sourceFormat,
          targetFormat: 'structured-v2',
          blocksProcessed,
          blocksMigrated,
          blocksFailed,
        },
      };

    } catch (error) {
      console.error('Migration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown migration error';
      errors.push(errorMessage);

      setMigrationState(prev => ({ 
        ...prev, 
        migrationError: error as Error,
        currentOperation: 'Migration failed' 
      }));

      toast({
        title: "Migration Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        errors,
        warnings,
        migrationReport: {
          sourceFormat,
          targetFormat: 'structured-v2',
          blocksProcessed,
          blocksMigrated,
          blocksFailed,
        },
      };
    } finally {
      setMigrationState(prev => ({ ...prev, isMigrating: false }));
    }
  }, [detectContentFormat, migrateFromV1, migrateFromHTML, toast]);

  // Check if content needs migration
  const needsMigration = useCallback((content: any): boolean => {
    const format = detectContentFormat(content);
    return format !== 'structured-v2';
  }, [detectContentFormat]);

  return {
    migrationState,
    migrateContent,
    needsMigration,
    detectContentFormat,
  };
}