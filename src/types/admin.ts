// ABOUTME: Unified TypeScript interfaces for admin content management with standardized publication workflow

export type ReviewStatus = 'draft' | 'under_review' | 'scheduled' | 'published' | 'archived';
export type ReviewApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface PublicationActionRequest {
  reviewId: number;
  action: 'publish' | 'schedule' | 'reject' | 'archive' | 'unpublish' | 'request_changes';
  scheduledAt?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface PublicationActionResponse {
  success: boolean;
  reviewId: number;
  action: string;
  previousStatus: string;
  newStatus: string;
  scheduledAt?: string;
  updatedAt: string;
}

export interface BulkOperationRequest {
  reviewIds: number[];
  action: 'publish' | 'schedule' | 'archive' | 'reject';
  scheduledAt?: string;
  notes?: string;
}

export interface BulkOperationResponse {
  success: boolean;
  processedCount: number;
  failedCount: number;
  results: {
    reviewId: number;
    success: boolean;
    error?: string;
  }[];
}

export interface ReviewWithStatus {
  id: number;
  title: string;
  description?: string;
  status: ReviewStatus;
  review_status: ReviewApprovalStatus;
  created_at: string;
  updated_at: string;
  published_at?: string;
  scheduled_publish_at?: string;
  archived_at?: string;
  reviewer_id?: string;
  reviewed_at?: string;
  publication_notes?: string;
  access_level: 'free' | 'premium';
  cover_image_url?: string;
  view_count?: number;
  tags?: {
    id: number;
    name: string;
  }[];
}

export interface ContentQueueFilters {
  status: 'all' | ReviewStatus;
  search: string;
  authorId: string;
  reviewerId: string;
  contentType?: string;
}

export interface ContentQueueSummary {
  totalReviews: number;
  totalPosts: number;
}

export interface SaveState {
  hasChanges: boolean;
  isSaving: boolean;
  errors: string[];
  pendingChanges: Record<string, any>;
}

export interface UnifiedSaveContextValue {
  saveState: SaveState;
  updateField: (field: string, value: any) => void;
  save: () => Promise<void>;
  publish: () => Promise<void>;
  resetChanges: () => void;
  addError: (error: string) => void;
  clearErrors: () => void;
}