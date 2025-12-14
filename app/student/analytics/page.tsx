"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { TrendingUp, TrendingDown, Target, Brain, Clock, Award, Calendar, RefreshCw, FolderKanban, Trophy, BookOpen, Users } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Program {
  id: string
  title: string
  exam_count: number
  enrolled_count: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>({
    performanceTrend: [],
    subjectStrengths: [],
    timeAnalysis: [],
    accuracyByType: [],
    weeklyActivity: [],
    insights: {},
    programRank: null
  })
  const [programs, setPrograms] = useState<Program[]>([])
  const [programComparison, setProgramComparison] = useState<any[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [programStats, setProgramStats] = useState<any>({
    totalPrograms: 0,
    activePrograms: 0,
    completedExams: 0,
    avgProgramScore: 0
  })

  useEffect(() => {
    fetchPrograms()
    fetchAnalytics()
  }, [])

  useEffect(() => {
    if (selectedProgram !== "all") {
      fetchAnalytics()
    }
  }, [selectedProgram])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/student/programs', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const enrolledPrograms = data.filter((p: any) => p.isEnrolled)
        setPrograms(enrolledPrograms)
        
        // Fetch program comparison data
        if (enrolledPrograms.length > 0) {
          fetchProgramComparison()
        }
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error)
    }
  }

  const fetchProgramComparison = async () => {
    try {
      const response = await fetch('/api/student/program-comparison', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setProgramComparison(data)
      }
    } catch (error) {
      console.error('Failed to fetch program comparison:', error)
    }
  }

  const fetchAnalytics = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      else setLoading(true)

      const programParam = selectedProgram !== "all" ? `?programId=${selectedProgram}` : ''
      const response = await fetch(`/api/student/analytics${programParam}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)

      // Fetch program-specific stats
      if (selectedProgram === "all") {
        const statsResponse = await fetch('/api/student/program-stats', {
          credentials: 'include'
        })
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setProgramStats(statsData)
        }
      }
      
      if (showToast) {
        toast.success('Analytics refreshed successfully')
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 pt-20 lg:pt-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            📊 Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Deep insights into your learning performance</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => fetchAnalytics(true)} 
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Program-based Overview (only show when "All Programs" selected) */}
      {selectedProgram === "all" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Programs</CardTitle>
              <FolderKanban className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{programStats.totalPrograms || 0}</div>
              <p className="text-xs text-muted-foreground">
                {programStats.activePrograms || 0} active
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Program Exams</CardTitle>
              <BookOpen className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{programStats.completedExams || 0}</div>
              <p className="text-xs text-muted-foreground">Completed across programs</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-teal-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Program Score</CardTitle>
              <Target className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{programStats.avgProgramScore || 0}%</div>
              <p className="text-xs text-muted-foreground">Across all programs</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-pink-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Programs</CardTitle>
              <Trophy className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{programStats.topPrograms || 0}</div>
              <p className="text-xs text-muted-foreground">With 80%+ score</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Program Rank (only show when specific program selected) */}
      {selectedProgram !== "all" && analytics.programRank && (
        <Card className="border-l-4 border-l-yellow-500 bg-linear-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Program Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="text-4xl font-bold text-yellow-600">#{analytics.programRank}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {programs.find(p => p.id === selectedProgram)?.enrolled_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.insights.overallProgress || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.insights.progressTrend === 'up' ? '↗ Improving' : '→ Stable'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Accuracy</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.insights.avgAccuracy || 0}%</div>
            <p className="text-xs text-muted-foreground">Across all questions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.insights.studyStreak || 0} days</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.insights.avgTimePerQuestion || 0}s</div>
            <p className="text-xs text-muted-foreground">Per question</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Your score progression over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="average" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Strengths */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Your performance across different subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.subjectStrengths}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#3b82f6" />
                <Bar dataKey="accuracy" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Study Time Distribution</CardTitle>
            <CardDescription>When you're most active</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.timeAnalysis}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.timeAnalysis.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Accuracy by Question Type */}
        <Card>
          <CardHeader>
            <CardTitle>Accuracy by Question Type</CardTitle>
            <CardDescription>Your performance on different question types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={analytics.accuracyByType}>
                <PolarGrid />
                <PolarAngleAxis dataKey="type" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Accuracy" dataKey="accuracy" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>Your exam activity throughout the week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="exams" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Program Comparison - Only show when viewing all programs */}
      {selectedProgram === "all" && programs.length > 0 && programComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-indigo-500" />
              Program Performance Comparison
            </CardTitle>
            <CardDescription>Compare your performance across enrolled programs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={programComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="programTitle" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" fill="#3b82f6" name="Average Score %" />
                <Bar dataKey="examsCompleted" fill="#10b981" name="Exams Completed" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid gap-2">
              {programComparison.map((prog, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant={prog.avgScore >= 70 ? "default" : "secondary"}>
                      {prog.programTitle}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {prog.examsCompleted} exams • {prog.avgScore}% avg
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedProgram === "all" ? (
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                <p className="text-sm">💡 Focus more on {analytics.insights.weakestSubject || 'challenging subjects'} to improve your overall score</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                <p className="text-sm">⭐ Great job on {analytics.insights.strongestSubject || 'your strong subjects'}! Keep up the excellent work</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded">
                <p className="text-sm">⏰ Consider practicing during your peak performance hours for better results</p>
              </div>
              {programComparison.length > 0 && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded">
                  <p className="text-sm">📚 You're performing best in <strong>{programComparison[0]?.programTitle}</strong> with {programComparison[0]?.avgScore}% average score</p>
                </div>
              )}
              {programStats.totalPrograms > 0 && programStats.activePrograms < programStats.totalPrograms && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded">
                  <p className="text-sm">🎯 Complete exams in your enrolled programs to maximize learning outcomes</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                <p className="text-sm">📊 This program-specific view shows your performance in {programs.find(p => p.id === selectedProgram)?.title}</p>
              </div>
              {analytics.programRank && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
                  <p className="text-sm">🏆 You rank #{analytics.programRank} in this program. Keep pushing to climb higher!</p>
                </div>
              )}
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                <p className="text-sm">⭐ Great job on {analytics.insights.strongestSubject || 'your strong subjects'}! Keep up the excellent work</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded">
                <p className="text-sm">💪 Focus on {analytics.insights.weakestSubject || 'challenging areas'} to improve your program ranking</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
