import { hashPassword } from "@/lib/auth"
import { validateEmail, validatePassword } from "@/lib/utils/validators"
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { canUserRegister, isEmailVerificationRequired, getPasswordPolicy, isAdminApprovalRequired } from "@/lib/settings"
import { createNotification } from "@/lib/notification-service"

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, organization_name, role } = await req.json()

    // ✅ CHECK: Is self-registration allowed?
    const registrationAllowed = await canUserRegister()
    if (!registrationAllowed) {
      return NextResponse.json({ 
        error: "Self-registration is currently disabled. Please contact an administrator." 
      }, { status: 403 })
    }

    // Validation
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // ✅ CHECK: Apply password policy from settings
    const passwordPolicy = await getPasswordPolicy()
    if (password.length < passwordPolicy.minLength) {
      return NextResponse.json({ 
        error: `Password must be at least ${passwordPolicy.minLength} characters long` 
      }, { status: 400 })
    }

    if (passwordPolicy.requireStrong) {
      const hasUpper = /[A-Z]/.test(password)
      const hasLower = /[a-z]/.test(password)
      const hasNumber = /[0-9]/.test(password)
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
      
      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        return NextResponse.json({ 
          error: "Password must include uppercase letter, lowercase letter, number, and special character" 
        }, { status: 400 })
      }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: "Password requirements not met", details: passwordValidation.errors },
        { status: 400 },
      )
    }

    // Check if user already exists in MySQL database
    const existingUsers: any = await query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email])
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const password_hash = await hashPassword(password)

    const userId = uuidv4()

    // ✅ CHECK: Determine user status based on settings
    const requiresAdminApproval = await isAdminApprovalRequired()
    const requiresEmailVerification = await isEmailVerificationRequired()
    
    let userStatus = 'active' // Users are active by default
    if (requiresAdminApproval) {
      userStatus = 'pending' // Awaiting admin approval
    }
    // Note: Email verification is tracked separately and doesn't affect account status

    // Create user in MySQL database
    const userRole = role === "admin" ? "admin" : role === "proctor" ? "proctor" : role === "teacher" ? "teacher" : "student"
    const insertUserSql = `
      INSERT INTO users (id, email, password_hash, full_name, role, status, email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    await query(insertUserSql, [
      userId, 
      email, 
      password_hash, 
      full_name, 
      userRole, 
      userStatus,
      false // Email is not verified by default
    ])

    // If organization name provided and user is admin, create organization
    if (organization_name && userRole === "admin") {
      const orgId = uuidv4()
      const orgSlug = organization_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const insertOrgSql = `
        INSERT INTO organizations (id, name, slug, subscription_plan, subscription_status)
        VALUES (?, ?, ?, 'free', 'active')
      `
      
      try {
        await query(insertOrgSql, [orgId, organization_name, orgSlug])
        
        // Link admin to organization
        const memberId = uuidv4()
        const insertMemberSql = `
          INSERT INTO organization_members (id, organization_id, user_id, role)
          VALUES (?, ?, ?, 'owner')
        `
        await query(insertMemberSql, [memberId, orgId, userId])
      } catch (err) {
        console.warn('[v0] Organization creation warning:', err)
      }
    }

    // Send welcome notification to new user
    try {
      await createNotification({
        recipientId: userId,
        type: 'system_announcement',
        title: '🎉 Welcome to the Exam System!',
        message: `Hi ${full_name}! Welcome aboard. You can now browse exams, enroll in programs, and track your progress. Let's get started!`,
        link: userRole === 'student' ? '/student/dashboard' : '/admin/dashboard'
      })
    } catch (notifError) {
      console.error('Failed to send welcome notification:', notifError)
      // Don't fail registration if notification fails
    }

    // Determine response message based on status
    let message = "User registered successfully. You can now login."
    if (requiresAdminApproval) {
      message = "Registration submitted. Your account is pending admin approval."
    } else if (requiresEmailVerification) {
      message = "Registration successful. Please verify your email, but you can login immediately."
    }

    return NextResponse.json({ 
      message,
      requiresVerification: requiresEmailVerification,
      requiresApproval: requiresAdminApproval
    }, { status: 201 })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json(
      { error: "Registration failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
