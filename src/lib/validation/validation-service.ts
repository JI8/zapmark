/**
 * Validation Service
 * 
 * Validates and sanitizes user inputs to prevent invalid data and security issues.
 * Provides clear validation error messages for user feedback.
 */

export interface ValidationRule {
  field: string;
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}

export interface LogoGenerationInput {
  textConcept: string;
  gridSize: '3x3' | '4x4';
  generationType?: string;
}

export interface EditPromptInput {
  prompt: string;
}

class ValidationService {
  // Validation rules configuration
  private readonly VALIDATION_RULES = {
    textConcept: {
      minLength: 3,
      maxLength: 500,
      pattern: /^[a-zA-Z0-9\s\-_.,!?'"()&]+$/,
      message: 'Concept must be 3-500 characters and contain only letters, numbers, and basic punctuation',
    },
    editPrompt: {
      minLength: 3,
      maxLength: 200,
      pattern: /^[a-zA-Z0-9\s\-_.,!?'"()&]+$/,
      message: 'Prompt must be 3-200 characters and contain only letters, numbers, and basic punctuation',
    },
    gridSize: {
      enum: ['3x3', '4x4'],
      message: 'Grid size must be either 3x3 or 4x4',
    },
  };

  /**
   * Validates logo generation input
   */
  validateLogoGeneration(data: LogoGenerationInput): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    // Validate textConcept
    if (!data.textConcept || typeof data.textConcept !== 'string') {
      errors.push({
        field: 'textConcept',
        message: 'Concept is required',
      });
    } else {
      const concept = data.textConcept.trim();
      const rules = this.VALIDATION_RULES.textConcept;

      if (concept.length < rules.minLength) {
        errors.push({
          field: 'textConcept',
          message: `Concept must be at least ${rules.minLength} characters`,
        });
      }

      if (concept.length > rules.maxLength) {
        errors.push({
          field: 'textConcept',
          message: `Concept must be no more than ${rules.maxLength} characters`,
        });
      }

      if (!rules.pattern.test(concept)) {
        errors.push({
          field: 'textConcept',
          message: rules.message,
        });
      }

      // Check for potential injection attempts
      if (this.containsSuspiciousPatterns(concept)) {
        errors.push({
          field: 'textConcept',
          message: 'Concept contains invalid characters or patterns',
        });
      }
    }

    // Validate gridSize
    if (!data.gridSize) {
      errors.push({
        field: 'gridSize',
        message: 'Grid size is required',
      });
    } else if (!this.VALIDATION_RULES.gridSize.enum.includes(data.gridSize)) {
      errors.push({
        field: 'gridSize',
        message: this.VALIDATION_RULES.gridSize.message,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates edit prompt input
   */
  validateEditPrompt(data: EditPromptInput): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.prompt || typeof data.prompt !== 'string') {
      errors.push({
        field: 'prompt',
        message: 'Edit prompt is required',
      });
    } else {
      const prompt = data.prompt.trim();
      const rules = this.VALIDATION_RULES.editPrompt;

      if (prompt.length < rules.minLength) {
        errors.push({
          field: 'prompt',
          message: `Prompt must be at least ${rules.minLength} characters`,
        });
      }

      if (prompt.length > rules.maxLength) {
        errors.push({
          field: 'prompt',
          message: `Prompt must be no more than ${rules.maxLength} characters`,
        });
      }

      if (!rules.pattern.test(prompt)) {
        errors.push({
          field: 'prompt',
          message: rules.message,
        });
      }

      // Check for potential injection attempts
      if (this.containsSuspiciousPatterns(prompt)) {
        errors.push({
          field: 'prompt',
          message: 'Prompt contains invalid characters or patterns',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitizes user input by removing potentially harmful content
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove script tags and content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: protocol (can be used for XSS)
    sanitized = sanitized.replace(/data:text\/html/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  }

  /**
   * Validates that a string is safe for use in prompts
   */
  isSafePrompt(prompt: string): boolean {
    if (!prompt || typeof prompt !== 'string') {
      return false;
    }

    // Check length
    if (prompt.length < 3 || prompt.length > 500) {
      return false;
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(prompt)) {
      return false;
    }

    return true;
  }

  /**
   * Checks for suspicious patterns that might indicate injection attempts
   */
  private containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\(/i,
      /expression\(/i,
      /vbscript:/i,
      /\.\.\/\.\.\//,  // Path traversal
      /\$\{.*\}/,      // Template injection
      /\{\{.*\}\}/,    // Template injection
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validates email format (for future use)
   */
  isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Validates URL format (for future use)
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates a formatted error message from validation result
   */
  formatValidationErrors(result: ValidationResult): string {
    if (result.valid) {
      return '';
    }

    return result.errors
      .map(error => error.message)
      .join('. ');
  }

  /**
   * Gets the first validation error message
   */
  getFirstError(result: ValidationResult): string {
    if (result.valid || result.errors.length === 0) {
      return '';
    }

    return result.errors[0].message;
  }
}

// Export singleton instance
export const validationService = new ValidationService();
