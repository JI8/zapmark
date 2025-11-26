/**
 * Credit Configuration
 * 
 * Fetches and caches credit configuration from Firestore.
 * Configuration is stored at /config/credits and can be updated
 * without code changes.
 */

import { doc, getDoc, Firestore } from 'firebase/firestore'
import type { AppConfig } from './types'

// In-memory cache
let configCache: AppConfig | null = null
let lastFetchTime: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch credit configuration from Firestore
 */
export async function fetchCreditConfig(firestore: Firestore): Promise<AppConfig> {
  // Return cached config if still valid
  const now = Date.now()
  if (configCache && (now - lastFetchTime) < CACHE_TTL) {
    return configCache
  }

  try {
    const configRef = doc(firestore, 'config', 'credits')
    const configSnap = await getDoc(configRef)

    if (!configSnap.exists()) {
      throw new Error('Credit configuration not found. Run init-firestore-config.ts')
    }

    const data = configSnap.data()
    
    // Convert Firestore timestamp to Date
    const config: AppConfig = {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as AppConfig

    // Update cache
    configCache = config
    lastFetchTime = now

    return config
  } catch (error) {
    console.error('Failed to fetch credit configuration:', error)
    
    // Return default config as fallback
    return getDefaultConfig()
  }
}

/**
 * Get default configuration (fallback)
 */
export function getDefaultConfig(): AppConfig {
  return {
    costs: {
      grid3x3: 2,
      grid4x4: 3,
      upscale: 1,
      edit: 1,
      variation: 1,
      variety: 1,
    },
    plans: {
      creator: {
        monthlyCredits: 100,
        price: 5.00,
        currency: 'EUR',
        stripePriceId: '',
        enabled: true,
      },
    },
    creditPacks: [
      { credits: 200, price: 10.00, currency: 'EUR', stripePriceId: '' },
      { credits: 500, price: 20.00, currency: 'EUR', stripePriceId: '' },
    ],
    trial: {
      enabled: true,
      maxGenerations: 1,
    },
    updatedAt: new Date(),
  }
}

/**
 * Clear configuration cache (useful for testing)
 */
export function clearConfigCache(): void {
  configCache = null
  lastFetchTime = 0
}

/**
 * Get cached configuration (synchronous)
 * Returns null if not yet fetched
 */
export function getCachedConfig(): AppConfig | null {
  return configCache
}
