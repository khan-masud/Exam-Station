"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Eye, AlertTriangle, Users, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProctorDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const activeSessions = [
    {
      id: 1,
      examTitle: "Mathematics Midterm",
      studentsInExam: 15,
      flaggedIncidents: 2,
      duration: "1h 20m remaining",
    },
    {
      id: 2,
      examTitle: "Physics Final",
      studentsInExam: 22,
      flaggedIncidents: 0,
      duration: "45m remaining",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Proctor Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome, {user?.fullName}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="lg">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Exams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Students Monitored</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">37</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Flags Raised</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">2</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">94%</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Active Exam Sessions</h2>
          {activeSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{session.examTitle}</CardTitle>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{session.studentsInExam} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{session.duration}</span>
                      </div>
                      {session.flaggedIncidents > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-amber-500">{session.flaggedIncidents} incidents</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Monitor
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
