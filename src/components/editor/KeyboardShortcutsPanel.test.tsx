// ABOUTME: Tests for keyboard shortcuts panel ensuring all shortcuts are properly displayed and functional

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Mock the hook
vi.mock('@/hooks/useKeyboardShortcuts');

const mockShortcutCategories = [
  {
    id: 'system',
    name: 'System',
    shortcuts: [
      {
        id: 'undo',
        name: 'Undo',
        description: 'Undo the last action',
        keys: ['ctrl', 'z'],
        category: 'system',
        action: vi.fn(),
        disabled: false
      },
      {
        id: 'save',
        name: 'Save',
        description: 'Save the document',
        keys: ['ctrl', 's'],
        category: 'system',
        action: vi.fn(),
        disabled: false
      }
    ]
  },
  {
    id: 'editing',
    name: 'Editing',
    shortcuts: [
      {
        id: 'delete',
        name: 'Delete Block',
        description: 'Delete the selected block',
        keys: ['delete'],
        category: 'editing',
        action: vi.fn(),
        disabled: true
      }
    ]
  }
];

const mockUseKeyboardShortcuts = {
  shortcutCategories: mockShortcutCategories,
  formatShortcut: vi.fn((keys: string[]) => keys.join(' + ')),
  shortcutsEnabled: true,
  setShortcutsEnabled: vi.fn()
};

beforeEach(() => {
  vi.clearAllMocks();
  (useKeyboardShortcuts as any).mockReturnValue(mockUseKeyboardShortcuts);
});

describe('KeyboardShortcutsPanel', () => {
  it('should render trigger button with shortcut count', () => {
    render(<KeyboardShortcutsPanel />);
    
    expect(screen.getByRole('button', { name: /shortcuts/i })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 enabled shortcuts
  });

  it('should render custom trigger when provided', () => {
    const customTrigger = <button>Custom Trigger</button>;
    render(<KeyboardShortcutsPanel trigger={customTrigger} />);
    
    expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
  });

  it('should open dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('should display all shortcut categories', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Editing')).toBeInTheDocument();
  });

  it('should display shortcuts with proper formatting', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Undo the last action')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Delete Block')).toBeInTheDocument();
  });

  it('should show disabled state for disabled shortcuts', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    const deleteShortcut = screen.getByText('Delete Block').closest('div');
    expect(deleteShortcut).toHaveClass('opacity-50');
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('should filter shortcuts by search query', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    const searchInput = screen.getByPlaceholderText('Search shortcuts...');
    await user.type(searchInput, 'undo');
    
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete Block')).not.toBeInTheDocument();
  });

  it('should filter shortcuts by category', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    const editingButton = screen.getByRole('button', { name: 'Editing' });
    await user.click(editingButton);
    
    expect(screen.getByText('Delete Block')).toBeInTheDocument();
    expect(screen.queryByText('Undo')).not.toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('should clear search when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    const searchInput = screen.getByPlaceholderText('Search shortcuts...');
    await user.type(searchInput, 'test');
    
    const clearButton = screen.getByRole('button', { name: '' }); // X button
    await user.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  it('should toggle shortcuts enabled/disabled', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    const toggleButton = screen.getByRole('button', { name: 'Disable' });
    await user.click(toggleButton);
    
    expect(mockUseKeyboardShortcuts.setShortcutsEnabled).toHaveBeenCalledWith(false);
  });

  it('should display shortcuts statistics', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    expect(screen.getByText('2 of 3 shortcuts active')).toBeInTheDocument();
  });

  it('should show no results message when search returns nothing', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    const searchInput = screen.getByPlaceholderText('Search shortcuts...');
    await user.type(searchInput, 'nonexistent');
    
    expect(screen.getByText('No shortcuts found matching your search.')).toBeInTheDocument();
  });

  it('should display help footer information', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    expect(screen.getByText(/Press .* to toggle this panel/)).toBeInTheDocument();
    expect(screen.getByText('Shortcuts work globally unless noted otherwise')).toBeInTheDocument();
  });

  it('should show keyboard shortcut keys properly formatted', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    // Check that formatShortcut was called
    expect(mockUseKeyboardShortcuts.formatShortcut).toHaveBeenCalled();
  });

  it('should handle controlled open state', () => {
    const onOpenChange = vi.fn();
    render(<KeyboardShortcutsPanel open={true} onOpenChange={onOpenChange} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display shortcut category counts', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel />);
    
    await user.click(screen.getByRole('button', { name: /shortcuts/i }));
    
    expect(screen.getByText('2 shortcuts')).toBeInTheDocument(); // System category
    expect(screen.getByText('1 shortcut')).toBeInTheDocument(); // Editing category
  });
});