"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, CloudOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      console.log('App is online')
      setIsOnline(true)
      setShowOfflineAlert(false)
    }

    const handleOffline = () => {
      console.log('App is offline')
      setIsOnline(false)
      setShowOfflineAlert(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Floating status badge
  const StatusBadge = () => (
    <div className="fixed top-4 right-4 z-50">
      <Badge 
        variant={isOnline ? "outline" : "destructive"}
        className="flex items-center gap-2 px-3 py-2"
      >
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3 text-green-500" />
            <span className="text-green-500">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </>
        )}
      </Badge>
    </div>
  )

  // Offline alert banner
  const OfflineAlert = () => {
    if (!showOfflineAlert) return null

    return (
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <Alert variant="destructive" className="border-2">
          <CloudOff className="h-4 w-4" />
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Your internet connection was lost. Some features may be limited.
              Changes will sync when you're back online.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="ml-4"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      <StatusBadge />
      <OfflineAlert />
    </>
  )
}

// Smaller inline indicator for specific components
export function InlineOfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <WifiOff className="w-4 h-4" />
      <span>Offline Mode</span>
    </div>
  )
}
