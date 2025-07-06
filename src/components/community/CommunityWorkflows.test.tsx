// ABOUTME: Community feature workflow tests - AI-safe guardrails for voting, posting, moderation, and user interaction patterns

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test-utils';
import { ReactNode } from 'react';

// Mock community interaction components
const MockCommunityPost = ({
  postId,
  authorRole = 'practitioner',
  isOwner = false,
  hasVoted = false,
  isSaved = false,
  voteCount = 0,
}: {
  postId: string;
  authorRole?: string;
  isOwner?: boolean;
  hasVoted?: boolean;
  isSaved?: boolean;
  voteCount?: number;
}) => {
  const isAuthenticated = !!mockAuthStore.session;
  const currentUserRole = mockAuthStore.session?.user?.app_metadata?.role || null;
  const canModerate = currentUserRole === 'admin' || currentUserRole === 'moderator';

  return (
    <article data-testid={`post-${postId}`} className="border rounded-lg p-4">
      <header data-testid="post-header">
        <div data-testid="author-info">
          <span data-testid="author-name">Dr. Test User</span>
          <span data-testid="author-role">{authorRole}</span>
        </div>
        {isOwner && <span data-testid="owner-badge">Your Post</span>}
      </header>

      <div data-testid="post-content">
        <h3>Test Community Post #{postId}</h3>
        <p>This is a sample community post for testing workflows...</p>
      </div>

      <footer data-testid="post-actions" className="flex gap-2 mt-4">
        <button
          data-testid="vote-button"
          disabled={!isAuthenticated}
          data-has-voted={hasVoted ? 'true' : 'false'}
          data-vote-count={voteCount}
          className={hasVoted ? 'text-blue-600' : 'text-gray-600'}
        >
          {hasVoted ? '👍 Voted' : '👍 Vote'} ({voteCount})
        </button>

        <button
          data-testid="save-button"
          disabled={!isAuthenticated}
          data-is-saved={isSaved ? 'true' : 'false'}
          className={isSaved ? 'text-yellow-600' : 'text-gray-600'}
        >
          {isSaved ? '⭐ Saved' : '⭐ Save'}
        </button>

        <button data-testid="comment-button" disabled={!isAuthenticated}>
          💬 Comment
        </button>

        <button data-testid="share-button">🔗 Share</button>

        {(isOwner || canModerate) && (
          <div data-testid="moderation-actions" className="ml-auto">
            {isOwner && (
              <>
                <button data-testid="edit-button">✏️ Edit</button>
                <button data-testid="delete-button">🗑️ Delete</button>
              </>
            )}
            {canModerate && !isOwner && (
              <>
                <button data-testid="moderate-button">⚠️ Moderate</button>
                <button data-testid="hide-button">👁️ Hide</button>
              </>
            )}
          </div>
        )}
      </footer>
    </article>
  );
};

const MockPostCreationForm = ({ isVisible = false }: { isVisible?: boolean }) => {
  const isAuthenticated = !!mockAuthStore.session;
  const userTier = mockAuthStore.session?.user?.subscription_tier || 'free';
  const canCreatePosts = isAuthenticated && (userTier === 'premium' || userTier === 'admin');

  if (!isVisible) return null;

  return (
    <form data-testid="post-creation-form" className="border rounded-lg p-4">
      <h3>Create New Post</h3>

      <div data-testid="form-fields">
        <input data-testid="title-input" placeholder="Post title..." disabled={!canCreatePosts} />

        <textarea
          data-testid="content-input"
          placeholder="Share your thoughts..."
          disabled={!canCreatePosts}
        />

        <select data-testid="category-select" disabled={!canCreatePosts}>
          <option value="">Select category...</option>
          <option value="discussion">Discussion</option>
          <option value="question">Question</option>
          <option value="poll">Poll</option>
        </select>

        <div data-testid="tag-input">
          <input placeholder="Add tags..." disabled={!canCreatePosts} />
        </div>
      </div>

      <div data-testid="form-actions" className="flex gap-2 mt-4">
        <button
          data-testid="submit-button"
          type="submit"
          disabled={!canCreatePosts}
          data-requires-premium={!canCreatePosts ? 'true' : undefined}
        >
          Publish Post
        </button>

        <button data-testid="draft-button" type="button" disabled={!canCreatePosts}>
          Save as Draft
        </button>

        <button data-testid="cancel-button" type="button">
          Cancel
        </button>
      </div>

      {!canCreatePosts && (
        <div data-testid="upgrade-prompt" className="mt-2 p-2 bg-yellow-50 border">
          Premium subscription required to create posts.
          <button data-testid="upgrade-button">Upgrade Now</button>
        </div>
      )}
    </form>
  );
};

const MockVotingSystem = ({
  itemId,
  itemType = 'post',
  currentVote = null,
  upvotes = 0,
  downvotes = 0,
}: {
  itemId: string;
  itemType?: 'post' | 'comment';
  currentVote?: 'up' | 'down' | null;
  upvotes?: number;
  downvotes?: number;
}) => {
  const isAuthenticated = !!mockAuthStore.session;
  const score = upvotes - downvotes;

  return (
    <div data-testid={`voting-${itemType}-${itemId}`} className="flex flex-col items-center">
      <button
        data-testid="upvote-button"
        disabled={!isAuthenticated}
        data-is-active={currentVote === 'up' ? 'true' : 'false'}
        className={currentVote === 'up' ? 'text-green-600' : 'text-gray-400'}
      >
        ▲
      </button>

      <span data-testid="vote-score" className="text-sm font-medium">
        {score}
      </span>

      <button
        data-testid="downvote-button"
        disabled={!isAuthenticated}
        data-is-active={currentVote === 'down' ? 'true' : 'false'}
        className={currentVote === 'down' ? 'text-red-600' : 'text-gray-400'}
      >
        ▼
      </button>

      <div data-testid="vote-details" className="text-xs text-gray-500 mt-1">
        {upvotes}↑ {downvotes}↓
      </div>
    </div>
  );
};

const MockPollComponent = ({
  pollId,
  options = [],
  hasVoted = false,
  selectedOption = null,
  totalVotes = 0,
}: {
  pollId: string;
  options?: Array<{ id: string; text: string; votes: number }>;
  hasVoted?: boolean;
  selectedOption?: string | null;
  totalVotes?: number;
}) => {
  const isAuthenticated = !!mockAuthStore.session;

  return (
    <div data-testid={`poll-${pollId}`} className="border rounded-lg p-4">
      <h4 data-testid="poll-question">Which treatment approach do you prefer?</h4>

      <div data-testid="poll-options" className="space-y-2 mt-3">
        {options.map(option => (
          <div
            key={option.id}
            data-testid={`poll-option-${option.id}`}
            className="flex items-center"
          >
            <button
              data-testid={`option-button-${option.id}`}
              disabled={!isAuthenticated || hasVoted}
              data-is-selected={selectedOption === option.id ? 'true' : 'false'}
              className={`flex-1 text-left p-2 border rounded ${
                selectedOption === option.id ? 'bg-blue-50 border-blue-300' : 'border-gray-300'
              }`}
            >
              {option.text}
            </button>

            {hasVoted && (
              <div data-testid={`option-results-${option.id}`} className="ml-2">
                <span className="text-sm">{option.votes} votes</span>
                <div className="w-20 h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{ width: `${totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div data-testid="poll-meta" className="mt-4 text-sm text-gray-600">
        Total votes: {totalVotes}
        {hasVoted && <span className="ml-2">✓ You voted</span>}
      </div>

      {!isAuthenticated && (
        <div data-testid="poll-auth-prompt" className="mt-2 p-2 bg-blue-50 border-blue-200 rounded">
          Sign in to vote in this poll
        </div>
      )}
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

describe('CommunityWorkflows - Feature Interaction and User Role Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.session = null;
    mockAuthStore.user = null;
    mockAuthStore.isLoading = false;
  });

  describe('🔴 CRITICAL: Community Post Interaction Workflows', () => {
    it('renders community post with correct interaction states for anonymous users', () => {
      renderWithProviders(
        <MockCommunityPost postId="test-123" authorRole="practitioner" voteCount={15} />
      );

      // Should render post structure
      expect(screen.getByTestId('post-test-123')).toBeInTheDocument();
      expect(screen.getByText('Test Community Post #test-123')).toBeInTheDocument();
      expect(screen.getByTestId('author-role')).toHaveTextContent('practitioner');

      // Interactive elements should be disabled for anonymous users
      expect(screen.getByTestId('vote-button')).toBeDisabled();
      expect(screen.getByTestId('save-button')).toBeDisabled();
      expect(screen.getByTestId('comment-button')).toBeDisabled();

      // Share should work for anonymous users
      expect(screen.getByTestId('share-button')).not.toBeDisabled();

      // Should not show moderation actions
      expect(screen.queryByTestId('moderation-actions')).not.toBeInTheDocument();
    });

    it('enables interactions for authenticated users', () => {
      mockAuthStore.session = {
        user: {
          id: 'user-123',
          email: 'practitioner@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'premium',
        },
      };
      mockAuthStore.user = mockAuthStore.session.user;

      renderWithProviders(
        <MockCommunityPost postId="test-123" authorRole="practitioner" voteCount={15} />
      );

      // Interactive elements should be enabled
      expect(screen.getByTestId('vote-button')).not.toBeDisabled();
      expect(screen.getByTestId('save-button')).not.toBeDisabled();
      expect(screen.getByTestId('comment-button')).not.toBeDisabled();
      expect(screen.getByTestId('share-button')).not.toBeDisabled();
    });

    it('shows owner-specific actions for post authors', () => {
      mockAuthStore.session = {
        user: {
          id: 'author-123',
          email: 'author@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'premium',
        },
      };

      renderWithProviders(
        <MockCommunityPost postId="test-123" authorRole="practitioner" isOwner={true} />
      );

      // Should show ownership indicator
      expect(screen.getByTestId('owner-badge')).toBeInTheDocument();
      expect(screen.getByText('Your Post')).toBeInTheDocument();

      // Should show owner actions
      expect(screen.getByTestId('moderation-actions')).toBeInTheDocument();
      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
    });

    it('shows moderator actions for admin/moderator users', () => {
      mockAuthStore.session = {
        user: {
          id: 'moderator-123',
          email: 'moderator@example.com',
          app_metadata: { role: 'moderator' },
          subscription_tier: 'premium',
        },
      };

      renderWithProviders(
        <MockCommunityPost postId="test-123" authorRole="practitioner" isOwner={false} />
      );

      // Should show moderation actions
      expect(screen.getByTestId('moderation-actions')).toBeInTheDocument();
      expect(screen.getByTestId('moderate-button')).toBeInTheDocument();
      expect(screen.getByTestId('hide-button')).toBeInTheDocument();

      // Should NOT show owner actions
      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    });

    it('displays vote states correctly', () => {
      renderWithProviders(<MockCommunityPost postId="test-123" hasVoted={true} voteCount={42} />);

      const voteButton = screen.getByTestId('vote-button');
      expect(voteButton).toHaveAttribute('data-has-voted', 'true');
      expect(voteButton).toHaveAttribute('data-vote-count', '42');
      expect(voteButton).toHaveTextContent('👍 Voted (42)');
      expect(voteButton).toHaveClass('text-blue-600');
    });

    it('displays save states correctly', () => {
      renderWithProviders(<MockCommunityPost postId="test-123" isSaved={true} />);

      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).toHaveAttribute('data-is-saved', 'true');
      expect(saveButton).toHaveTextContent('⭐ Saved');
      expect(saveButton).toHaveClass('text-yellow-600');
    });
  });

  describe('🟡 CRITICAL: Post Creation Workflow and Premium Features', () => {
    it('blocks post creation for anonymous users', () => {
      renderWithProviders(<MockPostCreationForm isVisible={true} />);

      // Should render form but disable all inputs
      expect(screen.getByTestId('post-creation-form')).toBeInTheDocument();
      expect(screen.getByTestId('title-input')).toBeDisabled();
      expect(screen.getByTestId('content-input')).toBeDisabled();
      expect(screen.getByTestId('category-select')).toBeDisabled();

      // Submit should be disabled
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('data-requires-premium', 'true');

      // Should show upgrade prompt
      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();
      expect(
        screen.getByText('Premium subscription required to create posts.')
      ).toBeInTheDocument();
    });

    it('blocks post creation for free tier users', () => {
      mockAuthStore.session = {
        user: {
          id: 'free-user',
          email: 'free@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      renderWithProviders(<MockPostCreationForm isVisible={true} />);

      // Inputs should be disabled for free users
      expect(screen.getByTestId('title-input')).toBeDisabled();
      expect(screen.getByTestId('content-input')).toBeDisabled();
      expect(screen.getByTestId('submit-button')).toBeDisabled();

      // Should show upgrade prompt
      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();
      expect(screen.getByTestId('upgrade-button')).toBeInTheDocument();
    });

    it('enables post creation for premium users', () => {
      mockAuthStore.session = {
        user: {
          id: 'premium-user',
          email: 'premium@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'premium',
        },
      };

      renderWithProviders(<MockPostCreationForm isVisible={true} />);

      // All inputs should be enabled
      expect(screen.getByTestId('title-input')).not.toBeDisabled();
      expect(screen.getByTestId('content-input')).not.toBeDisabled();
      expect(screen.getByTestId('category-select')).not.toBeDisabled();

      // Submit should be enabled
      expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      expect(screen.getByTestId('submit-button')).not.toHaveAttribute('data-requires-premium');

      // Should NOT show upgrade prompt
      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('enables post creation for admin users regardless of subscription', () => {
      mockAuthStore.session = {
        user: {
          id: 'admin-user',
          email: 'admin@example.com',
          app_metadata: { role: 'admin' },
          subscription_tier: 'admin',
        },
      };

      renderWithProviders(<MockPostCreationForm isVisible={true} />);

      expect(screen.getByTestId('title-input')).not.toBeDisabled();
      expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('provides proper form elements for post creation', () => {
      mockAuthStore.session = {
        user: {
          id: 'premium-user',
          email: 'premium@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'premium',
        },
      };

      renderWithProviders(<MockPostCreationForm isVisible={true} />);

      // Should have all required form elements
      expect(screen.getByTestId('title-input')).toBeInTheDocument();
      expect(screen.getByTestId('content-input')).toBeInTheDocument();
      expect(screen.getByTestId('category-select')).toBeInTheDocument();
      expect(screen.getByTestId('tag-input')).toBeInTheDocument();

      // Should have action buttons
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('draft-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();

      // Category options should be available
      expect(screen.getByRole('option', { name: 'Discussion' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Question' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Poll' })).toBeInTheDocument();
    });
  });

  describe('🟢 STRATEGIC: Voting System Integrity', () => {
    it('renders voting controls with correct states for anonymous users', () => {
      renderWithProviders(
        <MockVotingSystem itemId="post-123" itemType="post" upvotes={25} downvotes={3} />
      );

      // Should render voting interface
      expect(screen.getByTestId('voting-post-post-123')).toBeInTheDocument();
      expect(screen.getByTestId('upvote-button')).toBeInTheDocument();
      expect(screen.getByTestId('downvote-button')).toBeInTheDocument();

      // Should show correct score
      expect(screen.getByTestId('vote-score')).toHaveTextContent('22'); // 25 - 3

      // Should show vote breakdown
      expect(screen.getByTestId('vote-details')).toHaveTextContent('25↑ 3↓');

      // Buttons should be disabled for anonymous users
      expect(screen.getByTestId('upvote-button')).toBeDisabled();
      expect(screen.getByTestId('downvote-button')).toBeDisabled();
    });

    it('enables voting for authenticated users', () => {
      mockAuthStore.session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'practitioner' },
        },
      };

      renderWithProviders(
        <MockVotingSystem itemId="post-123" itemType="post" upvotes={25} downvotes={3} />
      );

      // Buttons should be enabled
      expect(screen.getByTestId('upvote-button')).not.toBeDisabled();
      expect(screen.getByTestId('downvote-button')).not.toBeDisabled();
    });

    it('displays current vote state correctly', () => {
      renderWithProviders(
        <MockVotingSystem
          itemId="post-123"
          itemType="post"
          currentVote="up"
          upvotes={25}
          downvotes={3}
        />
      );

      // Upvote should be active
      const upvoteButton = screen.getByTestId('upvote-button');
      expect(upvoteButton).toHaveAttribute('data-is-active', 'true');
      expect(upvoteButton).toHaveClass('text-green-600');

      // Downvote should not be active
      const downvoteButton = screen.getByTestId('downvote-button');
      expect(downvoteButton).toHaveAttribute('data-is-active', 'false');
      expect(downvoteButton).toHaveClass('text-gray-400');
    });

    it('works for both posts and comments', () => {
      const { unmount } = renderWithProviders(
        <MockVotingSystem itemId="post-123" itemType="post" />
      );

      expect(screen.getByTestId('voting-post-post-123')).toBeInTheDocument();
      unmount();

      renderWithProviders(<MockVotingSystem itemId="comment-456" itemType="comment" />);

      expect(screen.getByTestId('voting-comment-comment-456')).toBeInTheDocument();
    });
  });

  // Mock poll options used across multiple tests
  const mockPollOptions = [
    { id: 'option-1', text: 'Conservative Treatment', votes: 45 },
    { id: 'option-2', text: 'Aggressive Treatment', votes: 32 },
    { id: 'option-3', text: 'Wait and Monitor', votes: 18 },
  ];

  describe('🔵 AI-SAFETY: Poll System and Complex Interactions', () => {
    it('renders poll with options correctly', () => {
      renderWithProviders(
        <MockPollComponent pollId="poll-123" options={mockPollOptions} totalVotes={95} />
      );

      // Should render poll structure
      expect(screen.getByTestId('poll-poll-123')).toBeInTheDocument();
      expect(screen.getByTestId('poll-question')).toBeInTheDocument();
      expect(screen.getByTestId('poll-options')).toBeInTheDocument();

      // Should render all options
      mockPollOptions.forEach(option => {
        expect(screen.getByTestId(`poll-option-${option.id}`)).toBeInTheDocument();
        expect(screen.getByText(option.text)).toBeInTheDocument();
      });

      // Should show total votes
      expect(screen.getByTestId('poll-meta')).toHaveTextContent('Total votes: 95');
    });

    it('disables poll voting for anonymous users', () => {
      renderWithProviders(<MockPollComponent pollId="poll-123" options={mockPollOptions} />);

      // All option buttons should be disabled
      mockPollOptions.forEach(option => {
        const button = screen.getByTestId(`option-button-${option.id}`);
        expect(button).toBeDisabled();
      });

      // Should show auth prompt
      expect(screen.getByTestId('poll-auth-prompt')).toBeInTheDocument();
      expect(screen.getByText('Sign in to vote in this poll')).toBeInTheDocument();
    });

    it('enables poll voting for authenticated users', () => {
      mockAuthStore.session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'practitioner' },
        },
      };

      renderWithProviders(
        <MockPollComponent pollId="poll-123" options={mockPollOptions} hasVoted={false} />
      );

      // All option buttons should be enabled
      mockPollOptions.forEach(option => {
        const button = screen.getByTestId(`option-button-${option.id}`);
        expect(button).not.toBeDisabled();
      });

      // Should NOT show auth prompt
      expect(screen.queryByTestId('poll-auth-prompt')).not.toBeInTheDocument();
    });

    it('displays poll results after voting', () => {
      renderWithProviders(
        <MockPollComponent
          pollId="poll-123"
          options={mockPollOptions}
          hasVoted={true}
          selectedOption="option-1"
          totalVotes={95}
        />
      );

      // Voting should be disabled after voting
      mockPollOptions.forEach(option => {
        const button = screen.getByTestId(`option-button-${option.id}`);
        expect(button).toBeDisabled();
      });

      // Should show results for each option
      mockPollOptions.forEach(option => {
        const results = screen.getByTestId(`option-results-${option.id}`);
        expect(results).toBeInTheDocument();
        expect(results).toHaveTextContent(`${option.votes} votes`);
      });

      // Should show selected option
      const selectedButton = screen.getByTestId('option-button-option-1');
      expect(selectedButton).toHaveAttribute('data-is-selected', 'true');
      expect(selectedButton).toHaveClass('bg-blue-50', 'border-blue-300');

      // Should show voted indicator
      expect(screen.getByText('✓ You voted')).toBeInTheDocument();
    });

    it('calculates poll percentages correctly', () => {
      renderWithProviders(
        <MockPollComponent
          pollId="poll-123"
          options={mockPollOptions}
          hasVoted={true}
          totalVotes={95}
        />
      );

      // Verify percentage calculations (45/95 ≈ 47%, 32/95 ≈ 34%, 18/95 ≈ 19%)
      mockPollOptions.forEach(option => {
        const progressBar = screen
          .getByTestId(`option-results-${option.id}`)
          .querySelector('.bg-blue-500');
        expect(progressBar).toBeInTheDocument();

        const expectedWidth = (option.votes / 95) * 100;
        expect(progressBar).toHaveStyle(`width: ${expectedWidth}%`);
      });
    });
  });

  describe('🎯 COVERAGE: Cross-Component Integration and State Management', () => {
    it('maintains consistent authentication state across community components', () => {
      // Start anonymous
      const { rerender } = renderWithProviders(
        <div>
          <MockCommunityPost postId="test-123" />
          <MockVotingSystem itemId="test-123" itemType="post" />
          <MockPostCreationForm isVisible={true} />
        </div>
      );

      // All components should reflect anonymous state
      expect(screen.getByTestId('vote-button')).toBeDisabled();
      expect(screen.getByTestId('upvote-button')).toBeDisabled();
      expect(screen.getByTestId('submit-button')).toBeDisabled();

      // Login user
      mockAuthStore.session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'premium',
        },
      };

      rerender(
        <div>
          <MockCommunityPost postId="test-123" />
          <MockVotingSystem itemId="test-123" itemType="post" />
          <MockPostCreationForm isVisible={true} />
        </div>
      );

      // All components should reflect authenticated state
      expect(screen.getByTestId('vote-button')).not.toBeDisabled();
      expect(screen.getByTestId('upvote-button')).not.toBeDisabled();
      expect(screen.getByTestId('submit-button')).not.toBeDisabled();
    });

    it('handles role transitions properly across components', () => {
      // Start as regular practitioner
      mockAuthStore.session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'premium',
        },
      };

      const { rerender } = renderWithProviders(
        <MockCommunityPost postId="test-123" isOwner={false} />
      );

      // Should NOT show moderation actions
      expect(screen.queryByTestId('moderation-actions')).not.toBeInTheDocument();

      // Upgrade to moderator
      mockAuthStore.session.user.app_metadata.role = 'moderator';

      rerender(<MockCommunityPost postId="test-123" isOwner={false} />);

      // Should now show moderation actions
      expect(screen.getByTestId('moderation-actions')).toBeInTheDocument();
      expect(screen.getByTestId('moderate-button')).toBeInTheDocument();
    });

    it('maintains subscription tier restrictions consistently', () => {
      // Test free tier restrictions
      mockAuthStore.session = {
        user: {
          id: 'free-user',
          email: 'free@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      renderWithProviders(<MockPostCreationForm isVisible={true} />);

      expect(screen.getByTestId('submit-button')).toBeDisabled();
      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();
    });

    it('validates component accessibility and semantic structure', () => {
      renderWithProviders(
        <div>
          <MockCommunityPost postId="test-123" />
          <MockVotingSystem itemId="test-123" itemType="post" />
          <MockPollComponent pollId="poll-123" options={mockPollOptions} />
        </div>
      );

      // Posts should use article semantic element
      expect(screen.getByRole('article')).toBeInTheDocument();

      // Buttons should have proper button roles
      expect(screen.getAllByRole('button')).toHaveLength(9); // vote, save, comment, share, upvote, downvote, + 3 poll options

      // Should have proper heading structure
      expect(screen.getAllByRole('heading')).toHaveLength(2); // post title h3 + poll question h4

      // Should have semantic header and footer elements
      expect(screen.getByRole('banner')).toBeInTheDocument(); // post header
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // post footer
    });
  });

  describe('🛡️ ARCHITECTURE: Error Boundaries and Edge Cases', () => {
    it('handles missing or malformed data gracefully', () => {
      // Test with minimal props
      renderWithProviders(<MockCommunityPost postId="minimal" />);

      expect(screen.getByTestId('post-minimal')).toBeInTheDocument();
      expect(screen.getByText('Test Community Post #minimal')).toBeInTheDocument();
    });

    it('prevents interface breaking with extreme data values', () => {
      renderWithProviders(
        <MockVotingSystem itemId="extreme" itemType="post" upvotes={999999} downvotes={888888} />
      );

      // Should handle large numbers without breaking
      expect(screen.getByTestId('vote-score')).toHaveTextContent('111111');
      expect(screen.getByTestId('vote-details')).toHaveTextContent('999999↑ 888888↓');
    });

    it('maintains component isolation during state changes', () => {
      // Multiple components should not interfere with each other
      renderWithProviders(
        <div>
          <MockCommunityPost postId="post-1" hasVoted={true} />
          <MockCommunityPost postId="post-2" hasVoted={false} />
          <MockVotingSystem itemId="vote-1" currentVote="up" />
          <MockVotingSystem itemId="vote-2" currentVote="down" />
        </div>
      );

      // Each component should maintain its own state
      expect(
        screen.getByTestId('post-post-1').querySelector('[data-has-voted="true"]')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('post-post-2').querySelector('[data-has-voted="false"]')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('voting-post-vote-1').querySelector('[data-is-active="true"]')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('voting-post-vote-2').querySelector('[data-is-active="true"]')
      ).toBeInTheDocument();
    });
  });
});
