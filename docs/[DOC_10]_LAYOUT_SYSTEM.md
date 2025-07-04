# **[DOC_10] Layout System Architecture**

**Version:** 1.0  
**Date:** July 4, 2025  
**Purpose:** Comprehensive documentation of the EVIDENS StandardLayout system, including implementation patterns, layout types, and architectural decisions.

---

## **1.0 Layout System Overview**

### **1.1 Core Philosophy**

The EVIDENS platform implements a **Reddit-inspired layout system** that provides consistent content presentation across all pages while maintaining flexibility for different content types and use cases.

**Key Principles:**
1. **Consistent Constraints:** All content respects standardized width boundaries
2. **Responsive Design:** Automatic adaptation from mobile to desktop
3. **Centralized Logic:** Layout calculations are handled by utility functions
4. **Type Safety:** Layout types are enforced via TypeScript
5. **Shell Integration:** Works seamlessly within the existing AppShell boundaries

### **1.2 System Architecture**

The layout system consists of three main components:

1. **StandardLayout Component** (`/src/components/layout/StandardLayout.tsx`)
2. **Layout Utilities** (`/src/lib/layout-utils.ts`)
3. **Type Definitions** (`/src/types/layout.ts`)

---

## **2.0 StandardLayout Component**

### **2.1 Component Interface**

```typescript
interface StandardLayoutProps {
  type: 'standard' | 'content-only' | 'centered' | 'wide' | 'admin' | 'full-width';
  sidebarType?: 'none' | 'right' | 'left';
  sidebarContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
  sidebarClassName?: string;
}
```

### **2.2 Layout Types**

#### **2.2.1 Standard Layout**
- **Use Case:** Traditional content pages with optional sidebar
- **Dimensions:** 756px main content + 316px sidebar = 1200px total
- **CSS Class:** `max-w-[1200px]`
- **Examples:** Homepage, review detail pages

#### **2.2.2 Content-Only Layout**
- **Use Case:** Full-width content without sidebar constraints
- **Dimensions:** Uses available width within shell constraints
- **CSS Class:** `w-full`
- **Examples:** Community pages, search results

#### **2.2.3 Centered Layout**
- **Use Case:** Article-style reading with narrow, focused content
- **Dimensions:** Optimized for readability (typically 65-75ch)
- **CSS Class:** `max-w-4xl`
- **Examples:** Documentation, long-form content

#### **2.2.4 Wide Layout**
- **Use Case:** Admin interfaces and complex content requiring more space
- **Dimensions:** Enhanced width constraints
- **CSS Class:** `max-w-6xl` (1152px)
- **Examples:** Admin dashboard, analytics pages

#### **2.2.5 Admin Layout**
- **Use Case:** Administrative interface with consistent spacing
- **Dimensions:** Similar to wide but with admin-specific styling
- **CSS Class:** Custom admin spacing with `space-y-6`
- **Examples:** User management, content moderation

#### **2.2.6 Full-Width Layout**
- **Use Case:** Special cases requiring maximum available width
- **Dimensions:** No width constraints
- **CSS Class:** `w-full min-h-screen`
- **Examples:** Editor interface, data visualization

### **2.3 Usage Patterns**

#### **2.3.1 Basic Usage**
```typescript
import { StandardLayout } from '@/components/layout/StandardLayout';

export default function MyPage() {
  return (
    <StandardLayout type="standard" contentClassName="space-y-6">
      <h1>Page Content</h1>
      {/* Page content */}
    </StandardLayout>
  );
}
```

#### **2.3.2 With Sidebar**
```typescript
export default function MyPageWithSidebar() {
  return (
    <StandardLayout 
      type="standard"
      sidebarType="right"
      sidebarContent={<MySidebar />}
      contentClassName="space-y-6"
    >
      <h1>Main Content</h1>
      {/* Main content */}
    </StandardLayout>
  );
}
```

#### **2.3.3 Error Boundary Integration**
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ProtectedPage() {
  return (
    <ErrorBoundary tier="page" context="my-page">
      <StandardLayout type="wide" contentClassName="space-y-8">
        {/* Page content */}
      </StandardLayout>
    </ErrorBoundary>
  );
}
```

---

## **3.0 Layout Utilities**

### **3.1 Core Utility Functions**

Located in `/src/lib/layout-utils.ts`:

#### **3.1.1 generateLayoutClasses()**
```typescript
export function generateLayoutClasses(
  type: StandardLayoutType,
  sidebarType: SidebarType = 'none',
  className?: string
): string
```
- **Purpose:** Generates container classes based on layout type
- **Returns:** Tailwind CSS classes for the layout container
- **Examples:**
  - `standard` → `"max-w-[1200px] mx-auto grid gap-6 lg:gap-8"`
  - `wide` → `"max-w-6xl mx-auto w-full"`

#### **3.1.2 generateContentClasses()**
```typescript
export function generateContentClasses(
  contentType: 'main' | 'sidebar' | 'full-width' | 'article' | 'wide',
  className?: string
): string
```
- **Purpose:** Applies content-specific styling
- **Returns:** Tailwind CSS classes for content areas
- **Examples:**
  - `main` → `"min-w-0 max-w-[756px] mx-auto w-full"`
  - `wide` → `"min-w-0 max-w-6xl mx-auto w-full"`

#### **3.1.3 generateCenteringClasses()**
```typescript
export function generateCenteringClasses(): string
```
- **Purpose:** Ensures proper centering within available space
- **Returns:** `"w-full flex justify-center max-w-[1200px] mx-auto"`
- **Usage:** Wraps layout containers for proper shell integration

### **3.2 Layout Constants**

```typescript
export const LAYOUT_CONSTANTS = {
  TOTAL_CONTENT_WIDTH: 1200,
  MAIN_CONTENT_WIDTH: 756,
  SIDEBAR_WIDTH: 316,
  GAP_WIDTH: 24, // lg:gap-6
  MOBILE_BREAKPOINT: 768,
  DESKTOP_BREAKPOINT: 1024,
} as const;
```

---

## **4.0 Responsive Design**

### **4.1 Mobile-First Approach**

All layouts implement mobile-first responsive design:

1. **Mobile (< 768px):** Single column, full-width content
2. **Tablet (768px - 1024px):** Adapted layouts with responsive grids
3. **Desktop (> 1024px):** Full layout with sidebar support

### **4.2 Mobile Adaptation Logic**

```typescript
const isMobile = useIsMobile(); // Custom hook using 768px breakpoint

// Layout automatically adapts based on screen size
const layoutClasses = generateLayoutClasses(type, isMobile ? 'none' : sidebarType);
```

### **4.3 Responsive Grid Patterns**

- **Standard:** `grid-cols-1 lg:grid-cols-[756px_316px]`
- **Wide:** `grid-cols-1` (single column at all breakpoints)
- **Admin:** `grid-cols-1` with enhanced spacing

---

## **5.0 Integration with App Shell**

### **5.1 Shell Boundaries**

The StandardLayout system works within the AppShell constraints:

```
AppShell (100vw)
├── CollapsibleSidebar (if not mobile)
└── Main Content Area
    └── StandardLayout (max-w-[1200px])
        ├── Centering Wrapper
        └── Layout Container
            ├── Main Content
            └── Sidebar (optional)
```

### **5.2 Mobile Shell Integration**

On mobile devices:
- AppShell collapses sidebar to bottom navigation
- StandardLayout uses full available width
- Content is properly padded and centered

### **5.3 Desktop Shell Integration**

On desktop:
- AppShell maintains left sidebar navigation
- StandardLayout centers within remaining space
- Maximum content width is enforced (1200px)

---

## **6.0 Error Boundary Pattern**

### **6.1 Three-Tier Error Boundary System**

All pages using StandardLayout follow this pattern:

```typescript
// Tier 1: Root (App.tsx)
<ErrorBoundary tier="root">

  // Tier 2: Page Level
  <ErrorBoundary tier="page" context="page-name">
    <StandardLayout type="...">

      // Tier 3: Feature Level (optional)
      <ErrorBoundary tier="feature" context="feature-name">
        {/* Feature components */}
      </ErrorBoundary>

    </StandardLayout>
  </ErrorBoundary>

</ErrorBoundary>
```

### **6.2 Error Boundary Configuration**

- **Root:** Ultimate safety net, shows global error page
- **Page:** Isolates page crashes from shell, shows page-specific recovery
- **Feature:** Isolates feature crashes, allows partial page functionality

---

## **7.0 Implementation Guidelines**

### **7.1 Mandatory Patterns**

1. **ErrorBoundary Wrapper:** All pages MUST use ErrorBoundary
2. **StandardLayout Usage:** No custom container implementations
3. **Layout Type Selection:** Choose appropriate type for content needs
4. **Responsive Considerations:** Test on mobile and desktop
5. **Content Constraints:** Respect width limitations

### **7.2 Layout Selection Guide**

| Content Type | Recommended Layout | Rationale |
|--------------|-------------------|-----------|
| Homepage | `content-only` | Optimized for feed content |
| Review Detail | `standard` | Traditional reading with sidebar |
| Community Posts | `content-only` | Thread-style content |
| Admin Dashboard | `wide` | Complex interface needs space |
| Documentation | `centered` | Optimized for reading |
| Editor | `full-width` | Needs maximum available space |

### **7.3 Performance Considerations**

1. **CSS-in-JS Avoided:** Uses Tailwind utility classes
2. **Runtime Calculations:** Minimal JavaScript computation
3. **Responsive Images:** Layout accommodates responsive media
4. **Hydration Safe:** Server and client render identically

---

## **8.0 Testing Strategy**

### **8.1 Layout Integration Tests**

All pages with StandardLayout should include tests for:

```typescript
describe('Layout Integration', () => {
  it('should use StandardLayout with correct type', () => {
    render(<MyPage />);
    const main = screen.getByRole('main');
    expect(main).toHaveClass('max-w-6xl'); // For wide type
  });

  it('should be wrapped in ErrorBoundary', () => {
    render(<MyPage />);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument(); // Indicates ErrorBoundary is working
  });
});
```

### **8.2 Responsive Testing**

```typescript
it('should adapt to mobile breakpoint', () => {
  // Mock useIsMobile hook
  vi.mocked(useIsMobile).mockReturnValue(true);
  
  render(<MyPage />);
  const main = screen.getByRole('main');
  expect(main).toHaveClass('w-full'); // Mobile adaptation
});
```

### **8.3 Accessibility Testing**

```typescript
it('should have proper semantic structure', () => {
  render(<MyPage />);
  
  const main = screen.getByRole('main');
  expect(main).toBeInTheDocument();
  
  const heading = screen.getByRole('heading', { level: 1 });
  expect(heading).toBeInTheDocument();
});
```

---

## **9.0 Migration Guide**

### **9.1 From Custom Layouts**

**Before:**
```typescript
export default function OldPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Content */}
      </div>
    </div>
  );
}
```

**After:**
```typescript
export default function NewPage() {
  return (
    <ErrorBoundary tier="page" context="my-page">
      <StandardLayout type="centered" contentClassName="space-y-6">
        {/* Content */}
      </StandardLayout>
    </ErrorBoundary>
  );
}
```

### **9.2 Benefits of Migration**

1. **Consistency:** All pages follow the same layout patterns
2. **Maintainability:** Centralized layout logic
3. **Responsiveness:** Automatic mobile adaptation
4. **Error Handling:** Built-in error boundary integration
5. **Type Safety:** TypeScript enforcement of layout types

---

## **10.0 Advanced Usage**

### **10.1 Custom Styling**

```typescript
<StandardLayout 
  type="standard"
  className="custom-page-styles" // Applied to centering wrapper
  containerClassName="custom-container" // Applied to layout container  
  contentClassName="custom-content" // Applied to main content
  sidebarClassName="custom-sidebar" // Applied to sidebar
>
  {/* Content */}
</StandardLayout>
```

### **10.2 Dynamic Layout Types**

```typescript
const PageWithDynamicLayout = ({ isAdmin }: { isAdmin: boolean }) => {
  const layoutType = isAdmin ? 'wide' : 'standard';
  
  return (
    <StandardLayout type={layoutType} contentClassName="space-y-6">
      {/* Content adapts based on user role */}
    </StandardLayout>
  );
};
```

### **10.3 Layout Composition**

```typescript
const ComplexPage = () => {
  return (
    <StandardLayout type="wide" contentClassName="space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>Left content</div>
        <div>Right content</div>
      </section>
      
      <StandardLayout type="centered" containerClassName="mt-8">
        <article>Nested centered content</article>
      </StandardLayout>
    </StandardLayout>
  );
};
```

---

## **Appendix A: CSS Classes Reference**

### **A.1 Layout Container Classes**

| Layout Type | CSS Classes |
|-------------|-------------|
| `standard` | `max-w-[1200px] mx-auto grid gap-6 lg:gap-8 justify-center grid-cols-1 lg:grid-cols-[756px_316px]` |
| `content-only` | `w-full min-h-screen bg-background px-4 py-6 lg:px-8` |
| `centered` | `max-w-4xl mx-auto w-full min-h-screen bg-background px-4 py-6 lg:px-8` |
| `wide` | `w-full min-h-screen bg-background px-4 py-6 lg:px-8 overflow-hidden min-w-0 grid gap-6 lg:gap-8 justify-center grid-cols-1 max-w-6xl mx-auto` |
| `admin` | `w-full min-h-screen bg-background px-4 py-6 lg:px-8` |
| `full-width` | `w-full min-h-screen` |

### **A.2 Content Area Classes**

| Content Type | CSS Classes |
|--------------|-------------|
| `main` | `min-w-0 max-w-[756px] mx-auto w-full` |
| `sidebar` | `w-full max-w-[316px]` |
| `full-width` | `w-full` |
| `article` | `max-w-4xl mx-auto w-full` |
| `wide` | `min-w-0 max-w-6xl mx-auto w-full` |

---

## **Appendix B: Migration Checklist**

### **B.1 Page Migration Steps**

- [ ] Remove custom container divs
- [ ] Add ErrorBoundary wrapper with appropriate tier
- [ ] Replace with StandardLayout component
- [ ] Choose appropriate layout type
- [ ] Test responsive behavior
- [ ] Verify error boundary functionality
- [ ] Add layout integration tests
- [ ] Update any related documentation

### **B.2 Common Migration Issues**

1. **Missing ErrorBoundary:** Always wrap StandardLayout in ErrorBoundary
2. **Wrong Layout Type:** Choose based on content needs, not appearance
3. **Custom Styling Conflicts:** Use provided className props instead of custom wrappers
4. **Mobile Testing:** Always test on mobile devices
5. **Accessibility:** Ensure proper semantic structure is maintained

---

**Document Status:** ✅ Complete  
**Last Updated:** July 4, 2025  
**Next Review:** August 2025