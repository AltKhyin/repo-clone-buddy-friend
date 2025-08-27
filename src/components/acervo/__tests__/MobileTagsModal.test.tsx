// ABOUTME: Essential tests for MobileTagsModal focusing on inline expansion behavior and mobile-optimized touch targets

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileTagsModal from '../MobileTagsModal';

// Mock data matching AcervoTag interface
const mockTags = [
  { id: 1, tag_name: 'Cardiologia', parent_id: null, created_at: '2024-01-01' },
  { id: 2, tag_name: 'Estatinas', parent_id: 1, created_at: '2024-01-01' },
  { id: 3, tag_name: 'Hipertensão', parent_id: 1, created_at: '2024-01-01' },
  { id: 4, tag_name: 'Dermatologia', parent_id: null, created_at: '2024-01-01' },
  { id: 5, tag_name: 'Acne', parent_id: 4, created_at: '2024-01-01' },
];

describe('MobileTagsModal', () => {
  const mockOnTagSelect = vi.fn();

  beforeEach(() => {
    mockOnTagSelect.mockClear();
  });

  it('displays dynamic labeling with separate count badge (mobile-optimized)', () => {
    // Test initial state with no selections
    const { rerender } = render(
      <MobileTagsModal
        allTags={mockTags}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    );

    expect(screen.getByText('Ordenar por assunto')).toBeInTheDocument();

    // Test with selections
    rerender(
      <MobileTagsModal
        allTags={mockTags}
        selectedTags={[1, 4]}
        onTagSelect={mockOnTagSelect}
      />
    );

    expect(screen.getByText('Ordenando por assunto')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Badge count
  });

  it('shows only subtags for selected parents when expanded (conditional visibility)', async () => {
    render(
      <MobileTagsModal
        allTags={mockTags}
        selectedTags={[1]} // Only Cardiologia selected
        onTagSelect={mockOnTagSelect}
      />
    );

    // Initially collapsed - expandable section should be visually hidden
    const expandableSection = document.querySelector('.transition-all.duration-300.ease-in-out');
    expect(expandableSection).toHaveClass('max-h-0', 'opacity-0');
    
    // Expand the section
    const triggerButton = screen.getByText('Ordenando por assunto');
    fireEvent.click(triggerButton);

    // After expansion, section should be visible
    expect(expandableSection).toHaveClass('max-h-[500px]', 'opacity-100');

    // Should show Cardiologia (selected parent) and its subtags
    expect(screen.getByText('Cardiologia')).toBeInTheDocument();
    expect(screen.getByText('Estatinas')).toBeInTheDocument();
    expect(screen.getByText('Hipertensão')).toBeInTheDocument();

    // Should show unselected parent (Dermatologia) but NOT its subtags
    expect(screen.getByText('Dermatologia')).toBeInTheDocument();
    expect(screen.queryByText('Acne')).not.toBeInTheDocument();
  });

  it('displays inline expansion with mobile-optimized styling', () => {
    render(
      <MobileTagsModal
        allTags={mockTags}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    );

    const buttonContainer = screen.getByText('Ordenar por assunto').closest('div');
    expect(buttonContainer).toHaveClass('flex', 'justify-center', 'mb-4', 'px-4');
    
    // Verify button has mobile-friendly sizing and chevron
    const button = screen.getByText('Ordenar por assunto');
    expect(button).toHaveClass('min-h-[48px]');
  });

  it('handles inline expansion and tag selection correctly', async () => {
    render(
      <MobileTagsModal
        allTags={mockTags}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    );

    // Expand the section
    const triggerButton = screen.getByText('Ordenar por assunto');
    fireEvent.click(triggerButton);

    // Click on a parent tag
    const cardiologiaButton = screen.getByText('Cardiologia');
    fireEvent.click(cardiologiaButton);

    expect(mockOnTagSelect).toHaveBeenCalledWith(1);
  });

  it('collapses and expands smoothly with proper animation classes', () => {
    render(
      <MobileTagsModal
        allTags={mockTags}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    );

    const triggerButton = screen.getByText('Ordenar por assunto');
    
    // Find the expandable section
    const expandableSection = document.querySelector('.transition-all.duration-300.ease-in-out');
    expect(expandableSection).toBeInTheDocument();
    
    // Initially collapsed
    expect(expandableSection).toHaveClass('max-h-0', 'opacity-0');
    
    // Expand
    fireEvent.click(triggerButton);
    expect(expandableSection).toHaveClass('max-h-[500px]', 'opacity-100');
  });
});