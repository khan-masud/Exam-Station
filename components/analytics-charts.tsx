"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Simple Bar Chart Component using canvas-like rendering
 */
export function SimpleBarChart({ 
  title, 
  description, 
  data, 
  dataKey = 'value',
  labelKey = 'label',
  color = '#3b82f6'
}: { 
  title: string
  description?: string
  data: any[]
  dataKey?: string
  labelKey?: string
  color?: string
}) {
  if (!data || data.length === 0) return null

  const maxValue = Math.max(...data.map(d => d[dataKey]))
  const chartHeight = 200

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item[dataKey] / maxValue) * 100
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-muted-foreground">{item[labelKey]}</span>
                  <span className="font-semibold">{item[dataKey]}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Progress Ring Component (circular progress indicator)
 */
export function ProgressRing({ 
  title,
  value, 
  total = 100, 
  color = '#3b82f6',
  unit = '%'
}: {
  title: string
  value: number
  total?: number
  color?: string
  unit?: string
}) {
  const percentage = (value / total) * 100
  const radius = 45
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{value.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Trend Chart Component
 */
export function TrendChart({
  title,
  description,
  data,
  dataKey = 'value',
  labelKey = 'label',
  color = '#3b82f6'
}: {
  title: string
  description?: string
  data: any[]
  dataKey?: string
  labelKey?: string
  color?: string
}) {
  if (!data || data.length === 0) return null

  const values = data.map(d => d[dataKey])
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const range = maxValue - minValue || 1
  
  const chartHeight = 150
  const chartWidth = 100

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * chartWidth
    const normalizedValue = (item[dataKey] - minValue) / range
    const y = chartHeight - (normalizedValue * chartHeight)
    return `${x},${y}`
  }).join(' ')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <svg
          className="w-full h-40"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="currentColor" strokeWidth="0.5" className="text-muted opacity-50" />
          
          {/* Gradient fill */}
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <polygon
            points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
            fill={`url(#gradient-${title})`}
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1 || 1)) * chartWidth
            const normalizedValue = (item[dataKey] - minValue) / range
            const y = chartHeight - (normalizedValue * chartHeight)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill={color}
                className="hover:r-3 transition-all"
              />
            )
          })}
        </svg>

        {/* Labels */}
        <div className="flex justify-between mt-4 text-xs text-muted-foreground">
          {data.length > 0 && (
            <>
              <span>{data[0][labelKey]}</span>
              <span>{data[data.length - 1][labelKey]}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Donut Chart Component
 */
export function DonutChart({
  title,
  description,
  data,
  valueKey = 'value',
  labelKey = 'label',
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
}: {
  title: string
  description?: string
  data: any[]
  valueKey?: string
  labelKey?: string
  colors?: string[]
}) {
  if (!data || data.length === 0) return null

  const total = data.reduce((sum, item) => sum + item[valueKey], 0)
  
  let currentAngle = 0
  const slices = data.map((item, index) => {
    const percentage = item[valueKey] / total
    const angle = percentage * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const radius = 45
    const innerRadius = 30

    const start = getCirclePoint(radius, startAngle)
    const end = getCirclePoint(radius, endAngle)
    const innerStart = getCirclePoint(innerRadius, startAngle)
    const innerEnd = getCirclePoint(innerRadius, endAngle)

    const largeArc = angle > 180 ? 1 : 0

    const path = `
      M ${start.x} ${start.y}
      A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}
      L ${innerEnd.x} ${innerEnd.y}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
      Z
    `

    return { path, color: colors[index % colors.length], percentage, label: item[labelKey], value: item[valueKey] }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          <svg className="w-40 h-40" viewBox="0 0 120 120">
            {slices.map((slice, index) => (
              <path
                key={index}
                d={slice.path}
                fill={slice.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </svg>

          <div className="space-y-2">
            {slices.map((slice, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="text-sm">{slice.label}</span>
                <span className="text-sm font-semibold ml-auto">{(slice.percentage * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Helper function to get circle point coordinates
 */
function getCirclePoint(radius: number, angle: number) {
  const radian = (angle - 90) * (Math.PI / 180)
  return {
    x: 60 + radius * Math.cos(radian),
    y: 60 + radius * Math.sin(radian)
  }
}

/**
 * Stat Card Component
 */
export function StatCard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  color = 'bg-blue-500'
}: {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon?: React.ComponentType<{ className?: string }>
  color?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <div className={`${color} p-2 rounded-lg text-white`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend}% {trendLabel}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
