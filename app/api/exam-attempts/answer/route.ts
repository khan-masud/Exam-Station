import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Submit/Save answer for a question
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      console.error("[Answer API] No auth token found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "student") {
      console.error("[Answer API] Invalid user or not a student")
      return NextResponse.json({ error: "Only students can submit answers" }, { status: 403 })
    }

    const { attemptId, questionId, answerText, selectedOption, timeSpent, isFlagged } = await request.json()

    // Verify attempt belongs to student
    const attemptRows = await query(
      `SELECT * FROM exam_attempts WHERE id = ? AND student_id = ?`,
      [attemptId, decoded.userId]
    ) as any[]

    const attempt = attemptRows && attemptRows[0] ? attemptRows[0] : null

    if (!attempt) {
      console.error("[Answer API] Attempt not found or doesn't belong to user:", attemptId)
      return NextResponse.json({ error: "Invalid attempt" }, { status: 404 })
    }

    if (attempt.status !== 'ongoing') {
      console.error("[Answer API] Exam not ongoing, status:", attempt.status)
      return NextResponse.json({ error: "Exam already submitted" }, { status: 400 })
    }

    // Get question details for validation - questions are linked via exam_questions table
    const examQuestionRows = await query(
      `SELECT eq.*, q.* FROM exam_questions eq
       JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = ? AND eq.question_id = ?`,
      [attempt.exam_id, questionId]
    ) as any[]

    const examQuestion = examQuestionRows && examQuestionRows[0] ? examQuestionRows[0] : null

    if (!examQuestion) {
      console.error("[Answer API] Question not found in exam:", questionId, "exam:", attempt.exam_id)
      return NextResponse.json({ error: "Invalid question" }, { status: 404 })
    }

    // Check if answer already exists (update vs insert)
    const existingAnswerRows = await query(
      `SELECT * FROM exam_answers WHERE attempt_id = ? AND question_id = ?`,
      [attemptId, questionId]
    ) as any[]

    const existingAnswer = existingAnswerRows && existingAnswerRows[0] ? existingAnswerRows[0] : null
    const answerId = existingAnswer?.id || uuidv4()

    if (existingAnswer) {
      // Update existing answer
      await query(
        `UPDATE exam_answers 
         SET answer_text = ?, selected_option = ?, is_flagged = ?, time_spent_seconds = ?
         WHERE id = ?`,
        [answerText || null, selectedOption !== undefined && selectedOption !== null ? selectedOption : null, isFlagged || false, timeSpent || 0, answerId]
      )
    } else {
      // Insert new answer
      await query(
        `INSERT INTO exam_answers 
         (id, attempt_id, question_id, answer_text, selected_option, is_flagged, time_spent_seconds) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [answerId, attemptId, questionId, answerText || null, selectedOption !== undefined && selectedOption !== null ? selectedOption : null, isFlagged || false, timeSpent || 0]
      )
    }

    // Update exam progress (current question, total time spent)
    // Frontend sends total elapsed time from server start, so we can just update directly
    await query(
      `UPDATE exam_attempts 
       SET total_time_spent = ?
       WHERE id = ?`,
      [timeSpent || 0, attemptId]
    )

    return NextResponse.json({
      success: true,
      answerId,
      message: "Answer saved successfully"
    })

  } catch (error: any) {
    console.error("[Answer API] ERROR:", error.message, error.stack)
    return NextResponse.json(
      { error: "Failed to save answer", details: error.message },
      { status: 500 }
    )
  }
}

// Get all answers for an attempt (for review)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get("attemptId")

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID required" }, { status: 400 })
    }

    // Verify access
    const attemptRows2 = await query(
      `SELECT * FROM exam_attempts WHERE id = ?`,
      [attemptId]
    ) as any[]

    const attempt2 = attemptRows2 && attemptRows2[0] ? attemptRows2[0] : null

    if (!attempt2) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    // Only allow student to see their own answers, or admin/proctor
    if (decoded.role === 'student' && attempt2.student_id !== decoded.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const answers = await query(
      `SELECT ea.*, q.question_text, q.question_type, q.correct_answer
       FROM exam_answers ea
       JOIN questions q ON ea.question_id = q.id
       WHERE ea.attempt_id = ?
       ORDER BY q.id`,
      [attemptId]
    ) as any[]

    return NextResponse.json({ answers })

  } catch (error: any) {
    console.error("Get answers error:", error)
    return NextResponse.json(
      { error: "Failed to fetch answers" },
      { status: 500 }
    )
  }
}
