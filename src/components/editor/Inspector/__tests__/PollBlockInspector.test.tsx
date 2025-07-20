// ABOUTME: Test suite for PollBlockInspector with typography controls validation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PollBlockInspector } from '../PollBlockInspector';
import { useEditorStore } from '@/store/editorStore';
import { PollBlockData } from '@/types/editor';

// Mock the editor store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(),
}));

// Mock the typography components
vi.mock('@/components/editor/shared/typography-system', () => ({
  FONT_FAMILIES: [
    { value: 'inherit', label: 'Inherit' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Georgia', label: 'Georgia' },
  ],
  FONT_WEIGHTS: [
    { value: 400, label: 'Normal' },
    { value: 700, label: 'Bold' },
  ],
  ALIGNMENT_OPTIONS: [
    { value: 'left', icon: vi.fn(), label: 'Left' },
    { value: 'center', icon: vi.fn(), label: 'Center' },
    { value: 'right', icon: vi.fn(), label: 'Right' },
  ],
}));

// Mock the color control
vi.mock('@/components/editor/Inspector/shared/ColorControl', () => ({
  ColorControl: ({ label, value, onChange }: any) => (
    <div data-testid="color-control">
      <label>{label}</label>
      <input
        data-testid="color-input"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  ),
}));

// Mock the spacing controls
vi.mock('@/components/editor/Inspector/shared/SpacingControls', () => ({
  SpacingControls: ({ data, onChange }: any) => (
    <div data-testid="spacing-controls">Spacing Controls</div>
  ),
}));

describe('PollBlockInspector - Typography Controls', () => {
  const mockUpdateNode = vi.fn();
  const mockNode = {
    id: 'test-poll-id',
    type: 'pollBlock' as const,
    data: {
      question: 'What is your favorite color?',
      options: [
        { id: 'option1', text: 'Red', votes: 0 },
        { id: 'option2', text: 'Blue', votes: 0 },
      ],
      allowMultiple: false,
      showResults: true,
      totalVotes: 0,
      // Typography properties
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 600,
      color: '#333333',
      textAlign: 'center',
    } as PollBlockData,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useEditorStore as any).mockReturnValue({
      nodes: [mockNode],
      updateNode: mockUpdateNode,
    });
  });

  it('should render typography controls section', () => {
    render(<PollBlockInspector nodeId="test-poll-id" />);

    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByText('Font Family')).toBeInTheDocument();
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('Font Weight')).toBeInTheDocument();
    expect(screen.getByText('Text Color')).toBeInTheDocument();
    expect(screen.getByText('Text Alignment')).toBeInTheDocument();
  });

  it('should display current typography values', () => {
    render(<PollBlockInspector nodeId="test-poll-id" />);

    // Check font size input
    const fontSizeInput = screen.getByDisplayValue('18');
    expect(fontSizeInput).toBeInTheDocument();

    // Check color control
    const colorInput = screen.getByTestId('color-input');
    expect(colorInput).toHaveValue('#333333');
  });

  it('should update font size when changed', () => {
    render(<PollBlockInspector nodeId="test-poll-id" />);

    const fontSizeInput = screen.getByDisplayValue('18');
    fireEvent.change(fontSizeInput, { target: { value: '20' } });

    expect(mockUpdateNode).toHaveBeenCalledWith('test-poll-id', {
      data: expect.objectContaining({
        fontSize: 20,
      }),
    });
  });

  it('should update text color when changed', () => {
    render(<PollBlockInspector nodeId="test-poll-id" />);

    const colorInput = screen.getByTestId('color-input');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });

    expect(mockUpdateNode).toHaveBeenCalledWith('test-poll-id', {
      data: expect.objectContaining({
        color: '#ff0000',
      }),
    });
  });

  it('should render with default values when typography properties are not set', () => {
    const nodeWithoutTypography = {
      ...mockNode,
      data: {
        ...mockNode.data,
        fontSize: undefined,
        fontFamily: undefined,
        fontWeight: undefined,
        color: undefined,
      },
    };

    (useEditorStore as any).mockReturnValue({
      nodes: [nodeWithoutTypography],
      updateNode: mockUpdateNode,
    });

    render(<PollBlockInspector nodeId="test-poll-id" />);

    // Should render with default values
    expect(screen.getByDisplayValue('16')).toBeInTheDocument(); // Default font size
    expect(screen.getByTestId('color-input')).toHaveValue(''); // Default empty color
  });

  it('should return null for non-existent nodes', () => {
    (useEditorStore as any).mockReturnValue({
      nodes: [],
      updateNode: mockUpdateNode,
    });

    const { container } = render(<PollBlockInspector nodeId="non-existent-id" />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null for non-poll nodes', () => {
    const nonPollNode = {
      id: 'test-id',
      type: 'textBlock' as const,
      data: { htmlContent: 'test' },
    };

    (useEditorStore as any).mockReturnValue({
      nodes: [nonPollNode],
      updateNode: mockUpdateNode,
    });

    const { container } = render(<PollBlockInspector nodeId="test-id" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render all poll sections including typography', () => {
    render(<PollBlockInspector nodeId="test-poll-id" />);

    // Check all main sections are present
    expect(screen.getByText('Poll Block')).toBeInTheDocument();
    expect(screen.getByText('Poll Question')).toBeInTheDocument();
    expect(screen.getByText('Poll Options')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByText('Poll Settings')).toBeInTheDocument();
    expect(screen.getByTestId('spacing-controls')).toBeInTheDocument();
  });
});
