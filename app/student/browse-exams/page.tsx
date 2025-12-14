"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, FileText, Trophy, Users, Search, RefreshCw, BookOpen, ChevronRight, Filter, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

// This page uses useSearchParams() which requires dynamic rendering
export const dynamic = 'force-dynamic'

interface Exam {
  id: string
  title: string
  description: string | null
  subject: string
  duration: number
  totalQuestions: number
  totalMarks: number
  enrolledCount: number
  startDate: string | null
  endDate: string | null
  difficultyLevel: string
  programId: string
  programName: string
  status: string
  hasAttempted: boolean
  isMissed: boolean
  isLive: boolean
  isUpcoming: boolean
}

interface ProgramExams {
  programId: string
  programName: string
  exams: Exam[]
  totalExams: number
}

export default function BrowseExamsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewAll = searchParams.get('viewAll')
  const programIdParam = searchParams.get('programId')
  
  const [programExams, setProgramExams] = useState<ProgramExams[]>([])
  const [allExams, setAllExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<'live' | 'missed' | 'upcoming' | 'all'>('live')

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      else setLoading(true)

      const response = await fetch('/api/student/exams/by-program', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch exams')
      }

      const data = await response.json()
      setProgramExams(data.programExams || [])
      setAllExams(data.allExams || [])
      
      if (showToast) {
        toast.success('Exams refreshed successfully')
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const isExamToday = (exam: Exam) => {
    if (!exam.startDate) return false
    const examDate = new Date(exam.startDate)
    const today = new Date()
    return examDate.getDate() === today.getDate() &&
      examDate.getMonth() === today.getMonth() &&
      examDate.getFullYear() === today.getFullYear()
  }

  const getFilteredExams = () => {
    let exams = allExams

    // Apply filter
    if (filter === 'live') {
      exams = exams.filter(exam => exam.isLive && !exam.isMissed && isExamToday(exam))
    } else if (filter === 'missed') {
      exams = exams.filter(exam => exam.isMissed)
    } else if (filter === 'upcoming') {
      exams = exams.filter(exam => exam.isUpcoming)
    }

    // Apply search
    if (searchTerm) {
      exams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.programName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // If viewing specific program
    if (viewAll && programIdParam) {
      exams = exams.filter(exam => exam.programId === programIdParam)
    }

    return exams
  }

  const handleViewAll = (programId: string) => {
    router.push(`/student/browse-exams?viewAll=true&programId=${programId}`)
  }

  const handleBackToOverview = () => {
    router.push('/student/browse-exams')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // View All Mode
  if (viewAll && programIdParam) {
    const filteredExams = getFilteredExams()
    const currentProgram = programExams.find(p => p.programId === programIdParam)

    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={handleBackToOverview} className="mb-2">
              <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
              Back to Programs
            </Button>
            <h1 className="text-3xl font-bold mb-2">
              {currentProgram?.programName || 'Program Exams'}
            </h1>
            <p className="text-muted-foreground">
              {filter === 'live' ? 'Live and upcoming exams' : filter === 'missed' ? 'Missed exams (retake available)' : 'All exams'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Live Exams
                </div>
              </SelectItem>
              <SelectItem value="upcoming">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Upcoming Exams
                </div>
              </SelectItem>
              <SelectItem value="missed">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  Missed Exams
                </div>
              </SelectItem>
              <SelectItem value="all">All Exams</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Live Exams</p>
                  <p className="text-2xl font-bold text-green-600">
                    {allExams.filter(e => e.programId === programIdParam && e.isLive && !e.isMissed && isExamToday(e)).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Exams</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {allExams.filter(e => e.programId === programIdParam && e.isUpcoming).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Missed Exams</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {allExams.filter(e => e.programId === programIdParam && e.isMissed).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exams</p>
                  <p className="text-2xl font-bold">
                    {allExams.filter(e => e.programId === programIdParam).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exams List */}
        <ExamsList exams={filteredExams} filter={filter} searchTerm={searchTerm} />
      </div>
    )
  }

  // Overview Mode - Show by Programs
  return (
    <div className="container mx-auto p-6 pt-20 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Program Exams</h1>
          <p className="text-muted-foreground">Exams from your enrolled programs</p>
        </div>
        <div className="flex gap-2">
          <Link href="/student/programs">
            <Button variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Programs
            </Button>
          </Link>
        </div>
      </div>

      {/* Programs Sections */}
      {programExams.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Programs Enrolled</h3>
            <p className="text-muted-foreground mb-4">
              Enroll in programs to access exams
            </p>
            <Link href="/student/programs">
              <Button>
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Programs
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        programExams.map((program) => (
          <Card key={program.programId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {program.programName}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {program.totalExams} exam{program.totalExams !== 1 ? 's' : ''} available
                  </CardDescription>
                </div>
                {program.exams.length > 0 && (
                  <Button onClick={() => handleViewAll(program.programId)} variant="outline">
                    View All
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {program.exams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No exams available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {program.exams.slice(0, 3).map((exam) => (
                    <ExamCard key={exam.id} exam={exam} compact />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

// Exam Card Component
function ExamCard({ exam, compact = false }: { exam: Exam; compact?: boolean }) {
  // Ensure only relevant content is rendered
  const hasMetadata = !!exam.subject || !!exam.difficultyLevel || !!exam.isMissed || (!!exam.isLive && !exam.isMissed) || !!exam.hasAttempted;

  return (
    <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary/50">
      <CardHeader className={compact ? "p-4 pb-3" : "pb-3"}>
        <div>
          <CardTitle className={`line-clamp-2 ${compact ? "text-base" : "text-lg"}`}>
            {String(exam.title || '').trim()}
          </CardTitle>
          {hasMetadata && (
            <div className="flex flex-wrap items-center gap-2 mt-2">{!!exam.subject && (
                <Badge variant="outline" className="text-xs font-medium">
                  {String(exam.subject || '').trim()}
                </Badge>
              )}
              {!!exam.difficultyLevel && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    String(exam.difficultyLevel || '').toLowerCase() === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100' :
                    String(exam.difficultyLevel || '').toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100' :
                    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'
                  }`}
                >
                  {String(exam.difficultyLevel || '').trim()}
                </Badge>
              )}
              {!!exam.isMissed && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100 text-xs">
                  Missed - Retake
                </Badge>
              )}
              {!!exam.isLive && !exam.isMissed && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100 text-xs">
                  Live Now
                </Badge>
              )}
              {!!exam.isUpcoming && !exam.isMissed && !exam.isLive && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 text-xs">
                  Upcoming
                </Badge>
              )}
              {!!exam.hasAttempted && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100 text-xs">
                  Attempted
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={compact ? "p-4 pt-0 space-y-3" : "pt-0 space-y-3"}>
        {/* Exam Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <Clock className="w-4 h-4 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Duration</span>
              <span className="text-sm font-semibold">{exam.duration} min</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <FileText className="w-4 h-4 text-purple-600" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Questions</span>
              <span className="text-sm font-semibold">{exam.totalQuestions || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <Trophy className="w-4 h-4 text-amber-600" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Total Marks</span>
              <span className="text-sm font-semibold">{exam.totalMarks || 0}</span>
            </div>
          </div>
          {exam.startDate ? (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Calendar className="w-4 h-4 text-green-600" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Start Date</span>
                <span className="text-sm font-semibold">{new Date(exam.startDate).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Users className="w-4 h-4 text-indigo-600" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Enrolled</span>
                <span className="text-sm font-semibold">{exam.enrolledCount || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Link href={`/student/exam/${exam.id}`}>
          <Button className="w-full" size={compact ? "sm" : "default"} variant={exam.hasAttempted ? "outline" : "default"}>
            {exam.hasAttempted ? 'Retake Exam' : exam.isLive ? 'Start Exam Now' : 'View Details'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// Exams List Component
function ExamsList({ exams, filter, searchTerm }: { exams: Exam[]; filter: string; searchTerm: string }) {
  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Exams Found</h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? 'Try a different search term' 
              : filter === 'live' 
                ? 'No live exams available at the moment'
                : filter === 'missed'
                  ? 'You have no missed exams'
                  : 'No exams available'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {exams.map((exam) => (
        <ExamCard key={exam.id} exam={exam} />
      ))}
    </div>
  )
}
