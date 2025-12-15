"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, Medal, Award, TrendingUp, TrendingDown, 
  RefreshCw, FolderKanban, Target, Star, Crown,
  Zap, Flame, Users, BarChart3
} from "lucide-react"
import { toast } from "sonner"

interface Program {
  id: string
  title: string
  enrolled_count: number
  exam_count: number
}

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  totalScore: number
  avgScore: number
  examsCompleted: number
  isCurrentUser: boolean
}

interface ProgramPerformance {
  programId: string
  programTitle: string
  rank: number
  totalParticipants: number
  totalScore: number
  avgScore: number
  examsCompleted: number
  totalExams: number
  percentile: number
  trend: 'up' | 'down' | 'stable'
}

export default function ProgramRankingsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>("")
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myPerformance, setMyPerformance] = useState<ProgramPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchPrograms()
    fetchMyPerformance()
  }, [])

  useEffect(() => {
    if (selectedProgram) {
      fetchLeaderboard(selectedProgram)
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
        if (enrolledPrograms.length > 0 && !selectedProgram) {
          setSelectedProgram(enrolledPrograms[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error)
      toast.error('Failed to load programs')
    }
  }

  const fetchLeaderboard = async (programId: string) => {
    try {
      const response = await fetch(`/api/student/program-leaderboard?programId=${programId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      toast.error('Failed to load leaderboard')
    }
  }

  const fetchMyPerformance = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      else setLoading(true)

      const response = await fetch('/api/student/my-program-performance', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setMyPerformance(data)
        if (showToast) {
          toast.success('Performance data refreshed')
        }
      }
    } catch (error) {

      toast.error('Failed to load performance data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="text-lg font-bold">#{rank}</span>
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600"
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500"
    if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600"
    if (rank <= 10) return "bg-gradient-to-r from-blue-400 to-blue-600"
    return "bg-muted"
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return "text-green-600 dark:text-green-400"
    if (percentile >= 75) return "text-blue-600 dark:text-blue-400"
    if (percentile >= 50) return "text-amber-600 dark:text-amber-400"
    return "text-gray-600 dark:text-gray-400"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (programs.length === 0) {
    return (
      <div className="p-6 pt-20 lg:pt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Programs Enrolled</h3>
              <p className="text-muted-foreground mb-4">
                Enroll in programs to track your rankings and compete with other students
              </p>
              <Button onClick={() => window.location.href = '/student/programs'}>
                Browse Programs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 pt-20 lg:pt-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Program Rankings
          </h1>
          <p className="text-muted-foreground">Track your performance and compete with peers</p>
        </div>
        <Button 
          onClick={() => fetchMyPerformance(true)} 
          variant="outline"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="overview">My Performance</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Overall Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Rank</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  #{Math.min(...myPerformance.map(p => p.rank)) || '-'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all programs
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Percentile</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myPerformance.length > 0 
                    ? Math.round(myPerformance.reduce((sum, p) => sum + p.percentile, 0) / myPerformance.length)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Performance ranking
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top 10 Ranks</CardTitle>
                <Star className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myPerformance.filter(p => p.rank <= 10).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Out of {myPerformance.length} programs
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                <Target className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myPerformance.length > 0 
                    ? Math.round(myPerformance.reduce((sum, p) => sum + p.avgScore, 0) / myPerformance.length)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across programs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance by Program */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Program</CardTitle>
              <CardDescription>Your ranking and progress in each enrolled program</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myPerformance.map((perf) => (
                <div key={perf.programId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{perf.programTitle}</h3>
                        <Badge variant={perf.rank <= 3 ? "default" : "secondary"}>
                          Rank #{perf.rank}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {perf.examsCompleted} of {perf.totalExams} exams completed
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        {getRankBadge(perf.rank)}
                      </div>
                      <p className={`text-sm font-semibold ${getPercentileColor(perf.percentile)}`}>
                        Top {Math.max(1, Math.round((perf.rank / perf.totalParticipants) * 100))}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Score</p>
                      <p className="font-semibold">{perf.totalScore}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Score</p>
                      <p className="font-semibold">{perf.avgScore}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Participants</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {perf.totalParticipants}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {Math.round((perf.examsCompleted / perf.totalExams) * 100)}%
                      </span>
                    </div>
                    <Progress value={(perf.examsCompleted / perf.totalExams) * 100} />
                  </div>

                  {perf.trend !== 'stable' && (
                    <div className="flex items-center gap-2 text-sm">
                      {perf.trend === 'up' ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Improving</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          <span className="text-red-600 dark:text-red-400">Needs attention</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Program Leaderboard</CardTitle>
                  <CardDescription>Top performers in selected program</CardDescription>
                </div>
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                      entry.isCurrentUser 
                        ? 'bg-primary/10 border-2 border-primary' 
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankColor(entry.rank)}`}>
                      {getRankBadge(entry.rank)}
                    </div>

                    {/* User Info */}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {entry.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {entry.isCurrentUser ? 'You' : entry.userName}
                        </p>
                        {entry.isCurrentUser && (
                          <Badge variant="default" className="text-xs">You</Badge>
                        )}
                        {entry.rank <= 3 && (
                          <Flame className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.examsCompleted} exams completed
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <p className="text-lg font-bold">{entry.totalScore}</p>
                      <p className="text-sm text-muted-foreground">{entry.avgScore}% avg</p>
                    </div>

                    {entry.rank === 1 && (
                      <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
                    )}
                  </div>
                ))}

                {leaderboard.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No leaderboard data available for this program
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Insights */}
          {leaderboard.length > 0 && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaderboard.find(e => e.isCurrentUser) && (
                  <>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                      <p className="text-sm">
                        📊 You are ranked #{leaderboard.find(e => e.isCurrentUser)?.rank} out of {leaderboard.length} participants
                      </p>
                    </div>
                    {leaderboard.find(e => e.isCurrentUser)!.rank <= 10 && (
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                        <p className="text-sm">
                          🌟 Great job! You're in the top 10 performers
                        </p>
                      </div>
                    )}
                    {leaderboard.find(e => e.isCurrentUser)!.rank > 10 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded">
                        <p className="text-sm">
                          💪 Keep practicing to climb the leaderboard! You need{' '}
                          {Math.ceil(leaderboard[9]?.totalScore - leaderboard.find(e => e.isCurrentUser)!.totalScore)}{' '}
                          more points to reach top 10
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
