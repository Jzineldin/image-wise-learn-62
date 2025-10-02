# Tale Forge - Audit Action Checklist
**Quick Reference for Implementing Audit Recommendations**

---

## 🔴 CRITICAL - Do These First (7 hours total)

### [ ] 1. Fix Hardcoded Supabase Keys (15 min)
**File:** `src/integrations/supabase/client.ts`

```typescript
// Replace lines 5-6 with:
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}
```

**Create `.env.example`:**
```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

### [ ] 2. Update Dependencies (5 min)
```bash
npm update vite esbuild
npm audit fix
npm audit --production
```

**Verify:** No moderate/high vulnerabilities remain

---

### [ ] 3. Fix Credit Display in StoryViewer (4 hours)
**File:** `src/pages/StoryViewer.tsx` (Lines 1260-1261)

**Step 1:** Create `useStoryCredits` hook:
```typescript
// src/hooks/useStoryCredits.ts
export const useStoryCredits = (storyId: string, segments: any[]) => {
  const { user } = useAuth();
  
  const { data: userCredits } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user?.id)
        .single();
      return data?.credits || 0;
    },
    enabled: !!user?.id
  });

  const creditsUsed = useMemo(() => {
    return segments.reduce((total, seg) => {
      let cost = 2; // Base segment cost (text + image)
      if (seg.audio_url) {
        const wordCount = seg.content?.split(/\s+/).length || 0;
        cost += Math.ceil(wordCount / 100); // 1 credit per 100 words
      }
      return total + cost;
    }, 0);
  }, [segments]);

  return { userCredits, creditsUsed };
};
```

**Step 2:** Update StoryViewer.tsx:
```typescript
const { userCredits, creditsUsed } = useStoryCredits(id!, segments);

// Replace lines 1260-1261:
creditsUsed={creditsUsed}
totalCredits={userCredits}
```

---

### [ ] 4. Fix Global Event Listener Cleanup (30 min)
**File:** `src/main.tsx`

**Move event listeners to App.tsx:**
```typescript
// src/App.tsx - Add inside App component
useEffect(() => {
  const errorHandler = (event: ErrorEvent) => {
    const err = event.error;
    const message = event.message;
    const actionable = (err && (err.message || err.stack)) || 
                       (typeof message === 'string' && message.trim() && message !== 'Script error.');
    
    if (!actionable) return;
    
    logger.error('Global error caught', err ?? message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      operation: 'global-error'
    });
  };

  const rejectionHandler = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (!reason) return;
    logger.error('Unhandled promise rejection', reason, {
      operation: 'unhandled-rejection'
    });
  };
  
  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', rejectionHandler);
  
  return () => {
    window.removeEventListener('error', errorHandler);
    window.removeEventListener('unhandledrejection', rejectionHandler);
  };
}, []);
```

**Remove from main.tsx:** Lines 9-35

---

### [ ] 5. Fix FeaturedStoriesCarousel Timer Leaks (2 hours)
**File:** `src/components/FeaturedStoriesCarousel.tsx`

**Step 1:** Fix auto-play cleanup:
```typescript
useEffect(() => {
  if (!isAutoPlaying || featuredStories.length <= 1) return;
  
  const intervalId = setInterval(() => {
    setCurrentIndex(prev => (prev + 1) % featuredStories.length);
  }, 5000);
  
  return () => clearInterval(intervalId);
}, [isAutoPlaying, featuredStories.length]);
```

**Step 2:** Memoize slide change handler:
```typescript
const handleSlideChange = useCallback((index: number) => {
  setIsTransitioning(true);
  setIsAutoPlaying(false);
  
  const transitionTimer = setTimeout(() => {
    setCurrentIndex(index);
    setIsTransitioning(false);
    
    const resumeTimer = setTimeout(() => setIsAutoPlaying(true), 1000);
  }, 150);
  
  // Note: Can't return cleanup from event handler, 
  // but limiting to single setTimeout chain prevents accumulation
}, []);
```

**Step 3:** Replace inline arrow functions:
```typescript
// Replace all instances like:
onClick={() => handleSlideChange(index)}

// With:
onClick={useCallback(() => handleSlideChange(index), [index])}
```

---

## 🟠 HIGH PRIORITY - Week 2 (14 hours total)

### [ ] 6. Add ARIA Labels (4 hours)

**Navigation.tsx:**
```typescript
<nav aria-label="Main navigation" className="...">
  <Link to="/" aria-label="Tale Forge home">
    <img src={...} alt="Tale Forge Logo" />
  </Link>
  
  <button 
    onClick={handleSignOut}
    aria-label="Sign out of your account"
  >
    <LogOut />
  </button>
</nav>
```

**StoryCard.tsx:**
```typescript
<Link 
  to={`/story/${story.id}`}
  aria-label={`Read story: ${story.title}`}
>
  <Card>...</Card>
</Link>
```

**FeaturedStoriesCarousel.tsx:**
```typescript
<button
  onClick={prevStory}
  aria-label="Previous featured story"
  aria-controls="featured-stories-carousel"
>
  <ChevronLeft />
</button>

<div 
  id="featured-stories-carousel"
  role="region"
  aria-label="Featured stories carousel"
  aria-live="polite"
>
  {/* Carousel content */}
</div>
```

---

### [ ] 7. Add Skip Links (1 hour)

**Navigation.tsx - Add at the very top:**
```typescript
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
>
  Skip to main content
</a>
```

**App.tsx - Wrap main content:**
```typescript
<main id="main-content" role="main" tabIndex={-1}>
  <Routes>...</Routes>
</main>
```

---

### [ ] 8. Add Landmarks (1 hour)

**Update semantic HTML throughout:**
```typescript
// Navigation.tsx
<nav aria-label="Main navigation">

// Footer.tsx
<footer role="contentinfo">

// StoryViewer.tsx sidebar
<aside aria-label="Story controls" role="complementary">

// All pages
<main id="main-content" role="main">
```

---

### [ ] 9. Implement Keyboard Navigation (3 hours)

**StoryCard.tsx - Make cards keyboard accessible:**
```typescript
<div
  role="article"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/story/${story.id}`);
    }
  }}
>
  {/* Card content */}
</div>
```

**Modals - Add focus trap:**
```typescript
// Use existing Radix UI Dialog which already handles this
// Verify all dialogs use DialogPrimitive.Content
```

---

### [ ] 10. Implement Discover Page Pagination (4 hours)

**File:** `src/pages/Discover.tsx`

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading
} = useInfiniteQuery({
  queryKey: ['discover-stories', selectedGenre, searchQuery],
  queryFn: async ({ pageParam = 0 }) => {
    let query = supabase
      .from('stories')
      .select('*')
      .eq('visibility', 'public')
      .or('status.eq.completed,is_completed.eq.true')
      .range(pageParam, pageParam + 19)
      .order('created_at', { ascending: false });

    if (selectedGenre !== 'all') {
      query = query.eq('genre', selectedGenre);
    }

    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  getNextPageParam: (lastPage, allPages) => {
    if (lastPage.length < 20) return undefined;
    return allPages.length * 20;
  },
  staleTime: 5 * 60 * 1000
});

const allStories = data?.pages.flatMap(page => page) || [];

// Add "Load More" button at bottom:
{hasNextPage && (
  <Button 
    onClick={() => fetchNextPage()}
    disabled={isFetchingNextPage}
  >
    {isFetchingNextPage ? 'Loading...' : 'Load More Stories'}
  </Button>
)}
```

---

### [ ] 11. Add Route-Level Error Boundaries (1 hour)

**File:** `src/App.tsx`

```typescript
// Wrap each route:
<Route 
  path="/create" 
  element={
    <ErrorBoundary fallback={<RouteErrorFallback />}>
      <Suspense fallback={<PageLoadingSpinner />}>
        <Create />
      </Suspense>
    </ErrorBoundary>
  } 
/>

// Repeat for all routes
```

---

## 🟡 MEDIUM PRIORITY - Week 3 (9.5 hours total)

### [ ] 12. Add Database Indexes (30 min)

**Create migration file:**
```sql
-- supabase/migrations/YYYYMMDD_performance_indexes.sql

-- Discover page optimization
CREATE INDEX IF NOT EXISTS idx_stories_visibility_status_created 
ON stories(visibility, status, created_at DESC) 
WHERE visibility = 'public';

-- User stories optimization
CREATE INDEX IF NOT EXISTS idx_stories_user_created 
ON stories(user_id, created_at DESC);

-- Genre filtering optimization
CREATE INDEX IF NOT EXISTS idx_stories_genre_visibility 
ON stories(genre, visibility) 
WHERE visibility = 'public';

-- Segment queries optimization
CREATE INDEX IF NOT EXISTS idx_segments_story_audio 
ON story_segments(story_id, audio_url) 
WHERE audio_url IS NOT NULL;
```

**Apply:**
```bash
supabase db push
```

---

### [ ] 13. Consolidate AI Client Code (1 hour)

**Step 1:** Keep `src/lib/api/ai-client.ts` (newer, better organized)

**Step 2:** Delete `src/lib/ai-client.ts`

**Step 3:** Update imports:
```bash
# Find all imports
grep -r "from '@/lib/ai-client'" src/

# Replace with:
# from '@/lib/api/ai-client'
```

---

### [ ] 14. Move Magic Numbers to Constants (2 hours)

**Create:** `src/lib/constants/query-constants.ts`
```typescript
export const QUERY_LIMITS = {
  discover: 20,
  adminStories: 50,
  adminUsers: 10,
  auditLogs: 1000,
  audioCharges: 1000,
};

export const ANIMATION_DELAYS = {
  autoPlayResume: 1000,
  transition: 150,
  slideChange: 5000,
};

export const PAGINATION = {
  pageSize: 20,
  maxPages: 100,
};
```

**Update files:**
- `src/pages/Discover.tsx`
- `src/components/FeaturedStoriesCarousel.tsx`
- `src/components/admin/AudioChargeMonitor.tsx`
- `src/hooks/useReactQueryAdmin.ts`

---

### [ ] 15. Bundle Analysis & Optimization (3 hours)

**Step 1:** Install analyzer:
```bash
npm install --save-dev rollup-plugin-visualizer
```

**Step 2:** Update `vite.config.ts`:
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  visualizer({ 
    open: true, 
    gzipSize: true,
    filename: 'dist/stats.html'
  })
]
```

**Step 3:** Build and analyze:
```bash
npm run build
# Opens stats.html automatically
```

**Step 4:** Lazy load Recharts:
```typescript
// src/components/admin/AdminTabs.tsx
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
```

---

### [ ] 16. Add Consistent Loading States (3 hours)

**Create:** `src/components/ui/loading-states.tsx`
```typescript
export const SkeletonCard = ({ count = 1 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="animate-pulse">
        <div className="h-48 bg-muted" />
        <div className="p-6 space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </Card>
    ))}
  </>
);

export const LoadingOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-background p-8 rounded-lg shadow-xl">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
      <p className="text-lg">{message}</p>
    </div>
  </div>
);
```

**Use throughout app:**
```typescript
// Discover.tsx
{isLoading && <SkeletonCard count={6} />}

// StoryViewer.tsx
{generatingSegment && <LoadingOverlay message="Generating next segment..." />}
```

---

## 🟢 LOW PRIORITY - Week 4 (Optional)

### [ ] 17. Verify Console Logs Removed (Already Done)
```bash
npm run build
grep -r "console\." dist/assets/ || echo "✅ No console statements found"
```

### [ ] 18. Add PWA Support (2 days)
```bash
npm install vite-plugin-pwa -D
```

### [ ] 19. Enable TypeScript Strict Mode (1-2 days)
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### [ ] 20. Remove Unused Dependencies (1 hour)
```bash
npx depcheck
npm uninstall <unused-packages>
```

---

## 📊 Progress Tracking

**Week 1 Completion:**
- [ ] All 5 critical issues resolved
- [ ] Security score: 85/100
- [ ] No memory leaks
- [ ] Real credit calculations

**Week 2 Completion:**
- [ ] All 6 high-priority issues resolved
- [ ] Accessibility score: 90/100
- [ ] WCAG 2.1 AA compliant
- [ ] Pagination implemented

**Week 3 Completion:**
- [ ] All 5 medium-priority issues resolved
- [ ] Performance score: 92/100
- [ ] Bundle size <500KB
- [ ] Code quality: 88/100

**Week 4 Completion:**
- [ ] PWA support added
- [ ] TypeScript strict mode enabled
- [ ] All scores >90/100

---

## 🧪 Testing Checklist

After each week, verify:

### Week 1 Tests:
- [ ] App loads without errors
- [ ] No console errors in production build
- [ ] Credits display correctly in StoryViewer
- [ ] No memory leaks after 10 minutes of use
- [ ] Carousel doesn't accumulate timers

### Week 2 Tests:
- [ ] Screen reader can navigate entire app (test with NVDA)
- [ ] All interactive elements have ARIA labels
- [ ] Skip link works (Tab → Enter)
- [ ] Discover page loads more stories
- [ ] Error boundaries catch component errors

### Week 3 Tests:
- [ ] Bundle size <500KB (check dist/stats.html)
- [ ] Database queries are fast (<100ms)
- [ ] No duplicate code in AI client
- [ ] Loading states are consistent

### Week 4 Tests:
- [ ] PWA installs on mobile
- [ ] Offline mode works for cached content
- [ ] TypeScript compiles with no errors
- [ ] No unused dependencies

---

## 📝 Notes

- **Backup before starting:** `git checkout -b audit-fixes`
- **Test after each fix:** Don't accumulate untested changes
- **Commit frequently:** Small, focused commits
- **Update documentation:** Keep README.md current

**Estimated Total Time:**
- Week 1: 7 hours
- Week 2: 14 hours
- Week 3: 9.5 hours
- Week 4: 4-5 days (optional)

**Total Core Fixes:** ~30.5 hours (1 week of focused work)

---

**Good luck! 🚀**

