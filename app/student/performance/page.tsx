"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, TrendingUp, Target, Clock, Zap, RefreshCw, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function PerformancePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const fetchPerformance = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      else setLoading(true)

      const response = await fetch('/api/student/performance', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch performance data')
      }

      const data = await response.json()
      setPerformanceData(data)

      if (showToast) {
        toast.success('Performance data refreshed')
      }
    } catch (error) {

      toast.error('Failed to load performance data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPerformance()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!performanceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">No Performance Data Available</h1>
          <p className="text-muted-foreground mb-4">Complete some exams to see your performance analytics</p>
          <Button onClick={() => router.push('/student/browse-exams')}>
            Browse Exams
          </Button>
        </div>
      </div>
    )
  }

  const { performanceTrend, subjectPerformance, metrics, weakAreas, strongAreas } = performanceData

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Performance Analytics</h1>
            <p className="text-muted-foreground mt-2">Track your learning progress and identify improvement areas</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => fetchPerformance(true)} 
              variant="outline" 
              size="lg"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outline" size="lg">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Link href="/student/dashboard" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">{metrics.averageScore}%</div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs text-green-600 mt-1">+{metrics.improvementRate}% improvement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalAttempts}</div>
              <p className="text-xs text-muted-foreground mt-1">Exams completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics.passRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">All exams passed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Study Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold">{metrics.timeSpent}</div>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total invested</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="trend">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trend">Score Trend</TabsTrigger>
            <TabsTrigger value="subjects">By Subject</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Score Trend Tab */}
          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Score Progression Over Time</CardTitle>
                <CardDescription>Your performance trend across all exams</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subject Performance Tab */}
          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Performance Comparison</CardTitle>
                <CardDescription>Your score vs class average vs target</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" fill="#10b981" name="Your Score" />
                    <Bar dataKey="average" fill="#6b7280" name="Class Average" />
                    <Bar dataKey="target" fill="#f59e0b" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Subject Details */}
            <div className="space-y-3">
              {subjectPerformance.map((subj: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{subj.subject}</span>
                      <span className="text-lg font-bold text-primary">{subj.score}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${subj.score}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Class Average: {subj.average}%</span>
                      <span>Target: {subj.target}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            {/* Weak Areas */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-600" />
                Areas for Improvement
              </h3>
              <div className="space-y-3">
                {weakAreas.map((area: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{area.topic}</p>
                          <p className="text-xs text-muted-foreground">{area.suggestion}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            area.priority === "High" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {area.priority}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${area.weaknessLevel > 50 ? "bg-red-500" : "bg-amber-500"}`}
                          style={{ width: `${area.weaknessLevel}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Strong Areas */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Your Strengths
              </h3>
              <div className="space-y-3">
                {strongAreas.map((area: any, idx: number) => (
                  <Card key={idx} className="border-green-200 bg-green-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{area.topic}</p>
                        <span className="text-lg font-bold text-green-600">{area.strength}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${area.strength}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Confidence: {area.confidence}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
                <CardDescription>Tailored suggestions based on your performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Focus Areas</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Practice more algebra problems to improve your foundation</li>
                    <li>Review organic chemistry chapter and solve previous year questions</li>
                    <li>Read at least 3 Shakespeare plays to improve literature analysis</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Study Strategy</h4>
                  <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                    <li>Increase study time by 2 hours per week on weak subjects</li>
                    <li>Take weekly practice tests to track improvement</li>
                    <li>Form a study group with peers performing well in your weak areas</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">Next Steps</h4>
                  <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                    <li>Schedule a tutoring session for Algebra concepts</li>
                    <li>Access supplementary learning materials for Organic Chemistry</li>
                    <li>Join the literature club for collaborative learning</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
