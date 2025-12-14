const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRY = '7d'

async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

function generateToken(userId, email, role) {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

function parseTokenFromHeader(authHeader) {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  parseTokenFromHeader,
}
