import { NextRequest, NextResponse } from "next/server"
import { verifyToken, parseTokenFromHeader } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Authentication
    const authHeader = request.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = request.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const resolvedParams = await params
    const userId = resolvedParams.userId

    // Get total exams taken
    const [examStats]: any = await query(
      `SELECT 
        COUNT(DISTINCT er.exam_id) as totalExams,
        COUNT(CASE WHEN er.status IN ('pass', 'fail') THEN 1 END) as completedExams,
        AVG(CASE WHEN er.percentage IS NOT NULL THEN er.percentage END) as averageScore,
        SUM(CASE WHEN er.obtained_marks IS NOT NULL THEN er.obtained_marks ELSE 0 END) as totalPoints
       FROM exam_results er
       WHERE er.student_id = ?`,
      [userId]
    )

    const totalExams = examStats?.totalExams || 0
    const completedExams = examStats?.completedExams || 0
    const averageScore = examStats?.averageScore ? Math.round(examStats.averageScore * 10) / 10 : 0
    const totalPoints = examStats?.totalPoints || 0

    // Calculate rank based on average score
    const [rankResult]: any = await query(
      `SELECT COUNT(*) + 1 as rank
       FROM (
         SELECT 
           er.student_id,
           AVG(er.percentage) as avg_score
         FROM exam_results er
         WHERE er.status IN ('pass', 'fail')
           AND er.percentage IS NOT NULL
         GROUP BY er.student_id
         HAVING avg_score > ?
       ) as rankings`,
      [averageScore]
    )
    
    const rank = rankResult?.rank || 0

    // Get user join date and last login info
    const [userInfo]: any = await query(
      `SELECT created_at, last_login_at, last_login_ip FROM users WHERE id = ?`,
      [userId]
    )

    // Get last activity from exam results
    const [lastActivityResult]: any = await query(
      `SELECT MAX(result_date) as last_active FROM exam_results WHERE student_id = ?`,
      [userId]
    )

    const joinedDate = userInfo?.created_at || new Date()
    const lastLogin = userInfo?.last_login_at || null
    const lastLoginIp = userInfo?.last_login_ip || null
    const lastActive = lastActivityResult?.last_active || userInfo?.created_at || new Date()

    // Calculate study streak (consecutive days with exam activity)
    const [streakData]: any = await query(
      `SELECT DISTINCT DATE(result_date) as exam_date
       FROM exam_results
       WHERE student_id = ? AND status IN ('pass', 'fail')
       ORDER BY exam_date DESC`,
      [userId]
    )

    let studyStreak = 0
    if (streakData && streakData.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let currentDate = new Date(streakData[0].exam_date)
      currentDate.setHours(0, 0, 0, 0)
      
      // Check if there's activity today or yesterday
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

    // Count achievements (passed exams with score >= 80%)
    const [achievementCount]: any = await query(
      `SELECT COUNT(*) as count
       FROM exam_results er
       WHERE er.student_id = ? 
         AND er.status = 'pass'
         AND er.percentage >= 80`,
      [userId]
    )

    const achievements = achievementCount?.count || 0

    return NextResponse.json({
      totalExams,
      completedExams,
      averageScore,
      totalPoints,
      rank,
      joinedDate,
      lastActive,
      lastLogin,
      lastLoginIp,
      achievements,
      studyStreak
    })

  } catch (error) {
    console.error("Get user stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    )
  }
}