import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"

// Auto-save answers (called periodically during exam)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { attemptId, answers, currentQuestionIndex, flaggedQuestions } = await request.json()

    // Verify attempt belongs to user
    const attemptRows = await query(
      `SELECT * FROM exam_attempts WHERE id = ? AND student_id = ?`,
      [attemptId, decoded.userId]
    ) as any[]

    const attempt = attemptRows && attemptRows[0] ? attemptRows[0] : null

    if (!attempt) {
      return NextResponse.json({ error: "Invalid attempt" }, { status: 404 })
    }

    if (attempt.status !== 'ongoing') {
      return NextResponse.json({ error: "Exam already submitted" }, { status: 400 })
    }

    // Update progress
    await query(
      `UPDATE exam_progress 
       SET current_question_index = ?, 
           answers_json = ?, 
           flagged_questions_json = ?,
           last_saved_at = NOW()
       WHERE attempt_id = ?`,
      [
        currentQuestionIndex,
        JSON.stringify(answers),
        JSON.stringify(flaggedQuestions),
        attemptId
      ]
    )

    // Save individual answers
    for (const [questionId, answer] of Object.entries(answers)) {
      const existingAnswerRows = await query(
        `SELECT id FROM exam_answers WHERE attempt_id = ? AND question_id = ?`,
        [attemptId, questionId]
      ) as any[]

      const existingAnswer = existingAnswerRows && existingAnswerRows[0] ? existingAnswerRows[0] : null

      if (existingAnswer) {
        // Update existing answer
        await query(
          `UPDATE exam_answers 
           SET answer_text = ?, updated_at = NOW() 
           WHERE attempt_id = ? AND question_id = ?`,
          [answer, attemptId, questionId]
        )
      } else {
        // Insert new answer
        const answerId = require('uuid').v4()
        await query(
          `INSERT INTO exam_answers (id, attempt_id, question_id, answer_text, created_at) 
           VALUES (?, ?, ?, ?, NOW())`,
          [answerId, attemptId, questionId, answer]
        )
      }
    }

    return NextResponse.json({ success: true, savedAt: new Date() })

  } catch (error: any) {
    console.error("Auto-save error:", error)
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    )
  }
}
