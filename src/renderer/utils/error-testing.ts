import { getLogger } from '../lib/utils'

const log = getLogger('ErrorTesting')

// Development utility functions for testing error handling
export const errorTestingUtils = {
  // Test React error boundary
  triggerReactError: () => {
    throw new Error('Test React error boundary - this error is intentional for testing')
  },

  // Test global error handler
  triggerGlobalError: () => {
    setTimeout(() => {
      throw new Error('Test global error handler - this error is intentional for testing')
    }, 100)
  },

  // Test unhandled promise rejection
  triggerUnhandledRejection: () => {
    Promise.reject(new Error('Test unhandled promise rejection - this error is intentional for testing'))
  },

  // Test cannot read properties error
  triggerPropertyError: () => {
    try {
      const obj: any = null
      return obj.nonExistentProperty.anotherProperty
    } catch (e) {
      throw e
    }
  },

  // Test console error interception
  triggerConsoleError: () => {
    console.error('Test console error interception: cannot read properties of undefined')
  },
}

// Make it available globally in development
if (process.env.NODE_ENV === 'development') {
  ;(window as any).errorTestingUtils = errorTestingUtils
  log.info('Error testing utilities available at window.errorTestingUtils')
}
