[Blueprint] 10: Notification System
Version: 1.0
Date: June 14, 2025
Purpose: This document provides the canonical blueprint for the end-to-end user notification system. It details the event triggers, data model, backend logic, and front-end components required to inform users of relevant activity on the platform.

================================================================================
1.0. Core Principles & User Experience
================================================================================

1.1. Feature Goal
To drive meaningful user re-engagement by delivering timely, relevant, and actionable notifications about events that pertain directly to the user or their content, making the platform feel alive and responsive.

1.2. Core User Stories
*   "As a Practitioner, when someone replies to my comment, I want to receive a notification so I can continue the conversation."
*   "As an Author, when someone comments on a post I created, I want to be notified so I can engage with my readers."
*   "As a User, I want to quickly see if I have new notifications via a clear badge in the main app header."
*   "As a User, I want to view a chronological list of all my past notifications on a dedicated page."

================================================================================
2.0. Visual & Interaction Blueprint
================================================================================

2.1. The Notification Bell (`NotificationBell.js`)
*   Location: Persistently visible in the main application header (desktop and mobile), as defined in `[Blueprint] 02`.
*   Visual States:
    *   Default State: A simple bell icon.
    *   Unread State: A small, red notification dot MUST appear on the bell icon when `unreadCount > 0`.
*   Interaction:
    *   Clicking the bell opens a `NotificationPopover.js`.
    *   The popover displays the 5 most recent notifications.
    *   The popover has a "Ver todas" (View All) link at the bottom that navigates to the `/notifications` page.

2.2. The Notifications Page (`/notifications`)
*   Layout: A simple, single-column list view.
*   Content: Displays a chronological, infinitely-scrolling list of all the user's notifications, with the newest at the top.
*   Interaction (Mark as Read):
    *   RULE: When the `/notifications` page is loaded, a mutation MUST be triggered to mark all of the user's unread notifications as read.
    *   The unread count in the `NotificationBell` should then update to zero.

================================================================================
3.0. Front-End Architecture
================================================================================

3.1. Component Breakdown

    Component: NotificationBell.js
        Type: Atomic
        Props: ()
        State: Consumes `useNotificationCountQuery`.
        Responsibilities: Renders the bell icon and the unread indicator dot. Wraps the `NotificationPopover`.

    Component: NotificationPopover.js
        Type: Module
        Props: ()
        State: Consumes `useNotificationsQuery` (fetching only the first 5).
        Responsibilities: Displays a short list of recent notifications.

    Component: NotificationsPage.js
        Type: Page
        Props: ()
        State: Consumes `useNotificationsQuery` (infinite scroll) and `useMarkAllAsReadMutation`.
        Responsibilities: Renders the full list of notifications and triggers the mark-as-read action.

    Component: NotificationItem.js
        Type: Atomic
        Props: { notification: Notification }
        Responsibilities: Renders a single notification. Uses a switch on `notification.type` to display the correct text and link.

3.2. Data Hooks
*   `useNotificationCountQuery`: Fetches only the count of unread notifications. Calls a dedicated, lightweight RPC function.
*   `useNotificationsQuery`: An `useInfiniteQuery` hook to fetch a paginated list of all notifications for the user.
*   `useMarkAllAsReadMutation`: Triggers the Edge Function to mark all notifications as read.

================================================================================
4.0. Backend Architecture & Data Flow
================================================================================

4.1. The Notification Event Map
*   This map is the definitive logic for notification creation. Existing Edge Functions MUST be updated to include this logic.

| Event Trigger                        | Notification `type`     | `data` Payload Schema                                       | Triggering Function to Update |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------- | ----------------------------- |
| User replies to your post/comment    | `NEW_REPLY`             | `{ actorId, actorName, postId, snippet }`                   | `create-community-post`       |
| User upvotes your post/comment       | `NEW_UPVOTE`            | `{ actorId, actorName, postId, postTitle }`                 | `cast-post-vote`              |
| Admin publishes a new `Review`       | `NEW_REVIEW_PUBLISHED`  | `{ reviewId, reviewTitle, coverImageUrl }`                  | `publish-review`              |

4.2. API Contract & Database
*   **Database Table:** The `Notifications` table (defined in `[DOC_3]`) is the source of truth.
*   **RPC Function: `get_unread_notification_count()`**
    *   Auth: Required (`authenticated`).
    *   Logic: Executes a fast `SELECT count(*) FROM "Notifications" WHERE recipient_id = auth.uid() AND is_read = false;`. This is more performant than fetching full notification data for just the count.
*   **Edge Function: `mark-notifications-as-read`**
    *   Auth: Required (`authenticated`).
    *   Logic: Executes an `UPDATE "Notifications" SET is_read = true WHERE recipient_id = auth.uid();`.

================================================================================
5.0. Implementation Checklist
================================================================================

1.  [ ] **Backend (Logic):** Update the `create-community-post`, `cast-post-vote`, and `publish-review` Edge Functions to include the notification creation logic as per the Event Map.
2.  [ ] **Backend (API):** Create the `get_unread_notification_count` RPC and the `mark-notifications-as-read` Edge Function.
3.  [ ] **Backend (Security):** Implement the RLS policies for the `Notifications` table (user can only read/update their own).
4.  [ ] **Data Layer:** Implement the three required hooks: `useNotificationCountQuery`, `useNotificationsQuery`, and `useMarkAllAsReadMutation`.
5.  [ ] **UI Components:** Build the `NotificationBell`, `NotificationPopover`, `NotificationsPage`, and `NotificationItem` components.
6.  [ ] **Integration:** Wire up the components to the data hooks and ensure real-time updates and mark-as-read functionality work correctly.


