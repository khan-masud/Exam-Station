import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { verifyToken } from './auth'

let io: SocketIOServer | null = null

export function initSocket(server: HTTPServer) {
  if (io) return io

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Authenticate socket connection
    socket.on('authenticate', (token: string) => {
      try {
        const decoded = verifyToken(token)
        if (decoded) {
          socket.data.userId = decoded.userId
          socket.data.role = decoded.role
          
          // Join user-specific room
          socket.join(`user:${decoded.userId}`)
          
          // Join role-specific room
          socket.join(`role:${decoded.role}`)
          
          socket.emit('authenticated', { userId: decoded.userId, role: decoded.role })
        }
      } catch (error) {
        socket.emit('auth_error', { message: 'Authentication failed' })
      }
    })

    // Join exam room for real-time updates
    socket.on('join_exam', (examId: string) => {
      if (socket.data.userId) {
        socket.join(`exam:${examId}`)
        console.log(`User ${socket.data.userId} joined exam ${examId}`)
      }
    })

    // Leave exam room
    socket.on('leave_exam', (examId: string) => {
      socket.leave(`exam:${examId}`)
      console.log(`User ${socket.data.userId} left exam ${examId}`)
    })

    // Join leaderboard room
    socket.on('join_leaderboard', () => {
      socket.join('leaderboard')
      console.log(`User ${socket.data.userId} joined leaderboard`)
    })

    // Leave leaderboard room
    socket.on('leave_leaderboard', () => {
      socket.leave('leaderboard')
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}

// Helper functions to emit events
export const socketEvents = {
  // Emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    if (!io) return
    io.to(`user:${userId}`).emit(event, data)
  },

  // Emit to all users with specific role
  emitToRole(role: string, event: string, data: any) {
    if (!io) return
    io.to(`role:${role}`).emit(event, data)
  },

  // Emit to specific exam room
  emitToExam(examId: string, event: string, data: any) {
    if (!io) return
    io.to(`exam:${examId}`).emit(event, data)
  },

  // Emit to all users (broadcast)
  emitToAll(event: string, data: any) {
    if (!io) return
    io.emit(event, data)
  },

  // Emit leaderboard update
  emitLeaderboardUpdate(data: any) {
    if (!io) return
    io.to('leaderboard').emit('leaderboard:updated', data)
  },
  
  // Emit exam submission
  emitExamSubmission(examId: string, userId: string, fullName: string, score: number) {
    if (!io) return
    // Notify exam room
    io.to(`exam:${examId}`).emit('exam:submission', { 
      userId, 
      fullName, 
      score, 
      timestamp: new Date().toISOString() 
    })
    // Decrement active participants
    io.to(`exam:${examId}`).emit('exam:participant-left', { userId })
  },

  // Emit exam result published
  emitExamResultPublished(userId: string, examId: string, result: any) {
    if (!io) return
    io.to(`user:${userId}`).emit('exam:result-published', { examId, result })
  },

  // Emit new exam available
  emitNewExamAvailable(exam: any) {
    if (!io) return
    io.to('role:student').emit('new_exam_available', exam)
  },

  // Emit new notification to user
  emitNotification(userId: string, notification: any) {
    if (!io) return
    io.to(`user:${userId}`).emit('new_notification', notification)
  },

  // Emit exam status change
  emitExamStatusChange(examId: string, status: string) {
    if (!io) return
    io.to(`exam:${examId}`).emit('exam_status_change', { examId, status })
  },

  // Emit active exam participants count
  emitExamParticipantsCount(examId: string, count: number) {
    if (!io) return
    io.to(`exam:${examId}`).emit('exam_participants_count', { examId, count })
  },
}
