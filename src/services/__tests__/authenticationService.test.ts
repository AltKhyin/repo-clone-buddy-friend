// ABOUTME: Basic test for authentication service functionality
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  checkEmailAccountExists,
  getUserAuthenticationStatus,
  clearAuthenticationCache
} from '../authenticationService'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn()
        }))
      }))
    })),
    auth: {
      getUser: vi.fn()
    }
  }
}))

describe('Authentication Service', () => {
  beforeEach(() => {
    clearAuthenticationCache()
    vi.clearAllMocks()
  })

  describe('getUserAuthenticationStatus', () => {
    it('should return logged_in status for authenticated users', async () => {
      const { supabase } = await import('@/integrations/supabase/client')
      
      // Mock authenticated user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null
      })

      const result = await getUserAuthenticationStatus()
      
      expect(result.status).toBe('logged_in')
      expect(result.userId).toBe('user123')
      expect(result.email).toBe('test@example.com')
    })

    it('should return account_exists status for existing accounts', async () => {
      const { supabase } = await import('@/integrations/supabase/client')
      
      // Mock no authenticated user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      })

      // Mock existing account
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'user123', email: 'existing@example.com' },
              error: null
            })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await getUserAuthenticationStatus('existing@example.com')
      
      expect(result.status).toBe('account_exists')
      expect(result.userId).toBe('user123')
      expect(result.email).toBe('existing@example.com')
    })

    it('should return no_account status for new emails', async () => {
      const { supabase } = await import('@/integrations/supabase/client')
      
      // Mock no authenticated user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      })

      // Mock no existing account
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await getUserAuthenticationStatus('new@example.com')
      
      expect(result.status).toBe('no_account')
      expect(result.email).toBe('new@example.com')
    })
  })

  describe('checkEmailAccountExists', () => {
    it('should cache results to prevent redundant API calls', async () => {
      const { supabase } = await import('@/integrations/supabase/client')
      
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'user123', email: 'cached@example.com' },
              error: null
            })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      // First call
      const result1 = await checkEmailAccountExists('cached@example.com')
      expect(result1.exists).toBe(true)
      
      // Second call should use cache
      const result2 = await checkEmailAccountExists('cached@example.com')
      expect(result2.exists).toBe(true)
      
      // Should only call Supabase once due to caching
      expect(mockFrom).toHaveBeenCalledTimes(1)
    })
  })
})