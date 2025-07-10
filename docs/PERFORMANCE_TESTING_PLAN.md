# Performance Testing & Optimization Plan

Comprehensive performance testing strategy for EVIDENS community management system including all new features implemented in this development cycle.

## 📋 Testing Scope

This performance testing plan covers:

- Reddit-style sidebar with dynamic data loading
- Category system with filtering and visual badges
- PostCard component with new category integration
- Admin community management interfaces
- Security validation systems
- Community announcements API Edge Function
- Community countdown API Edge Function

## 🎯 Performance Objectives

### **Primary Metrics**

- **Page Load Time**: < 2 seconds for initial load
- **Time to Interactive (TTI)**: < 3 seconds
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### **API Performance Targets**

- **Edge Function Response Time**: < 500ms (95th percentile)
- **Database Query Time**: < 200ms (95th percentile)
- **Real-time Updates**: < 100ms latency
- **Concurrent Users**: Support 1000+ concurrent users
- **API Throughput**: 100+ requests/second

### **Resource Optimization Goals**

- **Bundle Size**: < 500KB gzipped
- **Image Optimization**: WebP format, lazy loading
- **Cache Hit Rate**: > 90% for static assets
- **Memory Usage**: < 100MB client-side
- **CPU Usage**: < 50% during peak interactions

## 🧪 Testing Categories

### 1. Component Performance Testing

#### **PostCard Component with Category Integration**

```typescript
// Performance test for PostCard rendering with categories
describe('PostCard Performance', () => {
  it('should render 100 PostCards within 500ms', async () => {
    const startTime = performance.now();

    const posts = generateMockPosts(100);
    render(<PostCardList posts={posts} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('post-card')).toHaveLength(100);
    });

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(500);
  });

  it('should handle category filtering without lag', async () => {
    const posts = generateMockPosts(1000);
    const { rerender } = render(<PostCardList posts={posts} />);

    const startTime = performance.now();
    rerender(<PostCardList posts={posts} filteredCategory="discussion" />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100);
  });
});
```

#### **Reddit-Style Sidebar Performance**

```typescript
describe('Reddit Sidebar Performance', () => {
  it('should load all sidebar sections within 1 second', async () => {
    const startTime = performance.now();

    render(<RedditStyleSidebar />);

    await waitFor(() => {
      expect(screen.getByTestId('sidebar-categories')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-announcements')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-countdown')).toBeInTheDocument();
    });

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(1000);
  });
});
```

### 2. API Performance Testing

#### **Community Announcements API**

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
   "https://project.supabase.co/functions/v1/community-announcements?is_published=true"

# Expected results:
# - 95% of requests < 500ms
# - 0% failed requests
# - Throughput > 50 requests/second
```

#### **Community Countdown API Real-time Performance**

```javascript
// Test real-time countdown calculation performance
async function testCountdownPerformance() {
  const startTime = performance.now();

  const promises = Array.from({ length: 50 }, (_, i) =>
    fetch(`/functions/v1/community-countdown?action=calculate&id=${countdownIds[i]}`)
  );

  await Promise.all(promises);
  const endTime = performance.now();

  console.log(`50 concurrent countdown calculations: ${endTime - startTime}ms`);
  // Target: < 300ms for 50 concurrent calculations
}
```

### 3. Database Performance Testing

#### **Query Optimization**

```sql
-- Test category filtering query performance
EXPLAIN ANALYZE
SELECT cp.*, cc.name as category_name, cc.background_color, cc.text_color, cc.border_color
FROM CommunityPosts cp
LEFT JOIN CommunityCategories cc ON cp.category_id = cc.id
WHERE cc.is_active = true
AND cp.is_published = true
ORDER BY cp.created_at DESC
LIMIT 20;

-- Expected: < 50ms execution time
```

#### **Sidebar Data Query Performance**

```sql
-- Test sidebar data aggregation performance
EXPLAIN ANALYZE
WITH sidebar_data AS (
  SELECT
    (SELECT json_agg(categories.*) FROM CommunityCategories categories WHERE is_active = true) as categories,
    (SELECT json_agg(announcements.*) FROM CommunityAnnouncements announcements WHERE is_published = true LIMIT 5) as announcements,
    (SELECT json_agg(countdowns.*) FROM CommunityCountdowns countdowns WHERE is_active = true LIMIT 3) as countdowns
)
SELECT * FROM sidebar_data;

-- Expected: < 100ms execution time
```

### 4. Frontend Bundle Analysis

#### **Bundle Size Analysis**

```bash
# Analyze bundle size impact of new features
npm run build
npx webpack-bundle-analyzer dist/static/js/*.js

# Check for:
# - Tree shaking effectiveness
# - Code splitting opportunities
# - Unused dependencies
# - Duplicate modules
```

#### **Lighthouse Performance Audit**

```bash
# Run Lighthouse CI for performance regression testing
npx lhci autorun --collect.numberOfRuns=3 --assert.preset=lighthouse:recommended

# Target Lighthouse scores:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 90
# - SEO: > 90
```

## 🚀 Performance Optimization Strategies

### 1. Component-Level Optimizations

#### **React.memo and useMemo Implementation**

```typescript
// Optimize PostCard rendering
export const PostCard = React.memo(({ post }: PostCardProps) => {
  const categoryStyle = useMemo(() =>
    getCategoryStyle(post.category_data), [post.category_data]
  );

  const formattedDate = useMemo(() =>
    formatDate(post.created_at), [post.created_at]
  );

  return (
    <Card className="post-card">
      {/* Optimized rendering */}
    </Card>
  );
});

// Optimize sidebar component
export const RedditStyleSidebar = React.memo(() => {
  const sidebarData = useCommunitySidebarDataQuery();

  const memoizedSections = useMemo(() =>
    processSidebarSections(sidebarData), [sidebarData]
  );

  return <div>{memoizedSections}</div>;
});
```

#### **Virtual Scrolling for Large Lists**

```typescript
// Implement virtual scrolling for category lists
import { FixedSizeList as List } from 'react-window';

export const VirtualizedPostList = ({ posts }: { posts: Post[] }) => {
  const Row = useCallback(({ index, style }: any) => (
    <div style={style}>
      <PostCard post={posts[index]} />
    </div>
  ), [posts]);

  return (
    <List
      height={600}
      itemCount={posts.length}
      itemSize={200}
      overscanCount={5}
    >
      {Row}
    </List>
  );
};
```

### 2. API Optimization

#### **Response Caching Strategy**

```typescript
// Implement intelligent caching for announcements
export const useAnnouncementsQuery = () => {
  return useQuery({
    queryKey: ['announcements', 'published'],
    queryFn: fetchPublishedAnnouncements,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
};

// Implement countdown caching with shorter intervals
export const useCountdownQuery = (id: string) => {
  return useQuery({
    queryKey: ['countdown', id],
    queryFn: () => fetchCountdown(id),
    staleTime: 30 * 1000, // 30 seconds for real-time updates
    refetchInterval: 1000, // Update every second
  });
};
```

#### **Database Query Optimization**

```sql
-- Add strategic indexes for performance
CREATE INDEX CONCURRENTLY idx_community_posts_category_published
ON CommunityPosts(category_id, is_published, created_at DESC);

CREATE INDEX CONCURRENTLY idx_community_categories_active_order
ON CommunityCategories(is_active, display_order);

CREATE INDEX CONCURRENTLY idx_community_announcements_published_priority
ON CommunityAnnouncements(is_published, priority DESC, created_at DESC);
```

### 3. Edge Function Optimization

#### **Response Time Optimization**

```typescript
// Optimize Edge Function with connection pooling
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    db: {
      schema: 'public',
    },
    global: {
      headers: { 'x-my-custom-header': 'my-app-name' },
    },
  }
);

// Implement request batching for bulk operations
async function batchedAnnouncements(requests: AnnouncementRequest[]) {
  const batchSize = 10;
  const results = [];

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(req => processAnnouncementRequest(req)));
    results.push(...batchResults);
  }

  return results;
}
```

### 4. Client-Side Optimization

#### **Image Optimization**

```typescript
// Implement progressive image loading
export const OptimizedImage = ({ src, alt, ...props }: ImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(`${src}?w=50&q=20`); // Low quality placeholder

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
    };
    img.src = src;
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-50'}`}
      {...props}
    />
  );
};
```

#### **Code Splitting Implementation**

```typescript
// Implement route-based code splitting
const CommunityPage = lazy(() => import('../pages/CommunityPage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));

// Component-based code splitting for heavy components
const CategoryManagement = lazy(() =>
  import('../components/admin/CommunityManagement/CategoryManagement')
);

export const App = () => (
  <Router>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Suspense>
  </Router>
);
```

## 📊 Performance Monitoring

### 1. Real-time Monitoring Setup

#### **Web Vitals Tracking**

```typescript
// Implement Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### **API Performance Tracking**

```typescript
// Track API performance in TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onSuccess: (data, query) => {
        const queryTime = Date.now() - query.state.dataUpdatedAt;
        analytics.track('query_performance', {
          queryKey: query.queryKey,
          duration: queryTime,
          dataSize: JSON.stringify(data).length,
        });
      },
    },
  },
});
```

### 2. Automated Performance Testing

#### **CI/CD Performance Gates**

```yaml
# .github/workflows/performance.yml
name: Performance Testing
on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Lighthouse CI
        run: |
          npm ci
          npm run build
          npx lhci autorun
      - name: Performance Budget Check
        run: |
          npm run performance:check
          # Fail if performance budget exceeded
```

#### **Load Testing Automation**

```bash
#!/bin/bash
# scripts/load-test.sh

echo "Running load tests for Edge Functions..."

# Test community-announcements API
ab -n 500 -c 25 -H "Authorization: Bearer $TEST_TOKEN" \
   "$SUPABASE_URL/functions/v1/community-announcements?is_published=true"

# Test community-countdown API
ab -n 1000 -c 50 -H "Authorization: Bearer $TEST_TOKEN" \
   "$SUPABASE_URL/functions/v1/community-countdown?action=list&is_active=true"

echo "Load testing completed. Check results for performance regression."
```

## 🎯 Performance Benchmarks

### **Baseline Measurements**

- Initial page load: **2.1s** → Target: **< 2.0s**
- Category filtering: **150ms** → Target: **< 100ms**
- Sidebar load: **800ms** → Target: **< 500ms**
- API response time: **300ms** → Target: **< 200ms**

### **Optimization Targets**

1. **20% improvement** in initial page load time
2. **30% reduction** in API response times
3. **50% improvement** in category filtering performance
4. **40% reduction** in bundle size for admin components
5. **Zero performance regressions** for existing features

## 📈 Success Criteria

### **Must Have**

- [ ] All Lighthouse scores > 90
- [ ] API response times < 500ms (95th percentile)
- [ ] Zero failed requests under normal load
- [ ] Memory usage < 100MB client-side
- [ ] Bundle size increase < 10% from baseline

### **Should Have**

- [ ] Real-time updates < 100ms latency
- [ ] Support 1000+ concurrent users
- [ ] Cache hit rate > 90%
- [ ] Database query times < 200ms
- [ ] Mobile performance scores > 80

### **Could Have**

- [ ] Offline functionality for cached content
- [ ] Progressive Web App features
- [ ] Advanced caching strategies
- [ ] CDN optimization
- [ ] Server-side rendering implementation

## 🔧 Testing Tools & Infrastructure

### **Performance Testing Stack**

- **Lighthouse CI**: Automated performance auditing
- **Apache Bench (ab)**: API load testing
- **React DevTools Profiler**: Component performance analysis
- **Chrome DevTools**: Detailed performance profiling
- **Bundle Analyzer**: Bundle size optimization
- **Web Vitals**: Real user monitoring

### **Monitoring Infrastructure**

- **Supabase Analytics**: Database performance monitoring
- **Edge Function Logs**: API performance tracking
- **Browser Performance API**: Client-side metrics
- **Custom Analytics**: User experience tracking

This comprehensive performance testing plan ensures all new community management features maintain optimal performance while scaling effectively.
