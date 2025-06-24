**docs/blueprints/07\_PROFILE\_BLUEPRINT.md**

**Version 1.0 – June 14 2025**

**Layer 1 · Purpose & User-Stories (“Why”)**

**ID	Persona / Scenario	Pain-Point	Outcome**

**US-1	Ana (Resident) opens another user’s avatar in a thread	Needs a 5-second sense of credibility—“Is this commenter legit?”	Hover/Long-press Card shows name, profession flair, contribution score, affiliation**

**US-2	Carla (Clinician) lands on her own profile	Wants to edit biography & social links quickly	“Editar Perfil” sheet with live preview and instant save**

**US-3	Bruno (Content creator) checks his impact	Needs vanity metrics & evidence of authority	“Atividade” tab counts posts, comments, total up-votes**

**US-4	All authenticated users	Need to see saved items later	Separate “Salvos” list (Reviews \+ Posts) with filter chips**

**US-5	Privacy-conscious user	Doesn’t want hover cards shown	Profile setting “Exibir cartão de perfil” off → API omits data**

**Layer 2 · Visual / Interaction Blueprint (“What”)**

**2.1 Profile Header (Desktop & Mobile)**

**scss**

**Copy**

**Edit**

**┌─────────────────────────────────────────────┐**

**│◄ Back (mobile)        avatar  \+  full\_name │**

**│                         \[profession flair\] │**

**│                 contribution\_score\_chip    │**

**│      affiliation • │**

**└─────────────────────────────────────────────┘**

**Avatar: 96 × 96 desktop; 72 × 72 mobile**

**Flair chip color \= primary.600 light theme / primary.400 dark**

**Contribution chip icon: ⭐ \+ number; tiers text hidden on mobile to save width.**

**2.2 Tab Navigation**

**Desktop: visible Tabs component (shadcn/ui).**

**Mobile: horizontally swipeable (SwiperJS) \+ sticky top when scrolling.**

**Tab	Default list component	Empty State copy**

**Atividade	ActivityFeedList (posts & comments, chronological)	“Nenhuma atividade ainda.”**

**Salvos	SavedList (mixed Reviews & Posts)	“Nada salvo. Toque no ícone \- para salvar.”**

**Contribuições	BreakdownList (top-voted posts)	“Comece contribuindo na Comunidade.”**

**2.3 Hover / Long-Press Card**

**Desktop: \<ProfileHoverCard /\> via @radix-ui/react-hover-card delay 300 ms**

**Mobile: long-press 500 ms on avatar → bottom sheet modal (@radix-ui/react-dialog)**

**Card layout (160 × 200):**

**Avatar 48 × 48; Name \+ Flair**

**Contribution score \+ tier label (“Participante Ativo”, etc.)**

**3 metadata lines: Profession, Affiliation, Joined date**

**Follow button (placeholder – future feature).**

**Layer 3 · Front-End “Code Map”**

**Component	Props	State	Responsibilities**

**ProfilePage	userId: string | "me"	—	Top-level route; fetches data, renders header \+ tabs**

**ProfileHeader	{ profile: Practitioner }	none	UI described 2.1**

**TabsWrapper	{ activeTab, onTabChange }	internal swipe index	Keeps Tab & swipe in sync**

**ActivityFeedList	{ userId }	pagination cursor	Infinite scroll using useInfiniteActivityQuery**

**SavedList	{ userId }	filter chip state	Shows Reviews first then Posts**

**ProfileHoverCard	{ practitionerId }	fetched card data	Caches result 5 min via React Query**

**LongPressAvatar	{ practitioner }	press timer	Mobile wrapper around avatar to trigger sheet**

**EditProfileSheet	{ open, onClose }	form values	Uses Zod form; optimistic mutation**

**All server data flows through hooks defined in DOC 06\. No component calls supabase directly.**

**Layer 4 · Backend Interfaces (“Engine Room”)**

**4.1 Tables & Columns Used**

**Practitioners (profile, flair, biography, display\_hover\_card)**

**CommunityPosts & CommunityPost\_Votes (for contribution score & activity feed)**

**Saved\_Items (new junction table: item\_id, item\_type, user\_id, PK (item\_id,user\_id))**

**4.2 Queries / RPCs**

**Hook	Source	Notes**

**useUserProfileQuery(userId)	Auto-API: SELECT \* FROM Practitioners WHERE practitioner\_id \= :id	RLS allows public read of non-private fields.**

**useActivityQuery(userId, cursor)	Edge Function get-user-activity (complex union of posts & comments)	Returns batch \+ next cursor**

**useContributionSummary(userId)	SQL view v\_contribution\_summary	Pre-aggregated daily by ETL**

**useSavedItems(userId)	Auto-API on Saved\_Items join views	Filter param item\_type**

**4.3 Mutations**

**saveItem / unsaveItem – Edge Function toggle-save-item for atomic insert/delete**

**updateProfile – PATCH via auto-API on Practitioners (RLS: only self or admin)**

**toggleHoverCardVisibility – same endpoint, boolean column.**

**Layer 5 · Implementation Checklist**

**DB Migration**

**1.1 Create Saved\_Items table with FK to Practitioners.**

**1.2 Add joined\_at column to Practitioners (default row’s created\_at).**

**Backend**

**2.1 Create Edge Function get-user-activity.**

**2.2 Create Edge Function toggle-save-item.**

**Hooks (DOC 06 updates)**

**3.1 useUserProfileQuery**

**3.2 useActivityQuery (+ infinite)**

**3.3 useSavedItemsQuery (+ mutation)**

**Components**

**4.1 ProfileHeader**

**4.2 TabsWrapper with swipe support**

**4.3 ActivityFeedList with lazy masonry on desktop**

**4.4 SavedList**

**4.5 ProfileHoverCard / LongPressAvatar**

**4.6 EditProfileSheet (ModalSheet on mobile)**

**Mobile QA**

**5.1 Long-press gesture tested on iOS & Android.**

**5.2 Tabs swipe fluency @60 fps.**

**Accessibility Pass**

**6.1 Ensure focus trapping in sheets; aria-labels on icon buttons.**

**Unit Tests (vitest)**

**7.1 Hook caching & refetch.**

**7.2 Edge function auth guards.**

**E2E (Playwright)**

**8.1 Visit profile, edit bio, verify saved.**

**8.2 Save/unsave flow round-trip.**

**End of Blueprint 07 – Profile & Social Layer**

