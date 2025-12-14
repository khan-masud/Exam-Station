// Production-safe logger utility
// Logs only in development, silent in production

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args)
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors
    console.error('[ERROR]', ...args)
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args)
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args)
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args)
    }
  },
  
  // Special loggers for specific contexts
  api: {
    log: (endpoint: string, ...args: any[]) => {
      if (isDevelopment) {
        console.log(`[API:${endpoint}]`, ...args)
      }
    },
    error: (endpoint: string, ...args: any[]) => {
      console.error(`[API:${endpoint}]`, ...args)
    }
  },
  
  frontend: {
    log: (component: string, ...args: any[]) => {
      if (isDevelopment) {
        console.log(`[FE:${component}]`, ...args)
      }
    },
    error: (component: string, ...args: any[]) => {
      console.error(`[FE:${component}]`, ...args)
    }
  },
  
  exam: {
    log: (action: string, ...args: any[]) => {
      if (isDevelopment) {
        console.log(`[EXAM:${action}]`, ...args)
      }
    },
    error: (action: string, ...args: any[]) => {
      console.error(`[EXAM:${action}]`, ...args)
    }
  }
}

// Convenience functions for common logging patterns
export const logApiRequest = (method: string, endpoint: string, data?: any) => {
  logger.api.log(endpoint, `${method} request`, data)
}

export const logApiResponse = (endpoint: string, status: number, data?: any) => {
  logger.api.log(endpoint, `Response ${status}`, data)
}

export const logApiError = (endpoint: string, error: any) => {
  logger.api.error(endpoint, error)
}

export default logger
