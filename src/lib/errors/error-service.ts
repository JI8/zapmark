/**
 * Error Service
 * 
 * Central error handling service that categorizes errors, determines retry strategies,
 * and provides user-friendly error messages.
 */

export enum ErrorType {
  NETWORK = 'network',
  AI_GENERATION = 'ai_generation',
  FIREBASE = 'firebase',
  VALIDATION = 'validation',
  RATE_LIMIT = 'rate_limit',
  INSUFFICIENT_TOKENS = 'insufficient_tokens',
  UNKNOWN = 'unknown',
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorResult {
  type: ErrorType;
  message: string;
  userMessage: string;
  shouldRetry: boolean;
  shouldRefundToken: boolean;
  retryDelay?: number;
}

class ErrorService {
  /**
   * Categorizes an error and determines handling strategy
   */
  categorizeError(error: unknown, context: ErrorContext): ErrorResult {
    const errorMessage = this.extractErrorMessage(error);
    
    // Network errors
    if (this.isNetworkError(error, errorMessage)) {
      return {
        type: ErrorType.NETWORK,
        message: errorMessage,
        userMessage: 'Connection issue detected. Retrying automatically...',
        shouldRetry: true,
        shouldRefundToken: true,
      };
    }

    // AI Generation errors
    if (this.isAIGenerationError(error, errorMessage)) {
      return {
        type: ErrorType.AI_GENERATION,
        message: errorMessage,
        userMessage: 'Generation failed. Your token has been refunded.',
        shouldRetry: false,
        shouldRefundToken: true,
      };
    }

    // Firebase errors
    if (this.isFirebaseError(error, errorMessage)) {
      return {
        type: ErrorType.FIREBASE,
        message: errorMessage,
        userMessage: 'Database error. Retrying automatically...',
        shouldRetry: true,
        shouldRefundToken: false,
      };
    }

    // Validation errors
    if (this.isValidationError(error, errorMessage)) {
      return {
        type: ErrorType.VALIDATION,
        message: errorMessage,
        userMessage: errorMessage, // Use actual validation message
        shouldRetry: false,
        shouldRefundToken: false,
      };
    }

    // Rate limit errors
    if (this.isRateLimitError(error, errorMessage)) {
      const retryDelay = this.extractRetryDelay(error);
      return {
        type: ErrorType.RATE_LIMIT,
        message: errorMessage,
        userMessage: `Too many requests. Please wait ${Math.ceil(retryDelay / 1000)} seconds.`,
        shouldRetry: false,
        shouldRefundToken: false,
        retryDelay,
      };
    }

    // Insufficient tokens
    if (this.isInsufficientTokensError(error, errorMessage)) {
      return {
        type: ErrorType.INSUFFICIENT_TOKENS,
        message: errorMessage,
        userMessage: 'Insufficient tokens. Please purchase more to continue.',
        shouldRetry: false,
        shouldRefundToken: false,
      };
    }

    // Unknown errors - be safe and refund
    return {
      type: ErrorType.UNKNOWN,
      message: errorMessage,
      userMessage: 'An unexpected error occurred. Your token has been refunded.',
      shouldRetry: false,
      shouldRefundToken: true,
    };
  }

  /**
   * Determines if a token should be refunded for this error type
   */
  shouldRefundToken(errorType: ErrorType): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.AI_GENERATION,
      ErrorType.UNKNOWN,
    ].includes(errorType);
  }

  /**
   * Logs error to console and monitoring service
   */
  logError(error: unknown, context: ErrorContext): void {
    const errorResult = this.categorizeError(error, context);
    
    console.error('[ErrorService]', {
      type: errorResult.type,
      operation: context.operation,
      userId: context.userId,
      message: errorResult.message,
      metadata: context.metadata,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send to external monitoring service (Sentry, etc.)
  }

  // Private helper methods

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Unknown error occurred';
  }

  private isNetworkError(error: unknown, message: string): boolean {
    const networkKeywords = [
      'network',
      'fetch',
      'timeout',
      'connection',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
    ];
    
    return (
      error instanceof TypeError ||
      networkKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  private isAIGenerationError(error: unknown, message: string): boolean {
    const aiKeywords = [
      'generation failed',
      'model error',
      'inference error',
      'fal.ai',
      'ai service',
    ];
    
    return aiKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private isFirebaseError(error: unknown, message: string): boolean {
    const firebaseKeywords = [
      'firestore',
      'firebase',
      'permission-denied',
      'unavailable',
      'deadline-exceeded',
    ];
    
    return (
      (error && typeof error === 'object' && 'code' in error) ||
      firebaseKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  private isValidationError(error: unknown, message: string): boolean {
    const validationKeywords = [
      'validation',
      'invalid',
      'required',
      'must be',
      'should be',
    ];
    
    return (
      (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') ||
      validationKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  private isRateLimitError(error: unknown, message: string): boolean {
    const rateLimitKeywords = [
      'rate limit',
      'too many requests',
      '429',
      'quota exceeded',
    ];
    
    return rateLimitKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private isInsufficientTokensError(error: unknown, message: string): boolean {
    return message.toLowerCase().includes('insufficient tokens');
  }

  private extractRetryDelay(error: unknown): number {
    // Try to extract retry-after header or default to 60 seconds
    if (error && typeof error === 'object' && 'retryAfter' in error) {
      return Number(error.retryAfter) * 1000;
    }
    return 60000; // 60 seconds default
  }
}

// Export singleton instance
export const errorService = new ErrorService();
