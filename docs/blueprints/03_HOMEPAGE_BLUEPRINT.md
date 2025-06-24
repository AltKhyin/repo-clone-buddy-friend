\[Blueprint\] 03: Homepage

Version: 2.0

Date: June 14, 2025

Purpose: This document is the canonical, feature-specific blueprint for the main application Homepage (\`/\`). It defines the complete visual, functional, and technical specification for the primary content discovery and engagement dashboard for authenticated users. The AI developer must reference this document for all tasks related to building the homepage.

\================================================================================

1.0. Core Principles & User Experience

\================================================================================

1.1. Feature Goal

To provide a dynamic and personalized dashboard that allows an authenticated Practitioner to immediately understand what is new, relevant, and important on the EVIDENS platform since their last visit. The homepage should encourage content discovery and community engagement by surfacing a variety of curated content modules.

1.2. Core User Stories

\*   Story: As a returning Practitioner, I want to see the most important or newest Review featured prominently so I can immediately engage with high-signal content.

\*   Story: As a Practitioner, I want to browse horizontally-scrolling lists of recent, popular, and \*personally recommended\* Reviews to discover content relevant to my interests.

\*   Story: As an engaged Practitioner, I want to see what topics are being considered for the next Review and cast my vote, making me feel like a participant in the platform's editorial direction.

1.3. Guiding Constitutional Documents

\*   Philosophy: All content and modules must align with the principles in \`\[DOC\_1\]\_PRODUCT\_PHILOSOPHY.md\`.

\*   Visuals & Styling: All components defined in this blueprint MUST strictly adhere to the rules and tokens defined in \`\[DOC\_7\]\_VISUAL\_SYSTEM.md\`.

\*   Mobile Adaptation: The transformation from desktop to mobile layouts MUST follow the principles and specific rules laid out in \`\[DOC\_8\]\_MOBILE\_ADAPTATION.md\`.

\*   Data Fetching: All data fetching MUST adhere to the patterns defined in \`\[DOC\_6\]\_DATA\_FETCHING\_STRATEGY.md\`.

\================================================================================

2.0. Visual & Interaction Blueprint

\================================================================================

This section defines the precise look, feel, and behavior of the Homepage, which is a vertical stack of distinct modules.

RULE: The visibility and order of these modules (except for \`FeaturedReview\`) are controlled by an administrator via the \`homepage\_layout\` setting defined in the \`Site\_Settings\` table. The front-end must render the modules in the order specified by that setting.

2.1. The Modules

    2.1.1. \`FeaturedReview\` Module (Hero)

    \*   Visual Specification:

        \*   Layout: The top-most, full-width module on the page. It features a large, atmospheric background image derived from the Review's cover art, overlaid with a dark gradient to ensure text legibility.

        \*   Content: Displays the Review's \`title\`, a short \`description\`/abstract, and a primary "Ler agora" (Read Now) button. It also shows a small "Edição \#\[ID\]" tag.

    \*   Interaction: Clicking anywhere on the module or the button navigates the user to the Review detail page (\`/reviews/\[id\]\`).

    2.1.2. \`ReviewCarousel\` Module

    \*   Visual Specification:

        \*   Layout: A reusable horizontal carousel component. It consists of a section title (e.g., "Edições Recentes," "Recomendados para você," "Mais acessados") and a horizontally scrolling list of \`ReviewCard\` components.

        \*   Interaction (Desktop): Visible left/right arrow buttons allow for scrolling. The list can also be scrolled with a mouse wheel or trackpad.

        \*   Interaction (Mobile): The arrow buttons are hidden. The carousel is swipeable and displays 1.5 cards at a time to afford the swipe interaction, as per \`\[DOC\_8\]\`.

    \*   \`ReviewCard\` Atomic Component:

        \*   Content: Displays the Review's cover image as the background. Text content (title, tags) is overlaid.

        \*   Metadata: A subtle view count with an "eye" icon is displayed in a corner.

        \*   Interaction: The entire card is a single link to the Review detail page. There are no hover buttons.

    2.1.3. \`NextEditionModule\` (Poll System)

    \*   Visual Specification:

        \*   Layout: A two-part module. The left side contains a simple form for submitting a new topic suggestion. The right side displays the list of current suggestions in a poll format.

        \*   Suggestion Form: A single text input and a "Sugerir" (Suggest) button.

        \*   Poll List: Each item in the list (\`SuggestionPollItem\`) displays the suggestion text, the current vote count, and an interactive upvote button. The list is sorted by the number of votes in descending order.

    \*   Interaction:

        \*   Users can type in the form and submit a new suggestion.

        \*   Users can click the upvote button on any suggestion to cast their vote. The button state must visually change to indicate a "voted" state, and the count should update optimistically. Clicking again retracts the vote.

2.2. Loading & Error States

\*   Loading: While the initial data for the page is being fetched, each module area must display a skeleton loader that mimics its layout (e.g., a large gray rectangle for the \`FeaturedReview\`, a series of smaller card-shaped skeletons for the carousels). This prevents layout shift and improves perceived performance.

\*   Error: If the main data fetch fails, the page should display a single, clean error message with a "Try Again" button that re-triggers the query.

\================================================================================

3.0. Front-End Architecture

\================================================================================

3.1. Component Breakdown & Contracts

    Component: Homepage.js

        Type: Page

        Props: ()

        State: Consumes \`useHomepageFeedQuery\`.

        Responsibilities: The root component for the \`/\` route. Fetches all data. Renders modules in the order specified by \`homepage\_layout\`. Manages loading/error states.

    Component: FeaturedReview.js

        Type: Module

        Props: { review: Review }

        State: None

        Responsibilities: Displays the hero section for the single featured Review.

    Component: ReviewCarousel.js

        Type: Module

        Props: { title: string, reviews: Review\[\] }

        State: None

        Responsibilities: Displays a title and a horizontally scrolling list of \`ReviewCard\` components.

    Component: NextEditionModule.js

        Type: Module

        Props: { suggestions: Suggestion\[\] }

        State: Manages suggestion input state. Consumes \`useSubmitSuggestionMutation\` and \`useCastVoteMutation\`.

        Responsibilities: Renders the suggestion form and the interactive poll list.

    Component: ReviewCard.js

        Type: Atomic

        Props: { review: Review }

        State: None

        Responsibilities: Renders a single, clickable card for a Review.

    Component: SuggestionPollItem.js

        Type: Atomic

        Props: { suggestion: Suggestion }

        State: Consumes \`useCastVoteMutation\`.

        Responsibilities: Renders a single item in the poll, displaying text, vote count, and the interactive vote button.

3.2. State Management & Data Flow

\*   Data Fetching: The \`Homepage.js\` component is the only component on this page that triggers a data fetch. It will use a single dedicated hook: \`useHomepageFeedQuery\`.

\*   Data Flow: The \`useHomepageFeedQuery\` hook calls the \`get-homepage-feed\` Edge Function. The data returned is a single JSON object containing all necessary arrays (\`featuredReview\`, \`recentReviews\`, \`popularReviews\`, \`recommendedReviews\`, \`suggestions\`, \`layoutOrder\`). The \`Homepage.js\` component then passes the relevant slices of this data down to its child modules as props.

\================================================================================

4.0. Backend Architecture & Data Flow

\================================================================================

4.1. Unambiguous Logic Definitions

    4.1.1. "Popularity" Algorithm

    \*   RULE: "Popular" or "Mais acessados" content is not determined by raw view count. It must be calculated using a time-decaying score to prioritize recently relevant content.

    \*   Implementation: This logic will be implemented within the \`get-homepage-feed\` Edge Function.

    \*   Formula:

        1\.  For each Review, calculate a \`popularityScore\`.

        2\.  \`popularityScore \= (views\_last\_7\_days \* 3\) \+ (views\_last\_30\_days \* 1\) \+ (total\_comments \* 5\) \+ (total\_upvotes \* 2)\`

        3\.  The \`get-homepage-feed\` function will return the top 10 Reviews sorted by this score in descending order.

    4.1.2. "Recommendations" Algorithm

    \*   RULE: "Recommended" content (\`Recomendados para você\`) must be personalized to the current user.

    \*   Implementation: This requires a new, dedicated Supabase Edge Function.

    \*   Function Name: \`get-personalized-recommendations\`

    \*   Logic:

        1\.  Takes \`practitionerId\` as input.

        2\.  Fetches the user's recent interaction history (e.g., last 20 viewed reviews, recently voted-on tags).

        3\.  Creates a "tag vector" representing the user's interests.

        4\.  Fetches a list of all Reviews the user has \*not\* recently interacted with.

        5\.  For each candidate Review, calculates a \`recommendationScore\` based on the similarity of its tags to the user's tag vector.

        6\.  Returns the top 5-10 Reviews with the highest \`recommendationScore\`.

4.2. API Contract: The Consolidated Edge Function

\*   RULE: To prevent multiple network requests, a single, dedicated Supabase Edge Function must be used for the homepage.

\*   Function Name: \`get-homepage-feed\`

\*   Trigger: \`POST /functions/v1/get-homepage-feed\`

\*   Authentication: Required (\`authenticated\`).

\*   Business Logic:

    1\.  This function executes multiple database queries and function calls in parallel on the server.

    2\.  Fetch \`homepage\_layout\` from the \`Site\_Settings\` table.

    3\.  Fetch the current \`Featured\` review.

    4\.  Fetch the 10 most \`Recent\` published reviews.

    5\.  Calculate and fetch the 10 most \`Popular\` reviews using the algorithm from 4.1.1.

    6\.  Fetch the current \`Suggestions\` for the poll.

    7\.  \[UPDATED\]: Asynchronously invoke the \`get-personalized-recommendations\` Edge Function for the current user.

    8\.  Await all promises.

    9\.  Return a single JSON object containing the results of all operations.

\*   Success Response (200 OK):

    \`\`\`json

    {

      "layout": \["featured", "recent", "recommendations", "suggestions", "popular"\],

      "featured": { ...reviewObject },

      "recent": \[{ ...reviewObject }, ...\],

      "popular": \[{ ...reviewObject }, ...\],

      "recommendations": \[{ ...reviewObject }, ...\],

      "suggestions": \[{ ...suggestionObjectWithVotes }, ...\]

    }

    \`\`\`

4.3. Relevant Database Tables & RLS

\*   Tables Read: \`Reviews\`, \`Suggestions\`, \`Suggestion\_Votes\`, \`Site\_Settings\`, and user interaction tables for the recommendation engine.

\*   RLS Policies: The RLS policies defined in \`\[DOC\_4\]\` will be respected, ensuring a user only sees data they are permitted to see.

\================================================================================

5.0. Implementation Checklist

\================================================================================

Category: Backend & Foundation

    \[ \] Task 1.1: Create the \`get-personalized-recommendations\` Supabase Edge Function.

    \[ \] Task 1.2: Update the \`get-homepage-feed\` Edge Function to include the new logic from this blueprint.

Category: Frontend Data Layer

    \[ \] Task 2.1: Update the \`useHomepageFeedQuery\` hook to reflect the new API response shape.

    \[ \] Task 2.2: Create the \`useSubmitSuggestionMutation\` and \`useCastVoteMutation\` hooks.

Category: Frontend UI (Modules)

    \[ \] Task 3.1: Build/verify the \`ReviewCard\` and \`SuggestionPollItem\` atomic components.

    \[ \] Task 3.2: Build/verify the \`FeaturedReview\`, \`ReviewCarousel\`, and \`NextEditionModule\` modules.

Category: Frontend Page

    \[ \] Task 4.1: Build the \`Homepage.js\` page component.

    \[ \] Task 4.2: Implement the skeleton loading and top-level error states.

    \[ \] Task 4.3: Conditionally render all modules based on the \`layout\` array from the API response.

