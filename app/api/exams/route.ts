import { type NextRequest, NextResponse } from "next/server"
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
    const limit = parseInt(searchParams.get('limit') || '100') // Increased default
    const offset = (page - 1) * limit

    // Get total count - simplified
    const [countResult]: any = await query(`
      SELECT COUNT(*) as total FROM exams
    `)
    const total = countResult?.total || 0

    // Fetch exams - simplified query for better performance
    const exams: any = await query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.instructions,
        e.duration_minutes,
        e.total_questions,
        e.total_marks,
        e.exam_date,
        e.exam_start_time,
        e.exam_end_time,
        e.status,
        e.proctoring_enabled,
        e.anti_cheat_enabled,
        s.name as subject_name,
        p.title as program_name,
        (SELECT COUNT(DISTINCT user_id) 
         FROM program_enrollments 
         WHERE program_id = e.program_id AND status = 'active') as students_registered
      FROM exams e
      LEFT JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN programs p ON e.program_id = p.id
      ORDER BY e.exam_date DESC, e.exam_start_time DESC
      LIMIT ? OFFSET ?
    `, [limit, offset])

    return NextResponse.json({ 
      exams: exams || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Fetch exams error:", error)
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 })
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
    const {
      organization_id,
      subject_id,
      program_id,
      title,
      description,
      instructions,
      exam_type,
      duration_minutes,
      total_questions,
      total_marks,
      passing_percentage,
      passing_marks,
      exam_date,
      exam_start_time,
      exam_end_time,
      proctoring_enabled,
      anti_cheat_enabled,
      allow_answer_change,
      show_question_counter,
      allow_answer_review,
      status,
      negative_marking
    } = body

    // Validation
    if (!title || !duration_minutes || !total_questions || !total_marks || !exam_date || !exam_start_time || !exam_end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use organization_id from token if not provided in request
    const finalOrganizationId = organization_id || decoded.organizationId
    
    if (!finalOrganizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
    }

    const examId = uuidv4()
    
    // If program_id is provided, fetch program settings to use as defaults
    let programDefaults = {
      proctoring_enabled: false,
      allow_answer_change: true,
      show_question_counter: true,
      allow_answer_review: true,
    }
    
    if (program_id) {
      try {
        const programRows: any = await query(
          `SELECT proctoring_enabled, allow_answer_change, show_question_counter, allow_answer_review 
           FROM programs WHERE id = ?`,
          [program_id]
        )
        if (programRows && programRows[0]) {
          programDefaults = {
            proctoring_enabled: programRows[0].proctoring_enabled || false,
            allow_answer_change: programRows[0].allow_answer_change ?? true,
            show_question_counter: programRows[0].show_question_counter ?? true,
            allow_answer_review: programRows[0].allow_answer_review ?? true,
          }
        }
      } catch (err) {
        console.error('Failed to fetch program settings:', err)
      }
    }
    
    // Use provided values or fall back to program defaults
    const finalProctoring = proctoring_enabled !== undefined ? proctoring_enabled : programDefaults.proctoring_enabled
    const finalAllowAnswerChange = allow_answer_change !== undefined ? allow_answer_change : programDefaults.allow_answer_change
    const finalShowCounter = show_question_counter !== undefined ? show_question_counter : programDefaults.show_question_counter
    const finalAllowReview = allow_answer_review !== undefined ? allow_answer_review : programDefaults.allow_answer_review
    
    const sql = `
      INSERT INTO exams (
        id, organization_id, created_by, subject_id, program_id, title, description, instructions,
        exam_type, duration_minutes, total_questions, total_marks, passing_percentage, passing_marks,
        exam_date, exam_start_time, exam_end_time, proctoring_enabled, anti_cheat_enabled, 
        allow_answer_change, show_question_counter, allow_answer_review, status, negative_marking
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    await query(sql, [
      examId,
      finalOrganizationId,
      decoded.userId,
      subject_id || null,
      program_id || null,
      title,
      description || null,
      instructions || null,
      exam_type || 'online',
      duration_minutes,
      total_questions,
      total_marks,
      passing_percentage || 40,
      passing_marks || 40,
      exam_date,
      exam_start_time,
      exam_end_time,
      finalProctoring ? 1 : 0,
      anti_cheat_enabled || true,
      finalAllowAnswerChange ? 1 : 0,
      finalShowCounter ? 1 : 0,
      finalAllowReview ? 1 : 0,
      status || 'draft',
      negative_marking || 0.25
    ])

    return NextResponse.json({ message: "Exam created successfully", examId }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create exam error:", error)
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 })
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
    const { 
      id, 
      title, 
      description, 
      duration_minutes, 
      total_questions, 
      total_marks, 
      exam_date, 
      exam_start_time, 
      exam_end_time, 
      status,
      proctoring_enabled,
      allow_answer_change,
      show_question_counter,
      allow_answer_review,
      negative_marking,
      passing_marks
    } = body

    if (!id) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 })
    }

    let sql = `UPDATE exams SET `
    const params: any[] = []
    const updates: string[] = []

    if (title) {
      updates.push(`title = ?`)
      params.push(title)
    }
    if (description !== undefined) {
      updates.push(`description = ?`)
      params.push(description)
    }
    if (duration_minutes) {
      updates.push(`duration_minutes = ?`)
      params.push(duration_minutes)
    }
    if (total_questions) {
      updates.push(`total_questions = ?`)
      params.push(total_questions)
    }
    if (total_marks) {
      updates.push(`total_marks = ?`)
      params.push(total_marks)
    }
    if (exam_date) {
      updates.push(`exam_date = ?`)
      params.push(exam_date)
    }
    if (exam_start_time) {
      updates.push(`exam_start_time = ?`)
      params.push(exam_start_time)
    }
    if (exam_end_time) {
      updates.push(`exam_end_time = ?`)
      params.push(exam_end_time)
    }
    if (status !== undefined) {
      updates.push(`status = ?`)
      params.push(status)
    }
    if (proctoring_enabled !== undefined) {
      updates.push(`proctoring_enabled = ?`)
      params.push(proctoring_enabled ? 1 : 0)
    }
    if (allow_answer_change !== undefined) {
      updates.push(`allow_answer_change = ?`)
      params.push(allow_answer_change ? 1 : 0)
    }
    if (show_question_counter !== undefined) {
      updates.push(`show_question_counter = ?`)
      params.push(show_question_counter ? 1 : 0)
    }
    if (allow_answer_review !== undefined) {
      updates.push(`allow_answer_review = ?`)
      params.push(allow_answer_review ? 1 : 0)
    }
    if (negative_marking !== undefined) {
      updates.push(`negative_marking = ?`)
      params.push(negative_marking)
    }
    if (passing_marks !== undefined) {
      updates.push(`passing_marks = ?`)
      params.push(passing_marks)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    sql += updates.join(', ') + ` WHERE id = ?`
    params.push(id)

    await query(sql, params)

    return NextResponse.json({ message: "Exam updated successfully" })
  } catch (error) {
    console.error("Update exam error:", error)
    return NextResponse.json({ error: "Failed to update exam" }, { status: 500 })
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
    const examId = searchParams.get('id')

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 })
    }

    await query(`DELETE FROM exams WHERE id = ?`, [examId])

    return NextResponse.json({ message: "Exam deleted successfully" })
  } catch (error) {
    console.error("Delete exam error:", error)
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 })
  }
}
