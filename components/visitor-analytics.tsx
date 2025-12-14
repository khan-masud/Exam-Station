"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Eye, Zap } from "lucide-react"
import { useState } from "react"

type TimeRange = "today" | "yesterday" | "this_week" | "this_month" | "6_months" | "this_year" | "all_time"

interface VisitorAnalyticsProps {
  totalVisitors: number
  uniqueVisitors: number
  realtimeVisitors: number
  visitorTrend: Array<{
    date: string
    visitors: number
    page_views: number
  }>
  onFilterChange?: (timeRange: TimeRange) => void
  initialTimeRange?: TimeRange
}

export function VisitorAnalytics({
  totalVisitors,
  uniqueVisitors,
  realtimeVisitors,
  visitorTrend = [],
  onFilterChange,
  initialTimeRange = "today"
}: VisitorAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(initialTimeRange)

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange)
    onFilterChange?.(timeRange)
  }

  // Ensure visitorTrend is always an array
  const trendArray = Array.isArray(visitorTrend) ? visitorTrend : []

  // Calculate average visitors per day
  const avgVisitorsPerDay = trendArray.length > 0
    ? Math.round(trendArray.reduce((sum, day) => sum + (day?.visitors || 0), 0) / trendArray.length)
    : 0

  // Get trend direction (comparing last 3 days vs previous 3 days)
  const calculateTrendDirection = (data: typeof trendArray) => {
    if (!data || data.length < 3) return 0
    const recent3 = data.slice(-3).reduce((sum, day) => sum + (day?.visitors || 0), 0)
    const previous3 = data.slice(-6, -3).reduce((sum, day) => sum + (day?.visitors || 0), 0)
    if (previous3 === 0) return 0
    return Math.round(((recent3 - previous3) / previous3) * 100)
  }

  const trendDirection = calculateTrendDirection(trendArray)
  const trendColor = trendDirection >= 0 ? 'text-green-600' : 'text-red-600'
  const trendIcon = trendDirection >= 0 ? '↑' : '↓'

  const timeRangeOptions: Array<{ value: TimeRange; label: string }> = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "this_week", label: "This Week" },
    { value: "this_month", label: "This Month" },
    { value: "6_months", label: "6 Months" },
    { value: "this_year", label: "This Year" },
    { value: "all_time", label: "All Time" }
  ]

  return (
    <>
      {/* Time Range Filter */}
      <div className="col-span-full mb-4 p-4 bg-card border border-border rounded-lg">
        <p className="text-sm font-medium text-foreground mb-3">Filter by Time Range:</p>
        <div className="flex flex-wrap gap-2">
          {timeRangeOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => handleTimeRangeChange(option.value)}
              variant={selectedTimeRange === option.value ? "default" : "outline"}
              size="sm"
              className={selectedTimeRange === option.value ? "bg-primary text-primary-foreground" : ""}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Realtime Visitor Card */}
      <Card className="hover:shadow-md transition-shadow border-2 border-green-200 bg-linear-to-br from-green-50 to-emerald-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Realtime Visitors</CardTitle>
          <Zap className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{realtimeVisitors}</div>
          <p className="text-xs text-green-600 mt-1">active in last 5 minutes</p>
          <div className="mt-3 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-700 font-medium">Live</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Visitors Card */}
      <Card className="hover:shadow-md transition-shadow border-2 border-blue-200 bg-linear-to-br from-blue-50 to-cyan-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
          <Eye className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700">{totalVisitors.toLocaleString()}</div>
          <p className="text-xs text-blue-600 mt-1">all-time page visits</p>
        </CardContent>
      </Card>

      {/* Unique Visitors Card */}
      <Card className="hover:shadow-md transition-shadow border-2 border-purple-200 bg-linear-to-br from-purple-50 to-violet-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
          <Users className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-700">{uniqueVisitors.toLocaleString()}</div>
          <p className="text-xs text-purple-600 mt-1">unique users tracked</p>
        </CardContent>
      </Card>

      {/* Visitor Trend Card */}
      <Card className="hover:shadow-md transition-shadow border-2 border-orange-200 bg-linear-to-br from-orange-50 to-amber-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">7-Day Trend</CardTitle>
          <TrendingUp className="h-5 w-5 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-700">{avgVisitorsPerDay}</div>
          <p className="text-xs text-orange-600 mt-1">avg daily visitors</p>
          <div className="mt-3 flex items-center gap-1">
            <span className={`text-sm font-semibold ${trendColor}`}>
              {trendIcon} {Math.abs(trendDirection)}%
            </span>
            <span className="text-xs text-muted-foreground">vs previous week</span>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export function VisitorTrendChart({
  visitorTrend = []
}: {
  visitorTrend: Array<{
    date: string
    visitors: number
    page_views: number
  }>
}) {
  const trendArray = Array.isArray(visitorTrend) ? visitorTrend : []

  if (!trendArray || trendArray.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visitor Trend</CardTitle>
          <CardDescription>Daily visitor statistics over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No visitor data available yet</p>
        </CardContent>
      </Card>
    )
  }

  const maxVisitors = Math.max(...trendArray.map(d => d.visitors), 1)
  const chartHeight = 250

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitor Trend</CardTitle>
        <CardDescription>Daily visitor statistics over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="flex items-end justify-center gap-2 p-4 bg-muted/30 rounded-lg" style={{ height: `${chartHeight}px` }}>
            {trendArray.map((day, index) => {
              const percentage = (day.visitors / maxVisitors) * 100
              const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  {/* Bar */}
                  <div 
                    className="w-full bg-linear-to-t from-blue-500 to-blue-400 rounded-t-md transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer group relative mb-2"
                    style={{ height: `${(percentage * (chartHeight - 60)) / 100}px` }}
                    title={`${day.visitors} visitors, ${day.page_views} page views`}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {day.visitors} visitors
                    </div>
                  </div>

                  {/* Label */}
                  <div className="text-xs text-muted-foreground font-medium">{dayName}</div>
                  <div className="text-xs text-muted-foreground">{day.visitors}</div>
                </div>
              )
            })}
          </div>

          {/* Stats Table */}
          <div className="mt-6 space-y-2">
            <div className="text-sm font-semibold text-foreground mb-3">Daily Breakdown</div>
            {trendArray.map((day, index) => {
              const date = new Date(day.date)
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

              return (
                <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <span className="text-sm font-medium">{dateStr}</span>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Visitors: </span>
                      <span className="font-semibold">{day.visitors}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pages: </span>
                      <span className="font-semibold">{day.page_views}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
