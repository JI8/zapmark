# Requirements Document

## Introduction

Zapmark is an AI-powered logo exploration and creation platform that enables users to generate, refine, and manage logo variations using Google's Gemini AI. The system provides an intuitive grid-based interface for exploring creative concepts, with features for variation generation, upscaling, and feedback-driven editing. This document outlines the requirements for completing the Zapmark platform, focusing on token management, billing integration, user library features, and system scalability.

## Glossary

- **System**: The Zapmark web application
- **User**: An authenticated individual using the Zapmark platform
- **Logo Grid**: A 3x3 or 4x4 grid of logo variations generated from a single concept
- **Logo Variation**: An individual logo tile within a grid or a derived variation
- **Token**: A unit of credit consumed when performing AI operations
- **Free User**: A user without an active subscription
- **Paid User**: A user with an active Stripe subscription
- **Grid Generation**: The process of creating an initial logo grid from a text concept
- **Variation Generation**: Creating new logo versions based on an existing logo
- **Upscaling**: Enhancing a logo to production-quality resolution
- **Edit Operation**: Modifying a logo using text-based feedback
- **Monthly Allotment**: The number of tokens a user receives each billing cycle
- **Firestore**: Google Cloud Firestore database service
- **Cloud Storage**: Google Cloud Storage for image hosting
- **Stripe**: Third-party payment processing service

## Requirements

### Requirement 1: Token Management System

**User Story:** As a user, I want my token usage to be tracked and enforced, so that I understand my usage limits and the system operates fairly.

#### Acceptance Criteria

1. WHEN a User account is created, THE System SHALL initialize a token record with zero tokens used and zero monthly allotment
2. WHEN a Free User attempts a Grid Generation, THE System SHALL allow one free generation without token deduction
3. WHEN a Free User attempts a second Grid Generation, THE System SHALL reject the request with a message indicating subscription is required
4. WHEN a Paid User performs any AI operation, THE System SHALL deduct the appropriate token cost from their remaining balance
5. WHERE a User has insufficient tokens, THE System SHALL prevent the operation and display the remaining token count
6. THE System SHALL store token records in Firestore at path `/users/{userId}/tokens`
7. THE System SHALL use Firestore transactions to ensure atomic token deduction operations

### Requirement 2: Stripe Subscription Integration

**User Story:** As a user, I want to subscribe to a paid plan using Stripe, so that I can access unlimited logo generation capabilities.

#### Acceptance Criteria

1. THE System SHALL provide a subscription page accessible to authenticated Users
2. WHEN a User initiates a subscription, THE System SHALL redirect them to a Stripe Checkout session
3. WHEN a Stripe payment succeeds, THE System SHALL receive a webhook notification
4. WHEN the webhook is received, THE System SHALL update the User's subscription status in Firestore
5. THE System SHALL store Stripe customer IDs at path `/users/{userId}/stripeCustomer`
6. WHEN a subscription becomes active, THE System SHALL set the User's monthly token allotment to the plan's limit
7. THE System SHALL verify webhook signatures to ensure authenticity
8. WHERE a subscription is cancelled, THE System SHALL update the User's status to reflect the cancellation

### Requirement 3: Monthly Token Refresh

**User Story:** As a paid user, I want my tokens to refresh automatically each month, so that I can continue using the service without manual intervention.

#### Acceptance Criteria

1. THE System SHALL implement a scheduled Cloud Function that runs daily
2. WHEN the scheduled function executes, THE System SHALL identify all Paid Users whose billing cycle has renewed
3. WHEN a billing cycle renewal is detected, THE System SHALL reset the User's tokens used to zero
4. THE System SHALL update the last refill date to the current timestamp
5. THE System SHALL log all token refresh operations for audit purposes
6. WHERE a User's subscription has expired, THE System SHALL not refresh their tokens

### Requirement 4: User Library and Grid History

**User Story:** As a user, I want to view all my previously generated logo grids, so that I can revisit and work with past creations.

#### Acceptance Criteria

1. THE System SHALL provide a library view accessible from the main navigation
2. WHEN a User navigates to the library, THE System SHALL display all Logo Grids ordered by creation date descending
3. THE System SHALL display each Logo Grid with a thumbnail preview and concept text
4. WHEN a User clicks on a Logo Grid, THE System SHALL load that grid into the main workspace
5. THE System SHALL display the creation date for each Logo Grid
6. WHERE a User has no saved grids, THE System SHALL display an empty state message
7. THE System SHALL paginate results when a User has more than 20 Logo Grids

### Requirement 5: Logo Export and Download

**User Story:** As a user, I want to download individual logos in high quality, so that I can use them in my projects.

#### Acceptance Criteria

1. WHEN a User selects a Logo Variation, THE System SHALL display a download button
2. WHEN the download button is clicked, THE System SHALL initiate a file download
3. THE System SHALL provide the logo in PNG format with transparent background where applicable
4. THE System SHALL name downloaded files with a descriptive pattern including the logo ID
5. WHERE a logo has been upscaled, THE System SHALL download the highest resolution version available
6. THE System SHALL allow downloads without consuming additional tokens

### Requirement 6: Grid Size Selection

**User Story:** As a user, I want to choose between 3x3 and 4x4 grid sizes, so that I can control the number of variations generated.

#### Acceptance Criteria

1. THE System SHALL provide radio button options for 3x3 and 4x4 grid sizes
2. WHEN a User selects 3x3, THE System SHALL generate exactly 9 Logo Variations
3. WHEN a User selects 4x4, THE System SHALL generate exactly 16 Logo Variations
4. THE System SHALL default to 3x3 grid size
5. THE System SHALL store the selected grid size with each Logo Grid record
6. WHEN displaying a saved Logo Grid, THE System SHALL render it in the original grid size

### Requirement 7: Generation Type Options

**User Story:** As a user, I want to choose between logo, custom, and sticker generation types, so that I can create different styles of assets.

#### Acceptance Criteria

1. THE System SHALL provide three generation type options: logo, custom, and sticker
2. WHEN logo type is selected, THE System SHALL generate professional logo designs
3. WHEN custom type is selected, THE System SHALL generate general design variations
4. WHEN sticker type is selected, THE System SHALL generate designs with die-cut appearance and white borders
5. THE System SHALL use type-specific prompts for each generation type
6. THE System SHALL default to logo generation type

### Requirement 8: Real-time Grid Display

**User Story:** As a user, I want to see my generated grid immediately after creation, so that I can start exploring variations without delay.

#### Acceptance Criteria

1. WHEN Grid Generation completes, THE System SHALL display the grid tiles immediately
2. THE System SHALL show a loading indicator during generation
3. WHEN tiles are displayed, THE System SHALL mark them as unsaved with a visual indicator
4. THE System SHALL save the grid to Firestore in the background without blocking the UI
5. WHEN background save completes, THE System SHALL remove the unsaved indicator
6. WHERE background save fails, THE System SHALL display an error notification but retain the temporary grid

### Requirement 9: Logo Variation Generation

**User Story:** As a user, I want to generate new variations of a selected logo, so that I can explore different interpretations of a concept.

#### Acceptance Criteria

1. WHEN a User selects a Logo Variation, THE System SHALL open an edit sidebar
2. THE System SHALL provide a text input for variation prompts
3. WHEN a User submits a variation prompt, THE System SHALL generate a new Logo Variation
4. THE System SHALL add the new variation to the current Logo Grid
5. THE System SHALL upload the new variation to Cloud Storage
6. THE System SHALL create a Firestore record for the new variation
7. WHERE the selected logo is unsaved, THE System SHALL disable variation generation

### Requirement 10: Logo Upscaling

**User Story:** As a user, I want to upscale selected logos to high resolution, so that I can use them in production environments.

#### Acceptance Criteria

1. WHEN a User selects the upscale option, THE System SHALL process the logo through the AI upscaling flow
2. THE System SHALL generate an upscaled version at minimum 2048x2048 resolution
3. THE System SHALL add the upscaled version as a new Logo Variation to the grid
4. THE System SHALL maintain the original logo's visual characteristics
5. THE System SHALL display a loading indicator during upscaling
6. WHERE upscaling fails, THE System SHALL display an error message and retain the original logo

### Requirement 11: Feedback-Driven Editing

**User Story:** As a user, I want to edit logos using text descriptions, so that I can refine designs without manual editing tools.

#### Acceptance Criteria

1. WHEN a User selects a Logo Variation, THE System SHALL provide an edit text input
2. WHEN a User submits an edit prompt, THE System SHALL apply the changes using AI
3. THE System SHALL update the existing Logo Variation with the edited version
4. THE System SHALL upload the edited version to Cloud Storage
5. THE System SHALL update the Firestore record with the new image URL
6. THE System SHALL display the updated logo immediately in the grid
7. WHERE the edit operation fails, THE System SHALL retain the original logo and display an error

### Requirement 12: Authentication and Authorization

**User Story:** As a user, I want to sign in with Google, so that I can securely access my account and saved work.

#### Acceptance Criteria

1. THE System SHALL provide Google Sign-In authentication
2. WHEN a User signs in, THE System SHALL create or retrieve their User record in Firestore
3. THE System SHALL store User records at path `/users/{userId}`
4. THE System SHALL restrict all Logo Grid and variation operations to authenticated Users
5. WHERE a User is not authenticated, THE System SHALL display placeholder content
6. THE System SHALL allow unauthenticated Users to view the interface but not generate content
7. THE System SHALL implement Firestore security rules that enforce user-based access control

### Requirement 13: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when operations succeed or fail, so that I understand the system state.

#### Acceptance Criteria

1. WHEN any operation completes successfully, THE System SHALL display a success toast notification
2. WHEN any operation fails, THE System SHALL display an error toast with a descriptive message
3. THE System SHALL log all errors to the console for debugging
4. WHERE an AI operation fails, THE System SHALL include the error reason in the user notification
5. THE System SHALL display loading states for all asynchronous operations
6. THE System SHALL disable action buttons during operation execution to prevent duplicate requests

### Requirement 14: Image Storage and Retrieval

**User Story:** As a user, I want my generated logos to be stored reliably, so that I can access them across sessions.

#### Acceptance Criteria

1. THE System SHALL upload all generated images to Cloud Storage
2. THE System SHALL organize images in user-specific paths: `/users/{userId}/logos/{gridId}/{variationId}.png`
3. THE System SHALL store image URLs in Firestore for quick retrieval
4. WHEN a User loads their library, THE System SHALL retrieve images using stored URLs
5. THE System SHALL use signed URLs where security is required
6. THE System SHALL handle storage upload failures gracefully with retry logic

### Requirement 15: Responsive Design

**User Story:** As a user, I want the interface to work on different screen sizes, so that I can use Zapmark on any device.

#### Acceptance Criteria

1. THE System SHALL render correctly on mobile devices with screen widths down to 320px
2. THE System SHALL adapt the grid layout for smaller screens using responsive CSS
3. THE System SHALL provide a mobile-friendly navigation menu
4. THE System SHALL ensure all interactive elements are touch-friendly with minimum 44px tap targets
5. THE System SHALL maintain readability of text at all screen sizes
6. THE System SHALL optimize image loading for mobile bandwidth constraints
