/**
 * Monitoring Service
 * 
 * Centralized logging and monitoring for errors, metrics, and events.
 * Provides observability into application health and user behavior.
 */

import { collection, addDoc, Firestore, serverTimestamp } from 'firebase/firestore';

export interface MonitoringEvent {
  type: 'error' | 'metric' | 'event';
  name: string;
  data: Record<string, any>;
  timestamp: number;
}

export interface ErrorLog {
  errorType: string;
  operation: string;
  message: string;
  stack?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: any;
  resolved: boolean;
}

export interface MetricLog {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  userId?: string;
  timestamp: any;
}

export interface EventLog {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp: any;
}

class MonitoringService {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private firestore: Firestore | null = null;

  /**
   * Initialize monitoring service with Firestore instance
   */
  initialize(firestore: Firestore): void {
    this.firestore = firestore;
  }

  /**
   * Logs an error with context
   */
  logError(
    error: Error | unknown,
    context: {
      operation: string;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Console logging (always)
    console.error('[MonitoringService] Error:', {
      operation: context.operation,
      message: errorMessage,
      userId: context.userId,
      metadata: context.metadata,
      timestamp: new Date().toISOString(),
    });

    if (this.isDevelopment) {
      // In development, just log to console
      if (errorStack) {
        console.error('Stack trace:', errorStack);
      }
      return;
    }

    // In production, log to Firestore
    if (this.firestore) {
      const errorLog: ErrorLog = {
        errorType: error instanceof Error ? error.name : 'UnknownError',
        operation: context.operation,
        message: errorMessage,
        stack: errorStack,
        userId: context.userId,
        metadata: context.metadata,
        timestamp: serverTimestamp(),
        resolved: false,
      };

      this.saveToFirestore('errorLogs', errorLog).catch(err => {
        console.error('[MonitoringService] Failed to save error log:', err);
      });
    }

    // TODO: Send to external monitoring service (Sentry, etc.)
    // this.sendToSentry(error, context);
  }

  /**
   * Logs a performance metric
   */
  logMetric(
    name: string,
    value: number,
    options?: {
      unit?: string;
      tags?: Record<string, string>;
      userId?: string;
    }
  ): void {
    console.log('[MonitoringService] Metric:', {
      name,
      value,
      unit: options?.unit,
      tags: options?.tags,
      userId: options?.userId,
      timestamp: new Date().toISOString(),
    });

    if (this.isDevelopment) {
      return;
    }

    // In production, log to Firestore
    if (this.firestore) {
      const metricLog: MetricLog = {
        name,
        value,
        unit: options?.unit,
        tags: options?.tags,
        userId: options?.userId,
        timestamp: serverTimestamp(),
      };

      this.saveToFirestore('metricLogs', metricLog).catch(err => {
        console.error('[MonitoringService] Failed to save metric log:', err);
      });
    }

    // TODO: Send to analytics service (PostHog, Mixpanel, etc.)
    // this.sendToAnalytics(name, value, options);
  }

  /**
   * Logs a user event
   */
  logEvent(
    name: string,
    properties?: Record<string, any>,
    userId?: string
  ): void {
    console.log('[MonitoringService] Event:', {
      name,
      properties,
      userId,
      timestamp: new Date().toISOString(),
    });

    if (this.isDevelopment) {
      return;
    }

    // In production, log to Firestore
    if (this.firestore) {
      const eventLog: EventLog = {
        name,
        properties,
        userId,
        timestamp: serverTimestamp(),
      };

      this.saveToFirestore('eventLogs', eventLog).catch(err => {
        console.error('[MonitoringService] Failed to save event log:', err);
      });
    }

    // TODO: Send to analytics service
    // this.sendToAnalytics(name, properties, userId);
  }

  /**
   * Logs generation success
   */
  logGenerationSuccess(
    operation: string,
    duration: number,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.logMetric('generation_duration', duration, {
      unit: 'ms',
      tags: { operation, status: 'success' },
      userId,
    });

    this.logEvent('generation_success', {
      operation,
      duration,
      ...metadata,
    }, userId);
  }

  /**
   * Logs generation failure
   */
  logGenerationFailure(
    operation: string,
    error: Error | unknown,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.logError(error, {
      operation,
      userId,
      metadata,
    });

    this.logEvent('generation_failure', {
      operation,
      errorMessage: error instanceof Error ? error.message : String(error),
      ...metadata,
    }, userId);
  }

  /**
   * Logs token operation
   */
  logTokenOperation(
    operation: 'deduct' | 'refund' | 'purchase',
    amount: number,
    userId: string,
    metadata?: Record<string, any>
  ): void {
    this.logEvent(`token_${operation}`, {
      amount,
      ...metadata,
    }, userId);

    this.logMetric('token_operation', amount, {
      tags: { operation },
      userId,
    });
  }

  /**
   * Logs page view (for analytics)
   */
  logPageView(page: string, userId?: string): void {
    this.logEvent('page_view', { page }, userId);
  }

  /**
   * Logs user action
   */
  logUserAction(
    action: string,
    properties?: Record<string, any>,
    userId?: string
  ): void {
    this.logEvent(`user_action_${action}`, properties, userId);
  }

  /**
   * Creates a performance timer
   */
  startTimer(name: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.logMetric(name, duration, { unit: 'ms' });
    };
  }

  /**
   * Saves log to Firestore (non-blocking)
   */
  private async saveToFirestore(
    collectionName: string,
    data: any
  ): Promise<void> {
    if (!this.firestore) {
      return;
    }

    try {
      const collectionRef = collection(this.firestore, collectionName);
      await addDoc(collectionRef, data);
    } catch (error) {
      // Don't throw - logging failure shouldn't break the app
      console.error(`[MonitoringService] Failed to save to ${collectionName}:`, error);
    }
  }

  /**
   * Batch logs multiple events (for performance)
   */
  async batchLog(events: MonitoringEvent[]): Promise<void> {
    for (const event of events) {
      switch (event.type) {
        case 'error':
          this.logError(new Error(event.name), {
            operation: event.name,
            metadata: event.data,
          });
          break;
        case 'metric':
          this.logMetric(event.name, event.data.value || 0, {
            tags: event.data.tags,
            userId: event.data.userId,
          });
          break;
        case 'event':
          this.logEvent(event.name, event.data);
          break;
      }
    }
  }

  /**
   * Gets monitoring statistics (for admin dashboard)
   */
  getStats(): {
    isDevelopment: boolean;
    isInitialized: boolean;
  } {
    return {
      isDevelopment: this.isDevelopment,
      isInitialized: this.firestore !== null,
    };
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

// Export helper functions for common monitoring patterns

/**
 * Wraps an async function with error logging
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operation: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      monitoringService.logError(error, { operation });
      throw error;
    }
  }) as T;
}

/**
 * Wraps an async function with performance timing
 */
export function withTiming<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  metricName: string
): T {
  return (async (...args: Parameters<T>) => {
    const stopTimer = monitoringService.startTimer(metricName);
    try {
      return await fn(...args);
    } finally {
      stopTimer();
    }
  }) as T;
}

/**
 * Wraps an async function with both error logging and timing
 */
export function withMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operation: string
): T {
  return withTiming(withErrorLogging(fn, operation), `${operation}_duration`);
}
