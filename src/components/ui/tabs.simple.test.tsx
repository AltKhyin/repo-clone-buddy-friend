// ABOUTME: Simple fast unit tests for Tabs component without performance monitoring

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

// Simple fast tests without performance monitoring overhead
describe('Tabs Component - Simple Fast Tests', () => {
  it('should render tabs list', () => {
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
    expect(screen.getByRole('tab', { name: /tab 1/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tab 2/i })).toBeInTheDocument();
  });

  it('should show first tab content by default', () => {
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

    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('should render without errors', () => {
    expect(() => {
      render(
        <Tabs defaultValue="test">
          <TabsList>
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>
          <TabsContent value="test">Test Content</TabsContent>
        </Tabs>
      );
    }).not.toThrow();
  });
});
