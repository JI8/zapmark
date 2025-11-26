'use client'

/**
 * Trial State Hook
 * 
 * React hook for managing trial state with localStorage persistence.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  TrialState,
  TrialGrid,
  isTrialExpired,
  getTrialTimeRemaining,
  formatTrialTimeRemaining,
} from './types'
import {
  loadTrialState,
  saveTrialState,
  saveTrialGrid as saveTrialGridToStorage,
  clearTrialGrid as clearTrialGridFromStorage,
  markOnboardingSeen as markOnboardingSeenInStorage,
  markBannerDismissed as markBannerDismissedInStorage,
  markAccountCreated as markAccountCreatedInStorage,
  clearTrialState as clearTrialStateFromStorage,
} from './storage'

export type UseTrialStateReturn = {
  // State
  trialGrid: TrialGrid | null
  hasSeenOnboarding: boolean
  dismissedBanner: boolean
  hasCreatedAccount: boolean
  isTrialActive: boolean
  isExpired: boolean
  timeRemaining: number
  timeRemainingFormatted: string
  
  // Actions
  saveTrialGrid: (grid: TrialGrid) => void
  clearTrialGrid: () => void
  markOnboardingSeen: () => void
  markBannerDismissed: () => void
  markAccountCreated: () => void
  clearTrialState: () => void
  refreshState: () => void
}

/**
 * Hook for managing trial state
 */
export function useTrialState(): UseTrialStateReturn {
  const [state, setState] = useState<TrialState>({
    trialGrid: null,
    hasSeenOnboarding: false,
    dismissedBanner: false,
    hasCreatedAccount: false,
  })
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isClient, setIsClient] = useState(false)

  // Load state from localStorage only on client
  useEffect(() => {
    setIsClient(true)
    setState(loadTrialState())
  }, [])

  // Update time remaining every minute
  useEffect(() => {
    if (!state.trialGrid) {
      setTimeRemaining(0)
      return
    }

    const updateTimeRemaining = () => {
      const remaining = getTrialTimeRemaining(state.trialGrid!.generatedAt)
      setTimeRemaining(remaining)

      // If expired, clear the trial grid
      if (remaining === 0) {
        clearTrialGrid()
      }
    }

    // Update immediately
    updateTimeRemaining()

    // Update every minute
    const interval = setInterval(updateTimeRemaining, 60 * 1000)

    return () => clearInterval(interval)
  }, [state.trialGrid])

  // Refresh state from localStorage
  const refreshState = useCallback(() => {
    setState(loadTrialState())
  }, [])

  // Save trial grid
  const saveTrialGrid = useCallback((grid: TrialGrid) => {
    saveTrialGridToStorage(grid)
    setState((prev) => ({
      ...prev,
      trialGrid: grid,
    }))
  }, [])

  // Clear trial grid
  const clearTrialGrid = useCallback(() => {
    clearTrialGridFromStorage()
    setState((prev) => ({
      ...prev,
      trialGrid: null,
    }))
  }, [])

  // Mark onboarding as seen
  const markOnboardingSeen = useCallback(() => {
    markOnboardingSeenInStorage()
    setState((prev) => ({
      ...prev,
      hasSeenOnboarding: true,
    }))
  }, [])

  // Mark banner as dismissed
  const markBannerDismissed = useCallback(() => {
    markBannerDismissedInStorage()
    setState((prev) => ({
      ...prev,
      dismissedBanner: true,
    }))
  }, [])

  // Mark account as created
  const markAccountCreated = useCallback(() => {
    markAccountCreatedInStorage()
    setState((prev) => ({
      ...prev,
      hasCreatedAccount: true,
    }))
  }, [])

  // Clear all trial state (but preserve hasCreatedAccount)
  const clearTrialState = useCallback(() => {
    clearTrialStateFromStorage()
    setState((prev) => ({
      trialGrid: null,
      hasSeenOnboarding: false,
      dismissedBanner: false,
      hasCreatedAccount: prev.hasCreatedAccount, // Preserve this
    }))
  }, [])

  // Computed values
  const isTrialActive = state.trialGrid !== null
  const isExpired = state.trialGrid ? isTrialExpired(state.trialGrid.generatedAt) : false
  const timeRemainingFormatted = state.trialGrid
    ? formatTrialTimeRemaining(state.trialGrid.generatedAt)
    : ''

  return {
    // State
    trialGrid: state.trialGrid,
    hasSeenOnboarding: state.hasSeenOnboarding,
    dismissedBanner: state.dismissedBanner,
    hasCreatedAccount: state.hasCreatedAccount,
    isTrialActive,
    isExpired,
    timeRemaining,
    timeRemainingFormatted,
    
    // Actions
    saveTrialGrid,
    clearTrialGrid,
    markOnboardingSeen,
    markBannerDismissed,
    markAccountCreated,
    clearTrialState,
    refreshState,
  }
}
