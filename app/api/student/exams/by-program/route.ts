import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

// GET - Fetch exams grouped by enrolled programs
export async function GET(req: NextRequest) {
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

    const userId = decoded.userId

    // Get all exams from enrolled programs with attempt status
    const [allExamsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        e.id,
        e.title,
        e.description,
        e.duration_minutes as duration,
        e.total_questions as totalQuestions,
        e.total_marks as totalMarks,
        e.exam_date as startDate,
        e.exam_end_time as endDate,
        e.status,
        s.name as subject,
        p.id as programId,
        p.title as programName,
        (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = e.id) as enrolledCount,
        (SELECT COUNT(*) > 0 FROM exam_attempts ea WHERE ea.exam_id = e.id AND ea.student_id = ?) as hasAttempted,
        CASE 
          WHEN e.exam_date < CURDATE() AND NOT EXISTS (
            SELECT 1 FROM exam_attempts ea WHERE ea.exam_id = e.id AND ea.student_id = ?
          ) THEN 1
          ELSE 0
        END as isMissed,
        CASE 
          WHEN e.exam_date < CURDATE() THEN 1
          WHEN e.exam_date = CURDATE() AND CAST(CONCAT(CURDATE(), ' ', e.exam_start_time) AS DATETIME) <= NOW() THEN 1
          ELSE 0
        END as isLive,
        CASE 
          WHEN e.exam_date > CURDATE() THEN 1
          WHEN e.exam_date = CURDATE() AND CAST(CONCAT(CURDATE(), ' ', e.exam_start_time) AS DATETIME) > NOW() THEN 1
          ELSE 0
        END as isUpcoming
       FROM (
         SELECT DISTINCT e.id, ep.program_id
         FROM exams e
         INNER JOIN exam_programs ep ON e.id = ep.exam_id
         INNER JOIN programs p ON ep.program_id = p.id
         INNER JOIN program_enrollments pe ON p.id = pe.program_id
         WHERE pe.user_id = ?
           AND pe.status = 'active'
           AND p.status = 'published'
           AND e.status = 'published'
       ) enrolled_exams
       INNER JOIN exams e ON enrolled_exams.id = e.id
       INNER JOIN programs p ON enrolled_exams.program_id = p.id
       LEFT JOIN subjects s ON e.subject_id = s.id
       ORDER BY p.title, e.exam_date DESC`,
      [userId, userId, userId]
    )

    // Get enrolled programs
    const [programsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT
        p.id as programId,
        p.title as programName
       FROM programs p
       INNER JOIN program_enrollments pe ON p.id = pe.program_id
       WHERE pe.user_id = ?
         AND pe.status = 'active'
         AND p.status = 'published'
       ORDER BY p.title`,
      [userId]
    )

    // Group exams by program
    const programExams = programsRows.map((program: any) => {
      const programExamsData = allExamsRows.filter(
        (exam: any) => exam.programId === program.programId
      )

      return {
        programId: program.programId,
        programName: program.programName,
        exams: programExamsData.slice(0, 3), // Show only first 3 in overview
        totalExams: programExamsData.length
      }
    })

    return NextResponse.json({
      programExams,
      allExams: allExamsRows
    })

  } catch (error) {
    console.error('Fetch exams by program error:', error)
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}
