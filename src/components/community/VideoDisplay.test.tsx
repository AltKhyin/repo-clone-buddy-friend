// ABOUTME: Tests for video display functionality in community posts

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PostCard } from './PostCard'
import { PostDetailCard } from './PostDetailCard'
import type { CommunityPost } from '@/types'

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

// Mock auth store
vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({ user: { id: 'test-user' } }),
}))

// Mock mutations
vi.mock('../../../packages/hooks/useCastVoteMutation', () => ({
  useCastVoteMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('../../../packages/hooks/useSavePostMutation', () => ({
  useSavePostMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

const mockVideoPost: CommunityPost = {
  id: 66,
  title: 'Test Video Post - YouTube Embed',
  content: 'This is a test video post to verify video display is working correctly.',
  category: 'discussao-geral',
  post_type: 'video',
  video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  image_url: null,
  poll_data: null,
  upvotes: 0,
  downvotes: 0,
  created_at: '2025-07-04T07:30:54.937903+00:00',
  is_pinned: false,
  is_locked: false,
  flair_text: null,
  flair_color: null,
  author: {
    id: 'author-id',
    full_name: 'Test Author',
    avatar_url: null,
  },
  user_vote: 'none',
  reply_count: 0,
  is_saved: false,
}

const mockDirectVideoPost: CommunityPost = {
  ...mockVideoPost,
  id: 67,
  title: 'Test Direct Video Post',
  video_url: 'https://example.com/video.mp4',
}

describe('Video Display in Community Posts', () => {
  describe('PostCard Video Display', () => {
    it('should render YouTube embed iframe for YouTube URLs', () => {
      render(<PostCard post={mockVideoPost} />)
      
      const iframe = screen.getByTitle('Video content')
      expect(iframe).toBeInTheDocument()
      expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
      expect(iframe).toHaveClass('w-full', 'aspect-video', 'max-h-80')
    })

    it('should render video element for direct video URLs', () => {
      const { container } = render(<PostCard post={mockDirectVideoPost} />)
      
      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4')
      expect(video).toHaveAttribute('controls')
      expect(video).toHaveAttribute('preload', 'metadata')
    })

    it('should not render video content for non-video posts', () => {
      const textPost = { ...mockVideoPost, post_type: 'text' as const, video_url: null }
      const { container } = render(<PostCard post={textPost} />)
      
      expect(screen.queryByTitle('Video content')).not.toBeInTheDocument()
      expect(container.querySelector('video')).not.toBeInTheDocument()
    })

    it('should handle video load errors gracefully', () => {
      const { container } = render(<PostCard post={mockDirectVideoPost} />)
      
      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
      
      // Simulate video error
      const errorEvent = new Event('error')
      video?.dispatchEvent(errorEvent)
      
      // Should show fallback message instead of video
      expect(container.querySelector('video')).not.toBeInTheDocument()
      expect(container).toHaveTextContent('Vídeo não pode ser carregado')
      expect(container).toHaveTextContent('Abrir vídeo em nova aba')
    })
  })

  describe('PostDetailCard Video Display', () => {
    it('should render YouTube embed iframe for YouTube URLs', () => {
      render(<PostDetailCard post={mockVideoPost} />)
      
      const iframe = screen.getByTitle('Video content')
      expect(iframe).toBeInTheDocument()
      expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
      expect(iframe).toHaveClass('w-full', 'aspect-video', 'rounded-lg')
    })

    it('should render video element for direct video URLs', () => {
      const { container } = render(<PostDetailCard post={mockDirectVideoPost} />)
      
      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4')
      expect(video).toHaveAttribute('controls')
      expect(video).toHaveClass('rounded-lg', 'max-w-full')
    })

    it('should handle Vimeo embeds correctly', () => {
      const vimeoPost = {
        ...mockVideoPost,
        video_url: 'https://player.vimeo.com/video/123456789'
      }
      
      render(<PostDetailCard post={vimeoPost} />)
      
      const iframe = screen.getByTitle('Video content')
      expect(iframe).toHaveAttribute('src', 'https://player.vimeo.com/video/123456789')
    })
  })

  describe('Video Data Flow', () => {
    it('should receive video_url from API response', () => {
      // This test verifies the API contract matches component expectations
      const apiResponsePost = {
        id: 66,
        title: 'Test Video Post - YouTube Embed',
        content: 'This is a test video post to verify video display is working correctly.',
        category: 'discussao-geral',
        post_type: 'video',
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        image_url: null,
        poll_data: null,
        upvotes: 0,
        downvotes: 0,
        created_at: '2025-07-04T07:30:54.937903+00:00',
        is_pinned: false,
        is_locked: false,
        flair_text: null,
        flair_color: null,
        author: {
          id: 'author-id',
          full_name: 'Test Author',
          avatar_url: null,
        },
        user_vote: 'none',
        reply_count: 0,
      }

      render(<PostCard post={apiResponsePost} />)
      
      expect(screen.getByTitle('Video content')).toHaveAttribute(
        'src', 
        'https://www.youtube.com/embed/dQw4w9WgXcQ'
      )
    })
  })
})