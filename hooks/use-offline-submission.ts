"use client"

import { useState, useEffect } from "react"
import { OfflineStorage } from "@/lib/service-worker"
import { toast } from "sonner"

export function useOfflineSubmission() {
  const [storage] = useState(() => new OfflineStorage())
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)

    // Load pending submissions count
    loadPendingCount()

    // Listen for online/offline events
    const handleOnline = async () => {
      setIsOnline(true)
      await syncPendingSubmissions()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('You are offline', {
        description: 'Your answers will be saved locally and submitted when you reconnect',
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadPendingCount = async () => {
    try {
      const pending = await storage.getPendingSubmissions()
      setPendingCount(pending.length)
    } catch (error) {
      // Failed to load pending submissions
    }
  }

  const saveSubmissionOffline = async (attemptId: string, answers: any, timeSpent: number) => {
    try {
      await storage.savePendingSubmission({
        attemptId,
        answers,
        timeSpent,
      })

      await loadPendingCount()

      toast.success('Submission saved offline', {
        description: 'Your answers will be submitted when you reconnect to the internet',
      })

      return true
    } catch (error) {
      console.error('Failed to save submission offline:', error)
      toast.error('Failed to save submission offline')
      return false
    }
  }

  const submitExam = async (attemptId: string, answers: any, timeSpent: number) => {
    // If offline, save for later
    if (!navigator.onLine) {
      return await saveSubmissionOffline(attemptId, answers, timeSpent)
    }

    // Try to submit online
    try {
      const response = await fetch('/api/exam-attempts/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          attemptId,
          answers,
          timeSpent,
        }),
      })

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      const result = await response.json()
      
      toast.success('Exam submitted successfully!')
      return result
    } catch (error) {
      console.error('Submission error:', error)
      
      // Save offline as fallback
      const saved = await saveSubmissionOffline(attemptId, answers, timeSpent)
      
      if (!saved) {
        toast.error('Failed to submit exam')
      }
      
      return null
    }
  }

  const syncPendingSubmissions = async () => {
    try {
      const pending = await storage.getPendingSubmissions()
      
      if (pending.length === 0) return

      toast.info('Syncing pending submissions...', {
        description: `${pending.length} submission(s) found`,
      })

      let successCount = 0
      
      for (const submission of pending) {
        try {
          const response = await fetch('/api/exam-attempts/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              attemptId: submission.attemptId,
              answers: submission.answers,
              timeSpent: submission.timeSpent,
            }),
          })

          if (response.ok) {
            await storage.deletePendingSubmission(submission.id)
            successCount++
          }
        } catch (error) {
          console.error('Failed to sync submission:', error)
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} submission(s) synced successfully!`)
        await loadPendingCount()
      }
    } catch (error) {
      console.error('Failed to sync pending submissions:', error)
    }
  }

  return {
    submitExam,
    isOnline,
    pendingCount,
    syncPendingSubmissions,
  }
}
