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

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subject_id')
    const examId = searchParams.get('exam_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let sql = `
      SELECT 
        q.id,
        q.question_text,
        q.question_type_id,
        q.difficulty_level,
        q.marks,
        q.negative_marks,
        q.allow_multiple_answers,
        q.randomize_options,
        q.explanation,
        q.time_limit,
        q.topics,
        q.question_image,
        qt.name as question_type_name,
        s.name as subject_name,
        s.id as subject_id,
        q.created_at
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE 1=1
    `
    
    const params: any[] = []
    
    if (subjectId) {
      sql += ` AND q.subject_id = ?`
      params.push(subjectId)
    }
    
    if (examId) {
      sql += ` AND q.id IN (SELECT question_id FROM exam_questions WHERE exam_id = ?)`
      params.push(examId)
    }
    
    // Get total count
    const countSql = sql.replace(/SELECT .+ FROM/, 'SELECT COUNT(q.id) as total FROM')
    const [countResult]: any = await query(countSql, params)
    const total = countResult?.total || 0
    
    sql += ` ORDER BY q.created_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const questions: any = await query(sql, params)
    
    console.log('[Questions API] GET - Sample question:', questions?.[0] ? {
      id: questions[0].id?.substring?.(0, 8),
      hasTopics: 'topics' in questions[0],
      topicsValue: questions[0].topics,
      topicsType: typeof questions[0].topics
    } : 'No questions')
    
    // Fetch options for each question
    for (const question of questions) {
      const optionsSql = `
        SELECT id, option_text, option_label, is_correct
        FROM question_options
        WHERE question_id = ?
        ORDER BY sequence
      `
      const options: any = await query(optionsSql, [question.id])
      question.options = options || []
    }

    return NextResponse.json({ 
      questions: questions || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("[v0] Fetch questions error:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
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
      question_type_id,
      question_text,
      difficulty_level,
      marks,
      negative_marks,
      allow_multiple_answers,
      randomize_options,
      explanation,
      time_limit,
      options,
      topics,
      question_image
    } = body

    console.log('[Questions API] POST received topics:', topics)
    console.log('[Questions API] POST received image:', question_image ? 'yes (base64)' : 'no')

    // Validation
    if (!question_text || !question_type_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const questionId = uuidv4()

    // Convert selectedTopics array to comma-separated string
    let topicsString = null
    if (topics && Array.isArray(topics) && topics.length > 0) {
      topicsString = topics.join(", ")
      console.log('[Questions API] Topics string created:', topicsString)
    }

    const sql = `
      INSERT INTO questions (
        id, organization_id, subject_id, created_by, question_type_id,
        question_text, difficulty_level, marks, negative_marks,
        allow_multiple_answers, randomize_options, explanation, time_limit, topics, question_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    await query(sql, [
      questionId,
      organization_id || null,
      subject_id || null,
      decoded.userId,
      question_type_id,
      question_text,
      difficulty_level || 'medium',
      marks || 1,
      negative_marks || 0,
      allow_multiple_answers || false,
      randomize_options || false,
      explanation || null,
      time_limit || null,
      topicsString,
      question_image || null
    ])

    console.log('[Questions API] Question inserted with ID:', questionId, 'Topics:', topicsString)

    // If options are provided (for MCQ type questions), insert them
    if (options && Array.isArray(options) && options.length > 0) {
      for (let i = 0; i < options.length; i++) {
        const option = options[i]
        const optionId = uuidv4()
        const optionSql = `
          INSERT INTO question_options (id, question_id, option_text, option_label, is_correct, sequence)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        await query(optionSql, [
          optionId,
          questionId,
          option.option_text || option.text,
          option.option_label || option.label || null,
          option.is_correct || false,
          i
        ])
      }
    }

    return NextResponse.json({ message: "Question created successfully", questionId }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create question error:", error)
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
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
      question_text, 
      difficulty_level, 
      marks, 
      negative_marks,
      allow_multiple_answers,
      randomize_options,
      explanation,
      time_limit,
      options,
      subject_id,
      question_type_id,
      topics,
      question_image
    } = body

    console.log('[Questions API] PUT received topics:', topics)
    console.log('[Questions API] PUT received image:', question_image ? 'yes (base64)' : 'no')

    if (!id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 })
    }

    // Convert selectedTopics array to comma-separated string
    let topicsString = null
    if (topics && Array.isArray(topics) && topics.length > 0) {
      topicsString = topics.join(", ")
      console.log('[Questions API] Topics string created:', topicsString)
    }

    const sql = `
      UPDATE questions 
      SET question_text = ?, 
          difficulty_level = ?, 
          marks = ?,
          negative_marks = ?,
          allow_multiple_answers = ?,
          randomize_options = ?,
          explanation = ?,
          time_limit = ?,
          subject_id = ?,
          question_type_id = ?,
          topics = ?,
          question_image = ?
      WHERE id = ?
    `
    await query(sql, [
      question_text, 
      difficulty_level, 
      marks,
      negative_marks,
      allow_multiple_answers,
      randomize_options,
      explanation,
      time_limit,
      subject_id,
      question_type_id,
      topicsString,
      question_image || null,
      id
    ])

    // Update options if provided
    if (options && Array.isArray(options)) {
      // Delete existing options
      await query(`DELETE FROM question_options WHERE question_id = ?`, [id])
      
      // Insert new options
      for (let i = 0; i < options.length; i++) {
        const option = options[i]
        const optionId = option.id || uuidv4()
        const optionSql = `
          INSERT INTO question_options (id, question_id, option_text, option_label, is_correct, sequence)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        await query(optionSql, [
          optionId,
          id,
          option.option_text || option.text,
          option.option_label || option.label || null,
          option.is_correct || false,
          i
        ])
      }
    }

    return NextResponse.json({ message: "Question updated successfully" })
  } catch (error) {
    console.error("Update question error:", error)
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
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
    const questionId = searchParams.get('id')

    if (!questionId) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 })
    }

    // Delete question options first (if any)
    await query(`DELETE FROM question_options WHERE question_id = ?`, [questionId])
    // Delete question
    await query(`DELETE FROM questions WHERE id = ?`, [questionId])

    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Delete question error:", error)
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
  }
}
