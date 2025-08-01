// ABOUTME: Enhanced community types with reward system support.

// Core Community Post interface - optimized with better generic usage
export interface CommunityPost {
  id: number;
  title?: string;
  content: string;
  category: string;
  category_id?: number;
  category_data?: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    background_color: string;
    text_color: string;
    border_color: string;
    is_active: boolean;
    display_order: number;
  };
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  flair_text?: string;
  flair_color?: string;
  image_url?: string;
  video_url?: string;
  poll_data?: Record<string, any>;
  post_type?: 'text' | 'image' | 'video' | 'poll' | 'link';
  link_url?: string;
  link_preview_data?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    domain: string;
    favicon?: string;
  };
  author_id?: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role?: string;
    profession?: string | null;
  };
  user_vote?: 'up' | 'down' | null;
  reply_count?: number;
  is_saved?: boolean;
  user_can_moderate?: boolean;
  // NEW: Support for reward system and comments
  is_rewarded?: boolean;
  parent_post_id?: number | null;
  nesting_level?: number;
}

// Optimized type definitions with proper enums and unions
export type PostType = 'text' | 'image' | 'poll' | 'video' | 'link';
export type VoteType = 'up' | 'down' | null;
export type FlairColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';

// Author information interface - consolidated and optimized
export interface AuthorInfo {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role?: string;
  profession?: string | null;
}

// Poll data interface - improved structure
export interface PollData {
  question: string;
  options: Array<PollOption>;
  total_votes: number;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

// API Response interfaces - consolidated
export interface CreateCommunityPostResponse {
  id: number;
  success: boolean;
  message?: string;
}

// Sidebar data interfaces - optimized structure
export interface SidebarData {
  rules: string[];
  links: Array<SidebarLink>;
  trendingDiscussions: Array<TrendingDiscussion>;
  featuredPoll?: FeaturedPoll;
  recentActivity: Array<RecentActivity>;
}

export interface SidebarLink {
  title: string;
  url: string;
}

export interface TrendingDiscussion {
  id: number;
  title: string;
  content: string;
  category: string;
  reply_count: number;
  upvotes: number;
  created_at: string;
  author: Pick<AuthorInfo, 'full_name'> | null;
  flair_text?: string;
  is_pinned?: boolean;
}

export interface FeaturedPoll {
  id: number;
  question: string;
  total_votes: number;
  PollOptions: Array<{
    id: number;
    option_text: string;
    vote_count: number;
  }>;
}

export interface RecentActivity {
  id: number;
  title: string;
  created_at: string;
  Practitioners: {
    full_name: string;
    profession?: string | null;
  };
}

// Community page response interface - optimized
export interface CommunityPageResponse {
  posts: CommunityPost[];
  pagination: PaginationInfo;
  sidebarData: SidebarData;
}

// Pagination interface - made generic for reuse
export interface PaginationInfo {
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form and mutation interfaces - improved type safety
export interface CreatePostPayload {
  title: string; // NOW MANDATORY per requirements
  content?: string; // NOW OPTIONAL per requirements
  category: string;
  post_type?: PostType;
  image_url?: string;
  video_url?: string;
  poll_data?: Omit<PollData, 'total_votes'>;
  link_url?: string;
  link_preview_data?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    domain: string;
    favicon?: string;
  };
}

// Action and moderation interfaces
export type ModerationAction = 'pin' | 'unpin' | 'lock' | 'unlock' | 'hide' | 'delete';

export interface PostActionParams {
  postId: number;
  action: ModerationAction;
}

// Vote mutation interfaces
export interface VotePayload {
  postId: number;
  voteType: Exclude<VoteType, null>;
}
