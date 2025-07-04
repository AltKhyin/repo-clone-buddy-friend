// ABOUTME: Tests for video utility functions

import { describe, it, expect } from 'vitest'
import {
  convertToEmbeddableYouTubeUrl,
  convertToEmbeddableVimeoUrl,
  isValidVideoUrl,
  processVideoUrl,
  getVideoType
} from './video-utils'

describe('Video Utilities', () => {
  describe('convertToEmbeddableYouTubeUrl', () => {
    it('should convert regular YouTube URLs to embeddable format', () => {
      const regularUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const expected = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      expect(convertToEmbeddableYouTubeUrl(regularUrl)).toBe(expected)
    })

    it('should convert short YouTube URLs to embeddable format', () => {
      const shortUrl = 'https://youtu.be/dQw4w9WgXcQ'
      const expected = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      expect(convertToEmbeddableYouTubeUrl(shortUrl)).toBe(expected)
    })

    it('should return embeddable URLs unchanged', () => {
      const embedUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      expect(convertToEmbeddableYouTubeUrl(embedUrl)).toBe(embedUrl)
    })

    it('should handle YouTube Shorts URLs', () => {
      const shortsUrl = 'https://www.youtube.com/shorts/dQw4w9WgXcQ'
      const expected = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      expect(convertToEmbeddableYouTubeUrl(shortsUrl)).toBe(expected)
    })
  })

  describe('convertToEmbeddableVimeoUrl', () => {
    it('should convert regular Vimeo URLs to embeddable format', () => {
      const regularUrl = 'https://vimeo.com/123456789'
      const expected = 'https://player.vimeo.com/video/123456789'
      expect(convertToEmbeddableVimeoUrl(regularUrl)).toBe(expected)
    })

    it('should return embeddable Vimeo URLs unchanged', () => {
      const embedUrl = 'https://player.vimeo.com/video/123456789'
      expect(convertToEmbeddableVimeoUrl(embedUrl)).toBe(embedUrl)
    })
  })

  describe('isValidVideoUrl', () => {
    it('should validate YouTube URLs', () => {
      expect(isValidVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
      expect(isValidVideoUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
      expect(isValidVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true)
      expect(isValidVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(true)
    })

    it('should validate Vimeo URLs', () => {
      expect(isValidVideoUrl('https://vimeo.com/123456789')).toBe(true)
      expect(isValidVideoUrl('https://player.vimeo.com/video/123456789')).toBe(true)
    })

    it('should validate direct video file URLs', () => {
      expect(isValidVideoUrl('https://example.com/video.mp4')).toBe(true)
      expect(isValidVideoUrl('https://example.com/video.webm')).toBe(true)
      expect(isValidVideoUrl('https://example.com/video.ogg')).toBe(true)
      expect(isValidVideoUrl('https://example.com/video.mp4?quality=hd')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(isValidVideoUrl('')).toBe(false)
      expect(isValidVideoUrl('https://example.com/image.jpg')).toBe(false)
      expect(isValidVideoUrl('not-a-url')).toBe(false)
      expect(isValidVideoUrl('https://other-site.com/video')).toBe(false)
    })
  })

  describe('processVideoUrl', () => {
    it('should process YouTube URLs to embeddable format', () => {
      const input = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const expected = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      expect(processVideoUrl(input)).toBe(expected)
    })

    it('should process Vimeo URLs to embeddable format', () => {
      const input = 'https://vimeo.com/123456789'
      const expected = 'https://player.vimeo.com/video/123456789'
      expect(processVideoUrl(input)).toBe(expected)
    })

    it('should return direct video URLs unchanged', () => {
      const directUrl = 'https://example.com/video.mp4'
      expect(processVideoUrl(directUrl)).toBe(directUrl)
    })

    it('should handle empty URLs', () => {
      expect(processVideoUrl('')).toBe('')
    })
  })

  describe('getVideoType', () => {
    it('should identify YouTube videos', () => {
      expect(getVideoType('https://www.youtube.com/watch?v=test')).toBe('youtube')
      expect(getVideoType('https://youtu.be/test')).toBe('youtube')
    })

    it('should identify Vimeo videos', () => {
      expect(getVideoType('https://vimeo.com/123456789')).toBe('vimeo')
      expect(getVideoType('https://player.vimeo.com/video/123456789')).toBe('vimeo')
    })

    it('should identify direct video files', () => {
      expect(getVideoType('https://example.com/video.mp4')).toBe('direct')
      expect(getVideoType('https://example.com/video.webm')).toBe('direct')
    })

    it('should return unknown for invalid URLs', () => {
      expect(getVideoType('')).toBe('unknown')
      expect(getVideoType('https://example.com/image.jpg')).toBe('unknown')
    })
  })
})