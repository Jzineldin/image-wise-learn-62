# Tale Forge - Comprehensive Product Requirements Document (PRD)

## Document Information

**Product Name:** Tale Forge  
**Version:** 2.0.0  
**Last Updated:** 2025  
**Document Type:** Complete Architecture & Tech Stack PRD  
**Status:** Production

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Mission](#2-product-vision--mission)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Database Schema](#7-database-schema)
8. [API & Edge Functions](#8-api--edge-functions)
9. [Core Features](#9-core-features)
10. [User Experience & Flows](#10-user-experience--flows)
11. [Design System](#11-design-system)
12. [State Management](#12-state-management)
13. [Security & Authentication](#13-security--authentication)
14. [Performance & Optimization](#14-performance--optimization)
15. [Testing Strategy](#15-testing-strategy)
16. [Deployment & Infrastructure](#16-deployment--infrastructure)
17. [Monetization & Credits](#17-monetization--credits)
18. [Analytics & Monitoring](#18-analytics--monitoring)
19. [Future Roadmap](#19-future-roadmap)

---

## 1. Executive Summary

Tale Forge is an AI-powered interactive storytelling platform designed for children and families. The platform transforms user prompts into personalized, multilingual, branching narratives with voice narration, images, and video animations. Built as a modern, scalable SPA (Single Page Application), Tale Forge combines cutting-edge AI technology with child-safe, age-appropriate content generation.

### Key Metrics
- **Users:** 5,000+ active users across 50+ countries
- **Content:** 10,000+ stories generated
- **Satisfaction:** 98% user satisfaction rate
- **Performance:** Sub-2 second story generation, 99.9% uptime
- **Monetization:** Credit-based subscription model

### Unique Value Propositions
- **AI-Powered Personalization:** Each story is unique and tailored to user preferences
- **Interactive Branching:** Children make choices that shape the narrative
- **Multi-language Support:** Stories available in multiple languages with AI translation
- **Rich Media:** Audio narration, AI-generated images, and animated videos
- **Character Creation:** Users can create and reuse custom characters across stories
- **Age-Appropriate Content:** Intelligent age-group filtering and vocabulary control
- **Educational Value:** Stories promote literacy, creativity, and decision-making

---

## 2. Product Vision & Mission

### Mission Statement
Empower children's imagination through AI-generated interactive stories that adapt to their preferences, age, and language while ensuring safety and educational value.

### Vision
To become the leading platform for AI-powered children's storytelling, fostering creativity, literacy, and imagination through personalized, interactive narratives accessible to families worldwide.

### Target Audience
- **Primary:** Children aged 4-13 and their parents
- **Secondary:** Educators, librarians, and content creators
- **Geographic:** Global, with initial focus on English and Swedish markets

### Core Values
- **Safety First:** Age-appropriate, moderated content
- **Educational:** Promote literacy and critical thinking
- **Inclusive:** Multi-language, culturally diverse stories
- **Creative:** Encourage imagination and storytelling
- **Quality:** High-quality AI generation with human oversight

---

## 3. Technology Stack

### 3.1 Frontend Technologies

#### Core Framework
- **React 18.3.1:** Modern UI library with concurrent features
- **TypeScript 5.8.3:** Type-safe development with full IDE support
- **Vite 5.4.19:** Lightning-fast build tool and dev server
- **React Router DOM 6.30.1:** Client-side routing with v7 future flags

#### Styling & UI
- **Tailwind CSS 3.4.17:** Utility-first CSS framework
- **shadcn/ui:** Radix UI primitives with custom styling
- **Lucide React 0.462.0:** Modern icon library (1000+ icons)
- **class-variance-authority:** Type-safe component variants
- **tailwind-merge:** Intelligent class merging
- **tailwindcss-animate:** Animation utilities

#### UI Component Libraries
- **Radix UI Primitives:**
  - Accordion, Alert Dialog, Aspect Ratio, Avatar
  - Checkbox, Collapsible, Context Menu, Dialog
  - Dropdown Menu, Hover Card, Label, Menubar
  - Navigation Menu, Popover, Progress, Radio Group
  - Scroll Area, Select, Separator, Slider, Slot
  - Switch, Tabs, Toast, Toggle, Toggle Group, Tooltip
- **Additional Components:**
  - cmdk: Command palette
  - vaul: Drawer component
  - embla-carousel-react: Carousel/slider
  - react-resizable-panels: Resizable layouts

#### State Management & Data Fetching
- **Zustand 5.0.8:** Lightweight global state management
- **TanStack React Query 5.89.0:** Server state management and caching
- **@tanstack/react-query-devtools:** Dev tools for debugging queries

#### Form Handling & Validation
- **React Hook Form 7.61.1:** Performant form library
- **Zod 3.25.76:** TypeScript-first schema validation
- **@hookform/resolvers:** Zod resolver for React Hook Form
- **input-otp:** OTP input component

#### Data Visualization & Charts
- **Recharts 2.15.4:** Composable charting library for analytics

#### Utilities
- **date-fns 3.6.0:** Modern date utility library
- **clsx 2.1.1:** Conditional className utility
- **html2pdf.js 0.12.1:** PDF export functionality
- **react-helmet-async:** Document head management
- **sonner:** Toast notifications with rich interactions

### 3.2 Backend Technologies

#### Platform & Database
- **Supabase 2.74.0:** Complete backend-as-a-service
  - PostgreSQL 15+ database with advanced features
  - Row Level Security (RLS) for data access control
  - Realtime subscriptions via WebSockets
  - Edge Functions (Deno runtime)
  - Storage with CDN
  - Built-in authentication

#### Runtime Environment
- **Deno:** Modern, secure JavaScript/TypeScript runtime for Edge Functions
- **TypeScript:** Type-safe serverless functions

### 3.3 External Services & APIs

#### AI & Machine Learning
- **OpenRouter:** Multi-model AI orchestration
  - Access to GPT-4, Claude, Llama, and other models
  - Automatic fallback and load balancing
  - Cost optimization
- **OpenAI GPT-4o Mini:** Fast, structured outputs for story generation
- **OVH Llama 3.3 70B:** Open-source model for cost-effective generation
- **Google AI Studio (Gemini):** Additional AI capabilities

#### Media Generation
- **ElevenLabs:** Premium text-to-speech voice synthesis
  - Multiple voice options (child-friendly)
  - Streaming audio generation
  - Multi-language support
- **Image Generation Service:** AI-powered image creation
  - Story-specific illustrations
  - Character reference images
  - Age-appropriate styles
- **Video Generation Service:** Animated video creation
  - Image-to-video transformation
  - Narration synchronization

#### Payments & Monetization
- **Stripe:** Payment processing and subscription management
  - Checkout sessions
  - Customer portal
  - Webhook handling
  - Subscription management

#### Email & Communications
- **Supabase Email (Resend):** Transactional emails
  - Welcome emails
  - Migration notifications
  - Campaign emails
  - Password resets

### 3.4 Development & Testing Tools

#### Testing Frameworks
- **Vitest 3.2.4:** Unit testing framework
- **@testing-library/react 16.3.0:** React component testing
- **@testing-library/jest-dom 6.8.0:** Custom matchers
- **@testing-library/user-event 14.6.1:** User interaction simulation
- **Playwright 1.55.0:** End-to-end testing
- **jsdom 27.0.0:** DOM implementation for testing

#### Code Quality
- **ESLint 9.32.0:** JavaScript/TypeScript linting
- **TypeScript ESLint 8.38.0:** TypeScript-specific rules
- **Prettier (via Lovable):** Code formatting

#### Build & Optimization
- **esbuild:** Fast JavaScript/TypeScript bundler (via Vite)
- **rollup-plugin-visualizer:** Bundle size analysis
- **@vitejs/plugin-react-swc:** Fast React refresh with SWC

#### Additional Tools
- **tsx:** TypeScript execution for scripts
- **puppeteer 24.23.0:** Browser automation
- **sharp 0.34.4:** Image processing
- **marked 16.3.0:** Markdown parsing

---

## 4. Architecture Overview

### 4.1 High-Level Architecture

Tale Forge follows a **modern JAMstack architecture** with a clear separation between frontend, backend, and external services:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          React 18 SPA (Vite)                        │  │
│  │  - React Router (Client-side routing)                │  │
│  │  - Zustand (Global state)                            │  │
│  │  - TanStack Query (Server state)                     │  │
│  │  - Tailwind CSS + shadcn/ui                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   HTTPS/WSS       │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────┴─────────────────────────────┐
│                  Supabase Platform                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ PostgreSQL   │  │ Edge         │  │ Storage        │  │
│  │ Database     │  │ Functions    │  │ (Media CDN)    │  │
│  │ (RLS)        │  │ (Deno)       │  │                │  │
│  └──────────────┘  └──────────────┘  └────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Auth         │  │ Realtime     │  │ Email          │  │
│  │ (JWT)        │  │ (WebSocket)  │  │ (Resend)       │  │
│  └──────────────┘  └──────────────┘  └────────────────┘  │
└───────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   External APIs    │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────┴─────────────────────────────┐
│              External Service Providers                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │OpenRouter│  │ElevenLabs│  │ Stripe   │  │  Image   │  │
│  │  (AI)    │  │  (TTS)   │  │(Payments)│  │   Gen    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow Architecture

#### Story Generation Flow
1. **User Input** → Story parameters (genre, age, characters)
2. **Credit Validation** → Check user credit balance
3. **Edge Function Call** → `generate-story` with parameters
4. **AI Processing** → OpenRouter API with structured prompts
5. **Content Parsing** → Extract story content and choices
6. **Database Storage** → Save story and initial segment
7. **Media Generation** → Queue image/audio generation
8. **Real-time Updates** → WebSocket notifications to client
9. **User Interface Update** → Display story with interactive choices

#### Media Generation Flow
1. **Trigger** → User requests image/audio/video for segment
2. **Credit Check** → Validate sufficient credits
3. **Edge Function** → `generate-story-image`, `generate-story-audio`, etc.
4. **External Service** → Call image/TTS/video provider
5. **Storage Upload** → Upload media to Supabase Storage
6. **Database Update** → Update segment with media URL
7. **CDN Delivery** → Serve media via Supabase CDN
8. **Client Display** → Load and display media in UI

### 4.3 Authentication Flow

```
User → Login/Signup → Supabase Auth → JWT Token → Stored in localStorage
                                                 ↓
                              Auto-refresh every 55 minutes
                                                 ↓
                              All API calls include Bearer token
                                                 ↓
                              Database RLS enforces access control
```

### 4.4 Real-time Architecture

Tale Forge uses Supabase Realtime for live updates:

- **Video Job Status:** Track long-running video generation jobs
- **Analytics Updates:** Live dashboard metrics for admins
- **Story Updates:** Collaborative features (future)
- **Credit Balance:** Real-time credit updates

---

## 5. Frontend Architecture

### 5.1 Project Structure

```
src/
├── assets/                    # Static assets (images, fonts)
├── components/               # React components
│   ├── ui/                  # Base UI components (shadcn/ui)
│   ├── admin/               # Admin-specific components
│   ├── auth/                # Authentication components
│   ├── characters/          # Character management
│   ├── create/              # Story creation components
│   ├── layout/              # Layout components (header, footer)
│   ├── settings/            # Settings components
│   ├── story/               # Story display components
│   ├── story-lifecycle/     # Story lifecycle management
│   └── ErrorBoundary.tsx    # Global error boundary
├── constants/               # App-wide constants
├── hooks/                   # Custom React hooks
├── integrations/            # External integrations
│   └── supabase/           # Supabase client and types
├── lib/                     # Utility libraries
│   ├── api/                # API client and functions
│   ├── analytics/          # Analytics utilities
│   ├── config/             # Configuration files
│   ├── constants/          # Shared constants
│   ├── helpers/            # Helper functions
│   ├── prompts/            # AI prompt templates
│   ├── schemas/            # Zod schemas
│   └── utils/              # Utility functions
├── pages/                   # Page components (routes)
│   └── auth/               # Auth pages
├── stores/                  # Zustand stores
├── styles/                  # Global styles
├── types/                   # TypeScript type definitions
├── App.tsx                  # Main app component
├── index.css               # Global CSS (Tailwind)
└── main.tsx                # App entry point
```

### 5.2 Routing Architecture

Tale Forge uses **React Router v6** with lazy-loaded routes for optimal performance:

```typescript
// App.tsx route structure
<BrowserRouter>
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/about" element={<About />} />
    <Route path="/pricing" element={<Pricing />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/testimonials" element={<Testimonials />} />
    
    {/* Protected Routes (Require Auth) */}
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
    <Route path="/my-stories" element={<ProtectedRoute><MyStories /></ProtectedRoute>} />
    <Route path="/characters" element={<ProtectedRoute><Characters /></ProtectedRoute>} />
    <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    
    {/* Admin Routes (Require Admin Role) */}
    <Route path="/admin" element={<ProtectedRoute requiresAdmin={true}><Admin /></ProtectedRoute>} />
    
    {/* Story Routes */}
    <Route path="/story/:id" element={<ProtectedRoute requiresAuth={false} checkStoryAccess={true}><StoryViewer /></ProtectedRoute>} />
    <Route path="/story/:id/ready" element={<ProtectedRoute><StoryReady /></ProtectedRoute>} />
    <Route path="/story/:id/complete" element={<ProtectedRoute requiresAuth={false}><StoryComplete /></ProtectedRoute>} />
    <Route path="/story/:id/end" element={<StoryEnd />} />
    
    {/* Payment Routes */}
    <Route path="/success" element={<Success />} />
    
    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

**Key Features:**
- **Lazy Loading:** All routes use `React.lazy()` for code splitting
- **Error Boundaries:** Each route wrapped in `ErrorBoundary` with context
- **Suspense Boundaries:** Loading states during route transitions
- **Protected Routes:** Custom `ProtectedRoute` component for auth checks
- **Story Access Control:** Dynamic permission checking for story viewing

### 5.3 Component Architecture

#### Component Hierarchy

```
App (ErrorBoundary + Providers)
├── ThemeProvider (Theme context)
├── QueryClientProvider (React Query)
├── TooltipProvider (Radix UI)
└── BrowserRouter (Routing)
    └── Routes
        ├── Navigation (Header, User Menu)
        ├── Page Components (Route-specific)
        │   ├── Dashboard
        │   ├── CreatePage
        │   │   ├── StoryWizard
        │   │   │   ├── PromptStep
        │   │   │   ├── GenreStep
        │   │   │   ├── CharacterStep
        │   │   │   └── ReviewStep
        │   │   └── QuickStartForm
        │   ├── StoryViewer
        │   │   ├── StoryContent
        │   │   ├── ChoiceButtons
        │   │   ├── MediaPlayer
        │   │   └── StoryControls
        │   └── Characters
        │       ├── CharacterList
        │       ├── CharacterCard
        │       └── CharacterForm
        └── Footer
```

#### Component Patterns

**1. Atomic Design Pattern**
- **Atoms:** Basic UI elements (Button, Input, Badge)
- **Molecules:** Simple component combinations (FormField, Card)
- **Organisms:** Complex components (StoryWizard, CharacterForm)
- **Templates:** Page layouts (DashboardLayout, AuthLayout)
- **Pages:** Complete routes (Dashboard, CreatePage)

**2. Composition Pattern**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Story Title</CardTitle>
    <CardDescription>Story description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**3. Render Props & Slots**
- Components accept render functions for flexible UI
- Radix UI slot pattern for polymorphic components

### 5.4 Custom Hooks

Tale Forge uses extensive custom hooks for reusable logic:

#### Data Fetching Hooks
- `useStories()` - Fetch user stories with pagination
- `useStory(id)` - Fetch single story with segments
- `useCharacters()` - Fetch user characters
- `useProfile()` - Fetch user profile
- `useQuotas()` - Fetch user credit balance
- `useSubscription()` - Fetch subscription status

#### Feature Hooks
- `useStoryGeneration()` - Story generation logic
- `useMediaGeneration()` - Media generation orchestration
- `useChapterLimits()` - Story length limits based on tier
- `useVideoGeneration()` - Video generation with realtime updates
- `useAudioPersistence()` - Audio playback state management

#### UI Hooks
- `useToast()` - Toast notifications
- `useTheme()` - Theme management
- `useMediaQuery()` - Responsive breakpoints
- `useDebounce()` - Debounced values
- `useLocalStorage()` - Persistent local state

#### Auth Hooks
- `useAuth()` - Authentication state
- `useRequireAuth()` - Auth gate for components
- `useAdminCheck()` - Admin role verification

---

## 6. Backend Architecture

### 6.1 Supabase Platform

Tale Forge leverages Supabase as a complete backend solution:

#### Core Services
1. **PostgreSQL Database** - Relational data with JSONB support
2. **PostgREST API** - Auto-generated REST API from schema
3. **Realtime** - WebSocket subscriptions for live data
4. **Storage** - Object storage with CDN
5. **Auth** - JWT-based authentication with multiple providers
6. **Edge Functions** - Serverless functions (Deno runtime)

#### Database Features
- **Row Level Security (RLS):** Granular access control
- **Database Functions:** Server-side logic
- **Triggers:** Automated actions on data changes
- **Full-Text Search:** PostgreSQL FTS for story search
- **JSONB Columns:** Flexible schema for metadata
- **Foreign Key Constraints:** Data integrity
- **Indexes:** Optimized query performance

### 6.2 Edge Functions Architecture

Tale Forge uses **26 edge functions** for various operations:

```
supabase/functions/
├── _shared/                         # Shared utilities
│   ├── ai-service.ts               # Unified AI client
│   ├── credit-costs.ts             # Credit pricing logic
│   ├── cors.ts                     # CORS headers
│   └── types.ts                    # Shared types
│
├── Story Generation
│   ├── generate-story/             # Initial story creation
│   ├── generate-story-seeds/       # Story idea generation
│   ├── generate-story-segment/     # Continue story
│   ├── generate-story-ending/      # Story conclusion
│   ├── generate-story-title/       # Title generation
│   └── generate-story-page-v2/     # Chapter generation
│
├── Media Generation
│   ├── generate-story-image/       # AI image generation
│   ├── generate-story-audio/       # ElevenLabs TTS
│   ├── generate-audio-v2/          # Audio v2 endpoint
│   ├── generate-story-video/       # Video generation
│   ├── generate-video-v2/          # Video v2 endpoint
│   ├── generate-video-async/       # Async video jobs
│   └── check-video-status/         # Video job polling
│
├── Character Management
│   └── generate-character-reference-image/  # Character images
│
├── Localization
│   └── translate-content/          # AI translation
│
├── Payments (Stripe)
│   ├── create-checkout/            # Checkout session
│   ├── customer-portal/            # Billing portal
│   ├── stripe-webhook/             # Webhook handler
│   └── check-subscription/         # Subscription status
│
├── Email
│   ├── send-welcome-email/         # Onboarding
│   ├── send-migration-email/       # System updates
│   ├── send-campaign-email/        # Marketing
│   └── test-email/                 # Email testing
│
├── Maintenance
│   └── maintenance-clean-segments/ # Cleanup jobs
│
└── Developer Tools
    └── context7-mcp/               # MCP integration
```

### 6.3 Edge Function Patterns

#### Standard Function Structure
```typescript
// functions/example-function/index.ts
import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request
    const { param1, param2 } = await req.json();
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }
    
    // Business logic
    const result = await processRequest(param1, param2);
    
    // Return response
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

#### Credit Deduction Pattern
```typescript
// Shared credit deduction logic
async function deductCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  description: string,
  referenceType: string,
  referenceId: string
): Promise<number> {
  // Check balance
  const { data: credits } = await supabase
    .from('user_credits')
    .select('current_balance')
    .eq('user_id', userId)
    .single();
    
  if (!credits || credits.current_balance < amount) {
    throw new Error(`Insufficient credits. Required: ${amount}, Available: ${credits?.current_balance || 0}`);
  }
  
  // Deduct credits
  const { data: transaction } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      type: 'spend',
      amount: -amount,
      balance_after: credits.current_balance - amount,
      description,
      reference_type: referenceType,
      reference_id: referenceId
    })
    .select()
    .single();
    
  return transaction.balance_after;
}
```

---

## 7. Database Schema

### 7.1 Core Tables

#### `profiles` - User Profiles
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  username text UNIQUE,
  email text,
  display_name text,
  avatar_url text,
  bio text,
  preferred_language text DEFAULT 'en',
  credits integer DEFAULT 10,
  subscription_status text DEFAULT 'active',
  subscription_tier text DEFAULT 'free',
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  is_admin boolean DEFAULT false,
  is_founder boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### `stories` - Story Metadata
```sql
CREATE TABLE stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  prompt text,
  genre text DEFAULT 'fantasy',
  age_group text DEFAULT '7-9',
  target_age text,
  story_type text DEFAULT 'short',
  story_mode text,
  language_code text DEFAULT 'en',
  original_language_code text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
  visibility text DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
  is_public boolean DEFAULT false,
  is_complete boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  description text,
  cover_image text,
  cover_image_url text,
  thumbnail_url text,
  credits_used integer DEFAULT 0,
  selected_voice_id text,
  selected_voice_name text,
  audio_generation_status text DEFAULT 'pending',
  full_story_audio_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_author_id ON stories(author_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_visibility ON stories(visibility);
CREATE INDEX idx_stories_is_public ON stories(is_public);
CREATE INDEX idx_stories_genre ON stories(genre);
CREATE INDEX idx_stories_age_group ON stories(age_group);
CREATE INDEX idx_stories_language_code ON stories(language_code);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);

-- Full-text search
CREATE INDEX idx_stories_title_search ON stories USING gin(to_tsvector('english', title));
CREATE INDEX idx_stories_description_search ON stories USING gin(to_tsvector('english', description));

-- RLS Policies
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stories"
  ON stories FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);
```

#### `story_segments` - Story Content
```sql
CREATE TABLE story_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  segment_number integer NOT NULL,
  content text,
  segment_text text,
  choices jsonb DEFAULT '[]'::jsonb,
  is_ending boolean DEFAULT false,
  is_end boolean DEFAULT false,
  image_url text,
  image_prompt text,
  image_generation_status text DEFAULT 'pending',
  audio_url text,
  audio_generation_status text DEFAULT 'pending',
  video_url text,
  video_generation_status text DEFAULT 'pending',
  video_job_id text,
  video_provider text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(story_id, segment_number)
);

-- Indexes
CREATE INDEX idx_story_segments_story_id ON story_segments(story_id);
CREATE INDEX idx_story_segments_segment_number ON story_segments(story_id, segment_number);
CREATE INDEX idx_story_segments_created_at ON story_segments(created_at);

-- RLS Policies
ALTER TABLE story_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view segments of their stories or public stories"
  ON story_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_segments.story_id
      AND (stories.user_id = auth.uid() OR stories.is_public = true)
    )
  );

CREATE POLICY "Users can insert segments for their stories"
  ON story_segments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_segments.story_id
      AND stories.user_id = auth.uid()
    )
  );
```

#### `user_characters` - Custom Characters
```sql
CREATE TABLE user_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  character_type text DEFAULT 'human',
  personality_traits text[],
  backstory text,
  image_url text,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_characters_user_id ON user_characters(user_id);
CREATE INDEX idx_user_characters_is_public ON user_characters(is_public);
CREATE INDEX idx_user_characters_name ON user_characters(name);

-- RLS Policies
ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own characters and public characters"
  ON user_characters FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create characters"
  ON user_characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters"
  ON user_characters FOR UPDATE
  USING (auth.uid() = user_id);
```

### 7.2 Credit System Tables

#### `user_credits` - Credit Balances
```sql
CREATE TABLE user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_balance integer DEFAULT 10,
  total_earned integer DEFAULT 10,
  total_spent integer DEFAULT 0,
  last_monthly_refresh timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);

-- RLS Policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);
```

#### `credit_transactions` - Transaction History
```sql
CREATE TABLE credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text DEFAULT 'purchase' CHECK (type IN ('purchase', 'spend', 'refund', 'bonus', 'monthly')),
  transaction_type text,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  description text,
  reference_type text,
  reference_id text,
  stripe_payment_intent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- RLS Policies
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);
```

### 7.3 Additional Tables

#### `languages` - Supported Languages
```sql
CREATE TABLE languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  native_name text NOT NULL,
  is_active boolean DEFAULT true,
  ai_model_config jsonb DEFAULT '{}'::jsonb,
  prompt_templates jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sample data
INSERT INTO languages (code, name, native_name) VALUES
  ('en', 'English', 'English'),
  ('sv', 'Swedish', 'Svenska');
```

#### `story_analytics` - Usage Analytics
```sql
CREATE TABLE story_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view', 'complete', 'share', 'export')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_story_analytics_story_id ON story_analytics(story_id);
CREATE INDEX idx_story_analytics_event_type ON story_analytics(event_type);
CREATE INDEX idx_story_analytics_created_at ON story_analytics(created_at DESC);
```

#### `featured_stories` - Editorial Curation
```sql
CREATE TABLE featured_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE UNIQUE NOT NULL,
  featured_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  priority integer DEFAULT 1,
  reason text,
  is_active boolean DEFAULT true,
  featured_until timestamptz,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_featured_stories_is_active ON featured_stories(is_active);
CREATE INDEX idx_featured_stories_priority ON featured_stories(priority DESC);
```

#### `admin_settings` - System Configuration
```sql
CREATE TABLE admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage settings"
  ON admin_settings
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

---

## 8. API & Edge Functions

### 8.1 Story Generation APIs

#### `generate-story` - Initial Story Creation
**Endpoint:** `POST /functions/v1/generate-story`

**Purpose:** Generate the initial story based on user prompt, genre, and parameters.

**Input:**
```typescript
{
  prompt: string;              // User's story idea
  genre: string;               // 'Fantasy', 'Adventure', etc.
  ageGroup: string;            // '4-6', '7-9', '10-12', '13+'
  storyId: string;             // Pre-created story ID
  languageCode: string;        // 'en', 'sv', etc.
  isInitialGeneration: boolean;
  characters: Array<{          // Optional custom characters
    id: string;
    name: string;
    description: string;
  }>;
}
```

**Process:**
1. Authenticate user and validate credits (cost: 2 credits)
2. Fetch character details from database if provided
3. Build age-appropriate prompt with genre and character context
4. Call AI service (OpenRouter/OpenAI) with structured output format
5. Parse AI response for story content and choices
6. Create initial story segment in database
7. Update story status to 'completed'
8. Return story data with credit balance

**Output:**
```typescript
{
  success: boolean;
  data: {
    story: {
      id: string;
      title: string;
      content: string;
      choices: string[];
    };
    segment: {
      id: string;
      segment_number: number;
      content: string;
      choices: Array<{ id: number; text: string }>;
    };
  };
  credits: {
    used: number;
    remaining: number;
  };
  model_used: string;
}
```

#### `generate-story-segment` - Continue Story
**Endpoint:** `POST /functions/v1/generate-story-segment`

**Purpose:** Generate next story segment based on user's choice.

**Input:**
```typescript
{
  storyId: string;
  choiceId: number;
  choiceText: string;
  previousSegmentContent: string;
  storyContext: {
    title: string;
    genre: string;
    ageGroup: string;
    characters: any[];
  };
  segmentNumber: number;
  requestId: string;
}
```

**Credit Cost:** 1 credit per segment

**Output:**
```typescript
{
  success: boolean;
  data: {
    segment: {
      id: string;
      segment_number: number;
      content: string;
      choices: Array<{ id: number; text: string }>;
      is_ending: boolean;
    };
  };
  credits: {
    remaining: number;
  };
}
```

#### `generate-story-seeds` - Story Ideas
**Endpoint:** `POST /functions/v1/generate-story-seeds`

**Purpose:** Generate creative story starting ideas/prompts.

**Input:**
```typescript
{
  genre?: string;
  ageGroup?: string;
  language?: string;
  count?: number;  // Default: 5
}
```

**Credit Cost:** Free (no authentication required)

**Output:**
```typescript
{
  success: boolean;
  data: {
    seeds: Array<{
      id: number;
      title: string;
      description: string;
      genre: string;
    }>;
  };
}
```

#### `generate-story-ending` - Story Conclusion
**Endpoint:** `POST /functions/v1/generate-story-ending`

**Purpose:** Generate a satisfying conclusion to the story.

**Input:**
```typescript
{
  story_id: string;
  ending_type?: 'happy' | 'bittersweet' | 'cliffhanger';
}
```

**Credit Cost:** 1 credit

### 8.2 Media Generation APIs

#### `generate-story-image` - AI Image Generation
**Endpoint:** `POST /functions/v1/generate-story-image`

**Purpose:** Generate age-appropriate illustrations for story segments.

**Input:**
```typescript
{
  storyContent: string;
  storyTitle: string;
  ageGroup: string;
  genre: string;
  segmentNumber: number;
  story_id: string;
  segment_id: string;
  characters?: Array<{
    name: string;
    description: string;
  }>;
  requestId: string;
}
```

**Process:**
1. Validate credits (cost: 1 credit)
2. Build detailed image prompt with age-appropriate art style
3. Call image generation service
4. Upload generated image to Supabase Storage
5. Update segment with image URL
6. Set as story cover image if segment #1

**Credit Cost:** 1 credit per image

**Output:**
```typescript
{
  success: boolean;
  data: {
    image_url: string;
    prompt: string;
  };
  credits: {
    remaining: number;
  };
}
```

#### `generate-story-audio` - Voice Narration
**Endpoint:** `POST /functions/v1/generate-story-audio`

**Purpose:** Generate voice narration using ElevenLabs TTS.

**Input:**
```typescript
{
  segment_id: string;
  text: string;
  voice_id?: string;  // ElevenLabs voice ID
  request_id?: string;
}
```

**Process:**
1. Validate credits (cost: 1 credit)
2. Call ElevenLabs API with selected voice
3. Stream audio data
4. Upload audio to Supabase Storage (MP3 format)
5. Update segment with audio URL
6. Track audio generation for billing

**Credit Cost:** 1 credit per audio segment

**Output:**
```typescript
{
  success: boolean;
  data: {
    audio_url: string;
    duration_seconds: number;
  };
  credits: {
    remaining: number;
  };
}
```

#### `generate-video-v2` - Video Animation
**Endpoint:** `POST /functions/v1/generate-video-v2`

**Purpose:** Generate animated video from story image.

**Input:**
```typescript
{
  segment_id: string;
  imageUrl: string;
  prompt?: string;
  includeNarration?: boolean;
}
```

**Process:**
1. Validate user has Premium Plus subscription (video is premium feature)
2. Validate credits (cost: 3 credits)
3. Call video generation service (e.g., Runway, Pika)
4. Poll for completion (async job)
5. Upload video to Supabase Storage
6. Update segment with video URL

**Credit Cost:** 3 credits per video

**Subscription Required:** Premium Plus tier

**Output:**
```typescript
{
  success: boolean;
  data: {
    video_url: string;
    job_id: string;
    status: 'completed' | 'processing' | 'failed';
  };
}
```

#### `check-video-status` - Video Job Polling
**Endpoint:** `POST /functions/v1/check-video-status`

**Purpose:** Check status of asynchronous video generation job.

**Input:**
```typescript
{
  taskId: string;
  provider: 'runway' | 'pika' | 'other';
}
```

**Output:**
```typescript
{
  success: boolean;
  data: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    progress?: number;
    error?: string;
  };
}
```

### 8.3 Character Management APIs

#### `generate-character-reference-image` - Character Image
**Endpoint:** `POST /functions/v1/generate-character-reference-image`

**Purpose:** Generate consistent reference image for custom character.

**Input:**
```typescript
{
  character_id: string;
  character_name: string;
  character_description: string;
  character_type: string;
  age_group?: string;
  backstory?: string;
  personality_traits?: string[];
}
```

**Credit Cost:** 1 credit

**Output:**
```typescript
{
  success: boolean;
  data: {
    image_url: string;
    character_id: string;
  };
}
```

### 8.4 Translation APIs

#### `translate-content` - AI Translation
**Endpoint:** `POST /functions/v1/translate-content`

**Purpose:** Translate story content between languages.

**Input:**
```typescript
{
  content: string;
  from_language: string;
  to_language: string;
  content_type?: 'story' | 'title' | 'description';
}
```

**Credit Cost:** 0.5 credits per translation

**Output:**
```typescript
{
  success: boolean;
  data: {
    translated_content: string;
    source_language: string;
    target_language: string;
  };
}
```

### 8.5 Payment APIs

#### `create-checkout` - Stripe Checkout
**Endpoint:** `POST /functions/v1/create-checkout`

**Purpose:** Create Stripe checkout session for subscription purchase.

**Input:**
```typescript
{
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  data: {
    sessionId: string;
    url: string;
  };
}
```

#### `customer-portal` - Billing Portal
**Endpoint:** `POST /functions/v1/customer-portal`

**Purpose:** Create Stripe customer portal session for subscription management.

**Output:**
```typescript
{
  success: boolean;
  data: {
    url: string;
  };
}
```

#### `stripe-webhook` - Webhook Handler
**Endpoint:** `POST /functions/v1/stripe-webhook`

**Purpose:** Handle Stripe webhook events (subscription updates, payments, etc.).

**Events Handled:**
- `checkout.session.completed` - Subscription created
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed

### 8.6 Email APIs

#### `send-welcome-email` - Onboarding Email
**Purpose:** Send welcome email to new users.

#### `send-campaign-email` - Marketing Email
**Purpose:** Send promotional campaigns to users.

---

## 9. Core Features

### 9.1 Story Creation Wizard

The story creation wizard is a **multi-step guided experience** for creating personalized stories:

#### Wizard Steps

**Step 1: Start Your Story**
- Two creation modes:
  - **Quick Start:** Rapid story generation with minimal input
  - **Story Wizard:** Detailed, guided creation process
- Story seed suggestions (AI-generated ideas)
- Custom prompt input

**Step 2: Choose Genre**
- Genre selection:
  - Fantasy (magical worlds, dragons, wizards)
  - Adventure (quests, exploration, heroes)
  - Mystery (puzzles, detective work, secrets)
  - Superhero Stories (powers, villains, heroism)
  - Animal Stories (nature, animal characters)
  - Fairy Tales (classic themes, moral lessons)
- Visual genre cards with descriptions

**Step 3: Select Age Group**
- Age group options:
  - Ages 4-6 (Preschool) - Simple language, 30-60 words
  - Ages 7-9 (Early Elementary) - Elementary vocab, 100-140 words
  - Ages 10-12 (Middle Elementary) - Intermediate, 150-200 words
  - Ages 13+ (Young Adult) - Advanced, 250-400 words
- Age-appropriate vocabulary and complexity

**Step 4: Add Characters (Optional)**
- Select from user's custom characters
- Create new character on-the-fly
- Character preview with reference images
- Multiple character selection

**Step 5: Choose Language**
- Language selection (English, Swedish, etc.)
- Native language names
- Flag icons

**Step 6: Review & Generate**
- Summary of all selections
- Credit cost preview (typically 2 credits)
- Edit any step before generation
- Generate button triggers story creation

#### Quick Start Mode
- Single-screen creation
- Essential fields only:
  - Prompt/Seed
  - Genre
  - Age Group
- Faster generation (< 30 seconds)
- Ideal for experienced users

### 9.2 Interactive Story Reading

#### Story Viewer Features

**Content Display:**
- Clean, distraction-free reading interface
- Responsive typography with optimal line length
- Dark/light theme support
- Fullscreen mode

**Interactive Elements:**
- **Choice Buttons:** 2-4 choices per segment
- **Continue Button:** Move to next segment
- **Back Navigation:** Return to previous choices (limited)
- **Progress Indicator:** Visual chapter/segment tracker

**Media Integration:**
- **Cover Image:** Story thumbnail at top
- **Segment Images:** AI-generated illustrations
- **Audio Narration:** ElevenLabs voice synthesis
  - Play/Pause controls
  - Volume slider
  - Playback speed
  - Auto-play option
- **Video Animations:** Premium Plus feature
  - Animated segment images
  - Cinematic effects

**Story Controls:**
- **Share:** Copy link to story (if public)
- **Export PDF:** Download story as PDF
- **Save/Bookmark:** Return later
- **Report:** Flag inappropriate content

**Realtime Updates:**
- WebSocket connection for video job status
- Live progress bars for media generation
- Instant credit balance updates

### 9.3 Character Management

#### Character Creation

**Character Form:**
- Name (required)
- Description (required) - detailed physical/personality description
- Character Type: Human, Animal, Fantasy Creature, Robot, etc.
- Personality Traits (multi-select):
  - Brave, Kind, Curious, Mischievous, etc.
- Backstory (optional) - origin story
- Reference Image (optional) - AI-generated or uploaded

**Character Library:**
- Grid/list view of all characters
- Search and filter by type
- Sort by usage count, date created
- Character preview cards
- Usage statistics

**Character Usage:**
- Select characters during story creation
- Characters maintain consistency across stories
- Character usage tracking for analytics

### 9.4 Story Library (My Stories)

#### Story Management

**Views:**
- **Grid View:** Card-based layout with thumbnails
- **List View:** Compact table view

**Filters & Sorting:**
- Status: Draft, Generating, Completed, Failed
- Genre: All genres
- Age Group: All age groups
- Date: Created, Updated
- Visibility: Private, Public

**Story Actions:**
- **View:** Open story reader
- **Edit:** Modify story metadata
- **Delete:** Remove story (with confirmation)
- **Duplicate:** Create copy of story
- **Share:** Generate shareable link
- **Export:** Download as PDF
- **Publish:** Make story public (if private)
- **Unpublish:** Make story private (if public)

**Story Cards:**
- Thumbnail image
- Title and description
- Genre and age group badges
- Created date
- Status indicator
- Credits used
- View count (if public)

### 9.5 Discover Page

#### Public Story Discovery

**Features:**
- Browse public stories from all users
- Search by title, description, genre
- Filter by age group, genre, language
- Sort by newest, most viewed, featured
- Featured stories carousel (admin-curated)
- Story preview modal
- One-click story viewing

**Story Cards:**
- Cover image
- Title and excerpt
- Author name (anonymized or display name)
- Genre and age group
- View count and ratings (future)

### 9.6 User Dashboard

#### Dashboard Overview

**Quick Stats:**
- Total stories created
- Current credit balance
- Subscription tier
- Stories in progress

**Recent Activity:**
- Last 5 stories (with quick actions)
- Recent characters created
- Credit transaction history

**Quick Actions:**
- Create New Story
- Browse My Stories
- Manage Characters
- View Discover Page
- Account Settings

**Recommendations:**
- Story seeds based on user preferences
- Suggested genres
- Featured stories

### 9.7 Settings Page

#### User Preferences

**Profile Settings:**
- Display name
- Avatar (upload or URL)
- Bio
- Preferred language

**Account Settings:**
- Email (read-only from auth)
- Password change (Supabase Auth)
- Delete account

**Story Preferences:**
- Default genre
- Default age group
- Default language
- Auto-play narration

**Notification Settings:**
- Email notifications
- Story completion alerts
- Credit balance warnings

**Subscription Management:**
- Current plan details
- Usage statistics
- Upgrade/downgrade options
- Billing portal link (Stripe)

**Privacy Settings:**
- Story visibility defaults
- Profile visibility
- Data export request

### 9.8 Admin Panel

#### Admin Dashboard

**System Statistics:**
- Total users
- Total stories
- Total segments generated
- Credit usage
- Revenue (Stripe)

**User Management:**
- User list with search/filter
- View user profiles
- Adjust credit balances
- Manage roles (admin, moderator)
- Suspend/ban users

**Content Moderation:**
- Recent stories (review for safety)
- Flagged content
- Approve/reject public stories

**Featured Stories:**
- Add/remove featured stories
- Set priority order
- Schedule featured dates

**System Settings:**
- AI model configuration
- Credit costs
- Subscription tiers
- Feature flags
- Maintenance mode

**Analytics:**
- User growth charts
- Story generation trends
- Revenue reports
- Model usage statistics
- Error logs

---

## 10. User Experience & Flows

### 10.1 Onboarding Flow

```
1. Landing Page
   ↓
2. Sign Up (Email/Password or OAuth)
   ↓
3. Email Verification (optional)
   ↓
4. Welcome Modal (Tour)
   ↓
5. Initial Credits Granted (10 credits)
   ↓
6. Dashboard with Onboarding Hints
   ↓
7. First Story Creation (Guided)
```

### 10.2 Story Creation Flow

```
User Dashboard
   ↓
Create Story Button
   ↓
Choose Mode: Quick Start or Story Wizard
   ↓
[Quick Start Path]
   → Single Form
   → Generate (2 credits)
   → Story Ready Page
   
[Story Wizard Path]
   → Step 1: Prompt/Seed
   → Step 2: Genre
   → Step 3: Age Group
   → Step 4: Characters
   → Step 5: Language
   → Step 6: Review
   → Generate (2 credits)
   → Story Ready Page
```

### 10.3 Story Ready Flow

```
Story Generation Complete
   ↓
Story Ready Page
   ↓
Per-Chapter Asset Management:
   ├── Generate Image (1 credit)
   ├── Generate Audio (1 credit)
   └── Generate Video (3 credits, Premium Plus)
   ↓
Asset Generation (async)
   ↓
Asset Ready
   ↓
Read Story Button
   ↓
Story Viewer
```

### 10.4 Story Reading Flow

```
Story Viewer (Segment 1)
   ↓
Read Content
   ↓
Listen to Audio (optional)
   ↓
Watch Video (optional, Premium Plus)
   ↓
Make Choice (2-4 options)
   ↓
Generate Next Segment (1 credit)
   ↓
Segment Generated
   ↓
Repeat until Story End
   ↓
Story Complete Page
   ↓
Options:
   ├── Share Story
   ├── Export PDF
   ├── Create Another Story
   └── Return to Dashboard
```

### 10.5 Credit Purchase Flow

```
Low Credits Warning
   ↓
Pricing Page
   ↓
Select Plan
   ↓
Stripe Checkout
   ↓
Payment Success
   ↓
Webhook Updates Credits
   ↓
Success Page
   ↓
Return to Dashboard (Credits Updated)
```

---

## 11. Design System

### 11.1 Design Principles

1. **Child-Friendly:** Warm, inviting, playful aesthetics
2. **Clarity:** Clear hierarchy, readable typography
3. **Accessibility:** WCAG 2.1 AA compliance
4. **Consistency:** Reusable components and patterns
5. **Performance:** Optimized loading and interactions

### 11.2 Color System

#### Primary Colors (Purple Theme)
```css
--primary: 262 83% 58%           /* Purple #8B5CF6 */
--primary-foreground: 210 20% 98% /* White text on purple */
--primary-glow: 264 100% 70%      /* Lighter purple for effects */
```

#### Semantic Colors
```css
--success: 142 76% 36%            /* Green #22C55E */
--warning: 38 92% 50%             /* Orange #F59E0B */
--destructive: 0 84.2% 60.2%      /* Red #EF4444 */
--info: 217 91% 60%               /* Blue #3B82F6 */
```

#### Background Colors
```css
--background: 0 0% 100%           /* White */
--background-secondary: 210 40% 98% /* Light gray-blue */
--muted: 210 40% 96%              /* Muted backgrounds */
```

#### Text Colors
```css
--foreground: 222.2 84% 4.9%      /* Near-black */
--muted-foreground: 215.4 16.3% 46.9% /* Gray text */
```

#### Theme Variants

**Midnight Theme (Default):**
- Dark purple gradients
- Glassmorphism effects
- Starry backgrounds

**Light Theme:**
- Clean white backgrounds
- Soft shadows
- Pastels accents

**Sunrise Theme:**
- Warm orange-yellow gradients
- Morning atmosphere

**Ocean Theme:**
- Blue-teal gradients
- Wave effects

### 11.3 Typography

#### Font Stack
```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", 
             Roboto, "Helvetica Neue", Arial, sans-serif;
```

#### Type Scale
```css
/* Headings */
h1: 2.25rem (36px) / 2.5rem line-height
h2: 1.875rem (30px) / 2.25rem
h3: 1.5rem (24px) / 2rem
h4: 1.25rem (20px) / 1.75rem

/* Body */
body: 1rem (16px) / 1.5rem
small: 0.875rem (14px) / 1.25rem
```

#### Font Weights
- **Regular:** 400 (body text)
- **Medium:** 500 (emphasis)
- **Semibold:** 600 (headings)
- **Bold:** 700 (strong emphasis)

### 11.4 Spacing System

**Base Unit:** 0.25rem (4px)

```css
spacing: {
  0: 0,
  1: 0.25rem,    /* 4px */
  2: 0.5rem,     /* 8px */
  3: 0.75rem,    /* 12px */
  4: 1rem,       /* 16px */
  5: 1.25rem,    /* 20px */
  6: 1.5rem,     /* 24px */
  8: 2rem,       /* 32px */
  10: 2.5rem,    /* 40px */
  12: 3rem,      /* 48px */
  16: 4rem,      /* 64px */
  20: 5rem,      /* 80px */
  24: 6rem,      /* 96px */
}
```

### 11.5 Component Library

#### Button Variants
- **Primary:** Solid purple, white text
- **Secondary:** Light gray, dark text
- **Outline:** Border only, transparent background
- **Ghost:** No background, hover effect
- **Destructive:** Red, white text
- **Link:** Text only, no background

#### Button Sizes
- **sm:** Small (height 36px)
- **default:** Medium (height 40px)
- **lg:** Large (height 44px)
- **icon:** Square icon button

#### Card Components
- Standard card with shadow
- Interactive card (hover lift)
- Glassmorphism card (blur + transparency)
- Outline card (no shadow)

#### Form Components
- Input (text, email, password)
- Textarea
- Select dropdown
- Checkbox
- Radio buttons
- Switch toggle
- Slider
- Date picker
- OTP input

#### Feedback Components
- Toast notifications (Sonner)
- Alert dialogs
- Modals/Dialogs
- Loading spinners
- Progress bars
- Skeleton loaders

#### Navigation Components
- Header with logo and user menu
- Footer with links
- Breadcrumbs
- Tabs
- Accordion
- Sidebar

### 11.6 Animations

**Transition Durations:**
```css
--duration-fast: 150ms
--duration-normal: 300ms
--duration-slow: 500ms
```

**Easing Functions:**
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

**Common Animations:**
- Fade in/out
- Slide in (top, bottom, left, right)
- Scale in/out
- Rotate
- Bounce
- Shimmer (loading)

### 11.7 Responsive Breakpoints

```css
sm: 640px    /* Mobile landscape */
md: 768px    /* Tablet portrait */
lg: 1024px   /* Tablet landscape / small desktop */
xl: 1280px   /* Desktop */
2xl: 1536px  /* Large desktop */
```

---

## 12. State Management

### 12.1 Zustand Stores

Tale Forge uses **Zustand** for lightweight global state management:

#### `authStore` - Authentication State
```typescript
interface AuthStore {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}
```

#### `storyStore` - Story Creation State
```typescript
interface StoryStore {
  currentStory: Story | null;
  currentSegment: Segment | null;
  generationStatus: 'idle' | 'generating' | 'success' | 'error';
  setCurrentStory: (story: Story) => void;
  setCurrentSegment: (segment: Segment) => void;
  resetStory: () => void;
}
```

#### `uiStore` - UI State
```typescript
interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'midnight' | 'ocean' | 'sunrise';
  modalOpen: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: string) => void;
}
```

#### `languageStore` - Language State
```typescript
interface LanguageStore {
  currentLanguage: string;
  availableLanguages: Language[];
  setLanguage: (code: string) => void;
  loadLanguages: () => Promise<void>;
}
```

### 12.2 React Query (TanStack Query)

Used for **server state management** and caching:

#### Query Keys Structure
```typescript
// User queries
['profile'] - User profile
['profile', 'credits'] - Credit balance
['profile', 'subscription'] - Subscription status

// Story queries
['stories'] - User's stories
['stories', storyId] - Single story
['stories', storyId, 'segments'] - Story segments

// Character queries
['characters'] - User's characters
['characters', characterId] - Single character

// Analytics queries
['analytics', 'dashboard'] - Admin dashboard stats
['analytics', 'user', userId] - User analytics
```

#### Query Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### Mutation Patterns
```typescript
// Example: Create story mutation
const createStoryMutation = useMutation({
  mutationFn: (params: CreateStoryParams) => AIClient.generateStory(params),
  onSuccess: (data) => {
    // Invalidate stories cache
    queryClient.invalidateQueries(['stories']);
    // Navigate to story ready page
    navigate(`/story/${data.story.id}/ready`);
  },
  onError: (error) => {
    // Show error toast
    toast.error(error.message);
  },
});
```

### 12.3 Local Storage

Used for **persistent client-side state**:

- `theme` - User's theme preference
- `language` - Preferred language
- `onboarding_completed` - Onboarding tour status
- `audio_autoplay` - Auto-play narration preference
- `story_draft_${storyId}` - Auto-saved story drafts

---

## 13. Security & Authentication

### 13.1 Authentication

#### Supabase Auth
- **JWT-based authentication** with automatic token refresh
- **Email/Password authentication** with email verification
- **OAuth providers (future):** Google, GitHub, Apple
- **Session management:** Stored in localStorage, auto-refresh every 55 minutes

#### Auth Flow
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    data: {
      full_name: 'John Doe',
    },
  },
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password',
});

// Sign out
await supabase.auth.signOut();

// Get session
const { data: { session } } = await supabase.auth.getSession();
```

### 13.2 Row Level Security (RLS)

All database tables use **Row Level Security** to enforce data access:

#### Profile Access
```sql
-- Users can only view/update their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

#### Story Access
```sql
-- Users can view their own stories or public stories
CREATE POLICY "Users can view stories"
  ON stories FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Users can only modify their own stories
CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = user_id);
```

#### Admin Access
```sql
-- Only admins can manage featured stories
CREATE POLICY "Admins can manage featured stories"
  ON featured_stories
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

### 13.3 API Security

#### Edge Function Authentication
All protected edge functions verify JWT token:

```typescript
// Get authenticated user
const authHeader = req.headers.get('Authorization');
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_ANON_KEY'),
  { global: { headers: { Authorization: authHeader } } }
);

const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}
```

#### Rate Limiting
- **Supabase built-in rate limiting** on Edge Functions
- **Credit system** prevents abuse (costs credits for operations)
- **CORS** configured for allowed origins

### 13.4 Content Safety

#### AI Content Moderation
- **Age-appropriate prompts:** System prompts enforce child-safe content
- **Blacklist filtering:** Block inappropriate words/themes
- **Human moderation:** Admin review of flagged content

#### User-Generated Content
- **Character descriptions:** Limited length and validated
- **Story prompts:** Filtered for inappropriate content
- **Public stories:** Moderation queue before visibility

### 13.5 Data Privacy

#### GDPR Compliance
- **Data export:** Users can request data export
- **Data deletion:** Users can delete account and all data
- **Privacy policy:** Clear data usage disclosure
- **Cookie consent:** Not required (no tracking cookies)

#### Data Encryption
- **In transit:** TLS 1.3 for all connections
- **At rest:** Supabase database encryption
- **Passwords:** Bcrypt hashing via Supabase Auth

---

## 14. Performance & Optimization

### 14.1 Frontend Optimization

#### Code Splitting
- **Route-based splitting:** All pages lazy-loaded with `React.lazy()`
- **Component splitting:** Heavy components (Admin, StoryWizard) split
- **Vendor chunking:** UI libraries, forms, charts, API clients separated

#### Bundle Analysis
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-ui': ['@radix-ui/*'],
        'vendor-forms': ['react-hook-form', 'zod'],
        'vendor-charts': ['recharts'],
        'vendor-api': ['@supabase/supabase-js', '@tanstack/react-query'],
      }
    }
  }
}
```

#### Image Optimization
- **Lazy loading:** Native lazy loading on images
- **Responsive images:** Different sizes for different screens
- **CDN delivery:** Supabase Storage CDN for media
- **WebP format:** Modern format for smaller file sizes

#### Performance Monitoring
```typescript
// Custom performance monitor
performanceMonitor.trackPageLoad('StoryViewer');
performanceMonitor.trackBundleMetrics();
performanceMonitor.getMemoryUsage();
```

### 14.2 Backend Optimization

#### Database Optimization
- **Indexes:** Strategic indexes on frequently queried columns
- **Materialized views:** Pre-computed analytics data
- **Connection pooling:** Supabase connection management
- **Query optimization:** Efficient JOINs and filters

#### Edge Function Optimization
- **Warm starts:** Keep functions warm with scheduled pings
- **Response caching:** Cache AI responses when appropriate
- **Payload compression:** Gzip compression for responses
- **Concurrent requests:** Parallel API calls where possible

#### AI Model Optimization
- **Model selection:** Use fastest model for each operation
- **Token optimization:** Minimize prompt tokens
- **Streaming responses:** Stream AI responses where supported
- **Fallback models:** Automatic failover to alternative models

### 14.3 Caching Strategy

#### React Query Cache
```typescript
// Story cache - 5 minutes
useQuery(['stories', storyId], fetchStory, {
  staleTime: 5 * 60 * 1000,
  cacheTime: 10 * 60 * 1000,
});

// Profile cache - 10 minutes (rarely changes)
useQuery(['profile'], fetchProfile, {
  staleTime: 10 * 60 * 1000,
  cacheTime: 30 * 60 * 1000,
});
```

#### CDN Caching
- **Media files:** Long-lived cache (1 year)
- **Static assets:** Long-lived cache with versioning
- **API responses:** Short cache or no cache

### 14.4 Loading States

#### Skeleton Loaders
- Story cards show skeleton while loading
- Profile page shows skeleton components
- Dashboard shows skeleton stats

#### Suspense Boundaries
```typescript
<Suspense fallback={<Loading.Page text="Loading..." />}>
  <StoryWizard />
</Suspense>
```

#### Progress Indicators
- Story generation: Real-time progress updates
- Media generation: Progress bars with percentage
- Video generation: Live status updates via WebSocket

---

## 15. Testing Strategy

### 15.1 Unit Testing

#### Test Framework: Vitest
```typescript
// Example: Credit calculation test
describe('Credit System', () => {
  it('should deduct credits for story generation', () => {
    const initialBalance = 10;
    const cost = 2;
    const newBalance = deductCredits(initialBalance, cost);
    expect(newBalance).toBe(8);
  });
});
```

#### Component Testing: Testing Library
```typescript
// Example: Button component test
describe('Button', () => {
  it('should render with correct variant', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
  });
});
```

### 15.2 Integration Testing

#### API Integration Tests
```typescript
// Example: Story generation flow
describe('Story Generation', () => {
  it('should create story and first segment', async () => {
    const response = await AIClient.generateStory({
      prompt: 'Test story',
      genre: 'Fantasy',
      ageGroup: '7-9',
      storyId: 'test-id',
      languageCode: 'en',
      isInitialGeneration: true,
      characters: [],
    });
    
    expect(response.success).toBe(true);
    expect(response.data.story).toBeDefined();
    expect(response.data.segment).toBeDefined();
  });
});
```

### 15.3 End-to-End Testing

#### Test Framework: Playwright
```typescript
// Example: Story creation E2E test
test('user can create a story', async ({ page }) => {
  // Login
  await page.goto('/auth');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Navigate to create page
  await page.goto('/create');
  await page.click('text=Story Wizard');
  
  // Fill story details
  await page.fill('textarea[name="prompt"]', 'A dragon adventure');
  await page.click('text=Next');
  await page.click('text=Fantasy');
  await page.click('text=Next');
  await page.click('text=Ages 7-9');
  await page.click('text=Next');
  await page.click('text=Review & Generate');
  
  // Wait for generation
  await page.waitForSelector('text=Story Ready', { timeout: 60000 });
  expect(await page.textContent('h1')).toContain('Story Ready');
});
```

### 15.4 Test Coverage

**Target Coverage:**
- **Unit Tests:** 80%+ coverage on utilities, helpers, and business logic
- **Integration Tests:** Key user flows and API interactions
- **E2E Tests:** Critical paths (auth, story creation, reading)

---

## 16. Deployment & Infrastructure

### 16.1 Hosting

#### Frontend: Lovable Platform
- **Platform:** Lovable (lovable.dev)
- **Build:** Vite production build
- **CDN:** Global CDN for static assets
- **SSL:** Automatic HTTPS
- **Deployment:** Git push triggers automatic deployment

#### Backend: Supabase Cloud
- **Platform:** Supabase hosted service
- **Region:** Choose based on user geography
- **Scaling:** Automatic scaling for database and functions
- **Backups:** Daily automated backups

### 16.2 CI/CD Pipeline

#### GitHub Actions (if used)
```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      # Deploy to hosting
```

### 16.3 Environment Variables

#### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_FEATURE_JSON_OPENING=false
```

#### Backend (Edge Functions .env)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENROUTER_API_KEY=sk-or-...
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 16.4 Monitoring & Logging

#### Application Monitoring
- **Supabase Dashboard:** Database performance, API usage
- **Edge Function Logs:** Deno logs for debugging
- **React Query Devtools:** Client-side query debugging
- **Custom Logger:** Structured logging with log levels

#### Error Tracking
```typescript
// Custom error logger
logger.error('Story generation failed', error, {
  context: 'AIClient.generateStory',
  userId: user.id,
  storyId: storyId,
});
```

#### Performance Monitoring
```typescript
// Track page load time
performanceMonitor.trackPageLoad('StoryViewer');

// Track bundle size
performanceMonitor.trackBundleMetrics();
```

---

## 17. Monetization & Credits

### 17.1 Credit System

#### Credit Costs
- **Story Generation:** 2 credits (initial story)
- **Story Segment:** 1 credit (continue story)
- **Image Generation:** 1 credit per image
- **Audio Generation:** 1 credit per segment
- **Video Generation:** 3 credits per video (Premium Plus only)
- **Translation:** 0.5 credits per translation
- **Character Image:** 1 credit

#### Credit Balance
- **Free Tier:** 10 credits/month
- **Premium Tier:** 100 credits/month
- **Premium Plus Tier:** 300 credits/month + video access

#### Credit Refresh
- **Monthly refresh** on subscription renewal date
- **Unused credits** do not roll over (use-it-or-lose-it)
- **Additional credits** can be purchased (future feature)

### 17.2 Subscription Tiers

#### Free Tier
- **Price:** $0/month
- **Credits:** 10/month
- **Stories:** Unlimited (limited by credits)
- **Features:**
  - Basic story generation
  - Public story discovery
  - Character creation
  - Image generation
  - Audio narration
- **Limitations:**
  - No video generation
  - Limited credits

#### Premium Tier
- **Price:** $9.99/month
- **Credits:** 100/month
- **Stories:** Unlimited
- **Features:**
  - All Free features
  - Priority AI generation
  - Early access to new features
  - Higher story quality
  - Extended chapter limits
- **Limitations:**
  - No video generation

#### Premium Plus Tier
- **Price:** $19.99/month
- **Credits:** 300/month
- **Stories:** Unlimited
- **Features:**
  - All Premium features
  - **Video generation** (exclusive)
  - Highest priority
  - Longest chapter limits
  - Premium support
  - Founder badge (if early adopter)

### 17.3 Payment Processing

#### Stripe Integration
- **Checkout:** Stripe Checkout for new subscriptions
- **Portal:** Stripe Customer Portal for subscription management
- **Webhooks:** Real-time subscription status updates

#### Payment Flow
```
User → Pricing Page
     ↓
Select Plan → Create Checkout Session
     ↓
Stripe Checkout → Payment
     ↓
Webhook → Update Subscription & Credits
     ↓
Success Page → Confirmation
```

---

## 18. Analytics & Monitoring

### 18.1 User Analytics

#### Tracked Metrics
- **User Registration:** New sign-ups per day/week/month
- **Active Users:** Daily/Monthly Active Users (DAU/MAU)
- **User Retention:** % users returning after 7/30/90 days
- **Churn Rate:** % users cancelling subscriptions

#### Story Analytics
- **Stories Created:** Total stories per day/week/month
- **Story Completion Rate:** % stories finished vs. started
- **Average Story Length:** Segments per story
- **Genre Popularity:** Most popular genres
- **Age Group Distribution:** Stories by age group

#### Feature Usage
- **Character Creation:** Characters created over time
- **Media Generation:** Images/Audio/Video requests
- **Translation Usage:** Stories translated
- **Public Stories:** % stories made public

### 18.2 System Analytics

#### Performance Metrics
- **API Response Time:** Avg response time for edge functions
- **AI Generation Time:** Time to generate stories/segments
- **Database Query Time:** Slow query monitoring
- **Error Rate:** % requests resulting in errors

#### Resource Usage
- **Database Size:** Storage used
- **Storage:** Media files size
- **Function Invocations:** Edge function call count
- **Bandwidth:** Data transfer

### 18.3 Business Metrics

#### Revenue Metrics
- **MRR (Monthly Recurring Revenue):** Total subscription revenue
- **ARPU (Average Revenue Per User):** MRR / Active Users
- **LTV (Lifetime Value):** Avg revenue per user lifetime
- **Conversion Rate:** Free → Paid conversion %

#### Credit Economics
- **Credits Purchased:** Total credits via subscriptions
- **Credits Used:** Total credits spent on operations
- **Credit Burn Rate:** Avg credits used per user per month
- **Credit Balance:** Unused credits (liability)

---

## 19. Future Roadmap

### 19.1 Short-term (Next 3 Months)

#### Features
- **Collaborative Storytelling:** Multi-user story creation
- **Story Templates:** Pre-built story structures
- **Story Collections:** Group related stories
- **Reading Lists:** Save favorite stories
- **Story Ratings:** User ratings and reviews
- **Advanced Search:** Full-text search with filters
- **Story Remixing:** Fork and modify public stories

#### Improvements
- **Mobile App:** React Native mobile app (iOS/Android)
- **Offline Mode:** PWA with offline reading
- **Voice Input:** Speech-to-text for story prompts
- **More Languages:** Spanish, French, German support
- **Better AI Models:** GPT-4, Claude 3 integration
- **Improved Character Consistency:** Advanced character tracking

### 19.2 Mid-term (3-6 Months)

#### Features
- **Story Games:** Interactive quizzes and puzzles
- **Educational Content:** Learning-focused stories
- **Teacher Dashboard:** Classroom management for educators
- **Print on Demand:** Physical book printing
- **Story Contests:** Community story competitions
- **Achievement System:** Badges and rewards
- **Social Features:** Following, liking, commenting

#### Integrations
- **Google Classroom:** Integration for teachers
- **Amazon Kindle:** Export to Kindle format
- **Apple Books:** iBooks export
- **Spotify:** Podcast-style narration
- **YouTube:** Video story uploads

### 19.3 Long-term (6-12 Months)

#### Platform Expansion
- **White Label:** Custom-branded versions for schools/businesses
- **API Access:** Public API for third-party integrations
- **Marketplace:** Sell story templates and characters
- **Enterprise Plan:** B2B offerings for schools/libraries
- **Localization:** 20+ language support

#### Advanced Features
- **AI Voice Cloning:** Record custom narration voices
- **3D Animations:** 3D character animations
- **VR/AR Stories:** Immersive storytelling experiences
- **Story Analytics:** Detailed reader engagement metrics
- **A/B Testing:** Test different story versions
- **ML Recommendations:** Personalized story suggestions

---

## Appendix

### A. Glossary

- **Edge Function:** Serverless function running on Deno runtime
- **RLS:** Row Level Security (database access control)
- **JWT:** JSON Web Token (authentication token)
- **TTS:** Text-to-Speech (voice synthesis)
- **CDN:** Content Delivery Network
- **CRUD:** Create, Read, Update, Delete operations
- **SPA:** Single Page Application
- **PWA:** Progressive Web App
- **DAU/MAU:** Daily/Monthly Active Users
- **MRR:** Monthly Recurring Revenue
- **ARPU:** Average Revenue Per User
- **LTV:** Lifetime Value

### B. External Resources

- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **TanStack Query:** https://tanstack.com/query
- **Tailwind CSS:** https://tailwindcss.com
- **Radix UI:** https://www.radix-ui.com
- **OpenRouter:** https://openrouter.ai
- **ElevenLabs:** https://elevenlabs.io
- **Stripe:** https://stripe.com/docs

### C. Contact & Support

- **Product Website:** https://taleforge.app (example)
- **Documentation:** https://docs.taleforge.app
- **Support Email:** support@taleforge.app
- **GitHub:** https://github.com/taleforge/app
- **Discord Community:** https://discord.gg/taleforge

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0.0 | 2025-01-XX | Engineering Team | Comprehensive PRD created with full architecture documentation |

---

**End of Document**
