const { Server: SocketIOServer } = require('socket.io')
const { verifyToken } = require('./auth')

let io = null

function initSocket(server) {
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
    socket.on('authenticate', (token) => {
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
    socket.on('join_exam', (examId) => {
      if (socket.data.userId) {
        socket.join(`exam:${examId}`)
        console.log(`User ${socket.data.userId} joined exam ${examId}`)
      }
    })

    // Leave exam room
    socket.on('leave_exam', (examId) => {
      socket.leave(`exam:${examId}`)
      console.log(`User ${socket.data.userId} left exam ${examId}`)
    })

    // Proctor monitoring events
    socket.on('proctor_join', (examId) => {
      if (socket.data.role === 'admin' || socket.data.role === 'proctor') {
        socket.join(`proctor:${examId}`)
        console.log(`Proctor ${socket.data.userId} monitoring exam ${examId}`)
      }
    })

    socket.on('student_activity', (data) => {
      const { examId, activity } = data
      // Broadcast to proctors monitoring this exam
      socket.to(`proctor:${examId}`).emit('activity_update', {
        userId: socket.data.userId,
        activity,
        timestamp: new Date(),
      })
    })

    // Anti-cheat alerts
    socket.on('cheat_alert', (data) => {
      const { examId, type, severity, details } = data
      // Notify proctors immediately
      io.to(`proctor:${examId}`).emit('cheat_detected', {
        userId: socket.data.userId,
        type,
        severity,
        details,
        timestamp: new Date(),
      })
      console.warn(`Cheat alert: User ${socket.data.userId} in exam ${examId} - ${type}`)
    })

    // Exam status updates
    socket.on('exam_update', (data) => {
      const { examId, update } = data
      // Broadcast to all users in the exam
      socket.to(`exam:${examId}`).emit('exam_updated', update)
    })

    // Notification system
    socket.on('send_notification', (data) => {
      const { userId, notification } = data
      if (socket.data.role === 'admin') {
        io.to(`user:${userId}`).emit('notification', notification)
      }
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  console.log('✅ Socket.io server initialized')
  return io
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket first.')
  }
  return io
}

module.exports = {
  initSocket,
  getIO,
}
