# Trial State Management

This module provides utilities for managing trial user state with localStorage persistence and 24-hour expiration.

## Features

- ✅ localStorage persistence for trial grid data
- ✅ 24-hour expiration logic
- ✅ Trial state schema (grid, concept, assetType, etc.)
- ✅ React hook for easy state management
- ✅ Automatic cleanup of expired trials
- ✅ Onboarding and banner dismissal tracking

## Usage

### Basic Hook Usage

```tsx
import { useTrialState } from '@/lib/trial'

function MyComponent() {
  const {
    // State
    trialGrid,
    hasSeenOnboarding,
    dismissedBanner,
    isTrialActive,
    isExpired,
    timeRemaining,
    timeRemainingFormatted,
    
    // Actions
    saveTrialGrid,
    clearTrialGrid,
    markOnboardingSeen,
    markBannerDismissed,
    clearTrialState,
    refreshState,
  } = useTrialState()

  // Save a trial grid
  const handleGenerateGrid = async () => {
    const grid = {
      concept: 'A minimalist bunny logo',
      assetType: 'logo' as const,
      gridSize: '3x3' as const,
      tiles: [
        { id: '1', dataUrl: 'data:image/png;base64,...', tileIndex: 0 },
        // ... more tiles
      ],
      generatedAt: Date.now(),
    }
    
    saveTrialGrid(grid)
  }

  // Check if trial is active
  if (isTrialActive && !isExpired) {
    return (
      <div>
        <p>Trial active! Time remaining: {timeRemainingFormatted}</p>
        <button onClick={clearTrialGrid}>Clear Trial</button>
      </div>
    )
  }

  return <div>No active trial</div>
}
```

### Direct Storage Access

```tsx
import {
  loadTrialState,
  saveTrialGrid,
  clearTrialGrid,
  markOnboardingSeen,
  hasSeenOnboarding,
} from '@/lib/trial'

// Load state
const state = loadTrialState()

// Save a grid
saveTrialGrid({
  concept: 'A minimalist bunny logo',
  assetType: 'logo',
  gridSize: '3x3',
  tiles: [...],
  generatedAt: Date.now(),
})

// Check onboarding
if (!hasSeenOnboarding()) {
  // Show onboarding wizard
  markOnboardingSeen()
}

// Clear trial
clearTrialGrid()
```

### Type Utilities

```tsx
import {
  isTrialExpired,
  getTrialTimeRemaining,
  formatTrialTimeRemaining,
  TRIAL_EXPIRATION_MS,
} from '@/lib/trial'

const generatedAt = Date.now() - (12 * 60 * 60 * 1000) // 12 hours ago

// Check if expired
if (isTrialExpired(generatedAt)) {
  console.log('Trial has expired')
}

// Get time remaining in milliseconds
const remaining = getTrialTimeRemaining(generatedAt)
console.log(`${remaining}ms remaining`)

// Format as human-readable
const formatted = formatTrialTimeRemaining(generatedAt)
console.log(`Time remaining: ${formatted}`) // "12h 0m"
```

## Data Structure

### TrialState

```typescript
type TrialState = {
  trialGrid: TrialGrid | null
  hasSeenOnboarding: boolean
  dismissedBanner: boolean
}
```

### TrialGrid

```typescript
type TrialGrid = {
  concept: string
  assetType: 'logo' | 'custom' | 'sticker'
  gridSize: '3x3' | '4x4'
  tiles: TrialTile[]
  generatedAt: number // Unix timestamp
}
```

### TrialTile

```typescript
type TrialTile = {
  id: string
  dataUrl: string // Base64 encoded image
  tileIndex: number
}
```

## Expiration Logic

- Trial grids expire after 24 hours (86,400,000 milliseconds)
- Expired grids are automatically removed when loading state
- The `useTrialState` hook checks expiration every minute
- Time remaining is calculated and formatted for display

## localStorage Key

All trial state is stored under the key: `zapmark_trial_state`

## Rate Limiting

Trial generations are rate-limited by IP address to prevent abuse:

```typescript
import { checkRateLimit, recordTrialGeneration, clearRateLimit } from '@/lib/trial'

// Check if user can generate
const { allowed, reason } = await checkRateLimit()
if (!allowed) {
  console.log(reason) // "You've already used your free trial from this network..."
}

// Record a generation
await recordTrialGeneration()

// Clear rate limit (for testing)
clearRateLimit()
```

**Note:** The current implementation uses client-side IP detection which can be bypassed. In production, implement server-side rate limiting using:
- Server-side IP detection
- Database-backed rate limiting
- More sophisticated fingerprinting

## Requirements Satisfied

This implementation satisfies requirements:
- **5.8**: Store trial grid in browser localStorage for session persistence
- **5.9**: Restore trial grid from localStorage on page refresh with expiration handling
- **10.1**: Add rate limiting by IP address for trial generations
