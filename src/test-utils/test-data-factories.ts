// ABOUTME: Test data factories for generating consistent mock data across all test files

import type { UserProfile } from '@/types';

/**
 * Utility to generate unique IDs for testing
 */
let idCounter = 1;
export const generateId = () => `test-id-${idCounter++}`;
export const generateUUID = () => `${generateId()}-uuid`;

/**
 * Factory for creating mock user profiles
 */
export const createMockUserProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
  id: generateUUID(),
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  role: 'practitioner',
  subscription_tier: 'free',
  contribution_score: 0,
  profession_flair: 'Médico',
  display_hover_card: true,
  created_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Factory for creating mock reviews
 */
export interface MockReview {
  id: number;
  title: string;
  description: string;
  cover_image_url: string | null;
  published_at: string;
  view_count: number;
  author_id?: string;
  status?: string;
  access_level?: string;
  structured_content?: Record<string, unknown>;
}

export const createMockReview = (overrides?: Partial<MockReview>): MockReview => ({
  id: parseInt(generateId().replace('test-id-', '')),
  title: 'Análise sobre Hipertensão Arterial',
  description: 'Uma análise detalhada sobre as diretrizes mais recentes para tratamento de hipertensão.',
  cover_image_url: 'https://example.com/review-cover.jpg',
  published_at: '2025-01-01T00:00:00Z',
  view_count: 150,
  author_id: generateUUID(),
  status: 'published',
  access_level: 'public',
  structured_content: {
    blocks: [
      { type: 'text', content: 'Conteúdo do review...' }
    ]
  },
  ...overrides,
});

/**
 * Factory for creating mock community posts
 */
export interface MockCommunityPost {
  id: number;
  author_id: string;
  title: string;
  content: string;
  category: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  flair_text?: string;
  flair_color?: string;
  post_type?: string;
  poll_data?: Record<string, unknown>;
  image_url?: string;
  video_url?: string;
}

export const createMockCommunityPost = (overrides?: Partial<MockCommunityPost>): MockCommunityPost => ({
  id: parseInt(generateId().replace('test-id-', '')),
  author_id: generateUUID(),
  title: 'Discussão sobre novo protocolo',
  content: 'Gostaria de discutir as implicações do novo protocolo...',
  category: 'discussion',
  upvotes: 5,
  downvotes: 1,
  created_at: '2025-01-01T00:00:00Z',
  is_pinned: false,
  is_locked: false,
  post_type: 'text',
  ...overrides,
});

/**
 * Factory for creating mock suggestions
 */
export interface MockSuggestion {
  id: number;
  title: string;
  description: string | null;
  upvotes: number;
  created_at: string;
  submitted_by: string;
  status: string;
  Practitioners: { full_name: string } | null;
  user_has_voted?: boolean;
}

export const createMockSuggestion = (overrides?: Partial<MockSuggestion>): MockSuggestion => ({
  id: parseInt(generateId().replace('test-id-', '')),
  title: 'Nova abordagem para diabetes tipo 2',
  description: 'Sugiro uma análise sobre as novas diretrizes para tratamento de diabetes tipo 2.',
  upvotes: 12,
  created_at: '2025-01-01T00:00:00Z',
  submitted_by: generateUUID(),
  status: 'pending',
  Practitioners: { full_name: 'Dr. João Silva' },
  user_has_voted: false,
  ...overrides,
});

/**
 * Factory for creating mock poll data
 */
export interface MockPoll {
  question: string;
  options: Array<{
    text: string;
    votes: number;
  }>;
  total_votes: number;
  expires_at?: string;
  multiple_choice?: boolean;
}

export const createMockPoll = (overrides?: Partial<MockPoll>): MockPoll => ({
  question: 'Qual o melhor protocolo para hipertensão?',
  options: [
    { text: 'ACE inibidores como primeira linha', votes: 25 },
    { text: 'Diuréticos tiazídicos como primeira linha', votes: 18 },
    { text: 'Bloqueadores de canal de cálcio', votes: 12 },
  ],
  total_votes: 55,
  expires_at: '2025-12-31T23:59:59Z',
  multiple_choice: false,
  ...overrides,
});

/**
 * Factory for creating mock consolidated homepage data
 */
export interface MockHomepageData {
  layout: string[];
  featured: MockReview | null;
  recent: MockReview[];
  popular: MockReview[];
  recommendations: MockReview[];
  suggestions: MockSuggestion[];
  userProfile: UserProfile | null;
  notificationCount: number;
}

export const createMockHomepageData = (overrides?: Partial<MockHomepageData>): MockHomepageData => ({
  layout: ['featured', 'recent', 'suggestions', 'popular'],
  featured: createMockReview({ title: 'Review em Destaque' }),
  recent: [
    createMockReview({ title: 'Review Recente 1' }),
    createMockReview({ title: 'Review Recente 2' }),
  ],
  popular: [
    createMockReview({ title: 'Review Popular 1', view_count: 500 }),
    createMockReview({ title: 'Review Popular 2', view_count: 300 }),
  ],
  recommendations: [
    createMockReview({ title: 'Recomendação 1' }),
    createMockReview({ title: 'Recomendação 2' }),
  ],
  suggestions: [
    createMockSuggestion({ title: 'Sugestão 1' }),
    createMockSuggestion({ title: 'Sugestão 2' }),
  ],
  userProfile: createMockUserProfile(),
  notificationCount: 3,
  ...overrides,
});

/**
 * Factory for creating mock community page data
 */
export interface MockCommunityPageData {
  posts: MockCommunityPost[];
  sidebarData: {
    featuredPoll?: MockPoll;
    trendingDiscussions?: MockCommunityPost[];
    rules?: string[];
    links?: Array<{ title: string; url: string }>;
  };
  pagination: {
    page: number;
    hasMore: boolean;
    total: number;
  };
}

export const createMockCommunityPageData = (overrides?: Partial<MockCommunityPageData>): MockCommunityPageData => ({
  posts: [
    createMockCommunityPost({ title: 'Post da Comunidade 1' }),
    createMockCommunityPost({ title: 'Post da Comunidade 2' }),
  ],
  sidebarData: {
    featuredPoll: createMockPoll(),
    trendingDiscussions: [
      createMockCommunityPost({ title: 'Discussão em Alta 1', upvotes: 50 }),
      createMockCommunityPost({ title: 'Discussão em Alta 2', upvotes: 35 }),
    ],
    rules: [
      'Seja respeitoso com outros membros',
      'Mantenha as discussões relevantes',
      'Não compartilhe informações pessoais',
    ],
    links: [
      { title: 'Diretrizes da Comunidade', url: '/guidelines' },
      { title: 'FAQ', url: '/faq' },
    ],
  },
  pagination: {
    page: 0,
    hasMore: true,
    total: 100,
  },
  ...overrides,
});

/**
 * Utility functions for creating arrays of mock data
 */
export const createMockReviews = (count: number, baseOverrides?: Partial<MockReview>) =>
  Array.from({ length: count }, (_, index) =>
    createMockReview({ ...baseOverrides, title: `Review ${index + 1}` })
  );

export const createMockCommunityPosts = (count: number, baseOverrides?: Partial<MockCommunityPost>) =>
  Array.from({ length: count }, (_, index) =>
    createMockCommunityPost({ ...baseOverrides, title: `Post ${index + 1}` })
  );

export const createMockSuggestions = (count: number, baseOverrides?: Partial<MockSuggestion>) =>
  Array.from({ length: count }, (_, index) =>
    createMockSuggestion({ ...baseOverrides, title: `Sugestão ${index + 1}` })
  );

/**
 * Reset ID counter for consistent test results
 */
export const resetIdCounter = () => {
  idCounter = 1;
};