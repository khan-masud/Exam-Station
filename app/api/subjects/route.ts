import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken, parseTokenFromHeader } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const authHeader = req.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = req.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get pagination parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100') // Increased default for admin
    const offset = (page - 1) * limit

    // Get total count - simple and fast
    const [countResult]: any = await query(`
      SELECT COUNT(*) as total FROM subjects
    `)
    const total = countResult?.total || 0

    // Fetch subjects with stats
    const subjects: any = await query(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.created_at,
        COUNT(DISTINCT q.id) as total_questions,
        COUNT(DISTINCT e.id) as total_exams
      FROM subjects s
      LEFT JOIN questions q ON s.id = q.subject_id
      LEFT JOIN exams e ON s.id = e.subject_id
      GROUP BY s.id
      ORDER BY s.name ASC
      LIMIT ? OFFSET ?
    `, [limit, offset])

    return NextResponse.json({ 
      subjects: subjects || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Fetch subjects error:", error)
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const authHeader = request.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = request.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { organization_id, name, description } = body

    // Validation
    if (!name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 })
    }

    const subjectId = uuidv4()

    const sql = `
      INSERT INTO subjects (id, organization_id, name, description)
      VALUES (?, ?, ?, ?)
    `

    await query(sql, [subjectId, organization_id || null, name, description || null])

    return NextResponse.json({ message: "Subject created successfully", subjectId }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create subject error:", error)
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = request.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description } = body

    if (!id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 })
    }

    const sql = `UPDATE subjects SET name = ?, description = ? WHERE id = ?`
    await query(sql, [name, description || null, id])

    return NextResponse.json({ message: "Subject updated successfully" })
  } catch (error) {
    console.error("Update subject error:", error)
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = request.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('id')

    if (!subjectId) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 })
    }

    await query(`DELETE FROM subjects WHERE id = ?`, [subjectId])

    return NextResponse.json({ message: "Subject deleted successfully" })
  } catch (error) {
    console.error("Delete subject error:", error)
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 })
  }
}
