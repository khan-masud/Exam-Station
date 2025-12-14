import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Autosave exam progress (heartbeat + save answers)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      console.error("[Autosave API] No auth token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "student") {
      console.error("[Autosave API] Invalid user or not student")
      return NextResponse.json({ error: "Only students can autosave" }, { status: 403 })
    }

    const { attemptId, currentQuestion, answers, flaggedQuestions, timeSpent } = await request.json()
    console.log("[Autosave API] Received:", { attemptId, currentQuestion, answersCount: Object.keys(answers || {}).length, flaggedCount: (flaggedQuestions || []).length, timeSpent })

    // Verify attempt
    const attemptRows = await query(
      `SELECT * FROM exam_attempts WHERE id = ? AND student_id = ?`,
      [attemptId, decoded.userId]
    ) as any[]

    const attempt = attemptRows && attemptRows[0] ? attemptRows[0] : null

    if (!attempt) {
      console.error("[Autosave API] Attempt not found:", attemptId)
      return NextResponse.json({ error: "Invalid attempt" }, { status: 404 })
    }

    if (attempt.status !== 'ongoing') {
      console.error("[Autosave API] Exam not ongoing, status:", attempt.status)
      return NextResponse.json({ error: "Exam already submitted" }, { status: 400 })
    }

    // Update or create progress
    const progressRows = await query(
      `SELECT * FROM exam_progress WHERE attempt_id = ?`,
      [attemptId]
    ) as any[]

    const existingProgress = progressRows && progressRows[0] ? progressRows[0] : null

    const progressData = {
      currentQuestion,
      answers,
      lastSaved: new Date().toISOString()
    }

    if (existingProgress) {
      console.log("[Autosave API] Updating existing progress")
      await query(
        `UPDATE exam_progress 
         SET current_question_index = ?, answers_json = ?, flagged_questions_json = ?, last_saved_at = NOW()
         WHERE attempt_id = ?`,
        [currentQuestion || 0, JSON.stringify(answers || {}), JSON.stringify(flaggedQuestions || []), attemptId]
      )
    } else {
      console.log("[Autosave API] Inserting new progress")
      const progressId = uuidv4()
      await query(
        `INSERT INTO exam_progress (id, attempt_id, current_question_index, answers_json, flagged_questions_json) 
         VALUES (?, ?, ?, ?, ?)`,
        [progressId, attemptId, currentQuestion || 0, JSON.stringify(answers || {}), JSON.stringify(flaggedQuestions || [])]
      )
    }

    // Update time spent
    if (timeSpent !== undefined && timeSpent !== null) {
      console.log("[Autosave API] Updating time spent:", timeSpent)
      await query(
        `UPDATE exam_attempts SET total_time_spent = ? WHERE id = ?`,
        [timeSpent, attemptId]
      )
    }

    console.log("[Autosave API] Success")
    return NextResponse.json({ 
      success: true,
      message: "Progress saved",
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("[Autosave API] ERROR:", error.message, error.stack)
    return NextResponse.json(
      { error: "Failed to save progress", details: error.message },
      { status: 500 }
    )
  }
}

// Get saved session to resume
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      console.error("[Autosave GET] No auth token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      console.error("[Autosave GET] Invalid token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get("attemptId")

    if (!attemptId) {
      console.error("[Autosave GET] No attempt ID provided")
      return NextResponse.json({ error: "Attempt ID required" }, { status: 400 })
    }

    console.log("[Autosave GET] Fetching progress for attempt:", attemptId)

    const progressRows = await query(
      `SELECT * FROM exam_progress WHERE attempt_id = ?`,
      [attemptId]
    ) as any[]

    const progress = progressRows && progressRows[0] ? progressRows[0] : null

    // Fetch actual saved answers from exam_answers table
    const answersRows = await query(
      `SELECT question_id, answer_text, selected_option FROM exam_answers WHERE attempt_id = ?`,
      [attemptId]
    ) as any[]

    const savedAnswers: Record<string, any> = {}
    if (answersRows) {
      answersRows.forEach((row: any) => {
        savedAnswers[row.question_id] = {
          answerText: row.answer_text || undefined,
          selectedOption: row.selected_option !== null ? row.selected_option : undefined
        }
      })
    }

    console.log("[Autosave GET] Found answers:", { count: Object.keys(savedAnswers).length, answers: savedAnswers })

    const progressData = {
      currentQuestion: progress?.current_question_index || 0,
      answers: Object.keys(savedAnswers).length > 0 ? savedAnswers : (progress?.answers_json ? JSON.parse(progress.answers_json) : {}),
      flaggedQuestions: progress?.flagged_questions_json ? JSON.parse(progress.flagged_questions_json) : []
    }

    console.log("[Autosave GET] Returning progress:", { currentQuestion: progressData.currentQuestion, answersCount: Object.keys(progressData.answers).length, flaggedCount: progressData.flaggedQuestions.length })

    return NextResponse.json({ progressData })
  } catch (error: any) {
    console.error("[Autosave GET] ERROR:", error.message, error.stack)
    return NextResponse.json(
      { error: "Failed to get session", details: error.message },
      { status: 500 }
    )
  }
}
