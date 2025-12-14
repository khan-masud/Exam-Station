"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { LogOut, Settings, Users, FileText, BookOpen, HelpCircle, CreditCard, TrendingUp, RefreshCw, AlertCircle, BarChart3, PieChart, TrendingUpIcon, CheckCircle2, Clock, Zap, GraduationCap, LifeBuoy } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { DonutChart, ProgressRing, SimpleBarChart } from "@/components/analytics-charts"
import { VisitorAnalytics, VisitorTrendChart } from "@/components/visitor-analytics"

interface DashboardStats {
  totalUsers: number
  usersThisWeek: number
  totalExams: number
  activeExams: number
  examsToday: number
  totalPrograms: number
  publishedPrograms: number
  totalProgramEnrollments: number
  enrollmentsThisWeek: number
  totalAttempts: number
  pendingAttempts: number
  totalRevenue: number
  revenueGrowth: number
  pendingPaymentApprovals?: number
  usersByRole?: Array<{ role: string; count: number }>
  totalQuestions?: number
  completedPrograms?: number
  completionRate?: number
  passRate?: number
  avgCompletionTime?: number
  totalVisitors?: number
  uniqueVisitors?: number
  realtimeVisitors?: number
  supportTickets?: {
    total: number
    open: number
    inProgress: number
    closed: number
    resolved: number
  }
}

interface TopExam {
  id: number
  title: string
  attempt_count: number
  pass_rate: number
  avg_marks: number
}

interface RecentActivity {
  type: string
  description: string
  timestamp: string
  user_name: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    usersThisWeek: 0,
    totalExams: 0,
    activeExams: 0,
    examsToday: 0,
    totalPrograms: 0,
    publishedPrograms: 0,
    totalProgramEnrollments: 0,
    enrollmentsThisWeek: 0,
    totalAttempts: 0,
    pendingAttempts: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    usersByRole: [],
    totalQuestions: 0,
    completedPrograms: 0,
    completionRate: 0,
    passRate: 0,
    avgCompletionTime: 0,
    totalVisitors: 0,
    uniqueVisitors: 0,
    realtimeVisitors: 0,
    supportTickets: {
      total: 0,
      open: 0,
      inProgress: 0,
      closed: 0,
      resolved: 0
    }
  })
  const [topExams, setTopExams] = useState<TopExam[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [visitorTrend, setVisitorTrend] = useState<Array<any>>([])
  const [visitorTimeRange, setVisitorTimeRange] = useState<"today" | "yesterday" | "this_week" | "this_month" | "6_months" | "this_year" | "all_time">("today")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async (isRefresh = false, timeRange?: string) => {
    try {
      if (isRefresh) setRefreshing(true)
      const queryParam = timeRange ? `?timeRange=${timeRange}` : `?timeRange=${visitorTimeRange}`
      const response = await fetch(`/api/admin/dashboard${queryParam}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setTopExams(data.topExams || [])
        setRecentActivities(data.recentActivities || [])
        setVisitorTrend(data.visitorTrend || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleVisitorFilterChange = (timeRange: any) => {
    setVisitorTimeRange(timeRange)
    fetchDashboardData(false, timeRange)
  }

  const adminMenuItems = [
    {
      title: "Exam Management",
      description: "Create, edit, and manage exams",
      icon: FileText,
      href: "/admin/exams",
      color: "bg-blue-500",
    },
    {
      title: "Subjects",
      description: "Manage exam subjects and categories",
      icon: BookOpen,
      href: "/admin/subjects",
      color: "bg-purple-500",
    },
    {
      title: "Question Bank",
      description: "Create and manage questions",
      icon: HelpCircle,
      href: "/admin/questions",
      color: "bg-green-500",
    },
    {
      title: "User Management",
      description: "Manage students, proctors, and admins",
      icon: Users,
      href: "/admin/users",
      color: "bg-cyan-500",
    },
    {
      title: "Payments",
      description: "Track transactions and payments",
      icon: CreditCard,
      href: "/admin/payments",
      color: "bg-orange-500",
    },
    {
      title: "Analytics & Reports",
      description: "View system analytics and reports",
      icon: TrendingUp,
      href: "/admin/reports",
      color: "bg-red-500",
    },
    {
      title: "Settings",
      description: "System settings and configuration",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-indigo-500",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-card to-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome, {user?.fullName}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => fetchDashboardData(true)} 
              variant="outline" 
              size="lg"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Pending Approvals Alert */}
        {stats.pendingPaymentApprovals && stats.pendingPaymentApprovals > 0 && (
          <Card className="mb-6 border-l-4 border-l-amber-500 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <AlertCircle className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">
                      {stats.pendingPaymentApprovals} payment{stats.pendingPaymentApprovals > 1 ? 's' : ''} awaiting approval
                    </p>
                    <p className="text-sm text-amber-700">
                      Manual payments submitted by students require your review
                    </p>
                  </div>
                </div>
                <Link href="/admin/payments">
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    Review Payments
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats with Icons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">+{stats.usersThisWeek} this week</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
              <Zap className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeExams}</div>
              <p className="text-xs text-amber-600 mt-1">{stats.examsToday} starting today</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
              <BookOpen className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrograms}</div>
              <p className="text-xs text-purple-600 mt-1">{stats.publishedPrograms} published</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <CreditCard className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
              <p className={`text-xs mt-1 ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}% this month
              </p>
            </CardContent>
          </Card>

          <Link href="/admin/support">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                <LifeBuoy className="h-5 w-5 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.supportTickets?.total || 0}</div>
                <p className="text-xs text-orange-600 mt-1">
                  {stats.supportTickets?.open || 0} open · {stats.supportTickets?.inProgress || 0} active
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Visitor Analytics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Platform Insights</h2>
          
          {/* Visitor Tracking Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <VisitorAnalytics
              totalVisitors={stats.totalVisitors || 0}
              uniqueVisitors={stats.uniqueVisitors || 0}
              realtimeVisitors={stats.realtimeVisitors || 0}
              visitorTrend={visitorTrend}
              onFilterChange={handleVisitorFilterChange}
              initialTimeRange={visitorTimeRange}
            />
          </div>

          {/* Visitor Trend Chart */}
          <VisitorTrendChart visitorTrend={visitorTrend} />
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <HelpCircle className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">in question bank</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
              <GraduationCap className="h-5 w-5 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProgramEnrollments}</div>
              <p className="text-xs text-green-600 mt-1">+{stats.enrollmentsThisWeek} this week</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedPrograms?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">program completions</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts.toLocaleString()}</div>
              <p className="text-xs text-red-600 mt-1">{stats.pendingAttempts} pending</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
              <Clock className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgCompletionTime?.toFixed(0) || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">minutes per exam</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Exams */}
        {topExams && topExams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Top Performing Exams</h2>
            <Card>
              <CardHeader>
                <CardTitle>Exams by Popularity & Performance</CardTitle>
                <CardDescription>Based on attempt count and pass rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topExams.slice(0, 10).map((exam, index) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{exam.title}</p>
                          <p className="text-xs text-muted-foreground">{exam.attempt_count} attempts</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div>
                          <p className="font-semibold text-sm">{exam.pass_rate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">pass rate</p>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{exam.avg_marks.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">avg marks</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activities */}
        {recentActivities && recentActivities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
            <Card>
              <CardHeader>
                <CardTitle>Latest System Activity</CardTitle>
                <CardDescription>Last 15 activities in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => {
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case 'exam_created':
                          return '📝'
                        case 'user_registered':
                          return '👤'
                        case 'exam_attempt':
                          return '✅'
                        default:
                          return '📌'
                      }
                    }

                    const getActivityColor = (type: string) => {
                      switch (type) {
                        case 'exam_created':
                          return 'bg-blue-50'
                        case 'user_registered':
                          return 'bg-purple-50'
                        case 'exam_attempt':
                          return 'bg-green-50'
                        default:
                          return 'bg-gray-50'
                      }
                    }

                    return (
                      <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${getActivityColor(activity.type)}`}>
                        <span className="text-xl shrink-0">{getActivityIcon(activity.type)}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            by {activity.user_name || 'System'} • {new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Menu Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Admin Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {adminMenuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <CardDescription className="mt-2 text-sm">{item.description}</CardDescription>
                        </div>
                        <div className={`${item.color} p-2 rounded-lg text-white shrink-0 ml-2`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
