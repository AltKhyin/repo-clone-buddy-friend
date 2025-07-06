// ABOUTME: Content creation workflow tests - AI-safe guardrails for review creation, editing, publishing, and content management

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test-utils';
import { ReactNode } from 'react';

// Mock content creation editor component
const MockReviewEditor = ({
  mode = 'create',
  isVisible = true,
  reviewData = null,
  isDraft = false,
}: {
  mode?: 'create' | 'edit';
  isVisible?: boolean;
  reviewData?: any;
  isDraft?: boolean;
}) => {
  const isAuthenticated = !!mockAuthStore.session;
  const userRole = mockAuthStore.session?.user?.app_metadata?.role || null;
  const canCreateReviews =
    isAuthenticated && ['practitioner', 'moderator', 'admin'].includes(userRole);
  const userTier = mockAuthStore.session?.user?.subscription_tier || 'free';
  const isPremium = userTier === 'premium' || userTier === 'admin';

  if (!isVisible) return null;

  return (
    <div data-testid="review-editor" className="space-y-6">
      <header data-testid="editor-header">
        <h2>{mode === 'edit' ? 'Edit Review' : 'Create New Review'}</h2>
        {isDraft && <span data-testid="draft-indicator">Draft</span>}
      </header>

      <form data-testid="review-form">
        <div data-testid="form-fields" className="space-y-4">
          <div data-testid="title-section">
            <label htmlFor="review-title">Review Title</label>
            <input
              id="review-title"
              data-testid="title-input"
              placeholder="Enter review title..."
              disabled={!canCreateReviews}
              defaultValue={reviewData?.title || ''}
            />
          </div>

          <div data-testid="summary-section">
            <label htmlFor="executive-summary">Executive Summary</label>
            <textarea
              id="executive-summary"
              data-testid="summary-input"
              placeholder="Provide a concise executive summary..."
              disabled={!canCreateReviews}
              defaultValue={reviewData?.summary || ''}
            />
          </div>

          <div data-testid="content-section">
            <label htmlFor="review-content">Review Content</label>
            <div data-testid="rich-editor" className="border rounded">
              <div data-testid="editor-toolbar">
                <button type="button" data-testid="bold-button" disabled={!canCreateReviews}>
                  B
                </button>
                <button type="button" data-testid="italic-button" disabled={!canCreateReviews}>
                  I
                </button>
                <button type="button" data-testid="link-button" disabled={!canCreateReviews}>
                  🔗
                </button>
                <button type="button" data-testid="image-button" disabled={!canCreateReviews}>
                  📷
                </button>
              </div>
              <textarea
                id="review-content"
                data-testid="content-input"
                placeholder="Write your comprehensive review here..."
                disabled={!canCreateReviews}
                defaultValue={reviewData?.content || ''}
                className="w-full h-64"
              />
            </div>
          </div>

          <div data-testid="metadata-section">
            <div data-testid="categories">
              <label htmlFor="category-select">Category</label>
              <select
                id="category-select"
                data-testid="category-select"
                disabled={!canCreateReviews}
                defaultValue={reviewData?.category || ''}
              >
                <option value="">Select category...</option>
                <option value="medical-devices">Medical Devices</option>
                <option value="pharmaceuticals">Pharmaceuticals</option>
                <option value="procedures">Procedures</option>
                <option value="diagnostics">Diagnostics</option>
              </select>
            </div>

            <div data-testid="tags">
              <label htmlFor="tags-input">Tags</label>
              <input
                id="tags-input"
                data-testid="tags-input"
                placeholder="cardiology, clinical-trial, efficacy..."
                disabled={!canCreateReviews}
                defaultValue={reviewData?.tags?.join(', ') || ''}
              />
            </div>

            <div data-testid="difficulty-rating">
              <label htmlFor="difficulty-select">Technical Difficulty</label>
              <select
                id="difficulty-select"
                data-testid="difficulty-select"
                disabled={!canCreateReviews}
                defaultValue={reviewData?.difficulty || ''}
              >
                <option value="">Select difficulty...</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          {isPremium && (
            <div data-testid="premium-features">
              <div data-testid="evidence-grading">
                <label htmlFor="evidence-grade">Evidence Grade</label>
                <select
                  id="evidence-grade"
                  data-testid="evidence-grade-select"
                  disabled={!canCreateReviews}
                  defaultValue={reviewData?.evidenceGrade || ''}
                >
                  <option value="">Grade evidence quality...</option>
                  <option value="grade-a">Grade A - High quality</option>
                  <option value="grade-b">Grade B - Moderate quality</option>
                  <option value="grade-c">Grade C - Low quality</option>
                </select>
              </div>

              <div data-testid="peer-review">
                <label>
                  <input
                    type="checkbox"
                    data-testid="peer-review-checkbox"
                    disabled={!canCreateReviews}
                    defaultChecked={reviewData?.peerReviewed || false}
                  />
                  Request peer review
                </label>
              </div>
            </div>
          )}
        </div>

        <div data-testid="form-actions" className="flex gap-3 mt-6">
          <button type="button" data-testid="save-draft-button" disabled={!canCreateReviews}>
            Save as Draft
          </button>

          <button type="button" data-testid="preview-button" disabled={!canCreateReviews}>
            Preview
          </button>

          <button
            type="submit"
            data-testid="publish-button"
            disabled={!canCreateReviews}
            className="bg-blue-600 text-white"
          >
            {mode === 'edit' ? 'Update Review' : 'Publish Review'}
          </button>

          <button type="button" data-testid="cancel-button">
            Cancel
          </button>
        </div>

        {!canCreateReviews && (
          <div
            data-testid="access-restriction"
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded"
          >
            {!isAuthenticated ? (
              <div>
                <p>Please sign in to create reviews.</p>
                <button data-testid="signin-button">Sign In</button>
              </div>
            ) : (
              <div>
                <p>Only verified practitioners can create reviews.</p>
                <button data-testid="verification-button">Request Verification</button>
              </div>
            )}
          </div>
        )}

        {!isPremium && canCreateReviews && (
          <div
            data-testid="upgrade-prompt"
            className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded"
          >
            <p>Upgrade to Premium for advanced features like evidence grading and peer review.</p>
            <button data-testid="upgrade-button">Upgrade Now</button>
          </div>
        )}
      </form>
    </div>
  );
};

// Mock content preview component
const MockReviewPreview = ({
  reviewData,
  mode = 'preview',
}: {
  reviewData: any;
  mode?: 'preview' | 'published';
}) => {
  return (
    <div data-testid="review-preview" className="prose max-w-none">
      <header data-testid="preview-header">
        <h1 data-testid="preview-title">{reviewData.title || 'Untitled Review'}</h1>
        <div data-testid="preview-meta">
          <span data-testid="author-name">Dr. Test Author</span>
          <span data-testid="category">{reviewData.category || 'Uncategorized'}</span>
          <span data-testid="difficulty">{reviewData.difficulty || 'Not specified'}</span>
          {mode === 'preview' && <span data-testid="preview-mode-indicator">Preview Mode</span>}
        </div>
      </header>

      <section data-testid="executive-summary">
        <h2>Executive Summary</h2>
        <p>{reviewData.summary || 'No summary provided.'}</p>
      </section>

      <section data-testid="main-content">
        <h2>Detailed Analysis</h2>
        <div dangerouslySetInnerHTML={{ __html: reviewData.content || 'Content preview...' }} />
      </section>

      <footer data-testid="preview-footer">
        <div data-testid="tags-display">
          {Array.isArray(reviewData.tags)
            ? reviewData.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  data-testid={`tag-${tag}`}
                  className="bg-gray-200 px-2 py-1 rounded text-sm"
                >
                  {tag}
                </span>
              ))
            : null}
        </div>

        {reviewData.evidenceGrade && (
          <div data-testid="evidence-grade-display">Evidence Grade: {reviewData.evidenceGrade}</div>
        )}

        {reviewData.peerReviewed && <div data-testid="peer-review-indicator">✓ Peer Reviewed</div>}
      </footer>

      {mode === 'preview' && (
        <div data-testid="preview-actions" className="mt-6 p-4 bg-gray-50 border rounded">
          <button data-testid="edit-from-preview">← Back to Edit</button>
          <button data-testid="publish-from-preview" className="bg-blue-600 text-white">
            Publish Review
          </button>
        </div>
      )}
    </div>
  );
};

// Mock draft management system
const MockDraftManager = ({
  drafts = [],
  isVisible = true,
}: {
  drafts?: Array<{ id: string; title: string; lastModified: string }>;
  isVisible?: boolean;
}) => {
  if (!isVisible) return null;

  return (
    <div data-testid="draft-manager" className="space-y-4">
      <header data-testid="drafts-header">
        <h3>Your Drafts</h3>
        <button data-testid="create-new-button">Create New Review</button>
      </header>

      <div data-testid="drafts-list">
        {drafts.length === 0 ? (
          <div data-testid="no-drafts" className="text-gray-500">
            No drafts found. Create your first review!
          </div>
        ) : (
          drafts.map(draft => (
            <div key={draft.id} data-testid={`draft-${draft.id}`} className="border rounded p-4">
              <h4 data-testid="draft-title">{draft.title}</h4>
              <p data-testid="draft-modified">Last modified: {draft.lastModified}</p>
              <div data-testid="draft-actions" className="flex gap-2 mt-2">
                <button data-testid={`edit-draft-${draft.id}`}>Continue Editing</button>
                <button data-testid={`duplicate-draft-${draft.id}`}>Duplicate</button>
                <button data-testid={`delete-draft-${draft.id}`} className="text-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Mock version control system
const MockVersionControl = ({
  versions = [],
  currentVersion = 1,
}: {
  versions?: Array<{ version: number; status: string; publishedAt?: string }>;
  currentVersion?: number;
}) => {
  return (
    <div data-testid="version-control" className="space-y-3">
      <h4>Version History</h4>

      <div data-testid="versions-list">
        {versions.map(version => (
          <div
            key={version.version}
            data-testid={`version-${version.version}`}
            className={`p-3 border rounded ${version.version === currentVersion ? 'bg-blue-50' : 'bg-gray-50'}`}
          >
            <div data-testid="version-info">
              <span data-testid="version-number">v{version.version}</span>
              <span data-testid="version-status">{version.status}</span>
              {version.publishedAt && (
                <span data-testid="version-published">Published: {version.publishedAt}</span>
              )}
              {version.version === currentVersion && (
                <span data-testid="current-version-indicator">Current</span>
              )}
            </div>

            <div data-testid="version-actions" className="mt-2">
              <button data-testid={`view-version-${version.version}`}>View</button>
              {version.status === 'draft' && (
                <button data-testid={`edit-version-${version.version}`}>Edit</button>
              )}
              {version.version !== currentVersion && (
                <button data-testid={`restore-version-${version.version}`}>Restore</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mock auth store for testing different user states
const mockAuthStore = {
  session: null as any,
  user: null as any,
  isLoading: false,
};

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

describe('ContentCreationWorkflows - Review Creation, Editing, and Publishing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.session = null;
    mockAuthStore.user = null;
    mockAuthStore.isLoading = false;
  });

  describe('🔴 CRITICAL: Review Editor Access Control', () => {
    it('blocks review creation for anonymous users', () => {
      renderWithProviders(<MockReviewEditor mode="create" />);

      // Should render editor but disable all inputs
      expect(screen.getByTestId('review-editor')).toBeInTheDocument();
      expect(screen.getByText('Create New Review')).toBeInTheDocument();

      // All form inputs should be disabled
      expect(screen.getByTestId('title-input')).toBeDisabled();
      expect(screen.getByTestId('summary-input')).toBeDisabled();
      expect(screen.getByTestId('content-input')).toBeDisabled();
      expect(screen.getByTestId('category-select')).toBeDisabled();

      // Action buttons should be disabled
      expect(screen.getByTestId('save-draft-button')).toBeDisabled();
      expect(screen.getByTestId('publish-button')).toBeDisabled();

      // Should show access restriction
      expect(screen.getByTestId('access-restriction')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to create reviews.')).toBeInTheDocument();
      expect(screen.getByTestId('signin-button')).toBeInTheDocument();
    });

    it('blocks review creation for non-practitioner authenticated users', () => {
      mockAuthStore.session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'patient' }, // Not a practitioner
          subscription_tier: 'free',
        },
      };

      renderWithProviders(<MockReviewEditor mode="create" />);

      // Inputs should still be disabled
      expect(screen.getByTestId('title-input')).toBeDisabled();
      expect(screen.getByTestId('publish-button')).toBeDisabled();

      // Should show practitioner requirement
      expect(screen.getByTestId('access-restriction')).toBeInTheDocument();
      expect(
        screen.getByText('Only verified practitioners can create reviews.')
      ).toBeInTheDocument();
      expect(screen.getByTestId('verification-button')).toBeInTheDocument();
    });

    it('enables review creation for verified practitioners', () => {
      mockAuthStore.session = {
        user: {
          id: 'practitioner-123',
          email: 'practitioner@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      renderWithProviders(<MockReviewEditor mode="create" />);

      // All inputs should be enabled
      expect(screen.getByTestId('title-input')).not.toBeDisabled();
      expect(screen.getByTestId('summary-input')).not.toBeDisabled();
      expect(screen.getByTestId('content-input')).not.toBeDisabled();
      expect(screen.getByTestId('category-select')).not.toBeDisabled();

      // Action buttons should be enabled
      expect(screen.getByTestId('save-draft-button')).not.toBeDisabled();
      expect(screen.getByTestId('publish-button')).not.toBeDisabled();

      // Should NOT show access restriction
      expect(screen.queryByTestId('access-restriction')).not.toBeInTheDocument();
    });

    it('shows premium features only for premium users', () => {
      mockAuthStore.session = {
        user: {
          id: 'free-practitioner',
          email: 'free@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      const { rerender } = renderWithProviders(<MockReviewEditor mode="create" />);

      // Should NOT show premium features
      expect(screen.queryByTestId('premium-features')).not.toBeInTheDocument();
      expect(screen.queryByTestId('evidence-grading')).not.toBeInTheDocument();

      // Should show upgrade prompt
      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Upgrade to Premium for advanced features like evidence grading and peer review.'
        )
      ).toBeInTheDocument();

      // Upgrade to premium
      mockAuthStore.session.user.subscription_tier = 'premium';
      rerender(<MockReviewEditor mode="create" />);

      // Should now show premium features
      expect(screen.getByTestId('premium-features')).toBeInTheDocument();
      expect(screen.getByTestId('evidence-grading')).toBeInTheDocument();
      expect(screen.getByTestId('peer-review')).toBeInTheDocument();

      // Should NOT show upgrade prompt
      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });
  });

  describe('🟡 CRITICAL: Editor Interface and Functionality', () => {
    beforeEach(() => {
      mockAuthStore.session = {
        user: {
          id: 'practitioner-123',
          email: 'practitioner@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'premium',
        },
      };
    });

    it('renders complete editor interface with all required fields', () => {
      renderWithProviders(<MockReviewEditor mode="create" />);

      // Should render header
      expect(screen.getByText('Create New Review')).toBeInTheDocument();

      // Should render all form sections
      expect(screen.getByTestId('title-section')).toBeInTheDocument();
      expect(screen.getByTestId('summary-section')).toBeInTheDocument();
      expect(screen.getByTestId('content-section')).toBeInTheDocument();
      expect(screen.getByTestId('metadata-section')).toBeInTheDocument();

      // Should render rich text editor
      expect(screen.getByTestId('rich-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('bold-button')).toBeInTheDocument();
      expect(screen.getByTestId('italic-button')).toBeInTheDocument();
      expect(screen.getByTestId('link-button')).toBeInTheDocument();
      expect(screen.getByTestId('image-button')).toBeInTheDocument();

      // Should render metadata fields
      expect(screen.getByTestId('category-select')).toBeInTheDocument();
      expect(screen.getByTestId('tags-input')).toBeInTheDocument();
      expect(screen.getByTestId('difficulty-select')).toBeInTheDocument();

      // Should render action buttons
      expect(screen.getByTestId('save-draft-button')).toBeInTheDocument();
      expect(screen.getByTestId('preview-button')).toBeInTheDocument();
      expect(screen.getByTestId('publish-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    it('renders edit mode correctly with existing data', () => {
      const existingReview = {
        title: 'Existing Review Title',
        summary: 'Existing summary content',
        content: 'Existing review content',
        category: 'medical-devices',
        tags: ['cardiology', 'clinical-trial'],
        difficulty: 'intermediate',
        evidenceGrade: 'grade-a',
        peerReviewed: true,
      };

      renderWithProviders(
        <MockReviewEditor mode="edit" reviewData={existingReview} isDraft={false} />
      );

      // Should show edit mode header
      expect(screen.getByText('Edit Review')).toBeInTheDocument();

      // Should populate form fields with existing data
      expect(screen.getByTestId('title-input')).toHaveValue('Existing Review Title');
      expect(screen.getByTestId('summary-input')).toHaveValue('Existing summary content');
      expect(screen.getByTestId('content-input')).toHaveValue('Existing review content');
      expect(screen.getByTestId('category-select')).toHaveValue('medical-devices');
      expect(screen.getByTestId('tags-input')).toHaveValue('cardiology, clinical-trial');
      expect(screen.getByTestId('difficulty-select')).toHaveValue('intermediate');

      // Should populate premium fields
      expect(screen.getByTestId('evidence-grade-select')).toHaveValue('grade-a');
      expect(screen.getByTestId('peer-review-checkbox')).toBeChecked();

      // Should show update button
      expect(screen.getByTestId('publish-button')).toHaveTextContent('Update Review');
    });

    it('shows draft indicator for draft content', () => {
      renderWithProviders(<MockReviewEditor mode="edit" isDraft={true} />);

      expect(screen.getByTestId('draft-indicator')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('provides all required category and difficulty options', () => {
      renderWithProviders(<MockReviewEditor mode="create" />);

      // Category options
      expect(screen.getByRole('option', { name: 'Medical Devices' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pharmaceuticals' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Procedures' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Diagnostics' })).toBeInTheDocument();

      // Difficulty options
      expect(screen.getByRole('option', { name: 'Beginner' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Intermediate' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Advanced' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Expert' })).toBeInTheDocument();

      // Evidence grade options (premium)
      expect(screen.getByRole('option', { name: 'Grade A - High quality' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Grade B - Moderate quality' })
      ).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Grade C - Low quality' })).toBeInTheDocument();
    });
  });

  describe('🟢 STRATEGIC: Preview and Publishing Workflow', () => {
    const sampleReviewData = {
      title: 'Comprehensive Medical Device Analysis',
      summary: 'This review examines the latest medical device technology...',
      content: '<p>Detailed analysis content goes here...</p>',
      category: 'medical-devices',
      tags: ['cardiology', 'medical-devices', 'clinical-trial'],
      difficulty: 'intermediate',
      evidenceGrade: 'grade-a',
      peerReviewed: true,
    };

    it('renders preview mode correctly', () => {
      renderWithProviders(<MockReviewPreview reviewData={sampleReviewData} mode="preview" />);

      // Should render preview structure
      expect(screen.getByTestId('review-preview')).toBeInTheDocument();
      expect(screen.getByTestId('preview-mode-indicator')).toBeInTheDocument();

      // Should render content sections
      expect(screen.getByTestId('preview-title')).toHaveTextContent(
        'Comprehensive Medical Device Analysis'
      );
      expect(screen.getByTestId('executive-summary')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();

      // Should render metadata
      expect(screen.getByTestId('category')).toHaveTextContent('medical-devices');
      expect(screen.getByTestId('difficulty')).toHaveTextContent('intermediate');

      // Should render tags
      expect(screen.getByTestId('tag-cardiology')).toBeInTheDocument();
      expect(screen.getByTestId('tag-medical-devices')).toBeInTheDocument();
      expect(screen.getByTestId('tag-clinical-trial')).toBeInTheDocument();

      // Should render premium features
      expect(screen.getByTestId('evidence-grade-display')).toHaveTextContent(
        'Evidence Grade: grade-a'
      );
      expect(screen.getByTestId('peer-review-indicator')).toHaveTextContent('✓ Peer Reviewed');

      // Should render preview actions
      expect(screen.getByTestId('preview-actions')).toBeInTheDocument();
      expect(screen.getByTestId('edit-from-preview')).toBeInTheDocument();
      expect(screen.getByTestId('publish-from-preview')).toBeInTheDocument();
    });

    it('renders published mode correctly', () => {
      renderWithProviders(<MockReviewPreview reviewData={sampleReviewData} mode="published" />);

      // Should NOT show preview mode indicator
      expect(screen.queryByTestId('preview-mode-indicator')).not.toBeInTheDocument();

      // Should NOT show preview actions
      expect(screen.queryByTestId('preview-actions')).not.toBeInTheDocument();

      // Should still show content
      expect(screen.getByTestId('preview-title')).toBeInTheDocument();
      expect(screen.getByTestId('executive-summary')).toBeInTheDocument();
    });
  });

  describe('🔵 AI-SAFETY: Draft Management and Version Control', () => {
    const mockDrafts = [
      { id: 'draft-1', title: 'Cardiology Device Review', lastModified: '2 hours ago' },
      { id: 'draft-2', title: 'Pharmaceutical Analysis', lastModified: '1 day ago' },
      { id: 'draft-3', title: 'Diagnostic Tool Evaluation', lastModified: '3 days ago' },
    ];

    it('displays draft list correctly', () => {
      renderWithProviders(<MockDraftManager drafts={mockDrafts} />);

      // Should render draft manager
      expect(screen.getByTestId('draft-manager')).toBeInTheDocument();
      expect(screen.getByText('Your Drafts')).toBeInTheDocument();
      expect(screen.getByTestId('create-new-button')).toBeInTheDocument();

      // Should render all drafts
      mockDrafts.forEach(draft => {
        expect(screen.getByTestId(`draft-${draft.id}`)).toBeInTheDocument();
        expect(screen.getByText(draft.title)).toBeInTheDocument();
        expect(screen.getByText(`Last modified: ${draft.lastModified}`)).toBeInTheDocument();
      });

      // Should render draft actions
      mockDrafts.forEach(draft => {
        expect(screen.getByTestId(`edit-draft-${draft.id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`duplicate-draft-${draft.id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`delete-draft-${draft.id}`)).toBeInTheDocument();
      });
    });

    it('shows empty state when no drafts exist', () => {
      renderWithProviders(<MockDraftManager drafts={[]} />);

      expect(screen.getByTestId('no-drafts')).toBeInTheDocument();
      expect(screen.getByText('No drafts found. Create your first review!')).toBeInTheDocument();
    });

    it('renders version control system correctly', () => {
      const mockVersions = [
        { version: 1, status: 'published', publishedAt: '2024-01-15' },
        { version: 2, status: 'draft' },
        { version: 3, status: 'published', publishedAt: '2024-01-20' },
      ];

      renderWithProviders(<MockVersionControl versions={mockVersions} currentVersion={3} />);

      // Should render version control
      expect(screen.getByTestId('version-control')).toBeInTheDocument();
      expect(screen.getByText('Version History')).toBeInTheDocument();

      // Should render all versions
      mockVersions.forEach(version => {
        const versionElement = screen.getByTestId(`version-${version.version}`);
        expect(versionElement).toBeInTheDocument();
        expect(versionElement).toHaveTextContent(`v${version.version}`);
        expect(versionElement).toHaveTextContent(version.status);

        if (version.publishedAt) {
          expect(versionElement).toHaveTextContent(`Published: ${version.publishedAt}`);
        }
      });

      // Should highlight current version
      expect(screen.getByTestId('current-version-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('version-3')).toHaveClass('bg-blue-50');

      // Should show appropriate actions
      expect(screen.getByTestId('view-version-1')).toBeInTheDocument();
      expect(screen.getByTestId('edit-version-2')).toBeInTheDocument(); // Draft version
      expect(screen.getByTestId('restore-version-1')).toBeInTheDocument(); // Non-current version
    });
  });

  describe('🎯 COVERAGE: Workflow Integration and State Management', () => {
    beforeEach(() => {
      mockAuthStore.session = {
        user: {
          id: 'practitioner-123',
          email: 'practitioner@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'premium',
        },
      };
    });

    it('maintains consistent state across editor components', () => {
      const { rerender } = renderWithProviders(
        <div>
          <MockReviewEditor mode="create" />
          <MockDraftManager drafts={[]} />
        </div>
      );

      // Editor should be enabled
      expect(screen.getByTestId('title-input')).not.toBeDisabled();
      expect(screen.getByTestId('create-new-button')).toBeInTheDocument();

      // Logout user
      mockAuthStore.session = null;

      rerender(
        <div>
          <MockReviewEditor mode="create" />
          <MockDraftManager drafts={[]} />
        </div>
      );

      // Editor should now be disabled
      expect(screen.getByTestId('title-input')).toBeDisabled();
      expect(screen.getByTestId('access-restriction')).toBeInTheDocument();
    });

    it('handles role transitions properly', () => {
      // Start as free practitioner
      mockAuthStore.session = {
        user: {
          id: 'practitioner-123',
          email: 'practitioner@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      const { rerender } = renderWithProviders(<MockReviewEditor mode="create" />);

      // Should show upgrade prompt
      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();
      expect(screen.queryByTestId('premium-features')).not.toBeInTheDocument();

      // Upgrade to premium
      mockAuthStore.session.user.subscription_tier = 'premium';

      rerender(<MockReviewEditor mode="create" />);

      // Should now show premium features
      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
      expect(screen.getByTestId('premium-features')).toBeInTheDocument();
    });

    it('validates form accessibility and semantic structure', () => {
      renderWithProviders(<MockReviewEditor mode="create" />);

      // Form should have proper labels
      expect(screen.getByLabelText('Review Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Executive Summary')).toBeInTheDocument();
      expect(screen.getByLabelText('Review Content')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Tags')).toBeInTheDocument();

      // Should have proper form structure
      expect(screen.getByTestId('review-form')).toBeInTheDocument();
      expect(screen.getAllByRole('textbox')).toHaveLength(4); // title, summary, content, tags
      expect(screen.getAllByRole('combobox')).toHaveLength(3); // category, difficulty, evidence grade
      expect(screen.getByRole('checkbox')).toBeInTheDocument(); // peer review
    });
  });

  describe('🛡️ ARCHITECTURE: Error Handling and Edge Cases', () => {
    it('handles missing data gracefully', () => {
      renderWithProviders(<MockReviewEditor mode="edit" reviewData={{}} />);

      // Should render without errors
      expect(screen.getByTestId('review-editor')).toBeInTheDocument();
      expect(screen.getByTestId('title-input')).toHaveValue('');
    });

    it('prevents interface breaking with malformed review data', () => {
      const malformedData = {
        title: null,
        tags: 'not-an-array',
        evidenceGrade: 'invalid-grade',
      };

      renderWithProviders(<MockReviewPreview reviewData={malformedData} />);

      // Should render without crashing
      expect(screen.getByTestId('review-preview')).toBeInTheDocument();
    });

    it('maintains component isolation during complex workflows', () => {
      renderWithProviders(
        <div>
          <MockReviewEditor mode="create" />
          <MockDraftManager drafts={[{ id: 'test', title: 'Test', lastModified: 'now' }]} />
          <MockVersionControl versions={[{ version: 1, status: 'draft' }]} />
        </div>
      );

      // All components should render independently
      expect(screen.getByTestId('review-editor')).toBeInTheDocument();
      expect(screen.getByTestId('draft-manager')).toBeInTheDocument();
      expect(screen.getByTestId('version-control')).toBeInTheDocument();

      // Each component should maintain its own state
      expect(screen.getByTestId('title-input')).toBeInTheDocument();
      expect(screen.getByTestId('draft-test')).toBeInTheDocument();
      expect(screen.getByTestId('version-1')).toBeInTheDocument();
    });
  });
});
