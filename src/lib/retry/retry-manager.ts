/**
 * Retry Manager
 * 
 * Handles retry logic with exponential backoff for failed operations.
 * Provides configurable retry strategies for different operation types.
 */

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 10000,         // 10 seconds
  backoffMultiplier: 2,    // Double each time
};

export const FIREBASE_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 500,       // 500ms
  maxDelay: 5000,          // 5 seconds
  backoffMultiplier: 2,
};

export const NETWORK_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 2000,      // 2 seconds
  maxDelay: 10000,         // 10 seconds
  backoffMultiplier: 2,
};

class RetryManager {
  /**
   * Executes an operation with retry logic and exponential backoff
   * 
   * @param operation - The async operation to execute
   * @param config - Retry configuration
   * @param shouldRetry - Function to determine if error is retryable
   * @returns RetryResult with success status and data or error
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    shouldRetry: (error: unknown) => boolean = () => true
  ): Promise<RetryResult<T>> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const data = await operation();
        return {
          success: true,
          data,
          attempts: attempt,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.log(`[RetryManager] Attempt ${attempt}/${config.maxAttempts} failed:`, lastError.message);
        
        // Check if we should retry
        if (attempt < config.maxAttempts && shouldRetry(error)) {
          const delay = this.calculateDelay(attempt, config);
          console.log(`[RetryManager] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        } else {
          // Max attempts reached or error is not retryable
          break;
        }
      }
    }
    
    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts,
    };
  }

  /**
   * Calculates delay for exponential backoff
   * 
   * Formula: min(initialDelay * (backoffMultiplier ^ (attempt - 1)), maxDelay)
   * 
   * Example with default config:
   * - Attempt 1: 1000ms
   * - Attempt 2: 2000ms
   * - Attempt 3: 4000ms
   */
  calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(exponentialDelay, config.maxDelay);
  }

  /**
   * Executes multiple operations with retry in parallel
   * 
   * @param operations - Array of operations to execute
   * @param config - Retry configuration
   * @param shouldRetry - Function to determine if error is retryable
   * @returns Array of RetryResults
   */
  async executeAllWithRetry<T>(
    operations: Array<() => Promise<T>>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    shouldRetry: (error: unknown) => boolean = () => true
  ): Promise<Array<RetryResult<T>>> {
    const promises = operations.map(op => 
      this.executeWithRetry(op, config, shouldRetry)
    );
    return Promise.all(promises);
  }

  /**
   * Wraps a function to automatically retry on failure
   * 
   * @param fn - Function to wrap
   * @param config - Retry configuration
   * @param shouldRetry - Function to determine if error is retryable
   * @returns Wrapped function with retry logic
   */
  withRetry<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    shouldRetry: (error: unknown) => boolean = () => true
  ): T {
    return (async (...args: Parameters<T>) => {
      const result = await this.executeWithRetry(
        () => fn(...args),
        config,
        shouldRetry
      );
      
      if (result.success) {
        return result.data;
      } else {
        throw result.error;
      }
    }) as T;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const retryManager = new RetryManager();

// Export helper functions for common retry patterns

/**
 * Retry helper for Firebase operations
 */
export async function retryFirebaseOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  const result = await retryManager.executeWithRetry(
    operation,
    FIREBASE_RETRY_CONFIG,
    (error) => {
      // Retry on transient Firebase errors
      const message = error instanceof Error ? error.message : String(error);
      return (
        message.includes('unavailable') ||
        message.includes('deadline-exceeded') ||
        message.includes('internal')
      );
    }
  );
  
  if (result.success && result.data !== undefined) {
    return result.data;
  } else {
    throw result.error || new Error('Firebase operation failed');
  }
}

/**
 * Retry helper for network operations
 */
export async function retryNetworkOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  const result = await retryManager.executeWithRetry(
    operation,
    NETWORK_RETRY_CONFIG,
    (error) => {
      // Retry on network errors
      return (
        error instanceof TypeError ||
        (error instanceof Error && (
          error.message.includes('network') ||
          error.message.includes('fetch') ||
          error.message.includes('timeout')
        ))
      );
    }
  );
  
  if (result.success && result.data !== undefined) {
    return result.data;
  } else {
    throw result.error || new Error('Network operation failed');
  }
}
