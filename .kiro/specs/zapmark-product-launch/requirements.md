# Requirements Document

## Introduction

Zapmark AI is a complete SaaS platform for AI-powered logo and asset generation. The system provides a seamless journey from discovery to conversion, featuring a marketing site, trial experience, and full-featured application with subscription billing. This document outlines requirements for building a production-ready product that balances user acquisition (frictionless trial), conversion (clear value proposition), and retention (robust feature set).

## Glossary

- **System**: The complete Zapmark AI platform including marketing site and application
- **Visitor**: An unauthenticated person browsing the marketing site
- **Trial User**: An unauthenticated user generating their first free grid
- **Free User**: An authenticated user without an active subscription
- **Paid User**: An authenticated user with an active Creator plan subscription
- **Creator Plan**: Monthly subscription at €5 providing 100 credits
- **Credit**: Unit of currency for AI operations (grids cost 2-3, upscales cost 1)
- **Grid**: A 3x3 or 4x4 collection of logo variations generated from one concept
- **Asset Type**: Category of generation (Logo, Custom, Sticker)
- **Onboarding Wizard**: 3-step modal guiding trial users through first generation
- **Signup Gate**: Modal prompting trial users to create account for continued access
- **Marketing Site**: Public pages (landing, pricing, examples, legal)
- **App Surface**: Authenticated application at /app route

## Requirements

### Requirement 1: Marketing Site Landing Page

**User Story:** As a visitor, I want to understand what Zapmark AI does and try it immediately, so that I can evaluate the product before committing.

#### Acceptance Criteria

1. THE System SHALL display a hero section with headline and value proposition
2. THE System SHALL provide a primary CTA button labeled "Try a free grid"
3. WHEN a Visitor clicks "Try a free grid", THE System SHALL navigate to /app in trial mode
4. THE System SHALL display microcopy "No login required for your first grid" near the CTA
5. THE System SHALL provide secondary CTAs for "View pricing" and "Log in"
6. THE System SHALL display a "How it works" section with 3 steps: Concept, Grid, Pick and upscale
7. THE System SHALL include mini illustrations that echo the actual UI
8. THE System SHALL display an example gallery with 3-6 pre-generated grids
9. THE System SHALL label example images with "Made with Zapmark AI" style badges
10. THE System SHALL include a pricing teaser mentioning "Creator plan, 100 credits for €5/month"
11. THE System SHALL provide a footer with links to Pricing, FAQ, Terms, Privacy, and Contact

### Requirement 2: Pricing Page

**User Story:** As a visitor, I want to understand pricing and credit costs, so that I can make an informed purchase decision.

#### Acceptance Criteria

1. THE System SHALL display plan cards for Free Trial and Creator plans
2. THE System SHALL show "Studio, coming soon" as a future plan option
3. THE System SHALL explain that Free Trial includes 1 grid with no account required
4. THE System SHALL explain that Creator plan includes 100 credits for €5/month
5. THE System SHALL provide a credit cost breakdown: 3x3 grid = 2 credits, 4x4 grid = 3 credits, upscale = 1 credit
6. THE System SHALL include an FAQ section covering usage, licensing, and cancellation
7. THE System SHALL provide a CTA button on Creator plan linking to signup/subscription flow
8. WHERE a User is authenticated, THE System SHALL show "Upgrade" or "Current Plan" status

### Requirement 3: Examples Gallery Page

**User Story:** As a visitor, I want to see curated examples organized by use case, so that I can envision how Zapmark AI fits my needs.

#### Acceptance Criteria

1. THE System SHALL display curated grids organized by niche (e.g., "Dev tools logos", "Sticker style characters")
2. THE System SHALL provide 3-5 niche categories with 2-3 examples each
3. WHEN a Visitor clicks an example, THE System SHALL show a larger preview
4. THE System SHALL provide a "Try a similar grid" button that pre-fills the app with related concept
5. WHEN "Try a similar grid" is clicked, THE System SHALL navigate to /app with concept pre-populated

### Requirement 4: Trial Entry and Onboarding Wizard

**User Story:** As a trial user, I want guided onboarding that teaches me the interface, so that I can successfully generate my first grid.

#### Acceptance Criteria

1. WHEN a Visitor clicks "Try a free grid", THE System SHALL navigate to /app route
2. THE System SHALL display the main app layout (top bar, left sidebar, empty grid area)
3. THE System SHALL immediately show a centered onboarding modal over the empty grid
4. THE System SHALL display a 3-step wizard with step indicators (1, 2, 3)
5. WHEN on Step 1, THE System SHALL show title "What are you creating?" with options: Logo, Sticker, Custom
6. WHEN a Trial User selects an asset type, THE System SHALL pre-select the same option in the sidebar
7. WHEN on Step 2, THE System SHALL show title "Describe your concept" with text input
8. THE System SHALL provide placeholder text "A minimalist logo for a bunny code sniffer"
9. THE System SHALL display 3 suggestion chips that populate the concept field when clicked
10. WHEN a Trial User types in Step 2, THE System SHALL mirror the text into the sidebar "Your Concept" field
11. WHEN on Step 3, THE System SHALL show title "Choose grid size" with radio buttons for 3x3 and 4x4
12. THE System SHALL label 3x3 as "Recommended" and 4x4 as "Pro, coming soon" or "Costs more credits"
13. THE System SHALL display tip text "We generate one big canvas and slice it into tiles. 3x3 keeps more detail."
14. WHEN on Step 3, THE System SHALL show button text "Generate my free grid"
15. WHEN "Generate my free grid" is clicked, THE System SHALL close the wizard and start generation
16. THE System SHALL use the same icons and microcopy in wizard and sidebar for consistency

### Requirement 5: Trial Grid Generation and Display

**User Story:** As a trial user, I want to see my generated grid immediately with clear next steps, so that I understand the value and know how to continue.

#### Acceptance Criteria

1. WHEN the wizard closes, THE System SHALL show the sidebar filled with chosen values
2. THE System SHALL display progress states: "Generating your canvas" then "Cutting into tiles"
3. WHEN generation completes, THE System SHALL fade in the grid tiles
4. THE System SHALL display a banner above the grid: "This is your free trial grid. You can explore and zoom. To download or generate more, create a free account."
5. THE System SHALL allow Trial Users to click tiles to view large preview
6. THE System SHALL allow Trial Users to mark favorites locally (not persisted)
7. THE System SHALL show a lock icon and tooltip "Create a free account to continue" on Download, Upscale, and Generate new actions
8. THE System SHALL store the trial grid in browser localStorage for session persistence
9. WHERE a Trial User refreshes the page, THE System SHALL restore the trial grid from localStorage

### Requirement 6: Signup Gate and Conversion Flow

**User Story:** As a trial user, I want a clear path to create an account and continue using the product, so that I can access full features.

#### Acceptance Criteria

1. WHEN a Trial User clicks a locked action (Download, Upscale, Generate new), THE System SHALL display a signup gate modal
2. THE System SHALL show modal title "Keep this grid and get 100 credits"
3. THE System SHALL display text "Create a free account. You get 100 credits for €5/month, cancel anytime."
4. THE System SHALL provide buttons "Continue with Google" and "Continue with email"
5. THE System SHALL include links to Terms and Privacy at bottom of modal
6. WHEN signup completes, THE System SHALL create user account in Firestore
7. THE System SHALL initialize user with Creator plan (trial or immediate charge based on configuration)
8. THE System SHALL grant user 100 credits
9. THE System SHALL display toast "You now have 100 credits. 1 grid costs 2 credits, upscales cost 1 credit."
10. THE System SHALL immediately continue the action the user wanted (upscale, generate new, download)
11. THE System SHALL save the trial grid to the user's account in Firestore
12. THE System SHALL remove the trial banner and show credits indicator in header

### Requirement 7: App Header and Navigation

**User Story:** As a user, I want clear navigation and account status visibility, so that I can efficiently use the application.

#### Acceptance Criteria

1. THE System SHALL display a top bar with logo, navigation, credits, and avatar
2. THE System SHALL provide "New grid" button that clears current grid and resets form
3. THE System SHALL provide "My grids" button that navigates to /app/library
4. THE System SHALL display credits pill showing "Credits: 98" for authenticated users
5. WHEN credits are below 10, THE System SHALL change pill color to warning state
6. THE System SHALL display user avatar with dropdown menu
7. THE System SHALL include dropdown options: Account, Billing, Sign out
8. WHERE user is not authenticated, THE System SHALL show "Log in" button instead of avatar
9. THE System SHALL display trial ribbon "Trial mode • 1 free grid • No login" for trial users
10. THE System SHALL remove trial ribbon after signup and show credits instead

### Requirement 8: Main Generator Interface (Logged In State)

**User Story:** As a logged-in user, I want a streamlined generation interface with clear credit costs, so that I can create assets efficiently.

#### Acceptance Criteria

1. THE System SHALL display left sidebar with: Your Concept, Generation Type, Grid Size, Generate button
2. THE System SHALL provide Generation Type options: Logo, Custom, Sticker with icons
3. THE System SHALL provide Grid Size options: 3x3 (2 credits), 4x4 (3 credits) with cost labels
4. WHERE user has insufficient credits, THE System SHALL disable Generate button and show "Insufficient credits"
5. WHEN Generate is clicked, THE System SHALL display confirmation "This will cost 2 credits. You have 88 left."
6. THE System SHALL deduct credits immediately when generation starts
7. THE System SHALL refund credits if generation fails
8. THE System SHALL display right content panel with grid header and tiles
9. THE System SHALL show grid header with: prompt title, date, grid size, "Download all" button
10. THE System SHALL display empty state before first grid with helpful prompt suggestions
11. THE System SHALL display loading state with progress indicator during generation
12. THE System SHALL display grid loaded state with all tiles and hover interactions

### Requirement 9: My Grids Library

**User Story:** As a user, I want to view and manage all my past generations, so that I can revisit and continue working on previous projects.

#### Acceptance Criteria

1. THE System SHALL provide /app/library route accessible from header navigation
2. THE System SHALL display all user's logo grids ordered by creation date descending
3. THE System SHALL show each grid as a card with: thumbnail, title (concept), date, grid type badge, tile count
4. THE System SHALL provide "Open" button on each card that loads grid into main workspace
5. THE System SHALL provide filter options: All, Logo, Custom, Sticker
6. THE System SHALL implement pagination when user has more than 20 grids
7. WHERE user has no grids, THE System SHALL display empty state with "Generate your first grid" CTA
8. THE System SHALL allow bulk selection and deletion of grids (future enhancement marker)

### Requirement 10: Account and Billing Management

**User Story:** As a user, I want to manage my subscription and view usage, so that I can control my account and understand my spending.

#### Acceptance Criteria

1. THE System SHALL provide /app/account route accessible from user dropdown
2. THE System SHALL display current plan overview: plan name, renewal date, credits remaining
3. THE System SHALL show credit usage breakdown: grids generated, upscales performed, edits made
4. THE System SHALL provide "Change plan" button linking to Stripe customer portal
5. THE System SHALL provide "Buy credits" button for one-time credit purchases (200 for €10, 500 for €20)
6. THE System SHALL display billing history with past invoices
7. THE System SHALL show profile settings: name, email, logout button
8. THE System SHALL provide "Cancel subscription" option with confirmation dialog
9. WHEN subscription is cancelled, THE System SHALL update status and show expiration date
10. THE System SHALL allow users to reactivate cancelled subscriptions before expiration

### Requirement 11: Credit System and Enforcement

**User Story:** As a user, I want transparent credit costs and enforcement, so that I understand my usage and can plan accordingly.

#### Acceptance Criteria

1. THE System SHALL define credit costs: 3x3 grid = 2 credits, 4x4 grid = 3 credits, upscale = 1 credit, edit = 1 credit
2. THE System SHALL store credit costs in Firestore configuration for easy updates
3. WHEN any operation is initiated, THE System SHALL check user's credit balance
4. WHERE user has insufficient credits, THE System SHALL prevent operation and show upgrade modal
5. THE System SHALL deduct credits atomically using Firestore transactions
6. THE System SHALL update credits indicator in header immediately after deduction
7. WHEN credits reach 10 or below, THE System SHALL show warning bar "Only 8 credits left. View plans or buy a top-up pack."
8. THE System SHALL log all credit transactions with: userId, amount, operation, timestamp, balanceBefore, balanceAfter
9. THE System SHALL refund credits if AI operation fails with error
10. THE System SHALL prevent credit balance from going negative

### Requirement 12: Upgrade and Out of Credits Modal

**User Story:** As a user who exhausted credits, I want clear options to continue using the service, so that I can quickly resume my work.

#### Acceptance Criteria

1. WHEN user attempts operation with zero credits, THE System SHALL display upgrade modal
2. THE System SHALL show modal title "Out of credits"
3. THE System SHALL display text "You used all 100 credits included in your plan."
4. THE System SHALL provide option "Buy extra credits" with packages: 200 for €10, 500 for €20
5. THE System SHALL provide option "Upgrade to higher plan" (future plans)
6. WHEN user purchases credits, THE System SHALL process payment via Stripe
7. WHEN payment succeeds, THE System SHALL update credit balance immediately
8. THE System SHALL automatically resume the interrupted action after purchase
9. THE System SHALL display success toast "Credits added! Continuing your operation..."

### Requirement 13: Stripe Integration and Subscription Management

**User Story:** As a user, I want secure payment processing and subscription management, so that I can trust the platform with my payment information.

#### Acceptance Criteria

1. THE System SHALL integrate Stripe for all payment processing
2. THE System SHALL create Stripe customer on first subscription or credit purchase
3. THE System SHALL store Stripe customer ID in Firestore at /users/{userId}/stripeCustomer
4. WHEN user subscribes to Creator plan, THE System SHALL create Stripe subscription
5. THE System SHALL handle Stripe webhooks for: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
6. THE System SHALL verify webhook signatures for security
7. WHEN subscription payment succeeds, THE System SHALL grant 100 credits
8. WHEN subscription renews, THE System SHALL reset credits to 100 (not additive)
9. THE System SHALL implement Stripe customer portal for subscription management
10. THE System SHALL handle failed payments with grace period and email notifications

### Requirement 14: Legal Pages and Compliance

**User Story:** As a visitor or user, I want access to legal documents, so that I understand my rights and the platform's policies.

#### Acceptance Criteria

1. THE System SHALL provide /terms route with Terms of Service
2. THE System SHALL provide /privacy route with Privacy Policy
3. THE System SHALL include sections on: data collection, AI usage, content ownership, licensing
4. THE System SHALL state that users own generated content and have commercial usage rights
5. THE System SHALL link to legal pages from footer on all public pages
6. THE System SHALL link to legal pages from signup gate modal
7. THE System SHALL display last updated date on all legal documents
8. THE System SHALL comply with GDPR requirements for EU users

### Requirement 15: Responsive Design and Mobile Experience

**User Story:** As a user on any device, I want a fully functional experience, so that I can use Zapmark AI anywhere.

#### Acceptance Criteria

1. THE System SHALL render correctly on mobile devices (320px minimum width)
2. THE System SHALL adapt grid layout: 2 columns on mobile, 3-4 on desktop
3. THE System SHALL provide mobile-friendly navigation with hamburger menu
4. THE System SHALL ensure all tap targets are minimum 44px for touch
5. THE System SHALL optimize image loading for mobile bandwidth
6. THE System SHALL make onboarding wizard mobile-friendly with swipe gestures
7. THE System SHALL ensure forms work well with mobile keyboards
8. THE System SHALL test on iOS Safari, Android Chrome, and desktop browsers

### Requirement 16: Performance and Optimization

**User Story:** As a user, I want fast load times and responsive interactions, so that I can work efficiently without frustration.

#### Acceptance Criteria

1. THE System SHALL achieve Lighthouse performance score of 90+ on landing page
2. THE System SHALL implement code splitting for routes and heavy components
3. THE System SHALL lazy load images with blur placeholders
4. THE System SHALL use Next.js Image optimization for all images
5. THE System SHALL implement optimistic UI updates (show temp results immediately)
6. THE System SHALL perform background saves without blocking user interaction
7. THE System SHALL cache Firestore queries with appropriate TTL
8. THE System SHALL implement request deduplication for identical AI operations
9. THE System SHALL set AI operation timeout at 60 seconds with graceful handling
10. THE System SHALL minimize JavaScript bundle size (target: <200KB initial load)

### Requirement 17: Error Handling and Resilience

**User Story:** As a user, I want clear error messages and automatic recovery, so that temporary issues don't disrupt my workflow.

#### Acceptance Criteria

1. THE System SHALL display user-friendly error messages for all failure scenarios
2. THE System SHALL implement retry logic with exponential backoff for network errors
3. THE System SHALL refund credits automatically when AI operations fail
4. THE System SHALL log all errors to monitoring service with context
5. THE System SHALL implement React Error Boundaries for component failures
6. THE System SHALL provide fallback UI when components crash
7. THE System SHALL handle Stripe webhook failures with retry queue
8. THE System SHALL validate all user inputs before submission
9. THE System SHALL handle rate limiting from AI provider gracefully
10. THE System SHALL display maintenance mode page when system is down

### Requirement 18: Security and Data Protection

**User Story:** As a user, I want my data and generated content protected, so that I can trust the platform with my creative work.

#### Acceptance Criteria

1. THE System SHALL implement Firebase Authentication for all user access
2. THE System SHALL enforce Firestore security rules preventing cross-user data access
3. THE System SHALL enforce Cloud Storage rules restricting image access to owners
4. THE System SHALL never expose API keys or secrets to client
5. THE System SHALL use HTTPS for all connections
6. THE System SHALL implement CSRF protection on all forms
7. THE System SHALL sanitize all user inputs to prevent XSS attacks
8. THE System SHALL implement rate limiting on API endpoints
9. THE System SHALL encrypt sensitive data at rest in Firestore
10. THE System SHALL provide account deletion that removes all user data

### Requirement 19: Analytics and Monitoring

**User Story:** As a product owner, I want visibility into usage patterns and errors, so that I can improve the product and ensure reliability.

#### Acceptance Criteria

1. THE System SHALL integrate error tracking service (e.g., Sentry)
2. THE System SHALL track key events: signups, generations, subscriptions, cancellations
3. THE System SHALL monitor AI operation success/failure rates
4. THE System SHALL track average generation time and performance metrics
5. THE System SHALL monitor credit consumption patterns per user
6. THE System SHALL track conversion funnel: visitor → trial → signup → paid
7. THE System SHALL implement custom dashboards for business metrics
8. THE System SHALL alert on critical errors or service degradation
9. THE System SHALL respect user privacy and GDPR in analytics
10. THE System SHALL provide opt-out mechanism for analytics tracking

### Requirement 20: Content Moderation and Safety

**User Story:** As a platform operator, I want to prevent misuse and inappropriate content, so that the platform remains safe and compliant.

#### Acceptance Criteria

1. THE System SHALL implement content filtering on user prompts
2. THE System SHALL reject prompts containing prohibited terms or hate speech
3. THE System SHALL log flagged prompts for review
4. THE System SHALL implement rate limiting per user to prevent abuse
5. THE System SHALL provide reporting mechanism for inappropriate generated content
6. THE System SHALL implement manual review queue for flagged content
7. THE System SHALL allow administrators to ban users violating terms
8. THE System SHALL comply with AI safety guidelines from Google
9. THE System SHALL display content policy in Terms of Service
10. THE System SHALL implement automated scanning of generated images (future enhancement)

