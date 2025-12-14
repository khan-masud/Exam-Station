import { NextRequest, NextResponse } from "next/server"
import { verifyToken, parseTokenFromHeader } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = req.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get time range from query parameter
    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get('timeRange') || 'all_time'

    // Build WHERE clause based on time range
    const getTimeRangeCondition = (timeRange: string) => {
      switch (timeRange) {
        case 'today':
          return 'WHERE visited_at >= CURDATE()'
        case 'yesterday':
          return 'WHERE DATE(visited_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)'
        case 'this_week':
          return 'WHERE visited_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        case 'this_month':
          return 'WHERE MONTH(visited_at) = MONTH(NOW()) AND YEAR(visited_at) = YEAR(NOW())'
        case '6_months':
          return 'WHERE visited_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)'
        case 'this_year':
          return 'WHERE YEAR(visited_at) = YEAR(NOW())'
        case 'all_time':
        default:
          return ''
      }
    }

    // Get the time range condition and duration for trend chart
    const timeRangeCondition = getTimeRangeCondition(timeRange)
    let trendDays = 7
    let trendInterval = '7 DAY'

    switch (timeRange) {
      case 'today':
        trendDays = 1
        trendInterval = '1 DAY'
        break
      case 'yesterday':
        trendDays = 1
        trendInterval = '1 DAY'
        break
      case 'this_week':
        trendDays = 7
        trendInterval = '7 DAY'
        break
      case 'this_month':
        trendDays = 30
        trendInterval = '1 MONTH'
        break
      case '6_months':
        trendDays = 180
        trendInterval = '6 MONTH'
        break
      case 'this_year':
        trendDays = 365
        trendInterval = '1 YEAR'
        break
      case 'all_time':
      default:
        trendDays = 365
        trendInterval = '1 YEAR'
        break
    }

    // Get total users count
    const [usersCount]: any = await query(
      `SELECT COUNT(*) as total FROM users`
    )

    // Get users added this week
    const [usersThisWeek]: any = await query(
      `SELECT COUNT(*) as total FROM users 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    )

    // Get total exams
    const [examsCount]: any = await query(
      `SELECT COUNT(*) as total FROM exams`
    )

    // Get active exams (scheduled or ongoing)
    const [activeExams]: any = await query(
      `SELECT COUNT(*) as total FROM exams 
       WHERE status IN ('scheduled', 'ongoing')`
    )

    // Get exams starting today
    const [examsToday]: any = await query(
      `SELECT COUNT(*) as total FROM exams 
       WHERE exam_date = CURDATE() AND status IN ('scheduled', 'ongoing')`
    )

    // Get total programs
    const [programsCount]: any = await query(
      `SELECT COUNT(*) as total FROM programs`
    )

    // Get published programs
    const [publishedPrograms]: any = await query(
      `SELECT COUNT(*) as total FROM programs 
       WHERE status = 'published'`
    )

    // Get total program enrollments
    const [programEnrollments]: any = await query(
      `SELECT COUNT(*) as total FROM program_enrollments 
       WHERE status = 'active'`
    )

    // Get program enrollments this week
    const [enrollmentsThisWeek]: any = await query(
      `SELECT COUNT(*) as total FROM program_enrollments 
       WHERE enrolled_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    )

    // Get total exam attempts
    const [attemptsCount]: any = await query(
      `SELECT COUNT(*) as total FROM exam_attempts`
    )

    // Get pending attempts (ongoing)
    const [pendingAttempts]: any = await query(
      `SELECT COUNT(*) as total FROM exam_attempts 
       WHERE status = 'ongoing'`
    )

    // Get total revenue from payments
    let revenueData: any = null
    let pendingApprovals = 0
    try {
      const result: any = await query(
        `SELECT 
          SUM(amount) as total,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END) as thisMonth,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END) as lastMonth
         FROM transactions 
         WHERE payment_status IN ('approved', 'completed')`
      )
      revenueData = result[0]

      // Get pending payment approvals
      const [pendingResult]: any = await query(
        `SELECT COUNT(*) as total FROM transactions 
         WHERE payment_status = 'pending' AND payment_gateway = 'manual'`
      )
      pendingApprovals = pendingResult?.total || 0
    } catch (err) {
      console.warn('Transactions table query failed, setting revenue to 0')
      revenueData = { total: 0, thisMonth: 0, lastMonth: 0 }
      pendingApprovals = 0
    }

    // Calculate revenue growth
    const totalRevenue = revenueData?.total || 0
    const thisMonthRevenue = revenueData?.thisMonth || 0
    const lastMonthRevenue = revenueData?.lastMonth || 0
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0

    // Get user types breakdown
    const [usersByRole]: any = await query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    )

    // Get exam completion rate
    const [completionStats]: any = await query(
      `SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) as completed_attempts,
        SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) as passed_attempts
       FROM exam_results`
    )

    // Get top performing exams
    const [topExams] = await query(
      `SELECT 
        e.id,
        e.title,
        COUNT(er.id) as attempt_count,
        ROUND(AVG(CASE WHEN er.status = 'pass' THEN 1 ELSE 0 END) * 100, 1) as pass_rate,
        ROUND(AVG(er.obtained_marks), 1) as avg_marks
       FROM exams e
       LEFT JOIN exam_results er ON e.id = er.exam_id
       GROUP BY e.id, e.title
       ORDER BY attempt_count DESC
       LIMIT 10`
    ) as any

    // Get platform health metrics
    const [totalQuestions]: any = await query(
      `SELECT COUNT(*) as total FROM questions`
    )

    const [completedPrograms]: any = await query(
      `SELECT COUNT(DISTINCT user_id) as total FROM program_enrollments WHERE status = 'completed'`
    )

    // Get average attempt completion time
    const [avgCompletionTime]: any = await query(
      `SELECT 
        ROUND(AVG(ROUND(time_spent / 60, 0)), 1) as avg_minutes
       FROM exam_results
       WHERE time_spent IS NOT NULL`
    )

    // Get recent activities
    const [recentActivities] = await query(
      `SELECT 
        'exam_created' as type,
        e.title as description,
        e.created_at as timestamp,
        u.full_name as user_name
       FROM exams e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       
       UNION ALL
       
       SELECT 
        'user_registered' as type,
        CONCAT('New user: ', full_name) as description,
        created_at as timestamp,
        full_name as user_name
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       
       UNION ALL
       
       SELECT
        'exam_attempt' as type,
        CONCAT(e.title, ' - ', ROUND(er.obtained_marks, 1), '/', er.total_marks) as description,
        er.result_date as timestamp,
        u.full_name as user_name
       FROM exam_results er
       LEFT JOIN exams e ON er.exam_id = e.id
       LEFT JOIN users u ON er.student_id = u.id
       WHERE er.result_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       
       ORDER BY timestamp DESC
       LIMIT 15`
    ) as any

    // Calculate completion rate
    const completionRate = completionStats?.[0]?.total_attempts > 0
      ? ((completionStats[0].completed_attempts / completionStats[0].total_attempts) * 100).toFixed(1)
      : 0

    const passRate = completionStats?.[0]?.completed_attempts > 0
      ? ((completionStats[0].passed_attempts / completionStats[0].completed_attempts) * 100).toFixed(1)
      : 0

    // Get visitor analytics
    let totalVisitors = 0
    let uniqueVisitors = 0
    let realtimeVisitors = 0
    let visitorTrend = []

    try {
      // Get total page views/visits based on time range
      const visitorCondition = timeRangeCondition ? `${timeRangeCondition}` : ''
      const [visitorStats]: any = await query(
        `SELECT COUNT(*) as total FROM page_visits ${visitorCondition}`
      )
      totalVisitors = visitorStats?.total || 0

      // Get unique visitors (count distinct user_id OR ip_address) based on time range
      const [uniqueVisitorsStats]: any = await query(
        `SELECT COUNT(DISTINCT COALESCE(user_id, ip_address)) as total FROM page_visits ${visitorCondition}`
      )
      uniqueVisitors = uniqueVisitorsStats?.total || 0

      // Get realtime visitors (active in last 5 minutes) - always realtime
      const [realtimeStats]: any = await query(
        `SELECT COUNT(DISTINCT COALESCE(user_id, ip_address)) as total FROM page_visits 
         WHERE visited_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
      )
      realtimeVisitors = realtimeStats?.total || 0

      // Get visitor trend - adjust based on time range
      let trendQuery = ''
      if (timeRange === 'today' || timeRange === 'yesterday') {
        // For today/yesterday, show hourly data
        trendQuery = `SELECT 
          DATE_FORMAT(visited_at, '%Y-%m-%d %H:00:00') as date,
          COUNT(DISTINCT COALESCE(user_id, ip_address)) as visitors,
          COUNT(*) as page_views
         FROM page_visits
         ${timeRangeCondition}
         GROUP BY DATE_FORMAT(visited_at, '%Y-%m-%d %H:00:00')
         ORDER BY date ASC`
      } else {
        // For other ranges, show daily data
        trendQuery = `SELECT 
          DATE(visited_at) as date,
          COUNT(DISTINCT COALESCE(user_id, ip_address)) as visitors,
          COUNT(*) as page_views
         FROM page_visits
         WHERE visited_at >= DATE_SUB(NOW(), INTERVAL ${trendInterval === '1 YEAR' ? '365' : trendDays} ${trendInterval.includes('DAY') ? 'DAY' : trendInterval.includes('MONTH') ? 'MONTH' : 'YEAR'})
         GROUP BY DATE(visited_at)
         ORDER BY date ASC`
      }

      const [trendData]: any = await query(trendQuery)
      visitorTrend = trendData || []
    } catch (err) {
      console.warn('Visitor tracking table not available', err)
      totalVisitors = 0
      uniqueVisitors = 0
      realtimeVisitors = 0
      visitorTrend = []
    }

    // Get support ticket statistics
    const [ticketStats]: any = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM support_tickets
    `)

    return NextResponse.json({
      stats: {
        totalUsers: usersCount?.total || 0,
        usersThisWeek: usersThisWeek?.total || 0,
        totalExams: examsCount?.total || 0,
        activeExams: activeExams?.total || 0,
        examsToday: examsToday?.total || 0,
        totalPrograms: programsCount?.total || 0,
        publishedPrograms: publishedPrograms?.total || 0,
        totalProgramEnrollments: programEnrollments?.total || 0,
        enrollmentsThisWeek: enrollmentsThisWeek?.total || 0,
        totalAttempts: attemptsCount?.total || 0,
        pendingAttempts: pendingAttempts?.total || 0,
        totalRevenue: totalRevenue,
        revenueGrowth: parseFloat(revenueGrowth as any),
        pendingPaymentApprovals: pendingApprovals,
        usersByRole: usersByRole || [],
        totalQuestions: totalQuestions?.total || 0,
        completedPrograms: completedPrograms?.total || 0,
        completionRate: parseFloat(completionRate as any),
        passRate: parseFloat(passRate as any),
        avgCompletionTime: avgCompletionTime?.[0]?.avg_minutes || 0,
        // Visitor tracking metrics
        totalVisitors: totalVisitors,
        uniqueVisitors: uniqueVisitors,
        realtimeVisitors: realtimeVisitors,
        // Support ticket statistics
        supportTickets: {
          total: ticketStats?.total || 0,
          open: ticketStats?.open || 0,
          inProgress: ticketStats?.inProgress || 0,
          closed: ticketStats?.closed || 0,
          resolved: ticketStats?.resolved || 0
        }
      },
      topExams: topExams || [],
      recentActivities: recentActivities || [],
      visitorTrend: visitorTrend || []
    })

  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
