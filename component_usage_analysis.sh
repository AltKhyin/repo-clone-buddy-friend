#!/bin/bash

# Component Usage Analysis Script
cd "/mnt/c/Users/Igor Cogo Koehler/Desktop/Repo/Repositório EVIDENS/Reviews/Main Branch/repo-clone-buddy-friend"

echo "=== EVIDENS COMPONENT USAGE ANALYSIS ==="
echo "Generated on: $(date)"
echo ""

# Function to analyze component usage
analyze_component() {
    local component_name=$1
    local file_path=$2
    
    # Count total references
    local count=$(rg "$component_name" src --type-add 'tsx:*.tsx' --type-add 'ts:*.ts' -t tsx -t ts | wc -l)
    
    # Get actual usage locations (imports and JSX usage)
    local usage=$(rg "$component_name" src --type-add 'tsx:*.tsx' --type-add 'ts:*.ts' -t tsx -t ts | head -3)
    
    echo "  $component_name: $count references"
    if [ $count -eq 0 ]; then
        echo "    ❌ POTENTIAL DEAD CODE"
    elif [ $count -eq 1 ]; then
        echo "    ⚠️  SINGLE REFERENCE (check if only self-reference)"
    else
        echo "    ✅ ACTIVELY USED"
    fi
    echo ""
}

echo "1. ROOT LEVEL COMPONENTS:"
analyze_component "ErrorBoundary" "src/components/ErrorBoundary.tsx"

echo "2. ACERVO COMPONENTS:"
analyze_component "ClientSideSorter" "src/components/acervo/ClientSideSorter.tsx"
analyze_component "MasonryGrid" "src/components/acervo/MasonryGrid.tsx"
analyze_component "MobileTagsModal" "src/components/acervo/MobileTagsModal.tsx"
analyze_component "ReviewCard" "src/components/acervo/ReviewCard.tsx"
analyze_component "SearchInput" "src/components/acervo/SearchInput.tsx"
analyze_component "TagsPanel" "src/components/acervo/TagsPanel.tsx"

echo "3. ADMIN COMPONENTS:"
analyze_component "AdminLayout" "src/components/admin/AdminLayout.tsx"
analyze_component "AdminNavigation" "src/components/admin/AdminNavigation.tsx"
analyze_component "AnalyticsCharts" "src/components/admin/Analytics/AnalyticsCharts.tsx"
analyze_component "BulkOperations" "src/components/admin/ContentManagement/BulkOperations.tsx"
analyze_component "ContentQueue" "src/components/admin/ContentManagement/ContentQueue.tsx"
analyze_component "FilterPanel" "src/components/admin/ContentManagement/FilterPanel.tsx"
analyze_component "HistoryTimeline" "src/components/admin/ContentManagement/HistoryTimeline.tsx"
analyze_component "PublicationScheduler" "src/components/admin/ContentManagement/PublicationScheduler.tsx"
analyze_component "ReviewWorkflow" "src/components/admin/ContentManagement/ReviewWorkflow.tsx"
analyze_component "WorkflowActions" "src/components/admin/ContentManagement/WorkflowActions.tsx"
analyze_component "TagAnalytics" "src/components/admin/TagManagement/TagAnalytics.tsx"
analyze_component "TagCleanup" "src/components/admin/TagManagement/TagCleanup.tsx"
analyze_component "TagCreateModal" "src/components/admin/TagManagement/TagCreateModal.tsx"
analyze_component "TagEditModal" "src/components/admin/TagManagement/TagEditModal.tsx"
analyze_component "TagHierarchy" "src/components/admin/TagManagement/TagHierarchy.tsx"
analyze_component "BulkOperationsPanel" "src/components/admin/UserManagement/BulkOperationsPanel.tsx"
analyze_component "RoleAssignmentModal" "src/components/admin/UserManagement/RoleAssignmentModal.tsx"
analyze_component "UserDetailModal" "src/components/admin/UserManagement/UserDetailModal.tsx"
analyze_component "UserListTable" "src/components/admin/UserManagement/UserListTable.tsx"

echo "4. AUTH COMPONENTS:"
analyze_component "AuthSessionProvider" "src/components/auth/AuthSessionProvider.tsx"
analyze_component "LoginForm" "src/components/auth/LoginForm.tsx"
analyze_component "ProtectedRoute" "src/components/auth/ProtectedRoute.tsx"
analyze_component "SignupForm" "src/components/auth/SignupForm.tsx"
analyze_component "SplitScreenAuthLayout" "src/components/auth/SplitScreenAuthLayout.tsx"

echo "5. COMMUNITY COMPONENTS:"
analyze_component "Comment" "src/components/community/Comment.tsx"
analyze_component "CommentEditor" "src/components/community/CommentEditor.tsx"
analyze_component "CommentThread" "src/components/community/CommentThread.tsx"
analyze_component "CommunityErrorBoundary" "src/components/community/CommunityErrorBoundary.tsx"
analyze_component "CommunityFeed" "src/components/community/CommunityFeed.tsx"
analyze_component "CommunityFeedWithSidebar" "src/components/community/CommunityFeedWithSidebar.tsx"
analyze_component "CommunityLoadingState" "src/components/community/CommunityLoadingState.tsx"
analyze_component "CommunitySidebar" "src/components/community/CommunitySidebar.tsx"
analyze_component "CreatePostForm" "src/components/community/CreatePostForm.tsx"
analyze_component "ImageUploadZone" "src/components/community/ImageUploadZone.tsx"
analyze_component "MinimalCommentInput" "src/components/community/MinimalCommentInput.tsx"
analyze_component "NetworkAwareFallback" "src/components/community/NetworkAwareFallback.tsx"
analyze_component "PollCreator" "src/components/community/PollCreator.tsx"
analyze_component "PollDisplay" "src/components/community/PollDisplay.tsx"
analyze_component "PostActionBar" "src/components/community/PostActionBar.tsx"
analyze_component "PostActionMenu" "src/components/community/PostActionMenu.tsx"
analyze_component "PostCard" "src/components/community/PostCard.tsx"
analyze_component "PostDetail" "src/components/community/PostDetail.tsx"
analyze_component "PostDetailCard" "src/components/community/PostDetailCard.tsx"
analyze_component "SavePost" "src/components/community/SavePost.tsx"
analyze_component "TiptapEditor" "src/components/community/TiptapEditor.tsx"
analyze_component "VideoInput" "src/components/community/VideoInput.tsx"
analyze_component "VideoUploadZone" "src/components/community/VideoUploadZone.tsx"
analyze_component "VideoUrlInput" "src/components/community/VideoUrlInput.tsx"

echo "6. COMMUNITY SIDEBAR MODULES:"
analyze_component "FeaturedPollModule" "src/components/community/sidebar/FeaturedPollModule.tsx"
analyze_component "LinksModule" "src/components/community/sidebar/LinksModule.tsx"
analyze_component "RecentActivityModule" "src/components/community/sidebar/RecentActivityModule.tsx"
analyze_component "RulesModule" "src/components/community/sidebar/RulesModule.tsx"
analyze_component "TrendingDiscussionsModule" "src/components/community/sidebar/TrendingDiscussionsModule.tsx"

echo "7. HOMEPAGE COMPONENTS:"
analyze_component "FeaturedReview" "src/components/homepage/FeaturedReview.tsx"
analyze_component "NextEditionModule" "src/components/homepage/NextEditionModule.tsx"
analyze_component "ReviewCarousel" "src/components/homepage/ReviewCarousel.tsx"
analyze_component "SuggestionPollItem" "src/components/homepage/SuggestionPollItem.tsx"

echo "8. SHELL COMPONENTS:"
analyze_component "AppShell" "src/components/shell/AppShell.tsx"
analyze_component "BottomTabBar" "src/components/shell/BottomTabBar.tsx"
analyze_component "CollapsibleSidebar" "src/components/shell/CollapsibleSidebar.tsx"
analyze_component "DesktopShell" "src/components/shell/DesktopShell.tsx"
analyze_component "MobileShell" "src/components/shell/MobileShell.tsx"
analyze_component "NavItem" "src/components/shell/NavItem.tsx"
analyze_component "ProfileMenu" "src/components/shell/ProfileMenu.tsx"
analyze_component "UserProfileBlock" "src/components/shell/UserProfileBlock.tsx"

echo "9. ANALYSIS COMPLETE"
echo ""
echo "SUMMARY RECOMMENDATIONS:"
echo "- Components with 0 references are potential dead code"
echo "- Components with 1 reference may be unused (check if self-reference)"
echo "- Components with multiple references are actively used"