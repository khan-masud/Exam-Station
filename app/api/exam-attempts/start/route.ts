import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { shuffleQuestionOptions } from "@/lib/utils"
import { getProctoringSettings, getExamSettings } from "@/lib/settings"

// Start a new exam attempt
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "student") {
      return NextResponse.json({ error: "Only students can take exams" }, { status: 403 })
    }

    const { examId } = await request.json()

    // ✅ Get exam and proctoring settings
    const [proctoringSettings, examSettings] = await Promise.all([
      getProctoringSettings(),
      getExamSettings()
    ])

    // Get exam details (includes exam instructions)
    const examRows = await query(
      `SELECT e.*, s.name as subject_name, p.instructions as program_instructions
       FROM exams e 
       LEFT JOIN subjects s ON e.subject_id = s.id 
       LEFT JOIN programs p ON e.program_id = p.id
       WHERE e.id = ?`,
      [examId]
    ) as any[]

    const exam = examRows && examRows[0] ? examRows[0] : null

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 })
    }

    // ✅ Get exam control settings directly from exam table
    // (Exam already has copies of program defaults from when it was created)
    const examControls = {
      allow_answer_change: exam.allow_answer_change ?? true,
      show_question_counter: exam.show_question_counter ?? true,
      allow_answer_review: exam.allow_answer_review ?? true,
    }

    // Check if student is enrolled in a program that has this exam assigned
    // Use exam_programs table to check if exam is in any of the student's programs
    const programAccessRows = await query(
      `SELECT DISTINCT pe.program_id 
       FROM exam_programs ep
       INNER JOIN program_enrollments pe ON ep.program_id = pe.program_id
       WHERE ep.exam_id = ? AND pe.user_id = ? AND pe.status = 'active'`,
      [examId, decoded.userId]
    ) as any[]

    if (programAccessRows && programAccessRows.length === 0) {
      return NextResponse.json({ 
        error: "This exam is not available in any of your enrolled programs",
        requiresEnrollment: true
      }, { status: 403 })
    }

    // Check if exam is available
    const examDate = new Date(exam.exam_date)
    const examStartTime = new Date(`${exam.exam_date} ${exam.exam_start_time}`)
    const examEndTime = new Date(`${exam.exam_date} ${exam.exam_end_time}`)
    const now = new Date()

    if (now < examStartTime) {
      return NextResponse.json({ error: "Exam has not started yet" }, { status: 400 })
    }

    if (now > examEndTime) {
      return NextResponse.json({ error: "Exam has ended" }, { status: 400 })
    }

    // ✅ CHECK: Exam attempt limits using admin settings
    const attemptsRows = await query(
      `SELECT COUNT(*) as count FROM exam_attempts 
       WHERE exam_id = ? AND student_id = ? AND status IN ('submitted', 'evaluated')`,
      [examId, decoded.userId]
    ) as any[]

    const currentAttempts = attemptsRows && attemptsRows[0] ? attemptsRows[0] : { count: 0 }

    if (currentAttempts.count >= examSettings.maxExamAttemptsPerStudent) {
      return NextResponse.json({ 
        error: `Maximum attempts (${examSettings.maxExamAttemptsPerStudent}) reached for this exam` 
      }, { status: 403 })
    }

    // ✅ CHECK: Retake cooldown period
    if (currentAttempts.count > 0 && examSettings.allowExamRetake) {
      const lastAttemptRows = await query(
        `SELECT submitted_at FROM exam_attempts 
         WHERE exam_id = ? AND student_id = ? AND status = 'submitted'
         ORDER BY submitted_at DESC LIMIT 1`,
        [examId, decoded.userId]
      ) as any[]

      const lastAttempt = lastAttemptRows && lastAttemptRows[0] ? lastAttemptRows[0] : null

      if (lastAttempt && lastAttempt.submitted_at) {
        const daysSinceLastAttempt = Math.floor(
          (now.getTime() - new Date(lastAttempt.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        
        if (daysSinceLastAttempt < examSettings.retakeCooldownDays) {
          const daysRemaining = examSettings.retakeCooldownDays - daysSinceLastAttempt
          return NextResponse.json({ 
            error: `You must wait ${daysRemaining} more day(s) before retaking this exam` 
          }, { status: 403 })
        }
      }
    }

    // Check if student already has an active attempt
    const existingAttemptRows = await query(
      `SELECT * FROM exam_attempts 
       WHERE exam_id = ? AND student_id = ? AND status = 'ongoing'`,
      [examId, decoded.userId]
    ) as any[]

    const existingAttempt = existingAttemptRows && existingAttemptRows[0] ? existingAttemptRows[0] : null

    if (existingAttempt) {
      // Return existing attempt to resume
      const questions = await query(
        `SELECT q.*, qt.name as question_type_name
         FROM exam_questions eq
         JOIN questions q ON eq.question_id = q.id
         LEFT JOIN question_types qt ON q.question_type_id = qt.id
         WHERE eq.exam_id = ?
         ORDER BY eq.sequence`,
        [examId]
      ) as any[]

      // Fetch options for each question and apply shuffling
      // Get all question IDs first
      const questionIds = questions.map(q => q.id)
      
      if (questionIds.length > 0) {
        // Create placeholders for IN clause
        const placeholders = questionIds.map(() => '?').join(',')
        
        // Fetch all options in a single query (fixes N+1 problem)
        // Added 'id' to ORDER BY to ensure deterministic order for shuffling
        const allOptions = await query(
          `SELECT id, question_id, option_text, option_label, is_correct, sequence
           FROM question_options
           WHERE question_id IN (${placeholders})
           ORDER BY question_id, sequence, id`,
          questionIds
        ) as any[]
        
        // Group options by question_id
        const optionsByQuestion = allOptions.reduce((acc: any, option: any) => {
          if (!acc[option.question_id]) {
            acc[option.question_id] = []
          }
          acc[option.question_id].push(option)
          return acc
        }, {})
        
        // Apply shuffling to each question's options
        for (const question of questions) {
          const options = optionsByQuestion[question.id] || []
          
          // Set default question type if null but has options
          if (!question.question_type_name && options.length > 0) {
            question.question_type_name = 'MCQ'
          }
          
          // ✅ Apply question shuffling based on settings
          question.options = shuffleQuestionOptions(
            options,
            decoded.userId,
            question.id,
            examSettings.shuffleQuestions && (question.randomize_options || false),
            existingAttempt.id // Pass attempt ID for unique shuffle per attempt
          )
        }
      }

      const progress = await query(
        `SELECT * FROM exam_progress WHERE attempt_id = ?`,
        [existingAttempt.id]
      ) as any[]

      // Calculate time spent based on actual exam time
      const startTime = new Date(existingAttempt.start_time)
      const timeSpentSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000)
      
      console.log("[Start API] RESUMING EXAM DEBUG:")
      console.log("  - Attempt ID:", existingAttempt.id)
      console.log("  - Start time:", existingAttempt.start_time)
      console.log("  - Time spent so far:", timeSpentSeconds, "seconds")
      console.log("  - Exam duration:", exam.duration_minutes, "minutes =", exam.duration_minutes * 60, "seconds")

      return NextResponse.json({
        attemptId: existingAttempt.id,
        exam: {
          ...exam,
          proctoring_enabled: exam.proctoring_enabled === 1,
        },
        examControls,
        proctoringSettings,
        examSettings,
        questions,
        progress: progress[0] || null,
        totalTimeSpent: timeSpentSeconds,
        startTime: new Date().toISOString(),
        isResume: true
      })
    }

    // Remove old attempt limit checks (now handled above with settings)
    // Create new attempt - always starts fresh with full duration
    const attemptId = uuidv4()
    const attemptStartTime = new Date()
    const userAgent = request.headers.get("user-agent") || ""
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Get or create exam registration for this student
    const existingRegistrationRows = await query(
      `SELECT id FROM exam_registrations 
       WHERE exam_id = ? AND student_id = ?`,
      [examId, decoded.userId]
    ) as any[]

    const existingRegistration = existingRegistrationRows && existingRegistrationRows[0] ? existingRegistrationRows[0] : null

    let registrationId = existingRegistration?.id
    if (!registrationId) {
      // Create new registration if it doesn't exist
      registrationId = uuidv4()
      await query(
        `INSERT INTO exam_registrations (id, exam_id, student_id, status)
         VALUES (?, ?, ?, 'registered')`,
        [registrationId, examId, decoded.userId]
      )
    }

    // Get current attempt number
    const prevAttemptsRows = await query(
      `SELECT COUNT(*) as count FROM exam_attempts 
       WHERE exam_id = ? AND student_id = ? AND status IN ('submitted', 'evaluated')`,
      [examId, decoded.userId]
    ) as any[]

    const prevAttempts = prevAttemptsRows && prevAttemptsRows[0] ? prevAttemptsRows[0] : { count: 0 }

    await query(
      `INSERT INTO exam_attempts 
       (id, exam_id, student_id, exam_registration_id, start_time, duration_minutes, status, attempt_number, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, 'ongoing', ?, ?, ?)`,
      [
        attemptId,
        examId,
        decoded.userId,
        registrationId,
        attemptStartTime.toISOString().slice(0, 19).replace('T', ' '),
        exam.duration_minutes,
        (prevAttempts.count || 0) + 1,
        ip,
        userAgent
      ]
    )

    // Initialize progress tracker
    await query(
      `INSERT INTO exam_progress (id, attempt_id, current_question_index, answers_json, flagged_questions_json) 
       VALUES (?, ?, 0, '{}', '[]')`,
      [uuidv4(), attemptId]
    )

    // Get questions with options (randomized if configured)
    const questions = await query(
      `SELECT q.*, qt.name as question_type_name
       FROM exam_questions eq
       JOIN questions q ON eq.question_id = q.id
       LEFT JOIN question_types qt ON q.question_type_id = qt.id
       WHERE eq.exam_id = ?
       ORDER BY ${exam.randomize_questions ? 'RAND()' : 'eq.sequence'}`,
      [examId]
    ) as any[]

    // Fetch all options in a single query to avoid N+1 problem
    const questionIds = questions.map(q => q.id)
    
    if (questionIds.length > 0) {
      // Create placeholders for IN clause
      const placeholders = questionIds.map(() => '?').join(',')
      
      const allOptions = await query(
        `SELECT id, question_id, option_text, option_label, is_correct, sequence
         FROM question_options
         WHERE question_id IN (${placeholders})
         ORDER BY question_id, sequence, id`,
        questionIds
      ) as any[]
      
      // Group options by question_id
      const optionsByQuestion = allOptions.reduce((acc: any, option: any) => {
        if (!acc[option.question_id]) {
          acc[option.question_id] = []
        }
        acc[option.question_id].push(option)
        return acc
      }, {})
      
      // Apply deterministic shuffling based on user + question + attempt
      // This ensures the same student always sees options in the same order for a specific attempt
      for (const question of questions) {
        const options = optionsByQuestion[question.id] || []
        
        // Set default question type if null but has options
        if (!question.question_type_name && options.length > 0) {
          question.question_type_name = 'MCQ'
        }
        
        question.options = shuffleQuestionOptions(
          options,
          decoded.userId,
          question.id,
          examSettings.shuffleQuestions && (question.randomize_options || false),
          attemptId // Pass attempt ID for unique shuffle per attempt
        )
      }
    }

    console.log('[Start API] ======== QUESTIONS WITH OPTIONS ========')
    console.log('[Start API] Total questions:', questions.length)
    questions.forEach((q, idx) => {
      console.log(`[Start API] Question ${idx + 1}:`, q.id)
      console.log(`[Start API]   - Type:`, q.question_type_name)
      console.log(`[Start API]   - Has options:`, !!q.options)
      console.log(`[Start API]   - Options count:`, q.options?.length || 0)
      console.log(`[Start API]   - Options:`, q.options)
    })
    console.log('[Start API] =======================================')

    return NextResponse.json({
      attemptId,
      exam: {
        ...exam,
        proctoring_enabled: exam.proctoring_enabled === 1,
      },
      examControls,
      proctoringSettings,
      examSettings,
      questions,
      totalTimeSpent: 0,
      startTime: attemptStartTime.toISOString(),
      isResume: false,
      programInstructions: exam.program_instructions || null,
      examInstructions: exam.instructions || null
    })

  } catch (error: any) {
    console.error("Start exam error:", error)
    return NextResponse.json(
      { error: "Failed to start exam" },
      { status: 500 }
    )
  }
}
