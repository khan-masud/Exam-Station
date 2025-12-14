import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query, getConnection } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { sendEmail, sendExamResultEmail } from "@/lib/email"
import { sendResultNotificationSMS } from "@/lib/sms"
import { socketEvents } from "@/lib/socket"
import { getExamSettings } from "@/lib/settings"
import { shuffleQuestionOptions } from "@/lib/utils"
import type { ExamAttemptRow, QuestionRow, QuestionOptionRow } from "@/types/database"
import { notifyExamResultPublished } from "@/lib/notification-service"
import logger from "@/lib/logger"

// Submit exam and calculate results
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ 
        error: "You must be logged in to submit an exam" 
      }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ 
        error: "Your session has expired. Please log in again" 
      }, { status: 401 })
    }

    // ✅ Get exam settings
    const examSettings = await getExamSettings()

    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      return NextResponse.json({ 
        error: "Invalid request data. Please try again." 
      }, { status: 400 })
    }

    const { attemptId, answers, timeSpent } = body

    if (!attemptId) {
      return NextResponse.json({ 
        error: "Exam attempt ID is required." 
      }, { status: 400 })
    }

    logger.exam.log('submit', 'Submission request received', { 
      attemptId, 
      userId: decoded.userId,
      answersCount: Object.keys(answers || {}).length 
    })

    // Verify attempt belongs to user
    const attemptRows = await query(
      `SELECT ea.*, e.total_marks, e.passing_percentage, e.show_results, e.negative_marking
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       WHERE ea.id = ? AND ea.student_id = ?`,
      [attemptId, decoded.userId]
    ) as ExamAttemptRow[]

    logger.exam.log('submit', 'Query result', { 
      rowsFound: attemptRows?.length || 0,
      attemptId,
      userId: decoded.userId 
    })

    const attempt = attemptRows && attemptRows[0] ? attemptRows[0] : null

    if (!attempt) {
      // Debug: Check if attempt exists at all (without user check)
      const debugRows = await query(
        `SELECT id, student_id, status FROM exam_attempts WHERE id = ?`,
        [attemptId]
      ) as any[]
      
      if (debugRows && debugRows.length > 0) {
        logger.exam.log('submit', 'Attempt exists but user mismatch', {
          attemptId,
          attemptUserId: debugRows[0].student_id,
          requestUserId: decoded.userId,
          status: debugRows[0].status
        })
      } else {
        logger.exam.log('submit', 'Attempt does not exist in database', { attemptId })
      }
      
      logger.exam.log('submit', 'Attempt not found', { attemptId, userId: decoded.userId })
      return NextResponse.json({ 
        error: "Exam attempt not found or you don't have permission to access it" 
      }, { status: 404 })
    }

    if (attempt.status !== 'ongoing') {
      logger.exam.log('submit', 'Attempt already submitted', { 
        attemptId, 
        currentStatus: attempt.status,
        userId: decoded.userId 
      })

      // If already submitted, try to find the result and return it to allow redirect
      if (attempt.status === 'submitted') {
        const resultRows = await query(
          `SELECT id FROM exam_results WHERE attempt_id = ?`,
          [attemptId]
        ) as any[]
        
        if (resultRows && resultRows.length > 0) {
          logger.exam.log('submit', 'Found existing result for submitted attempt', { resultId: resultRows[0].id })
          return NextResponse.json({
            success: true,
            resultId: resultRows[0].id,
            message: "Exam was already submitted. Redirecting to results.",
            alreadySubmitted: true
          })
        }
      }

      return NextResponse.json({ 
        error: `This exam has already been ${attempt.status}. You cannot submit it again.`,
        details: { status: attempt.status, attemptId }
      }, { status: 400 })
    }

    // Validate exam time hasn't expired
    const examEndTime = new Date(attempt.start_time)
    examEndTime.setMinutes(examEndTime.getMinutes() + attempt.duration_minutes)
    
    if (new Date() > examEndTime) {
      // Auto-submit the exam if time expired
      logger.exam.log('submit', 'Exam time expired, proceeding with submission', { attemptId })
    }

    // Define status variable in outer scope so it's available for notifications
    let status = 'fail'
    let percentage = 0
    let obtainedMarks = 0
    let resultId = ''
    let grade = 'F'
    let correctAnswers = 0
    let incorrectAnswers = 0

    // Begin database transaction for data integrity
    const connection = await getConnection()
    
    try {
      await connection.beginTransaction()

      // Save final answers
      for (const [questionId, answerData] of Object.entries<any>(answers || {})) {
        const [existingAnswerRows] = await connection.execute(
          `SELECT id FROM exam_answers WHERE attempt_id = ? AND question_id = ?`,
          [attemptId, questionId]
        ) as any[]

        const existingAnswer = existingAnswerRows && existingAnswerRows[0] ? existingAnswerRows[0] : null
        const answerId = existingAnswer?.id || uuidv4()

        // Get question details for grading
        const [questionRows] = await connection.execute(
          `SELECT * FROM questions WHERE id = ?`,
          [questionId]
        ) as any[]

        const question = questionRows && questionRows[0] ? questionRows[0] : null

        let isCorrect = false
        let marksObtained = 0
        let answerValue = null

        // Extract answer value (can be answerText or selectedOption)
        // Fix: Handle 0 as a valid selectedOption
        if (answerData) {
          if (answerData.answerText !== undefined && answerData.answerText !== null) {
            answerValue = answerData.answerText
          } else if (answerData.selectedOption !== undefined && answerData.selectedOption !== null) {
            answerValue = answerData.selectedOption
          }
        }

        // For MCQ, fetch the correct answer from question_options
        if (question && answerValue !== null) {
          const [correctOptionRows] = await connection.execute(
            `SELECT id FROM question_options WHERE question_id = ? AND is_correct = 1 LIMIT 1`,
            [questionId]
          ) as any[]

          const correctOption = correctOptionRows && correctOptionRows[0] ? correctOptionRows[0] : null

          if (correctOption) {
            // Get all options to determine correctness
            // We must account for shuffling if it was enabled for this user/question
            // Added 'id' to ORDER BY to ensure deterministic order matching start/route.ts
            const [allOptions] = await connection.execute(
              `SELECT id FROM question_options WHERE question_id = ? ORDER BY sequence, id`,
              [questionId]
            ) as any[]

            // Determine if options were shuffled for this user
            const shouldShuffle = examSettings.shuffleQuestions && (question.randomize_options === 1 || question.randomize_options === true)
            
            // Get the effective order of options presented to the user
            const effectiveOptions = shuffleQuestionOptions(
              allOptions, 
              decoded.userId, 
              questionId, 
              shouldShuffle,
              attemptId // Pass attempt ID for unique shuffle per attempt
            )

            // If answerValue is an index (number), map it to the option ID
            let selectedOptionId = null
            if (typeof answerValue === 'number') {
              const selectedIndex = answerValue
              logger.exam.log('submit', 'Processing MCQ answer', {
                questionId,
                selectedIndex,
                totalOptionsCount: effectiveOptions.length,
                shouldShuffle,
                randomize_options: question.randomize_options
              })
              
              if (selectedIndex >= 0 && selectedIndex < effectiveOptions.length) {
                selectedOptionId = effectiveOptions[selectedIndex].id
                logger.exam.log('submit', 'MCQ answer mapped', {
                  selectedIndex,
                  selectedOptionId,
                  selectedOptionText: effectiveOptions[selectedIndex]
                })
              }
            } else {
              // If answerValue is already an ID (string) - future proofing
              selectedOptionId = answerValue
            }

            // Compare IDs instead of indices
            isCorrect = selectedOptionId === correctOption.id
            logger.exam.log('submit', 'MCQ correctness check', {
              selectedOptionId,
              correctOptionId: correctOption.id,
              isCorrect
            })
            
            // Apply scoring with negative marking
            if (isCorrect) {
              marksObtained = question.marks || 0
            } else if (answerValue !== '' && answerValue !== null && answerValue !== undefined) {
              // Only apply negative marking if answer was actually given (not skipped)
              const negativeMarking = attempt.negative_marking || 0.25
              marksObtained = -(negativeMarking)
            }
            // If no answer (null/empty), marksObtained remains 0
          }
        }

        if (existingAnswer) {
          await connection.execute(
            `UPDATE exam_answers 
             SET answer_text = ?, selected_option = ?, is_correct = ?, marks_obtained = ?, updated_at = NOW() 
             WHERE id = ?`,
            [typeof answerValue === 'number' ? null : answerValue, typeof answerValue === 'number' ? answerValue : null, isCorrect ? 1 : 0, marksObtained, answerId]
          )
        } else {
          await connection.execute(
            `INSERT INTO exam_answers 
             (id, attempt_id, question_id, answer_text, selected_option, is_correct, marks_obtained, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [answerId, attemptId, questionId, typeof answerValue === 'number' ? null : answerValue, typeof answerValue === 'number' ? answerValue : null, isCorrect ? 1 : 0, marksObtained]
          )
        }
      }

      // Calculate total marks
      const [marksResultRows] = await connection.execute(
        `SELECT 
          SUM(marks_obtained) as obtained_marks,
          COUNT(*) as total_questions,
          SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
         FROM exam_answers 
         WHERE attempt_id = ?`,
        [attemptId]
      ) as any[]

      const marksResult = marksResultRows && marksResultRows[0] ? marksResultRows[0] : { obtained_marks: 0, total_questions: 0, correct_answers: 0 }

      obtainedMarks = marksResult.obtained_marks || 0
      percentage = (attempt.total_marks ?? 0) > 0 ? (obtainedMarks / (attempt.total_marks ?? 0)) * 100 : 0
      status = percentage >= (attempt.passing_percentage ?? 0) ? 'pass' : 'fail'
      correctAnswers = marksResult.correct_answers || 0
      incorrectAnswers = (marksResult.total_questions || 0) - correctAnswers
      grade = getGrade(percentage) || 'F'
      
      // Calculate actual unanswered questions
      const [totalQuestionsRows] = await connection.execute(
        `SELECT COUNT(*) as count FROM exam_questions WHERE exam_id = ?`,
        [attempt.exam_id]
      ) as any[]
      const totalQuestions = totalQuestionsRows[0]?.count || 0
      const unanswered = totalQuestions - (correctAnswers + incorrectAnswers)

      // Update attempt status
      await connection.execute(
        `UPDATE exam_attempts 
         SET status = 'submitted', 
             end_time = NOW(), 
             total_time_spent = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [timeSpent, attemptId]
      )

      // Create exam result
      resultId = uuidv4()
      logger.exam.log('submit', 'Creating result', { resultId, attemptId })
      
      await connection.execute(
        `INSERT INTO exam_results 
         (id, exam_id, student_id, attempt_id, attempt_number, total_marks, obtained_marks, percentage, 
          grade, correct_answers, incorrect_answers, unanswered, time_spent, status, negative_marking_applied, result_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          resultId,
          attempt.exam_id,
          decoded.userId,
          attemptId,
          attempt.attempt_number,
          attempt.total_marks,
          obtainedMarks,
          parseFloat(percentage.toFixed(2)),
          grade,
          correctAnswers,
          incorrectAnswers,
          unanswered,
          timeSpent || null,
          status,
          attempt.negative_marking || 0.25
        ]
      )
      
      logger.exam.log('submit', 'Result created successfully', { resultId })

      // Send in-app notifications
      try {
        const [examInfo] = await connection.query(
          `SELECT title FROM exams WHERE id = ?`,
          [attempt.exam_id]
        ) as any
        const examTitle = examInfo[0]?.title || 'Exam'
        
        await notifyExamResultPublished(
          decoded.userId,
          attempt.exam_id,
          examTitle,
          obtainedMarks,
          attempt.total_marks ?? 0
        )
      } catch (notifError) {
        logger.error('Failed to send in-app notification:', notifError)
      }

      // Commit transaction
      await connection.commit()
      connection.release()

    } catch (transactionError: any) {
      // Rollback transaction on error
      logger.error('Transaction error:', transactionError)
      try {
        await connection.rollback()
        connection.release()
      } catch (rollbackError) {
        logger.error('Rollback error:', rollbackError)
      }
      
      throw transactionError // Re-throw to be caught by outer catch
    }

    // Get user and exam details for notifications (outside transaction)
    const userRows = await query(
      `SELECT u.email, u.full_name, u.phone, e.title as exam_title 
       FROM users u 
       JOIN exams e ON e.id = ? 
       WHERE u.id = ?`,
      [attempt.exam_id, decoded.userId]
    ) as any[]

    // Send in-app notification for exam result
    try {
      await notifyExamResultPublished(
        decoded.userId,
        attempt.exam_id,
        userRows[0]?.exam_title || 'Exam',
        obtainedMarks,
        attempt.total_marks ?? 0
      )
    } catch (notifError) {
      logger.error('Failed to send in-app notification:', notifError)
    }

    if (userRows && userRows.length > 0) {
      const user = userRows[0]
      const passed = status === 'pass'

      // Emit real-time exam submission event
      try {
        socketEvents.emitExamSubmission(
          attempt.exam_id,
          decoded.userId,
          user.full_name || user.email,
          parseFloat(percentage.toFixed(2))
        )
      } catch (socketError) {
        logger.error('Failed to emit exam submission event:', socketError)
      }

      // Send email notification
      try {
        await sendExamResultEmail(
          user.email,
          user.full_name || user.email,
          user.exam_title,
          obtainedMarks,
          parseFloat(percentage.toFixed(2)),
          passed
        )
      } catch (emailError) {
        logger.error('Failed to send result email:', emailError)
      }

      // Send SMS notification (if phone number exists)
      if (user.phone) {
        try {
          await sendResultNotificationSMS(user.phone, user.exam_title, passed)
        } catch (smsError) {
          logger.error('Failed to send result SMS:', smsError)
        }
      }
    }

    // Update leaderboard in real-time
    try {
      // Fetch updated rankings
      const weeklyRankings = await query(
        `SELECT 
          u.id as userId,
          u.full_name as fullName,
          u.email,
          SUM(er.obtained_marks) as score,
          COUNT(DISTINCT er.exam_id) as examsTaken,
          AVG(er.percentage) as averagePercentage,
          (u.id = ?) as isCurrentUser
        FROM users u
        INNER JOIN exam_results er ON u.id = er.student_id
        WHERE er.result_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY u.id
        ORDER BY score DESC
        LIMIT 50`,
        [decoded.userId]
      ) as any[]

      const monthlyRankings = await query(
        `SELECT 
          u.id as userId,
          u.full_name as fullName,
          u.email,
          SUM(er.obtained_marks) as score,
          COUNT(DISTINCT er.exam_id) as examsTaken,
          AVG(er.percentage) as averagePercentage,
          (u.id = ?) as isCurrentUser
        FROM users u
        INNER JOIN exam_results er ON u.id = er.student_id
        WHERE er.result_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY u.id
        ORDER BY score DESC
        LIMIT 50`,
        [decoded.userId]
      ) as any[]

      const allTimeRankings = await query(
        `SELECT 
          u.id as userId,
          u.full_name as fullName,
          u.email,
          SUM(er.obtained_marks) as score,
          COUNT(DISTINCT er.exam_id) as examsTaken,
          AVG(er.percentage) as averagePercentage,
          (u.id = ?) as isCurrentUser
        FROM users u
        INNER JOIN exam_results er ON u.id = er.student_id
        GROUP BY u.id
        ORDER BY score DESC
        LIMIT 50`,
        [decoded.userId]
      ) as any[]

      // Add rank numbers
      const addRanks = (rankings: any[]) => rankings.map((r, idx) => {
        const avgPercentage = r.averagePercentage ? parseFloat(r.averagePercentage) : 0
        return {
          ...r,
          rank: idx + 1,
          score: parseFloat(r.score) || 0,
          averagePercentage: isNaN(avgPercentage) ? 0 : parseFloat(avgPercentage.toFixed(2))
        }
      })

      socketEvents.emitLeaderboardUpdate({
        weekly: addRanks(weeklyRankings),
        monthly: addRanks(monthlyRankings),
        allTime: addRanks(allTimeRankings)
      })
    } catch (leaderboardError) {
      logger.error('Failed to update leaderboard:', leaderboardError)
    }

    // Return result based on settings
    // ✅ CHECK: Show results immediately setting
    if (examSettings.showResultsImmediately) {
      logger.exam.log('submit', 'Returning results immediately', { resultId })
      return NextResponse.json({
        success: true,
        resultId,
        showResults: true,
        result: {
          id: resultId,
          totalMarks: attempt.total_marks,
          obtainedMarks,
          percentage: percentage.toFixed(2),
          grade,
          status,
          correctAnswers,
          incorrectAnswers,
          timeSpent
        }
      })
    } else {
      logger.exam.log('submit', 'Results pending', { resultId })
      return NextResponse.json({
        success: true,
        resultId,
        showResults: false,
        message: "Exam submitted successfully. Results will be published later."
      })
    }

  } catch (error: any) {
    logger.error('Submit exam error:', error)
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Helper function to calculate grade
function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C'
  if (percentage >= 40) return 'D'
  return 'F'
}
