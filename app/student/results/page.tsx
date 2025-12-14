"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { LogOut, Search, Eye, TrendingUp, TrendingDown, Calendar, Clock, FileText, RefreshCw, Loader2, Trophy, Target, Zap, BarChart3 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

// This page uses useSearchParams() which requires dynamic rendering
export const dynamic = 'force-dynamic'

export default function ResultsListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuth()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      else setLoading(true)

      const response = await fetch('/api/student/dashboard', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }

      const data = await response.json()
      setResults(data.completedExams || [])
      
      // Calculate stats
      if (data.completedExams && data.completedExams.length > 0) {
        const totalExams = data.completedExams.length
        const passedExams = data.completedExams.filter((r: any) => r.result === 'passed').length
        const failedExams = data.completedExams.filter((r: any) => r.result === 'failed').length
        const averagePercentage = data.completedExams.reduce((sum: number, r: any) => sum + parseFloat(r.percentage), 0) / totalExams
        const highestScore = Math.max(...data.completedExams.map((r: any) => parseFloat(r.percentage)))
        const lowestScore = Math.min(...data.completedExams.map((r: any) => parseFloat(r.percentage)))
        
        setStats({
          totalExams,
          passedExams,
          failedExams,
          successRate: ((passedExams / totalExams) * 100).toFixed(1),
          averagePercentage: averagePercentage.toFixed(1),
          highestScore: highestScore.toFixed(1),
          lowestScore: lowestScore.toFixed(1)
        })
      }
      
      if (showToast) {
        toast.success('Results refreshed successfully')
      }
    } catch (error) {
      console.error('Failed to fetch results:', error)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const filteredResults = results.filter(result => 
    result.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getResultBadge = (result: string) => {
    if (result === 'passed') return <Badge className="bg-green-600">Passed</Badge>
    if (result === 'failed') return <Badge variant="destructive">Failed</Badge>
    return <Badge variant="secondary">{result}</Badge>
  }

  const getScoreColor = (percentage: number, passingMarks: number) => {
    if (percentage >= passingMarks) return 'text-green-600'
    if (percentage >= passingMarks * 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">My Results</h1>
            <p className="text-muted-foreground mt-2">View all your completed exams and results</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => fetchResults(true)} 
              variant="outline" 
              size="lg"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={handleLogout} variant="outline" size="lg">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-8">
          <Link href="/student/dashboard" className="text-primary hover:underline text-sm flex items-center gap-1">
            ← Back to Dashboard
          </Link>
          <Link href="/student/exams" className="text-primary hover:underline text-sm flex items-center gap-1">
            My Exams
          </Link>
        </div>

        {/* Enhanced Analytics Summary */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            {/* Total Exams Card */}
            <Card className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-medium">Total Exams</p>
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalExams}</p>
                  <p className="text-xs text-muted-foreground">Completed so far</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Passed Card */}
            <Card className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-medium">Passed</p>
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.passedExams}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold">{stats.successRate}% success rate</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Failed Card */}
            <Card className="bg-linear-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-medium">Failed</p>
                    <div className="p-2 bg-red-600/20 rounded-lg">
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.failedExams}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{(100 - parseFloat(stats.successRate)).toFixed(1)}% fail rate</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Average Score Card */}
            <Card className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-medium">Average</p>
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.averagePercentage}%</p>
                  <p className="text-xs text-muted-foreground">Across all exams</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Highest Score Card */}
            <Card className="bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-medium">Best Score</p>
                    <div className="p-2 bg-amber-600/20 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.highestScore}%</p>
                  <p className="text-xs text-muted-foreground">Personal best</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Lowest Score Card */}
            <Card className="bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-medium">Lowest Score</p>
                    <div className="p-2 bg-slate-600/20 rounded-lg">
                      <Zap className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-600 dark:text-slate-400">{stats.lowestScore}%</p>
                  <p className="text-xs text-muted-foreground">Room for improvement</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <Card className="mb-8 shadow-md">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by exam title or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results List */}
        {filteredResults.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">
                {searchTerm ? 'No results found' : 'No completed exams yet'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Complete some exams to see your results here'}
              </p>
              {!searchTerm && (
                <Link href="/student/exams">
                  <Button>
                    Browse Available Exams
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {filteredResults.map((result) => (
              <Card key={result.resultId} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 dark:border-l-blue-400">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{result.title}</CardTitle>
                        {getResultBadge(result.result)}
                      </div>
                      {result.subject && (
                        <Badge variant="outline" className="mb-2">
                          {result.subject}
                        </Badge>
                      )}
                      <CardDescription className="flex items-center gap-4 flex-wrap text-xs">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {result.completedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {result.timeSpent}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Attempt #{result.attemptNumber}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Score</p>
                      <p className={`text-xl font-bold ${getScoreColor(parseFloat(result.percentage), result.passingMarks)}`}>
                        {result.score}/{result.totalMarks}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Percentage</p>
                      <div className="flex items-center gap-1">
                        <p className={`text-xl font-bold ${getScoreColor(parseFloat(result.percentage), result.passingMarks)}`}>
                          {result.percentage}%
                        </p>
                        {parseFloat(result.percentage) >= result.passingMarks ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Pass Mark</p>
                      <p className="text-xl font-bold text-muted-foreground">
                        {result.passingMarks}%
                      </p>
                    </div>
                    <div className="flex items-end">
                      <Link href={`/student/results/${result.resultId}`} className="w-full">
                        <Button className="w-full" variant="outline" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Enhanced Performance Indicator */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-semibold">Performance</span>
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">
                        {result.percentage}% of {result.totalMarks}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          parseFloat(result.percentage) >= result.passingMarks
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : parseFloat(result.percentage) >= result.passingMarks * 0.8
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                            : 'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${Math.min(parseFloat(result.percentage), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
