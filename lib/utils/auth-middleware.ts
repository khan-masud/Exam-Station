import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { User } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthenticatedRequest {
  user: User
}

export interface AuthOptions {
  requireAdmin?: boolean
  requireProctor?: boolean
  requireStudent?: boolean
  allowedRoles?: ('admin' | 'proctor' | 'student')[]
}

/**
 * Extract and verify JWT token from cookies
 * Returns the decoded user or null if invalid/missing
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Map JWT payload to User interface (JWT uses userId, but User interface expects id)
    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    } as User
  } catch (error) {
    return null
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 * Usage:
 * 
 * export async function GET(request: NextRequest) {
 *   return withAuth(request, async (user) => {
 *     // Your authenticated route logic here
 *     return NextResponse.json({ data: user })
 *   })
 * }
 */
export async function withAuth(
  request: NextRequest,
  handler: (user: User, request: NextRequest) => Promise<NextResponse>,
  options: AuthOptions = {}
): Promise<NextResponse> {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid token provided' },
        { status: 401 }
      )
    }

    // Check role-based access
    const { requireAdmin, requireProctor, requireStudent, allowedRoles } = options

    if (requireAdmin && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    if (requireProctor && user.role !== 'proctor') {
      return NextResponse.json(
        { error: 'Forbidden - Proctor access required' },
        { status: 403 }
      )
    }

    if (requireStudent && user.role !== 'student') {
      return NextResponse.json(
        { error: 'Forbidden - Student access required' },
        { status: 403 }
      )
    }

    if (allowedRoles && !allowedRoles.includes(user.role as any)) {
      return NextResponse.json(
        { error: `Forbidden - Allowed roles: ${allowedRoles.join(', ')}` },
        { status: 403 }
      )
    }

    // Call the handler with the authenticated user
    return await handler(user, request)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { error: 'Unauthorized - Token expired' },
        { status: 401 }
      )
    }

    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Helper specifically for admin routes
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (user: User, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, handler, { requireAdmin: true })
}

/**
 * Helper specifically for proctor routes
 */
export async function withProctorAuth(
  request: NextRequest,
  handler: (user: User, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, handler, { requireProctor: true })
}

/**
 * Helper specifically for student routes
 */
export async function withStudentAuth(
  request: NextRequest,
  handler: (user: User, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, handler, { requireStudent: true })
}

/**
 * Extract user ID from authenticated request
 * Use this for quick user ID extraction without full auth check
 */
export async function getUserId(): Promise<number | null> {
  const user = await getAuthUser()
  return user?.id ? Number(user.id) : null
}

/**
 * Check if current user has a specific role
 */
export async function hasRole(role: 'admin' | 'proctor' | 'student'): Promise<boolean> {
  const user = await getAuthUser()
  return user?.role === role
}

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser()
  return user !== null
}
