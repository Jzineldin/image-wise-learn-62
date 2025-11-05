# Tale Forge - Architecture Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Database Schema](#database-schema)
7. [External Integrations](#external-integrations)
8. [Authentication & Security](#authentication--security)
9. [Credit System](#credit-system)
10. [Deployment & Infrastructure](#deployment--infrastructure)
11. [Development Workflow](#development-workflow)
12. [Key File Reference](#key-file-reference)

---

## Project Overview

**Tale Forge** is an AI-powered interactive storytelling platform designed for children aged 4-13+. The application generates personalized, multilingual stories with voice narration, images, and video content based on user choices.

### Key Features
- **AI Story Generation:** Dynamic, choice-based narratives using advanced language models
- **Multi-language Support:** Stories available in English, Swedish, Spanish, and more
- **Voice Narration:** Text-to-speech integration with ElevenLabs
- **Image Generation:** Custom illustrations using Google Gemini and Freepik AI
- **Video Creation:** Animated story scenes with Freepik video generation
- **Character Consistency:** Persistent character appearances across story segments
- **Credit-based Monetization:** Freemium model with subscription tiers
- **Interactive Choices:** Reader decisions influence story progression

### Project Status
- **Stage:** Beta launch with active development
- **Development Approach:** Rapid development using Lovable.dev
- **Code Volume:** 264 TypeScript files, ~50K+ lines of code

---

## System Architecture

Tale Forge follows a modern serverless architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  (React SPA - Vite bundled, deployed on Vercel)            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTPS
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    Supabase Platform                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database (15+ tables with RLS)          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Edge Functions (19 Deno serverless functions)      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Auth (JWT tokens, email/password)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Storage (S3-compatible object storage)             │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ API Calls
                 │
┌────────────────▼────────────────────────────────────────────┐
│                   External Services                          │
│  - OpenRouter (AI Story Generation)                         │
│  - ElevenLabs (Voice Synthesis)                             │
│  - Google Gemini (Image Generation)                         │
│  - Freepik (Image & Video Generation)                       │
│  - Stripe (Payment Processing)                              │
│  - Resend (Email Service)                                   │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles
- **Serverless-First:** No server management, auto-scaling
- **API-Driven:** RESTful edge functions with JWT authentication
- **Event-Driven:** Database triggers for user lifecycle events
- **Separation of Concerns:** Clear boundaries between frontend, backend, and external services
- **Security by Default:** Row Level Security (RLS) on all database tables

---

## Technology Stack

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.8.3 | Type safety |
| **Vite** | 5.4.19 | Build tool & dev server |
| **React Router** | 6.30.1 | Client-side routing |
| **Tailwind CSS** | 3.4.17 | Utility-first styling |
| **Radix UI** | Various | Headless UI components |
| **shadcn/ui** | Latest | Pre-styled component library |
| **Zustand** | 5.0.8 | Global state management |
| **React Query** | 5.89.0 | Server state & caching |
| **React Hook Form** | 7.61.1 | Form management |
| **Zod** | 3.25.76 | Schema validation |

### Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 15 | Primary database |
| **Supabase** | Latest | Backend-as-a-Service platform |
| **Deno** | Latest | Edge Functions runtime |
| **TypeScript** | 5.x | Edge Functions language |

### Testing & Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| **Vitest** | 3.2.4 | Unit & integration testing |
| **Playwright** | 1.55.0 | End-to-end testing |
| **ESLint** | 9.32.0 | Code linting |
| **Prettier** | - | Code formatting |

### External Services
| Service | Purpose | API Documentation |
|---------|---------|-------------------|
| **OpenRouter** | AI story generation (Cydonia 24B, Claude 3.5) | [openrouter.ai](https://openrouter.ai) |
| **ElevenLabs** | Text-to-speech voice synthesis | [elevenlabs.io](https://elevenlabs.io) |
| **Google Gemini** | AI image generation (2.5 Flash) | [ai.google.dev](https://ai.google.dev) |
| **Freepik** | Image & video generation (Hailuo 2, Wan v2.2) | [freepik.com](https://freepik.com) |
| **Stripe** | Payment processing & subscriptions | [stripe.com](https://stripe.com) |
| **Resend** | Transactional email delivery | [resend.com](https://resend.com) |
| **Vercel** | Frontend hosting & CDN | [vercel.com](https://vercel.com) |

---

## Frontend Architecture

### Project Structure
```
src/
├── pages/                    # Route components (18 pages)
│   ├── Index.tsx            # Landing page
│   ├── Auth.tsx             # Authentication
│   ├── Dashboard.tsx        # User dashboard
│   ├── Create.tsx           # Story creation wizard
│   ├── StoryView.tsx        # Interactive story reader
│   ├── MyStories.tsx        # Story library
│   ├── Characters.tsx       # Character management
│   ├── Discover.tsx         # Story discovery
│   ├── Settings.tsx         # Account & billing
│   ├── Pricing.tsx          # Subscription plans
│   └── Admin.tsx            # Admin panel (protected)
│
├── components/              # Reusable components (30+)
│   ├── layout/              # Layout components
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   ├── story/               # Story-related components
│   │   ├── StoryCard.tsx
│   │   ├── StoryViewer.tsx
│   │   └── StorySegment.tsx
│   ├── create/              # Creation wizard components
│   └── ui/                  # shadcn/ui components
│
├── hooks/                   # Custom React hooks (18 hooks)
│   ├── useAuth.ts           # Authentication state
│   ├── useLanguage.ts       # Language switching
│   ├── useStoryCredits.ts   # Credit calculations
│   ├── useSubscription.ts   # Subscription status
│   └── use-toast.ts         # Toast notifications
│
├── stores/                  # Zustand state stores
│   ├── authStore.ts         # Auth state
│   ├── storyStore.ts        # Story state
│   ├── languageStore.ts     # i18n state
│   └── uiStore.ts           # UI state
│
├── lib/                     # Utility libraries
│   ├── api/                 # API client modules
│   │   ├── ai-client.ts     # AI service calls
│   │   ├── story-api.ts     # Story operations
│   │   └── credit-api.ts    # Credit operations
│   ├── constants/           # App constants
│   │   └── ai-constants.ts  # AI configuration
│   └── utils/               # Utility functions
│
├── types/                   # TypeScript types
│   ├── index.ts             # Core types
│   └── character.ts         # Character types
│
├── integrations/            # Third-party integrations
│   └── supabase/
│       ├── client.ts        # Supabase client setup
│       └── types.ts         # Auto-generated DB types
│
├── App.tsx                  # Main app with routing
└── main.tsx                 # Entry point
```

### Routing Strategy

Routes are defined using React Router with lazy loading for code splitting:

```typescript
// Main routes
/                           # Landing page
/auth                       # Authentication
/dashboard                  # User dashboard
/create                     # Story creation wizard
/story/:id                  # Interactive story viewer
/my-stories                 # User's story library
/characters                 # Character management
/discover                   # Discover stories
/settings                   # Account settings
/pricing                    # Subscription pricing
/admin                      # Admin panel (role-protected)
```

**Route Protection:**
- Public routes: `/`, `/auth`, `/pricing`, `/discover`
- Protected routes: `/dashboard`, `/create`, `/story/:id`, `/my-stories`, `/characters`, `/settings`
- Admin routes: `/admin` (requires admin role)

### State Management

**Zustand Stores (Global State):**
- `authStore` - User authentication state, profile data
- `storyStore` - Current story, segments, choices
- `languageStore` - Current language, translations
- `uiStore` - UI state (modals, sidebar, theme)

**React Query (Server State):**
- Stories list with pagination
- User credits balance
- Subscription status
- Character library
- Automatic cache invalidation on mutations

### Component Architecture

**Layout Pattern:**
```
<App>
  <Navigation /> (persistent header)
  <Routes>
    <Route /> (page content)
  </Routes>
  <Footer /> (persistent footer)
</App>
```

**Protected Route Pattern:**
```typescript
<ProtectedRoute>
  <PageComponent />
</ProtectedRoute>
```

### Performance Optimizations

1. **Code Splitting:** All routes lazy-loaded with `React.lazy()`
2. **Vendor Chunking:** Separate bundles for UI, forms, charts, API modules
3. **Image Lazy Loading:** IntersectionObserver for images
4. **Bundle Size:** ~350 KB gzipped
5. **Performance Metrics:**
   - First Contentful Paint (FCP): <1.5s
   - Time to Interactive (TTI): <3s
   - Lighthouse Score: 90+

---

## Backend Architecture

### Edge Functions Overview

Tale Forge uses Supabase Edge Functions (Deno runtime) for serverless compute. All functions are deployed globally via CDN with automatic scaling.

**Total:** 19 edge functions, ~24K+ lines of code

#### Story Generation Functions

| Function | File | Lines | Purpose |
|----------|------|-------|---------|
| `generate-story` | `supabase/functions/generate-story/index.ts` | 646 | Initial story creation with metadata |
| `generate-story-segment` | `supabase/functions/generate-story-segment/index.ts` | 545 | Continue story based on choice |
| `generate-story-ending` | `supabase/functions/generate-story-ending/index.ts` | 224 | Generate story conclusion |
| `generate-story-title` | `supabase/functions/generate-story-title/index.ts` | 108 | Generate story title |
| `generate-story-seeds` | `supabase/functions/generate-story-seeds/index.ts` | 102 | Generate story ideas |

#### Media Generation Functions

| Function | File | Lines | Purpose |
|----------|------|-------|---------|
| `generate-story-image` | `supabase/functions/generate-story-image/index.ts` | 427 | Generate segment images |
| `generate-story-audio` | `supabase/functions/generate-story-audio/index.ts` | 292 | Generate voice narration |
| `generate-story-video` | `supabase/functions/generate-story-video/index.ts` | 215 | Generate video content |
| `generate-character-reference-image` | `supabase/functions/generate-character-reference-image/index.ts` | 291 | Generate character references |
| `check-video-status` | `supabase/functions/check-video-status/index.ts` | 117 | Poll video generation status |

#### Payment & Subscription Functions

| Function | File | Lines | Purpose |
|----------|------|-------|---------|
| `stripe-webhook` | `supabase/functions/stripe-webhook/index.ts` | 359 | Handle Stripe webhooks |
| `create-checkout` | `supabase/functions/create-checkout/index.ts` | 103 | Create Stripe checkout session |
| `customer-portal` | `supabase/functions/customer-portal/index.ts` | 102 | Stripe billing portal |
| `check-subscription` | `supabase/functions/check-subscription/index.ts` | 118 | Verify subscription status |

#### Utility Functions

| Function | File | Lines | Purpose |
|----------|------|-------|---------|
| `translate-content` | `supabase/functions/translate-content/index.ts` | 126 | Multi-language translation |
| `send-welcome-email` | `supabase/functions/send-welcome-email/index.ts` | 46 | New user onboarding email |
| `send-migration-email` | `supabase/functions/send-migration-email/index.ts` | 239 | Migration notifications |
| `maintenance-clean-segments` | `supabase/functions/maintenance-clean-segments/index.ts` | 100 | Cleanup orphaned data |
| `context7-mcp` | `supabase/functions/context7-mcp/index.ts` | 94 | Dev utility (MCP server) |

### Shared Modules

Located in `supabase/functions/_shared/` (13 modules):

| Module | Purpose | Lines |
|--------|---------|-------|
| `ai-service.ts` | OpenRouter API integration | 300+ |
| `credit-system.ts` | Credit validation & deduction | 250+ |
| `email-service.ts` | Resend email integration | 100+ |
| `image-service.ts` | Image generation orchestration | 200+ |
| `google-gemini-image-service.ts` | Google Gemini integration | 200+ |
| `freepik-image-service.ts` | Freepik image API | 150+ |
| `freepik-video-service.ts` | Freepik video API | 150+ |
| `prompt-templates.ts` | AI prompt templates (20+ languages) | 20,000+ |
| `response-handlers.ts` | Standardized API responses | 100+ |
| `validation.ts` | Input validation schemas | 150+ |
| `cors.ts` | CORS configuration | 50+ |
| `supabase-client.ts` | Server-side Supabase client | 50+ |
| `types.ts` | Shared TypeScript types | 200+ |

### Function Configuration

All functions require JWT authentication except:
- `send-welcome-email` (triggered by database)
- `stripe-webhook` (authenticated via Stripe signature)

Configuration in `supabase/config.toml`:
```toml
[functions.generate-story]
verify_jwt = true

[functions.send-welcome-email]
verify_jwt = false
```

### Error Handling Pattern

All edge functions follow a consistent error handling pattern:

```typescript
try {
  // Validate request
  const { data, error } = await validateRequest(req);
  if (error) return errorResponse(error);

  // Check credits
  const canProceed = await checkUserCredits(userId, cost);
  if (!canProceed) return errorResponse('Insufficient credits');

  // Perform operation
  const result = await performOperation(data);

  // Deduct credits
  await deductCredits(userId, cost);

  return successResponse(result);
} catch (error) {
  console.error('Function error:', error);
  return errorResponse('Internal server error');
}
```

---

## Database Schema

### Overview
- **Database:** PostgreSQL 15
- **Tables:** 15+ tables
- **Security:** Row Level Security (RLS) enabled on all tables
- **Location:** AWS EU-North-1
- **Backups:** Daily snapshots, 7-day retention

### Core Tables

#### `profiles`
User account information and subscription details.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free', -- free, basic, premium
  subscription_status TEXT, -- active, canceled, expired
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policy:** Users can read/update their own profile only.

#### `stories`
Story metadata and configuration.

```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  age_group TEXT, -- preschool, early_elementary, late_elementary, middle_school
  language TEXT DEFAULT 'en',
  genre TEXT,
  theme TEXT,
  mood TEXT,
  character_name TEXT,
  character_traits JSONB,
  moral TEXT,
  initial_prompt TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  total_segments INTEGER DEFAULT 0,
  current_segment INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, in_progress, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policy:** Users can manage their own stories; public stories readable by all.

#### `story_segments`
Individual story sections with choices.

```sql
CREATE TABLE story_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  segment_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT,
  video_url TEXT,
  choices JSONB, -- Array of choice objects: [{text: string, leads_to: number}]
  parent_segment_id UUID REFERENCES story_segments(id),
  is_ending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_story_segments_story_id ON story_segments(story_id);
CREATE INDEX idx_story_segments_segment_number ON story_segments(segment_number);
```

#### `user_credits`
Credit balance tracking per user.

```sql
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  credits INTEGER DEFAULT 0 CHECK (credits >= 0),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

**Concurrency Control:** Uses `FOR UPDATE` locking in credit transactions.

#### `credit_transactions`
Audit log for all credit operations.

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Negative for deductions, positive for additions
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- purchase, subscription, story, segment, image, audio, video
  reference_id UUID, -- Story ID, segment ID, etc.
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
```

#### `user_characters`
Saved character definitions for consistency.

```sql
CREATE TABLE user_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  traits JSONB,
  reference_image_url TEXT,
  gemini_seed INTEGER, -- For consistent image generation
  appearance_description TEXT, -- Detailed visual description
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `languages`
Supported languages configuration.

```sql
CREATE TABLE languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- en, sv, es, etc.
  name TEXT NOT NULL, -- English, Swedish, Spanish
  native_name TEXT NOT NULL, -- English, Svenska, Español
  is_active BOOLEAN DEFAULT true,
  flag_emoji TEXT,
  voice_id TEXT, -- ElevenLabs voice ID
  ai_model TEXT, -- Preferred AI model for this language
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `ai_prompt_templates`
Localized AI prompt templates.

```sql
CREATE TABLE ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT REFERENCES languages(code),
  template_type TEXT NOT NULL, -- story_start, story_continue, story_ending, etc.
  template_content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `featured_stories`
Editorial curation for discovery page.

```sql
CREATE TABLE featured_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  featured_at TIMESTAMPTZ DEFAULT NOW(),
  order_index INTEGER,
  category TEXT -- trending, editor_pick, most_popular
);
```

#### `user_feedback`
User ratings and feedback.

```sql
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Functions (Stored Procedures)

#### `spend_credits(user_id, amount, tx_type, ref_id, metadata)`
Atomically deduct credits with transaction logging.

```sql
CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock row for update
  SELECT credits INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Deduct credits
  v_new_balance := v_current_balance - p_amount;
  UPDATE user_credits
  SET credits = v_new_balance, last_updated = NOW()
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, balance_after, transaction_type, reference_id, metadata)
  VALUES (p_user_id, -p_amount, v_new_balance, p_transaction_type, p_reference_id, p_metadata);

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;
```

#### `add_credits(user_id, amount, tx_type, metadata)`
Add credits to user account.

```sql
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Add credits
  UPDATE user_credits
  SET credits = credits + p_amount, last_updated = NOW()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, balance_after, transaction_type, metadata)
  VALUES (p_user_id, p_amount, v_new_balance, p_transaction_type, p_metadata);

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;
```

#### `handle_new_user()`
Database trigger function for new user initialization.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email, full_name, subscription_tier)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'free');

  -- Initialize credits (10 for free tier, 100 for beta users)
  INSERT INTO user_credits (user_id, credits)
  VALUES (NEW.id, 100); -- Beta bonus

  -- Send welcome email (async via edge function)
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-welcome-email',
    body := jsonb_build_object('user_id', NEW.id, 'email', NEW.email)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Migrations

Database migrations are located in `supabase/migrations/` with 17+ migration files. Key migrations:

- `20250105000000_beta_launch_features.sql` - Beta launch schema
- Initial schema setup with all tables
- RLS policies configuration
- Database functions creation
- Indexes and constraints

**Migration Command:**
```bash
supabase db push
```

---

## External Integrations

### OpenRouter (AI Story Generation)

**Purpose:** Generate story content using multiple AI models.

**Configuration:**
- **Models:**
  - English: Cydonia 24B (`meta-llama/llama-3.1-70b-instruct`)
  - Swedish: Claude 3.5 Sonnet (`anthropic/claude-3.5-sonnet`)
- **Location:** `supabase/functions/_shared/ai-service.ts`
- **Authentication:** API key via environment variable `OPENROUTER_API_KEY`

**API Call Example:**
```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'meta-llama/llama-3.1-70b-instruct',
    messages: [{ role: 'user', content: storyPrompt }],
    temperature: 0.8,
    max_tokens: 2000,
  }),
});
```

**Cost:** ~$0.01-0.05 per story segment

### ElevenLabs (Voice Synthesis)

**Purpose:** Generate voice narration for story segments.

**Configuration:**
- **Model:** Multilingual v2
- **Location:** `supabase/functions/generate-story-audio/index.ts`
- **Authentication:** API key via `ELEVENLABS_API_KEY`
- **Voice IDs:** Configured per language in `languages` table

**API Call Example:**
```typescript
const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: 'POST',
  headers: {
    'xi-api-key': ELEVENLABS_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: storyContent,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
    },
  }),
});
```

**Cost:** ~$0.30 per 1000 characters

### Google Gemini (Image Generation)

**Purpose:** Generate custom story illustrations.

**Configuration:**
- **Model:** Gemini 2.5 Flash
- **Location:** `supabase/functions/_shared/google-gemini-image-service.ts`
- **Authentication:** API key via `GOOGLE_GEMINI_API_KEY`

**API Call Example:**
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Generate a children's story illustration: ${imagePrompt}`,
        }],
      }],
      generationConfig: {
        temperature: 0.8,
        seed: characterSeed, // For character consistency
      },
    }),
  }
);
```

**Cost:** Free tier available

### Freepik (Image & Video Generation)

**Purpose:** Alternative image generation and video creation.

**Configuration:**
- **Services:**
  - Image generation (Flux models)
  - Video generation (Hailuo 2, Wan v2.2)
- **Location:** `supabase/functions/_shared/freepik-*-service.ts`
- **Authentication:** API key via `FREEPIK_API_KEY`

**Video API Example:**
```typescript
// Create video
const response = await fetch('https://api.freepik.com/v1/ai/video', {
  method: 'POST',
  headers: {
    'x-freepik-api-key': FREEPIK_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: videoPrompt,
    image: imageUrl, // Base image
    model: 'hailuo-2',
  }),
});

// Poll status
const status = await fetch(`https://api.freepik.com/v1/ai/video/${videoId}`, {
  headers: { 'x-freepik-api-key': FREEPIK_API_KEY },
});
```

**Cost:** Credit-based, ~$0.50-1.00 per video

### Stripe (Payment Processing)

**Purpose:** Handle subscriptions and credit purchases.

**Configuration:**
- **Location:** `supabase/functions/stripe-webhook/index.ts`
- **Authentication:** API key via `STRIPE_SECRET_KEY`
- **Webhook:** Signature validation via `STRIPE_WEBHOOK_SECRET`

**Products:**
- **One-time Credits:**
  - 50 credits - $5
  - 100 credits - $9
  - 250 credits - $20
  - 500 credits - $35
- **Subscriptions:**
  - Basic - $9.99/mo (100 credits/month)
  - Premium - $19.99/mo (250 credits/month)

**Webhook Events Handled:**
```typescript
switch (event.type) {
  case 'checkout.session.completed':
    // Grant credits or activate subscription
    break;
  case 'customer.subscription.updated':
    // Update subscription status
    break;
  case 'customer.subscription.deleted':
    // Cancel subscription
    break;
  case 'invoice.payment_succeeded':
    // Recurring billing
    break;
}
```

### Resend (Email Service)

**Purpose:** Send transactional emails (welcome, notifications).

**Configuration:**
- **SMTP:** smtp.resend.com:587
- **Location:** `supabase/functions/_shared/email-service.ts`
- **Authentication:** API key via `RESEND_API_KEY`

**Email Templates:**
- Welcome email for new users
- Migration notifications
- Subscription confirmations

---

## Authentication & Security

### Authentication Flow

**Provider:** Supabase Auth (built on JWT)

**Supported Methods:**
- Email/Password (primary)
- Magic links (planned)
- OAuth providers (planned: Google, Apple)

**Authentication Process:**
```
1. User submits credentials → Frontend
2. Frontend calls supabase.auth.signInWithPassword()
3. Supabase Auth validates credentials
4. Returns JWT access token + refresh token
5. Frontend stores tokens in localStorage
6. Subsequent API calls include JWT in Authorization header
7. Edge functions verify JWT via Supabase client
```

**Token Management:**
- **Access Token:** Valid for 1 hour
- **Refresh Token:** Valid for 7 days
- **Auto-refresh:** Handled by Supabase client library

### Row Level Security (RLS)

All database tables have RLS enabled with policies:

**Example RLS Policies (`stories` table):**
```sql
-- Users can view their own stories
CREATE POLICY "Users can view own stories"
ON stories FOR SELECT
USING (auth.uid() = user_id);

-- Users can view public stories
CREATE POLICY "Users can view public stories"
ON stories FOR SELECT
USING (is_public = true);

-- Users can create stories
CREATE POLICY "Users can create stories"
ON stories FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own stories
CREATE POLICY "Users can update own stories"
ON stories FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete own stories
CREATE POLICY "Users can delete own stories"
ON stories FOR DELETE
USING (auth.uid() = user_id);
```

**Admin Override:**
```sql
-- Admins can view all stories
CREATE POLICY "Admins can view all stories"
ON stories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Security Best Practices

1. **SQL Injection Prevention:**
   ```typescript
   // All edge functions use this pattern
   const { data, error } = await supabaseClient
     .from('stories')
     .select('*')
     .eq('id', storyId); // Parameterized query
   ```

2. **Search Path Protection:**
   ```sql
   SET search_path = public;
   -- Prevents privilege escalation via schema manipulation
   ```

3. **Credit Transaction Locking:**
   ```sql
   SELECT * FROM user_credits WHERE user_id = $1 FOR UPDATE;
   -- Prevents race conditions in concurrent requests
   ```

4. **Rate Limiting:**
   ```typescript
   // Implemented in edge functions
   const RATE_LIMIT = 3; // requests per minute
   const userRequests = await redis.get(`rate:${userId}`);
   if (userRequests >= RATE_LIMIT) {
     return errorResponse('Rate limit exceeded');
   }
   ```

5. **API Key Rotation:**
   - All external API keys stored in Supabase secrets
   - Never committed to repository
   - Rotated quarterly

6. **CORS Configuration:**
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': 'https://tale-forge.com',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };
   ```

### Admin Role Management

**Admin Identification:**
```sql
-- Check if user is admin
SELECT role FROM profiles WHERE id = auth.uid();
```

**Admin Capabilities:**
- View all stories
- Feature stories on discovery page
- View user analytics
- Moderate content
- Access admin dashboard

---

## Credit System

### Credit Economy

**Cost Structure:**
| Operation | Cost |
|-----------|------|
| Story segment generation | 1 credit |
| Image generation | 1 credit |
| Audio generation (per 100 words) | 1 credit |
| Video generation | 2 credits |
| Character reference image | 1 credit |

**Average Story Cost:**
- Text-only story (5 segments): 5 credits
- Story with images (5 segments + 5 images): 10 credits
- Story with audio (5 segments + 500 words): 10 credits
- Full multimedia story: 15-20 credits

### Credit Grants

**New Users:**
- Beta users: 100 credits (promotional)
- Free tier: 10 credits
- Basic subscription: 100 credits/month
- Premium subscription: 250 credits/month

**Purchase Options:**
- 50 credits - $5 (10¢ per credit)
- 100 credits - $9 (9¢ per credit)
- 250 credits - $20 (8¢ per credit)
- 500 credits - $35 (7¢ per credit)

### Credit Validation Flow

```typescript
// Before any AI operation
async function validateAndDeductCredits(userId: string, cost: number) {
  // 1. Check current balance
  const { data: balance } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single();

  if (balance.credits < cost) {
    throw new Error('Insufficient credits');
  }

  // 2. Deduct credits (atomic operation)
  const { data, error } = await supabase.rpc('spend_credits', {
    p_user_id: userId,
    p_amount: cost,
    p_transaction_type: 'story_segment',
    p_reference_id: storyId,
  });

  if (error || !data.success) {
    throw new Error('Failed to deduct credits');
  }

  return data.balance; // New balance
}
```

### Transaction Logging

All credit operations are logged in `credit_transactions` table:

```typescript
{
  user_id: 'uuid',
  amount: -1, // Negative for deduction, positive for addition
  balance_after: 99,
  transaction_type: 'story_segment',
  reference_id: 'story-uuid',
  metadata: {
    story_title: 'The Magic Forest',
    segment_number: 3,
  },
  created_at: '2025-01-05T12:00:00Z',
}
```

**Transaction Types:**
- `purchase` - Credit purchase via Stripe
- `subscription` - Monthly subscription grant
- `story` - Story creation
- `segment` - Segment generation
- `image` - Image generation
- `audio` - Audio generation
- `video` - Video generation
- `admin_grant` - Manual admin credit grant

### Credit Balance Hook

Frontend uses `useStoryCredits` hook for real-time balance:

```typescript
const { credits, loading, refresh } = useStoryCredits();

// Estimate cost before operation
const estimatedCost = calculateStoryCost({
  segments: 5,
  includeImages: true,
  includeAudio: false,
});

if (credits < estimatedCost) {
  // Show upgrade prompt
}
```

---

## Deployment & Infrastructure

### Frontend Deployment (Vercel)

**Platform:** Vercel
**Repository:** GitHub (auto-deploy on push to main)

**Build Configuration:**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**Build Output:**
- Bundle size: ~350 KB gzipped
- Build time: ~45 seconds
- Deployment: <30 seconds

**Performance:**
- First Contentful Paint (FCP): <1.5s
- Time to Interactive (TTI): <3s
- Lighthouse Performance: 90+
- Lighthouse Accessibility: 95+

**CDN Configuration:**
- Global edge network
- Automatic cache invalidation
- Brotli compression
- HTTP/2 support

### Backend Deployment (Supabase)

**Platform:** Supabase (managed PostgreSQL + Edge Functions)
**Region:** AWS EU-North-1 (Stockholm)

**Database:**
- PostgreSQL 15
- Connection pooling: PgBouncer
- Max connections: 100
- Daily backups with 7-day retention

**Edge Functions:**
```bash
# Deploy all functions
supabase functions deploy

# Deploy single function
supabase functions deploy generate-story

# View logs
supabase functions logs generate-story
```

**Function Configuration:**
- Runtime: Deno 1.x
- Memory: 512 MB
- Timeout: 60 seconds
- Concurrency: 100 requests/function

**Storage:**
- S3-compatible object storage
- Public bucket: `story-images` (CDN-cached)
- Private bucket: `user-uploads`
- Max file size: 10 MB

### Environment Variables

**Frontend (.env):**
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Backend (Supabase Secrets):**
```bash
# Set via Supabase CLI or Dashboard
supabase secrets set OPENROUTER_API_KEY=sk-xxx
supabase secrets set ELEVENLABS_API_KEY=xxx
supabase secrets set GOOGLE_GEMINI_API_KEY=xxx
supabase secrets set FREEPIK_API_KEY=xxx
supabase secrets set STRIPE_SECRET_KEY=sk_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set RESEND_API_KEY=re_xxx
```

### Monitoring & Logging

**Frontend:**
- Vercel Analytics (web vitals)
- Error tracking: Built-in error boundaries

**Backend:**
- Supabase Dashboard (function logs)
- PostgreSQL slow query log
- Storage usage metrics

**Key Metrics Monitored:**
- API response times
- Database query performance
- Credit transaction volume
- Error rates
- User acquisition & retention

### Backup & Disaster Recovery

**Database:**
- Automated daily backups (7-day retention)
- Point-in-time recovery (PITR) available
- Manual snapshots before major migrations

**Storage:**
- Automatic replication across availability zones
- Object versioning enabled

**Recovery Time Objective (RTO):** <1 hour
**Recovery Point Objective (RPO):** <24 hours

---

## Development Workflow

### Local Development Setup

**Prerequisites:**
- Node.js 18+
- npm 9+
- Supabase CLI

**Installation:**
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/tale-forge.git
cd tale-forge

# Install dependencies
npm install

# Start local Supabase (optional)
supabase start

# Start frontend dev server
npm run dev
```

**Development URLs:**
- Frontend: http://localhost:5173
- Supabase Studio: http://localhost:54323
- Edge Functions: http://localhost:54321/functions/v1

### Testing Strategy

**Unit Tests (Vitest):**
```bash
npm run test:unit
```
- Component tests with React Testing Library
- Utility function tests
- Custom hook tests
- Located in `tests/unit/`

**Integration Tests:**
```bash
npm run test:integration
```
- API integration tests
- Database operation tests
- Credit system tests
- Located in `tests/integration/`

**End-to-End Tests (Playwright):**
```bash
npm run test:e2e
npm run test:e2e:ui  # Interactive UI mode
```
- Full user flow tests
- Story creation flow
- Payment flow
- Located in `tests/e2e/`

**Test Coverage:**
```bash
npm run test:coverage
```
Target: >80% code coverage

### Code Quality

**Linting:**
```bash
npm run lint
```
- ESLint with React and TypeScript rules
- Automatic fixes available

**Type Checking:**
```bash
npx tsc --noEmit
```

**Pre-commit Hooks:**
- Automatic linting
- Type checking
- Test execution (fast tests only)

### Git Workflow

**Branches:**
- `main` - Production (auto-deploys to Vercel)
- `develop` - Development branch
- `feature/*` - Feature branches
- `claude/*` - AI assistant branches

**Commit Convention:**
```
feat: Add video generation support
fix: Resolve credit deduction race condition
docs: Update architecture documentation
chore: Upgrade dependencies
```

### Database Migrations

**Create Migration:**
```bash
supabase migration new migration_name
```

**Apply Migrations:**
```bash
# Local
supabase db push

# Production (via dashboard or CLI)
supabase db push --linked
```

**Migration Rollback:**
```bash
supabase migration repair
```

### Deployment Process

**Frontend (Automatic):**
1. Push to `main` branch
2. Vercel detects changes
3. Builds and deploys automatically
4. Deployment URL provided in PR

**Backend (Manual):**
```bash
# Deploy edge functions
supabase functions deploy

# Push database migrations
supabase db push --linked

# Update secrets
supabase secrets set KEY=value
```

---

## Key File Reference

### Frontend Core Files

| File Path | Purpose | Lines |
|-----------|---------|-------|
| `src/main.tsx` | Application entry point | 50 |
| `src/App.tsx` | Main routing configuration | 258 |
| `src/pages/Create.tsx` | Story creation wizard | 500+ |
| `src/pages/StoryView.tsx` | Interactive story reader | 400+ |
| `src/pages/Dashboard.tsx` | User dashboard | 300+ |
| `src/components/story/StoryViewer.tsx` | Story display component | 350+ |
| `src/lib/api/ai-client.ts` | Frontend AI service client | 250+ |
| `src/lib/api/story-api.ts` | Story operations API | 200+ |
| `src/lib/api/credit-api.ts` | Credit operations API | 150+ |
| `src/hooks/useAuth.ts` | Authentication hook | 100+ |
| `src/hooks/useStoryCredits.ts` | Credit calculations hook | 180+ |
| `src/stores/authStore.ts` | Auth state management | 80+ |
| `src/integrations/supabase/client.ts` | Supabase client setup | 50+ |

### Backend Core Files

| File Path | Purpose | Lines |
|-----------|---------|-------|
| `supabase/functions/generate-story/index.ts` | Initial story generation | 646 |
| `supabase/functions/generate-story-segment/index.ts` | Continue story | 545 |
| `supabase/functions/generate-story-image/index.ts` | Image generation | 427 |
| `supabase/functions/generate-story-audio/index.ts` | Audio generation | 292 |
| `supabase/functions/generate-story-video/index.ts` | Video generation | 215 |
| `supabase/functions/stripe-webhook/index.ts` | Payment processing | 359 |
| `supabase/functions/_shared/ai-service.ts` | AI orchestration | 300+ |
| `supabase/functions/_shared/credit-system.ts` | Credit validation | 250+ |
| `supabase/functions/_shared/prompt-templates.ts` | AI prompts (20+ languages) | 20,000+ |
| `supabase/functions/_shared/image-service.ts` | Image generation orchestration | 200+ |
| `supabase/functions/_shared/email-service.ts` | Email integration | 100+ |

### Configuration Files

| File Path | Purpose |
|-----------|---------|
| `package.json` | Frontend dependencies & scripts |
| `tsconfig.json` | TypeScript configuration |
| `vite.config.ts` | Vite build configuration |
| `vercel.json` | Vercel deployment config |
| `tailwind.config.js` | Tailwind CSS configuration |
| `supabase/config.toml` | Supabase project configuration |
| `.env` | Environment variables (frontend) |

### Documentation Files

| File Path | Purpose |
|-----------|---------|
| `TALE-FORGE-PRD.md` | Product requirements document |
| `COMPLETE-SETUP-GUIDE.md` | Setup instructions |
| `GOOGLE-GEMINI-SETUP.md` | Gemini integration guide |
| `STRIPE-WEBHOOK-SETUP-GUIDE.md` | Stripe setup guide |
| `INVESTOR-DOCS/04-TECHNICAL-ARCHITECTURE.md` | Technical architecture (investor doc) |
| `CHARACTER-CONSISTENCY-PHASE*.md` | Character consistency implementation docs |
| `docs/COMPREHENSIVE_DEVELOPMENT_ROADMAP.md` | Development roadmap |
| `docs/DESIGN_SYSTEM_GUIDELINES.md` | Design system documentation |

---

## Appendix: Architecture Patterns

### Design Patterns Used

1. **Repository Pattern:** Data access abstracted through API clients
2. **Service Layer Pattern:** Business logic in edge functions and services
3. **Observer Pattern:** Real-time subscriptions via Supabase Realtime
4. **Factory Pattern:** AI service factory for multiple providers
5. **Strategy Pattern:** Different AI models per language
6. **Singleton Pattern:** Supabase client instances
7. **Decorator Pattern:** RLS policies as authorization decorators

### Scalability Considerations

**Current Capacity:**
- 1000 concurrent users
- 10,000 stories generated/month
- 50,000 API calls/day

**Scaling Strategy:**
- **Horizontal:** Serverless auto-scaling (edge functions)
- **Vertical:** Database connection pooling (PgBouncer)
- **Caching:** CDN for static assets, query caching for stories
- **Rate Limiting:** 3 requests/minute per user

**Future Optimizations:**
- Redis caching layer
- Read replicas for database
- WebSocket connections for real-time story generation
- Background job queue for video processing

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Maintained By:** Development Team
**Contact:** [Your Contact Information]
