export interface AntiCheatEvent {
  timestamp: number
  type: "window-blur" | "tab-switch" | "fullscreen-exit" | "screenshot-attempt" | "copy-paste" | "right-click" | "multiple-faces" | "no-face" | "audio-anomaly" | "ip-change"
  severity: "warning" | "critical"
  description: string
}

export class AntiCheatMonitor {
  private events: AntiCheatEvent[] = []
  private sessionId: string
  private isClient: boolean

  constructor(sessionId: string) {
    this.sessionId = sessionId
    this.isClient = typeof window !== 'undefined'
  }

  recordEvent(event: Omit<AntiCheatEvent, "timestamp">): void {
    this.events.push({
      ...event,
      timestamp: Date.now(),
    })
  }

  disableRightClick(): void {
    if (!this.isClient) return
    
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault()
      this.recordEvent({
        type: "right-click",
        severity: "warning",
        description: "Right-click attempt detected",
      })
    })
  }

  disableCopyPaste(): void {
    if (!this.isClient) return
    
    document.addEventListener("copy", (e) => {
      e.preventDefault()
      this.recordEvent({
        type: "copy-paste",
        severity: "critical",
        description: "Copy attempt detected",
      })
    })

    document.addEventListener("paste", (e) => {
      e.preventDefault()
      this.recordEvent({
        type: "copy-paste",
        severity: "critical",
        description: "Paste attempt detected",
      })
    })
  }

  monitorWindowFocus(): void {
    if (!this.isClient) return
    
    window.addEventListener("blur", () => {
      this.recordEvent({
        type: "window-blur",
        severity: "warning",
        description: "Student switched to another application",
      })
    })

    window.addEventListener("focus", () => {
      // Could record when they return
    })
  }

  monitorFullscreen(): void {
    if (!this.isClient) return
    
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        this.recordEvent({
          type: "fullscreen-exit",
          severity: "critical",
          description: "Fullscreen mode exited",
        })
      }
    })
  }

  getEvents(): AntiCheatEvent[] {
    return this.events
  }

  getSuspiciousEventCount(): number {
    return this.events.filter((e) => e.severity === "critical").length
  }

  exportSessionData(): {
    sessionId: string
    events: AntiCheatEvent[]
    suspiciousCount: number
  } {
    return {
      sessionId: this.sessionId,
      events: this.events,
      suspiciousCount: this.getSuspiciousEventCount(),
    }
  }
  
  cleanup(): void {
    if (!this.isClient) return
    
    // Remove event listeners when component unmounts
    document.removeEventListener("contextmenu", () => {})
    document.removeEventListener("copy", () => {})
    document.removeEventListener("paste", () => {})
    window.removeEventListener("blur", () => {})
    window.removeEventListener("focus", () => {})
    document.removeEventListener("fullscreenchange", () => {})
  }
}
