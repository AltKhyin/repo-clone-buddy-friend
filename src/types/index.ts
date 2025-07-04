
// ABOUTME: Central type exports for the EVIDENS application - fixed and consolidated

// Re-export community types
export type { 
  CommunityPost,
  AuthorInfo,
  PostType,
  VoteType,
  PollData,
  PollOption,
  CreateCommunityPostResponse,
  SidebarData,
  SidebarLink,
  TrendingDiscussion,
  FeaturedPoll,
  RecentActivity,
  CommunityPageResponse,
  PaginationInfo,
  CreatePostPayload,
  ModerationAction,
  PostActionParams,
  VotePayload
} from './community';

// Re-export API types
export type { 
  ApiResponse, 
  ApiError, 
  FormFieldError, 
  FormValidationResult,
  PaginationParams,
  PaginationResponse,
  HttpMethod,
  QueryParams
} from './api';

// Re-export admin types
export type {
  ReviewStatus,
  ReviewApprovalStatus,
  PublicationActionRequest,
  PublicationActionResponse,
  BulkOperationRequest,
  BulkOperationResponse,
  ReviewWithStatus,
  ContentQueueFilters,
  ContentQueueSummary,
  SaveState,
  UnifiedSaveContextValue
} from './admin';

// Import and re-export UserProfile from Supabase types
import type { Database } from '../integrations/supabase/types';
export type UserProfile = Database['public']['Tables']['Practitioners']['Row'];

// Add missing mutation and response types that hooks expect
export interface SavePostMutationData {
  post_id: number;
  is_saved?: boolean;
}

export interface SavePostResponse {
  success: boolean;
  is_saved: boolean;
  message?: string;
}

// Add missing Tag type for Acervo components
export interface Tag {
  id: number;
  tag_name: string;
  parent_id?: number | null;
  category?: string;
}

// Base entity interface for database entities
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Utility types for better type safety
export type Maybe<T> = T | null | undefined;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Status and state enums for consistency
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type ThemeMode = 'light' | 'dark' | 'system';

// Profile system types (complete)
export interface ProfileUpdateData {
  full_name?: string;
  profession?: string;
  avatar_url?: string | null;
  linkedin_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
}

export interface SocialLinks {
  linkedin_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
}

// Extended UserProfile type until Supabase types are regenerated
export interface ExtendedUserProfile extends UserProfile {
  profession?: string | null;
  linkedin_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
}
