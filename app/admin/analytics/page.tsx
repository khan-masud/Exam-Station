"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LogOut, Users, BookOpen, TrendingUp, AlertTriangle, RefreshCw, Server, 
  Activity, ShieldAlert, TrendingDown, DollarSign, Eye, Clock, Zap,
  AlertCircle, CheckCircle, AlertOctagon
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

interface AnalyticsData {
  userStats: {
    totalStudents: number
    totalTeachers: number
    totalProctors: number
    activeStudents: number
  }
  examStats: {
    totalExams: number
    averageScore: number
    passRate: number
  }
  examTrend: Array<{
    month: string
    exams: number
    students: number
    avgScore: number
  }>
  subjectStats: Array<{
    subject: string
    students: number
    avgScore: number
    passRate: number
  }>
  scoreDistribution: Array<{
    range: string
    count: number
    fill: string
  }>
  revenueStats: {
    totalRevenue: number
    pendingRevenue: number
    completedTransactions: number
  }
  visitorData: {
    totalVisitors: number
    uniqueVisitors: number
    realtimeVisitors: number
    avgSessionDuration: number
    bounceRate: number
  }
  systemHealth: {
    activeConnections: number
    totalRequests: number
    errorRate: number
    avgResponseTime: number
    uptime: number
    dbHealth: string
  }
  securityMetrics: {
    suspiciousAttempts: number
    blockedUsers: number
    failedLogins: number
    anomalyDetections: number
    threatLevel: string
  }
  businessMetrics: {
    userAcquisitionRate: number
    revenuePerUser: number
    churnRate: number
    engagementRate: number
    conversionRate: number
    lifetimeValue: number
  }
  performanceTrend: Array<{
    date: string
    requests: number
    avgResponseTime: number
    maxResponseTime: number
    errorRate: number
  }>
  topPages: Array<{
    page: string
    visits: number
    uniqueVisitors: number
    avgDuration: number
  }>
}

export default function AnalyticsDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  // Fetch analytics from API
  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        toast.error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
      toast.error('An error occurred while fetching analytics')
    } finally {
      setLoading(false)
    }
  }

  const getThreatLevelColor = (level: string) => {
    switch(level) {
      case 'high': return 'bg-red-50 border-red-200'
      case 'medium': return 'bg-yellow-50 border-yellow-200'
      case 'low': return 'bg-green-50 border-green-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getThreatLevelBadgeColor = (level: string) => {
    switch(level) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Advanced Analytics
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Comprehensive business intelligence & system monitoring</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleRefresh} variant="outline" size="lg" disabled={refreshing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outline" size="lg" className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        <Link href="/admin/dashboard" className="text-primary hover:underline text-sm mb-6 inline-block font-medium">
          ← Back to Dashboard
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground text-lg">Loading comprehensive analytics...</p>
            </div>
          </div>
        ) : analytics ? (
          <>
            {/* Key Metrics Dashboard */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-2 h-auto p-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="visitors">👥 Visitors</TabsTrigger>
                <TabsTrigger value="system">⚙️ System</TabsTrigger>
                <TabsTrigger value="security">🔒 Security</TabsTrigger>
                <TabsTrigger value="business">📊 Business</TabsTrigger>
                <TabsTrigger value="performance">⚡ Performance</TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-6">
                {/* Top KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Revenue */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        Total Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                        ${analytics.revenueStats.totalRevenue.toLocaleString()}
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        {analytics.revenueStats.completedTransactions} completed transactions
                      </p>
                    </CardContent>
                  </Card>

                  {/* System Users */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        Total Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                        {(analytics.userStats.totalStudents + analytics.userStats.totalTeachers + analytics.userStats.totalProctors).toLocaleString()}
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        {analytics.userStats.activeStudents} active this month
                      </p>
                    </CardContent>
                  </Card>

                  {/* Exam Performance */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-linear-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        Avg Pass Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                        {analytics.examStats.passRate}%
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2 mt-3">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: `${analytics.examStats.passRate}%`}} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Average Score */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-orange-600" />
                        Avg Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                        {analytics.examStats.averageScore}%
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                        {analytics.examStats.totalExams} exams total
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Exam Trends */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Exam Trends
                    </CardTitle>
                    <CardDescription>Performance metrics over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.examTrend.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No trend data available</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analytics.examTrend}>
                          <defs>
                            <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip contentStyle={{backgroundColor: '#fff', border: '1px solid #ccc'}} />
                          <Legend />
                          <Area type="monotone" dataKey="exams" stroke="#3b82f6" fillOpacity={1} fill="url(#colorExams)" />
                          <Area type="monotone" dataKey="avgScore" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Subject Performance & Score Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Subject Stats */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Subject Performance</CardTitle>
                      <CardDescription>Pass rates by subject</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.subjectStats.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No data</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={analytics.subjectStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="subject" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="passRate" fill="#10b981" name="Pass Rate %" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Score Distribution */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Score Distribution</CardTitle>
                      <CardDescription>Student performance ranges</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.scoreDistribution.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No data</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={analytics.scoreDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry: any) => `${entry.range}: ${entry.count}`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {analytics.scoreDistribution.map((entry: any, idx: number) => (
                                <Cell key={`cell-${idx}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* VISITORS TAB */}
              <TabsContent value="visitors" className="space-y-6">
                {/* Visitor KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Eye className="w-4 h-4 text-indigo-600" />
                        Total Visitors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                        {analytics.visitorData.totalVisitors.toLocaleString()}
                      </div>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">Last 30 days</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-linear-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900 dark:to-cyan-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-600" />
                        Unique Visitors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">
                        {analytics.visitorData.uniqueVisitors.toLocaleString()}
                      </div>
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2">
                        {analytics.visitorData.totalVisitors > 0 ? Math.round((analytics.visitorData.uniqueVisitors / analytics.visitorData.totalVisitors) * 100) : 0}% of total
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-linear-to-br from-lime-50 to-lime-100 dark:from-lime-900 dark:to-lime-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-lime-600" />
                        Active Now
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-lime-700 dark:text-lime-300">
                        {analytics.visitorData.realtimeVisitors}
                      </div>
                      <p className="text-xs text-lime-600 dark:text-lime-400 mt-2">Last 5 minutes</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Visitor Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Avg Session Duration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.visitorData.avgSessionDuration}s</div>
                      <p className="text-xs text-muted-foreground mt-2">Average time per session</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Bounce Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.visitorData.bounceRate}%</div>
                      <p className="text-xs text-muted-foreground mt-2">Single-page sessions</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Pages */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Top Visited Pages</CardTitle>
                    <CardDescription>Most popular pages on your platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topPages.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No page data available</p>
                      ) : (
                        analytics.topPages.map((page, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{page.page}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {page.visits} visits • {page.uniqueVisitors} unique • {page.avgDuration}s avg time
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">{page.visits}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SYSTEM TAB */}
              <TabsContent value="system" className="space-y-6">
                {/* System Health Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg bg-linear-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        System Uptime
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                        {analytics.systemHealth.uptime}%
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">Excellent</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-600" />
                        Error Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                        {analytics.systemHealth.errorRate}%
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Last 1 hour</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-600" />
                        Avg Response Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                        {analytics.systemHealth.avgResponseTime}ms
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">Average</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional System Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Active Connections
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.systemHealth.activeConnections}</div>
                      <p className="text-xs text-muted-foreground mt-2">Current active connections</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        Total Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.systemHealth.totalRequests}</div>
                      <p className="text-xs text-muted-foreground mt-2">Last 1 hour</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Trend */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Performance Trend (30 days)</CardTitle>
                    <CardDescription>Response times and error rates over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.performanceTrend.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No performance data available</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.performanceTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="avgResponseTime" stroke="#3b82f6" name="Avg Response (ms)" />
                          <Line yAxisId="right" type="monotone" dataKey="errorRate" stroke="#ef4444" name="Error Rate (%)" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SECURITY TAB */}
              <TabsContent value="security" className="space-y-6">
                {/* Security KPIs */}
                <div className={`p-6 rounded-lg border-2 ${getThreatLevelColor(analytics.securityMetrics.threatLevel)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Threat Level</p>
                      <p className="text-3xl font-bold mt-2 capitalize">{analytics.securityMetrics.threatLevel}</p>
                    </div>
                    <div className={`p-4 rounded-full ${getThreatLevelBadgeColor(analytics.securityMetrics.threatLevel)}`}>
                      {analytics.securityMetrics.threatLevel === 'high' ? (
                        <AlertOctagon className="w-8 h-8" />
                      ) : analytics.securityMetrics.threatLevel === 'medium' ? (
                        <AlertTriangle className="w-8 h-8" />
                      ) : (
                        <CheckCircle className="w-8 h-8" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Security Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        Suspicious Attempts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{analytics.securityMetrics.suspiciousAttempts}</div>
                      <p className="text-xs text-red-600 mt-2">Last 24 hours</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-orange-600" />
                        Failed Logins
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">{analytics.securityMetrics.failedLogins}</div>
                      <p className="text-xs text-orange-600 mt-2">Last 24 hours</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        Blocked Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-600">{analytics.securityMetrics.blockedUsers}</div>
                      <p className="text-xs text-yellow-600 mt-2">Total blocked accounts</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-purple-600" />
                        Anomalies Detected
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">{analytics.securityMetrics.anomalyDetections}</div>
                      <p className="text-xs text-purple-600 mt-2">Various types</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Security Recommendations */}
                <Card className="border-0 shadow-lg border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      Security Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-sm">All systems operational - no immediate threats detected</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-sm">Monitor failed login attempts for patterns</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                      <p className="text-sm">Review blocked users and suspicious activities regularly</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BUSINESS TAB */}
              <TabsContent value="business" className="space-y-6">
                {/* Business Intelligence KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg bg-linear-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        User Acquisition
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                        {analytics.businessMetrics.userAcquisitionRate}%
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">MoM Growth</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-linear-to-br from-rose-50 to-rose-100 dark:from-rose-900 dark:to-rose-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-rose-600" />
                        Churn Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                        {analytics.businessMetrics.churnRate}%
                      </div>
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">Monthly churn</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-linear-to-br from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-teal-600" />
                        Revenue per User
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-300">
                        ${analytics.businessMetrics.revenuePerUser}
                      </div>
                      <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">Average</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Business Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.businessMetrics.engagementRate}%</div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: `${Math.min(100, analytics.businessMetrics.engagementRate)}%`}} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Active participation</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.businessMetrics.conversionRate}%</div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: `${Math.min(100, analytics.businessMetrics.conversionRate)}%`}} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Visitor to user</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${analytics.businessMetrics.lifetimeValue}</div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: `75%`}} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Estimated annual</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Business Summary */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Business Summary</CardTitle>
                    <CardDescription>Key insights for decision making</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Strong Acquisition</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          {analytics.businessMetrics.userAcquisitionRate}% growth indicates healthy user acquisition strategy
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">High Engagement</p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          {analytics.businessMetrics.engagementRate}% engagement shows strong platform usage
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Good Monetization</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                          ${analytics.businessMetrics.revenuePerUser} average revenue per user is healthy
                        </p>
                      </div>
                      <div className="p-4 bg-orange-50 dark:bg-orange-900 rounded-lg">
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Manage Churn</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          Monitor {analytics.businessMetrics.churnRate}% churn rate and implement retention strategies
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PERFORMANCE TAB */}
              <TabsContent value="performance" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      API Performance (30 Days)
                    </CardTitle>
                    <CardDescription>Request count and response metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.performanceTrend.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No performance data</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={analytics.performanceTrend}>
                          <defs>
                            <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" label={{value: 'Response Time (ms)', angle: -90, position: 'insideLeft'}} />
                          <YAxis yAxisId="right" orientation="right" label={{value: 'Requests', angle: 90, position: 'insideRight'}} />
                          <Tooltip contentStyle={{backgroundColor: '#fff', border: '1px solid #ccc'}} />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="avgResponseTime" stroke="#3b82f6" strokeWidth={2} name="Avg Response (ms)" />
                          <Line yAxisId="left" type="monotone" dataKey="maxResponseTime" stroke="#ef4444" strokeWidth={2} name="Max Response (ms)" strokeDasharray="5 5" />
                          <Line yAxisId="right" type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2} name="Total Requests" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Health Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                        <span className="text-sm font-medium">Response Time</span>
                        <span className="text-lg font-bold text-green-600 dark:text-green-300">{analytics.systemHealth.avgResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <span className="text-sm font-medium">Error Rate</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-300">{analytics.systemHealth.errorRate}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
                        <span className="text-sm font-medium">Total Requests</span>
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-300">{analytics.systemHealth.totalRequests}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900 rounded-lg">
                        <span className="text-sm font-medium">Active Connections</span>
                        <span className="text-lg font-bold text-orange-600 dark:text-orange-300">{analytics.systemHealth.activeConnections}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Health Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">System Status</span>
                        </div>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-800 px-2 py-1 rounded">Operational</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">Database</span>
                        </div>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-800 px-2 py-1 rounded">Healthy</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">API Services</span>
                        </div>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-800 px-2 py-1 rounded">Running</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-600 rounded-full" />
                          <span className="text-sm font-medium">Uptime</span>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">{analytics.systemHealth.uptime}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </div>
  )
}
