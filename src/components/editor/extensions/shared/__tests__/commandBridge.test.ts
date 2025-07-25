// ABOUTME: Tests for centralized command-component bridge system

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ComponentRegistry,
  findNodeOfType,
  createBridgedCommand,
  createBridgedCommands,
  generateNodeId,
  executeCommand,
  debugCommandBridge,
  ComponentMethods,
  ExtensionBridgeConfig,
} from '../commandBridge';

// Mock component methods interface
interface MockComponentMethods extends ComponentMethods {
  testMethod: (arg: string) => void;
  anotherMethod: (num: number, str: string) => boolean;
  throwingMethod: () => void;
}

describe('CommandBridge System', () => {
  let registry: ComponentRegistry<MockComponentMethods>;
  let mockComponent: MockComponentMethods;
  const config: ExtensionBridgeConfig = {
    nodeTypeName: 'testNode',
    idAttributeName: 'testId',
  };

  beforeEach(() => {
    registry = new ComponentRegistry<MockComponentMethods>(config);
    mockComponent = {
      testMethod: vi.fn(),
      anotherMethod: vi.fn().mockReturnValue(true),
      throwingMethod: vi.fn(() => {
        throw new Error('Test error');
      }),
    };
  });

  describe('ComponentRegistry', () => {
    it('should register components correctly', () => {
      registry.register('test-node-1', mockComponent);
      const retrieved = registry.get('test-node-1');
      expect(retrieved).toBe(mockComponent);
    });

    it('should unregister components correctly', () => {
      registry.register('test-node-1', mockComponent);
      registry.unregister('test-node-1');
      const retrieved = registry.get('test-node-1');
      expect(retrieved).toBeUndefined();
    });

    it('should return undefined for non-existent components', () => {
      const retrieved = registry.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should get current component from node', () => {
      const mockNode = {
        attrs: { testId: 'test-node-1' },
      };
      
      registry.register('test-node-1', mockComponent);
      const retrieved = registry.getCurrentComponent(mockNode as any);
      expect(retrieved).toBe(mockComponent);
    });

    it('should return undefined for node without ID', () => {
      const mockNode = {
        attrs: {},
      };
      
      const retrieved = registry.getCurrentComponent(mockNode as any);
      expect(retrieved).toBeUndefined();
    });

    it('should get all registered IDs', () => {
      registry.register('node-1', mockComponent);
      registry.register('node-2', mockComponent);
      
      const ids = registry.getAllIds();
      expect(ids).toEqual(['node-1', 'node-2']);
    });

    it('should return correct size', () => {
      expect(registry.size()).toBe(0);
      
      registry.register('node-1', mockComponent);
      expect(registry.size()).toBe(1);
      
      registry.register('node-2', mockComponent);
      expect(registry.size()).toBe(2);
    });

    it('should clear all components', () => {
      registry.register('node-1', mockComponent);
      registry.register('node-2', mockComponent);
      
      expect(registry.size()).toBe(2);
      registry.clear();
      expect(registry.size()).toBe(0);
    });
  });

  describe('findNodeOfType', () => {
    it('should find node of specified type', () => {
      const mockState = {
        selection: {
          $from: {
            depth: 2,
            node: (depth: number) => {
              if (depth === 1) {
                return { type: { name: 'testNode' } };
              }
              return { type: { name: 'otherNode' } };
            },
          },
        },
      };

      const node = findNodeOfType(mockState, 'testNode');
      expect(node).toEqual({ type: { name: 'testNode' } });
    });

    it('should return null if node type not found', () => {
      const mockState = {
        selection: {
          $from: {
            depth: 1,
            node: () => ({ type: { name: 'otherNode' } }),
          },
        },
      };

      const node = findNodeOfType(mockState, 'testNode');
      expect(node).toBeNull();
    });
  });

  describe('createBridgedCommand', () => {
    beforeEach(() => {
      registry.register('test-node-1', mockComponent);
    });

    it('should create command that calls component method', () => {
      const command = createBridgedCommand(
        registry,
        'testMethod',
        'Failed to test'
      );

      const mockState = {
        selection: {
          $from: {
            depth: 1,
            node: () => ({
              type: { name: 'testNode' },
              attrs: { testId: 'test-node-1' },
            }),
          },
        },
      };

      const mockDispatch = vi.fn();
      const mockTr = { setMeta: vi.fn().mockReturnThis() };

      const result = command('test-arg')({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(true);
      expect(mockComponent.testMethod).toHaveBeenCalledWith('test-arg');
      expect(mockDispatch).toHaveBeenCalledWith(mockTr);
    });

    it('should return false when node not found', () => {
      const command = createBridgedCommand(
        registry,
        'testMethod',
        'Failed to test'
      );

      const mockState = {
        selection: {
          $from: {
            depth: 0,
            node: () => ({ type: { name: 'wrongNode' } }),
          },
        },
      };

      const result = command('test-arg')({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(false);
      expect(mockComponent.testMethod).not.toHaveBeenCalled();
    });

    it('should return false when component not registered', () => {
      registry.clear();
      
      const command = createBridgedCommand(
        registry,
        'testMethod',
        'Failed to test'
      );

      const mockState = {
        selection: {
          $from: {
            depth: 1,
            node: () => ({
              type: { name: 'testNode' },
              attrs: { testId: 'test-node-1' },
            }),
          },
        },
      };

      const result = command('test-arg')({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(false);
      expect(mockComponent.testMethod).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      const command = createBridgedCommand(
        registry,
        'throwingMethod',
        'Failed to execute throwing method'
      );

      const mockState = {
        selection: {
          $from: {
            depth: 1,
            node: () => ({
              type: { name: 'testNode' },
              attrs: { testId: 'test-node-1' },
            }),
          },
        },
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = command()({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to execute throwing method:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle non-function methods', () => {
      const badComponent = {
        ...mockComponent,
        testMethod: 'not a function' as any,
      };
      
      registry.clear();
      registry.register('test-node-1', badComponent);

      const command = createBridgedCommand(
        registry,
        'testMethod',
        'Failed to test'
      );

      const mockState = {
        selection: {
          $from: {
            depth: 1,
            node: () => ({
              type: { name: 'testNode' },
              attrs: { testId: 'test-node-1' },
            }),
          },
        },
      };

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = command('test-arg')({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Method testMethod is not a function on component'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('createBridgedCommands', () => {
    beforeEach(() => {
      registry.register('test-node-1', mockComponent);
    });

    it('should create multiple bridged commands', () => {
      const commands = createBridgedCommands(registry, {
        testCommand: {
          methodName: 'testMethod',
          errorMessage: 'Failed to test',
        },
        anotherCommand: {
          methodName: 'anotherMethod',
          errorMessage: 'Failed another test',
        },
      });

      expect(commands).toHaveProperty('testCommand');
      expect(commands).toHaveProperty('anotherCommand');
      expect(typeof commands.testCommand).toBe('function');
      expect(typeof commands.anotherCommand).toBe('function');
    });

    it('should create working commands', () => {
      const commands = createBridgedCommands(registry, {
        testCommand: {
          methodName: 'testMethod',
          errorMessage: 'Failed to test',
        },
      });

      const mockState = {
        selection: {
          $from: {
            depth: 1,
            node: () => ({
              type: { name: 'testNode' },
              attrs: { testId: 'test-node-1' },
            }),
          },
        },
      };

      const result = commands.testCommand('test-arg')({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(true);
      expect(mockComponent.testMethod).toHaveBeenCalledWith('test-arg');
    });
  });

  describe('generateNodeId', () => {
    it('should generate unique IDs with prefix', () => {
      const id1 = generateNodeId('test');
      const id2 = generateNodeId('test');
      
      expect(id1).toMatch(/^test-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^test-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('executeCommand', () => {
    it('should execute successful command', async () => {
      const commandFn = vi.fn().mockReturnValue(true);
      
      const result = await executeCommand(commandFn, 'testCommand');
      
      expect(result).toEqual({ success: true });
      expect(commandFn).toHaveBeenCalled();
    });

    it('should handle failed command', async () => {
      const commandFn = vi.fn().mockReturnValue(false);
      
      const result = await executeCommand(commandFn, 'testCommand');
      
      expect(result).toEqual({ success: false });
    });

    it('should handle command errors', async () => {
      const commandFn = vi.fn().mockRejectedValue(new Error('Test error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await executeCommand(commandFn, 'testCommand');
      
      expect(result).toEqual({ success: false, error: 'Test error' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Command testCommand failed:',
        'Test error'
      );

      consoleSpy.mockRestore();
    });

    it('should handle async successful command', async () => {
      const commandFn = vi.fn().mockResolvedValue(true);
      
      const result = await executeCommand(commandFn, 'asyncCommand');
      
      expect(result).toEqual({ success: true });
    });
  });

  describe('debugCommandBridge', () => {
    beforeEach(() => {
      registry.register('node-1', mockComponent);
      registry.register('node-2', mockComponent);
    });

    it('should log registered components', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      debugCommandBridge.logRegisteredComponents(registry);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Registered components (2):',
        ['node-1', 'node-2']
      );

      consoleSpy.mockRestore();
    });

    it('should test component registration', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = debugCommandBridge.testComponentRegistration(registry, 'node-1');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Component node-1 registration test:',
        true
      );

      consoleSpy.mockRestore();
    });

    it('should validate component methods', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = debugCommandBridge.validateComponentMethods(
        mockComponent,
        ['testMethod', 'anotherMethod']
      );
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('All required methods present on component');

      consoleSpy.mockRestore();
    });

    it('should detect missing component methods', () => {
      const incompleteComponent = {
        testMethod: vi.fn(),
        // missing anotherMethod
      } as any;

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = debugCommandBridge.validateComponentMethods(
        incompleteComponent,
        ['testMethod', 'anotherMethod', 'throwingMethod']
      );
      
      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Missing component methods:',
        ['anotherMethod', 'throwingMethod']
      );

      consoleWarnSpy.mockRestore();
    });
  });
});