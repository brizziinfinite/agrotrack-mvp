// Redirect debugger to track and log all navigation attempts

interface RedirectLog {
  timestamp: string
  from: string
  to: string
  trigger: string
  authState: {
    hasSession: boolean
    hasUser: boolean
    hasCustomer: boolean
  }
  stack: string
}

class RedirectDebugger {
  private logs: RedirectLog[] = []
  private maxLogs = 50
  private redirectCount = 0
  private lastRedirect = ''
  private lastRedirectTime = 0

  log(to: string, trigger: string, authState: any) {
    const now = Date.now()
    const from = typeof window !== 'undefined' ? window.location.pathname : 'unknown'

    // Detect redirect loop
    if (to === this.lastRedirect && now - this.lastRedirectTime < 1000) {
      this.redirectCount++
      if (this.redirectCount > 5) {
        console.error('🔥🔥🔥 [REDIRECT LOOP DETECTED] 🔥🔥🔥')
        console.error(`Redirecting to ${to} more than 5 times in 1 second!`)
        console.error('This is likely an infinite redirect loop!')
        console.error('Last 10 redirects:', this.logs.slice(-10))

        // Prevent further redirects
        alert(`REDIRECT LOOP DETECTED!\n\nRedirecting to ${to} repeatedly.\n\nClick OK to force logout and clear all sessions.`)
        window.location.href = '/logout'
        return false
      }
    } else {
      this.redirectCount = 1
    }

    this.lastRedirect = to
    this.lastRedirectTime = now

    const logEntry: RedirectLog = {
      timestamp: new Date().toISOString(),
      from,
      to,
      trigger,
      authState,
      stack: new Error().stack || 'No stack trace'
    }

    this.logs.push(logEntry)

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Log with prominent styling
    console.log(
      `%c🔀 [REDIRECT] ${from} → ${to}`,
      'background: #ff6b6b; color: white; font-weight: bold; padding: 4px 8px; border-radius: 3px;',
      {
        trigger,
        authState,
        totalRedirects: this.logs.length
      }
    )

    return true
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
    this.redirectCount = 0
  }

  printSummary() {
    console.group('📊 Redirect Summary')
    console.log('Total redirects:', this.logs.length)
    console.log('Recent redirects:', this.logs.slice(-10))
    console.groupEnd()
  }
}

export const redirectDebugger = new RedirectDebugger()

// Helper function to log redirect with auth state
export function logRedirect(to: string, trigger: string, authState?: any) {
  return redirectDebugger.log(to, trigger, authState || {
    hasSession: false,
    hasUser: false,
    hasCustomer: false
  })
}
