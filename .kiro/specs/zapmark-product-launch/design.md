# Design Document

## Overview

Zapmark AI is architected as a modern, scalable SaaS platform using a serverless-first approach. The design prioritizes:

- **Modularity**: Clear separation between marketing site, trial flow, and authenticated app
- **Scalability**: Serverless functions and managed services that scale automatically
- **Changeability**: Configuration-driven features and feature flags for easy updates
- **Performance**: Optimistic UI, edge caching, and efficient data structures
- **Security**: Defense in depth with multiple layers of protection

The system is built on Next.js 14 (App Router) with Firebase backend services, Stripe for payments, and Google Gemini AI for generation.

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN Layer (Vercel Edge)                  │
│  - Static assets caching                                         │
│  - Marketing pages (/, /pricing, /examples)                      │
│  - Edge functions for geolocation                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 14 Application Layer                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Marketing Site  │  │   Trial Flow     │  │  App Surface  │ │
│  │  - Landing       │  │  - Onboarding    │  │  - Generator  │ │
│  │  - Pricing       │  │  - Signup Gate   │  │  - Library    │ │
│  │  - Examples      │  │  - localStorage  │  │  - Account    │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      State Management Layer                      │
│  - React Context for global state (user, credits)               │
│  - Custom Firebase hooks (useUser, useCollection, useDoc)       │
│  - Local state for UI (forms, modals, loading)                  │
│  - localStorage for trial persistence                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Firebase Services Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Firebase   │  │  Firestore   │  │    Cloud     │         │
│  │     Auth     │  │   Database   │  │   Storage    │         │
│  │  - Google    │  │  - Users     │  │  - Images    │         │
│  │  - Email     │  │  - Grids     │  │  - Assets    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Server Actions (Next.js)                      │ │
│  │  - AI Flows (Genkit)                                       │ │
│  │  - Credit Management                                       │ │
│  │  - Stripe Integration                                      │ │
│  │  - Image Processing                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Gemini AI  │  │    Stripe    │  │    Sentry    │         │
│  │  (Google)    │  │   Payments   │  │   Monitoring │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router, React Server Components, Server Actions)
- TypeScript for type safety
- Tailwind CSS + Shadcn/UI for styling
- Framer Motion for animations
- React Hook Form + Zod for validation

**Backend:**
- Next.js Server Actions for API layer
- Firebase Cloud Functions for webhooks and scheduled tasks
- Genkit AI for AI workflow orchestration

**Database & Storage:**
- Firestore (document database with real-time capabilities)
- Cloud Storage (object storage for images)
- localStorage (trial state persistence)

**Authentication & Payments:**
- Firebase Authentication (Google OAuth, Email/Password)
- Stripe (subscriptions, one-time purchases, customer portal)

**AI & Generation:**
- Google Gemini 2.5 Flash Image Preview
- Genkit framework for flow management

**Monitoring & Analytics:**
- Sentry for error tracking
- Vercel Analytics for performance
- Custom analytics via Firestore

## Components and Interfaces

### Route Structure

```
/                           # Landing page (marketing)
/pricing                    # Pricing page (marketing)
/examples                   # Examples gallery (marketing)
/terms                      # Terms of Service (legal)
/privacy                    # Privacy Policy (legal)

/app                        # Main generator (trial or authenticated)
/app/library                # Grid history (authenticated only)
/app/account                # Account settings (authenticated only)

/api/webhooks/stripe        # Stripe webhook handler
/api/health                 # Health check endpoint
```

### Component Architecture

#### Marketing Site Components

**1. LandingPage (`src/app/page.tsx`)**
- Hero section with CTA
- How it works section
- Example gallery
- Pricing teaser
- Footer

**2. PricingPage (`src/app/pricing/page.tsx`)**
- Plan comparison cards
- Credit cost breakdown
- FAQ accordion
- CTA buttons

**3. ExamplesPage (`src/app/examples/page.tsx`)**
- Niche categories
- Grid previews
- "Try similar" functionality

#### Trial Flow Components

**4. OnboardingWizard (`src/components/trial/onboarding-wizard.tsx`)**

**Purpose**: 3-step guided experience for trial users

**State:**
```typescript
{
  currentStep: 1 | 2 | 3
  assetType: 'logo' | 'custom' | 'sticker'
  concept: string
  gridSize: '3x3' | '4x4'
}
```

**Steps:**
1. Asset type selection (syncs with sidebar)
2. Concept input (syncs with sidebar)
3. Grid size selection (syncs with sidebar)

**Features:**
- Step indicators
- Back/Next navigation
- Form validation per step
- Syncs with main form in sidebar
- Closes on "Generate my free grid"

**5. SignupGate (`src/components/trial/signup-gate.tsx`)**

**Purpose**: Convert trial users to authenticated users

**Props:**
```typescript
{
  isOpen: boolean
  onClose: () => void
  onSignupComplete: (user: User) => void
  intendedAction: 'download' | 'upscale' | 'generate' | 'edit'
}
```

**Features:**
- Google OAuth button
- Email/password form
- Terms/Privacy links
- Loading states
- Error handling
- Automatic action resumption after signup

**6. TrialBanner (`src/components/trial/trial-banner.tsx`)**

**Purpose**: Inform trial users of limitations

**Features:**
- Dismissible (stores in localStorage)
- Shows remaining trial actions
- CTA to create account
- Responsive design

#### App Surface Components

**7. AppLayout (`src/app/app/layout.tsx`)**

**Purpose**: Shared layout for all app routes

**Features:**
- Header with navigation
- Credits indicator
- User menu
- Trial ribbon (conditional)
- Responsive sidebar toggle

**8. AppHeader (`src/components/app/app-header.tsx`)**

**Purpose**: Top navigation and account management

**State:**
```typescript
{
  user: User | null
  credits: number
  isTrialMode: boolean
}
```

**Features:**
- Logo (links to /app)
- "New grid" button
- "My grids" button
- Credits pill with warning states
- User avatar dropdown
- Login button (unauthenticated)
- Trial ribbon (trial mode)

**9. GeneratorSidebar (`src/components/app/generator-sidebar.tsx`)**

**Purpose**: Input controls for generation

**Form Schema:**
```typescript
{
  concept: string (min 1 char)
  assetType: 'logo' | 'custom' | 'sticker'
  gridSize: '3x3' | '4x4'
  style: string (optional, from style selector)
}
```

**Features:**
- Real-time validation
- Credit cost display
- Disabled states (insufficient credits)
- Style selector modal trigger
- Generate button with confirmation

**10. GridDisplay (`src/components/app/grid-display.tsx`)**

**Purpose**: Display generated grid with interactions

**Props:**
```typescript
{
  grid: LogoGrid | null
  isLoading: boolean
  isTrial: boolean
  onTileClick: (logo: Logo) => void
  onDownloadAll: () => void
}
```

**States:**
- Empty state (before generation)
- Loading state (progress indicator)
- Grid loaded state (tiles with hover)
- Trial state (locked actions)

**Features:**
- Responsive grid layout
- Tile hover overlays
- Action buttons (download, upscale, variations, variety, edit)
- Lock icons for trial users
- Download all button
- Grid metadata header

**11. LibraryPage (`src/app/app/library/page.tsx`)**

**Purpose**: Browse and manage past generations

**Features:**
- Grid cards with thumbnails
- Filter by asset type
- Sort by date
- Pagination
- Empty state
- Delete confirmation
- Open in generator

**12. AccountPage (`src/app/app/account/page.tsx`)**

**Purpose**: Manage subscription and profile

**Sections:**
- Plan overview (current plan, renewal date)
- Credit usage (breakdown by operation)
- Billing history (invoices)
- Profile settings (name, email)
- Subscription management (Stripe portal link)
- Buy credits (one-time purchases)
- Cancel subscription

### Data Models

#### Firestore Schema

```
/users/{userId}
{
  id: string
  email: string
  name: string
  photoURL?: string
  creationDate: Timestamp
  remainingCredits: number
  plan: 'free' | 'creator' | 'studio'
  stripeCustomerId?: string
  subscriptionStatus?: 'active' | 'canceled' | 'past_due'
  subscriptionId?: string
  currentPeriodEnd?: Timestamp
}

/users/{userId}/logoGrids/{gridId}
{
  id: string
  userId: string
  concept: string
  assetType: 'logo' | 'custom' | 'sticker'
  gridSize: '3x3' | '4x4'
  type: 'concept' | 'variations' | 'variety' | 'upscale'
  creationDate: Timestamp
  creditCost: number
}

/users/{userId}/logoGrids/{gridId}/logoVariations/{variationId}
{
  id: string
  logoGridId: string
  imageUrl: string
  tileIndex: number
  editPrompt?: string
  creationDate: Timestamp
}

/users/{userId}/creditTransactions/{transactionId}
{
  id: string
  userId: string
  amount: number (negative for deductions, positive for additions)
  type: 'deduct' | 'refund' | 'purchase' | 'subscription'
  operation: string (e.g., 'generateGrid', 'upscale')
  balanceBefore: number
  balanceAfter: number
  metadata?: object
  timestamp: Timestamp
}

/config/credits
{
  costs: {
    grid3x3: 2
    grid4x4: 3
    upscale: 1
    edit: 1
    variation: 1
    variety: 1
  }
  plans: {
    creator: {
      monthlyCredits: 100
      price: 5.00
      currency: 'EUR'
    }
  }
  creditPacks: [
    { credits: 200, price: 10.00, currency: 'EUR' },
    { credits: 500, price: 20.00, currency: 'EUR' }
  ]
}
```

#### TypeScript Types

```typescript
// User types
type User = {
  id: string
  email: string
  name: string
  photoURL?: string
  creationDate: Timestamp
  remainingCredits: number
  plan: 'free' | 'creator' | 'studio'
  stripeCustomerId?: string
  subscriptionStatus?: 'active' | 'canceled' | 'past_due'
  subscriptionId?: string
  currentPeriodEnd?: Timestamp
}

// Grid types
type AssetType = 'logo' | 'custom' | 'sticker'
type GridSize = '2x2' | '3x3' | '4x4'
type GridType = 'concept' | 'variations' | 'variety' | 'upscale'

type LogoGrid = {
  id: string
  userId: string
  concept: string
  assetType: AssetType
  gridSize: GridSize
  type: GridType
  creationDate: Timestamp
  creditCost: number
}

type Logo = {
  id: string
  url: string
  logoGridId: string
  tileIndex: number
  isUnsaved?: boolean
  editPrompt?: string
}

// Credit types
type CreditTransaction = {
  id: string
  userId: string
  amount: number
  type: 'deduct' | 'refund' | 'purchase' | 'subscription'
  operation: string
  balanceBefore: number
  balanceAfter: number
  metadata?: Record<string, any>
  timestamp: Timestamp
}

type CreditCosts = {
  grid3x3: number
  grid4x4: number
  upscale: number
  edit: number
  variation: number
  variety: number
}

// Configuration types
type PlanConfig = {
  monthlyCredits: number
  price: number
  currency: string
}

type CreditPack = {
  credits: number
  price: number
  currency: string
}

type AppConfig = {
  costs: CreditCosts
  plans: Record<string, PlanConfig>
  creditPacks: CreditPack[]
}
```

### State Management Strategy

#### Global State (React Context)

```typescript
// UserContext
{
  user: User | null
  isLoading: boolean
  isTrialMode: boolean
  signIn: (provider: 'google' | 'email') => Promise<void>
  signOut: () => Promise<void>
}

// CreditsContext
{
  credits: number
  isLoading: boolean
  deductCredits: (amount: number, operation: string) => Promise<boolean>
  refundCredits: (amount: number, reason: string) => Promise<void>
  refreshCredits: () => Promise<void>
}

// ConfigContext
{
  costs: CreditCosts
  plans: Record<string, PlanConfig>
  creditPacks: CreditPack[]
  isLoading: boolean
}
```

#### Local State (Component Level)

- Form inputs (React Hook Form)
- Modal open/close states
- Loading indicators
- Temporary UI state

#### Persistent State (localStorage)

```typescript
// Trial state
{
  trialGrid: {
    concept: string
    assetType: AssetType
    gridSize: GridSize
    tiles: Array<{ id: string, dataUrl: string }>
    generatedAt: number
  }
  hasSeenOnboarding: boolean
  dismissedBanner: boolean
}
```

## AI Flow Architecture

### Modular Flow Design

Each AI operation is a separate, testable Genkit flow:

```typescript
// src/ai/flows/generate-initial-grid.ts
export async function generateInitialGrid(input: {
  concept: string
  assetType: AssetType
  gridSize: GridSize
}): Promise<{ gridImage: string }>

// src/ai/flows/generate-variations.ts
export async function generateVariations(input: {
  baseLogo: string
}): Promise<{ variationGridImage: string }>

// src/ai/flows/generate-variety.ts
export async function generateVariety(input: {
  baseLogo: string
}): Promise<{ varietyGridImage: string }>

// src/ai/flows/upscale-logo.ts
export async function upscaleLogo(input: {
  logoDataUri: string
}): Promise<{ upscaledLogoDataUri: string }>

// src/ai/flows/edit-logo.ts
export async function editLogo(input: {
  logoDataUri: string
  editPrompt: string
}): Promise<{ editedLogoDataUri: string }>
```

### Prompt Engineering Strategy

**Asset Type Prompts:**

```typescript
const ASSET_PROMPTS = {
  logo: `Generate professional logo designs with clean backgrounds. 
         Focus on simplicity, scalability, and brand identity.`,
  
  custom: `Generate creative design variations based on the concept. 
          Explore different artistic styles and interpretations.`,
  
  sticker: `Generate sticker-style designs with die-cut appearance. 
           Include white borders and vibrant colors suitable for printing.`
}
```

**Grid Generation Template:**

```typescript
const gridPrompt = `
Generate an evenly spaced ${gridSize} grid of distinct ${assetType} variations.
Concept: "${concept}"

Requirements:
- Each variation must be clearly different from others
- No duplicates or near-duplicates
- Evenly spaced in perfect ${gridSize} layout
- Centered within grid cells
- ${ASSET_PROMPTS[assetType]}
- Neutral background
- No text or numbering

${styleModifier ? `Style: ${styleModifier}` : ''}
`
```

## Credit Management System

### Credit Flow Architecture

```
User Action → Check Credits → Deduct (Transaction) → Execute Operation
                    ↓                                        ↓
              Insufficient?                            Success/Failure
                    ↓                                        ↓
              Show Upgrade Modal                    Refund on Failure
```

### Implementation

```typescript
// src/lib/credits/credit-manager.ts
class CreditManager {
  async checkAndDeduct(
    userId: string,
    operation: string,
    cost: number
  ): Promise<{ success: boolean; error?: string }> {
    // Use Firestore transaction for atomicity
    return await runTransaction(firestore, async (transaction) => {
      const userRef = doc(firestore, 'users', userId)
      const userDoc = await transaction.get(userRef)
      
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }
      
      const currentCredits = userDoc.data().remainingCredits || 0
      
      if (currentCredits < cost) {
        return { success: false, error: 'insufficient_credits' }
      }
      
      const newBalance = currentCredits - cost
      
      // Update user credits
      transaction.update(userRef, {
        remainingCredits: newBalance
      })
      
      // Log transaction
      const transactionRef = doc(
        collection(firestore, 'users', userId, 'creditTransactions')
      )
      transaction.set(transactionRef, {
        userId,
        amount: -cost,
        type: 'deduct',
        operation,
        balanceBefore: currentCredits,
        balanceAfter: newBalance,
        timestamp: serverTimestamp()
      })
      
      return { success: true }
    })
  }
  
  async refund(
    userId: string,
    operation: string,
    amount: number,
    reason: string
  ): Promise<void> {
    // Similar transaction logic for refunds
  }
}
```

## Stripe Integration Architecture

### Webhook Handler

```typescript
// src/app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  
  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  )
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object)
      break
    
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object)
      break
    
    case 'customer.subscription.deleted':
      await handleSubscriptionCancel(event.data.object)
      break
    
    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object)
      break
    
    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object)
      break
  }
  
  return new Response(JSON.stringify({ received: true }), {
    status: 200
  })
}
```

### Subscription Flow

```
User clicks "Subscribe" → Create Checkout Session → Redirect to Stripe
                                                            ↓
                                                    User completes payment
                                                            ↓
                                              Webhook: checkout.session.completed
                                                            ↓
                                        Create/Update user in Firestore
                                        Grant credits
                                        Update subscription status
                                                            ↓
                                              Redirect to /app/account
```

## Security Architecture

### Defense in Depth

**Layer 1: Client-Side Validation**
- Form validation with Zod
- Input sanitization
- CSRF tokens

**Layer 2: Firebase Auth**
- Required for all app routes
- Token verification on server
- Session management

**Layer 3: Firestore Security Rules**
```javascript
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
  
  match /logoGrids/{gridId} {
    allow read, write: if request.auth.uid == userId;
  }
  
  match /creditTransactions/{transactionId} {
    allow read: if request.auth.uid == userId;
    allow write: if false; // Only server can write
  }
}
```

**Layer 4: Server-Side Validation**
- Verify user authentication
- Validate credit balance
- Rate limiting
- Input validation

**Layer 5: External Service Security**
- API keys in environment variables
- Webhook signature verification
- HTTPS only

## Performance Optimization

### Frontend Optimizations

**Code Splitting:**
```typescript
// Dynamic imports for heavy components
const OnboardingWizard = dynamic(() => import('@/components/trial/onboarding-wizard'))
const EditSidebar = dynamic(() => import('@/components/app/edit-sidebar'))
```

**Image Optimization:**
```typescript
// Next.js Image with optimization
<Image
  src={logo.url}
  alt="Logo"
  width={300}
  height={300}
  placeholder="blur"
  blurDataURL={logo.blurHash}
  loading="lazy"
/>
```

**Caching Strategy:**
```typescript
// React Query for data fetching
const { data: grids } = useQuery({
  queryKey: ['grids', userId],
  queryFn: () => fetchUserGrids(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000 // 10 minutes
})
```

### Backend Optimizations

**Firestore Indexing:**
```
Collection: logoGrids
Indexes:
- userId ASC, creationDate DESC
- userId ASC, assetType ASC, creationDate DESC
```

**Cloud Function Optimization:**
```typescript
// Minimum instances to reduce cold starts
export const stripeWebhook = functions
  .runWith({
    minInstances: 1,
    memory: '256MB',
    timeoutSeconds: 60
  })
  .https.onRequest(handler)
```

## Testing Strategy

### Unit Tests
- Utility functions
- Credit calculations
- Prompt generation
- Image slicing

### Integration Tests
- AI flow execution
- Credit deduction
- Stripe webhook handling
- Firestore transactions

### E2E Tests (Playwright)
- Trial flow: landing → onboarding → generation → signup
- Authenticated flow: login → generate → library → account
- Payment flow: subscribe → verify credits → cancel

### Manual Testing Checklist
- [ ] Trial user can generate one free grid
- [ ] Signup gate appears on locked actions
- [ ] Credits deduct correctly for each operation
- [ ] Stripe subscription activates account
- [ ] Grid library displays all past generations
- [ ] Mobile responsive on all pages
- [ ] Error handling for failed operations
- [ ] Refunds work on AI failures

## Deployment Strategy

### Environment Configuration

```
Development: localhost:3000
Staging: staging.zapmark.ai
Production: zapmark.ai, app.zapmark.ai
```

### CI/CD Pipeline

```
Git Push → GitHub Actions → Run Tests → Build → Deploy to Vercel
                                              ↓
                                    Deploy Firestore Rules
                                    Deploy Cloud Functions
```

### Feature Flags

```typescript
// src/lib/feature-flags.ts
export const FEATURES = {
  TRIAL_MODE: true,
  CREDIT_PACKS: true,
  STUDIO_PLAN: false, // Coming soon
  BULK_OPERATIONS: false,
  API_ACCESS: false
}
```

## Monitoring and Observability

### Key Metrics

**Business Metrics:**
- Trial conversion rate
- Signup to paid conversion
- Average credits per user
- Churn rate
- MRR growth

**Technical Metrics:**
- AI operation success rate
- Average generation time
- Error rate by operation
- API response times
- Credit transaction failures

### Alerting Rules

- Error rate > 5% for 5 minutes
- AI operation failure rate > 10%
- Stripe webhook failures
- Credit balance goes negative
- Storage usage > 80%

## Future Enhancements

### Phase 2 Features
- Team collaboration
- Brand kits (colors, fonts, guidelines)
- Vector export (SVG)
- API access for developers
- Bulk operations
- Advanced editing tools

### Technical Improvements
- Real-time collaboration (WebRTC)
- Progressive Web App
- Offline support
- Advanced caching
- A/B testing framework
- Multi-region deployment

