import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { getExamSettings } from '@/lib/settings'
import { shuffleQuestionOptions } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Await params before destructuring
    let resultId: string
    try {
      const { id } = await params
      resultId = id
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (!resultId) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 })
    }

    const userId = decoded.userId

    // Get exam result with exam details
    let resultRows: any[] = []
    try {
      resultRows = await query(
        `SELECT 
          er.*,
          e.title as exam_title,
          e.total_marks,
          e.passing_percentage,
          e.passing_marks,
          e.duration_minutes,
          e.randomize_options,
          s.name as subject_name,
          u.full_name as student_name
         FROM exam_results er
         JOIN exams e ON er.exam_id = e.id
         LEFT JOIN subjects s ON e.subject_id = s.id
         LEFT JOIN users u ON er.student_id = u.id
         WHERE er.id = ? AND er.student_id = ?`,
        [resultId, userId]
      ) as any[]
    } catch (queryError) {
      throw new Error(`Database query failed: ${queryError}`)
    }
    console.timeEnd('[Results API] Fetch exam result')

    if (!Array.isArray(resultRows) || resultRows.length === 0) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 })
    }

    const result = resultRows[0]

    // Get attempt details (if attempt_id exists)
    let attempt: any = {}
    if (result.attempt_id) {
      try {
        const attemptRows = await query(
          `SELECT * FROM exam_attempts WHERE id = ?`,
          [result.attempt_id]
        ) as any[]
        attempt = Array.isArray(attemptRows) && attemptRows.length > 0 ? attemptRows[0] : {}
      } catch (error) {
        // Silently handle attempt fetch errors
      }
    }

    // Calculate time spent
    const timeSpentSeconds = (attempt && attempt.total_time_spent) || (result && result.time_spent) || 0
    const timeSpentMinutes = Math.floor(timeSpentSeconds / 60)
    const timeSpentHours = Math.floor(timeSpentMinutes / 60)
    const timeSpentMins = timeSpentMinutes % 60
    const timeSpent = timeSpentHours > 0 
      ? `${timeSpentHours}h ${timeSpentMins}m`
      : `${timeSpentMins}m`

        // Build response first (fast track)
    const response = {
      id: result.id,
      attemptId: result.attempt_id,
      examId: result.exam_id,
      examTitle: result.exam_title,
      subjectName: result.subject_name,
      studentName: result.student_name,
      attemptDate: result.result_date,
      status: result.status,
      
      // Score details
      scoreObtained: result.obtained_marks || 0,
      totalScore: result.total_marks,
      passingScore: result.passing_percentage,
      passingMarks: result.passing_marks || 40,
      percentage: result.percentage || 0,
      result: (result.obtained_marks || 0) >= (result.passing_marks || 40) ? 'Pass' : 'Fail',
      
      // Answer statistics
      correctAnswers: result.correct_answers || 0,
      wrongAnswers: result.incorrect_answers || 0,
      unanswered: result.unanswered || 0,
      totalQuestions: (result.correct_answers || 0) + (result.incorrect_answers || 0) + (result.unanswered || 0),
      
      // Negative Marking
      negativeMarkingApplied: result.negative_marking_applied || 0.25,
      negativeMarksDeducted: (result.incorrect_answers || 0) * (result.negative_marking_applied || 0.25),
      
      // Time details
      timeSpent,
      timeSpentSeconds,
      durationMinutes: result.duration_minutes,
      
      // Attempt details
      attemptNumber: result.attempt_number || 1,
      startedAt: attempt.start_time,
      completedAt: result.result_date,
      
      // Features
      categoryResults: [],
      questionReview: [] as any[]
    }
    console.timeEnd('[Results API] Build response')

    // Fetch questions with proper answer matching
    try {
      // Get all questions for this exam
      const questions = await query(
        `SELECT 
          q.id as question_id,
          q.question_text,
          q.question_image,
          q.randomize_options,
          eq.sequence as question_number,
          q.marks,
          q.difficulty_level as difficulty,
          q.topics as topic_name,
          ea.answer_text as student_answer_text,
          ea.selected_option as student_selected_option,
          ea.is_correct,
          ea.marks_obtained
         FROM exam_questions eq
         INNER JOIN questions q ON eq.question_id = q.id
         LEFT JOIN exam_answers ea ON q.id = ea.question_id AND ea.attempt_id = ?
         WHERE eq.exam_id = ?
         ORDER BY eq.sequence ASC`,
        [result.attempt_id, result.exam_id]
      ) as any[]

      // Get all options for these questions
      const questionIds = Array.isArray(questions) ? questions.map(q => q.question_id) : []
      let allOptions: any[] = []
      
      if (questionIds.length > 0) {
        // Create placeholders for IN clause
        const placeholders = questionIds.map(() => '?').join(',')
        
        allOptions = await query(
          `SELECT 
            id,
            question_id,
            option_text,
            option_label,
            is_correct,
            sequence
           FROM question_options
           WHERE question_id IN (${placeholders})
           ORDER BY question_id, sequence, id ASC`,
          questionIds
        ) as any[]
      }

      // Ensure allOptions is an array
      if (!Array.isArray(allOptions)) {
        allOptions = []
      }

      // Get exam settings (for shuffle configuration)
      const examSettings = await getExamSettings()
      
      // Build option map by question_id
      const optionsMap: { [key: string]: any[] } = {}
      allOptions.forEach(opt => {
        if (!optionsMap[opt.question_id]) {
          optionsMap[opt.question_id] = []
        }
        optionsMap[opt.question_id].push(opt)
      })
      
      // Build question review with correct answer matching
      response.questionReview = questions.map(q => {
        const options = optionsMap[q.question_id] || []
        const correctOption = options.find(opt => opt.is_correct === 1)
        
        // Parse student answer - can be either text (for essay) or selected_option (for MCQ)
        let studentAnswerText = null
        let isAnswerCorrect = false
        
        // Handle MCQ/Multiple Choice answers stored as selected_option index
        if (q.student_selected_option !== null && q.student_selected_option !== undefined) {
          const selectedIndex = q.student_selected_option
          if (selectedIndex >= 0 && selectedIndex < options.length) {
            // Reconstruct the shuffled order to properly map the stored index
            // Use the question's randomize_options setting combined with exam shuffling setting
            const shouldShuffle = q.randomize_options && examSettings.shuffleQuestions
            const effectiveOptions = shuffleQuestionOptions(
              options,
              userId,
              q.question_id,
              shouldShuffle,
              result.attempt_id
            )
            
            console.log('[Results API] Reconstructing answer for question:', {
              questionId: q.question_id,
              selectedIndex,
              questionRandomizeOptions: q.randomize_options,
              examShuffleQuestions: examSettings.shuffleQuestions,
              shouldShuffle,
              originalOptionsCount: options.length,
              effectiveOptionsCount: effectiveOptions.length,
              effectiveOptions: effectiveOptions.map((o: any) => ({ id: o.id, text: o.option_text, isCorrect: o.is_correct }))
            })
            
            // Map shuffled index to actual option
            if (selectedIndex < effectiveOptions.length) {
              studentAnswerText = effectiveOptions[selectedIndex].option_text
              isAnswerCorrect = effectiveOptions[selectedIndex].is_correct === 1
              console.log('[Results API] Mapped to answer:', { studentAnswerText, isAnswerCorrect })
            }
          }
        }
        // Handle text answers (for short answer, essay, fill in blank)
        else if (q.student_answer_text !== null && q.student_answer_text !== undefined && q.student_answer_text !== '') {
          studentAnswerText = q.student_answer_text
          isAnswerCorrect = q.is_correct === 1
        }

        return {
          qNo: q.question_number,
          questionId: q.question_id,
          questionText: q.question_text,
          questionImage: q.question_image,
          topicName: q.topic_name,
          difficulty: q.difficulty,
          marks: q.marks,
          options: options.map(opt => ({
            text: opt.option_text,
            label: opt.option_label,
            isCorrect: opt.is_correct === 1
          })),
          studentAnswer: studentAnswerText,
          correctAnswer: correctOption?.option_text || 'N/A',
          status: studentAnswerText === null ? 'unattempted' : (isAnswerCorrect ? 'correct' : 'incorrect'),
          marksObtained: q.marks_obtained || 0
        }
      })
    } catch (error) {
      console.error('Error fetching question review:', error)
      response.questionReview = []
    }

    return NextResponse.json(response)

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch result details' },
      { status: 500 }
    )
  }
}
