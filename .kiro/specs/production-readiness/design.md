# Phase 1: Core Stability & Error Handling - Design Document

## Overview

This design document outlines the technical approach for implementing robust error handling, retry logic, and resilience features that form the foundation of a production-ready SaaS platform.

## Architecture

### Error Handling Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Error        │  │ Retry        │  │ Token        │      │
│  │ Boundary     │  │ Manager      │  │ Manager      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Error        │  │ Validation   │  │ Monitoring   │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Infrastructure Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Firebase     │  │ AI API       │  │ Storage      │      │
│  │ (Firestore)  │  │ (Fal.ai)     │  │ (Firebase)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Error Service (`src/lib/errors/error-service.ts`)

Central error handling service that categorizes and processes errors.

```typescript
interface ErrorContext {
  operation: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface ErrorResult {
  type: ErrorType;
  message: string;
  userMessage: string;
  shouldRetry: boolean;
  shouldRefundToken: boolean;
}

enum ErrorType {
  NETWORK = 'network',
  AI_GENERATION = 'ai_generation',
  FIREBASE = 'firebase',
  VALIDATION = 'validation',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown'
}

class ErrorService {
  categorizeError(error: unknown, context: ErrorContext): ErrorResult
  logError(error: unknown, context: ErrorContext): void
  shouldRefundToken(errorType: ErrorType): boolean
}
```

### 2. Retry Manager (`src/lib/retry/retry-manager.ts`)

Handles retry logic with exponential backoff.

```typescript
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

class RetryManager {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    shouldRetry: (error: unknown) => boolean
  ): Promise<RetryResult<T>>
  
  calculateDelay(attempt: number, config: RetryConfig): number
}
```

### 3. Token Manager (`src/lib/tokens/token-manager.ts`)

Manages token operations including refunds.

```typescript
interface TokenOperation {
  userId: string;
  amount: number;
  operation: 'deduct' | 'refund';
  reason: string;
  metadata?: Record<string, any>;
}

interface TokenResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

class TokenManager {
  async deductTokens(operation: TokenOperation): Promise<TokenResult>
  async refundTokens(operation: TokenOperation): Promise<TokenResult>
  async getBalance(userId: string): Promise<number>
}
```

### 4. Validation Service (`src/lib/validation/validation-service.ts`)

Validates user inputs before processing.

```typescript
interface ValidationRule {
  field: string;
  validate: (value: any) => boolean;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}

class ValidationService {
  validateLogoGeneration(data: LogoGenSchema): ValidationResult
  validateEditPrompt(prompt: string): ValidationResult
  sanitizeInput(input: string): string
}
```

### 5. Error Boundary Component (`src/components/error-boundary.tsx`)

React error boundary for catching component errors.

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>
```

### 6. Monitoring Service (`src/lib/monitoring/monitoring-service.ts`)

Logs errors and metrics for monitoring.

```typescript
interface MonitoringEvent {
  type: 'error' | 'metric' | 'event';
  name: string;
  data: Record<string, any>;
  timestamp: number;
}

class MonitoringService {
  logError(error: Error, context: Record<string, any>): void
  logMetric(name: string, value: number, tags?: Record<string, string>): void
  logEvent(name: string, properties?: Record<string, any>): void
}
```

## Data Models

### Error Log Schema

```typescript
interface ErrorLog {
  id: string;
  userId: string;
  errorType: ErrorType;
  operation: string;
  message: string;
  stack?: string;
  metadata: Record<string, any>;
  timestamp: Timestamp;
  resolved: boolean;
}

// Firestore path: /errorLogs/{errorLogId}
```

### Token Transaction Schema

```typescript
interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deduct' | 'refund' | 'purchase' | 'subscription';
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  metadata?: Record<string, any>;
  timestamp: Timestamp;
}

// Firestore path: /users/{userId}/tokenTransactions/{transactionId}
```

## Error Handling Strategy

### Error Flow

```
User Action
    ↓
Input Validation ──→ [Invalid] ──→ Show validation error
    ↓ [Valid]
Deduct Token ──→ [Insufficient] ──→ Show insufficient tokens error
    ↓ [Success]
Execute Operation
    ↓
[Success] ──→ Save result ──→ Done
    ↓
[Failure] ──→ Categorize Error
    ↓
Refund Token (if applicable)
    ↓
Retry? ──→ [Yes] ──→ Retry with backoff (max 3 times)
    ↓ [No]
Show user-friendly error + retry button
```

### Error Categories & Handling

| Error Type | Retry? | Refund Token? | User Message |
|------------|--------|---------------|--------------|
| Network | Yes (3x) | Yes | "Connection issue. Retrying..." |
| AI Generation | No | Yes | "Generation failed. Token refunded." |
| Firebase | Yes (3x) | No | "Database error. Retrying..." |
| Validation | No | No | "Invalid input: {details}" |
| Rate Limit | No | No | "Too many requests. Wait {time}." |
| Unknown | No | Yes | "Unexpected error. Token refunded." |

## Retry Logic

### Exponential Backoff Configuration

```typescript
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 10000,         // 10 seconds
  backoffMultiplier: 2     // Double each time
};

// Retry delays: 1s, 2s, 4s
```

### Retryable Operations

1. **Firebase Operations**
   - Document reads/writes
   - Transaction commits
   - Storage uploads

2. **Network Requests**
   - AI API calls (with caution)
   - External API calls

### Non-Retryable Operations

1. **Validation Errors** - User input issue
2. **Rate Limit Errors** - Need to wait
3. **AI Generation Errors** - Model failure (refund instead)

## Input Validation

### Validation Rules

```typescript
const VALIDATION_RULES = {
  textConcept: {
    minLength: 3,
    maxLength: 500,
    pattern: /^[a-zA-Z0-9\s\-_.,!?]+$/,
    message: 'Concept must be 3-500 characters, alphanumeric only'
  },
  editPrompt: {
    minLength: 3,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s\-_.,!?]+$/,
    message: 'Prompt must be 3-200 characters, alphanumeric only'
  },
  gridSize: {
    enum: ['3x3', '4x4'],
    message: 'Grid size must be 3x3 or 4x4'
  }
};
```

### Sanitization

- Strip HTML tags
- Remove special characters
- Trim whitespace
- Escape SQL/NoSQL injection attempts

## Token Refund Logic

### Refund Conditions

```typescript
function shouldRefundToken(error: ErrorResult): boolean {
  return (
    error.type === ErrorType.AI_GENERATION ||
    error.type === ErrorType.NETWORK ||
    error.type === ErrorType.UNKNOWN
  ) && error.shouldRefundToken;
}
```

### Refund Process

1. Categorize error
2. Check if refund is applicable
3. Create refund transaction
4. Update user token balance atomically
5. Log refund event
6. Notify user (toast message)

## Error Boundary Implementation

### Fallback UI

```typescript
function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>We've been notified and are working on it.</p>
      <button onClick={resetError}>Try Again</button>
      <button onClick={() => window.location.href = '/'}>Go Home</button>
    </div>
  );
}
```

### Error Logging

All errors caught by boundary are:
1. Logged to console (development)
2. Sent to monitoring service (production)
3. Stored in Firestore for analysis

## Monitoring & Observability

### Key Metrics to Track

1. **Error Rate**
   - Total errors per hour
   - Errors by type
   - Errors by operation

2. **Retry Success Rate**
   - Successful retries / Total retries
   - Average retry attempts

3. **Token Refunds**
   - Total refunds per day
   - Refund reasons
   - Refund amounts

4. **Generation Success Rate**
   - Successful generations / Total attempts
   - Average generation time
   - Failure reasons

### Logging Strategy

```typescript
// Development: Console only
// Production: Console + Firestore + External service (future: Sentry)

interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  context: Record<string, any>;
  timestamp: number;
}
```

## Testing Strategy

### Unit Tests

- Error categorization logic
- Retry backoff calculation
- Token refund logic
- Input validation rules

### Integration Tests

- End-to-end error handling flow
- Token deduction + refund flow
- Retry with Firebase operations

### Error Scenarios to Test

1. Network timeout during generation
2. AI API returns error
3. Firebase transaction fails
4. Invalid user input
5. Insufficient tokens
6. Rate limit exceeded
7. Component crash

## Implementation Plan

### Phase 1.1: Core Infrastructure (Day 1-2)

1. Create error service
2. Create retry manager
3. Create token manager
4. Create validation service
5. Add TypeScript types

### Phase 1.2: Integration (Day 3-4)

1. Integrate error service into AI flows
2. Add retry logic to Firebase operations
3. Implement token refund on failures
4. Add input validation to forms

### Phase 1.3: UI & UX (Day 5-6)

1. Create error boundary component
2. Design error fallback UI
3. Add retry buttons to error states
4. Improve loading states

### Phase 1.4: Monitoring (Day 7)

1. Set up monitoring service
2. Add error logging
3. Create error dashboard (basic)
4. Test all error scenarios

## Security Considerations

1. **Input Sanitization** - Prevent XSS and injection attacks
2. **Rate Limiting** - Prevent abuse (future: implement in Phase 3)
3. **Error Messages** - Don't expose sensitive information
4. **Token Operations** - Use Firestore transactions for atomicity
5. **Logging** - Don't log sensitive user data (PII)

## Performance Considerations

1. **Retry Delays** - Don't block UI during retries
2. **Error Logging** - Async, non-blocking
3. **Token Operations** - Optimistic UI updates
4. **Validation** - Client-side first, server-side always

## Future Enhancements

1. **Circuit Breaker** - Stop retrying if service is down
2. **Error Recovery Strategies** - Auto-save drafts
3. **Advanced Monitoring** - Sentry integration
4. **Error Analytics** - Dashboard with trends
5. **User Feedback** - Allow users to report errors
