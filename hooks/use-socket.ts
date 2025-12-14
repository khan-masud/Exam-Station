"use client"

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './use-auth'

interface UseSocketOptions {
  autoConnect?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
}

export function useSocket(options: UseSocketOptions = {}) {
  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { autoConnect = true, onConnect, onDisconnect } = options

  useEffect(() => {
    if (!autoConnect || !user) return

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socket',
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketRef.current = socket

    // Get auth token from cookie
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1]

    socket.on('connect', () => {
      setIsConnected(true)
      
      // Authenticate
      if (token) {
        socket.emit('authenticate', token)
      }
      
      onConnect?.()
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      onDisconnect?.()
    })

    socket.on('authenticated', (data) => {
      // Socket authenticated
    })

    socket.on('auth_error', (error) => {
      // Socket auth error
    })

    return () => {
      socket.disconnect()
    }
  }, [user, autoConnect, onConnect, onDisconnect])

  const emit = (event: string, data?: any) => {
    socketRef.current?.emit(event, data)
  }

  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback)
    return () => {
      socketRef.current?.off(event, callback)
    }
  }

  const off = (event: string, callback?: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback)
  }

  const joinExam = (examId: string) => {
    emit('join_exam', examId)
  }

  const leaveExam = (examId: string) => {
    emit('leave_exam', examId)
  }

  const joinLeaderboard = () => {
    emit('join_leaderboard')
  }

  const leaveLeaderboard = () => {
    emit('leave_leaderboard')
  }

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
    joinExam,
    leaveExam,
    joinLeaderboard,
    leaveLeaderboard,
  }
}
