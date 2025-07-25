// ABOUTME: Centralized command-component bridge system for TipTap extensions

import { Command } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';

/**
 * Base interface for component methods that can be called from TipTap commands
 */
export interface ComponentMethods {
  [key: string]: (...args: any[]) => any;
}

/**
 * Configuration for a TipTap extension's command bridge
 */
export interface ExtensionBridgeConfig {
  /** The TipTap node type name (e.g., 'customTable', 'customPoll') */
  nodeTypeName: string;
  /** The attribute name that stores the unique ID (e.g., 'tableId', 'pollId') */
  idAttributeName: string;
}

/**
 * Generic component registry for managing component references
 * Can be used by any TipTap extension
 */
export class ComponentRegistry<T extends ComponentMethods> {
  private components = new Map<string, T>();
  private config: ExtensionBridgeConfig;

  constructor(config: ExtensionBridgeConfig) {
    this.config = config;
  }

  /**
   * Register a component instance with the registry
   */
  register(nodeId: string, component: T): void {
    this.components.set(nodeId, component);
  }

  /**
   * Unregister a component instance from the registry
   */
  unregister(nodeId: string): void {
    this.components.delete(nodeId);
  }

  /**
   * Get a component instance by node ID
   */
  get(nodeId: string): T | undefined {
    return this.components.get(nodeId);
  }

  /**
   * Get component for current node at selection
   */
  getCurrentComponent(node: Node): T | undefined {
    const nodeId = node.attrs[this.config.idAttributeName];
    return nodeId ? this.components.get(nodeId) : undefined;
  }

  /**
   * Get all registered component IDs
   */
  getAllIds(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Get total number of registered components
   */
  size(): number {
    return this.components.size;
  }

  /**
   * Clear all registered components
   */
  clear(): void {
    this.components.clear();
  }
}

/**
 * Helper to find a specific node type in the current selection
 */
export const findNodeOfType = (state: any, nodeTypeName: string): Node | null => {
  const { selection } = state;
  const { $from } = selection;

  // Walk up the node tree to find the specified node type
  for (let depth = $from.depth; depth >= 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === nodeTypeName) {
      return node;
    }
  }

  return null;
};

/**
 * Generic command creator that integrates with component registry
 * Creates TipTap commands that can call methods on React components
 */
export const createBridgedCommand = <T extends ComponentMethods>(
  registry: ComponentRegistry<T>,
  methodName: keyof T,
  errorMessagePrefix: string
) => {
  return (...args: any[]): Command => {
    return ({ state, dispatch, tr }) => {
      // Find the current node of the configured type
      const node = findNodeOfType(state, registry['config'].nodeTypeName);
      if (!node) return false;

      // Get the component instance
      const component = registry.getCurrentComponent(node);
      if (!component) return false;

      try {
        // Call the component method with provided arguments
        const method = component[methodName];
        if (typeof method === 'function') {
          method.apply(component, args);
        } else {
          console.warn(`Method ${String(methodName)} is not a function on component`);
          return false;
        }

        // Update the document to trigger re-render
        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error(`${errorMessagePrefix}:`, error);
        return false;
      }
    };
  };
};

/**
 * Create a set of bridged commands for an extension
 * This function generates TipTap commands that can call React component methods
 */
export const createBridgedCommands = <T extends ComponentMethods>(
  registry: ComponentRegistry<T>,
  commandDefinitions: Record<string, {
    methodName: keyof T;
    errorMessage: string;
  }>
): Record<string, (...args: any[]) => Command> => {
  const commands: Record<string, (...args: any[]) => Command> = {};

  for (const [commandName, definition] of Object.entries(commandDefinitions)) {
    commands[commandName] = createBridgedCommand(
      registry,
      definition.methodName,
      definition.errorMessage
    );
  }

  return commands;
};

/**
 * React Hook for integrating components with the command bridge
 * This should be used in React components that need to receive command calls
 */
export const useCommandBridge = <T extends ComponentMethods>(
  registry: ComponentRegistry<T>,
  nodeId: string | null | undefined,
  componentMethods: T,
  dependencies: any[] = []
): void => {
  // This would need to be implemented in the consuming component
  // using React's useEffect and useMemo hooks
  // 
  // Example usage:
  // useEffect(() => {
  //   if (nodeId) {
  //     registry.register(nodeId, componentMethods);
  //     return () => registry.unregister(nodeId);
  //   }
  // }, [nodeId, componentMethods]);
};

/**
 * Utility for creating consistent node IDs
 */
export const generateNodeId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Type-safe command result helper
 */
export interface CommandResult {
  success: boolean;
  error?: string;
}

/**
 * Execute a command with error handling and result tracking
 */
export const executeCommand = async (
  commandFn: () => boolean | Promise<boolean>,
  commandName: string
): Promise<CommandResult> => {
  try {
    const result = await commandFn();
    return { success: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Command ${commandName} failed:`, errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Debug utilities for command bridge
 */
export const debugCommandBridge = {
  /**
   * Log all registered components for a registry
   */
  logRegisteredComponents: <T extends ComponentMethods>(registry: ComponentRegistry<T>) => {
    console.log(`Registered components (${registry.size()}):`, registry.getAllIds());
  },

  /**
   * Test if a component is properly registered
   */
  testComponentRegistration: <T extends ComponentMethods>(
    registry: ComponentRegistry<T>,
    nodeId: string
  ): boolean => {
    const component = registry.get(nodeId);
    const isRegistered = component !== undefined;
    console.log(`Component ${nodeId} registration test:`, isRegistered);
    return isRegistered;
  },

  /**
   * Validate that all required methods exist on a component
   */
  validateComponentMethods: <T extends ComponentMethods>(
    component: T,
    requiredMethods: (keyof T)[]
  ): boolean => {
    const missingMethods = requiredMethods.filter(
      method => typeof component[method] !== 'function'
    );
    
    if (missingMethods.length > 0) {
      console.warn('Missing component methods:', missingMethods);
      return false;
    }
    
    console.log('All required methods present on component');
    return true;
  }
};