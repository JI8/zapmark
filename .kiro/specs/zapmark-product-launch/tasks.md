# Implementation Plan

## Phase 1: Foundation & Configuration

- [x] 1. Set up project configuration and environment
  - Create environment variables for Stripe, Firebase, Gemini AI
  - Set up feature flags system in `/src/lib/feature-flags.ts`
  - Create configuration document in Firestore at `/config/credits`
  - Configure Next.js for App Router and Server Actions
  - Set up TypeScript strict mode and path aliases
  - _Requirements: All_

- [x] 2. Implement credit cost configuration system
  - Create `/src/lib/credits/config.ts` for credit cost management
  - Implement function to fetch costs from Firestore config
  - Create React Context for credit configuration
  - Add hook `useCredits()` to access costs throughout app
  - Implement admin function to update costs in Firestore
  - _Requirements: 11.1, 11.2_

- [x] 3. Create robust credit management system
  - Implement `CreditManager` class in `/src/lib/credits/credit-manager.ts`
  - Create `checkAndDeduct()` method with Firestore transactions
  - Create `refund()` method for failed operations
  - Implement credit transaction logging
  - Add credit balance caching with React Query
  - Create `useCredits()` hook for components
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

## Phase 2: Marketing Site

- [x] 4. Build landing page
- [x] 4.1 Create hero section component
  - Design hero with headline, value proposition, and CTAs
  - Implement "Try a free grid" primary button
  - Add "View pricing" and "Log in" secondary buttons
  - Include microcopy "No login required for your first grid"
  - Make fully responsive for mobile and desktop
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4.2 Create "How it works" section
  - Design 3-step process: Concept, Grid, Pick and upscale
  - Create mini illustrations that echo actual UI
  - Add animations on scroll
  - _Requirements: 1.6, 1.7_

- [x] 4.3 Build example gallery section
  - Create grid preview cards with hover effects
  - Add "Made with Zapmark AI" badges
  - Implement responsive grid layout
  - Link examples to trial flow with pre-filled concepts
  - _Requirements: 1.8, 1.9_

- [x] 4.4 Create pricing teaser and footer
  - Add pricing teaser with Creator plan highlight
  - Build footer with navigation links
  - Include links to Pricing, FAQ, Terms, Privacy, Contact
  - _Requirements: 1.10, 1.11_


- [x] 5. Build pricing page
- [x] 5.1 Create plan comparison cards
  - Design Free Trial card with "1 grid, no account" details
  - Design Creator plan card with "100 credits for €5/month"
  - Add "Studio, coming soon" placeholder card
  - Implement responsive card layout
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5.2 Add credit cost breakdown section
  - Display costs: 3x3 grid = 2 credits, 4x4 = 3 credits, upscale = 1 credit
  - Create visual calculator or examples
  - Add tooltips for clarity
  - _Requirements: 2.5_

- [x] 5.3 Build FAQ section
  - Create accordion component for FAQs
  - Add questions about usage, licensing, cancellation
  - Include commercial usage rights information
  - _Requirements: 2.6_

- [x] 5.4 Add CTA buttons and authentication state
  - Show "Get Started" for unauthenticated users
  - Show "Upgrade" or "Current Plan" for authenticated users
  - Link to Stripe checkout or account page
  - _Requirements: 2.7, 2.8_



- [x] 7. Build legal pages
  - Create Terms of Service page at /terms
  - Create Privacy Policy page at /privacy
  - Include sections on data collection, AI usage, content ownership
  - State commercial usage rights for generated content
  - Add GDPR compliance sections
  - Display last updated date
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

## Phase 3: Trial Flow & Onboarding

- [x] 8. Implement trial state management
  - Create localStorage utility for trial persistence
  - Define trial state schema (grid, concept, assetType, etc.)
  - Implement save/load functions for trial grid
  - Add expiration logic (24 hours)
  - Create `useTrialState()` hook
  - _Requirements: 5.8, 5.9_

- [x] 9. Build onboarding wizard
- [x] 9.1 Create wizard modal component
  - Design 3-step modal with step indicators
  - Implement step navigation (back/next)
  - Add close button with confirmation
  - Make responsive for mobile
  - _Requirements: 4.3, 4.4_

- [x] 9.2 Implement Step 1: Asset type selection
  - Create radio buttons for Logo, Sticker, Custom
  - Add icons for each type
  - Sync selection with sidebar form
  - Add descriptions for each type
  - _Requirements: 4.5, 4.6, 4.16_

- [x] 9.3 Implement Step 2: Concept input
  - Create text input with placeholder
  - Add 3 suggestion chips that populate field
  - Sync input with sidebar form in real-time
  - Add character counter
  - _Requirements: 4.7, 4.8, 4.9, 4.10_

- [x] 9.4 Implement Step 3: Grid size selection
  - Create radio buttons for 3x3 and 4x4
  - Label 3x3 as "Recommended"
  - Label 4x4 as "Pro, coming soon" or show credit cost
  - Add tip text about canvas slicing
  - Change button text to "Generate my free grid"
  - _Requirements: 4.11, 4.12, 4.13, 4.14_

- [x] 9.5 Implement wizard completion flow
  - Close wizard on final button click
  - Populate sidebar with all selections
  - Trigger generation automatically
  - Save wizard completion to localStorage
  - _Requirements: 4.15_


- [x] 10. Build trial grid generation and display
- [x] 10.1 Implement trial generation flow
  - Create server action for trial generation (no auth required)
  - Add rate limiting by IP address
  - Generate grid using AI flow
  - Slice grid into tiles
  - Return data URLs for immediate display
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 10.2 Create trial banner component
  - Design banner with trial messaging
  - Add "Create account" CTA
  - Make dismissible with localStorage
  - Show above grid area
  - _Requirements: 5.4_

- [x] 10.3 Implement trial grid interactions
  - Allow clicking tiles for large preview
  - Implement local favorites (not persisted)
  - Add lock icons on restricted actions
  - Show tooltips "Create a free account to continue"
  - _Requirements: 5.5, 5.6, 5.7_

- [x] 10.4 Add trial state persistence
  - Save trial grid to localStorage on generation
  - Restore trial grid on page refresh
  - Handle expiration after 24 hours
  - Clear trial state after signup
  - _Requirements: 5.8, 5.9_

- [x] 11. Create signup gate modal
- [x] 11.1 Build modal component
  - Design centered modal with backdrop
  - Add title "Keep this grid and get 100 credits"
  - Include value proposition text
  - Add Terms and Privacy links
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 11.2 Implement Google OAuth signup
  - Add "Continue with Google" button
  - Integrate Firebase Auth Google provider
  - Handle authentication flow
  - Show loading state during auth
  - _Requirements: 6.4_

- [x] 11.3 Implement email/password signup
  - Add "Continue with email" button
  - Create email/password form
  - Implement Firebase Auth email signup
  - Add email verification flow
  - _Requirements: 6.4_

- [x] 11.4 Handle post-signup flow
  - Create user document in Firestore
  - Initialize with Creator plan (trial or paid)
  - Grant 100 credits
  - Save trial grid to user account
  - Display success toast
  - _Requirements: 6.6, 6.7, 6.8, 6.9_

- [x] 11.5 Implement action resumption
  - Store intended action before showing modal
  - Resume action after successful signup
  - Handle download, upscale, generate new, edit
  - Show progress indicator during resumption
  - _Requirements: 6.10_

- [x] 11.6 Update UI after signup
  - Remove trial banner
  - Show credits indicator in header
  - Enable all locked actions
  - Update grid to saved state
  - _Requirements: 6.11, 6.12_

## Phase 4: App Header & Navigation

- [ ] 12. Build app header component
- [ ] 12.1 Create header layout
  - Design top bar with logo, navigation, and user section
  - Make sticky on scroll
  - Implement responsive mobile menu
  - _Requirements: 7.1_

- [ ] 12.2 Add navigation buttons
  - Create "New grid" button that clears form and grid
  - Create "My grids" button linking to /app/library
  - Add active state indicators
  - _Requirements: 7.2, 7.3_

- [ ] 12.3 Implement credits indicator
  - Create credits pill component
  - Fetch credits from Firestore in real-time
  - Display "Credits: 98" format
  - Add warning color when below 10
  - Update immediately after operations
  - _Requirements: 7.4, 7.5_

- [ ] 12.4 Build user menu dropdown
  - Add user avatar with photo or initials
  - Create dropdown with Account, Billing, Sign out
  - Handle sign out with confirmation
  - Show loading states
  - _Requirements: 7.6, 7.7_

- [ ] 12.5 Handle unauthenticated state
  - Show "Log in" button instead of avatar
  - Link to signup/login modal
  - Preserve intended destination after login
  - _Requirements: 7.8_

- [ ] 12.6 Implement trial ribbon
  - Create ribbon component for trial mode
  - Display "Trial mode • 1 free grid • No login"
  - Position above main content
  - Remove after signup
  - _Requirements: 7.9, 7.10_


## Phase 5: Main Generator Interface

- [ ] 13. Build generator sidebar
- [ ] 13.1 Create sidebar form component
  - Design left sidebar with form sections
  - Implement Your Concept text input
  - Add Generation Type selector (Logo, Custom, Sticker)
  - Add Grid Size selector with credit costs
  - Create Generate button
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 13.2 Implement credit cost display
  - Show credit cost next to grid size options
  - Display "This will cost 2 credits" on hover
  - Update costs dynamically from config
  - _Requirements: 8.3_

- [ ] 13.3 Add credit enforcement
  - Check credit balance before enabling Generate
  - Disable button if insufficient credits
  - Show "Insufficient credits" message
  - Link to upgrade modal
  - _Requirements: 8.4_

- [ ] 13.4 Implement generation confirmation
  - Show confirmation dialog before generation
  - Display "This will cost 2 credits. You have 88 left."
  - Add Cancel and Confirm buttons
  - Proceed with generation on confirm
  - _Requirements: 8.5_

- [ ] 13.5 Handle credit deduction
  - Deduct credits immediately when generation starts
  - Update credits indicator in header
  - Log transaction to Firestore
  - Refund if generation fails
  - _Requirements: 8.6, 8.7_

- [ ] 14. Build grid display component
- [ ] 14.1 Create grid header
  - Display prompt title (concept)
  - Show creation date
  - Display grid size badge
  - Add "Download all" button
  - _Requirements: 8.8, 8.9_

- [ ] 14.2 Implement empty state
  - Design empty state before first generation
  - Add helpful prompt suggestions
  - Show example concepts
  - Make visually appealing
  - _Requirements: 8.10_

- [ ] 14.3 Create loading state
  - Design progress indicator
  - Show "Generating canvas" then "Cutting into tiles"
  - Add animated spinner or progress bar
  - Display estimated time
  - _Requirements: 8.11_

- [ ] 14.4 Build grid loaded state
  - Display tiles in responsive grid
  - Implement hover overlays with actions
  - Add tile selection for preview
  - Show action buttons (download, upscale, variations, variety, edit)
  - _Requirements: 8.12_

- [ ] 15. Enhance existing grid interactions
  - Update hover overlay with all 5 action buttons
  - Ensure download, variations, variety, upscale, edit all work
  - Add loading states for each action
  - Implement error handling with refunds
  - Update credits after each operation
  - _Requirements: 8.12_

## Phase 6: Library & History

- [ ] 16. Build library page
- [ ] 16.1 Create library layout
  - Design /app/library route
  - Create grid card layout
  - Implement responsive columns
  - Add page header with title and filters
  - _Requirements: 9.1, 9.2_

- [ ] 16.2 Implement grid cards
  - Display thumbnail (first tile of grid)
  - Show title (concept text)
  - Display creation date
  - Add grid type badge (Logo, Custom, Sticker)
  - Show tile count
  - Add "Open" button
  - _Requirements: 9.3_

- [ ] 16.3 Add filtering and sorting
  - Create filter buttons: All, Logo, Custom, Sticker
  - Implement sort by date (newest first)
  - Add search by concept text
  - _Requirements: 9.5_

- [ ] 16.4 Implement grid opening
  - Handle "Open" button click
  - Navigate to /app with grid loaded
  - Populate sidebar with grid settings
  - Display all tiles
  - _Requirements: 9.4_

- [ ] 16.5 Add pagination
  - Implement cursor-based pagination
  - Show 20 grids per page
  - Add next/previous buttons
  - Display page numbers
  - _Requirements: 9.6_

- [ ] 16.6 Create empty state
  - Design empty state for no grids
  - Add "Generate your first grid" CTA
  - Show helpful onboarding message
  - _Requirements: 9.7_

- [ ] 16.7 Add bulk operations (optional)
  - Implement multi-select checkboxes
  - Add "Delete selected" button
  - Show confirmation dialog
  - Update UI after deletion
  - _Requirements: 9.8_


## Phase 7: Account & Billing

- [ ] 17. Build account page
- [ ] 17.1 Create account layout
  - Design /app/account route
  - Create sections for plan, usage, billing, profile
  - Implement responsive layout
  - _Requirements: 10.1_

- [ ] 17.2 Implement plan overview section
  - Display current plan name (Free, Creator, Studio)
  - Show renewal date
  - Display credits remaining with progress bar
  - Add visual indicators for plan status
  - _Requirements: 10.2_

- [ ] 17.3 Create credit usage breakdown
  - Show total grids generated
  - Display upscales performed
  - Show edits made
  - Calculate total credits used
  - Add charts or visualizations
  - _Requirements: 10.3_

- [ ] 17.4 Add subscription management
  - Create "Change plan" button
  - Integrate Stripe customer portal
  - Generate portal session and redirect
  - Handle return from portal
  - _Requirements: 10.4_

- [ ] 17.5 Implement credit purchase
  - Add "Buy credits" button
  - Display credit pack options (200 for €10, 500 for €20)
  - Create Stripe checkout for one-time purchase
  - Handle successful purchase
  - Update credits immediately
  - _Requirements: 10.5_

- [ ] 17.6 Build billing history section
  - Fetch invoices from Stripe
  - Display invoice list with date, amount, status
  - Add download PDF links
  - Show payment method
  - _Requirements: 10.6_

- [ ] 17.7 Create profile settings
  - Display user name and email
  - Add edit profile form
  - Implement password change (for email users)
  - Add logout button
  - _Requirements: 10.7_

- [ ] 17.8 Implement subscription cancellation
  - Add "Cancel subscription" button
  - Show confirmation dialog with consequences
  - Process cancellation via Stripe
  - Update UI to show expiration date
  - Allow reactivation before expiration
  - _Requirements: 10.8, 10.9, 10.10_

## Phase 8: Stripe Integration

- [ ] 18. Set up Stripe configuration
  - Create Stripe account and get API keys
  - Set up products and prices in Stripe dashboard
  - Configure webhook endpoint URL
  - Add Stripe keys to environment variables
  - Install Stripe SDK
  - _Requirements: 13.1, 13.2_

- [ ] 19. Implement subscription checkout
- [ ] 19.1 Create checkout session endpoint
  - Build server action to create Stripe checkout session
  - Set success and cancel URLs
  - Include customer email and metadata
  - Return session URL
  - _Requirements: 13.4_

- [ ] 19.2 Handle checkout redirect
  - Redirect user to Stripe checkout
  - Show loading state during redirect
  - Handle success return to /app/account
  - Handle cancel return to /pricing
  - _Requirements: 13.4_

- [ ] 19.3 Implement one-time credit purchase
  - Create checkout session for credit packs
  - Set mode to 'payment' instead of 'subscription'
  - Include credit amount in metadata
  - Handle successful purchase
  - _Requirements: 12.5_

- [ ] 20. Build Stripe webhook handler
- [ ] 20.1 Create webhook endpoint
  - Set up POST route at /api/webhooks/stripe
  - Verify webhook signature
  - Parse webhook event
  - Route to appropriate handler
  - Return 200 response
  - _Requirements: 13.5, 13.6_

- [ ] 20.2 Handle checkout.session.completed
  - Extract customer and subscription IDs
  - Create or update user in Firestore
  - Store Stripe customer ID
  - Grant initial credits (100 for Creator plan)
  - Send welcome email
  - _Requirements: 13.3, 13.7_

- [ ] 20.3 Handle customer.subscription.updated
  - Update subscription status in Firestore
  - Handle plan changes
  - Update credit allotment if plan changed
  - _Requirements: 13.5_

- [ ] 20.4 Handle customer.subscription.deleted
  - Update subscription status to canceled
  - Set expiration date
  - Send cancellation confirmation email
  - _Requirements: 13.5_

- [ ] 20.5 Handle invoice.payment_succeeded
  - Grant monthly credits on renewal
  - Reset credit balance to plan allotment
  - Log transaction
  - Send receipt email
  - _Requirements: 13.8_

- [ ] 20.6 Handle invoice.payment_failed
  - Update subscription status to past_due
  - Send payment failure email
  - Implement grace period logic
  - Restrict access after grace period
  - _Requirements: 13.10_

- [ ] 21. Implement Stripe customer portal
  - Generate customer portal session
  - Redirect to Stripe portal
  - Handle return URL
  - Sync changes via webhooks
  - _Requirements: 13.9_


## Phase 9: Upgrade & Out of Credits Flow

- [ ] 22. Build upgrade modal
- [ ] 22.1 Create modal component
  - Design centered modal with backdrop
  - Add title "Out of credits"
  - Display current usage message
  - Make responsive for mobile
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 22.2 Add credit pack options
  - Display credit pack cards (200 for €10, 500 for €20)
  - Show price per credit calculation
  - Add "Buy now" buttons
  - Highlight best value option
  - _Requirements: 12.4_

- [ ] 22.3 Add upgrade to higher plan option
  - Show "Upgrade to higher plan" section
  - Display future plans (Studio) as coming soon
  - Link to pricing page
  - _Requirements: 12.5_

- [ ] 22.4 Implement purchase flow
  - Handle credit pack purchase button click
  - Create Stripe checkout session
  - Redirect to Stripe
  - Handle successful payment
  - _Requirements: 12.6_

- [ ] 22.5 Handle post-purchase flow
  - Update credit balance immediately
  - Close upgrade modal
  - Resume interrupted action automatically
  - Display success toast
  - _Requirements: 12.7, 12.8, 12.9_

- [ ] 23. Implement low credits warning
  - Check credit balance after each operation
  - Show warning bar when credits <= 10
  - Display "Only 8 credits left. View plans or buy a top-up pack."
  - Add CTA buttons to warning bar
  - Make dismissible but reappear on next operation
  - _Requirements: 8.7_

## Phase 10: Security & Compliance

- [ ] 24. Implement Firestore security rules
- [ ] 24.1 Write user data rules
  - Restrict user document access to owner
  - Allow read/write for own logoGrids
  - Allow read/write for own logoVariations
  - Prevent cross-user data access
  - _Requirements: 18.2_

- [ ] 24.2 Write credit transaction rules
  - Allow users to read own transactions
  - Prevent client-side writes (server only)
  - Ensure transaction immutability
  - _Requirements: 18.2_

- [ ] 24.3 Write configuration rules
  - Allow all users to read config
  - Prevent client-side writes (admin only)
  - _Requirements: 18.2_

- [ ] 24.4 Deploy and test security rules
  - Deploy rules to Firebase
  - Test with Firebase Emulator
  - Verify unauthorized access blocked
  - Test all CRUD operations
  - _Requirements: 18.2_

- [ ] 25. Implement Cloud Storage security rules
  - Restrict image access to owner
  - Allow users to upload to own directory
  - Set file size limits (10MB max)
  - Restrict to image MIME types
  - Deploy and test rules
  - _Requirements: 18.3_

- [ ] 26. Add input validation and sanitization
  - Validate all form inputs with Zod
  - Sanitize user prompts before AI calls
  - Implement XSS protection
  - Add CSRF tokens to forms
  - Validate file uploads
  - _Requirements: 18.6, 18.7_

- [ ] 27. Implement rate limiting
  - Add rate limiting to trial generation (1 per IP per day)
  - Limit authenticated users to 100 operations per hour
  - Implement exponential backoff for retries
  - Add rate limit headers to responses
  - _Requirements: 18.8, 20.4_

- [ ] 28. Add content moderation
  - Create prohibited terms list
  - Implement prompt filtering before AI calls
  - Reject prompts with hate speech or inappropriate content
  - Log flagged prompts for review
  - Display content policy in Terms
  - _Requirements: 20.1, 20.2, 20.3, 20.9_

## Phase 11: Performance & Optimization

- [ ] 29. Implement frontend optimizations
- [ ] 29.1 Add code splitting
  - Dynamic import for OnboardingWizard
  - Dynamic import for EditSidebar
  - Dynamic import for heavy modals
  - Lazy load library page components
  - _Requirements: 16.2_

- [ ] 29.2 Optimize images
  - Use Next.js Image component everywhere
  - Add blur placeholders for all images
  - Implement lazy loading
  - Generate responsive image sizes
  - Compress images before upload
  - _Requirements: 16.3, 16.4_

- [ ] 29.3 Implement caching strategy
  - Set up React Query for data fetching
  - Cache Firestore queries with appropriate TTL
  - Implement request deduplication
  - Add service worker for offline support (optional)
  - _Requirements: 16.7, 16.8_

- [ ] 29.4 Optimize bundle size
  - Analyze bundle with webpack-bundle-analyzer
  - Remove unused dependencies
  - Tree-shake libraries
  - Target <200KB initial load
  - _Requirements: 16.10_

- [ ] 30. Implement backend optimizations
- [ ] 30.1 Add Firestore indexing
  - Create composite index: userId ASC, creationDate DESC
  - Create index: userId ASC, assetType ASC, creationDate DESC
  - Deploy indexes to Firebase
  - _Requirements: 16.7_

- [ ] 30.2 Optimize Cloud Functions
  - Set minimum instances to reduce cold starts
  - Configure appropriate memory limits
  - Set timeout to 60 seconds
  - Implement connection pooling
  - _Requirements: 16.9_

- [ ] 30.3 Implement AI operation timeout
  - Set 60 second timeout for all AI calls
  - Handle timeout gracefully
  - Refund credits on timeout
  - Display user-friendly error message
  - _Requirements: 16.9_


## Phase 12: Error Handling & Resilience

- [ ] 31. Implement comprehensive error handling
- [ ] 31.1 Create error boundary components
  - Add React Error Boundary for app routes
  - Create fallback UI for component crashes
  - Log errors to monitoring service
  - Provide recovery actions
  - _Requirements: 17.5, 17.6_

- [ ] 31.2 Add user-friendly error messages
  - Create error message mapping for common failures
  - Display clear, actionable error messages
  - Avoid technical jargon in user-facing errors
  - Include support contact for critical errors
  - _Requirements: 17.1_

- [ ] 31.3 Implement retry logic
  - Add exponential backoff for network errors
  - Retry failed Firestore operations
  - Retry failed Storage uploads
  - Limit retries to 3 attempts
  - _Requirements: 17.2_

- [ ] 31.4 Add automatic credit refunds
  - Refund credits when AI operations fail
  - Refund on timeout errors
  - Refund on server errors
  - Log all refunds for audit
  - Display refund notification to user
  - _Requirements: 17.3_

- [ ] 31.5 Handle Stripe webhook failures
  - Implement retry queue for failed webhooks
  - Log webhook failures
  - Alert on repeated failures
  - Provide manual reconciliation tools
  - _Requirements: 17.7_

- [ ] 31.6 Add maintenance mode
  - Create maintenance page component
  - Implement feature flag for maintenance mode
  - Display estimated downtime
  - Provide status page link
  - _Requirements: 17.10_

## Phase 13: Monitoring & Analytics

- [ ] 32. Set up error tracking
  - Integrate Sentry for error monitoring
  - Configure error sampling and filtering
  - Add custom error context (userId, operation)
  - Set up error alerts
  - Create error dashboard
  - _Requirements: 19.1_

- [ ] 33. Implement event tracking
- [ ] 33.1 Track key user events
  - Track signups (Google, email)
  - Track trial generations
  - Track authenticated generations
  - Track subscriptions and cancellations
  - Track credit purchases
  - _Requirements: 19.2_

- [ ] 33.2 Track technical metrics
  - Monitor AI operation success/failure rates
  - Track average generation time
  - Monitor credit consumption patterns
  - Track storage usage
  - _Requirements: 19.3, 19.4, 19.5_

- [ ] 33.3 Implement conversion funnel tracking
  - Track visitor → trial conversion
  - Track trial → signup conversion
  - Track signup → paid conversion
  - Calculate conversion rates
  - _Requirements: 19.6_

- [ ] 33.4 Create analytics dashboard
  - Build custom dashboard for business metrics
  - Display key metrics (MRR, churn, conversions)
  - Add charts and visualizations
  - Implement date range filtering
  - _Requirements: 19.7_

- [ ] 34. Set up alerting
  - Configure alerts for error rate > 5%
  - Alert on AI operation failure rate > 10%
  - Alert on Stripe webhook failures
  - Alert on negative credit balances
  - Alert on storage usage > 80%
  - _Requirements: 19.8_

- [ ] 35. Implement privacy-compliant analytics
  - Respect user privacy preferences
  - Implement GDPR-compliant tracking
  - Provide opt-out mechanism
  - Anonymize IP addresses
  - Document data collection in Privacy Policy
  - _Requirements: 19.9, 19.10_

## Phase 14: Responsive Design & Mobile

- [ ] 36. Implement responsive layouts
- [ ] 36.1 Optimize landing page for mobile
  - Test on 320px minimum width
  - Adjust hero section for mobile
  - Stack CTAs vertically on small screens
  - Optimize images for mobile bandwidth
  - _Requirements: 15.1, 15.5_

- [ ] 36.2 Make onboarding wizard mobile-friendly
  - Ensure wizard fits on mobile screens
  - Add swipe gestures for step navigation
  - Optimize button sizes for touch
  - Test on iOS and Android
  - _Requirements: 15.6_

- [ ] 36.3 Optimize generator interface for mobile
  - Adapt grid to 2 columns on mobile
  - Make sidebar collapsible on mobile
  - Ensure forms work with mobile keyboards
  - Optimize touch targets (44px minimum)
  - _Requirements: 15.2, 15.4, 15.7_

- [ ] 36.4 Create mobile navigation
  - Implement hamburger menu
  - Add slide-out navigation drawer
  - Ensure all links accessible on mobile
  - Test navigation flow
  - _Requirements: 15.3_

- [ ] 36.5 Test across devices and browsers
  - Test on iOS Safari
  - Test on Android Chrome
  - Test on desktop Chrome, Firefox, Safari
  - Fix any browser-specific issues
  - Verify touch interactions work correctly
  - _Requirements: 15.8_

## Phase 15: Testing & Quality Assurance

- [ ] 37. Write unit tests
  - Test credit calculation functions
  - Test prompt generation logic
  - Test image slicing utility
  - Test validation schemas
  - Achieve 80%+ code coverage for utilities
  - _Requirements: All_

- [ ] 38. Write integration tests
  - Test AI flow execution
  - Test credit deduction with transactions
  - Test Stripe webhook handling
  - Test Firestore security rules
  - _Requirements: All_

- [ ] 39. Write E2E tests
- [ ] 39.1 Test trial flow
  - Test landing → onboarding → generation
  - Test signup gate appearance
  - Test signup completion
  - Test action resumption after signup
  - _Requirements: 4.*, 5.*, 6.*_

- [ ] 39.2 Test authenticated flow
  - Test login → generate → library
  - Test credit deduction
  - Test all grid operations
  - Test account management
  - _Requirements: 7.*, 8.*, 9.*, 10.*_

- [ ] 39.3 Test payment flow
  - Test subscription checkout
  - Test credit pack purchase
  - Test subscription cancellation
  - Verify webhook processing
  - _Requirements: 13.*, 18.*_

- [ ] 40. Perform manual testing
  - Complete full user journey from landing to paid
  - Test all error scenarios
  - Verify mobile responsiveness
  - Test across browsers
  - Verify accessibility compliance
  - _Requirements: All_

## Phase 16: Deployment & Launch

- [ ] 41. Set up production environment
  - Configure production Firebase project
  - Set up production Stripe account
  - Configure production environment variables
  - Set up custom domain (zapmark.ai, app.zapmark.ai)
  - Configure SSL certificates
  - _Requirements: All_

- [ ] 42. Deploy to production
  - Deploy Next.js app to Vercel
  - Deploy Firestore security rules
  - Deploy Cloud Storage rules
  - Deploy Cloud Functions
  - Configure Stripe webhooks for production
  - _Requirements: All_

- [ ] 43. Set up monitoring and alerts
  - Configure Sentry for production
  - Set up uptime monitoring
  - Configure alert notifications
  - Create status page
  - _Requirements: 19.*_

- [ ] 44. Perform pre-launch checklist
  - Verify all features work in production
  - Test payment processing with real cards
  - Verify email notifications work
  - Check legal pages are accessible
  - Verify analytics tracking
  - Test mobile experience
  - _Requirements: All_

- [ ] 45. Launch and monitor
  - Announce launch
  - Monitor error rates closely
  - Watch for performance issues
  - Respond to user feedback
  - Iterate based on data
  - _Requirements: All_

## Notes

- Tasks marked with * are optional enhancements that can be deferred
- Each task should be completed and tested before moving to the next
- Use feature flags to gradually roll out new features
- Maintain backward compatibility when updating existing features
- Document all configuration changes and deployment steps

