
# EVIDENS Community Visual Style Guide - Reddit-Inspired Implementation

**Version:** 2.0.0  
**Date:** June 21, 2025  
**Purpose:** Comprehensive visual specification for implementing Reddit-style interface in EVIDENS Community pages, incorporating authentic Reddit design tokens while maintaining EVIDENS brand identity.

---

## 1. EXECUTIVE SUMMARY

This document establishes the complete visual transformation requirements for implementing a Reddit-inspired community interface based on authentic Reddit CSS variables and design tokens. The transformation focuses on two primary pages: the Community Feed (`/comunidade`) and Individual Post pages (`/comunidade/[postId]`), while strictly preserving EVIDENS color palette and excluding any changes to the app shell, navigation sidebar, or header.

**Critical Design Philosophy:** Extract Reddit's structural and interaction patterns while maintaining EVIDENS brand identity through color adaptation.

---

## 2. REDDIT DESIGN SYSTEM ANALYSIS

### 2.1 Extracted Design Tokens from Reddit CSS

**Spacing System (Reddit Standards):**
- `--spacer-4xs: 0.125rem` (2px)
- `--spacer-2xs: 0.25rem` (4px)
- `--spacer-xs: 0.5rem` (8px)
- `--spacer-sm: 0.75rem` (12px)
- `--spacer-md: 1rem` (16px)
- `--spacer-lg: 1.5rem` (24px)
- `--spacer-xl: 2rem` (32px)
- `--spacer-2xl: 3rem` (48px)

**Typography System (Reddit Font Hierarchy):**
- `--font-12-16-regular: normal 400 0.75rem/1rem var(--font-sans)`
- `--font-12-16-semibold: normal 600 0.75rem/1rem var(--font-sans)`
- `--font-14-20-regular: normal 400 0.875rem/1.25rem var(--font-sans)`
- `--font-14-20-semibold: normal 600 0.875rem/1.25rem var(--font-sans)`
- `--font-16-20-regular: normal 400 1rem/1.25rem var(--font-sans)`

**Border Radius System:**
- `--radius-sm: 0.25rem` (4px)
- `--radius-md: 1.25rem` (20px)
- `--radius-lg: 2rem` (32px)

**Elevation System:**
- `--elevation-xs: 0 0.0625rem 0.125rem 0 #000000ab`
- `--elevation-sm: 0 0.0625rem 0.25rem 0 #00000054,0 0.25rem 0.25rem 0 #00000054`
- `--elevation-md: 0 0.25rem 0.5rem 0 #00000033,0 0.375rem 0.75rem 0 #00000080`

### 2.2 Reddit Color System (For Reference - NOT to be Implemented)

**Note:** These Reddit colors are analyzed for pattern understanding only. EVIDENS colors will be used instead.

**Reddit Dark Theme Neutrals:**
- `--color-neutral-background: #0E1113` (Primary background)
- `--color-neutral-background-strong: #181C1F` (Card backgrounds)
- `--color-neutral-background-container: #181C1F` (Container backgrounds)
- `--color-neutral-background-hover: #181C1F` (Hover states)
- `--color-neutral-border: #FFFFFF33` (Subtle borders)
- `--color-neutral-content: #B7CAD4` (Primary text)
- `--color-neutral-content-weak: #8BA2AD` (Secondary text)

**Reddit Vote Colors (Pattern Analysis):**
- `--color-upvote-plain: #FF895D` (Upvote active)
- `--color-downvote-plain: #9580FF` (Downvote active)
- `--color-upvote-background: #D93900` (Upvote background)
- `--color-downvote-background: #6A5CFF` (Downvote background)

---

## 3. EVIDENS COLOR MAPPING STRATEGY

### 3.1 EVIDENS Brand Color Preservation

**Critical Rule:** All Reddit design patterns will use EVIDENS color palette as defined in `docs/[DOC_7]_VISUAL_SYSTEM.md`.

**EVIDENS Dark Theme Colors (To Be Used):**
- `--background: 0 0% 7%` (#121212) - Maps to Reddit's primary background
- `--surface: 0 0% 10%` (#1a1a1a) - Maps to Reddit's card backgrounds
- `--surface-muted: 0 0% 13%` (#212121) - Maps to Reddit's container backgrounds
- `--border: 0 0% 16%` (#2a2a2a) - Maps to Reddit's subtle borders
- `--foreground: 210 40% 95%` - Maps to Reddit's primary text
- `--text-secondary: 0 0% 28%` (#484848) - Maps to Reddit's secondary text

**Vote System Color Mapping:**
- Upvote Active: Use EVIDENS success color (`#00C61C` equivalent)
- Downvote Active: Use EVIDENS primary color (`#648EFC` equivalent)
- Neutral State: Use EVIDENS muted colors

### 3.2 Component-Specific Color Applications

**Post Containers:**
- Background: `bg-surface` (#1a1a1a)
- Hover: `bg-surface-muted` (#212121)
- Border: `border-border` (#2a2a2a)

**Vote Buttons:**
- Container: `bg-transparent`
- Hover: `bg-surface-muted` with opacity
- Active Upvote: EVIDENS success variant
- Active Downvote: EVIDENS primary variant

---

## 4. STRUCTURAL LAYOUT SPECIFICATIONS

### 4.1 Post Layout Architecture (Reddit Pattern)

**Current EVIDENS Structure:**
```typescript
<Card className="hover:shadow-md transition-shadow cursor-pointer">
  <CardContent className="p-4">
    <div className="flex gap-3">
      <VoteButtons /> // Vertical layout
      <div className="flex-1">...</div>
    </div>
  </CardContent>
</Card>
```

**Target Reddit-Style Structure:**
```typescript
<div className="post-container">
  <div className="post-content flex gap-3 p-4">
    <VoteButtons /> // Horizontal layout
    <div className="flex-1">...</div>
  </div>
  <Separator className="post-separator" />
</div>
```

### 4.2 Vote Button Transformation Specifications

**Current State:** Vertical stack (ChevronUp, score, ChevronDown)
**Target State:** Horizontal row (ChevronUp, score, ChevronDown)

**Exact Implementation Requirements:**
- **Layout Class:** `flex flex-row items-center gap-2`
- **Button Dimensions:** 24px × 24px minimum (Reddit standard)
- **Spacing:** `gap-2` (8px) between elements
- **Button Styles:** Remove card-like appearance, use subtle backgrounds
- **Hover States:** `hover:bg-surface-muted/50` for subtle feedback

**CSS Specifications:**
```css
.reddit-vote-buttons {
  @apply flex flex-row items-center gap-2;
}

.reddit-vote-button {
  @apply w-6 h-6 p-1 rounded hover:bg-surface-muted/50 transition-colors;
  @apply border-0 shadow-none bg-transparent;
}

.reddit-vote-score {
  @apply text-sm font-semibold min-w-[2rem] text-center;
  @apply text-foreground;
}
```

### 4.3 Post Container De-boxing Specifications

**Reddit Post Container Pattern:**
- **Remove:** Card wrapper, box shadows, rounded borders
- **Add:** Horizontal separator lines between posts
- **Background:** Transparent or minimal background
- **Padding:** Consistent with Reddit spacing (`--spacer-md` = 16px)

**Implementation Pattern:**
```css
.reddit-post-item {
  @apply bg-transparent border-0 shadow-none rounded-none;
  @apply border-b border-border last:border-b-0;
  @apply px-4 py-3 hover:bg-surface/30 transition-colors;
}
```

### 4.4 Content Density Optimization

**Reddit Spacing Standards:**
- **Post Vertical Padding:** 12px (`--spacer-sm`)
- **Post Horizontal Padding:** 16px (`--spacer-md`)
- **Element Gaps:** 8px (`--spacer-xs`) to 12px (`--spacer-sm`)
- **Vote-to-Content Gap:** 16px (`--spacer-md`)

**Typography Hierarchy:**
- **Post Titles:** `text-lg font-semibold` (18px, 600 weight)
- **Post Content:** `text-sm` (14px, 400 weight)
- **Metadata:** `text-xs text-secondary` (12px, muted color)
- **Vote Scores:** `text-sm font-semibold` (14px, 600 weight)

---

## 5. INTERACTION DESIGN SPECIFICATIONS

### 5.1 Hover State Behaviors

**Post Hover Effect (Reddit Standard):**
- **Duration:** 150ms
- **Easing:** `ease-out`
- **Background Change:** `hover:bg-surface/30`
- **No Scale or Shadow Changes:** Maintain flat design

**Vote Button Hover:**
- **Duration:** 100ms
- **Background:** `hover:bg-surface-muted/50`
- **Icon Color:** Slight brightness increase
- **No Scale Effects:** Keep buttons flat

### 5.2 Active State Specifications

**Vote Active States:**
- **Upvote Active:** EVIDENS success color with background
- **Downvote Active:** EVIDENS primary color with background
- **Neutral State:** Default foreground color
- **Disabled State:** Reduced opacity (40%)

---

## 6. RESPONSIVE DESIGN ADAPTATIONS

### 6.1 Mobile Optimization

**Vote Button Mobile Behavior:**
- **Maintain Horizontal Layout:** Even on small screens
- **Increase Touch Targets:** 44px minimum for mobile
- **Preserve Spacing:** Use relative units for consistency
- **Stack Adjustments:** Content may wrap but votes stay horizontal

**Content Reflow:**
- **Title Wrapping:** Allow natural text wrapping
- **Metadata Stacking:** Stack author info vertically on narrow screens
- **Action Buttons:** Maintain horizontal layout with adequate spacing

### 6.2 Desktop Enhancements

**Enhanced Hover Feedback:**
- **Post Highlighting:** Subtle background change on entire post area
- **Vote Button Feedback:** Individual button hover states
- **Cursor Changes:** Appropriate pointer cursors for interactive elements

---

## 7. COMPONENT-SPECIFIC IMPLEMENTATION REQUIREMENTS

### 7.1 VoteButtons Component Transformation

**Current File:** `src/components/community/VoteButtons.tsx`

**Required Changes:**
1. **Layout Transformation:** Change `flex-col` to `flex-row`
2. **Spacing Adjustment:** Use `gap-2` instead of `gap-1`
3. **Button Styling:** Remove card-like appearance, add subtle hover
4. **Score Display:** Center between buttons with proper spacing
5. **Icon Sizing:** Maintain 16px (w-4 h-4) icons
6. **State Colors:** Map to EVIDENS color system

**New Structure:**
```typescript
<div className="flex flex-row items-center gap-2">
  <Button className="reddit-vote-button">
    <ChevronUp className="w-4 h-4" />
  </Button>
  <span className="reddit-vote-score">{netScore}</span>
  <Button className="reddit-vote-button">
    <ChevronDown className="w-4 h-4" />
  </Button>
</div>
```

### 7.2 PostCard Component Restructure

**Current File:** `src/components/community/PostCard.tsx`

**Required Changes:**
1. **Remove Card Wrapper:** Replace with simple div
2. **Add Separator:** Use border-bottom for post separation
3. **Adjust Padding:** Use Reddit spacing standards
4. **Update Hover:** Implement subtle background hover
5. **Content Spacing:** Optimize for higher density

**New Structure:**
```typescript
<div className="reddit-post-item">
  <div className="flex gap-4 p-4">
    <VoteButtons /> // Now horizontal
    <div className="flex-1 space-y-2">
      <PostHeader />
      <PostContent />
      <PostActions />
    </div>
  </div>
</div>
```

### 7.3 CommunityFeed Container Updates

**Current File:** `src/components/community/CommunityFeed.tsx`

**Required Changes:**
1. **Remove Card Spacing:** Change from `space-y-4` to no spacing
2. **Container Background:** Ensure proper background inheritance
3. **Separator Implementation:** Add between posts, not around them

**New Structure:**
```typescript
<div className="reddit-feed-container">
  {posts.map((post, index) => (
    <React.Fragment key={post.id}>
      <PostCard post={post} />
      {index < posts.length - 1 && <Separator />}
    </React.Fragment>
  ))}
</div>
```

---

## 8. TAILWIND CSS INTEGRATION

### 8.1 Custom Utilities Required

**Reddit-Specific Classes:**
```css
@layer components {
  .reddit-post-item {
    @apply bg-transparent border-0 shadow-none rounded-none;
    @apply border-b border-border last:border-b-0;
    @apply px-4 py-3 hover:bg-surface/30 transition-colors;
  }

  .reddit-vote-buttons {
    @apply flex flex-row items-center gap-2;
  }

  .reddit-vote-button {
    @apply w-6 h-6 p-1 rounded hover:bg-surface-muted/50 transition-colors;
    @apply border-0 shadow-none bg-transparent;
  }

  .reddit-vote-score {
    @apply text-sm font-semibold min-w-[2rem] text-center text-foreground;
  }

  .reddit-post-content {
    @apply space-y-2;
  }

  .reddit-post-title {
    @apply text-lg font-semibold text-foreground leading-tight;
  }

  .reddit-post-body {
    @apply text-sm text-foreground/80 leading-relaxed;
  }

  .reddit-post-meta {
    @apply text-xs text-secondary flex items-center gap-2;
  }
}
```

### 8.2 Tailwind Config Updates

**Required Extensions:**
```typescript
// tailwind.config.ts additions
theme: {
  extend: {
    spacing: {
      // Reddit spacing tokens
      'reddit-xs': '0.5rem',    // 8px
      'reddit-sm': '0.75rem',   // 12px  
      'reddit-md': '1rem',      // 16px
      'reddit-lg': '1.5rem',    // 24px
    }
  }
}
```

---

## 9. IMPLEMENTATION PHASES

### 9.1 Phase 1: Vote System Transformation (Priority 1)
**Estimated Time:** 45 minutes
**Components:** `VoteButtons.tsx`
**Changes:**
- Layout change from vertical to horizontal
- Styling updates for Reddit appearance
- Hover state implementations
- Responsive behavior validation

### 9.2 Phase 2: Post Container Redesign (Priority 1)
**Estimated Time:** 60 minutes
**Components:** `PostCard.tsx`, `PostDetailCard.tsx`
**Changes:**
- Remove Card wrappers
- Implement separator-based layout
- Content spacing optimization
- Hover state integration

### 9.3 Phase 3: Feed Layout Updates (Priority 2)
**Estimated Time:** 30 minutes
**Components:** `CommunityFeed.tsx`
**Changes:**
- Container spacing adjustments
- Separator integration
- Background consistency

### 9.4 Phase 4: Responsive Optimization (Priority 3)
**Estimated Time:** 30 minutes
**Components:** All updated components
**Changes:**
- Mobile layout validation
- Touch target optimization
- Content reflow testing

---

## 10. QUALITY ASSURANCE SPECIFICATIONS

### 10.1 Visual Consistency Checklist
- [ ] All posts use consistent spacing (16px horizontal, 12px vertical)
- [ ] Vote buttons maintain horizontal layout across all screen sizes
- [ ] Hover states provide subtle feedback without jarring transitions
- [ ] Typography hierarchy matches Reddit standards
- [ ] Color usage follows EVIDENS brand guidelines
- [ ] Separators appear between all posts except the last

### 10.2 Functional Validation
- [ ] Vote functionality remains unchanged
- [ ] Post navigation works correctly
- [ ] Mobile touch interactions function properly
- [ ] Keyboard navigation maintains accessibility
- [ ] Loading states integrate with new design
- [ ] Error states maintain consistency

### 10.3 Performance Considerations
- [ ] CSS animations use transform/opacity for performance
- [ ] Hover effects don't trigger layout recalculations
- [ ] Component re-renders remain optimized
- [ ] Image loading maintains efficiency

---

## 11. ACCESSIBILITY COMPLIANCE

### 11.1 Reddit Pattern Accessibility
**Maintained Standards:**
- Vote buttons remain focusable with keyboard navigation
- Screen reader compatibility for horizontal vote layout
- Color contrast ratios meet WCAG 2.1 AA standards
- Touch targets meet minimum 44px requirement on mobile

### 11.2 ARIA Requirements
**Vote System:**
- `aria-label` for upvote/downvote buttons
- `aria-describedby` for vote scores
- `role="group"` for vote button container

**Post Structure:**
- Proper heading hierarchy maintained
- `aria-label` for post actions
- Alternative text for media content

---

## 12. BROWSER COMPATIBILITY

### 12.1 Supported Environments
- Chrome 90+
- Firefox 88+ 
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

### 12.2 Fallback Strategies
- CSS Grid fallbacks for older browsers
- Flexbox alternatives where needed
- Progressive enhancement for hover effects
- Graceful degradation for animations

---

## 13. TESTING STRATEGY

### 13.1 Visual Regression Testing
- Screenshot comparison with Reddit reference interface
- Cross-browser visual consistency validation
- Mobile/desktop responsive design verification
- Dark theme accuracy assessment

### 13.2 User Experience Testing
- Vote interaction flow validation
- Post navigation experience testing
- Mobile touch interaction assessment
- Keyboard accessibility verification

### 13.3 Performance Testing
- Animation performance validation
- Scroll performance with new layout
- Memory usage monitoring
- Initial render speed assessment

---

## 14. MAINTENANCE CONSIDERATIONS

### 14.1 Code Organization
**File Structure Preservation:**
- Maintain existing component hierarchy
- Preserve hook abstractions
- Keep TypeScript type safety
- Document all changes in component comments

### 14.2 Future Scalability
**Design System Integration:**
- Reddit patterns integrate with existing EVIDENS design tokens
- Component variations support future customization
- Style utilities remain composable
- Brand color system remains flexible

---

## 15. TECHNICAL IMPLEMENTATION NOTES

### 15.1 CSS Architecture Strategy
**Approach:**
- Maximize Tailwind utility classes
- Minimize custom CSS additions
- Leverage existing EVIDENS design tokens
- Maintain component-scoped styling patterns

### 15.2 TypeScript Considerations
**Requirements:**
- Preserve all existing type definitions
- Maintain type safety for component props
- Update interfaces only where necessary
- Ensure compatibility with existing data hooks

---

## 16. VALIDATION CRITERIA

### 16.1 Design Fidelity Targets
- **Layout Similarity:** 95%+ match to Reddit post structure
- **Interaction Patterns:** Identical hover and click behaviors
- **Content Density:** Similar information density per screen
- **Visual Hierarchy:** Clear title/content/metadata distinction

### 16.2 Functional Integrity Requirements
- **Zero Functionality Loss:** All existing features must work identically
- **Performance Maintenance:** No performance degradation
- **Accessibility Preservation:** All accessibility features maintained
- **Mobile Experience:** Equal or improved mobile usability

---

## 17. IMPLEMENTATION CONSTRAINTS

### 17.1 Strict Limitations
**Forbidden Changes:**
- App shell modifications
- Navigation sidebar alterations  
- Header component changes
- Authentication page updates
- Color palette modifications (use EVIDENS colors only)

**Allowed Changes:**
- Content area within `/comunidade` routes only
- Post display components
- Community-specific interactions
- Layout density optimizations

### 17.2 Brand Preservation Rules
**EVIDENS Identity Maintenance:**
- Logo unchanged
- Color scheme adapted, never replaced
- Typography system respected
- Overall brand voice preserved through color choices

---

## CONCLUSION

This comprehensive specification provides the complete blueprint for transforming EVIDENS community interface to match Reddit's interaction patterns and visual density while strictly maintaining EVIDENS brand identity. The implementation focuses on structural changes (horizontal votes, de-boxed posts, separator-based layout) while adapting all colors to the existing EVIDENS palette.

**Implementation Priority:**
1. **Vote System Horizontal Transformation** (Highest Impact)
2. **Post Container De-boxing** (Visual Transformation)
3. **Feed Layout Optimization** (Density Improvement)
4. **Responsive Polish** (User Experience)

**Success Metrics:**
- Visual similarity to Reddit interface patterns: 95%+
- Functional preservation: 100%
- Brand consistency: 100%
- Performance maintenance: No degradation
- Accessibility compliance: Full WCAG 2.1 AA

**Document Status:** Complete and ready for implementation
**Next Steps:** Begin Phase 1 with VoteButtons component horizontal transformation

---

**✅ Reddit-inspired design system specification complete with EVIDENS brand preservation.**
