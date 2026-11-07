// Anonymous usage events for Umami (script added by vite.config.ts when UMAMI_WEBSITE_ID is set).
// A no-op when analytics is off or blocked.
declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string>) => void }
  }
}

export function track(event: string, data?: Record<string, string>) {
  window.umami?.track(event, data)
}
