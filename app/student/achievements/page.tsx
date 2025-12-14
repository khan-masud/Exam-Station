"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Award, Star, Zap, Target, Flame, Crown, Medal, Lock, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: string
  isUnlocked: boolean
  unlockedAt?: string | null
  progress: number
  total: number
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<any>({
    totalAchievements: 0,
    unlockedAchievements: 0,
    points: 0,
    level: 1
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAchievements = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      else setLoading(true)

      const response = await fetch('/api/student/achievements', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievements')
      }
      
      const data = await response.json()
      
      // Ensure all achievements have required fields
      const validatedAchievements = (data.achievements || []).map((achievement: any) => ({
        ...achievement,
        category: achievement.category || 'general',
        icon: achievement.icon || '🏆',
        total: achievement.total || achievement.maxProgress || 1,
        progress: achievement.progress || 0,
        isUnlocked: achievement.isUnlocked || false
      }))
      
      setAchievements(validatedAchievements)
      setStats({
        totalAchievements: data.stats?.totalAchievements || 0,
        unlockedAchievements: data.stats?.totalUnlocked || 0,
        points: (data.stats?.totalUnlocked || 0) * 100,
        level: Math.floor((data.stats?.totalUnlocked || 0) / 2) + 1
      })
      
      if (showToast) {
        toast.success('Achievements refreshed successfully')
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
      toast.error('Failed to load achievements')
      setAchievements([])
      setStats({
        totalAchievements: 0,
        unlockedAchievements: 0,
        points: 0,
        level: 1
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAchievements()
  }, [])

  const getIcon = (iconName: string) => {
    // Handle emoji icons from API
    if (iconName && iconName.length <= 2) {
      return <span className="text-3xl">{iconName}</span>
    }
    // Fallback to lucide icons
    const icons: any = {
      star: Star,
      trophy: Trophy,
      zap: Zap,
      target: Target,
      flame: Flame,
      crown: Crown
    }
    const Icon = icons[iconName?.toLowerCase()] || Award
    return <Icon className="w-8 h-8" />
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'exams': return 'text-blue-500'
      case 'performance': return 'text-purple-500'
      case 'study': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'exams': return 'bg-blue-50 dark:bg-blue-950'
      case 'performance': return 'bg-purple-50 dark:bg-purple-950'
      case 'study': return 'bg-green-50 dark:bg-green-950'
      default: return 'bg-gray-100'
    }
  }

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
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Achievements
          </h1>
          <p className="text-muted-foreground">Unlock badges and track your progress</p>
        </div>
        <Button 
          onClick={() => fetchAchievements(true)} 
          variant="outline"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.level}</div>
            <Progress value={65} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points</CardTitle>
            <Star className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.points}</div>
            <p className="text-xs text-muted-foreground">XP earned</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unlocked</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unlockedAchievements}/{stats.totalAchievements}</div>
            <p className="text-xs text-muted-foreground">Achievements</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <Medal className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAchievements > 0 ? Math.round((stats.unlockedAchievements / stats.totalAchievements) * 100) : 0}%
            </div>
            <Progress value={stats.totalAchievements > 0 ? (stats.unlockedAchievements / stats.totalAchievements) * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No achievements yet. Complete exams to unlock badges!</p>
          </div>
        ) : (
          achievements.map((achievement) => (
          <Card 
            key={achievement.id} 
            className={`${getCategoryBg(achievement.category || 'general')} ${achievement.isUnlocked ? '' : 'opacity-60'} transition-all hover:shadow-lg`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-full ${getCategoryColor(achievement.category || 'general')} ${achievement.isUnlocked ? 'bg-white/50' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {achievement.isUnlocked ? getIcon(achievement.icon || '🏆') : <Lock className="w-8 h-8" />}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={achievement.isUnlocked ? 'default' : 'secondary'}>
                    {(achievement.category || 'general').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <CardTitle className="mt-4">{achievement.title || 'Achievement'}</CardTitle>
              <CardDescription>{achievement.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {achievement.isUnlocked ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Trophy className="w-4 h-4" />
                  Unlocked{achievement.unlockedAt ? ` on ${new Date(achievement.unlockedAt).toLocaleDateString()}` : ''}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-semibold">
                      {achievement.progress}/{achievement.total}
                    </span>
                  </div>
                  <Progress value={(achievement.progress / achievement.total) * 100} />
                </div>
              )}
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  )
}
