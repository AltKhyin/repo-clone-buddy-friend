# **\[Blueprint\] 04: Acervo (Archive)**

Version: 1.0  
Date: July 6, 2025  
Purpose: This document is the canonical, feature-specific blueprint for the Acervo (/acervo) page. It defines the complete visual, functional, and technical specification for the platform's primary content library and discovery engine.

**IMPLEMENTATION STATUS NOTE**: The current implementation includes additional features beyond this blueprint. See Section 6.0 for implemented enhancements.

## **1.0 Core Principles & User Experience**

### **1.1 Feature Goal**

To provide users with a visually engaging and highly performant way to browse the entire collection of published Reviews. The core interaction is designed to help users surface the most relevant content based on their interests without ever losing sight of the full breadth of the curated collection.

### **1.2 The Core UX Mandate: Reorder, Don't Filter**

- **RULE:** This is the most critical principle for this feature. When a user selects tags, the system **MUST NOT** filter or hide any Review cards.
- **BEHAVIOR:** Instead, the entire grid of Review cards must be **REORDERED** based on a relevance score. Reviews that match the selected tags are moved to the top of the grid. Reviews that do not match are moved to the bottom.
- **RATIONALE:** This interaction model maintains the user's perception of a rich and complete content library, which aligns with the product's "Amostragem de Excelência" philosophy (\[DOC_1\]), while still providing a powerful discovery tool.

### **1.3 Core User Stories**

- **Story:** As a Practitioner, I want to navigate to the Acervo page and see all available Reviews displayed in a visually dense, masonry-style grid, sorted by the most recent publication date by default.
- **Story:** On the Acervo page, I want to select a topic tag (categoria) to instantly reorder the grid, bringing Reviews related to that topic to the top.
- **Story:** When I select a parent tag (categoria), I want to see its related sub-tags (subtags) appear, allowing me to further refine the relevance-based ordering of the grid.
- **Story:** As a Practitioner, I want this reordering interaction to feel instantaneous, with no page reloads or noticeable loading delays.

### **1.4 Guiding Constitutional Documents**

- **Visuals & Styling:** All components defined MUST adhere to **\[DOC_7\]\_VISUAL_SYSTEM.md**.
- **Mobile Adaptation:** All layout and component transformations MUST adhere to **\[DOC_8\]\_MOBILE_ADAPTATION.md**.
- **Data Fetching:** All data fetching MUST adhere to the patterns defined in **\[DOC_6\]\_DATA_FETCHING_STRATEGY.md**.
- **Security:** All data access MUST be secured by the policies defined in **\[DOC_4\]\_ROW_LEVEL_SECURITY.md**.

## **2.0 Visual & Interaction Blueprint**

### **2.1 Desktop View (\>= 1024px)**

- **Layout:** A full-screen page within the AppShell. The layout consists of two main sections:
  1. **TagsPanel:** A horizontal bar at the top of the content area, below the page title. It displays a series of "pill" style buttons for tag selection.
  2. **MasonryGrid:** Below the TagsPanel, a multi-column masonry grid displays all the ReviewCard components.
- **Interaction Flow:**
  1. **Initial State:** The grid is sorted by publication date (newest first). Only parent tags (categorias) are visible in the TagsPanel.
  2. **Tag Selection:** User clicks a categoria pill.
     - The grid instantly re-animates to its new order.
     - The selected tag pill changes to its "Selected" visual state.
     - All child tags (subtags) belonging to the selected categoria appear next to it, styled in the "Highlighted" state.
  3. **Subtag Selection:** User can click on subtags to add them to the selection and further refine the ordering.
  4. **Deselection:** Clicking a selected tag removes it from the selection, and the grid instantly reorders again. If no tags are selected, the grid returns to the default chronological sort.

### **2.2 Mobile View (\< 1024px)**

- **Layout:** A single-column view. The MasonryGrid reflows into a **two-column** layout.
- **Interaction Flow Transformation:**
  1. The persistent TagsPanel **IS REMOVED**. It is replaced by a single "Categorias" button at the top of the page.
  2. Tapping the "Categorias" button **MUST** open the tag selection interface in a **Bottom Sheet Modal**.
  3. The user selects tags within this modal.
  4. A "Apply" or "View Results" button in the modal dismisses it and triggers the grid reordering animation on the page behind it.

### **2.3 Visual States for Tags**

- **Selected:** White background, dark text.
- **Highlighted (subtags of a selected parent):** Transparent background, dim outline, white text.
- **Unselected:** Transparent background, no outline, dim white text.

## **3.0 Front-End Architecture**

### **3.1 Component Breakdown & Contracts**

| Component Name      | Type         | Props Contract                                       | State Management                                               | Responsibilities                                                                                                                                           |
| :------------------ | :----------- | :--------------------------------------------------- | :------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AcervoPage.js       | Page         | ()                                                   | Manages selectedTags: string\[\]. Consumes useAcervoDataQuery. | The root component for /acervo. Fetches all initial data. Manages the state of selected tags. Orchestrates all child components.                           |
| TagsPanel.js        | Module       | { allTags: TagHierarchy, selectedTags, onTagSelect } | Manages which subtags are visible.                             | Renders the tag pills. Handles the logic for revealing subtags. Calls onTagSelect callback when a tag is clicked.                                          |
| MasonryGrid.js      | Module       | { reviews: Review\[\] }                              | None                                                           | Renders the masonry layout. Uses a library like react-masonry-css to calculate grid positions. Renders a ReviewCard for each review.                       |
| ClientSideSorter.js | Wrapper/Hook | { reviews, selectedTags, children }                  | Uses useMemo for performance.                                  | A logical component/hook that takes the full list of reviews and the selected tags, performs the sorting, and passes the sorted list down to its children. |
| ReviewCard.js       | Atomic       | { review: Review }                                   | None                                                           | Renders a single, clickable card for a Review, displaying its cover art and title.                                                                         |

### **3.2 State Management & Data Flow**

- **Data Fetching:** The root AcervoPage.js component is the **only** component that fetches data. It uses a single dedicated hook, useAcervoDataQuery.
- **Client-Side State:** The array of selectedTags is the only significant piece of state. It is managed in AcervoPage.js with useState and passed down to children.
- **Sorting Logic:** The re-sorting computation happens entirely on the client within the ClientSideSorter (or a useMemo hook inside AcervoPage).
  - **Scoring Function:** The sorting logic must implement the simplified scoring rule: **\+1 point for every matching tag** in the selectedTags array.
  - **Tie-Breaking:** If two Reviews have the same score, their relative order should be determined by publication date (newest first).

## **4.0 Backend Architecture & Data Flow**

### **4.1 Data Requirements**

The page requires two sets of data on initial load:

1. The complete list of all Reviews that the current user is permitted to see.
2. The complete hierarchy of all Tags.

### **4.2 API Contract: The Consolidated Endpoint**

- **RULE:** To prevent multiple network round-trips, a single, dedicated Supabase Edge Function or RPC call must be created.
- **Function Name:** get-acervo-data
- **Business Logic:**
  1. This function executes two database queries **in parallel**.
  2. Query 1: Fetch all Reviews where status \= 'published'. This query will be subject to RLS, naturally filtering the results based on the user's access tier.
  3. For each Review returned, perform a subquery to get all its associated tags and format them into the client-side-ready JSON object: { "Categoria": \["Subtag1"\], ... }.
  4. Query 2: Fetch the entire Tags table to reconstruct the hierarchy on the client.
  5. Return a single JSON object containing both the list of reviews (with pre-processed tags) and the list of all tags.
- **Success Response (200 OK):**  
  {  
   "reviews": \[  
   {  
   "review_id": 1,  
   "title": "...",  
   "cover_image_url": "...",  
   "tags_json": { "Cardiologia": \["Estatinas"\] }  
   },  
   ...  
   \],  
   "tags": \[  
   { "tag_id": 1, "tag_name": "Cardiologia", "parent_id": null },  
   { "tag_id": 2, "tag_name": "Estatinas", "parent_id": 1 },  
   ...  
   \]  
  }

## **5.0 Implementation Checklist**

### **Backend & Foundation**

- \[ \] **Task 1.1:** Implement the get-acervo-data Supabase Edge Function with the logic specified in section 4.2.
- \[ \] **Task 1.2:** Ensure RLS policies on the Reviews table correctly filter the initial data set based on user tier.

### **Frontend Data Layer**

- \[ \] **Task 2.1:** Create the useAcervoDataQuery custom hook that calls the get-acervo-data function, adhering to \[DOC_6\].

### **Frontend UI (Desktop)**

- \[ \] **Task 3.1:** Build the TagsPanel.js component, including the logic to handle visual states and reveal subtags.
- \[ \] **Task 3.2:** Build the MasonryGrid.js component using a suitable library.
- \[ \] **Task 3.3:** Build the AcervoPage.js component for desktop, composing the modules and implementing the client-side sorting logic.

### **Frontend UI (Mobile Adaptation)**

- \[ \] **Task 4.1:** Create the "Filter" button that will be shown on mobile.
- \[ \] **Task 4.2:** Create the BottomSheet modal component.
- \[ \] **Task 4.3:** Place the TagsPanel logic inside the BottomSheet modal for mobile viewports.
- \[ \] **Task 4.4:** Ensure the masonry grid correctly reflows to a two-column layout on mobile.

### **Final Integration**

- \[ \] **Task 5.1:** Implement skeleton loading states for the page.
- \[ \] **Task 5.2:** Implement the top-level error state.
- \[ \] **Task 5.3:** Conduct thorough testing of the reordering logic, tie-breaking, and responsive behavior.

---

## **6.0 Additional Implemented Features**

The current Acervo implementation includes enhancements beyond the original blueprint specification:

### **6.1 Search Functionality**

**Implementation Status**: ✅ **IMPLEMENTED**

- **Real-time Search**: Search query state management with instant filtering
- **Search Integration**: Works alongside tag-based reordering system
- **UI Components**: Search input field with proper debouncing
- **State Management**: `const [searchQuery, setSearchQuery] = useState<string>('')`

```typescript
// Additional search state in AcervoPage
const [searchQuery, setSearchQuery] = useState<string>('');

// Search filtering combined with tag reordering
const filteredAndSortedReviews = useMemo(() => {
  let filtered = reviews;

  // Apply search filter first
  if (searchQuery.trim()) {
    filtered = reviews.filter(
      review =>
        review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Then apply tag-based reordering
  return applyTagReordering(filtered, selectedTags);
}, [reviews, searchQuery, selectedTags]);
```

### **6.2 Enhanced Sorting Options**

**Implementation Status**: ✅ **IMPLEMENTED**

- **Multiple Sort Modes**: Beyond the blueprint's chronological default
  - `'recent'`: Newest first (blueprint default)
  - `'popular'`: Most viewed/highest engagement
  - `'alphabetical'`: A-Z title sorting
- **Sort State Management**: `const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent')`
- **Combined Logic**: Sorting works with both search and tag reordering

### **6.3 Access Control Integration**

**Implementation Status**: ✅ **IMPLEMENTED**

- **Subscription-Tier Filtering**: Content access based on user subscription level
- **Premium Content Handling**: Proper filtering for paying vs. free users
- **RLS Integration**: Enhanced Row Level Security policy compliance
- **Dynamic Access**: Real-time access control based on user authentication state

### **6.4 Implementation Architecture**

The additional features are implemented while maintaining the core "Reorder, Don't Filter" principle:

1. **Search Application**: Applied as pre-filter before tag reordering
2. **Sort Options**: Available as secondary ordering after tag relevance
3. **Access Control**: Integrated at data fetching level via RLS policies
4. **State Coordination**: All features work together without conflicts

```typescript
// Enhanced AcervoPage state management
const AcervoPage = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');

  // Core data fetching with access control
  const { data, isLoading, error } = useAcervoDataQuery();

  // Combined processing: search → tag reordering → sort
  const processedReviews = useMemo(() => {
    return applySearchAndSort(data?.reviews, {
      searchQuery,
      selectedTags,
      sortBy
    });
  }, [data, searchQuery, selectedTags, sortBy]);

  return (
    <div>
      <SearchInput value={searchQuery} onChange={setSearchQuery} />
      <SortSelector value={sortBy} onChange={setSortBy} />
      <TagsPanel selectedTags={selectedTags} onTagSelect={setSelectedTags} />
      <MasonryGrid reviews={processedReviews} />
    </div>
  );
};
```

### **6.5 Blueprint Compliance Note**

These enhancements **maintain full compliance** with the original blueprint principles:

- ✅ **"Reorder, Don't Filter" UX**: Tag selection still reorders, never hides content
- ✅ **Client-side Performance**: All processing remains client-side
- ✅ **Responsive Design**: Mobile bottom sheet modal preserved
- ✅ **Tag Hierarchy**: Parent/child tag relationships maintained
- ⭐ **Enhanced Discovery**: Search and sort provide additional discovery paths
