# Testing Blueprint: Implementation Guide

**Blueprint ID:** 11  
**Version:** 1.0.0  
**Date:** June 28, 2025  
**Purpose:** Implementation-focused testing guidelines, patterns, and templates for EVIDENS development

---

## 📋 Quick Navigation

1. [Testing Templates](#testing-templates)
2. [Component Testing Patterns](#component-testing-patterns)
3. [Hook Testing Patterns](#hook-testing-patterns)
4. [Edge Function Testing](#edge-function-testing)
5. [Mock Strategies](#mock-strategies)
6. [Error Scenarios](#error-scenarios)
7. [Performance Testing](#performance-testing)
8. [Accessibility Testing](#accessibility-testing)
9. [Color System Testing](#color-system-testing)

---

## Testing Templates

### Component Test Template

```typescript
// ABOUTME: Tests for ComponentName ensuring [specific behavior description]

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test-utils'
import { createMockData } from '../../test-utils/test-data-factories'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. HAPPY PATH TESTING
  it('should render with correct data', () => {
    const mockData = createMockData({ title: 'Test Title' })
    renderWithProviders(<ComponentName data={mockData} />)

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeAccessible()
  })

  // 2. LOADING STATE TESTING
  it('should show loading skeleton when data is loading', () => {
    renderWithProviders(<ComponentName data={null} isLoading={true} />)

    const skeleton = screen.getByTestId('loading-skeleton')
    expect(skeleton).toBeInLoadingState()
    expect(skeleton).toHaveClass('animate-pulse')
  })

  // 3. ERROR STATE TESTING
  it('should show error state gracefully', () => {
    const error = new Error('Failed to load data')
    renderWithProviders(<ComponentName error={error} />)

    expect(screen.getByText('Error loading data')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  // 4. EMPTY STATE TESTING
  it('should handle empty data gracefully', () => {
    renderWithProviders(<ComponentName data={[]} />)

    expect(screen.getByText(/no items found/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create new/i })).toBeInTheDocument()
  })

  // 5. INTERACTION TESTING
  it('should handle user interactions correctly', async () => {
    const mockOnClick = vi.fn()
    renderWithProviders(<ComponentName onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    await fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledOnce()
    expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object))
  })

  // 6. RESPONSIVE TESTING
  it('should be responsive and accessible', () => {
    const { container } = renderWithProviders(<ComponentName />)

    expect(container.firstChild).toBeResponsive()
    expect(container.firstChild).toBeAccessible()
  })

  // 7. CONDITIONAL RENDERING
  it('should conditionally render based on props', () => {
    const { rerender } = renderWithProviders(<ComponentName showDetails={false} />)

    expect(screen.queryByTestId('details-section')).not.toBeInTheDocument()

    rerender(<ComponentName showDetails={true} />)
    expect(screen.getByTestId('details-section')).toBeInTheDocument()
  })
})
```

### Hook Test Template

```typescript
// ABOUTME: Tests for useCustomHook ensuring proper data fetching and state management

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '../../src/test-utils';
import { useCustomHook } from './useCustomHook';
import { createMockData } from '../../src/test-utils/test-data-factories';

// Mock dependencies
vi.mock('../../src/lib/supabase-functions', () => ({
  invokeFunctionGet: vi.fn(),
}));

describe('useCustomHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. INITIAL STATE TESTING
  it('should return loading state initially', () => {
    const { result } = renderHookWithQuery(() => useCustomHook());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);
    expect(result.current).toBeValidQueryResult();
  });

  // 2. SUCCESS SCENARIO TESTING
  it('should fetch data successfully', async () => {
    const mockData = createMockData();
    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions');
    vi.mocked(invokeFunctionGet).mockResolvedValue(mockData);

    const { result } = renderHookWithQuery(() => useCustomHook());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  // 3. ERROR SCENARIO TESTING
  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network error occurred');
    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions');
    vi.mocked(invokeFunctionGet).mockRejectedValue(networkError);

    const { result } = renderHookWithQuery(() => useCustomHook());

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 }
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(networkError);
  });

  // 4. RETRY LOGIC TESTING
  it('should retry failed requests according to configuration', async () => {
    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions');

    vi.mocked(invokeFunctionGet)
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce(createMockData());

    const { result } = renderHookWithQuery(() => useCustomHook());

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 5000 }
    );

    expect(invokeFunctionGet).toHaveBeenCalledTimes(2);
  });

  // 5. CACHE TESTING
  it('should use correct cache configuration', async () => {
    const { result, queryClient } = renderHookWithQuery(() => useCustomHook());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const query = queryClient.getQueryCache().find({
      queryKey: ['custom-data'],
    });

    expect(query?.options.staleTime).toBe(5 * 60 * 1000); // 5 minutes
    expect(query?.options.gcTime).toBe(10 * 60 * 1000); // 10 minutes
  });
});
```

---

## Component Testing Patterns

### 1. UI Components (Primitives)

**Testing Focus**: Styling, accessibility, variants, interactions

```typescript
describe('Button Component', () => {
  it('should render all variants correctly', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']

    variants.forEach(variant => {
      const { container } = renderMinimal(<Button variant={variant}>Test</Button>)
      expect(container.firstChild).toHaveClass(`variant-${variant}`)
    })
  })

  it('should handle disabled state properly', () => {
    renderMinimal(<Button disabled>Disabled Button</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })

  it('should support custom className and styling', () => {
    renderMinimal(<Button className="custom-class">Styled Button</Button>)

    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })
})
```

### 2. Feature Components (Modules)

**Testing Focus**: Business logic, data handling, user workflows

```typescript
describe('ReviewCard Component', () => {
  it('should display review data correctly', () => {
    const mockReview = createMockReview({
      title: 'Test Review',
      author: 'Dr. Smith',
      published_at: '2025-06-28T10:00:00Z',
      view_count: 1250
    })

    renderWithProviders(<ReviewCard review={mockReview} />)

    expect(screen.getByText('Test Review')).toBeInTheDocument()
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
    expect(screen.getByText('1.3k views')).toBeInTheDocument()
  })

  it('should handle navigation correctly', async () => {
    const mockReview = createMockReview({ id: 123 })
    const mockNavigate = vi.fn()

    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    renderWithProviders(<ReviewCard review={mockReview} />)

    await fireEvent.click(screen.getByRole('article'))

    expect(mockNavigate).toHaveBeenCalledWith('/reviews/123')
  })
})
```

### 3. Page Components (Containers)

**Testing Focus**: Routing, data orchestration, layout

```typescript
describe('CommunityPage', () => {
  it('should load and display community data', async () => {
    const mockData = createMockCommunityPageData()
    mockCommunityPageQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false
    })

    renderWithProviders(<CommunityPage />)

    await waitFor(() => {
      expect(screen.getByText('Community Discussion')).toBeInTheDocument()
    })

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('should handle routing with parameters', () => {
    const mockParams = { categoryId: 'evidencia-cientifica' }
    vi.mocked(useParams).mockReturnValue(mockParams)

    renderWithProviders(<CommunityPage />)

    expect(mockUseCommunityPageQuery).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'evidencia-cientifica' })
    )
  })
})
```

---

## Hook Testing Patterns

### 1. Authentication-Dependent Hooks

```typescript
import { useAuthStore } from '../../src/store/auth';

vi.mock('../../src/store/auth');

describe('useUserProfileQuery', () => {
  const mockUseAuthStore = vi.mocked(useAuthStore);

  beforeEach(() => {
    // Default: authenticated user
    mockUseAuthStore.mockReturnValue({
      session: { access_token: 'mock-token' },
      user: { id: 'test-user-id', email: 'test@example.com' },
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    } as any);
  });

  it('should not fetch when user is not authenticated', async () => {
    mockUseAuthStore.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    } as any);

    const { result } = renderHookWithQuery(() => useUserProfileQuery());

    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });

  it('should handle user ID changes correctly', async () => {
    const { result, rerender } = renderHookWithQuery(() => useUserProfileQuery());

    // Change user
    mockUseAuthStore.mockReturnValue({
      user: { id: 'new-user-id' },
      session: { access_token: 'token' },
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    } as any);

    rerender();

    // Should trigger new query for new user
    expect(result.current).toBeValidQueryResult();
  });
});
```

### 2. Infinite Query Hooks

```typescript
describe('useCommunityPageQuery', () => {
  it('should implement infinite scrolling correctly', async () => {
    const mockPages = [
      createMockCommunityPageData({ posts: [1, 2, 3] }),
      createMockCommunityPageData({ posts: [4, 5, 6] }),
    ];

    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions');
    vi.mocked(invokeFunctionGet)
      .mockResolvedValueOnce(mockPages[0])
      .mockResolvedValueOnce(mockPages[1]);

    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Test pagination
    await result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.data?.items).toHaveLength(6);
    });

    expect(invokeFunctionGet).toHaveBeenCalledTimes(2);
  });
});
```

### 3. Mutation Hooks

```typescript
describe('useCreatePostMutation', () => {
  it('should create post and invalidate queries', async () => {
    const mockPost = createMockCommunityPost();
    const { invokeFunctionPost } = await import('../../src/lib/supabase-functions');
    vi.mocked(invokeFunctionPost).mockResolvedValue(mockPost);

    const { result, queryClient } = renderHookWithQuery(() => useCreatePostMutation());
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await result.current.mutateAsync({
      title: 'New Post',
      content: 'Post content',
      category: 'discussion',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['community'],
    });
  });

  it('should handle validation errors', async () => {
    const validationError = new Error('Title is required');
    const { invokeFunctionPost } = await import('../../src/lib/supabase-functions');
    vi.mocked(invokeFunctionPost).mockRejectedValue(validationError);

    const { result } = renderHookWithQuery(() => useCreatePostMutation());

    await expect(result.current.mutateAsync({})).rejects.toThrow('Title is required');
  });
});
```

---

## Edge Function Testing

### 1. Integration Testing with Supabase MCP

```typescript
describe('Edge Function Integration', () => {
  it('should deploy and test function correctly', async () => {
    const functionCode = `
      import { corsHeaders } from '../_shared/cors.ts'
      
      Deno.serve(async (req) => {
        if (req.method === 'OPTIONS') {
          return new Response('ok', { headers: corsHeaders })
        }
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      })
    `;

    // Deploy function
    await mcp__supabase__deploy_edge_function({
      name: 'test-function',
      files: [
        {
          name: 'index.ts',
          content: functionCode,
        },
      ],
    });

    // Test immediately
    const projectUrl = await mcp__supabase__get_project_url();
    const anonKey = await mcp__supabase__get_anon_key();

    const response = await fetch(`${projectUrl}/functions/v1/test-function`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'data' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Check logs within 60 seconds
    const logs = await mcp__supabase__get_logs({ service: 'edge-function' });
    expect(logs).toContain('test-function');
  });
});
```

### 2. Edge Function Unit Testing

```typescript
describe('Edge Function Logic', () => {
  it('should handle CORS preflight correctly', async () => {
    const request = new Request('http://localhost', { method: 'OPTIONS' });
    const response = await handleFunction(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should validate authentication', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid-token' },
    });

    const response = await handleFunction(request);
    expect(response.status).toBe(401);
  });
});
```

---

## Mock Strategies

### 1. Supabase Client Mocking

```typescript
// Complete Supabase client mock
const createMockSupabaseClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: createMockUserProfile(),
      error: null,
    }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
  functions: {
    invoke: vi.fn().mockResolvedValue({
      data: createMockData(),
      error: null,
    }),
  },
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: createMockUser() },
      error: null,
    }),
  },
});
```

### 2. Router Mocking

```typescript
// React Router mocking
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    })),
    useParams: vi.fn(() => ({})),
  };
});
```

### 3. Browser API Mocking

```typescript
// Global browser API mocks in test-setup.ts
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});
```

---

## Error Scenarios

### 1. Network Error Testing

```typescript
describe('Network Error Handling', () => {
  it('should handle network timeouts', async () => {
    const timeoutError = new Error('Request timeout')
    timeoutError.name = 'TimeoutError'

    vi.mocked(fetch).mockRejectedValue(timeoutError)

    const { result } = renderHookWithQuery(() => useDataFetching())

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.name).toBe('TimeoutError')
  })

  it('should handle offline scenarios', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    })

    renderWithProviders(<NetworkAwareComponent />)

    expect(screen.getByText(/you are offline/i)).toBeInTheDocument()
  })
})
```

### 2. Authentication Error Testing

```typescript
describe('Authentication Error Handling', () => {
  it('should handle expired tokens', async () => {
    const authError = new Error('JWT expired');
    authError.name = 'AuthError';

    vi.mocked(supabase.from).mockRejectedValue(authError);

    const { result } = renderHookWithQuery(() => useAuthenticatedData());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should redirect to login
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
```

### 3. Data Validation Error Testing

```typescript
describe('Data Validation Error Handling', () => {
  it('should handle malformed API responses', async () => {
    const malformedData = { invalid: 'structure' };
    vi.mocked(invokeFunctionGet).mockResolvedValue(malformedData);

    const { result } = renderHookWithQuery(() => useValidatedData());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('validation');
  });
});
```

---

## Performance Testing

### 1. Render Performance

```typescript
describe('Performance Testing', () => {
  it('should render large lists efficiently', () => {
    const largeDataSet = Array.from({ length: 1000 }, (_, i) =>
      createMockReview({ id: i, title: `Review ${i}` })
    )

    const startTime = performance.now()
    renderWithProviders(<ReviewList reviews={largeDataSet} />)
    const endTime = performance.now()

    expect(endTime - startTime).toBeLessThan(100) // 100ms threshold
  })

  it('should handle rapid state updates', async () => {
    const { result } = renderHook(() => useState(0))
    const [, setValue] = result.current

    const startTime = performance.now()

    // Simulate rapid updates
    for (let i = 0; i < 100; i++) {
      act(() => setValue(i))
    }

    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(50)
  })
})
```

### 2. Memory Leak Testing

```typescript
describe('Memory Leak Prevention', () => {
  it('should cleanup event listeners', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderWithProviders(<ComponentWithListeners />)

    expect(addEventListenerSpy).toHaveBeenCalled()

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(
      addEventListenerSpy.mock.calls.length
    )
  })
})
```

---

## Accessibility Testing

### 1. ARIA Compliance

```typescript
describe('Accessibility Testing', () => {
  it('should have proper ARIA labels', () => {
    renderWithProviders(<SearchInput />)

    const searchInput = screen.getByRole('searchbox')
    expect(searchInput).toHaveAttribute('aria-label', 'Search reviews')
    expect(searchInput).toHaveAttribute('aria-describedby')
  })

  it('should support keyboard navigation', async () => {
    renderWithProviders(<NavigationMenu />)

    const firstMenuItem = screen.getByRole('menuitem', { name: /home/i })
    firstMenuItem.focus()

    await fireEvent.keyDown(firstMenuItem, { key: 'ArrowDown' })

    const secondMenuItem = screen.getByRole('menuitem', { name: /community/i })
    expect(secondMenuItem).toHaveFocus()
  })
})
```

### 2. Screen Reader Testing

```typescript
describe('Screen Reader Support', () => {
  it('should announce dynamic content changes', async () => {
    renderWithProviders(<LiveUpdatedContent />)

    const announcement = screen.getByRole('status', { hidden: true })

    // Trigger content update
    await fireEvent.click(screen.getByRole('button', { name: /refresh/i }))

    await waitFor(() => {
      expect(announcement).toHaveTextContent(/content updated/i)
    })
  })

  it('should have proper heading hierarchy', () => {
    renderWithProviders(<PageWithHeadings />)

    const headings = screen.getAllByRole('heading')
    const levels = headings.map(h => parseInt(h.tagName.charAt(1)))

    // Check heading levels are sequential
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i-1]).toBeLessThanOrEqual(1)
    }
  })
})
```

---

## Conclusion

This testing blueprint provides concrete implementation patterns for maintaining high-quality code in the EVIDENS platform. By following these templates and patterns, developers can ensure consistent, reliable, and maintainable test coverage across all application components.

**Key Implementation Points:**

- Always start with the appropriate template
- Follow the 7-point testing checklist for components
- Use domain-specific custom matchers
- Mock at the appropriate level (unit vs integration)
- Test error scenarios comprehensively
- Validate accessibility and performance

---

## Color System Testing

### 9.1 Overview

The EVIDENS color system requires comprehensive testing to ensure security, performance, and integration reliability. Testing coverage includes:

- **Security Testing**: CSS injection prevention and input sanitization
- **Component Testing**: UnifiedColorPicker and related components
- **Token Testing**: Theme token validation and resolution
- **Integration Testing**: Cross-component color consistency
- **Performance Testing**: Validation speed and memory usage

### 9.2 Security Testing Patterns

**File Pattern**: `/src/utils/__tests__/color-sanitization.test.ts`

```typescript
// ABOUTME: Security tests for color input sanitization preventing CSS injection attacks

import { describe, it, expect } from 'vitest'
import { sanitizeColorForStyle, sanitizeStyleColors } from '../color-sanitization'

describe('Color Sanitization Security', () => {
  describe('CSS Injection Prevention', () => {
    it('should block JavaScript injection attempts', () => {
      const dangerousInputs = [
        'javascript:alert(1)',
        'JAVASCRIPT:alert(1)',
        'expression(alert(1))',
        'Expression(alert(1))',
        'url(javascript:alert(1))',
        'data:text/html,<script>alert(1)</script>',
      ]

      dangerousInputs.forEach(input => {
        expect(sanitizeColorForStyle(input)).toBe('transparent')
      })
    })

    it('should block CSS import and behavior injections', () => {
      const dangerousInputs = [
        '@import url(malicious.css)',
        'behavior:url(malicious.htc)',
        'binding:url(malicious.xml)',
      ]

      dangerousInputs.forEach(input => {
        expect(sanitizeColorForStyle(input)).toBe('transparent')
      })
    })

    it('should allow valid color formats', () => {
      const validColors = [
        '#ff0000',
        '#FF0000',
        'rgb(255, 0, 0)',
        'hsl(0, 100%, 50%)',
        'hsl(var(--primary))',
        'transparent',
        'red',
      ]

      validColors.forEach(color => {
        expect(sanitizeColorForStyle(color)).toBe(color)
      })
    })
  })

  describe('Style Object Sanitization', () => {
    it('should sanitize multiple style properties', () => {
      const result = sanitizeStyleColors({
        color: 'javascript:alert(1)',
        backgroundColor: '#ff0000',
        borderColor: 'hsl(var(--border))',
      })

      expect(result).toEqual({
        color: 'transparent',
        backgroundColor: '#ff0000',
        borderColor: 'hsl(var(--border))',
      })
    })
  })
})
```

### 9.3 Component Testing Patterns

**File Pattern**: `/src/components/editor/shared/__tests__/UnifiedColorPicker.test.tsx`

```typescript
// ABOUTME: Tests for UnifiedColorPicker ensuring secure color selection and theme integration

import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../__tests__/test-utils'
import { UnifiedColorPicker } from '../UnifiedColorPicker'

describe('UnifiedColorPicker', () => {
  const mockOnColorSelect = vi.fn()
  const mockOnColorClear = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Token Selection Mode', () => {
    it('should display theme tokens correctly', () => {
      renderWithProviders(
        <UnifiedColorPicker
          onColorSelect={mockOnColorSelect}
          mode="tokens"
        />
      )

      expect(screen.getByLabelText('Select Primary color')).toBeInTheDocument()
      expect(screen.getByLabelText('Select Success color')).toBeInTheDocument()
    })

    it('should handle token selection', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <UnifiedColorPicker
          onColorSelect={mockOnColorSelect}
          mode="tokens"
        />
      )

      const primaryToken = screen.getByLabelText('Select Primary color')
      await user.click(primaryToken)

      expect(mockOnColorSelect).toHaveBeenCalledWith('hsl(var(--primary))')
    })
  })

  describe('Custom Color Mode', () => {
    it('should validate custom color input', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <UnifiedColorPicker
          onColorSelect={mockOnColorSelect}
          mode="custom"
        />
      )

      const input = screen.getByLabelText('Custom color input')
      await user.type(input, '#invalid')

      expect(screen.getByText(/Invalid color format/)).toBeInTheDocument()
    })

    it('should accept valid hex colors', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <UnifiedColorPicker
          onColorSelect={mockOnColorSelect}
          mode="custom"
        />
      )

      const input = screen.getByLabelText('Custom color input')
      await user.type(input, '#ff0000')

      expect(mockOnColorSelect).toHaveBeenCalledWith('#ff0000')
    })
  })

  describe('Security Integration', () => {
    it('should sanitize malicious color inputs', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <UnifiedColorPicker
          onColorSelect={mockOnColorSelect}
          mode="custom"
        />
      )

      const input = screen.getByLabelText('Custom color input')
      await user.type(input, 'javascript:alert(1)')

      expect(mockOnColorSelect).not.toHaveBeenCalledWith('javascript:alert(1)')
      expect(screen.getByText(/Invalid color format/)).toBeInTheDocument()
    })
  })
})
```

### 9.4 Token System Testing

**File Pattern**: `/src/utils/__tests__/color-tokens.test.ts`

```typescript
// ABOUTME: Tests for color token management system ensuring data integrity and performance

import { describe, it, expect } from 'vitest'
import {
  ALL_COLOR_TOKENS,
  COLOR_TOKEN_MAP,
  isThemeToken,
  getTokenByValue,
  validateColorValue,
} from '../color-tokens'

describe('Color Token System', () => {
  describe('Token Data Integrity', () => {
    it('should have consistent token structure', () => {
      ALL_COLOR_TOKENS.forEach(token => {
        expect(token).toHaveProperty('id')
        expect(token).toHaveProperty('name')
        expect(token).toHaveProperty('value')
        expect(token).toHaveProperty('category')
        expect(typeof token.id).toBe('string')
        expect(typeof token.name).toBe('string')
        expect(typeof token.value).toBe('string')
      })
    })

    it('should have unique token IDs', () => {
      const ids = ALL_COLOR_TOKENS.map(token => token.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids).toHaveLength(uniqueIds.length)
    })
  })

  describe('Token Resolution Performance', () => {
    it('should resolve tokens quickly', () => {
      const start = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        COLOR_TOKEN_MAP.get('primary')
      }
      
      const end = performance.now()
      expect(end - start).toBeLessThan(10) // Should complete in under 10ms
    })
  })

  describe('Token Validation', () => {
    it('should identify theme tokens correctly', () => {
      expect(isThemeToken('hsl(var(--primary))')).toBe(true)
      expect(isThemeToken('#ff0000')).toBe(false)
      expect(isThemeToken('rgb(255, 0, 0)')).toBe(false)
    })

    it('should validate color formats', () => {
      expect(validateColorValue('#ff0000')).toBe(true)
      expect(validateColorValue('rgb(255, 0, 0)')).toBe(true)
      expect(validateColorValue('hsl(0, 100%, 50%)')).toBe(true)
      expect(validateColorValue('invalid')).toBe(false)
    })
  })
})
```

### 9.5 Integration Testing Patterns

**File Pattern**: `/src/__tests__/theme-integration.validation.test.tsx`

```typescript
// ABOUTME: Integration tests ensuring color system works correctly across components

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from './test-utils'
import { useColorTokens } from '../hooks/useColorTokens'

describe('Color System Integration', () => {
  describe('Cross-Component Consistency', () => {
    it('should maintain color consistency across components', () => {
      const TestComponent = () => {
        const { resolveColor } = useColorTokens()
        
        const primaryColor = resolveColor('hsl(var(--primary))')
        const resolvedAgain = resolveColor('hsl(var(--primary))')
        
        return (
          <div>
            <span data-testid="color1">{primaryColor}</span>
            <span data-testid="color2">{resolvedAgain}</span>
          </div>
        )
      }

      renderWithProviders(<TestComponent />)
      
      expect(screen.getByTestId('color1')).toHaveTextContent(
        screen.getByTestId('color2').textContent || ''
      )
    })
  })

  describe('Theme Switching', () => {
    it('should handle theme changes gracefully', () => {
      // Test theme switching functionality
      const TestComponent = () => {
        const { isDarkMode } = useColorTokens()
        return <div data-testid="theme">{isDarkMode ? 'dark' : 'light'}</div>
      }

      renderWithProviders(<TestComponent />)
      
      expect(screen.getByTestId('theme')).toBeInTheDocument()
    })
  })
})
```

### 9.6 Performance Testing Requirements

**Performance Benchmarks**:

```typescript
// ABOUTME: Performance tests ensuring color system meets speed requirements

describe('Color System Performance', () => {
  it('should validate colors in under 1ms', () => {
    const start = performance.now()
    validateColorValue('#ff0000')
    const end = performance.now()
    
    expect(end - start).toBeLessThan(1)
  })

  it('should handle batch token lookups efficiently', () => {
    const tokenIds = ['primary', 'secondary', 'success', 'error']
    
    const start = performance.now()
    tokenIds.forEach(id => COLOR_TOKEN_MAP.get(id))
    const end = performance.now()
    
    expect(end - start).toBeLessThan(5)
  })
})
```

### 9.7 Testing Checklist for Color Components

When creating tests for color-related components, ensure:

1. **Security Testing**
   - [ ] CSS injection prevention
   - [ ] Input sanitization validation
   - [ ] Safe DOM injection patterns

2. **Component Testing**
   - [ ] Token selection functionality
   - [ ] Custom color input validation
   - [ ] Accessibility compliance
   - [ ] Error state handling

3. **Integration Testing**
   - [ ] Cross-component consistency
   - [ ] Theme switching behavior
   - [ ] Hook integration patterns

4. **Performance Testing**
   - [ ] Validation speed benchmarks
   - [ ] Memory usage validation
   - [ ] Batch operation efficiency

**Next Steps:**

1. Use these templates for all new component development
2. Retrofit existing components using these patterns
3. Expand error scenario coverage
4. Implement visual regression testing
5. Add E2E testing with Playwright

---

**Last Updated**: June 28, 2025  
**Blueprint Status**: Active  
**Implementation Priority**: High
