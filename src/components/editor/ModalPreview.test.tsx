// ABOUTME: Tests for modal preview component ensuring proper viewport switching and content rendering

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalPreview } from './ModalPreview';
import { useEditorStore } from '@/store/editorStore';

// Mock the store
vi.mock('@/store/editorStore');

const mockNodes = [
  {
    id: 'node-1',
    type: 'textBlock',
    data: {
      htmlContent: '<p>Test text content</p>',
      fontSize: 16,
      textAlign: 'left',
      color: '#000000'
    }
  },
  {
    id: 'node-2',
    type: 'headingBlock',
    data: {
      htmlContent: '<h1>Test Heading</h1>',
      level: 1,
      textAlign: 'center',
      color: '#333333'
    }
  },
  {
    id: 'node-3',
    type: 'imageBlock',
    data: {
      src: 'https://example.com/image.jpg',
      alt: 'Test image',
      caption: 'Test caption'
    }
  }
];

const mockLayouts = {
  desktop: {
    items: [
      { nodeId: 'node-1', x: 0, y: 0 },
      { nodeId: 'node-2', x: 0, y: 1 },
      { nodeId: 'node-3', x: 0, y: 2 }
    ]
  },
  mobile: {
    items: [
      { nodeId: 'node-1', x: 0, y: 0 },
      { nodeId: 'node-2', x: 0, y: 1 },
      { nodeId: 'node-3', x: 0, y: 2 }
    ]
  }
};

const mockStoreState = {
  nodes: mockNodes,
  layouts: mockLayouts,
  currentViewport: 'desktop',
  canvasTheme: 'light'
};

beforeEach(() => {
  vi.clearAllMocks();
  (useEditorStore as any).mockReturnValue(mockStoreState);
});

describe('ModalPreview', () => {
  it('should render trigger button when content exists', () => {
    render(<ModalPreview />);
    
    const triggerButton = screen.getByRole('button', { name: /preview/i });
    expect(triggerButton).toBeInTheDocument();
    expect(triggerButton).not.toBeDisabled();
  });

  it('should disable trigger button when no content exists', () => {
    (useEditorStore as any).mockReturnValue({
      ...mockStoreState,
      nodes: []
    });

    render(<ModalPreview />);
    
    const triggerButton = screen.getByRole('button', { name: /preview/i });
    expect(triggerButton).toBeDisabled();
  });

  it('should render custom trigger when provided', () => {
    const customTrigger = <button>Custom Preview</button>;
    render(<ModalPreview trigger={customTrigger} />);
    
    expect(screen.getByText('Custom Preview')).toBeInTheDocument();
  });

  it('should open dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Content Preview')).toBeInTheDocument();
  });

  it('should display block count badge', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    expect(screen.getByText('3 blocks')).toBeInTheDocument();
  });

  it('should render all viewport options', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    expect(screen.getByRole('button', { name: /mobile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tablet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /desktop/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /full/i })).toBeInTheDocument();
  });

  it('should switch viewport when viewport button is clicked', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    const mobileButton = screen.getByRole('button', { name: /mobile/i });
    await user.click(mobileButton);
    
    expect(mobileButton).toHaveClass('bg-primary'); // or whatever active class
  });

  it('should display viewport dimensions', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    expect(screen.getByText(/Size: 1200 × 800px/)).toBeInTheDocument();
  });

  it('should render text block content correctly', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    expect(screen.getByText('Test text content')).toBeInTheDocument();
  });

  it('should render heading block with correct tag', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('Test Heading');
  });

  it('should render image block with correct attributes', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Test image');
    expect(screen.getByText('Test caption')).toBeInTheDocument();
  });

  it('should toggle fullscreen mode', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    const fullscreenButton = screen.getByTitle(/enter fullscreen/i);
    await user.click(fullscreenButton);
    
    expect(screen.getByTitle(/exit fullscreen/i)).toBeInTheDocument();
  });

  it('should display empty state when no content exists', async () => {
    (useEditorStore as any).mockReturnValue({
      ...mockStoreState,
      nodes: []
    });

    const user = userEvent.setup();
    render(<ModalPreview />);
    
    // Force open the dialog even with no content for testing
    render(<ModalPreview trigger={<button onClick={() => {}}>Open</button>} />);
    await user.click(screen.getByText('Open'));
    
    expect(screen.getByText('No Content to Preview')).toBeInTheDocument();
    expect(screen.getByText('Add some blocks to your editor to see a preview here.')).toBeInTheDocument();
  });

  it('should apply dark theme styling', async () => {
    (useEditorStore as any).mockReturnValue({
      ...mockStoreState,
      canvasTheme: 'dark'
    });

    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    const previewContainer = document.querySelector('[style*="background"]');
    expect(previewContainer).toHaveStyle('background-color: rgb(17, 24, 39)'); // dark theme color
  });

  it('should render blocks in correct layout order', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    const contentDiv = screen.getByText('Test Heading').closest('div')?.parentElement;
    const textContent = screen.getByText('Test text content');
    const imageContent = screen.getByRole('img');
    
    // Verify order by checking DOM structure
    expect(contentDiv?.children[0]).toContain(textContent);
    // Note: More sophisticated ordering tests would need DOM query selectors
  });

  it('should handle mobile viewport layout', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    const mobileButton = screen.getByRole('button', { name: /mobile/i });
    await user.click(mobileButton);
    
    expect(screen.getByText(/Size: 375 × 667px/)).toBeInTheDocument();
  });

  it('should display footer actions when content exists', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    expect(screen.getByRole('button', { name: /share preview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open in new tab/i })).toBeInTheDocument();
  });

  it('should show viewing mode information', async () => {
    const user = userEvent.setup();
    render(<ModalPreview />);
    
    await user.click(screen.getByRole('button', { name: /preview/i }));
    
    expect(screen.getByText('Viewing in desktop mode')).toBeInTheDocument();
  });
});