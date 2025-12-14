import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") || "exams"
    const dateRange = searchParams.get("dateRange") || "month"
    const subjectId = searchParams.get("subjectId")

    // Calculate date filter based on range
    const now = new Date()
    let startDate: Date
    switch (dateRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    if (reportType === "exams") {
      // Get exam reports with statistics
      let examQuery = `
        SELECT 
          e.id,
          e.title,
          e.exam_date as date,
          e.duration_minutes as duration,
          s.name as subject,
          COUNT(DISTINCT er.id) as totalStudents,
          COALESCE(AVG(er.percentage), 0) as avgScore,
          COALESCE(
            (COUNT(CASE WHEN er.status = 'pass' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(er.id), 0)), 
            0
          ) as passRate,
          0 as issues
        FROM exams e
        LEFT JOIN subjects s ON e.subject_id = s.id
        LEFT JOIN exam_results er ON e.id = er.exam_id
        WHERE e.exam_date >= ?
      `
      const params: any[] = [startDate.toISOString()]

      if (subjectId) {
        examQuery += ` AND e.subject_id = ?`
        params.push(subjectId)
      }

      examQuery += `
        GROUP BY e.id, e.title, e.exam_date, e.duration_minutes, s.name
        ORDER BY e.exam_date DESC
      `

      const examReports = await query(examQuery, params)
      return NextResponse.json({ reports: examReports })
    } else if (reportType === "students") {
      // Get student performance reports
      const studentQuery = `
        SELECT 
          u.id,
          u.full_name as name,
          u.email,
          COUNT(DISTINCT er.exam_id) as examsAttempted,
          COALESCE(AVG(er.percentage), 0) as avgScore,
          COALESCE(
            (COUNT(CASE WHEN er.status = 'pass' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(er.id), 0)), 
            0
          ) as passRate,
          COALESCE(SUM(er.obtained_marks), 0) as totalMarks
        FROM users u
        LEFT JOIN exam_results er ON u.id = er.student_id
        LEFT JOIN exams e ON er.exam_id = e.id
        WHERE u.role = 'student'
          AND (e.exam_date >= ? OR e.exam_date IS NULL)
        GROUP BY u.id, u.full_name, u.email
        HAVING examsAttempted > 0
        ORDER BY avgScore DESC
      `

      const studentReports = await query(studentQuery, [startDate.toISOString()])
      
      // Add rank to each student
      const rankedReports = (studentReports as any[]).map((student, index) => ({
        ...student,
        rank: index + 1,
      }))

      return NextResponse.json({ reports: rankedReports })
    } else if (reportType === "trends") {
      // Get monthly trends
      const trendsQuery = `
        SELECT 
          DATE_FORMAT(e.exam_date, '%Y-%m') as month,
          COUNT(DISTINCT e.id) as exams,
          COUNT(DISTINCT er.student_id) as students,
          COALESCE(SUM(t.amount), 0) as revenue
        FROM exams e
        LEFT JOIN exam_results er ON e.id = er.exam_id
        LEFT JOIN transactions t ON MONTH(t.created_at) = MONTH(e.exam_date) 
          AND YEAR(t.created_at) = YEAR(e.exam_date)
          AND t.payment_status = 'completed'
        WHERE e.exam_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(e.exam_date, '%Y-%m')
        ORDER BY month ASC
      `

      const trends = await query(trendsQuery, [])
      return NextResponse.json({ reports: trends })
    } else if (reportType === "subjects") {
      // Get subject-wise performance
      const subjectQuery = `
        SELECT 
          s.id,
          s.name,
          COUNT(DISTINCT e.id) as totalExams,
          COUNT(DISTINCT er.student_id) as totalStudents,
          COALESCE(AVG(er.percentage), 0) as avgScore,
          COALESCE(
            (COUNT(CASE WHEN er.status = 'pass' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(er.id), 0)), 
            0
          ) as passRate
        FROM subjects s
        LEFT JOIN exams e ON s.id = e.subject_id
        LEFT JOIN exam_results er ON e.id = er.exam_id
        WHERE e.exam_date >= ?
        GROUP BY s.id, s.name
        HAVING totalExams > 0
        ORDER BY avgScore DESC
      `

      const subjectReports = await query(subjectQuery, [startDate.toISOString()])
      return NextResponse.json({ reports: subjectReports })
    }

    return NextResponse.json({ reports: [] })
  } catch (error) {
    console.error("Reports API error:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
