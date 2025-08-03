// ABOUTME: Global controller registry to isolate resize controllers from React lifecycle

import { SimpleResizeController, ResizeHandle, MousePosition } from './SimpleResizeController';

interface ControllerEntry {
  controller: SimpleResizeController;
  nodeId: string;
  lastUsed: number;
  isActive: boolean;
}

/**
 * Global registry to manage resize controllers independently of React lifecycle
 * This prevents controller recreation during component re-renders
 */
class ResizeControllerRegistry {
  private controllers = new Map<string, ControllerEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval to remove unused controllers
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000); // Clean up every 30 seconds
  }

  /**
   * Get or create a controller for a specific node
   */
  getController(
    nodeId: string, 
    onUpdate: (nodeId: string, position: any) => void
  ): SimpleResizeController {
    const existing = this.controllers.get(nodeId);
    
    if (existing) {
      existing.lastUsed = Date.now();
      existing.isActive = true;
      return existing.controller;
    }
    const controller = new SimpleResizeController(nodeId, {
      nodeId,
      onUpdate
    });

    this.controllers.set(nodeId, {
      controller,
      nodeId,
      lastUsed: Date.now(),
      isActive: true
    });

    return controller;
  }

  /**
   * Mark a controller as inactive (component unmounted)
   */
  deactivateController(nodeId: string): void {
    const entry = this.controllers.get(nodeId);
    if (entry) {
      entry.isActive = false;
      entry.lastUsed = Date.now();
    }
  }

  /**
   * Get controller stats for debugging
   */
  getStats(): { total: number; active: number; inactive: number } {
    const entries = Array.from(this.controllers.values());
    return {
      total: entries.length,
      active: entries.filter(e => e.isActive).length,
      inactive: entries.filter(e => !e.isActive).length
    };
  }

  /**
   * Clean up old inactive controllers
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60000; // 1 minute
    let cleaned = 0;

    for (const [nodeId, entry] of this.controllers.entries()) {
      if (!entry.isActive && (now - entry.lastUsed) > maxAge) {
        entry.controller.destroy();
        this.controllers.delete(nodeId);
        cleaned++;
      }
    }
  }

  /**
   * Destroy all controllers and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    for (const [nodeId, entry] of this.controllers.entries()) {
      entry.controller.destroy();
    }
    
    this.controllers.clear();
  }
}

// Global singleton instance
export const controllerRegistry = new ResizeControllerRegistry();

// Clean up on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    controllerRegistry.destroy();
  });
}