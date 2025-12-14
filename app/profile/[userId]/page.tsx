"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Trophy, 
  Target, 
  Award, 
  Calendar, 
  TrendingUp, 
  BookOpen,
  CheckCircle,
  Lock,
  ArrowLeft
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface PublicProfile {
  userId: string
  fullName: string
  email: string
  role: string
  isPublic: boolean
  stats: {
    totalExams: number
    completedExams: number
    averageScore: number
    rank: number
    achievements: number
    studyStreak: number
    joinedDate: string
  }
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params?.userId as string
  
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/profile/${userId}`)
      
      if (response.status === 403) {
        setIsPrivate(true)
        setLoading(false)
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full mx-auto" />
              <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isPrivate) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Private Profile</h2>
              <p className="text-muted-foreground">
                This user has set their profile to private
              </p>
            </div>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center space-y-4">
            <h2 className="text-2xl font-bold">Profile Not Found</h2>
            <p className="text-muted-foreground">The requested user profile could not be found</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completionRate = profile.stats.totalExams > 0 
    ? (profile.stats.completedExams / profile.stats.totalExams) * 100 
    : 0

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-3xl">
                  {getInitials(profile.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left space-y-3">
                <div>
                  <h1 className="text-3xl font-bold">{profile.fullName}</h1>
                  <p className="text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant="secondary" className="capitalize">
                    {profile.role}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Rank #{profile.stats.rank}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="text-3xl font-bold">{profile.stats.totalExams}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-3xl font-bold">{profile.stats.completedExams}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="text-3xl font-bold">{profile.stats.averageScore.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Study Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-600" />
                <span className="text-3xl font-bold">{profile.stats.studyStreak}</span>
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">{completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average Score</span>
                <span className="font-medium">{profile.stats.averageScore.toFixed(1)}%</span>
              </div>
              <Progress value={profile.stats.averageScore} className="h-2" />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950">
                <Award className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{profile.stats.achievements}</p>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 dark:bg-teal-950">
                <Calendar className="w-8 h-8 text-teal-600" />
                <div>
                  <p className="text-sm font-medium">
                    {new Date(profile.stats.joinedDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pb-6">
          <p>This is a public profile view</p>
        </div>
      </div>
    </div>
  )
}
