"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Eye, Flag, Users, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ProctorMonitoringPage() {
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
      startTime: "09:00 AM",
      duration: "2 hours",
      studentsOnline: 45,
      flaggedIncidents: 3,
      status: "ongoing",
      progress: 65,
    },
    {
      id: 2,
      examTitle: "Physics Final",
      startTime: "11:30 AM",
      duration: "2.5 hours",
      studentsOnline: 32,
      flaggedIncidents: 1,
      status: "ongoing",
      progress: 40,
    },
    {
      id: 3,
      examTitle: "Chemistry Quiz",
      startTime: "02:00 PM",
      duration: "1.5 hours",
      studentsOnline: 28,
      flaggedIncidents: 0,
      status: "upcoming",
      progress: 0,
    },
  ]

  const recentIncidents = [
    {
      id: 1,
      studentName: "John Doe",
      studentId: "S001",
      incident: "Multiple tab switches",
      severity: "High",
      time: "10:45 AM",
      action: "Pending",
    },
    {
      id: 2,
      studentName: "Jane Smith",
      studentId: "S012",
      incident: "Copy-paste attempt",
      severity: "High",
      time: "10:30 AM",
      action: "Flagged",
    },
    {
      id: 3,
      studentName: "Bob Johnson",
      studentId: "S045",
      incident: "Window blur detected",
      severity: "Medium",
      time: "10:15 AM",
      action: "Warned",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Exam Monitoring</h1>
            <p className="text-muted-foreground mt-2">Real-time monitoring of active exam sessions</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="lg">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Link href="/proctor/dashboard" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        {/* Active Sessions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Active Exam Sessions</h2>
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <Card key={session.id} className={session.status === "ongoing" ? "border-primary/50 bg-primary/5" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{session.examTitle}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Start Time</p>
                          <p className="font-semibold">{session.startTime}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-semibold">{session.duration}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Students Online</p>
                          <p className="font-semibold flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {session.studentsOnline}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p
                            className={`font-semibold capitalize ${
                              session.status === "ongoing" ? "text-green-600" : "text-amber-600"
                            }`}
                          >
                            {session.status}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button className="ml-4">
                      <Eye className="w-4 h-4 mr-2" />
                      Monitor
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{session.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${session.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Flags */}
                  {session.flaggedIncidents > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-700">
                        {session.flaggedIncidents} incident{session.flaggedIncidents > 1 ? "s" : ""} reported
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-amber-600" />
              Recent Incidents
            </CardTitle>
            <CardDescription>Suspicious activities detected during exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Incident</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Severity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncidents.map((incident) => (
                    <tr key={incident.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold">{incident.studentName}</p>
                          <p className="text-xs text-muted-foreground">{incident.studentId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{incident.incident}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            incident.severity === "High" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{incident.time}</td>
                      <td className="px-4 py-3 text-sm">{incident.action}</td>
                      <td className="px-4 py-3 text-sm">
                        <Button variant="ghost" size="sm">
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
