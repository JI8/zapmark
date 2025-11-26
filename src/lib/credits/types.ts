/**
 * Credit System Types
 * 
 * Type definitions for the credit-based billing system.
 */

export type CreditCosts = {
  grid3x3: number
  grid4x4: number
  upscale: number
  edit: number
  variation: number
  variety: number
}

export type PlanConfig = {
  monthlyCredits: number
  price: number
  currency: string
  stripePriceId: string
  enabled?: boolean
}

export type CreditPack = {
  credits: number
  price: number
  currency: string
  stripePriceId: string
}

export type TrialConfig = {
  enabled: boolean
  maxGenerations: number
}

export type AppConfig = {
  costs: CreditCosts
  plans: Record<string, PlanConfig>
  creditPacks: CreditPack[]
  trial: TrialConfig
  updatedAt: Date
}

export type CreditOperation = 
  | 'grid3x3'
  | 'grid4x4'
  | 'upscale'
  | 'edit'
  | 'variation'
  | 'variety'

/**
 * Get the cost for a specific operation
 */
export function getCostForOperation(
  costs: CreditCosts,
  operation: CreditOperation
): number {
  return costs[operation]
}

/**
 * Calculate total cost for multiple operations
 */
export function calculateTotalCost(
  costs: CreditCosts,
  operations: CreditOperation[]
): number {
  return operations.reduce((total, op) => total + costs[op], 0)
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Calculate price per credit
 */
export function getPricePerCredit(pack: CreditPack): number {
  return pack.price / pack.credits
}
