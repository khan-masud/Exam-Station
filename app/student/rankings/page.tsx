"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Award, Crown, TrendingUp, Calendar, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { toast } from "sonner"
import { useSocket } from "@/hooks/use-socket"

interface Ranking {
  rank: number
  userId: string
  fullName: string
  email: string
  score: number
  examsTaken: number
  averagePercentage: number
  isCurrentUser: boolean
}

export default function RankingsPage() {
  const [weeklyRankings, setWeeklyRankings] = useState<Ranking[]>([])
  const [monthlyRankings, setMonthlyRankings] = useState<Ranking[]>([])
  const [allTimeRankings, setAllTimeRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // WebSocket for real-time leaderboard updates
  const { socket, isConnected, joinLeaderboard, leaveLeaderboard, on, off } = useSocket()

  useEffect(() => {
    fetchRankings()
    
    // Join leaderboard room for real-time updates
    if (isConnected) {
      joinLeaderboard()
      
      // Listen for leaderboard updates
      on('leaderboard:updated', (data: any) => {
        setWeeklyRankings(data.weekly || [])
        setMonthlyRankings(data.monthly || [])
        setAllTimeRankings(data.allTime || [])
        toast.success('Leaderboard updated!', {
          description: 'Rankings have been refreshed in real-time'
        })
      })
    }
    
    return () => {
      if (isConnected) {
        off('leaderboard:updated')
        leaveLeaderboard()
      }
    }
  }, [isConnected])

  const fetchRankings = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      else setLoading(true)

      const response = await fetch('/api/student/rankings', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch rankings')
      }

      const data = await response.json()
      setWeeklyRankings(data.weekly || [])
      setMonthlyRankings(data.monthly || [])
      setAllTimeRankings(data.allTime || [])
      
      if (showToast) {
        toast.success('Rankings refreshed successfully')
      }
    } catch (error) {

      toast.error('Failed to load rankings')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600">🏆 1st Place</Badge>
    if (rank === 2) return <Badge className="bg-gradient-to-r from-gray-300 to-gray-500">🥈 2nd Place</Badge>
    if (rank === 3) return <Badge className="bg-gradient-to-r from-amber-500 to-amber-700">🥉 3rd Place</Badge>
    return <Badge variant="outline">#{rank}</Badge>
  }

  const RankingTable = ({ rankings }: { rankings: Ranking[] }) => (
    <div className="space-y-3">
      {rankings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No rankings available yet</p>
          </CardContent>
        </Card>
      ) : (
        rankings.map((ranking) => (
          <Card key={ranking.userId} className={`${ranking.isCurrentUser ? 'border-2 border-primary bg-primary/5' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="flex items-center justify-center w-12 h-12">
                  {getRankIcon(ranking.rank)}
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                    {ranking.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{ranking.fullName}</h3>
                    {ranking.isCurrentUser && <Badge variant="secondary">You</Badge>}
                    {ranking.rank <= 3 && getRankBadge(ranking.rank)}
                  </div>
                  <p className="text-sm text-muted-foreground">{ranking.email}</p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="text-lg font-bold text-amber-600">{ranking.score} pts</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {ranking.examsTaken} exams · {ranking.averagePercentage}% avg
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 pt-20 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              🏆 Leaderboards
            </h1>
            {isConnected ? (
              <Badge variant="outline" className="gap-1">
                <Wifi className="w-3 h-3 text-green-500" />
                <span className="text-green-500">Live</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <WifiOff className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Offline</span>
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {isConnected 
              ? "See how you rank against other students · Updates in real-time" 
              : "See how you rank against other students"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="alltime" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly" className="gap-2">
            <Calendar className="w-4 h-4" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <Calendar className="w-4 h-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="alltime" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            All Time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Rankings
              </CardTitle>
              <CardDescription>Top performers this week</CardDescription>
            </CardHeader>
            <CardContent>
              <RankingTable rankings={weeklyRankings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Monthly Rankings
              </CardTitle>
              <CardDescription>Top performers this month</CardDescription>
            </CardHeader>
            <CardContent>
              <RankingTable rankings={monthlyRankings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alltime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                All-Time Rankings
              </CardTitle>
              <CardDescription>Hall of Fame - Best of the best</CardDescription>
            </CardHeader>
            <CardContent>
              <RankingTable rankings={allTimeRankings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
