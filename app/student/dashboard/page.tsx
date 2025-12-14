"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { LogOut, Clock, CheckCircle2, AlertCircle, Calendar, FileText, TrendingUp, Trophy, Target, BookOpen, Activity, Zap, RefreshCw, LifeBuoy } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function StudentDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [upcomingExams, setUpcomingExams] = useState<any[]>([])
  const [liveExams, setLiveExams] = useState<any[]>([])
  const [completedExams, setCompletedExams] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    totalExamsTaken: 0,
    averagePercentage: 0,
    passedCount: 0,
    failedCount: 0,
    highestScore: 0,
    lowestScore: 0,
    enrolledPrograms: 0,
    supportTickets: {
      total: 0,
      open: 0,
      inProgress: 0,
      closed: 0
    }
  })
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([])
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      setError(null)
      const response = await fetch('/api/student/dashboard', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUpcomingExams(data.upcomingExams || [])
        setLiveExams(data.liveExams || [])
        setCompletedExams(data.completedExams || [])
        setStats(data.stats || {})
        setPerformanceTrend(data.performanceTrend || [])
        setSubjectPerformance(data.subjectPerformance || [])
        setRecentActivity(data.recentActivity || [])
      } else {
        setError('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setError('An error occurred while loading your dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const getStatusColor = (status: string) => {
    if (status === 'available') return 'default'
    if (status === 'completed') return 'secondary'
    return 'outline'
  }

  const getResultBadge = (result: string) => {
    if (result === 'passed') return <Badge className="bg-green-600">Passed</Badge>
    if (result === 'failed') return <Badge variant="destructive">Failed</Badge>
    return <Badge variant="secondary">{result}</Badge>
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-32 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 pt-20 lg:pt-6 space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
            <Button onClick={() => fetchDashboardData(true)} variant="outline" size="sm">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
                    <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {user?.fullName || 'Student'}!
          </h1>
          <p className="text-muted-foreground mt-2">Here's your learning progress overview</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/student/browse-exams" className="w-full sm:w-auto">
            <Button className="w-full" size="lg">
              <Zap className="w-4 h-4 mr-2" />
              Browse Exams
            </Button>
          </Link>
        </div>
      </div>

        {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalExamsTaken}</div>
                <p className="text-xs text-muted-foreground">Completed exams</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averagePercentage}%</div>
                <p className="text-xs text-muted-foreground">Overall performance</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Programs</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.enrolledPrograms}</div>
                <p className="text-xs text-muted-foreground">Active enrollments</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Score</CardTitle>
                <Trophy className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.highestScore}%</div>
                <p className="text-xs text-muted-foreground">Personal best</p>
              </CardContent>
            </Card>
            <Link href="/student/support">
              <Card className="border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                  <LifeBuoy className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.supportTickets?.total || 0}</div>
                  <p className="text-xs text-cyan-600">
                    {stats.supportTickets?.open || 0} open · {stats.supportTickets?.inProgress || 0} in progress
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Trend */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Performance Trend
              </CardTitle>
              <CardDescription>Your recent exam scores</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} name="Score %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No performance data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Performance */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Subject Performance
              </CardTitle>
              <CardDescription>Performance by subject</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={subjectPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="subject" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="averageScore" fill="#8884d8" name="Avg Score %" />
                    <Bar dataKey="bestScore" fill="#82ca9d" name="Best Score %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No subject data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Exams Section */}
        {liveExams.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-red-500 animate-pulse" />
              <h2 className="text-2xl font-bold text-foreground">🔴 Live Exams</h2>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                {liveExams.length} Available
              </span>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {liveExams.map((exam) => (
                <Card key={exam.id} className="border-2 border-red-500 bg-linear-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                          <CardTitle className="text-lg text-red-700 dark:text-red-400">{exam.title}</CardTitle>
                        </div>
                        <CardDescription className="text-red-600 dark:text-red-500">{exam.program}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Duration</p>
                        <p className="font-semibold text-red-700 dark:text-red-400">{exam.duration} min</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Total Marks</p>
                        <p className="font-semibold text-red-700 dark:text-red-400">{exam.totalMarks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Passing</p>
                        <p className="font-semibold text-red-700 dark:text-red-400">{exam.passingMarks}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Questions</p>
                        <p className="font-semibold text-red-700 dark:text-red-400">{exam.totalQuestions}</p>
                      </div>
                    </div>
                    {exam.subject && (
                      <Badge className="bg-red-600 hover:bg-red-700">{exam.subject}</Badge>
                    )}
                    <Button 
                      className="w-full bg-red-600 hover:bg-red-700 text-white" 
                      onClick={() => router.push(`/student/exam/${exam.id}`)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Start Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 gap-1">
            <TabsTrigger value="upcoming" className="gap-2 text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Live Exams</span>
              <span className="sm:hidden">Live</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Completed</span>
              <span className="sm:hidden">Done</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2 text-xs sm:text-sm">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Recent Activity</span>
              <span className="sm:hidden">Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Live Exams Tab */}
          <TabsContent value="upcoming" className="space-y-4">
            {liveExams.length > 0 ? (
              liveExams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-xl transition-all border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-bold text-foreground">{exam.title}</h3>
                          {exam.status === 'available' ? (
                            <Badge className="bg-green-500">Available Now</Badge>
                          ) : (
                            <Badge variant="secondary">Coming Soon</Badge>
                          )}
                          {exam.subject && (
                            <Badge variant="outline">{exam.subject}</Badge>
                          )}
                        </div>

                        {exam.description && (
                          <p className="text-sm text-muted-foreground">{exam.description}</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="text-sm font-semibold">{new Date(exam.startDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="text-sm font-semibold">{exam.duration}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Questions</p>
                              <p className="text-sm font-semibold">{exam.totalQuestions}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Marks</p>
                              <p className="text-sm font-semibold">{exam.totalMarks}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Pass Marks</p>
                              <p className="text-sm font-semibold text-green-600">{exam.passingMarks || 40}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Difficulty: <strong>{exam.difficultyLevel}</strong>
                          </span>
                          <span>
                            Attempts: <strong>{exam.attempts}/{exam.maxAttempts}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link href={`/student/exam/${exam.id}`}>
                          <Button 
                            disabled={exam.status !== 'available' || exam.attempts >= exam.maxAttempts}
                            className="w-full"
                          >
                            {exam.status === 'available' ? 'Start Exam' : 'Coming Soon'}
                          </Button>
                        </Link>
                        {exam.attempts >= exam.maxAttempts && (
                          <p className="text-xs text-destructive text-center">Max attempts reached</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Live Exams</h3>
                  <p className="text-muted-foreground mb-4">No exams are currently active</p>
                  <Link href="/student/browse-exams">
                    <Button>Browse Available Exams</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed Exams Tab */}
          <TabsContent value="completed" className="space-y-4">
            {completedExams.length > 0 ? (
              completedExams.map((exam) => (
                <Card key={exam.resultId} className="hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold">{exam.title}</h3>
                          {getResultBadge(exam.result)}
                          {exam.subject && (
                            <Badge variant="outline">{exam.subject}</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Score</p>
                            <p className="text-lg font-bold">{exam.score}/{exam.totalMarks}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Percentage</p>
                            <p className="text-lg font-bold text-primary">{exam.percentage}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Pass Marks</p>
                            <p className="text-sm font-bold">{exam.passingMarks || 40}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Time Spent</p>
                            <p className="text-sm font-semibold">{exam.timeSpent}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Attempt</p>
                            <p className="text-sm font-semibold">#{exam.attemptNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Completed</p>
                            <p className="text-sm font-semibold">{exam.completedDate}</p>
                          </div>
                        </div>
                      </div>

                      <Link href={`/student/results/${exam.resultId}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <FileText className="w-4 h-4" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Completed Exams Yet</h3>
                  <p className="text-muted-foreground mb-4">Start taking exams to see your results here</p>
                  <Link href="/student/browse-exams">
                    <Button>Browse Exams</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest exam activities</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Completed - Score: {activity.score}%
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-2" />
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
