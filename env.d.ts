/// <reference types="vite/client" />

export {}

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'consent',
      action: string,
      params?: Record<string, any>
    ) => void
  }
}
