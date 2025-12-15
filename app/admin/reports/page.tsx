"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Download, Filter, AlertTriangle, RefreshCw, FileText, BarChart3, TrendingUp, Users, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface ExamReport {
  id: string
  title: string
  date: string
  duration: number
  subject: string
  totalStudents: number
  avgScore: number
  passRate: number
  issues: number
  topicWisePerformance?: { topic: string; avgScore: number }[]
  difficultyAnalysis?: { difficulty: string; score: number; passRate: number }[]
}

interface StudentReport {
  id: string
  name: string
  email: string
  examsAttempted: number
  avgScore: number
  passRate: number
  totalMarks: number
  rank: number
  strongSubjects?: string[]
  weakSubjects?: string[]
}

interface MonthlyTrend {
  month: string
  exams: number
  students: number
  revenue: number
}

interface DetailedReport {
  title: string
  generatedDate: string
  data: any[]
}

export default function ReportsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [reportType, setReportType] = useState("exams")
  const [dateRange, setDateRange] = useState("month")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [examReports, setExamReports] = useState<ExamReport[]>([])
  const [studentReports, setStudentReports] = useState<StudentReport[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [detailedView, setDetailedView] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ExamReport | null>(null)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchReports()
    setRefreshing(false)
  }

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error("No data to export")
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          if (value === null || value === undefined) return ""
          if (typeof value === "object") return JSON.stringify(value)
          if (typeof value === "string" && value.includes(",")) return `"${value}"`
          return value
        }).join(",")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success("Report exported successfully")
  }

  // Export to JSON
  const exportToJSON = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error("No data to export")
      return
    }

    const json = {
      title: filename,
      exportedAt: new Date().toISOString(),
      dateRange,
      recordCount: data.length,
      data
    }

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success("Report exported successfully")
  }

  // Export to PDF (simple text-based)
  const exportToPDF = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error("No data to export")
      return
    }

    let pdfContent = `${filename}\nGenerated: ${new Date().toLocaleString()}\nDate Range: ${dateRange}\n\n`
    
    data.forEach((row, idx) => {
      pdfContent += `--- Record ${idx + 1} ---\n`
      Object.entries(row).forEach(([key, value]) => {
        pdfContent += `${key}: ${value}\n`
      })
      pdfContent += "\n"
    })

    const blob = new Blob([pdfContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success("Report exported successfully")
  }

  // Fetch reports from API
  useEffect(() => {
    fetchReports()
  }, [reportType, dateRange])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports?type=${reportType}&dateRange=${dateRange}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (reportType === "exams") {
          setExamReports(data.reports || [])
        } else if (reportType === "students") {
          setStudentReports(data.reports || [])
        } else if (reportType === "trends") {
          setMonthlyTrends(data.reports || [])
        }
      } else {
        toast.error('Failed to fetch reports')
      }
    } catch (error) {
      toast.error('An error occurred while fetching reports')
    } finally {
      setLoading(false)
    }
  }

  // System health metrics
  const healthMetrics = {
    uptime: 99.8,
    avgResponseTime: 145,
    activeUsers: 287,
    totalStorage: 245,
    flaggedExams: 3,
    securityAlerts: 8,
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-2">Generate and view system reports</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="lg" disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outline" size="lg">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Link href="/admin/dashboard" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        {/* Report Controls */}
        <Card className="mb-6 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value="exams">📊 Exam Reports</option>
                    <option value="students">👥 Student Reports</option>
                    <option value="trends">📈 Trends & Analytics</option>
                    <option value="health">⚙️ System Health</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>

                <div className="flex gap-2 items-end">
                  <Button onClick={handleRefresh} variant="outline" disabled={refreshing} className="flex-1">
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Export Options */}
              {!loading && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium mb-3">📥 Export Options:</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    {reportType === "exams" && (
                      <>
                        <Button 
                          onClick={() => exportToCSV(examReports, "exam-reports")}
                          variant="secondary"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          CSV
                        </Button>
                        <Button 
                          onClick={() => exportToJSON(examReports, "exam-reports")}
                          variant="secondary"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          JSON
                        </Button>
                        <Button 
                          onClick={() => exportToPDF(examReports, "exam-reports")}
                          variant="secondary"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          TXT
                        </Button>
                        <Button 
                          variant="secondary"
                          size="sm"
                          disabled
                          title="PDF export requires jsPDF library"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          PDF Soon
                        </Button>
                      </>
                    )}
                    {reportType === "students" && (
                      <>
                        <Button 
                          onClick={() => exportToCSV(studentReports, "student-reports")}
                          variant="secondary"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          CSV
                        </Button>
                        <Button 
                          onClick={() => exportToJSON(studentReports, "student-reports")}
                          variant="secondary"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          JSON
                        </Button>
                        <Button 
                          onClick={() => exportToPDF(studentReports, "student-reports")}
                          variant="secondary"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          TXT
                        </Button>
                      </>
                    )}
                    {reportType === "trends" && (
                      <>
                        <Button 
                          onClick={() => exportToCSV(monthlyTrends, "trend-reports")}
                          variant="secondary"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          CSV
                        </Button>
                        <Button 
                          onClick={() => exportToJSON(monthlyTrends, "trend-reports")}
                          variant="secondary"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          JSON
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {reportType === "exams" && (
          <div className="space-y-6">
            {/* Summary Stats */}
            {!loading && examReports.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Exams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{examReports.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Pass Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {Math.round(examReports.reduce((a, b) => a + b.passRate, 0) / examReports.length)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {examReports.reduce((a, b) => a + b.totalStudents, 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {Math.round(examReports.reduce((a, b) => a + b.avgScore, 0) / examReports.length)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Exam Performance Report</CardTitle>
                <CardDescription>Summary of all exams conducted</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
                ) : examReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No exam data available for this period</div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="px-4 py-3 text-left font-semibold">Exam Title</th>
                            <th className="px-4 py-3 text-left font-semibold">Subject</th>
                            <th className="px-4 py-3 text-left font-semibold">Date</th>
                            <th className="px-4 py-3 text-center font-semibold">Students</th>
                            <th className="px-4 py-3 text-center font-semibold">Avg Score</th>
                            <th className="px-4 py-3 text-center font-semibold">Pass Rate</th>
                            <th className="px-4 py-3 text-center font-semibold">Issues</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examReports.map((exam) => (
                            <tr key={exam.id} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-medium">{exam.title}</td>
                              <td className="px-4 py-3 text-muted-foreground">{exam.subject || 'N/A'}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {new Date(exam.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-center">{exam.totalStudents || 0}</td>
                              <td className="px-4 py-3 text-center font-semibold">{Math.round(exam.avgScore)}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className={exam.passRate >= 85 ? "text-green-600 font-semibold" : exam.passRate >= 70 ? "text-amber-600 font-semibold" : "text-red-600 font-semibold"}>
                                  {Math.round(exam.passRate)}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {exam.issues > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {exam.issues}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {reportType === "students" && (
          <div className="space-y-6">
            {/* Summary Stats */}
            {!loading && studentReports.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{studentReports.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Pass Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {Math.round(studentReports.reduce((a, b) => a + b.passRate, 0) / studentReports.length)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Exams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {Math.round(studentReports.reduce((a, b) => a + b.examsAttempted, 0) / studentReports.length)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Average per student</p>
                  </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {Math.round(studentReports.reduce((a, b) => a + b.avgScore, 0) / studentReports.length)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Student Performance Ranking</CardTitle>
                <CardDescription>Top performing students in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
                ) : studentReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No student data available for this period</div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="px-4 py-3 text-left font-semibold">Rank</th>
                            <th className="px-4 py-3 text-left font-semibold">Student Name</th>
                            <th className="px-4 py-3 text-left font-semibold">Email</th>
                            <th className="px-4 py-3 text-center font-semibold">Exams</th>
                            <th className="px-4 py-3 text-center font-semibold">Avg Score</th>
                            <th className="px-4 py-3 text-center font-semibold">Pass Rate</th>
                            <th className="px-4 py-3 text-center font-semibold">Total Marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentReports.map((student) => (
                            <tr key={student.id} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-bold">
                                {student.rank === 1 && <span className="text-yellow-600">🥇 {student.rank}</span>}
                                {student.rank === 2 && <span className="text-gray-600">🥈 {student.rank}</span>}
                                {student.rank === 3 && <span className="text-orange-600">🥉 {student.rank}</span>}
                                {student.rank > 3 && <span className="text-primary">#{student.rank}</span>}
                              </td>
                              <td className="px-4 py-3 font-medium">{student.name}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{student.email}</td>
                              <td className="px-4 py-3 text-center">{student.examsAttempted || 0}</td>
                              <td className="px-4 py-3 text-center font-semibold text-primary">{Math.round(student.avgScore)}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-green-600 font-semibold">{Math.round(student.passRate)}%</span>
                              </td>
                              <td className="px-4 py-3 text-center font-semibold">{Math.round(student.totalMarks)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {reportType === "trends" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  System Trends Over Time
                </CardTitle>
                <CardDescription>Monthly performance and usage statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading trends...</div>
                ) : monthlyTrends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No trend data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="exams" stroke="#3b82f6" strokeWidth={2} name="Exams Conducted" />
                      <Line yAxisId="left" type="monotone" dataKey="students" stroke="#10b981" strokeWidth={2} name="Total Students" />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} name="Revenue ($)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {!loading && monthlyTrends.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">📊 Total Exams</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {monthlyTrends.reduce((a, b) => a + b.exams, 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Across all months</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">👥 Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {monthlyTrends.reduce((a, b) => a + b.students, 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Across all months</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">💰 Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-amber-600">
                        ${monthlyTrends.reduce((a, b) => a + b.revenue, 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Generated revenue</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Exams vs Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="exams" fill="#3b82f6" name="Exams" />
                          <Bar dataKey="students" fill="#10b981" name="Students" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} name="Revenue ($)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        {reportType === "health" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">System Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{healthMetrics.uptime}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{healthMetrics.avgResponseTime}ms</div>
                  <p className="text-xs text-green-600 mt-1">Excellent performance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Users (Today)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{healthMetrics.activeUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">Concurrent users</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{healthMetrics.totalStorage}GB</div>
                  <p className="text-xs text-muted-foreground mt-1">of 500GB capacity</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-3">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "49%" }} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Security Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{healthMetrics.securityAlerts}</div>
                  <p className="text-xs text-amber-600 mt-1">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Flagged Exams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{healthMetrics.flaggedExams}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requires review</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Components Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "API Server", status: "Healthy", uptime: 99.9 },
                  { name: "Database", status: "Healthy", uptime: 99.95 },
                  { name: "Payment Gateway", status: "Healthy", uptime: 99.8 },
                  { name: "Email Service", status: "Healthy", uptime: 99.7 },
                ].map((component, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">{component.name}</p>
                      <p className="text-sm text-muted-foreground">Uptime: {component.uptime}%</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {component.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
