'use client'

/**
 * Configuration Context
 * 
 * Provides credit configuration to all components.
 * Fetches configuration from Firestore on mount and caches it.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useFirestore } from '@/firebase'
import { fetchCreditConfig } from '@/lib/credits/config'
import type { AppConfig, CreditCosts, PlanConfig, CreditPack } from '@/lib/credits/types'

interface ConfigContextValue {
  config: AppConfig | null
  costs: CreditCosts | null
  plans: Record<string, PlanConfig> | null
  creditPacks: CreditPack[] | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore()
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchConfig = async () => {
    if (!firestore) return

    try {
      setIsLoading(true)
      setError(null)
      const fetchedConfig = await fetchCreditConfig(firestore)
      setConfig(fetchedConfig)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch configuration')
      setError(error)
      console.error('Error fetching configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [firestore])

  const value: ConfigContextValue = {
    config,
    costs: config?.costs || null,
    plans: config?.plans || null,
    creditPacks: config?.creditPacks || null,
    isLoading,
    error,
    refetch: fetchConfig,
  }

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  )
}

/**
 * Hook to access credit configuration
 */
export function useConfig() {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}

/**
 * Hook to access credit costs
 */
export function useCreditCosts() {
  const { costs, isLoading } = useConfig()
  return { costs, isLoading }
}

/**
 * Hook to access plan configuration
 */
export function usePlans() {
  const { plans, isLoading } = useConfig()
  return { plans, isLoading }
}

/**
 * Hook to access credit packs
 */
export function useCreditPacks() {
  const { creditPacks, isLoading } = useConfig()
  return { creditPacks, isLoading }
}
