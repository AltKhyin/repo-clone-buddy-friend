// ABOUTME: Tests for Card component and its sub-components ensuring proper layout and composition

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import React from 'react';

describe('Card Component', () => {
  it('should render basic card', () => {
    render(<Card>Card Content</Card>);
    const card = screen.getByText('Card Content');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass(
      'rounded-lg',
      'border',
      'bg-card',
      'text-card-foreground',
      'shadow-sm'
    );
  });

  it('should apply custom className', () => {
    render(<Card className="custom-card">Custom Card</Card>);
    const card = screen.getByText('Custom Card');
    expect(card).toHaveClass('custom-card');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref}>Ref Card</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.textContent).toBe('Ref Card');
  });

  it('should compose with all sub-components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });
});

describe('CardHeader Component', () => {
  it('should render with proper spacing', () => {
    render(<CardHeader>Header Content</CardHeader>);
    const header = screen.getByText('Header Content');
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
  });

  it('should apply custom className', () => {
    render(<CardHeader className="custom-header">Custom Header</CardHeader>);
    const header = screen.getByText('Custom Header');
    expect(header).toHaveClass('custom-header');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardHeader ref={ref}>Ref Header</CardHeader>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardTitle Component', () => {
  it('should render as h3 element', () => {
    render(<CardTitle>Title Text</CardTitle>);
    const title = screen.getByText('Title Text');
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
  });

  it('should apply custom className', () => {
    render(<CardTitle className="custom-title">Custom Title</CardTitle>);
    const title = screen.getByText('Custom Title');
    expect(title).toHaveClass('custom-title');
  });

  it('should handle HTML attributes', () => {
    render(<CardTitle id="card-title-1">Title with ID</CardTitle>);
    const title = screen.getByText('Title with ID');
    expect(title).toHaveAttribute('id', 'card-title-1');
  });
});

describe('CardDescription Component', () => {
  it('should render as p element', () => {
    render(<CardDescription>Description Text</CardDescription>);
    const description = screen.getByText('Description Text');
    expect(description.tagName).toBe('P');
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('should apply custom className', () => {
    render(<CardDescription className="custom-desc">Custom Description</CardDescription>);
    const description = screen.getByText('Custom Description');
    expect(description).toHaveClass('custom-desc');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<CardDescription ref={ref}>Ref Description</CardDescription>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});

describe('CardContent Component', () => {
  it('should render with proper padding', () => {
    render(<CardContent>Content Text</CardContent>);
    const content = screen.getByText('Content Text');
    expect(content).toHaveClass('p-6', 'pt-0');
  });

  it('should apply custom className', () => {
    render(<CardContent className="custom-content">Custom Content</CardContent>);
    const content = screen.getByText('Custom Content');
    expect(content).toHaveClass('custom-content');
  });

  it('should handle complex children', () => {
    render(
      <CardContent>
        <div>First Child</div>
        <div>Second Child</div>
      </CardContent>
    );
    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
  });
});

describe('CardFooter Component', () => {
  it('should render with flex layout', () => {
    render(<CardFooter>Footer Content</CardFooter>);
    const footer = screen.getByText('Footer Content');
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  it('should apply custom className', () => {
    render(<CardFooter className="justify-end">Right Aligned Footer</CardFooter>);
    const footer = screen.getByText('Right Aligned Footer');
    expect(footer).toHaveClass('justify-end');
  });

  it('should handle button groups', () => {
    render(
      <CardFooter>
        <button>Cancel</button>
        <button>Save</button>
      </CardFooter>
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});

describe('Card Composition Patterns', () => {
  it('should work with minimal composition', () => {
    render(
      <Card>
        <CardContent>Just Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Just Content')).toBeInTheDocument();
  });

  it('should work without CardContent wrapper', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Direct Title</CardTitle>
        </CardHeader>
        <div className="p-6">Direct content without CardContent</div>
      </Card>
    );
    expect(screen.getByText('Direct Title')).toBeInTheDocument();
    expect(screen.getByText('Direct content without CardContent')).toBeInTheDocument();
  });

  it('should maintain proper spacing between sections', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    const header = container.querySelector('.p-6');
    const content = container.querySelector('.pt-0');
    expect(header).toBeInTheDocument();
    expect(content).toBeInTheDocument();
  });
});
