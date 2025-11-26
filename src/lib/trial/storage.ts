/**
 * Trial State Storage Utility
 * 
 * Handles localStorage persistence for trial state with expiration logic.
 */

import { TrialState, TrialGrid, isTrialExpired } from './types'

const STORAGE_KEY = 'zapmark_trial_state'

/**
 * Default trial state
 */
const DEFAULT_TRIAL_STATE: TrialState = {
  trialGrid: null,
  hasSeenOnboarding: false,
  dismissedBanner: false,
  hasCreatedAccount: false,
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Load trial state from localStorage
 */
export function loadTrialState(): TrialState {
  if (!isLocalStorageAvailable()) {
    return DEFAULT_TRIAL_STATE
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return DEFAULT_TRIAL_STATE
    }

    const state: TrialState = JSON.parse(stored)

    // Check if trial grid has expired
    if (state.trialGrid && isTrialExpired(state.trialGrid.generatedAt)) {
      // Clear expired trial grid but keep other state
      return {
        ...state,
        trialGrid: null,
      }
    }

    return state
  } catch (error) {
    console.error('Failed to load trial state:', error)
    return DEFAULT_TRIAL_STATE
  }
}

/**
 * Save trial state to localStorage
 */
export function saveTrialState(state: TrialState): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save trial state:', error)
  }
}

/**
 * Save trial grid to localStorage
 */
export function saveTrialGrid(grid: TrialGrid): void {
  const currentState = loadTrialState()
  saveTrialState({
    ...currentState,
    trialGrid: grid,
  })
}

/**
 * Load trial grid from localStorage
 */
export function loadTrialGrid(): TrialGrid | null {
  const state = loadTrialState()
  return state.trialGrid
}

/**
 * Clear trial grid from localStorage
 */
export function clearTrialGrid(): void {
  const currentState = loadTrialState()
  saveTrialState({
    ...currentState,
    trialGrid: null,
  })
}

/**
 * Mark onboarding as seen
 */
export function markOnboardingSeen(): void {
  const currentState = loadTrialState()
  saveTrialState({
    ...currentState,
    hasSeenOnboarding: true,
  })
}

/**
 * Check if onboarding has been seen
 */
export function hasSeenOnboarding(): boolean {
  const state = loadTrialState()
  return state.hasSeenOnboarding
}

/**
 * Mark banner as dismissed
 */
export function markBannerDismissed(): void {
  const currentState = loadTrialState()
  saveTrialState({
    ...currentState,
    dismissedBanner: true,
  })
}

/**
 * Check if banner has been dismissed
 */
export function isBannerDismissed(): boolean {
  const state = loadTrialState()
  return state.dismissedBanner
}

/**
 * Clear all trial state (but keep hasCreatedAccount flag)
 */
export function clearTrialState(): void {
  const currentState = loadTrialState()
  saveTrialState({
    trialGrid: null,
    hasSeenOnboarding: false,
    dismissedBanner: false,
    hasCreatedAccount: currentState.hasCreatedAccount, // Preserve this
  })
}

/**
 * Mark that user has created an account
 */
export function markAccountCreated(): void {
  const currentState = loadTrialState()
  saveTrialState({
    ...currentState,
    hasCreatedAccount: true,
  })
}

/**
 * Check if user has created an account
 */
export function hasCreatedAccount(): boolean {
  const state = loadTrialState()
  return state.hasCreatedAccount
}

/**
 * Reset trial state to defaults (useful for testing)
 */
export function resetTrialState(): void {
  saveTrialState(DEFAULT_TRIAL_STATE)
}
