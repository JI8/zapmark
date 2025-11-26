/**
 * Credit System
 * 
 * Centralized credit management system for Zapmark AI.
 * Exports types, configuration, and utilities.
 */

// Types
export type {
  CreditCosts,
  PlanConfig,
  CreditPack,
  TrialConfig,
  AppConfig,
  CreditOperation,
} from './types'

export {
  getCostForOperation,
  calculateTotalCost,
  formatCurrency,
  getPricePerCredit,
} from './types'

// Configuration
export {
  fetchCreditConfig,
  getDefaultConfig,
  clearConfigCache,
  getCachedConfig,
} from './config'

// Credit Manager
export {
  CreditManager,
  creditManager,
} from './credit-manager'

export type {
  CreditResult,
  CreditTransaction,
} from './credit-manager'

// Admin functions (use with caution)
export {
  updateCreditCosts,
  updatePlan,
  updateCreditPacks,
  updateTrialConfig,
} from './admin'
