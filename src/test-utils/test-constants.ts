// ABOUTME: Test constants and configuration values used across all test files

/**
 * Common test IDs for consistent element selection
 */
export const TEST_IDS = {
  // Loading states
  LOADING_SKELETON: 'loading-skeleton',
  LOADING_SPINNER: 'loading-spinner',
  LOADING_TEXT: 'loading-text',
  
  // Error states
  ERROR_BOUNDARY: 'error-boundary',
  ERROR_MESSAGE: 'error-message',
  ERROR_RETRY_BUTTON: 'error-retry-button',
  
  // Navigation
  SIDEBAR: 'sidebar',
  MOBILE_MENU: 'mobile-menu',
  NAVIGATION_ITEM: 'navigation-item',
  USER_PROFILE_BLOCK: 'user-profile-block',
  
  // Homepage
  FEATURED_REVIEW: 'featured-review',
  REVIEW_CAROUSEL: 'review-carousel',
  REVIEW_CARD: 'review-card',
  SUGGESTIONS_MODULE: 'suggestions-module',
  
  // Community
  COMMUNITY_FEED: 'community-feed',
  COMMUNITY_POST: 'community-post',
  VOTE_BUTTONS: 'vote-buttons',
  COMMENT_THREAD: 'comment-thread',
  COMMUNITY_SIDEBAR: 'community-sidebar',
  
  // Forms
  LOGIN_FORM: 'login-form',
  SIGNUP_FORM: 'signup-form',
  POST_FORM: 'post-form',
  COMMENT_FORM: 'comment-form',
  
  // Buttons
  SUBMIT_BUTTON: 'submit-button',
  CANCEL_BUTTON: 'cancel-button',
  DELETE_BUTTON: 'delete-button',
  EDIT_BUTTON: 'edit-button',
  
  // Modals
  MODAL_OVERLAY: 'modal-overlay',
  MODAL_CONTENT: 'modal-content',
  MODAL_CLOSE: 'modal-close',
} as const;

/**
 * Common ARIA labels for accessibility testing
 */
export const ARIA_LABELS = {
  LOADING: 'Carregando conteúdo',
  ERROR: 'Erro ao carregar',
  RETRY: 'Tentar novamente',
  CLOSE: 'Fechar',
  MENU: 'Menu de navegação',
  SEARCH: 'Buscar',
  VOTE_UP: 'Votar positivamente',
  VOTE_DOWN: 'Votar negativamente',
  SAVE_POST: 'Salvar post',
  SHARE_POST: 'Compartilhar post',
} as const;

/**
 * Default test timeouts
 */
export const TIMEOUTS = {
  QUERY_TIMEOUT: 5000,
  ANIMATION_TIMEOUT: 500,
  USER_INTERACTION: 1000,
  NETWORK_REQUEST: 3000,
} as const;

/**
 * Mock API responses
 */
export const MOCK_API_RESPONSES = {
  EMPTY_LIST: {
    data: [],
    pagination: { page: 0, hasMore: false, total: 0 },
  },
  
  NETWORK_ERROR: {
    error: { message: 'Network error', code: 'NETWORK_ERROR' },
  },
  
  UNAUTHORIZED_ERROR: {
    error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
  },
  
  VALIDATION_ERROR: {
    error: { message: 'Validation failed', code: 'VALIDATION_FAILED' },
  },
} as const;

/**
 * Common CSS classes for testing
 */
export const TEST_CLASSES = {
  // Layout
  CONTAINER: 'container',
  GRID: 'grid',
  FLEX: 'flex',
  
  // Responsive
  MOBILE: 'sm:hidden',
  DESKTOP: 'hidden sm:block',
  
  // States
  LOADING: 'animate-pulse',
  ERROR: 'text-destructive',
  SUCCESS: 'text-green-600',
  
  // Interactive
  CLICKABLE: 'cursor-pointer',
  DISABLED: 'opacity-50 cursor-not-allowed',
  
  // Theme
  DARK: 'dark',
  LIGHT: 'light',
} as const;

/**
 * Route paths for testing navigation
 */
export const TEST_ROUTES = {
  HOME: '/',
  COMMUNITY: '/comunidade',
  ACERVO: '/acervo',
  LOGIN: '/login',
  PROFILE: '/perfil',
  SETTINGS: '/definicoes',
  ADMIN: '/admin',
  UNAUTHORIZED: '/acesso-negado',
} as const;

/**
 * Media query breakpoints matching the application
 */
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;

/**
 * Test data limits and pagination
 */
export const TEST_LIMITS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_ITEMS_PER_TEST: 100,
  INFINITE_SCROLL_THRESHOLD: 10,
} as const;

/**
 * Mock environment variables for testing
 */
export const MOCK_ENV = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  NODE_ENV: 'test',
} as const;

/**
 * User roles for permission testing
 */
export const USER_ROLES = {
  PRACTITIONER: 'practitioner',
  EDITOR: 'editor',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

/**
 * Subscription tiers for access control testing
 */
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  PROFESSIONAL: 'professional',
} as const;

/**
 * Post categories for community testing
 */
export const POST_CATEGORIES = {
  DISCUSSION: 'discussion',
  QUESTION: 'question',
  ANNOUNCEMENT: 'announcement',
  POLL: 'poll',
} as const;

/**
 * Content access levels for review testing
 */
export const ACCESS_LEVELS = {
  PUBLIC: 'public',
  FREE_USERS_ONLY: 'free_users_only',
  PAYING_USERS_ONLY: 'paying_users_only',
} as const;

/**
 * Error messages for consistent testing
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Você não tem permissão para acessar este conteúdo.',
  NOT_FOUND: 'Conteúdo não encontrado.',
  VALIDATION_FAILED: 'Dados inválidos. Verifique os campos.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
} as const;