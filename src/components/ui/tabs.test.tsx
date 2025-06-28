// ABOUTME: Tests for Tabs component ensuring proper navigation and content switching

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import React from 'react';

describe('Tabs Component', () => {
  it('should render basic tabs', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('should switch tabs on click', async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    await user.click(screen.getByText('Tab 2'));

    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('should handle controlled state', async () => {
    const handleValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    await user.click(screen.getByText('Tab 2'));
    expect(handleValueChange).toHaveBeenCalledWith('tab2');
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );

    const tab1 = screen.getByText('Tab 1');
    tab1.focus();

    // Arrow right should move to next tab
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toHaveTextContent('Tab 2');

    // Arrow left should move to previous tab
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toHaveTextContent('Tab 1');
  });

  it('should handle orientation prop', () => {
    render(
      <Tabs defaultValue="tab1" orientation="vertical">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tabsList = screen.getByRole('tablist');
    expect(tabsList).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('should support custom className on root', () => {
    const { container } = render(
      <Tabs defaultValue="tab1" className="custom-tabs">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );

    const tabsRoot = container.firstChild;
    expect(tabsRoot).toHaveClass('custom-tabs');
  });
});

describe('TabsList Component', () => {
  it('should have proper styling', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const tabsList = screen.getByRole('tablist');
    expect(tabsList).toHaveClass(
      'inline-flex',
      'h-10',
      'items-center',
      'justify-center',
      'rounded-md',
      'bg-muted',
      'p-1',
      'text-muted-foreground'
    );
  });

  it('should apply custom className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const tabsList = screen.getByRole('tablist');
    expect(tabsList).toHaveClass('custom-list');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();

    render(
      <Tabs defaultValue="tab1">
        <TabsList ref={ref}>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('TabsTrigger Component', () => {
  it('should have active state styling', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Active Tab</TabsTrigger>
          <TabsTrigger value="tab2">Inactive Tab</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const activeTab = screen.getByText('Active Tab');
    expect(activeTab).toHaveAttribute('data-state', 'active');
    expect(activeTab).toHaveClass(
      'data-[state=active]:bg-background',
      'data-[state=active]:text-foreground',
      'data-[state=active]:shadow-sm'
    );

    const inactiveTab = screen.getByText('Inactive Tab');
    expect(inactiveTab).toHaveAttribute('data-state', 'inactive');
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" disabled>
            Disabled Tab
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const disabledTab = screen.getByText('Disabled Tab');
    expect(disabledTab).toBeDisabled();
    expect(disabledTab).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
  });

  it('should have focus styling', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const tab = screen.getByText('Tab 1');
    expect(tab).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2'
    );
  });

  it('should apply custom className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" className="custom-trigger">
            Custom Tab
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const tab = screen.getByText('Custom Tab');
    expect(tab).toHaveClass('custom-trigger');
  });
});

describe('TabsContent Component', () => {
  it('should only show active content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Content 1')).toBeVisible();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('should have proper styling', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    );

    const content = screen.getByText('Content');
    expect(content).toHaveClass(
      'mt-2',
      'ring-offset-background',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2'
    );
  });

  it('should apply custom className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsContent value="tab1" className="custom-content">
          Custom Content
        </TabsContent>
      </Tabs>
    );

    const content = screen.getByText('Custom Content');
    expect(content).toHaveClass('custom-content');
  });

  it('should handle complex content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsContent value="tab1">
          <h3>Title</h3>
          <p>Paragraph</p>
          <button>Action</button>
        </TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});

describe('Tabs Accessibility', () => {
  it('should have proper ARIA roles', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const activeTab = screen.getByText('Tab 1');
    expect(activeTab).toHaveAttribute('aria-selected', 'true');

    const inactiveTab = screen.getByText('Tab 2');
    expect(inactiveTab).toHaveAttribute('aria-selected', 'false');

    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby');
  });

  it('should handle keyboard navigation properly', async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );

    const firstTab = screen.getByText('Tab 1');
    firstTab.focus();

    // Home key should focus first tab
    await user.keyboard('{Home}');
    expect(document.activeElement).toHaveTextContent('Tab 1');

    // End key should focus last tab
    await user.keyboard('{End}');
    expect(document.activeElement).toHaveTextContent('Tab 3');
  });
});

describe('Tabs Edge Cases', () => {
  it('should handle single tab', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Only Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Only Content</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Only Tab')).toBeInTheDocument();
    expect(screen.getByText('Only Content')).toBeInTheDocument();
  });

  it('should handle many tabs', () => {
    const tabCount = 10;
    const tabs = Array.from({ length: tabCount }, (_, i) => ({
      value: `tab${i}`,
      label: `Tab ${i}`,
      content: `Content ${i}`,
    }));

    render(
      <Tabs defaultValue="tab0">
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    );

    expect(screen.getAllByRole('tab')).toHaveLength(tabCount);
    expect(screen.getByText('Content 0')).toBeInTheDocument();
  });

  it('should handle no default value gracefully', () => {
    render(
      <Tabs>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    // No content should be visible initially
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });
});
