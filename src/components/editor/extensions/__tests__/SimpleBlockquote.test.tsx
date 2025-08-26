// ABOUTME: Essential tests for simplified blockquote functionality using TipTap's built-in extension

import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

// Minimal test setup for blockquote functionality
const createEditor = () => {
  return new Editor({
    extensions: [
      StarterKit.configure({
        blockquote: {
          HTMLAttributes: {
            class: 'simple-blockquote',
          },
        },
      }),
    ],
  });
};

describe('Simple Blockquote', () => {
  it('should toggle blockquote formatting', () => {
    const editor = createEditor();
    editor.commands.insertContent('Test content');
    editor.commands.toggleBlockquote();
    
    expect(editor.isActive('blockquote')).toBe(true);
    expect(editor.getHTML()).toContain('<blockquote');
    expect(editor.getHTML()).toContain('simple-blockquote');
    
    editor.destroy();
  });

  it('should preserve formatting within blockquotes', () => {
    const editor = createEditor();
    editor.commands.insertContent('Test content');
    editor.commands.selectAll();
    editor.commands.toggleBlockquote();
    editor.commands.toggleBold();
    
    expect(editor.isActive('blockquote')).toBe(true);
    expect(editor.isActive('bold')).toBe(true);
    expect(editor.getHTML()).toContain('<strong>');
    
    editor.destroy();
  });

  it('should remove blockquote when toggled off', () => {
    const editor = createEditor();
    editor.commands.insertContent('Test content');
    editor.commands.toggleBlockquote();
    expect(editor.isActive('blockquote')).toBe(true);
    
    editor.commands.toggleBlockquote();
    expect(editor.isActive('blockquote')).toBe(false);
    expect(editor.getHTML()).not.toContain('<blockquote');
    
    editor.destroy();
  });
});