import React from 'react'
import { getLogger } from '../../lib/utils'
import { router } from '../../router'

const log = getLogger('ErrorBoundary')

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  name?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const name = this.props.name ?? 'ErrorBoundary'
    log.error(`${name} caught an error:`, error, info.componentStack)
  }

  retry = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const { fallback: CustomFallback, name = 'ErrorBoundary' } = this.props
    if (CustomFallback) {
      return <CustomFallback error={error} retry={this.retry} />
    }
    return <DefaultErrorFallback error={error} retry={this.retry} name={name} />
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null
  retry: () => void
  name?: string
}

function DefaultErrorFallback({ error, retry }: DefaultErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-chatbox-background-secondary">
      <div className="max-w-md w-full bg-chatbox-background-primary rounded-lg shadow-lg p-6 text-center">
        <div className="text-chatbox-tint-error text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-chatbox-tint-primary mb-2">Something went wrong!</h1>
        <p className="text-chatbox-tint-secondary mb-6">The application encountered an unexpected error.</p>

        <div className="space-y-3">
          <button
            onClick={retry}
            className="w-full bg-chatbox-background-brand-primary hover:bg-chatbox-background-brand-primary-hover text-chatbox-tint-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>

          <button
            onClick={() => {
              retry()
              router.navigate({ to: '/', replace: true })
            }}
            className="w-full bg-chatbox-background-gray-primary hover:bg-chatbox-background-gray-primary-hover text-chatbox-tint-white px-4 py-2 rounded-lg transition-colors"
          >
            Reload App
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-chatbox-tint-tertiary hover:text-chatbox-tint-primary px-4 py-2 rounded-lg transition-colors text-sm"
          >
            {showDetails ? 'Hide Error' : 'Show Error'}
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 p-3 bg-chatbox-background-secondary rounded-lg text-left">
            <div className="text-sm text-chatbox-tint-secondary space-y-2">
              {error && (
                <div>
                  <strong>Error:</strong>
                  <pre className="mt-1 text-xs overflow-auto whitespace-pre-wrap">
                    {error.name}: {error.message}
                  </pre>
                </div>
              )}
              {error?.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 text-xs overflow-auto whitespace-pre-wrap max-h-32">{error.stack}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
