import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params
    const userId = params.userId

    // Get user info
    const [user]: any = await query(
      `SELECT id, full_name, email, role, profile_visibility, created_at 
       FROM users 
       WHERE id = ?`,
      [userId]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if profile is public
    if (user.profile_visibility === 'private') {
      return NextResponse.json({ error: "This profile is private" }, { status: 403 })
    }

    // Get statistics
    const [examStats]: any = await query(
      `SELECT 
        COUNT(DISTINCT ea.exam_id) as totalExams,
        COUNT(CASE WHEN ea.status IN ('submitted', 'auto_submitted') THEN 1 END) as completedExams,
        AVG(CASE WHEN er.score IS NOT NULL THEN (er.score / er.total_marks) * 100 END) as averageScore
       FROM exam_attempts ea
       LEFT JOIN exam_results er ON ea.id = er.attempt_id
       WHERE ea.student_id = ?`,
      [userId]
    )

    const totalExams = examStats?.totalExams || 0
    const completedExams = examStats?.completedExams || 0
    const averageScore = examStats?.averageScore ? Math.round(examStats.averageScore * 10) / 10 : 0

    // Calculate rank
    const [rankResult]: any = await query(
      `SELECT COUNT(*) + 1 as rank
       FROM (
         SELECT 
           ea.student_id,
           AVG((er.score / er.total_marks) * 100) as avg_score
         FROM exam_attempts ea
         JOIN exam_results er ON ea.id = er.attempt_id
         WHERE ea.status IN ('submitted', 'auto_submitted')
           AND er.score IS NOT NULL
         GROUP BY ea.student_id
         HAVING avg_score > ?
       ) as rankings`,
      [averageScore]
    )
    
    const rank = rankResult?.rank || 0

    // Calculate study streak
    const [streakData]: any = await query(
      `SELECT DATE(start_time) as exam_date
       FROM exam_attempts
       WHERE student_id = ? AND status IN ('submitted', 'auto_submitted', 'in_progress')
       ORDER BY exam_date DESC`,
      [userId]
    )

    let studyStreak = 0
    if (streakData && streakData.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let currentDate = new Date(streakData[0].exam_date)
      currentDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff <= 1) {
        studyStreak = 1
        let expectedDate = new Date(currentDate)
        
        for (let i = 1; i < streakData.length; i++) {
          expectedDate.setDate(expectedDate.getDate() - 1)
          const checkDate = new Date(streakData[i].exam_date)
          checkDate.setHours(0, 0, 0, 0)
          
          if (expectedDate.getTime() === checkDate.getTime()) {
            studyStreak++
          } else {
            break
          }
        }
      }
    }

    // Count achievements
    const [achievementCount]: any = await query(
      `SELECT COUNT(*) as count
       FROM exam_results er
       JOIN exam_attempts ea ON er.attempt_id = ea.id
       WHERE ea.student_id = ? 
         AND er.passed = 1
         AND (er.score / er.total_marks) * 100 >= 80`,
      [userId]
    )

    const achievements = achievementCount?.count || 0

    return NextResponse.json({
      userId: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      isPublic: user.profile_visibility === 'public',
      stats: {
        totalExams,
        completedExams,
        averageScore,
        rank,
        achievements,
        studyStreak,
        joinedDate: user.created_at
      }
    })

  } catch (error) {
    console.error("Get public profile error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
