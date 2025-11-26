/**
 * Trial State Types
 * 
 * Type definitions for the trial experience state management.
 */

export type AssetType = 'logo' | 'custom' | 'sticker'
export type GridSize = '2x2' | '3x3' | '4x4'

export type TrialTile = {
  id: string
  dataUrl: string
  tileIndex: number
}

export type TrialGrid = {
  concept: string
  assetType: AssetType
  gridSize: GridSize
  tiles: TrialTile[]
  generatedAt: number
}

export type TrialState = {
  trialGrid: TrialGrid | null
  hasSeenOnboarding: boolean
  dismissedBanner: boolean
  hasCreatedAccount: boolean
}

export const TRIAL_EXPIRATION_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Check if a trial grid has expired
 */
export function isTrialExpired(generatedAt: number): boolean {
  return Date.now() - generatedAt > TRIAL_EXPIRATION_MS
}

/**
 * Get time remaining until trial expires
 */
export function getTrialTimeRemaining(generatedAt: number): number {
  const remaining = TRIAL_EXPIRATION_MS - (Date.now() - generatedAt)
  return Math.max(0, remaining)
}

/**
 * Format time remaining as human-readable string
 */
export function formatTrialTimeRemaining(generatedAt: number): string {
  const remaining = getTrialTimeRemaining(generatedAt)
  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
