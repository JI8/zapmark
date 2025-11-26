/**
 * Admin Functions for Credit Configuration
 * 
 * These functions should only be called by administrators.
 * In production, protect these with proper authentication.
 */

import { doc, updateDoc, Firestore, serverTimestamp } from 'firebase/firestore'
import type { CreditCosts, PlanConfig, CreditPack } from './types'
import { clearConfigCache } from './config'

/**
 * Update credit costs
 * 
 * @param firestore Firestore instance
 * @param costs New credit costs
 */
export async function updateCreditCosts(
  firestore: Firestore,
  costs: Partial<CreditCosts>
): Promise<void> {
  const configRef = doc(firestore, 'config', 'credits')
  
  await updateDoc(configRef, {
    costs: costs,
    updatedAt: serverTimestamp(),
  })
  
  // Clear cache to force refetch
  clearConfigCache()
  
  console.log('Credit costs updated:', costs)
}

/**
 * Update plan configuration
 * 
 * @param firestore Firestore instance
 * @param planId Plan identifier (e.g., 'creator', 'studio')
 * @param plan New plan configuration
 */
export async function updatePlan(
  firestore: Firestore,
  planId: string,
  plan: Partial<PlanConfig>
): Promise<void> {
  const configRef = doc(firestore, 'config', 'credits')
  
  await updateDoc(configRef, {
    [`plans.${planId}`]: plan,
    updatedAt: serverTimestamp(),
  })
  
  clearConfigCache()
  
  console.log(`Plan ${planId} updated:`, plan)
}

/**
 * Add or update credit pack
 * 
 * @param firestore Firestore instance
 * @param packs New credit packs array
 */
export async function updateCreditPacks(
  firestore: Firestore,
  packs: CreditPack[]
): Promise<void> {
  const configRef = doc(firestore, 'config', 'credits')
  
  await updateDoc(configRef, {
    creditPacks: packs,
    updatedAt: serverTimestamp(),
  })
  
  clearConfigCache()
  
  console.log('Credit packs updated:', packs)
}

/**
 * Enable or disable trial mode
 * 
 * @param firestore Firestore instance
 * @param enabled Whether trial mode is enabled
 * @param maxGenerations Maximum number of trial generations
 */
export async function updateTrialConfig(
  firestore: Firestore,
  enabled: boolean,
  maxGenerations: number = 1
): Promise<void> {
  const configRef = doc(firestore, 'config', 'credits')
  
  await updateDoc(configRef, {
    trial: {
      enabled,
      maxGenerations,
    },
    updatedAt: serverTimestamp(),
  })
  
  clearConfigCache()
  
  console.log('Trial config updated:', { enabled, maxGenerations })
}
