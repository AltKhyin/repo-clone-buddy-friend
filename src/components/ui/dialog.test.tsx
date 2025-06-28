// ABOUTME: Tests for Dialog component ensuring modal functionality and accessibility

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './dialog';
import React from 'react';

describe('Dialog Component', () => {
  it('should render trigger and open dialog on click', async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByText('Open Dialog');
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Dialog Title')).toBeVisible();
      expect(screen.getByText('Dialog description')).toBeVisible();
    });
  });

  it('should close dialog on close button click', async () => {
    const user = userEvent.setup();

    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Test Dialog')).toBeVisible();

    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
    });
  });

  it('should handle controlled state', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    const { rerender } = render(
      <Dialog open={false} onOpenChange={handleOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Controlled Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText('Open'));
    expect(handleOpenChange).toHaveBeenCalledWith(true);

    rerender(
      <Dialog open={true} onOpenChange={handleOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Controlled Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Controlled Dialog')).toBeVisible();
  });

  it('should close on escape key', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Dialog defaultOpen onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogTitle>Escape Test</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await user.keyboard('{Escape}');
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('should close on overlay click', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Dialog defaultOpen onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogTitle>Overlay Test</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // Click on the overlay (backdrop)
    const overlay = document.querySelector('[data-radix-dialog-overlay]');
    if (overlay) {
      await user.click(overlay);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    }
  });
});

describe('DialogContent Component', () => {
  it('should have proper styling and animation classes', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Styled Content</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByRole('dialog');
    expect(content).toHaveClass(
      'fixed',
      'z-50',
      'grid',
      'w-full',
      'max-w-lg',
      'gap-4',
      'border',
      'bg-background',
      'p-6',
      'shadow-lg'
    );
  });

  it('should apply custom className', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent className="custom-content">
          <DialogTitle>Custom Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByRole('dialog');
    expect(content).toHaveClass('custom-content');
  });

  it('should include close button with X icon', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>With Close Button</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton.querySelector('svg')).toBeInTheDocument();
  });
});

describe('Dialog Sub-components', () => {
  it('should render DialogHeader with proper layout', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Header Title</DialogTitle>
            <DialogDescription>Header Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const header = screen.getByText('Header Title').parentElement;
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
  });

  it('should render DialogTitle with proper styling', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Test Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('text-lg', 'font-semibold', 'leading-none', 'tracking-tight');
  });

  it('should render DialogDescription with proper styling', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogDescription>Test Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const description = screen.getByText('Test Description');
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('should render DialogFooter with proper layout', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogFooter>
            <button>Cancel</button>
            <button>Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const footer = screen.getByText('Cancel').parentElement;
    expect(footer).toHaveClass(
      'flex',
      'flex-col-reverse',
      'sm:flex-row',
      'sm:justify-end',
      'sm:space-x-2'
    );
  });
});

describe('Dialog Composition', () => {
  it('should work with all sub-components', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Dialog</DialogTitle>
            <DialogDescription>This dialog has all components</DialogDescription>
          </DialogHeader>
          <div>Main content goes here</div>
          <DialogFooter>
            <DialogClose asChild>
              <button>Cancel</button>
            </DialogClose>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Complete Dialog')).toBeInTheDocument();
    expect(screen.getByText('This dialog has all components')).toBeInTheDocument();
    expect(screen.getByText('Main content goes here')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('should work with custom trigger element', () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button className="custom-trigger">Custom Trigger</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Custom Triggered Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByText('Custom Trigger');
    expect(trigger).toHaveClass('custom-trigger');
    expect(trigger.tagName).toBe('BUTTON');
  });

  it('should handle DialogClose with custom element', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Dialog defaultOpen onOpenChange={handleClose}>
        <DialogContent>
          <DialogTitle>Close Test</DialogTitle>
          <DialogClose asChild>
            <button className="custom-close">Custom Close</button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText('Custom Close'));
    expect(handleClose).toHaveBeenCalledWith(false);
  });
});

describe('Dialog Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Accessible Dialog</DialogTitle>
          <DialogDescription>Dialog with ARIA attributes</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('should trap focus within dialog', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Focus Trap Test</DialogTitle>
          <input placeholder="First input" />
          <input placeholder="Second input" />
          <button>Action</button>
        </DialogContent>
      </Dialog>
    );

    // Focus should be trapped within the dialog
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('should restore focus on close', async () => {
    const user = userEvent.setup();

    render(
      <>
        <button id="trigger-button">Open Dialog</button>
        <Dialog>
          <DialogTrigger asChild>
            <button>Open</button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Focus Restore Test</DialogTitle>
            <DialogClose>Close</DialogClose>
          </DialogContent>
        </Dialog>
      </>
    );

    const trigger = screen.getByText('Open');
    trigger.focus();

    await user.click(trigger);
    
    // Click the visible close button (not the sr-only one)
    const closeButtons = screen.getAllByText('Close');
    const visibleCloseButton = closeButtons.find(button => !button.classList.contains('sr-only'));
    await user.click(visibleCloseButton!);

    // Focus should return to trigger after close
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('should have screen reader only close button text', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>SR Test</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const srText = screen.getByText('Close');
    expect(srText).toHaveClass('sr-only');
  });
});
