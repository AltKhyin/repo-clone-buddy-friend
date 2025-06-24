# EVIDENS Unified Management Platform - Complete Blueprint

**Version:** 1.0  
**Date:** January 23, 2025  
**Status:** Ready for Implementation  
**Implementation Partner:** Lovable AI

---

## 📋 Executive Summary

This blueprint defines a comprehensive management platform that unifies user management, tag management, layout management, and introduces the critical **Content Publication Engine**. This platform serves as the foundation layer that the Visual Composition Engine will build upon.

### Strategic Objectives
1. **Centralize Administration** - Single dashboard for all management functions
2. **Streamline Publication Workflow** - Automated content review and publishing pipeline  
3. **Enable Quality Control** - Systematic content review and approval process
4. **Provide Performance Insights** - Analytics dashboard for informed decisions
5. **Support Content Scale** - Bulk operations for managing large content volumes

---

## 🏗️ Architecture Overview

### Platform Structure
```
/admin (Unified Management Dashboard)
├── /dashboard           # Overview & KPIs
├── /content            # Content Publication Engine
├── /users              # Enhanced User Management  
├── /tags               # Enhanced Tag Management
├── /layout             # Enhanced Layout Management
└── /analytics          # Publication Analytics
```

### Technical Architecture
- **Frontend:** React + TypeScript with shadcn/ui components
- **State Management:** TanStack Query v5 + Zustand (following existing patterns)
- **Backend:** Supabase Edge Functions + PostgreSQL
- **Authentication:** Role-based access (Admin, Editor roles)
- **Real-time:** Supabase subscriptions for live updates

---

## 🎯 Core Features Specification

### 1. Content Publication Engine (New - Primary Feature)

#### 1.1 Publication Workflow State Machine
```
Draft → Under Review → Approved/Scheduled → Published → [Archived]
  ↑         ↓              ↓                    ↓
  ←─────── Rejected    Auto-Publish       Manual Archive
```

**State Definitions:**
- **Draft:** Initial state, author can edit
- **Under Review:** Submitted for editorial review, locked from editing
- **Approved/Scheduled:** Editor approved, optionally scheduled for future publication
- **Published:** Live and visible to users based on access level
- **Archived:** Removed from public view but preserved

#### 1.2 Review Assignment System
- **Auto-assignment:** Round-robin distribution to available editors
- **Manual assignment:** Admin can assign specific reviewer
- **Workload balancing:** Track review counts per editor
- **Review SLA:** Track time from submission to decision

#### 1.3 Publication Scheduling
- **Immediate publication:** Publish immediately upon approval
- **Scheduled publication:** Set specific date/time for auto-publication
- **Timezone support:** Handle different timezone scheduling
- **Batch scheduling:** Schedule multiple pieces simultaneously

#### 1.4 Access Level Management
- **Public:** Visible to all users
- **Premium:** Visible to premium subscribers only  
- **Private:** Internal only, not public-facing
- **Community-linked:** Automatically create discussion post

### 2. Enhanced User Management (Extension of Blueprint 08b)

#### 2.1 Role Management System
**Hierarchical Roles:**
- **Admin:** Full platform control
- **Editor:** Content management + user moderation
- **Moderator:** Community management only
- **Practitioner:** Standard user access

#### 2.2 Advanced User Operations
- **Bulk role changes** - Select multiple users, change roles
- **User activity tracking** - Login history, contribution metrics
- **Subscription management** - Upgrade/downgrade user tiers
- **User communication** - Send notifications to user groups

### 3. Enhanced Tag Management (Extension of Blueprint 08b)

#### 3.1 Advanced Hierarchy Operations  
- **Multi-level drag-and-drop** - Unlimited nesting depth
- **Bulk operations** - Move multiple tags, bulk delete, merge tags
- **Tag analytics** - Usage statistics, orphaned tag detection
- **Import/Export** - CSV import for bulk tag creation

#### 3.2 Tag Cleanup Tools
- **Orphaned tag detection** - Find unused tags
- **Duplicate detection** - Find similar tag names
- **Merge tool** - Combine duplicate tags with content reassignment
- **Usage reports** - Most/least used tags analytics

### 4. Enhanced Layout Management (Extension of Blueprint 08b)

#### 4.1 Visual Layout Editor
- **Drag-and-drop interface** - Reorder homepage sections visually
- **Mobile-specific layouts** - Separate mobile layout configuration
- **A/B testing support** - Test different layouts with user segments
- **Layout templates** - Save and reuse layout configurations

#### 4.2 Dynamic Content Management
- **Featured content rotation** - Automatically rotate featured reviews
- **Personalization rules** - Show different content based on user attributes
- **Seasonal layouts** - Schedule layout changes for special periods
- **Performance monitoring** - Track layout performance metrics

### 5. Publication Analytics Dashboard (New)

#### 5.1 Content Performance Metrics
- **Publication funnel** - Track content from draft to published
- **Engagement metrics** - Views, time on page, interaction rates
- **Content lifecycle** - Average time in each workflow state
- **Quality metrics** - Approval rates, rejection reasons

#### 5.2 User Engagement Analytics
- **Reader behavior** - Most engaged content categories
- **Conversion tracking** - Content driving subscription upgrades
- **Community impact** - Content generating most discussion
- **Search performance** - Most searched topics and keywords

### 6. Bulk Operations System (New)

#### 6.1 Content Bulk Operations
- **Bulk publication** - Publish multiple approved pieces
- **Bulk scheduling** - Schedule multiple pieces for same time
- **Bulk archiving** - Archive old or outdated content
- **Bulk access level changes** - Change visibility for multiple pieces

#### 6.2 Tag and User Bulk Operations
- **Bulk tag assignment** - Add tags to multiple reviews
- **Bulk user role changes** - Promote/demote multiple users
- **Bulk notifications** - Send announcements to user segments
- **Data export** - Export user data, content metrics in CSV

---

## 🗄️ Database Schema Extensions

### 1. Reviews Table Extensions
```sql
-- Publication workflow fields
ALTER TABLE "Reviews" ADD COLUMN "review_status" TEXT DEFAULT 'draft' 
  CHECK (review_status IN ('draft', 'under_review', 'scheduled', 'published', 'archived'));
ALTER TABLE "Reviews" ADD COLUMN "reviewer_id" UUID REFERENCES "Practitioners"(id);
ALTER TABLE "Reviews" ADD COLUMN "scheduled_publish_at" TIMESTAMPTZ;
ALTER TABLE "Reviews" ADD COLUMN "publication_notes" TEXT;
ALTER TABLE "Reviews" ADD COLUMN "review_requested_at" TIMESTAMPTZ;
ALTER TABLE "Reviews" ADD COLUMN "reviewed_at" TIMESTAMPTZ;
```

### 2. New Tables

#### Publication_History Table
```sql
CREATE TABLE "Publication_History" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "review_id" INT NOT NULL REFERENCES "Reviews"(id) ON DELETE CASCADE,
  "action" TEXT NOT NULL CHECK (action IN ('created', 'submitted_for_review', 'approved', 'rejected', 'scheduled', 'published', 'unpublished', 'archived')),
  "performed_by" UUID NOT NULL REFERENCES "Practitioners"(id),
  "notes" TEXT,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Admin_Analytics Table
```sql
CREATE TABLE "Admin_Analytics" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "metric_type" TEXT NOT NULL,
  "metric_value" NUMERIC NOT NULL,
  "dimensions" JSONB DEFAULT '{}'::jsonb,
  "date" DATE NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);
```

#### Bulk_Operations Table
```sql
CREATE TABLE "Bulk_Operations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "operation_type" TEXT NOT NULL,
  "performed_by" UUID REFERENCES "Practitioners"(id),
  "target_count" INT NOT NULL,
  "completed_count" INT DEFAULT 0,
  "status" TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  "parameters" JSONB DEFAULT '{}'::jsonb,
  "results" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "completed_at" TIMESTAMPTZ
);
```

### 3. Performance Indexes
```sql
-- Publication workflow indexes
CREATE INDEX "idx_reviews_review_status" ON "Reviews"("review_status");
CREATE INDEX "idx_reviews_reviewer_id" ON "Reviews"("reviewer_id");
CREATE INDEX "idx_reviews_scheduled_publish" ON "Reviews"("scheduled_publish_at") 
  WHERE "scheduled_publish_at" IS NOT NULL;

-- History and analytics indexes  
CREATE INDEX "idx_publication_history_review_id" ON "Publication_History"("review_id");
CREATE INDEX "idx_publication_history_action" ON "Publication_History"("action");
CREATE INDEX "idx_admin_analytics_type_date" ON "Admin_Analytics"("metric_type", "date");
```

---

## 🔌 Edge Functions Specification

### 1. Content Management Functions

#### admin-get-content-queue
**Purpose:** Fetch content awaiting review/action  
**Parameters:** `status`, `page`, `limit`, `assignee`  
**Returns:** Paginated content queue with metadata  
**Authorization:** Admin, Editor roles

#### admin-manage-publication  
**Purpose:** Execute publication workflow actions  
**Parameters:** `reviewId`, `action`, `scheduledDate`, `notes`, `reviewerId`  
**Actions:** submit_for_review, approve, reject, schedule, publish_now, unpublish, archive  
**Authorization:** Admin, Editor roles

#### admin-bulk-operations
**Purpose:** Execute bulk operations on content/users  
**Parameters:** `operation`, `targets[]`, `parameters`  
**Operations:** bulk_publish, bulk_schedule, bulk_archive, bulk_tag, bulk_role_change  
**Authorization:** Admin role only

### 2. Analytics Functions

#### admin-get-analytics
**Purpose:** Fetch dashboard analytics data  
**Parameters:** `timeframe`, `metrics[]`, `filters`  
**Returns:** Aggregated metrics and trends  
**Authorization:** Admin, Editor roles

#### admin-export-data
**Purpose:** Export data for reporting  
**Parameters:** `exportType`, `dateRange`, `filters`  
**Returns:** CSV/JSON data export  
**Authorization:** Admin role only

### 3. User Management Functions

#### admin-manage-users
**Purpose:** User role and subscription management  
**Parameters:** `userId`, `action`, `newRole`, `newTier`  
**Actions:** change_role, change_tier, suspend, reactivate  
**Authorization:** Admin role only

#### admin-get-user-analytics
**Purpose:** Fetch user engagement and activity data  
**Parameters:** `userId`, `timeframe`  
**Returns:** User activity metrics and history  
**Authorization:** Admin, Editor roles

---

## 🎨 Component Architecture

### 1. Main Layout Structure
```
src/components/admin/
├── AdminDashboard.tsx              # Main dashboard container
├── AdminNavigation.tsx             # Unified navigation sidebar
├── AdminHeader.tsx                 # Header with user info and notifications
└── modules/
    ├── ContentManagement/
    ├── UserManagement/  
    ├── TagManagement/
    ├── LayoutManagement/
    └── Analytics/
```

### 2. Content Management Module
```
ContentManagement/
├── ContentQueue.tsx                # Main content queue interface
├── ReviewWorkflow.tsx              # Individual review workflow
├── PublicationScheduler.tsx        # Scheduling interface
├── BulkOperations.tsx              # Bulk content operations
├── ContentAnalytics.tsx            # Content performance metrics
└── components/
    ├── ReviewCard.tsx              # Individual review display
    ├── WorkflowActions.tsx         # Action buttons for workflow
    ├── SchedulingModal.tsx         # Date/time scheduling modal
    └── BulkSelector.tsx            # Multi-select interface
```

### 3. Enhanced User Management Module
```
UserManagement/
├── UserDirectory.tsx               # Main user listing
├── UserProfile.tsx                 # Detailed user view
├── RoleManagement.tsx              # Role assignment interface
├── UserAnalytics.tsx               # User engagement metrics
└── components/
    ├── UserCard.tsx                # Individual user display
    ├── RoleSelector.tsx            # Role change interface
    ├── BulkUserActions.tsx         # Bulk user operations
    └── UserActivityTimeline.tsx    # User activity history
```

### 4. Enhanced Tag Management Module
```
TagManagement/
├── TagHierarchy.tsx                # Main hierarchy editor
├── TagAnalytics.tsx                # Tag usage analytics
├── TagCleanup.tsx                  # Orphaned tag management
└── components/
    ├── DraggableTagTree.tsx        # Drag-drop tree interface
    ├── TagMerger.tsx               # Tag merging tool
    ├── BulkTagOperations.tsx       # Bulk tag operations
    └── TagUsageChart.tsx           # Tag analytics visualization
```

### 5. Enhanced Layout Management Module
```
LayoutManagement/
├── LayoutEditor.tsx                # Visual layout editor
├── LayoutTemplates.tsx             # Saved layout templates
├── ABTestManager.tsx               # A/B testing interface
└── components/
    ├── DraggableSection.tsx        # Draggable layout sections
    ├── MobileLayoutPreview.tsx     # Mobile layout preview
    ├── LayoutPerformance.tsx       # Layout analytics
    └── TemplateSelector.tsx        # Template selection interface
```

### 6. Analytics Dashboard Module
```
Analytics/
├── OverviewDashboard.tsx           # Main analytics overview
├── ContentAnalytics.tsx            # Content performance
├── UserEngagement.tsx              # User behavior analytics
├── PublicationFunnel.tsx           # Publication workflow metrics
└── components/
    ├── MetricCard.tsx              # Individual metric display
    ├── TrendChart.tsx              # Trend visualization
    ├── FunnelChart.tsx             # Funnel visualization
    └── ExportButton.tsx            # Data export interface
```

---

## 🎯 TanStack Query Hooks Specification

### 1. Content Management Hooks
```typescript
// Content queue data fetching
export const useContentQueueQuery = (params: ContentQueueParams) => {
  return useInfiniteQuery({
    queryKey: ['admin', 'content-queue', params],
    queryFn: ({ pageParam = 1 }) => fetchContentQueue({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage : undefined,
  });
};

// Publication action mutation
export const usePublicationActionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: PublicationAction) => executePublicationAction(action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
  });
};

// Bulk operations mutation
export const useBulkOperationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (operation: BulkOperation) => executeBulkOperation(operation),
    onSuccess: (data) => {
      // Invalidate relevant queries based on operation type
      if (data.operationType.includes('content')) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
      }
      if (data.operationType.includes('user')) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      }
    },
  });
};
```

### 2. Analytics Hooks
```typescript
// Dashboard analytics
export const useAdminAnalyticsQuery = (timeframe: string, metrics: string[]) => {
  return useQuery({
    queryKey: ['admin', 'analytics', timeframe, metrics],
    queryFn: () => fetchAdminAnalytics(timeframe, metrics),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Publication funnel metrics
export const usePublicationFunnelQuery = (dateRange: DateRange) => {
  return useQuery({
    queryKey: ['admin', 'publication-funnel', dateRange],
    queryFn: () => fetchPublicationFunnel(dateRange),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### 3. User Management Hooks
```typescript
// User directory with search and filtering
export const useUserDirectoryQuery = (params: UserDirectoryParams) => {
  return useInfiniteQuery({
    queryKey: ['admin', 'users', params],
    queryFn: ({ pageParam = 1 }) => fetchUserDirectory({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage : undefined,
  });
};

// User role management mutation
export const useUserRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (change: UserRoleChange) => updateUserRole(change),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};
```

---

## 🔐 Security & Authorization

### Role-Based Access Control

#### Admin Role Permissions
- Full access to all management functions
- User role management and system configuration
- Bulk operations and data export
- System analytics and reporting

#### Editor Role Permissions  
- Content review and publication workflow
- Tag management and content organization
- User activity monitoring (read-only)
- Content analytics (limited)

#### Access Control Implementation
```typescript
// Route protection component
export const AdminProtectedRoute = ({ requiredRoles, children }: AdminRouteProps) => {
  const { user } = useAuthStore();
  const userRole = user?.app_metadata?.role;
  
  if (!userRole || !requiredRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// Function-level authorization
export const requireRole = (requiredRoles: string[]) => {
  return (req: Request) => {
    const userRole = getUserRole(req);
    if (!requiredRoles.includes(userRole)) {
      throw new Error('Insufficient permissions');
    }
  };
};
```

### Row Level Security Policies
```sql
-- Allow admins to view all reviews regardless of status
CREATE POLICY "Admins can view all reviews" 
  ON "Reviews" FOR SELECT 
  USING (get_my_claim('role') IN ('admin', 'editor'));

-- Allow admins and editors to update review workflow fields
CREATE POLICY "Admins can update review workflow" 
  ON "Reviews" FOR UPDATE 
  USING (get_my_claim('role') IN ('admin', 'editor'));

-- Restrict publication history to admins and editors
CREATE POLICY "Admins can manage publication history" 
  ON "Publication_History" FOR ALL 
  USING (get_my_claim('role') IN ('admin', 'editor'));
```

---

## 📊 Analytics & Monitoring

### Key Performance Indicators (KPIs)

#### Content Publication Metrics
- **Review Turnaround Time:** Average time from submission to decision
- **Approval Rate:** Percentage of content approved vs rejected
- **Publication Backlog:** Number of items awaiting review
- **Content Quality Score:** Based on engagement and user feedback

#### User Engagement Metrics
- **Active Content Creators:** Users submitting content regularly
- **Content Consumption:** Views, time on page, interaction rates
- **User Growth:** New user registrations and tier upgrades
- **Community Engagement:** Comments, votes, and discussions

#### Operational Metrics
- **System Performance:** Dashboard load times and response rates
- **Error Rates:** Failed operations and error frequency
- **User Satisfaction:** Admin user feedback and support tickets
- **Feature Adoption:** Usage rates of new management features

### Real-time Monitoring
```typescript
// Real-time content queue updates
export const useContentQueueSubscription = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const subscription = supabase
      .channel('content-queue-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'Reviews',
        filter: 'review_status=in.(under_review,scheduled)'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [queryClient]);
};
```

---

## 🚀 Implementation Timeline

### Phase 1: Foundation (Week 1)
**Database & Core Infrastructure**
- [ ] Database schema migrations
- [ ] Core Edge Functions (content queue, publication actions)
- [ ] Basic admin routing and navigation
- [ ] Authentication and role verification

**Deliverables:**
- Working database schema with publication workflow
- Basic admin dashboard with navigation
- Core Edge Functions deployed and tested

### Phase 2: Content Publication Engine (Week 2)
**Publication Workflow Implementation**
- [ ] Content queue interface with filtering and search
- [ ] Review workflow with approval/rejection
- [ ] Publication scheduling system
- [ ] Bulk operations for content management

**Deliverables:**
- Complete content publication workflow
- Scheduling system with timezone support
- Bulk operations for efficiency
- Publication history tracking

### Phase 3: Enhanced Management Modules (Week 3)
**User, Tag, and Layout Management**
- [ ] Enhanced user management with bulk operations
- [ ] Advanced tag management with hierarchy editor
- [ ] Visual layout management with A/B testing
- [ ] Integration with existing blueprint functionality

**Deliverables:**
- Enhanced user management system
- Advanced tag hierarchy management
- Visual layout editor with templates
- A/B testing infrastructure

### Phase 4: Analytics & Optimization (Week 4)
**Analytics Dashboard & Final Polish**
- [ ] Publication analytics dashboard
- [ ] User engagement metrics
- [ ] Performance monitoring and optimization
- [ ] Comprehensive testing and documentation

**Deliverables:**
- Complete analytics dashboard
- Performance monitoring system
- Optimized user experience
- Full documentation and testing

---

## 🎯 Success Metrics & Quality Assurance

### Quantitative Success Metrics
- **Efficiency Gain:** 60% reduction in content publication time
- **Quality Improvement:** 90% content approval rate on first review
- **User Adoption:** 100% of content uses new publication workflow
- **Performance:** Dashboard loads in <2 seconds with 100+ reviews
- **Error Rate:** <1% error rate in publication operations

### Qualitative Success Metrics
- **User Satisfaction:** 9/10 rating from admin users
- **Workflow Clarity:** Intuitive interface requiring minimal training
- **Data Integrity:** Zero data loss incidents during publication
- **System Reliability:** 99.9% uptime for management functions
- **Feature Completeness:** All planned features implemented and working

### Quality Assurance Testing

#### Unit Testing
- Individual component functionality
- Edge Function input/output validation
- Database query performance
- State management correctness

#### Integration Testing
- End-to-end publication workflow
- User role transitions and permissions
- Bulk operation correctness
- Analytics data accuracy

#### Performance Testing
- Dashboard load times under various data volumes
- Bulk operation performance with large datasets
- Database query optimization verification
- Real-time update performance

#### User Acceptance Testing
- Admin workflow completion without errors
- Intuitive navigation and feature discovery
- Mobile responsiveness for admin functions
- Error handling and recovery scenarios

---

## 🔗 Integration with Visual Composition Engine

### Foundation for Editor Development
This management platform provides the essential foundation for the Visual Composition Engine:

1. **Content Lifecycle Management:** Complete workflow from creation to publication
2. **Quality Control:** Review and approval process ensuring content standards
3. **Publication Control:** Scheduling and access level management
4. **Performance Monitoring:** Analytics to track content effectiveness
5. **User Management:** Role-based access for content creators and editors

### Integration Points
- **Content Creation:** Editor will integrate with publication workflow
- **Quality Control:** Editor content will go through review process
- **Analytics:** Editor usage will be tracked through analytics system
- **User Permissions:** Editor access controlled through user management
- **Tag Management:** Editor will use tag system for content organization

This unified management platform ensures that when the Visual Composition Engine is built, it will have a robust, tested foundation that handles all aspects of content management beyond the editing experience itself.

---

**✅ Blueprint Complete - Ready for Implementation via Lovable AI**