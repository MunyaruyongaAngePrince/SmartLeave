/**
 * Centralized Error Handling Service
 * Provides consistent error messages and logging across the application
 */

export interface ErrorDetails {
  message: string;
  code?: string;
  statusCode?: number;
  context?: string;
  originalError?: any;
}

export class AppError extends Error {
  code: string;
  statusCode: number;
  context: string;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500, context: string = '') {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.name = 'AppError';
  }
}

/**
 * Parse and standardize error responses from API calls
 */
export const parseApiError = (error: any): ErrorDetails => {
  // Handle fetch errors
  if (error instanceof TypeError) {
    return {
      message: 'Failed to connect to server. Please check if the server is running.',
      code: 'NETWORK_ERROR',
      statusCode: 0,
      originalError: error
    };
  }

  // Handle timeout errors
  if (error.name === 'AbortError') {
    return {
      message: 'Request timed out. Please try again.',
      code: 'TIMEOUT_ERROR',
      statusCode: 408,
      originalError: error
    };
  }

  // Handle JSON parse errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return {
      message: 'Server returned an invalid response. Please try again or contact support.',
      code: 'INVALID_RESPONSE',
      statusCode: 500,
      originalError: error
    };
  }

  // Handle custom error object with message
  if (typeof error === 'object' && error !== null) {
    if (error.message && typeof error.message === 'string') {
      return {
        message: error.message,
        code: error.code || 'API_ERROR',
        statusCode: error.statusCode || 500,
        originalError: error
      };
    }

    if (error.error && typeof error.error === 'string') {
      return {
        message: error.error,
        code: 'API_ERROR',
        statusCode: error.statusCode || 400,
        originalError: error
      };
    }
  }

  // Handle string error
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      originalError: error
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    originalError: error
  };
};

/**
 * Handle HTTP response and extract error information
 */
export const handleHttpResponse = async (response: Response, context: string = ''): Promise<any> => {
  const contentType = response.headers.get('content-type');
  let data: any;

  try {
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch (e) {
    console.error(`Failed to parse response for ${context}:`, e);
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || getHttpErrorMessage(response.status);
    throw new AppError(
      errorMessage,
      `HTTP_${response.status}`,
      response.status,
      context
    );
  }

  return data;
};

/**
 * Get user-friendly HTTP error messages
 */
export const getHttpErrorMessage = (statusCode: number): string => {
  const errorMessages: { [key: number]: string } = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'Your session has expired. Please login again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'The operation conflicts with existing data. Please refresh and try again.',
    500: 'Server error. Please try again later or contact support.',
    502: 'Server is temporarily unavailable. Please try again later.',
    503: 'Service is temporarily unavailable. Please try again later.',
    504: 'Server took too long to respond. Please try again.'
  };

  return errorMessages[statusCode] || `Server error (${statusCode}). Please try again.`;
};

/**
 * Categorize errors for different handling strategies
 */
export const categorizeError = (error: ErrorDetails): 'network' | 'validation' | 'auth' | 'server' | 'unknown' => {
  if (error.code === 'NETWORK_ERROR') return 'network';
  if (error.statusCode === 400 || error.code?.includes('VALIDATION')) return 'validation';
  if (error.statusCode === 401 || error.statusCode === 403) return 'auth';
  if (error.statusCode && error.statusCode >= 500) return 'server';
  return 'unknown';
};

/**
 * Log error with context
 */
export const logError = (error: ErrorDetails | Error, context: string = '') => {
  const timestamp = new Date().toISOString();
  const errorObject = error instanceof AppError ? error : parseApiError(error);

  console.error(`[${timestamp}] ${context || errorObject.context || 'Error'}:`, {
    message: errorObject.message,
    code: errorObject.code,
    statusCode: errorObject.statusCode,
    originalError: errorObject.originalError
  });
};

/**
 * Validation error handler for form submissions
 */
export const validateFormField = (
  fieldName: string,
  value: any,
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  }
): string | null => {
  if (rules.required && !value) {
    return `${fieldName} is required`;
  }

  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} must be no more than ${rules.maxLength} characters`;
    }
    if (rules.pattern && !rules.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

/**
 * Common validation rules
 */
export const ValidationRules = {
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { minLength: 6, maxLength: 64 },
  phoneRwanda: {
    custom: (value: string) => {
      const cleaned = value.replace(/\D/g, '');
      if (!cleaned.startsWith('078') && !cleaned.startsWith('079') && 
          !cleaned.startsWith('073') && !cleaned.startsWith('072')) {
        return 'Phone must start with 078, 079, 073, or 072';
      }
      if (cleaned.length > 10) {
        return 'Phone must not exceed 10 digits';
      }
      return null;
    }
  },
  idNumber: { maxLength: 16 },
  commonName: { minLength: 2, maxLength: 100 }
};

/**
 * Retry logic for failed requests
 */
export const retryRequest = async (
  fn: () => Promise<any>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
) => {
  const { maxRetries = 3, delayMs = 1000, backoffMultiplier = 2, shouldRetry } = options;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      // Check if it's a retryable error (network, timeout, server error)
      const errorDetails = parseApiError(error);
      const isRetryable =
        errorDetails.code === 'NETWORK_ERROR' ||
        errorDetails.code === 'TIMEOUT_ERROR' ||
        (errorDetails.statusCode && errorDetails.statusCode >= 500);

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
