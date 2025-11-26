/**
 * Trial Rate Limiting
 * 
 * Simple IP-based rate limiting for trial generations.
 * In production, this should be implemented server-side.
 */

const RATE_LIMIT_KEY = 'zapmark_trial_ip_limit'
const RATE_LIMIT_DURATION = 24 * 60 * 60 * 1000 // 24 hours

type RateLimitRecord = {
  ip: string
  timestamp: number
  count: number
}

/**
 * Get client IP address (client-side approximation)
 * Note: This is not secure and can be bypassed. 
 * In production, implement server-side rate limiting.
 */
async function getClientIP(): Promise<string> {
  try {
    // Use a public IP service
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || 'unknown'
  } catch {
    // Fallback to browser fingerprint
    return `browser-${navigator.userAgent.slice(0, 50)}`
  }
}

/**
 * Check if IP has exceeded rate limit
 */
export async function checkRateLimit(): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const ip = await getClientIP()
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    
    if (!stored) {
      return { allowed: true }
    }

    const records: RateLimitRecord[] = JSON.parse(stored)
    const now = Date.now()

    // Find record for this IP
    const record = records.find(r => r.ip === ip)
    
    if (!record) {
      return { allowed: true }
    }

    // Check if record has expired
    if (now - record.timestamp > RATE_LIMIT_DURATION) {
      return { allowed: true }
    }

    // Check if limit exceeded (1 generation per IP per 24 hours)
    if (record.count >= 1) {
      return { 
        allowed: false, 
        reason: 'You\'ve already used your free trial from this network. Sign up for unlimited access!' 
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Allow on error to not block legitimate users
    return { allowed: true }
  }
}

/**
 * Record a trial generation
 */
export async function recordTrialGeneration(): Promise<void> {
  try {
    const ip = await getClientIP()
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    let records: RateLimitRecord[] = stored ? JSON.parse(stored) : []

    // Clean up expired records
    const now = Date.now()
    records = records.filter(r => now - r.timestamp <= RATE_LIMIT_DURATION)

    // Find or create record for this IP
    const existingIndex = records.findIndex(r => r.ip === ip)
    
    if (existingIndex >= 0) {
      records[existingIndex].count += 1
      records[existingIndex].timestamp = now
    } else {
      records.push({
        ip,
        timestamp: now,
        count: 1,
      })
    }

    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(records))
  } catch (error) {
    console.error('Failed to record trial generation:', error)
  }
}

/**
 * Clear rate limit (for testing)
 */
export function clearRateLimit(): void {
  localStorage.removeItem(RATE_LIMIT_KEY)
}
