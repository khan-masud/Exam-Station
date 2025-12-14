"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit2, Trash2, LogOut, X, RefreshCw, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface Exam {
  id: string
  title: string
  subject: string
  subject_id?: string
  duration: number
  questions: number
  marks: number
  date: string
  status: "draft" | "scheduled" | "ongoing" | "completed"
  exam_fee?: number
}

interface Subject {
  id: string
  name: string
}

export default function ExamsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    subject_id: "",
    duration: "",
    questions: "",
    marks: "",
    date: "",
    start_time: "09:00",
    end_time: "11:00",
    proctoring_enabled: false,
    allow_answer_change: null as boolean | null,
    show_question_counter: null as boolean | null,
    allow_answer_review: null as boolean | null,
  })

  useEffect(() => {
    fetchExams()
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/subjects", {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects || [])
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const fetchExams = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/exams", {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Transform API data to match component interface
        const transformedExams = (data.exams || []).map((exam: any) => ({
          id: exam.id,
          title: exam.title,
          subject: exam.subject_name || 'N/A',
          duration: exam.duration_minutes,
          questions: exam.total_questions,
          marks: exam.total_marks,
          date: exam.exam_date,
          status: exam.status || 'draft',
          exam_fee: exam.enrollment_fee || 0,
        }))
        setExams(transformedExams)
      } else {
        console.error('Failed to fetch exams:', response.statusText)
        setExams([])
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
      setExams([])
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchExams()
    setRefreshing(false)
  }

  const handleOpenModal = (exam?: Exam) => {
    if (exam) {
      setEditingExam(exam)
      setFormData({
        title: exam.title,
        subject_id: exam.subject_id || "",
        duration: exam.duration.toString(),
        questions: exam.questions.toString(),
        marks: exam.marks.toString(),
        date: exam.date,
        start_time: "09:00",
        end_time: "11:00",
        proctoring_enabled: false,
        allow_answer_change: (exam as any).allow_answer_change,
        show_question_counter: (exam as any).show_question_counter,
        allow_answer_review: (exam as any).allow_answer_review,
      })
    } else {
      setEditingExam(null)
      setFormData({
        title: "",
        subject_id: "",
        duration: "",
        questions: "",
        marks: "",
        date: "",
        start_time: "09:00",
        end_time: "11:00",
        proctoring_enabled: false,
        allow_answer_change: null,
        show_question_counter: null,
        allow_answer_review: null,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingExam(null)
  }

  const handleSaveExam = async () => {
    if (!formData.title || !formData.subject_id || !formData.duration) {
      toast.error("Please fill in all required fields (Title, Subject, Duration)")
      return
    }

    try {
      if (editingExam) {
        // Update existing exam
        const response = await fetch(`/api/exams`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: editingExam.id,
            title: formData.title,
            duration_minutes: Number.parseInt(formData.duration),
            total_questions: Number.parseInt(formData.questions),
            total_marks: Number.parseInt(formData.marks),
            exam_date: formData.date,
            exam_start_time: formData.start_time,
            exam_end_time: formData.end_time,
            proctoring_enabled: formData.proctoring_enabled,
            allow_answer_change: formData.allow_answer_change,
            show_question_counter: formData.show_question_counter,
            allow_answer_review: formData.allow_answer_review,
          })
        })

        if (response.ok) {
          await fetchExams()
          handleCloseModal()
          toast.success("Exam updated successfully")
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to update exam')
        }
      } else {
        // Create new exam
        const response = await fetch(`/api/exams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: formData.title,
            subject_id: formData.subject_id,
            duration_minutes: Number.parseInt(formData.duration),
            total_questions: Number.parseInt(formData.questions),
            total_marks: Number.parseInt(formData.marks),
            exam_date: formData.date,
            exam_start_time: formData.start_time,
            exam_end_time: formData.end_time,
            proctoring_enabled: formData.proctoring_enabled,
            allow_answer_change: formData.allow_answer_change,
            show_question_counter: formData.show_question_counter,
            allow_answer_review: formData.allow_answer_review,
            organization_id: user?.organizationId || null,
          })
        })

        if (response.ok) {
          await fetchExams()
          handleCloseModal()
          toast.success("Exam created successfully")
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to create exam')
        }
      }
    } catch (error) {
      console.error('Error saving exam:', error)
      toast.error('Failed to save exam')
    }
  }

  const handleDeleteExam = async (id: string) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      try {
        const response = await fetch(`/api/exams?id=${id}`, {
          method: 'DELETE',
          credentials: 'include'
        })

        if (response.ok) {
          await fetchExams()
          toast.success("Exam deleted successfully")
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to delete exam')
        }
      } catch (error) {
        console.error('Error deleting exam:', error)
        toast.error('Failed to delete exam')
      }
    }
  }

  const handleStatusChange = async (examId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/exams/${examId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await fetchExams()
        toast.success("Exam status updated successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating exam status:', error)
      toast.error('Failed to update exam status')
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const filteredExams = exams.filter((exam) => exam.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "secondary",
      scheduled: "default",
      ongoing: "destructive",
      completed: "outline",
    }
    return <Badge variant={colors[status] as any}>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Exam Management</h1>
              <p className="text-muted-foreground">Create and manage exams</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <Link href="/admin/dashboard" className="text-primary hover:underline text-sm mb-6 inline-block">
            ← Back to Dashboard
          </Link>

          {/* Controls */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleOpenModal()} className="gap-2">
              <Plus className="w-4 h-4" />
              New Exam
            </Button>
          </div>

          {/* Exams List */}
          {loading ? (
            <div className="text-center py-8">Loading exams...</div>
          ) : (
            <div className="grid gap-4">
              {filteredExams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{exam.title}</h3>
                        <p className="text-sm text-muted-foreground">{exam.subject}</p>
                        <div className="flex gap-4 mt-3 text-sm flex-wrap items-center">
                          <span>Duration: {exam.duration}m</span>
                          <span>Questions: {exam.questions}</span>
                          <span>Marks: {exam.marks}</span>
                          <span>Date: {exam.date}</span>
                          {exam.exam_fee !== undefined && (
                            <Badge variant={exam.exam_fee > 0 ? "default" : "secondary"} className="ml-2">
                              {exam.exam_fee > 0 ? `$${exam.exam_fee.toFixed(2)}` : 'Free'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="min-w-[140px]">
                          <Select 
                            value={exam.status} 
                            onValueChange={(value) => handleStatusChange(exam.id, value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">
                                <Badge variant="secondary">Draft</Badge>
                              </SelectItem>
                              <SelectItem value="scheduled">
                                <Badge variant="default">Scheduled</Badge>
                              </SelectItem>
                              <SelectItem value="ongoing">
                                <Badge variant="default" className="bg-green-600">Ongoing</Badge>
                              </SelectItem>
                              <SelectItem value="completed">
                                <Badge variant="outline">Completed</Badge>
                              </SelectItem>
                              <SelectItem value="cancelled">
                                <Badge variant="destructive">Cancelled</Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(exam)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteExam(exam.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold">{editingExam ? "Edit Exam" : "Create New Exam"}</h2>
                  <button onClick={handleCloseModal} className="p-1 hover:bg-muted rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exam Title</label>
                    <Input
                      placeholder="Enter exam title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <select
                      value={formData.subject_id}
                      onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="">Select a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Time</label>
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Time</label>
                      <Input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration (minutes)</label>
                      <Input
                        placeholder="60"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Questions</label>
                      <Input
                        placeholder="30"
                        type="number"
                        value={formData.questions}
                        onChange={(e) => setFormData({ ...formData, questions: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Total Marks</label>
                      <Input
                        placeholder="100"
                        type="number"
                        value={formData.marks}
                        onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Exam Date</label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Exam Control Settings */}
                  <div className="border-t pt-4 mt-4">
                    <label className="text-sm font-semibold mb-3 block">Exam Controls (Override Program Defaults)</label>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="proctoring"
                          checked={formData.proctoring_enabled}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, proctoring_enabled: checked as boolean })
                          }
                        />
                        <Label htmlFor="proctoring" className="cursor-pointer font-normal">
                          Enable Proctoring System
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Allow Answer Changes:</p>
                        <div className="flex gap-4 ml-3">
                          <div className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              id="inherit_change" 
                              name="allow_change"
                              checked={formData.allow_answer_change === null}
                              onChange={() => setFormData({ ...formData, allow_answer_change: null })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="inherit_change" className="cursor-pointer font-normal text-xs">
                              Inherit from Program
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              id="allow_change" 
                              name="allow_change"
                              checked={formData.allow_answer_change === true}
                              onChange={() => setFormData({ ...formData, allow_answer_change: true })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="allow_change" className="cursor-pointer font-normal text-xs">
                              Allow
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              id="disallow_change" 
                              name="allow_change"
                              checked={formData.allow_answer_change === false}
                              onChange={() => setFormData({ ...formData, allow_answer_change: false })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="disallow_change" className="cursor-pointer font-normal text-xs">
                              Disallow
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Show Question Counter:</p>
                        <div className="flex gap-4 ml-3">
                          <div className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              id="inherit_counter" 
                              name="show_counter"
                              checked={formData.show_question_counter === null}
                              onChange={() => setFormData({ ...formData, show_question_counter: null })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="inherit_counter" className="cursor-pointer font-normal text-xs">
                              Inherit from Program
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              id="show_counter" 
                              name="show_counter"
                              checked={formData.show_question_counter === true}
                              onChange={() => setFormData({ ...formData, show_question_counter: true })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="show_counter" className="cursor-pointer font-normal text-xs">
                              Show
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              id="hide_counter" 
                              name="show_counter"
                              checked={formData.show_question_counter === false}
                              onChange={() => setFormData({ ...formData, show_question_counter: false })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="hide_counter" className="cursor-pointer font-normal text-xs">
                              Hide
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Allow Review Before Submit:</p>
                        <div className="flex gap-4 ml-3">
                          <div className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              id="inherit_review" 
                              name="allow_review"
                              checked={formData.allow_answer_review === null}
                              onChange={() => setFormData({ ...formData, allow_answer_review: null })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="inherit_review" className="cursor-pointer font-normal text-xs">
                              Inherit from Program
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              id="allow_review" 
                              name="allow_review"
                              checked={formData.allow_answer_review === true}
                              onChange={() => setFormData({ ...formData, allow_answer_review: true })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="allow_review" className="cursor-pointer font-normal text-xs">
                              Allow
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              id="disallow_review" 
                              name="allow_review"
                              checked={formData.allow_answer_review === false}
                              onChange={() => setFormData({ ...formData, allow_answer_review: false })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="disallow_review" className="cursor-pointer font-normal text-xs">
                              Disallow
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={handleCloseModal} className="flex-1 bg-transparent">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveExam} className="flex-1">
                      {editingExam ? "Update" : "Create"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
  )
}
