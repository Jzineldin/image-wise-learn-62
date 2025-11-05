# Tale Forge - Architecture Documentation

> **Version:** 1.0.0
> **Status:** Production
> **Last Updated:** 2025-11-05

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Technology Stack](#2-technology-stack)
- [3. Project Structure](#3-project-structure)
- [4. Core Features & Modules](#4-core-features--modules)
- [5. Database Schema](#5-database-schema)
- [6. External Service Integrations](#6-external-service-integrations)
- [7. Routing Structure](#7-routing-structure)
- [8. State Management Architecture](#8-state-management-architecture)
- [9. Error Handling & Resilience](#9-error-handling--resilience)
- [10. Performance Optimizations](#10-performance-optimizations)
- [11. Validation & Security](#11-validation--security)
- [12. Testing Strategy](#12-testing-strategy)
- [13. Deployment & Environment](#13-deployment--environment)
- [14. Design Patterns](#14-design-patterns)

---

## 1. Project Overview

**Tale Forge** is an AI-powered interactive storytelling platform designed for children. It enables users to create, read, and interact with personalized stories featuring consistent characters, multilingual support, and rich media (images, audio, video).

**Key Capabilities:**
- AI-generated stories with branching narratives
- Character consistency across story segments
- Multi-language support (English, Swedish)
- Image, video, and audio generation
- Interactive reading experience with choices
- Credit-based usage system
- Admin panel for management and analytics

---

## 2. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI library |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.19 | Build tool & dev server |
| TailwindCSS | 3.4.17 | Utility-first styling |
| Radix UI | Latest | Accessible UI primitives |
| shadcn/ui | Latest | Component library |
| Zustand | 5.0.8 | Client state management |
| TanStack Query | 5.89.0 | Server state & caching |
| React Router | 6.30.1 | Client-side routing |
| React Hook Form | 7.61.1 | Form state management |
| Zod | 3.25.76 | Schema validation |
| Lucide React | Latest | Icon library |

### Backend & Services

| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL database, Auth, Storage, Real-time |
| Supabase Edge Functions | Serverless API layer |
| Stripe | Payment processing |
| Google Gemini 2.5 Flash | Image generation |
| Freepik API | Video generation |
| OpenRouter/OpenAI/OVH | Story generation (LLMs) |
| ElevenLabs | Text-to-speech |

### Development & Testing

| Tool | Purpose |
|------|---------|
| Vitest | Unit testing |
| Playwright | E2E testing |
| ESLint | Code linting |
| Lovable Tagger | Component tagging |

---

## 3. Project Structure

```
image-wise-learn-62/
├── src/
│   ├── pages/                      # Route-level components
│   │   ├── Index.tsx              # Home page
│   │   ├── Auth.tsx               # Authentication
│   │   ├── Create.tsx             # Story creation wizard
│   │   ├── Dashboard.tsx          # User dashboard
│   │   ├── Characters.tsx         # Character management
│   │   ├── MyStories.tsx          # User's stories
│   │   ├── StoryViewer.tsx        # Interactive story reader
│   │   ├── Discover.tsx           # Discover public stories
│   │   ├── Admin.tsx              # Admin panel
│   │   ├── Settings.tsx           # User settings
│   │   └── [Other pages]          # About, Pricing, Contact, etc.
│   │
│   ├── components/
│   │   ├── ui/                    # 90+ reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── [Other UI components]
│   │   │
│   │   ├── story-creation/        # Story wizard components
│   │   │   ├── StoryCreationWizard.tsx
│   │   │   ├── AgeGenreStep.tsx
│   │   │   ├── CharacterSelectionStep.tsx
│   │   │   ├── LanguageStep.tsx
│   │   │   ├── ReviewStep.tsx
│   │   │   └── StoryGenerationProgress.tsx
│   │   │
│   │   ├── story-viewer/          # Story reading components
│   │   │   ├── StorySegmentDisplay.tsx
│   │   │   ├── AudioControls.tsx
│   │   │   ├── StoryNavigation.tsx
│   │   │   └── StoryProgressTracker.tsx
│   │   │
│   │   ├── admin/                 # Admin panel components
│   │   │   ├── UserManagement.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── ContentModeration.tsx
│   │   │   └── AudioChargeMonitor.tsx
│   │   │
│   │   └── [Other components]     # Navigation, Footer, etc.
│   │
│   ├── stores/                     # Zustand state management
│   │   ├── authStore.ts           # Authentication state
│   │   ├── storyStore.ts          # Story creation/reading state
│   │   ├── uiStore.ts             # UI state
│   │   └── languageStore.ts       # Localization
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts             # Authentication
│   │   ├── useCharacters.ts       # Character CRUD
│   │   ├── useStoryCredits.ts     # Credit calculations
│   │   ├── useAnalytics.ts        # Analytics tracking
│   │   └── [Other hooks]
│   │
│   ├── lib/
│   │   ├── api/                   # API clients
│   │   │   ├── ai-client.ts       # Unified Edge Function client
│   │   │   ├── story-api.ts       # Story operations
│   │   │   └── credit-api.ts      # Credit calculations
│   │   │
│   │   ├── constants/             # Configuration constants
│   │   │   ├── ai-constants.ts    # AI models, providers
│   │   │   ├── app-constants.ts   # App config
│   │   │   └── query-constants.ts # React Query keys
│   │   │
│   │   ├── helpers/               # Utility functions
│   │   ├── prompts/               # AI prompt templates
│   │   ├── schemas/               # Zod validation schemas
│   │   └── utils/                 # General utilities
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client
│   │       └── types.ts           # Generated DB types
│   │
│   ├── types/                      # TypeScript types
│   │   └── character.ts           # Character, story types
│   │
│   └── constants/
│       └── translations.ts        # i18n translations
│
├── supabase/
│   └── functions/                 # Edge Functions (Serverless)
│       ├── _shared/               # Shared utilities
│       │   ├── google-gemini-image-service.ts
│       │   └── openrouter-client.ts
│       │
│       ├── generate-story/
│       ├── generate-story-segment/
│       ├── generate-story-image/
│       ├── generate-story-video/
│       ├── check-video-status/
│       ├── generate-story-audio/
│       ├── generate-character-reference-image/
│       ├── create-checkout/       # Stripe checkout
│       ├── stripe-webhook/        # Payment webhooks
│       └── translate-content/
│
├── Configuration Files
│   ├── vite.config.ts             # Build optimization
│   ├── tailwind.config.ts         # Design system
│   ├── tsconfig.json              # TypeScript config
│   ├── vitest.config.ts           # Unit testing
│   ├── playwright.config.ts       # E2E testing
│   └── vercel.json                # Deployment config
│
└── package.json
```

---

## 4. Core Features & Modules

### 4.1 Story Creation System

**Multi-step Wizard (7 steps):**
1. Age group & genre selection
2. Language selection (EN, SV)
3. Character selection/creation
4. Story idea/seed selection
5. Customization options
6. Review & preview
7. Generation with progress tracking

**AI-Powered Generation:**
- Multiple LLM providers (OpenRouter, OpenAI, OVH Llama)
- Automatic fallback on provider failure
- Age-appropriate content generation (4-6, 7-9, 10-12, 13+)
- Character consistency with reference images
- Branching narrative support

**Character Consistency System:**
- Automatic reference image generation (Google Gemini)
- Character descriptions embedded in prompts
- Visual consistency across all story segments
- Support for up to 3 reference images per generation

### 4.2 Interactive Story Reading

**Reading Modes:**
- Text-only
- Audio-only (TTS)
- Combined text + audio

**Interactive Features:**
- 2-4 choices per segment
- Branching narrative paths
- Choice impact tracking
- Reading progress tracking
- Bookmark/save position

**Visual Experience:**
- AI-generated illustrations
- Character-consistent artwork
- Age-appropriate art styles
- 3:4 aspect ratio (portrait)

**Advanced Features:**
- PDF export
- Adjustable font sizes
- Dark/light theme toggle
- Accessibility support (reduced motion)

### 4.3 Character Management

**Character Creation:**
- Name, description, type, personality
- Reference image generation
- Reusable across multiple stories

**Default Characters (6 pre-built):**
- Brave Knight
- Wise Owl
- Curious Cat
- Magical Unicorn
- Friendly Dragon
- Space Explorer

**Character Repository:**
- Personal character library
- Usage tracking
- Gallery view

### 4.4 Credit System

**Credit Costs:**
- Story segment generation: 1 credit
- Image generation: 1 credit
- Audio generation: 1 credit per 100 words (rounded up)
- Character reference image: 1 credit

**Features:**
- Real-time cost calculations
- Cost preview before generation
- Insufficient credit warnings
- Transaction history tracking
- Purchase via Stripe

### 4.5 Media Generation

#### Image Generation
- **Provider:** Google Gemini 2.5 Flash Image
- **Features:**
  - Age-appropriate styles
  - 3:4 aspect ratio (portrait)
  - Character consistency (up to 3 references)
  - Narrative-based prompts
- **Pricing:** Free for first 3 weeks, ~$0.039/image after

#### Video Generation
- **Provider:** Freepik API
- **Models:**
  - Hailuo 2 (768p) - Primary
  - Wan v2.2 (480p) - Fallback
- **Features:**
  - Image-to-video conversion
  - Async task-based processing
  - Status polling
- **Pricing:** 5 EUR free credits, then pay-per-use

#### Audio Generation (TTS)
- Multi-voice support
- Language-aware voices
- Age-appropriate narration
- Streaming audio support

### 4.6 Multilingual Support

**Supported Languages:**
- English (EN)
- Swedish (SV)

**Features:**
- Story generation in target language
- UI localization
- Age-appropriate translations
- Character consistency across languages
- Translation service via Edge Functions

### 4.7 Admin Panel

**User Management:**
- User search & filtering
- Profile management
- Role assignment
- Ban/suspend users

**Analytics Dashboard:**
- User statistics
- Story generation metrics
- API usage tracking
- Revenue analytics

**Content Moderation:**
- Story review
- Flag inappropriate content
- Manage user feedback

**Audio Charge Monitor:**
- TTS cost tracking
- Usage analysis
- Cost optimization

### 4.8 User Authentication

**Supabase Auth:**
- Email/password registration
- OAuth support (Google, GitHub, etc.)
- Session management
- Auto token refresh

**Access Control:**
- Role-based access (admin, user)
- Story access control
- Protected routes

### 4.9 Community Features

**Discover Page:**
- Public stories
- Featured stories
- Story ratings
- Author profiles

**Social Sharing:**
- Share story links
- Embed stories

**Feedback System:**
- Bug reports
- Feature requests
- User ratings

---

## 5. Database Schema

### Key Tables (Supabase/PostgreSQL)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, settings, metadata |
| `user_characters` | Custom characters created by users |
| `stories` | Stories metadata and configuration |
| `story_segments` | Individual story segments/chapters |
| `user_credits` | Credit balance tracking |
| `credit_transactions` | Complete transaction history |
| `image_generation_status` | Image generation job tracking |
| `story_seeds` | Pre-defined story ideas |
| `feedback` | User feedback/bug reports |
| `featured_stories` | Admin-curated featured stories |
| `languages` | Language definitions |
| `ai_prompt_templates` | Reusable AI prompts |
| `admin_settings` | System configuration |
| `user_roles` | User role assignments |

### Storage Buckets

| Bucket | Purpose |
|--------|---------|
| `story-images` | Generated story illustrations |
| `character-images` | Character reference images |
| `story-audio` | Generated audio files |
| `story-videos` | Generated videos |
| `user-uploads` | User-provided content |

---

## 6. External Service Integrations

### AI Services

| Service | Provider | Purpose |
|---------|----------|---------|
| Story Generation | OpenRouter, OpenAI, OVH Llama | Creative narrative generation |
| Image Generation | Google Gemini 2.5 Flash | Story illustrations |
| Video Generation | Freepik API | Animated stories |
| Text-to-Speech | ElevenLabs, Custom TTS | Audio narration |
| Translation | Google Translate API | Multi-language support |

### Payment Processing
- **Provider:** Stripe
- **Features:** Credit purchase, subscription management, webhooks, invoicing

### Storage
- **Provider:** Supabase Storage (S3-compatible)
- **Buckets:** Images, audio, video, user uploads

---

## 7. Routing Structure

```
/ (public)                         - Home page
├── /auth                          - Authentication
├── /pricing                       - Pricing page
├── /about                         - About page
├── /contact                       - Contact form
├── /privacy                       - Privacy policy
├── /terms                         - Terms of service
│
├── /create (protected)            - Story creation wizard
├── /dashboard (protected)         - User dashboard
├── /characters (protected)        - Character management
├── /my-stories (protected)        - User's stories
├── /discover (protected)          - Discover public stories
├── /settings (protected)          - User settings
│
├── /story/:id (semi-protected)    - Story reader
├── /story/:id/end                 - Story ending page
│
├── /admin (admin-protected)       - Admin panel
│
└── * (404)                        - Not found page
```

---

## 8. State Management Architecture

### Zustand Stores (Client State)

| Store | Purpose | Key State |
|-------|---------|-----------|
| `authStore` | Authentication | `user`, `profile`, `loading`, `logout()` |
| `storyStore` | Story creation/reading | `currentFlow`, `isGenerating`, `currentStory`, `readingMode` |
| `uiStore` | UI state | `themes`, `modals`, `notifications` |
| `languageStore` | Localization | `selectedLanguage`, `translations` |

### React Query (Server State)

**Purpose:** Server state management and caching

**Key Queries:**
- User credits fetching (stale time: 30s)
- Story data fetching
- Character list
- Public stories discovery
- User profile data
- Admin analytics

**Benefits:**
- Automatic background refetching
- Optimistic updates
- Cache management
- Request deduplication

---

## 9. Error Handling & Resilience

### AIClient Pattern (`src/lib/api/ai-client.ts`)

**Unified interface for all Edge Function calls with:**

1. **Circuit Breaker Pattern**
   - Tracks failures per function
   - Prevents cascade failures
   - 60-second timeout before retry
   - Automatic reset on success

2. **Retry Logic**
   - Exponential backoff with jitter
   - Configurable retry counts (max 3)
   - Retry only for transient errors
   - Immediate fail on non-retryable errors

3. **Error Classification**
   - HTTP errors (4xx, 5xx)
   - Network errors (fetch failures)
   - Credit errors (insufficient credits)
   - Application errors (relay errors)

4. **Structured Logging**
   - Request/response logging
   - Error tracking with context
   - Performance metrics

### Error Boundaries

- Per-route error boundaries
- Fallback UI components
- Error recovery options
- User-friendly error messages

### Error Recovery

**Story Generation:**
- Automatic provider fallback (OpenRouter → OpenAI → OVH)
- Resume from last successful segment
- Save partial progress

**Image Generation:**
- Retry on transient failures
- Fallback to default images
- Status tracking

---

## 10. Performance Optimizations

### Bundle Optimization (Vite)

**Manual Chunk Splitting:**
```javascript
manualChunks: {
  'vendor-ui': ['@radix-ui/*'],
  'vendor-forms': ['react-hook-form', 'zod'],
  'vendor-charts': ['recharts'],
  'vendor-utils': ['date-fns'],
  'vendor-api': ['@supabase/supabase-js', '@tanstack/react-query'],
  'vendor-icons': ['lucide-react']
}
```

**Optimizations:**
- Tree-shaking
- CSS minification
- Console removal in production
- Chunk size warning: 500KB

### Code Splitting

- Route-based lazy loading
- Dynamic imports for heavy components
- Suspense boundaries
- Progressive loading

### Runtime Optimization

- Image lazy loading (Sharp optimization)
- Query caching (React Query)
- Debouncing on inputs
- Memoization of expensive calculations
- Performance monitoring hooks

### CSS Strategy

- Tailwind utility classes (smaller bundle)
- CSS-in-JS with `class-variance-authority`
- Dark/light theme support
- Glass-morphism design effects
- Reduced motion support

---

## 11. Validation & Security

### Input Validation (Zod Schemas)

**Validated Inputs:**
- Character creation (name, description, type)
- Story creation (title, settings, choices)
- Image generation (prompts, style)
- Audio generation (text, voice)
- Contact forms
- File uploads (max 10MB)

**Example Schema (`src/lib/schemas/validation.ts`):**
```typescript
export const characterSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().min(10).max(500),
  type: z.enum(['hero', 'sidekick', 'villain', 'mentor']),
  personality: z.string().optional()
});
```

### Security Headers (Vercel)

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Cache-Control": "public, max-age=31536000, immutable"
}
```

### Authentication Security

- JWT tokens (Supabase Auth)
- Auto token refresh
- Session persistence
- Role-based access control (RBAC)
- Protected routes with middleware

### Data Security

- Row-level security (RLS) in Supabase
- Encrypted storage
- Secure file uploads
- API key protection (environment variables)

---

## 12. Testing Strategy

### Unit Tests (Vitest)

**Coverage:**
- `/src/lib/api/__tests__/` - API client error handling
- `/src/stores/__tests__/` - Store behavior
- Credit calculations
- Validation schemas

**Run Commands:**
```bash
npm run test:unit           # Run unit tests
npm run test:coverage      # Generate coverage report
```

### Component Tests

**Coverage:**
- Store behavior
- Custom hooks
- Form validation

### E2E Tests (Playwright)

**Test Scenarios:**
- User registration/login flow
- Story creation wizard (all 7 steps)
- Story reading with choices
- Character creation
- Admin panel operations

**Run Commands:**
```bash
npm run test:e2e           # Run E2E tests
npm run test:integration   # Run integration tests
```

### API Tests

**Coverage:**
- Edge Function responses
- Error handling
- Credit deduction
- Image/audio generation

**Run Command:**
```bash
npm run test:api           # Run API tests
```

### Test All

```bash
npm run test:all           # Run all tests (unit, integration, E2E, API)
```

---

## 13. Deployment & Environment

### Deployment Platforms

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Vercel | Auto-deploy from main branch |
| Backend | Supabase Edge Functions | Serverless deployment |
| Database | Supabase PostgreSQL | Managed database |

### Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://hlrvpuqwurtdbjkramcp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<JWT_TOKEN>
VITE_SUPABASE_PROJECT_ID=hlrvpuqwurtdbjkramcp

# Feature Flags
VITE_FEATURE_JSON_OPENING=false
```

### Build Commands

```bash
npm run dev              # Development server (localhost:8080)
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build
```

### Vercel Configuration (`vercel.json`)

**Key Settings:**
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite
- SPA routing rewrites
- Security headers
- Cache control for static assets
- WWW redirect to non-WWW

---

## 14. Design Patterns

### AIClient Pattern (Context7)

**Purpose:** Unified error handling and resilience for all AI operations

**Features:**
- Circuit breaker
- Retry logic with exponential backoff
- Error classification
- Structured logging

**Usage:**
```typescript
const result = await aiClient('generate-story', {
  prompt: 'Once upon a time...',
  ageGroup: '7-9'
});
```

### Composition Pattern

**Component Structure:**
- Small, focused components
- Lazy-loaded heavy components
- Reusable UI primitives (shadcn/ui)
- Modular admin tabs

### Custom Hooks Pattern

**Domain-Specific Hooks:**
- `useAuth()` - Authentication state and actions
- `useCharacters()` - Character CRUD operations
- `useStoryCredits()` - Credit calculations
- `useAnalytics()` - Analytics tracking
- `useLanguage()` - Localization

**Data Fetching Hooks:**
- `useDataFetching()` - Generic data fetching with React Query
- `useReactQueryAuth()` - Authenticated queries

### Store Pattern (Zustand)

**Benefits:**
- Minimal boilerplate
- TypeScript-first
- No context providers
- Simple API

**Example:**
```typescript
const useStoryStore = create<StoryState>((set) => ({
  currentStory: null,
  setCurrentStory: (story) => set({ currentStory: story })
}));
```

---

## Appendix: Key Files

### Critical Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Build optimization, manual chunking |
| `tailwind.config.ts` | Design system, theme configuration |
| `tsconfig.json` | TypeScript settings, path aliases |
| `vercel.json` | Deployment, security headers |
| `package.json` | Dependencies, scripts |

### Entry Points

| File | Purpose |
|------|---------|
| `src/main.tsx` | Application entry point |
| `src/App.tsx` | Main app with routing and providers |
| `src/index.css` | Global styles |

### Key API Files

| File | Purpose |
|------|---------|
| `src/lib/api/ai-client.ts` | Unified Edge Function client |
| `src/lib/api/story-api.ts` | Story operations |
| `src/lib/api/credit-api.ts` | Credit calculations |
| `src/integrations/supabase/client.ts` | Supabase client initialization |

---

## Recent Enhancements

### Character Consistency System (Latest)
- **Phase 1:** Character reference image generation
- **Phase 2:** Age-appropriate style descriptors
- **Phase 3:** Comprehensive testing and deployment
- Auto-generation on story creation

### Video Generation Integration
- Freepik API integration (Hailuo 2, Wan v2.2)
- Async task handling with status polling
- Image-to-video conversion

### Google Gemini Integration
- Image generation with character consistency
- Age-appropriate styling (vibrant, detailed, realistic)
- 3:4 aspect ratio optimization
- Narrative-based prompts

---

## Conclusion

Tale Forge is a production-ready, feature-rich platform that combines:
- **Modern React architecture** with performance optimizations
- **Advanced AI integrations** with multiple providers and fallbacks
- **Comprehensive feature set** for interactive storytelling
- **Strong error handling** and resilience patterns
- **Scalable design** with lazy loading and code splitting
- **Multi-language support** and accessibility
- **Professional DevOps** with automated testing and deployment

The application successfully balances creativity (AI-powered storytelling) with technical excellence (performance, reliability, security).
