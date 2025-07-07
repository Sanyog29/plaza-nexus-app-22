import React from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import App from './App.tsx'
import './index.css'
import { ErrorFallback } from './components/common/ErrorFallback'

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={(error, errorInfo) => {
      console.error('Root error boundary caught an error:', error, errorInfo);
    }}
  >
    <App />
  </ErrorBoundary>
)
