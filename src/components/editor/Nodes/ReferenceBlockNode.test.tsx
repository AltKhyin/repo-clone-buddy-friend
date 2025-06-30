// ABOUTME: Comprehensive test suite for ReferenceBlockNode with APA formatting validation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReferenceBlockNode } from './ReferenceBlockNode';
import { useEditorStore } from '@/store/editorStore';

// Mock the editorStore
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn()
}));

// Mock React Flow components
vi.mock('@xyflow/react', () => ({
  NodeResizer: ({ children, ...props }: any) => <div data-testid="node-resizer" {...props}>{children}</div>,
}));

// Mock UnifiedNodeResizer
vi.mock('../components/UnifiedNodeResizer', () => ({
  UnifiedNodeResizer: ({ isVisible, nodeType }: any) => (
    <div data-testid="unified-node-resizer" data-visible={isVisible} data-node-type={nodeType} />
  )
}));

const mockUseEditorStore = useEditorStore as any;

const createMockReferenceData = (overrides = {}) => ({
  authors: 'Smith, J. A., & Johnson, M. B.',
  year: 2023,
  title: 'A comprehensive study of testing methodologies',
  source: 'Journal of Software Engineering',
  doi: '10.1234/test.doi',
  url: undefined,
  formatted: undefined,
  ...overrides
});

const createMockStore = (overrides = {}) => ({
  updateNode: vi.fn(),
  selectNode: vi.fn(),
  canvasTheme: 'light',
  ...overrides
});

describe('ReferenceBlockNode', () => {
  beforeEach(() => {
    mockUseEditorStore.mockReturnValue(createMockStore());
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render reference block with complete citation data', () => {
      const data = createMockReferenceData();
      
      render(
        <ReferenceBlockNode
          id="test-reference-1"
          data={data}
          selected={false}
        />
      );

      expect(screen.getByText(/APA Citation/)).toBeInTheDocument();
      expect(screen.getByText(/Smith, J. A., & Johnson, M. B. \(2023\)/)).toBeInTheDocument();
      expect(screen.getByText('Year:')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
      expect(screen.getByText('DOI:')).toBeInTheDocument();
      expect(screen.getByText('10.1234/test.doi')).toBeInTheDocument();
    });

    it('should render incomplete citation warning when fields are missing', () => {
      const data = createMockReferenceData({
        authors: '',
        title: ''
      });
      
      render(
        <ReferenceBlockNode
          id="test-reference-2"
          data={data}
          selected={false}
        />
      );

      expect(screen.getByText(/APA Citation \(Incomplete\)/)).toBeInTheDocument();
      expect(screen.getByText(/Citation incomplete - please fill all required fields/)).toBeInTheDocument();
    });

    it('should render with URL when DOI is not available', () => {
      const data = createMockReferenceData({
        doi: undefined,
        url: 'https://example.com/article'
      });
      
      render(
        <ReferenceBlockNode
          id="test-reference-3"
          data={data}
          selected={false}
        />
      );

      expect(screen.getByText(/https:\/\/example\.com\/article/)).toBeInTheDocument();
    });

    it('should show selection indicator when selected', () => {
      const data = createMockReferenceData();
      
      render(
        <ReferenceBlockNode
          id="test-reference-4"
          data={data}
          selected={true}
        />
      );

      expect(screen.getByText('Reference Selected')).toBeInTheDocument();
    });
  });

  describe('APA Formatting', () => {
    it('should format complete citation correctly', () => {
      const data = createMockReferenceData();
      
      render(
        <ReferenceBlockNode
          id="test-reference-5"
          data={data}
          selected={false}
        />
      );

      expect(screen.getByText(/Smith, J. A., & Johnson, M. B. \(2023\)\. A comprehensive study of testing methodologies\. Journal of Software Engineering\. https:\/\/doi\.org\/10\.1234\/test\.doi/)).toBeInTheDocument();
    });

    it('should use custom formatted citation when provided', () => {
      const data = createMockReferenceData({
        formatted: 'Custom formatted citation override'
      });
      
      render(
        <ReferenceBlockNode
          id="test-reference-6"
          data={data}
          selected={false}
        />
      );

      expect(screen.getByText('Custom formatted citation override')).toBeInTheDocument();
    });

    it('should handle missing DOI and URL gracefully', () => {
      const data = createMockReferenceData({
        doi: undefined,
        url: undefined
      });
      
      render(
        <ReferenceBlockNode
          id="test-reference-7"
          data={data}
          selected={false}
        />
      );

      // Should still show the basic citation without DOI/URL
      expect(screen.getByText(/Smith, J. A., & Johnson, M. B. \(2023\)\. A comprehensive study of testing methodologies\. Journal of Software Engineering$/)).toBeInTheDocument();
    });
  });

  describe('Theme Adaptation', () => {
    it('should apply dark theme styling', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({
        canvasTheme: 'dark'
      }));

      const data = createMockReferenceData();
      
      const { container } = render(
        <ReferenceBlockNode
          id="test-reference-8"
          data={data}
          selected={false}
        />
      );

      // Use class-based selection instead of DOM navigation
      const citationBlock = container.querySelector('.bg-gradient-to-r');
      expect(citationBlock).toBeInTheDocument();
      expect(citationBlock).toHaveClass('from-slate-800');
      expect(citationBlock).toHaveClass('to-slate-700');
      expect(citationBlock).toHaveClass('text-slate-100');
    });

    it('should apply light theme styling by default', () => {
      const data = createMockReferenceData();
      
      const { container } = render(
        <ReferenceBlockNode
          id="test-reference-9"
          data={data}
          selected={false}
        />
      );

      // Use class-based selection instead of DOM navigation
      const citationBlock = container.querySelector('.bg-gradient-to-r');
      expect(citationBlock).toBeInTheDocument();
      expect(citationBlock).toHaveClass('from-slate-50');
      expect(citationBlock).toHaveClass('to-white');
      expect(citationBlock).toHaveClass('text-slate-900');
    });
  });

  describe('Interaction', () => {
    it('should call selectNode when clicked', () => {
      const mockSelectNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore());
      
      // Mock the getState function to return our mock
      useEditorStore.getState = vi.fn().mockReturnValue({
        selectNode: mockSelectNode
      });

      const data = createMockReferenceData();
      
      render(
        <ReferenceBlockNode
          id="test-reference-10"
          data={data}
          selected={false}
        />
      );

      const citationBlock = screen.getByText(/Smith, J. A., & Johnson, M. B./);
      citationBlock.click();

      expect(mockSelectNode).toHaveBeenCalledWith('test-reference-10');
    });
  });

  describe('Completion Status', () => {
    it('should show green indicator for complete citations', () => {
      const data = createMockReferenceData();
      
      const { container } = render(
        <ReferenceBlockNode
          id="test-reference-11"
          data={data}
          selected={false}
        />
      );

      const indicator = container.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should show yellow indicator for incomplete citations', () => {
      const data = createMockReferenceData({
        authors: ''
      });
      
      const { container } = render(
        <ReferenceBlockNode
          id="test-reference-12"
          data={data}
          selected={false}
        />
      );

      const indicator = container.querySelector('.bg-yellow-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should apply warning styling for incomplete citations', () => {
      const data = createMockReferenceData({
        source: ''
      });
      
      const { container } = render(
        <ReferenceBlockNode
          id="test-reference-13"
          data={data}
          selected={false}
        />
      );

      // Use class-based selection for incomplete citations
      const citationBlock = container.querySelector('.bg-gradient-to-r');
      expect(citationBlock).toBeInTheDocument();
      expect(citationBlock).toHaveClass('border-yellow-400');
      expect(citationBlock).toHaveClass('bg-yellow-50');
    });
  });

  describe('UnifiedNodeResizer Integration', () => {
    it('should render UnifiedNodeResizer with correct props', () => {
      const data = createMockReferenceData();
      
      render(
        <ReferenceBlockNode
          id="test-reference-14"
          data={data}
          selected={true}
        />
      );

      const resizer = screen.getByTestId('unified-node-resizer');
      expect(resizer).toHaveAttribute('data-visible', 'true');
      expect(resizer).toHaveAttribute('data-node-type', 'referenceBlock');
    });

    it('should hide resizer when not selected', () => {
      const data = createMockReferenceData();
      
      render(
        <ReferenceBlockNode
          id="test-reference-15"
          data={data}
          selected={false}
        />
      );

      const resizer = screen.getByTestId('unified-node-resizer');
      expect(resizer).toHaveAttribute('data-visible', 'false');
    });
  });
});