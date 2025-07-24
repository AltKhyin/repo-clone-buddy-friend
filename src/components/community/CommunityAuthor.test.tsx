// ABOUTME: Comprehensive tests for CommunityAuthor component ensuring profession display and variant behaviors

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  CommunityAuthor,
  PostAuthor,
  CommentAuthor,
  SidebarAuthor,
  CompactAuthor,
} from './CommunityAuthor';
import type { AuthorInfo } from '@/types/community';

// Mock author data for testing
const mockAuthor: AuthorInfo = {
  id: 'test-user-1',
  full_name: 'Dr. João Silva',
  avatar_url: 'https://example.com/avatar.jpg',
  role: 'practitioner',
  profession: 'Cardiologista',
};

const mockAuthorWithoutProfession: AuthorInfo = {
  id: 'test-user-2',
  full_name: 'Maria Santos',
  avatar_url: 'https://example.com/avatar2.jpg',
  role: 'practitioner',
  profession: null,
};

const mockAuthorMinimal: AuthorInfo = {
  id: 'test-user-3',
  full_name: 'Ana Costa',
  avatar_url: null,
  role: undefined,
  profession: undefined,
};

describe('CommunityAuthor', () => {
  describe('Basic rendering', () => {
    it('should render author name and profession correctly', () => {
      render(<CommunityAuthor author={mockAuthor} />);

      expect(screen.getByText('Dr. João Silva')).toBeInTheDocument();
      expect(screen.getByText('Cardiologista')).toBeInTheDocument();
    });

    it('should render author without profession when profession is null', () => {
      render(<CommunityAuthor author={mockAuthorWithoutProfession} />);

      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.queryByText('Cardiologista')).not.toBeInTheDocument();
    });

    it('should render without profession when profession is null', () => {
      render(<CommunityAuthor author={mockAuthorWithoutProfession} />);

      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.queryByText('Cardiologista')).not.toBeInTheDocument();
    });

    it('should handle null author gracefully', () => {
      render(<CommunityAuthor author={null} />);

      expect(screen.getByText('[Usuário excluído]')).toBeInTheDocument();
    });
  });

  describe('Size variants', () => {
    it('should apply small size classes correctly', () => {
      render(<CommunityAuthor author={mockAuthor} size="sm" />);

      const avatar = screen.getByRole('img', { hidden: true });
      expect(avatar.parentElement).toHaveClass('h-6', 'w-6');
    });

    it('should apply medium size classes correctly', () => {
      render(<CommunityAuthor author={mockAuthor} size="md" />);

      const avatar = screen.getByRole('img', { hidden: true });
      expect(avatar.parentElement).toHaveClass('h-8', 'w-8');
    });

    it('should apply large size classes correctly', () => {
      render(<CommunityAuthor author={mockAuthor} size="lg" />);

      const avatar = screen.getByRole('img', { hidden: true });
      expect(avatar.parentElement).toHaveClass('h-10', 'w-10');
    });
  });

  describe('Layout variants', () => {
    it('should render horizontal layout by default', () => {
      const { container } = render(<CommunityAuthor author={mockAuthor} />);

      // Check for horizontal layout classes
      const authorContainer = container.firstChild;
      expect(authorContainer).toHaveClass('flex', 'items-center');
    });

    it('should render vertical layout when specified', () => {
      const { container } = render(<CommunityAuthor author={mockAuthor} layout="vertical" />);

      // Check for vertical layout classes
      const authorContainer = container.firstChild;
      expect(authorContainer).toHaveClass('flex', 'flex-col', 'items-center', 'text-center');
    });
  });

  describe('Timestamp functionality', () => {
    it('should show timestamp when showTimestamp is true', () => {
      render(<CommunityAuthor author={mockAuthor} showTimestamp={true} timestamp="há 2 horas" />);

      expect(screen.getByText('• há 2 horas')).toBeInTheDocument();
    });

    it('should not show timestamp when showTimestamp is false', () => {
      render(<CommunityAuthor author={mockAuthor} showTimestamp={false} timestamp="há 2 horas" />);

      expect(screen.queryByText('• há 2 horas')).not.toBeInTheDocument();
    });

    it('should show timestamp in vertical layout', () => {
      render(
        <CommunityAuthor
          author={mockAuthor}
          layout="vertical"
          showTimestamp={true}
          timestamp="há 2 horas"
        />
      );

      expect(screen.getByText('há 2 horas')).toBeInTheDocument();
    });
  });

  describe('Avatar functionality', () => {
    it('should show avatar by default', () => {
      render(<CommunityAuthor author={mockAuthor} />);

      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should hide avatar when showAvatar is false', () => {
      render(<CommunityAuthor author={mockAuthor} showAvatar={false} />);

      expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
    });

    it('should generate correct avatar fallback', () => {
      render(<CommunityAuthor author={mockAuthor} />);

      // Should show "DS" for "Dr. João Silva"
      expect(screen.getByText('DS')).toBeInTheDocument();
    });

    it('should handle missing avatar_url gracefully', () => {
      render(<CommunityAuthor author={mockAuthorMinimal} />);

      // Should show "AC" for "Ana Costa"
      expect(screen.getByText('AC')).toBeInTheDocument();
    });
  });

  describe('Variant-specific styling', () => {
    it('should apply post-header variant styling', () => {
      const { container } = render(<CommunityAuthor author={mockAuthor} variant="post-header" />);

      const authorContainer = container.firstChild;
      expect(authorContainer).toHaveClass('flex', 'items-center', 'gap-3');
    });

    it('should apply comment variant styling', () => {
      const { container } = render(<CommunityAuthor author={mockAuthor} variant="comment" />);

      const authorContainer = container.firstChild;
      expect(authorContainer).toHaveClass('flex', 'items-center', 'gap-2');
    });

    it('should apply sidebar variant styling', () => {
      const { container } = render(<CommunityAuthor author={mockAuthor} variant="sidebar" />);

      const authorContainer = container.firstChild;
      expect(authorContainer).toHaveClass(
        'flex',
        'items-center',
        'gap-2',
        'py-1',
        'px-2',
        '-mx-2',
        'rounded',
        'hover:bg-reddit-hover-bg',
        'transition-colors'
      );
    });

    it('should apply compact variant styling', () => {
      const { container } = render(<CommunityAuthor author={mockAuthor} variant="compact" />);

      const authorContainer = container.firstChild;
      expect(authorContainer).toHaveClass('flex', 'items-center', 'gap-1.5');
    });
  });

  describe('Custom className support', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <CommunityAuthor author={mockAuthor} className="custom-class" />
      );

      const authorContainer = container.firstChild;
      expect(authorContainer).toHaveClass('custom-class');
    });
  });
});

describe('Convenience components', () => {
  describe('PostAuthor', () => {
    it('should render with post-header variant', () => {
      const { container } = render(<PostAuthor author={mockAuthor} />);

      const authorContainer = container.firstChild;
      expect(authorContainer).toHaveClass('flex', 'items-center', 'gap-3');
    });
  });

  describe('CommentAuthor', () => {
    it('should render with comment variant', () => {
      const { container } = render(<CommentAuthor author={mockAuthor} />);

      const authorContainer = container.firstChild;
      expect(authorContainer).toHaveClass('flex', 'items-center', 'gap-2');
    });
  });

  describe('SidebarAuthor', () => {
    it('should render with sidebar variant', () => {
      const { container } = render(<SidebarAuthor author={mockAuthor} />);

      const authorContainer = container.firstChild;
      expect(authorContainer).toHaveClass(
        'flex',
        'items-center',
        'gap-2',
        'py-1',
        'px-2',
        '-mx-2',
        'rounded',
        'hover:bg-reddit-hover-bg',
        'transition-colors'
      );
    });
  });

  describe('CompactAuthor', () => {
    it('should render with compact variant', () => {
      const { container } = render(<CompactAuthor author={mockAuthor} />);

      const authorContainer = container.firstChild;
      expect(authorContainer).toHaveClass('flex', 'items-center', 'gap-1.5');
    });
  });
});

describe('Accessibility', () => {
  it('should have proper alt text for avatar image', () => {
    render(<CommunityAuthor author={mockAuthor} />);

    const avatar = screen.getByRole('img', { hidden: true });
    expect(avatar).toHaveAttribute('alt', 'Dr. João Silva');
  });

  it('should handle missing full_name in alt text', () => {
    const authorWithoutName = { ...mockAuthor, full_name: null };
    render(<CommunityAuthor author={authorWithoutName} />);

    const avatar = screen.getByRole('img', { hidden: true });
    expect(avatar).toHaveAttribute('alt', 'User');
  });
});

describe('Edge cases', () => {
  it('should handle very long names gracefully', () => {
    const authorWithLongName = {
      ...mockAuthor,
      full_name: 'Dr. João Carlos Silva Santos Oliveira Ferreira da Costa',
    };

    render(<CommunityAuthor author={authorWithLongName} />);

    expect(
      screen.getByText('Dr. João Carlos Silva Santos Oliveira Ferreira da Costa')
    ).toBeInTheDocument();
  });

  it('should handle very long profession names gracefully', () => {
    const authorWithLongProfession = {
      ...mockAuthor,
      profession:
        'Cardiologista Intervencionista com Especialização em Hemodinâmica e Cardiologia Nuclear',
    };

    render(<CommunityAuthor author={authorWithLongProfession} />);

    expect(
      screen.getByText(
        'Cardiologista Intervencionista com Especialização em Hemodinâmica e Cardiologia Nuclear'
      )
    ).toBeInTheDocument();
  });

  it('should handle empty string profession', () => {
    const authorWithEmptyProfession = {
      ...mockAuthor,
      profession: '',
    };

    render(<CommunityAuthor author={authorWithEmptyProfession} />);

    expect(screen.getByText('Dr. João Silva')).toBeInTheDocument();
    expect(screen.queryByText('')).not.toBeInTheDocument();
  });

  it('should display profession when present', () => {
    render(<CommunityAuthor author={mockAuthor} />);

    expect(screen.getByText('Cardiologista')).toBeInTheDocument();
  });
});
