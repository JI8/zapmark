# Design Document

## Overview

Zapmark is built on a modern serverless architecture using Next.js 14 (App Router), Firebase services, and Google's Gemini AI. The system follows a client-server pattern where the Next.js frontend handles UI and client-side state, while Firebase Cloud Functions and Genkit AI flows handle backend logic, AI operations, and data persistence.

The architecture prioritizes:
- **Scalability**: Serverless functions scale automatically with demand
- **Security**: All AI operations and sensitive data access occur server-side
- **Performance**: Optimistic UI updates and background saves minimize perceived latency
- **Cost Efficiency**: Token-based billing ensures sustainable AI usage

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Next.js 14 App (React + TypeScript)            │ │
│  │  - App Router                                          │ │
│  │  - Client Components (useState, useEffect)             │ │
│  │  - Firebase Hooks (useUser, useCollection, useDoc)     │ │
│  │  - Shadcn/UI Components                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Firebase Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Firebase   │  │  Firestore   │  │    Cloud     │     │
│  │     Auth     │  │   Database   │  │   Storage    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Server Actions
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Processing Layer                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Genkit AI Flows (Server)                  │ │
│  │  - generateInitialLogoGrid                             │ │
│  │  - generateLogoVariation                               │ │
│  │  - upscaleAndCleanupLogo                               │ │
│  │  - editLogoWithTextPrompt                              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Gemini AI  │  │    Stripe    │                        │
│  │  (Google AI) │  │   Payments   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router, React Server Components)
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn/UI component library
- React Hook Form + Zod for form validation

**Backend:**
- Firebase Cloud Functions (Node.js 20)
- Genkit AI framework for AI workflows
- Firebase Admin SDK

**Database & Storage:**
- Firestore (NoSQL document database)
- Cloud Storage (object storage for images)

**AI & ML:**
- Google Gemini 2.5 Flash Image Preview
- Genkit for AI flow orchestration

**Authentication & Billing:**
- Firebase Authentication (Google OAuth)
- Stripe for subscription management

## Components and Interfaces

### Frontend Components

#### 1. Page Component (`src/app/page.tsx`)

**Purpose**: Main application page that orchestrates the logo generation workflow

**State Management:**
```typescript
- logos: Logo[]                    // Current grid of logos
- gridSize: '3x3' | '4x4'         // Selected grid size
- isLoading: boolean              // Generation in progress
- isSaving: boolean               // Background save in progress
- selectedLogo: Logo | null       // Currently selected logo for editing
```

**Key Responsibilities:**
- Fetch and display user's most recent logo grid
- Handle grid generation requests
- Manage optimistic UI updates (show temp logos immediately)
- Background save to Firestore and Cloud Storage
- Coordinate between form, grid, and sidebar components

**Data Flow:**
1. User submits form → `handleGenerate()`
2. Call AI flow → Get grid image
3. Slice image into tiles → Display immediately (temp state)
4. Upload to Storage → Save to Firestore (background)
5. Update state with permanent URLs

#### 2. LogoGeneratorForm Component

**Purpose**: Input form for logo generation parameters

**Props:**
```typescript
interface LogoGeneratorFormProps {
  onGenerate: (data: LogoGenSchema) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

**Form Schema:**
```typescript
{
  textConcept: string (min 10 chars)
  gridSize: '3x3' | '4x4'
  generationType: 'logo' | 'custom' | 'sticker'
}
```

**Features:**
- Disabled state when not authenticated
- Real-time validation with Zod
- Visual selection for grid size and generation type

#### 3. LogoGrid Component

**Purpose**: Display grid of logo variations with hover interactions

**Props:**
```typescript
interface LogoGridProps {
  logos: Logo[];
  onSelectLogo: (logo: Logo) => void;
  isLoading: boolean;
  gridSize: '3x3' | '4x4';
  isAuthenticated: boolean;
}
```

**Features:**
- Responsive grid layout (2 cols mobile, 3-4 cols desktop)
- Skeleton loading states
- Hover overlay with edit button
- Aspect ratio preservation (1:1)
- Optimized image loading with Next.js Image

#### 4. EditSidebar Component

**Purpose**: Side panel for logo refinement operations

**Props:**
```typescript
interface EditSidebarProps {
  logo: Logo | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateLogo: (logo: Logo) => void;
  onAddLogo: (logo: Logo, currentTileCount: number) => void;
}
```

**Tabs:**
1. **Edit**: Text-based modifications to existing logo
2. **Vary**: Generate new variations with prompts
3. **Upscale**: Enhance resolution and quality

**Features:**
- Disabled state for unsaved logos
- Loading states per operation
- Download functionality
- Toast notifications for feedback

#### 5. Header Component (To Be Implemented)

**Purpose**: Navigation and user account management

**Features:**
- Logo/branding
- User profile dropdown
- Token balance display
- Navigation to library
- Sign in/out buttons

### Backend AI Flows

#### 1. generateInitialLogoGrid

**Input:**
```typescript
{
  textConcept: string
  gridSize: '3x3' | '4x4'
  generationType: 'logo' | 'custom' | 'sticker'
}
```

**Output:**
```typescript
{
  logoGridImage: string  // Data URI of full grid
}
```

**Process:**
1. Select prompt template based on generation type
2. Call Gemini 2.5 Flash Image with structured prompt
3. Return single image containing full grid
4. Client slices image into individual tiles

**Prompt Strategy:**
- Logo: Professional logo designs with neutral background
- Custom: General design variations
- Sticker: Die-cut appearance with white borders

#### 2. generateLogoVariation

**Input:**
```typescript
{
  baseLogo: string  // Data URI
  prompt: string
}
```

**Output:**
```typescript
{
  variedLogo: string  // Data URI
}
```

**Process:**
1. Pass base logo image + text prompt to Gemini
2. Model generates variation maintaining visual style
3. Return new logo as data URI

#### 3. upscaleAndCleanupLogo

**Input:**
```typescript
{
  logoDataUri: string
}
```

**Output:**
```typescript
{
  upscaledLogoDataUri: string
}
```

**Process:**
1. Send logo to Gemini with upscaling prompt
2. Model enhances resolution and removes artifacts
3. Return high-resolution version (target: 2048x2048+)

#### 4. editLogoWithTextPrompt

**Input:**
```typescript
{
  logoDataUri: string
  textPrompt: string
}
```

**Output:**
```typescript
{
  editedLogoDataUri: string
}
```

**Process:**
1. Pass logo + edit instructions to Gemini
2. Model applies requested modifications
3. Return edited logo maintaining core design

### Firebase Integration

#### Custom Hooks

**useUser()**: Authentication state
```typescript
{
  user: User | null
  isUserLoading: boolean
  userError: Error | null
}
```

**useCollection()**: Real-time Firestore collection
```typescript
{
  data: T[] | null
  isLoading: boolean
  error: Error | null
}
```

**useDoc()**: Real-time Firestore document
```typescript
{
  data: T | null
  isLoading: boolean
  error: Error | null
}
```

**Non-blocking Updates:**
- `updateDocumentNonBlocking()`: Fire-and-forget updates
- `setDocumentNonBlocking()`: Fire-and-forget creates

## Data Models

### Firestore Schema

#### Users Collection
```
/users/{userId}
{
  id: string
  email: string
  name: string
  creationDate: Timestamp
}
```

#### Logo Grids Subcollection
```
/users/{userId}/logoGrids/{gridId}
{
  id: string
  userId: string
  concept: string
  gridSize: '3x3' | '4x4'
  creationDate: Timestamp
}
```

#### Logo Variations Subcollection
```
/users/{userId}/logoGrids/{gridId}/logoVariations/{variationId}
{
  id: string
  logoGridId: string
  imageUrl: string
  tileIndex: number
  editPrompt?: string
}
```

#### Tokens Document (To Be Implemented)
```
/users/{userId}/tokens
{
  userId: string
  monthlyAllotment: number
  tokensUsed: number
  lastRefillDate: Timestamp
}
```

#### Stripe Customer Document (To Be Implemented)
```
/users/{userId}/stripeCustomer
{
  customerId: string
  subscriptionId: string
  subscriptionStatus: 'active' | 'canceled' | 'past_due'
  planId: string
  currentPeriodEnd: Timestamp
}
```

### Cloud Storage Structure

```
/users/{userId}/logos/{gridId}/{variationId}.png
```

**Naming Convention:**
- User-scoped for security
- Grid-scoped for organization
- Variation ID as filename for uniqueness

### Type Definitions

```typescript
type Logo = {
  id: string
  url: string
  isUnsaved?: boolean
  logoGridId?: string
  tileIndex?: number
}

type LogoVariation = {
  id: string
  logoGridId: string
  imageUrl: string
  tileIndex: number
  editPrompt?: string
}

type LogoGridDoc = {
  id: string
  concept: string
  creationDate: Timestamp
  gridSize: '3x3' | '4x4'
  userId: string
}

type TokenRecord = {
  userId: string
  monthlyAllotment: number
  tokensUsed: number
  lastRefillDate: Timestamp
}

type StripeCustomer = {
  customerId: string
  subscriptionId: string
  subscriptionStatus: 'active' | 'canceled' | 'past_due'
  planId: string
  currentPeriodEnd: Timestamp
}
```

## Error Handling

### Client-Side Error Handling

**Strategy**: Graceful degradation with user feedback

**Implementation:**
```typescript
try {
  // Operation
  await performOperation()
  toast({ title: 'Success', description: 'Operation completed' })
} catch (error) {
  console.error(error)
  const message = error instanceof Error ? error.message : 'Unknown error'
  toast({
    variant: 'destructive',
    title: 'Operation Failed',
    description: message
  })
}
```

**Error Categories:**
1. **Authentication Errors**: Redirect to sign-in or show auth prompt
2. **AI Generation Errors**: Display error toast, retain previous state
3. **Storage Errors**: Retry with exponential backoff
4. **Network Errors**: Show offline indicator, queue operations
5. **Validation Errors**: Inline form validation messages

### Server-Side Error Handling

**AI Flow Errors:**
```typescript
if (!media?.url) {
  throw new Error('AI did not return an image')
}
```

**Firestore Transaction Errors:**
```typescript
try {
  await runTransaction(firestore, async (transaction) => {
    // Atomic operations
  })
} catch (error) {
  // Rollback automatic, log error
  console.error('Transaction failed:', error)
  throw error
}
```

**Token Enforcement:**
```typescript
if (tokensRemaining < operationCost) {
  throw new Error('Insufficient tokens. Please upgrade your plan.')
}
```

## Testing Strategy

### Unit Testing

**Target Coverage**: Core business logic and utilities

**Test Files:**
- `src/lib/image-slicer.test.ts`: Grid slicing logic
- `src/lib/utils.test.ts`: Utility functions
- `src/firebase/hooks.test.ts`: Custom hooks (with mocks)

**Tools:**
- Jest or Vitest for test runner
- React Testing Library for component tests
- Firebase emulators for integration tests

**Example Test:**
```typescript
describe('sliceGridImage', () => {
  it('should slice 3x3 grid into 9 equal tiles', async () => {
    const gridImage = 'data:image/png;base64,...'
    const tiles = await sliceGridImage(gridImage, 3, 3)
    expect(tiles).toHaveLength(9)
    expect(tiles[0]).toMatch(/^data:image/)
  })
})
```

### Integration Testing

**Scenarios:**
1. **End-to-End Grid Generation**: Form submit → AI call → Storage upload → Firestore save
2. **Authentication Flow**: Sign in → Token initialization → Access control
3. **Variation Generation**: Select logo → Submit prompt → New variation added
4. **Token Deduction**: Perform operation → Verify token count decreases

**Tools:**
- Playwright or Cypress for E2E tests
- Firebase Emulator Suite for local testing

### Manual Testing Checklist

**Core Flows:**
- [ ] Sign in with Google
- [ ] Generate 3x3 logo grid
- [ ] Generate 4x4 logo grid
- [ ] Select logo and generate variation
- [ ] Upscale selected logo
- [ ] Edit logo with text prompt
- [ ] Download logo
- [ ] View library of past grids
- [ ] Subscribe via Stripe
- [ ] Verify token deduction
- [ ] Test token exhaustion

**Edge Cases:**
- [ ] Network failure during generation
- [ ] Concurrent operations on same logo
- [ ] Unsaved logo interactions
- [ ] Mobile responsive layout
- [ ] Slow AI response handling

## Security Considerations

### Authentication & Authorization

**Firebase Auth Rules:**
- All operations require authenticated user
- Users can only access their own data
- Admin operations require custom claims

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      match /logoGrids/{gridId} {
        allow read, write: if request.auth.uid == userId;
        
        match /logoVariations/{variationId} {
          allow read, write: if request.auth.uid == userId;
        }
      }
      
      match /tokens {
        allow read: if request.auth.uid == userId;
        allow write: if false; // Only server can write
      }
      
      match /stripeCustomer {
        allow read: if request.auth.uid == userId;
        allow write: if false; // Only server can write
      }
    }
  }
}
```

**Cloud Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

### API Security

**Server Actions:**
- All AI flows use `'use server'` directive
- API keys never exposed to client
- Input validation with Zod schemas

**Stripe Webhooks:**
- Verify webhook signatures
- Use environment-specific webhook secrets
- Idempotent event processing

**Rate Limiting:**
- Implement per-user rate limits on Cloud Functions
- Use Firestore transaction locks for token deduction
- Prevent concurrent duplicate operations

### Data Privacy

**PII Handling:**
- Store minimal user data (email, name, ID)
- No credit card data stored (handled by Stripe)
- User can delete account and all associated data

**Image Content:**
- User-generated content stored in user-scoped paths
- No public access to images without authentication
- Signed URLs for temporary access when needed

## Performance Optimization

### Frontend Optimizations

**Image Loading:**
- Next.js Image component with automatic optimization
- Lazy loading for off-screen images
- Responsive image sizes based on viewport

**State Management:**
- Optimistic UI updates (show temp results immediately)
- Background saves don't block user interaction
- Debounced search/filter operations

**Code Splitting:**
- Dynamic imports for heavy components
- Route-based code splitting (App Router default)
- Lazy load edit sidebar only when needed

### Backend Optimizations

**Firestore Queries:**
- Index on `creationDate` for sorted queries
- Limit query results (pagination)
- Use subcollections to avoid large document reads

**Cloud Functions:**
- Minimum instance configuration for cold starts
- Connection pooling for Firestore
- Caching of frequently accessed data

**AI Operations:**
- Batch operations where possible
- Stream responses for long-running operations
- Implement timeout handling (max 60s)

### Caching Strategy

**Client-Side:**
- React Query or SWR for data fetching
- Cache Firestore query results
- Service Worker for offline support (future)

**Server-Side:**
- CDN caching for static assets (Firebase Hosting)
- Firestore query result caching (short TTL)
- Cloud Storage public URLs with cache headers

## Scalability Considerations

### Horizontal Scaling

**Serverless Architecture:**
- Cloud Functions scale automatically with load
- No server management required
- Pay-per-use pricing model

**Database Scaling:**
- Firestore scales automatically
- Subcollection structure prevents document size limits
- Sharding strategy for high-volume users (future)

### Cost Management

**AI Usage:**
- Token system prevents runaway costs
- Free tier for user acquisition
- Paid tiers with usage limits

**Storage:**
- Lifecycle policies for old images (archive after 90 days)
- Compression for uploaded images
- Delete unused variations

**Firestore:**
- Minimize document reads with efficient queries
- Use non-blocking updates to reduce write costs
- Batch writes where possible

### Monitoring & Observability

**Metrics to Track:**
- AI operation success/failure rates
- Average generation time
- Token consumption per user
- Storage usage growth
- Error rates by operation type

**Tools:**
- Firebase Console for basic metrics
- Google Cloud Monitoring for detailed insights
- Sentry or similar for error tracking
- Custom logging in Cloud Functions

## Future Enhancements

### Phase 2 Features

1. **Public Gallery**: Share and explore community creations
2. **Brand Packs**: Export logos with color palettes and usage guidelines
3. **Vector Export**: SVG generation from raster logos
4. **Collaboration**: Share grids with team members
5. **Advanced Editing**: Layer-based editing interface
6. **Batch Operations**: Generate multiple grids in parallel
7. **API Access**: Programmatic access for developers
8. **White Label**: Custom branding for enterprise customers

### Technical Improvements

1. **Real-time Collaboration**: Firebase RTDB or WebRTC for live editing
2. **Progressive Web App**: Offline support and installability
3. **Advanced Caching**: Service Worker with background sync
4. **Model Chaining**: Multi-step AI workflows for complex edits
5. **A/B Testing**: Experiment framework for UX improvements
6. **Analytics**: User behavior tracking and funnel analysis
