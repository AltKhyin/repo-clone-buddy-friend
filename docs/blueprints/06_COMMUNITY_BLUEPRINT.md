\[Blueprint\] 06: Community Module  
Version: 2.0  
Date: June 14, 2025  
Purpose: This document defines the canonical specification for the entire EVIDENS Community experience ("scientific Reddit"). It covers the main feed, the single-thread page, the voting mechanics, and the crucial Community Sidebar. The AI developer must reference this document for all tasks related to the community feature.

\================================================================================  
1.0. Purpose & User Experience  
\================================================================================

1.1. Feature Goal  
To provide a focused, high-signal environment where Practitioners can discuss, debate, and extend the ideas presented in the Reviews. The Community is the "reaction chamber" that transforms static knowledge into a living, evolving intellectual asset.

1.2. Core User Stories  
\*   Story: As a Practitioner, I want to scan a feed of recent discussions and quickly identify topics relevant to my field.  
\*   Story: As a Practitioner, after reading a post, I want to see the community's rules and discover other trending discussions in a persistent sidebar.  
\*   Story: As a Practitioner, I want to upvote insightful comments to increase their visibility and contribute to the author's reputation.  
\*   Story: As an Admin, I want a new discussion thread to be created automatically when a new Review is published.  
\*   Story: As a user on mobile, I expect sidebar content like polls and trending discussions to be integrated cleanly into the main feed, not hidden in a menu.

\================================================================================  
2.0. Visual & Interaction Blueprint  
\================================================================================

2.1. Desktop Layout (\`/community\`)  
A two-column layout is used on viewports \>= 1024px.

\*   Left Column (Main Content):  
    \*   Area: Occupies \~65-70% of the container width.  
    \*   Content: Renders the \`CommunityFeed\`, which is an infinitely scrolling list of \`PostCard\` components. Contains sort options (\`Recentes\`, \`Populares\`, etc.) at the top.  
\*   Right Column (Community Sidebar):  
    \*   Area: Occupies the remaining \~30-35% of the width.  
    \*   Content: A vertical stack of distinct sidebar modules. This sidebar is \*sticky\*, remaining in view as the user scrolls the main feed.

2.2. Single Post Page (\`/community/\[postId\]\`)  
This page also uses the two-column layout on desktop, showing the \`PostDetail\` in the left column and the same \`CommunitySidebar\` in the right column, providing a consistent experience.

2.3. Mobile Layout (\< 1024px)  
\*   RULE: The two-column layout is abandoned in favor of a single column. The \`CommunitySidebar\` component IS NOT rendered.  
\*   Mobile Adaptation Strategy:  
    \*   Critical Modules (\`FeaturedPollModule\`, \`TrendingDiscussionsModule\`): These are rendered as pinned, horizontally swipeable cards at the top of the \`CommunityFeed\`.  
    \*   Static Content (\`RulesModule\`, \`LinksModule\`): This content is moved to a separate, static page (e.g., \`/community/about\`) accessible via a link in the mobile header or a settings menu.

\================================================================================  
3.0. Front-End Architecture  
\================================================================================

3.1. Main Feed Component Breakdown

    Component: CommunityPage.js  
        Type: Page  
        Props: ()  
        Responsibilities: The root component for \`/community\`. Fetches data for the feed and sidebar. Orchestrates the two-column layout.

    Component: CommunityFeed.js  
        Type: Module  
        Props: {}  
        Responsibilities: Manages the infinite scroll logic using \`useCommunityFeedQuery\`. Renders \`PostCard\` components.

    Component: PostCard.js  
        Type: Module  
        Props: { post: Post }  
        Responsibilities: Displays a single post summary in the feed. Composes \`VoteButtons\` and other metadata.

    Component: VoteButtons.js  
        Type: Atomic  
        Props: { score, userVote, onVote: (type) \=\> void }  
        Responsibilities: Renders up/down arrows and score. Handles vote actions.

3.2. \[NEW\] Community Sidebar Architecture  
This new section defines the components required for the sidebar.

    Component: CommunitySidebar.js  
        Type: Module  
        Props: ()  
        Responsibilities: Fetches all sidebar data via \`useCommunitySidebarQuery\`. Renders child modules.

    Component: RulesModule.js  
        Type: Atomic  
        Props: { rules: Rule\[\] }  
        Responsibilities: Displays the list of community rules.

    Component: LinksModule.js  
        Type: Atomic  
        Props: { links: Link\[\] }  
        Responsibilities: Displays the list of useful links.

    Component: FeaturedPollModule.js  
        Type: Atomic  
        Props: { poll: Poll }  
        Responsibilities: Renders the single "Enquete da Semana".

    Component: TrendingDiscussionsModule.js  
        Type: Atomic  
        Props: { posts: PostSummary\[\] }  
        Responsibilities: Renders a list of the top 3-5 trending posts.

    Component: ChangelogModule.js  
        Type: Atomic  
        Props: { updates: ChangelogItem\[\] }  
        Responsibilities: Displays recent platform updates.

\================================================================================  
4.0. Backend Architecture & Data Flow  
\================================================================================

4.1. Data Requirements & API Contracts

    4.1.1. Main Feed  
    \*   Data Hook: \`useCommunityFeedQuery()\` (using \`useInfiniteQuery\`).  
    \*   Backend: Calls a dedicated Edge Function \`get-community-feed\` that returns a paginated list of posts, pre-joined with the current user's vote data to prevent N+1 queries.

    4.1.2. \[NEW\] Community Sidebar  
    \*   Data Hook: \`useCommunitySidebarQuery()\`.  
    \*   Backend: This hook calls a new, consolidated Edge Function to fetch all sidebar data in a single request.  
    \*   Function Name: \`get-community-sidebar-data\`  
    \*   Logic:  
        1\.  Static Config: Fetches the \`community\_sidebar\_settings\` key from the \`Site\_Settings\` table. This key will contain the rules, links, featured poll ID, and changelog text managed by an admin.  
        2\.  Dynamic Content: Invokes another new Edge Function, \`get-trending-discussions\`, to get the list of top posts.  
        3\.  Returns a single JSON object with all data needed to render the entire sidebar.  
    \*   "Trending" Algorithm: The \`get-trending-discussions\` function will define "trending" as posts with the highest engagement score in the last 48 hours. \`Engagement Score \= (New Votes \* 2\) \+ (New Comments)\`.

\================================================================================  
5.0. Implementation Checklist  
\================================================================================

Category: Backend (Sidebar)  
    \[ \] Task 1.1: Create the \`get-trending-discussions\` Edge Function.  
    \[ \] Task 1.2: Create the consolidated \`get-community-sidebar-data\` Edge Function.

Category: Admin Panel  
    \[ \] Task 2.1: Build the UI for the "Barra Lateral" manager in the Admin App (as per \`Blueprint 08b\`).

Category: Frontend Data (Sidebar)  
    \[ \] Task 3.1: Create the \`useCommunitySidebarQuery\` data hook.

Category: Frontend UI (Sidebar)  
    \[ \] Task 4.1: Build all atomic sidebar modules (\`RulesModule\`, \`TrendingDiscussionsModule\`, etc.).  
    \[ \] Task 4.2: Build the \`CommunitySidebar.js\` module that composes them.

Category: Frontend Integration  
    \[ \] Task 5.1: Update \`CommunityPage.js\` to implement the two-column layout on desktop.  
    \[ \] Task 5.2: In \`CommunityFeed.js\`, implement the mobile adaptation logic to render pinned cards for poll/trending.

Category: Verification  
    \[ \] Task 6.1: Thoroughly test the layout and functionality on both desktop and mobile viewports.  
