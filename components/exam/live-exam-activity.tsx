"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Activity, Clock, CheckCircle2, Wifi, WifiOff } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

interface ExamActivity {
  examId: string
  examTitle: string
  activeParticipants: number
  recentCompletions: {
    userId: string
    fullName: string
    completedAt: string
    score: number
  }[]
}

interface LiveExamActivityProps {
  examId?: string
}

export function LiveExamActivity({ examId }: LiveExamActivityProps) {
  const [activity, setActivity] = useState<ExamActivity | null>(null)
  const [allActivity, setAllActivity] = useState<ExamActivity[]>([])
  const { socket, isConnected, joinExam, leaveExam, on, off } = useSocket()

  useEffect(() => {
    if (!isConnected) return

    if (examId) {
      // Join specific exam room
      joinExam(examId)

      // Listen for exam-specific updates
      on('exam:participant-joined', (data) => {
        console.log('Participant joined:', data)
        setActivity((prev) => prev ? { ...prev, activeParticipants: prev.activeParticipants + 1 } : null)
      })

      on('exam:participant-left', (data) => {
        console.log('Participant left:', data)
        setActivity((prev) => prev ? { ...prev, activeParticipants: Math.max(0, prev.activeParticipants - 1) } : null)
      })

      on('exam:submission', (data) => {
        console.log('Exam submitted:', data)
        setActivity((prev) => {
          if (!prev) return null
          return {
            ...prev,
            activeParticipants: Math.max(0, prev.activeParticipants - 1),
            recentCompletions: [
              {
                userId: data.userId,
                fullName: data.fullName,
                completedAt: new Date().toISOString(),
                score: data.score || 0
              },
              ...prev.recentCompletions.slice(0, 4)
            ]
          }
        })
      })

      on('exam:stats-update', (data) => {
        console.log('Exam stats updated:', data)
        setActivity(data)
      })
    } else {
      // Listen for global exam activity
      on('exam:new-submission', (data) => {
        console.log('New exam submission globally:', data)
        // Update all activity
      })
    }

    return () => {
      if (examId) {
        off('exam:participant-joined')
        off('exam:participant-left')
        off('exam:submission')
        off('exam:stats-update')
        leaveExam(examId)
      } else {
        off('exam:new-submission')
      }
    }
  }, [examId, isConnected])

  if (!examId && !activity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Live Exam Activity
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 text-green-500" />
                <span>Real-time updates enabled</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-muted-foreground" />
                <span>Connecting...</span>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No active exam sessions right now
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {examId ? 'Live Exam Activity' : 'All Exams Activity'}
          </div>
          {isConnected && (
            <Badge variant="outline" className="gap-1">
              <Wifi className="w-3 h-3 text-green-500" />
              <span className="text-green-500">Live</span>
            </Badge>
          )}
        </CardTitle>
        {activity && (
          <CardDescription>
            {activity.examTitle}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {activity && (
          <>
            {/* Active Participants */}
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activity.activeParticipants}</p>
                <p className="text-sm text-muted-foreground">Currently taking exam</p>
              </div>
            </div>

            {/* Recent Completions */}
            {activity.recentCompletions && activity.recentCompletions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <h3 className="font-semibold text-sm">Recent Completions</h3>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {activity.recentCompletions.map((completion, idx) => (
                      <div
                        key={`${completion.userId}-${idx}`}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {completion.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {completion.fullName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(completion.completedAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <Badge variant={completion.score >= 70 ? "default" : "secondary"}>
                          {completion.score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
