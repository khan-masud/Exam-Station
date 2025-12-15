"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Calendar, DollarSign, Search, CheckCircle, XCircle, RefreshCw, Users, 
  BookOpen, LogOut, GraduationCap, AlertCircle 
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Program {
  id: string
  title: string
  description: string | null
  cover_image: string | null
  enrollment_fee: number
  max_students: number | null
  status: string
  enrolled_count: number
  exam_count: number
  start_date: string | null
  end_date: string | null
  isEnrolled: boolean
  enrollmentStatus: string | null
  enrolledAt: string | null
  isFull: boolean
}

export default function StudentProgramsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; programId: string | null; programTitle: string }>({
    open: false,
    programId: null,
    programTitle: ""
  })
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      else setLoading(true)

      const response = await fetch('/api/programs/enroll', {
        credentials: 'include'
      })
      
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch programs')
      }

      const data = await response.json()
      setPrograms(data.programs || [])
      
      if (showToast) {
        toast.success('Programs refreshed successfully')
      }
    } catch (error) {
      toast.error('Failed to load programs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleEnroll = async (programId: string, requiresPayment: boolean) => {
    
    const program = programs.find(p => p.id === programId)
    
    if (requiresPayment) {
      toast.info('Please complete payment first')
      router.push(`/student/payments?programId=${programId}`)
      return
    }

    setEnrolling(programId)
    try {
      const response = await fetch('/api/programs/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ programId })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Successfully enrolled!')
        await fetchPrograms()
      } else {
        console.error('Enrollment failed:', data)
        toast.error(data.error || 'Failed to enroll')
      }
    } catch (error) {
      console.error('Enrollment error:', error)
      toast.error('Failed to enroll')
    } finally {
      setEnrolling(null)
    }
  }

  const openCancelDialog = (programId: string, programTitle: string) => {
    setCancelDialog({
      open: true,
      programId,
      programTitle
    })
  }

  const closeCancelDialog = () => {
    setCancelDialog({
      open: false,
      programId: null,
      programTitle: ""
    })
  }

  const confirmCancelEnrollment = async () => {
    if (!cancelDialog.programId) return

    try {
      setCancelling(true)
      const response = await fetch(`/api/programs/enroll?programId=${cancelDialog.programId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast.success('Enrollment cancelled successfully')
        closeCancelDialog()
        fetchPrograms()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to cancel enrollment')
      }
    } catch (error) {
      toast.error('Failed to cancel enrollment')
    } finally {
      setCancelling(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (program.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 pt-20 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Browse Programs</h1>
          <p className="text-muted-foreground">Enroll in learning programs to access exams</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => fetchPrograms(true)} 
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Link href="/student/dashboard" className="text-primary hover:underline">
          ← Back to Dashboard
        </Link>
        <Link href="/student/browse-exams" className="text-primary hover:underline">
          Browse Exams →
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search programs by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <Card key={program.id} className="hover:shadow-lg transition-all flex flex-col">
            <CardHeader>
              {program.cover_image && (
                <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-t-lg mb-4 overflow-hidden">
                  <img 
                    src={program.cover_image} 
                    alt={program.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="line-clamp-2">{program.title}</CardTitle>
                  {program.isEnrolled && (
                    <Badge className="bg-green-600 mt-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Enrolled
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription className="line-clamp-3 mt-2">
                {program.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              {/* Program Details */}
              <div className="grid grid-cols-2 gap-3 text-sm flex-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span>{program.exam_count || 0} exams</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{program.enrolled_count} enrolled</span>
                </div>
                {program.start_date && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs">
                      {new Date(program.start_date).toLocaleDateString()}
                      {program.end_date && ` - ${new Date(program.end_date).toLocaleDateString()}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Fee Display */}
              {program.enrollment_fee > 0 ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-500">
                      Enrollment Fee: ৳ {Number(program.enrollment_fee).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-500">
                    Free Program
                  </span>
                </div>
              )}

              {/* Full Program Warning */}
              {program.isFull && !program.isEnrolled && (
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded text-red-700 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Program is full</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2">
                {program.isEnrolled ? (
                  <div className="space-y-2">
                    <Link href="/student/browse-exams" className="block">
                      <Button className="w-full">View Exams</Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openCancelDialog(program.id, program.title)}
                      disabled={cancelling}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Enrollment
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleEnroll(program.id, program.enrollment_fee > 0)}
                    disabled={enrolling === program.id || program.isFull}
                  >
                    {enrolling === program.id ? 'Enrolling...' : 
                     program.isFull ? 'Program Full' :
                     program.enrollment_fee > 0 ? `Enroll (৳ ${Number(program.enrollment_fee).toFixed(2)})` : 'Enroll Free'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Programs Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try a different search term' : 'No programs available for enrollment yet'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cancel Enrollment Confirmation Dialog */}
      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => {
        if (!open) closeCancelDialog()
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Cancel Enrollment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your enrollment in <strong>{cancelDialog.programTitle}</strong>?
              <br />
              <br />
              You will lose access to all exams in this program and any progress you&apos;ve made. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              Keep Enrollment
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelEnrollment}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Enrollment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
