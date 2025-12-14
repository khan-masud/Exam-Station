import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const JWT_EXPIRY = "7d"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string, email: string, role: string, organizationId?: string): string {
  const payload: any = { userId, email, role }
  if (organizationId) {
    payload.organizationId = organizationId
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

export function createToken(userData: { id: string; email: string; role: string; name?: string }): string {
  const payload: any = { 
    userId: userData.id,
    sub: userData.id,
    email: userData.email, 
    role: userData.role,
    name: userData.name
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export function parseTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(" ")
  return parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null
}
