// ABOUTME: Tests for Alert component ensuring proper notification display and accessibility

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';
import React from 'react';

describe('Alert Component', () => {
  it('should render with default variant', () => {
    render(<Alert>Default Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Default Alert');
    expect(alert).toHaveClass('bg-background', 'text-foreground');
  });

  it('should render with destructive variant', () => {
    render(<Alert variant="destructive">Error Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-destructive/50', 'text-destructive');
  });

  it('should have proper ARIA role', () => {
    render(<Alert>Accessible Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('role', 'alert');
  });

  it('should apply custom className', () => {
    render(<Alert className="custom-alert">Custom Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-alert');
  });

  it('should have proper base styling', () => {
    render(<Alert>Styled Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg', 'border', 'p-4');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Alert ref={ref}>Ref Alert</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.textContent).toBe('Ref Alert');
  });

  it('should compose with AlertTitle and AlertDescription', () => {
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>Alert description text</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert description text')).toBeInTheDocument();
  });

  it('should handle icon placement styling', () => {
    render(
      <Alert>
        <svg>Icon</svg>
        <AlertTitle>Title with Icon</AlertTitle>
      </Alert>
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('[&>svg~*]:pl-7', '[&>svg]:absolute');
  });
});

describe('AlertTitle Component', () => {
  it('should render as h5 element', () => {
    render(<AlertTitle>Title Text</AlertTitle>);
    const title = screen.getByText('Title Text');
    expect(title.tagName).toBe('H5');
  });

  it('should have proper styling', () => {
    render(<AlertTitle>Styled Title</AlertTitle>);
    const title = screen.getByText('Styled Title');
    expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight');
  });

  it('should apply custom className', () => {
    render(<AlertTitle className="custom-title">Custom Title</AlertTitle>);
    const title = screen.getByText('Custom Title');
    expect(title).toHaveClass('custom-title');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<AlertTitle ref={ref}>Ref Title</AlertTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe('AlertDescription Component', () => {
  it('should render as div element', () => {
    render(<AlertDescription>Description Text</AlertDescription>);
    const description = screen.getByText('Description Text');
    expect(description.tagName).toBe('DIV');
  });

  it('should have proper styling', () => {
    render(<AlertDescription>Styled Description</AlertDescription>);
    const description = screen.getByText('Styled Description');
    expect(description).toHaveClass('text-sm', '[&_p]:leading-relaxed');
  });

  it('should apply custom className', () => {
    render(<AlertDescription className="custom-desc">Custom Description</AlertDescription>);
    const description = screen.getByText('Custom Description');
    expect(description).toHaveClass('custom-desc');
  });

  it('should handle paragraph children', () => {
    render(
      <AlertDescription>
        <p>First paragraph</p>
        <p>Second paragraph</p>
      </AlertDescription>
    );
    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph')).toBeInTheDocument();
  });
});

describe('Alert Composition Patterns', () => {
  it('should work with icon, title, and description', () => {
    const InfoIcon = () => <svg data-testid="info-icon" />;

    render(
      <Alert>
        <InfoIcon />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>This is an informational alert.</AlertDescription>
      </Alert>
    );

    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('This is an informational alert.')).toBeInTheDocument();
  });

  it('should work with just description', () => {
    render(
      <Alert>
        <AlertDescription>Simple alert message</AlertDescription>
      </Alert>
    );
    expect(screen.getByText('Simple alert message')).toBeInTheDocument();
  });

  it('should handle destructive variant with icon', () => {
    const ErrorIcon = () => <svg data-testid="error-icon" />;

    render(
      <Alert variant="destructive">
        <ErrorIcon />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong!</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('text-destructive');
    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
  });

  it('should handle multiple alerts', () => {
    render(
      <>
        <Alert>
          <AlertTitle>First Alert</AlertTitle>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Second Alert</AlertTitle>
        </Alert>
      </>
    );

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(screen.getByText('First Alert')).toBeInTheDocument();
    expect(screen.getByText('Second Alert')).toBeInTheDocument();
  });

  it('should handle custom content', () => {
    render(
      <Alert>
        <AlertTitle>Custom Content Alert</AlertTitle>
        <AlertDescription>
          <button>Action Button</button>
          <a href="/link">Learn more</a>
        </AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Action Button')).toBeInTheDocument();
    expect(screen.getByText('Learn more')).toBeInTheDocument();
  });
});
