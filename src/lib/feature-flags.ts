/**
 * Feature Flags
 * 
 * Centralized feature flag configuration for gradual rollouts and A/B testing.
 * Update these flags to enable/disable features without code changes.
 */

export const FEATURES = {
  // Trial and onboarding
  TRIAL_MODE: true,
  ONBOARDING_WIZARD: true,
  
  // Billing and credits
  CREDIT_SYSTEM: true,
  CREDIT_PACKS: true,
  STRIPE_INTEGRATION: true,
  
  // Generation features
  VARIETY_GENERATION: true,
  UPSCALE: true,
  EDIT_WITH_PROMPT: true,
  
  // Future features (disabled by default)
  STUDIO_PLAN: false,
  BULK_OPERATIONS: false,
  API_ACCESS: false,
  TEAM_COLLABORATION: false,
  VECTOR_EXPORT: false,
  
  // Marketing and content
  EXAMPLES_PAGE: true,
  CONTENT_MODERATION: true,
} as const

export type FeatureFlag = keyof typeof FEATURES

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature]
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as FeatureFlag)
}
