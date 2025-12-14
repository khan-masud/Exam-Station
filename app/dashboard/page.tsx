"use client"

import { useAuth } from "@/hooks/use-auth"
import { LogoutButton } from "@/components/logout-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Dashboard() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  const roleDescriptions: Record<string, string> = {
    admin: "Manage exams, users, and system settings",
    proctor: "Monitor exam sessions and proctoring",
    student: "Take exams and view results",
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome, {user.fullName}</p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">{user.role}</CardTitle>
              <CardDescription>Account Role</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{roleDescriptions[user.role]}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email</CardTitle>
              <CardDescription>Account Email</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm break-all">{user.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User ID</CardTitle>
              <CardDescription>Unique Identifier</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono">{user.id}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>What to do next based on your role</CardDescription>
            </CardHeader>
            <CardContent>
              {user.role === "admin" && (
                <ul className="space-y-2 text-sm">
                  <li>• Go to Admin Panel to manage exams and users</li>
                  <li>• Configure payment and system settings</li>
                  <li>• View analytics and performance reports</li>
                </ul>
              )}
              {user.role === "student" && (
                <ul className="space-y-2 text-sm">
                  <li>• Browse available exams</li>
                  <li>• Register for exams you want to take</li>
                  <li>• Take exams and view your results</li>
                </ul>
              )}
              {user.role === "proctor" && (
                <ul className="space-y-2 text-sm">
                  <li>• Monitor active exam sessions</li>
                  <li>• Review student activities and alerts</li>
                  <li>• Generate session reports</li>
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
