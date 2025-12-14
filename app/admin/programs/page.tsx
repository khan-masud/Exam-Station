"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Edit2, Trash2, LogOut, X, RefreshCw, Users, BookOpen, DollarSign, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Program {
  id: string
  title: string
  description: string | null
  instructions: string | null
  cover_image: string | null
  enrollment_fee: number
  max_students: number | null
  status: "draft" | "published" | "archived"
  enrolled_count: number
  exam_count?: number
  start_date: string | null
  end_date: string | null
  created_at: string
  created_by_name: string
}

export default function ProgramsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [programs, setPrograms] = useState<Program[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    cover_image: "",
    enrollment_fee: "0",
    max_students: "",
    status: "draft",
    start_date: "",
    end_date: "",
    proctoring_enabled: false,
    allow_answer_change: true,
    show_question_counter: true,
    allow_answer_review: true,
  })

  useEffect(() => {
    loadPrograms()
  }, [])

  const loadPrograms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/programs')
      
      if (response.ok) {
        const data = await response.json()
        // API returns { success, programs, pagination }
        if (data.programs && Array.isArray(data.programs)) {
          setPrograms(data.programs)
        } else if (Array.isArray(data)) {
          // Fallback if API returns array directly
          setPrograms(data)
        } else {
          console.error('Unexpected API response format:', data)
          setPrograms([])
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch programs:', response.statusText, errorText)
        toast.error("Failed to load programs")
        setPrograms([]) // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      toast.error("An error occurred while loading programs")
      setPrograms([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (program?: Program) => {
    if (program) {
      // Format dates to YYYY-MM-DD for HTML date input
      const formatDateForInput = (dateStr: string | null) => {
        if (!dateStr) return ""
        const date = new Date(dateStr)
        return date.toISOString().split('T')[0]
      }
      
      setEditingProgram(program)
      setFormData({
        title: program.title,
        description: program.description || "",
        instructions: program.instructions || "",
        cover_image: program.cover_image || "",
        enrollment_fee: program.enrollment_fee.toString(),
        max_students: program.max_students?.toString() || "",
        status: program.status,
        start_date: formatDateForInput(program.start_date),
        end_date: formatDateForInput(program.end_date),
        proctoring_enabled: (program as any).proctoring_enabled || false,
        allow_answer_change: (program as any).allow_answer_change !== false,
        show_question_counter: (program as any).show_question_counter !== false,
        allow_answer_review: (program as any).allow_answer_review !== false,
      })
    } else {
      setEditingProgram(null)
      setFormData({
        title: "",
        description: "",
        instructions: "",
        cover_image: "",
        enrollment_fee: "0",
        max_students: "",
        status: "draft",
        start_date: "",
        end_date: "",
        proctoring_enabled: false,
        allow_answer_change: true,
        show_question_counter: true,
        allow_answer_review: true,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProgram(null)
  }

  const handleSaveProgram = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        instructions: formData.instructions || null,
        cover_image: formData.cover_image || null,
        enrollment_fee: parseFloat(formData.enrollment_fee) || 0,
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        proctoring_enabled: formData.proctoring_enabled,
        allow_answer_change: formData.allow_answer_change,
        show_question_counter: formData.show_question_counter,
        allow_answer_review: formData.allow_answer_review,
      }

      const response = await fetch(
        editingProgram ? `/api/programs/${editingProgram.id}` : '/api/programs',
        {
          method: editingProgram ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        }
      )

      if (response.ok) {
        toast.success(editingProgram ? 'Program updated' : 'Program created')
        handleCloseModal()
        loadPrograms()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save program')
      }
    } catch (error) {
      console.error('Error saving program:', error)
      toast.error('Failed to save program')
    }
  }

  const handleDeleteProgram = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/programs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast.success('Program deleted')
        loadPrograms()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete program')
      }
    } catch (error) {
      console.error('Error deleting program:', error)
      toast.error('Failed to delete program')
    } finally {
      setDeleting(null)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const filteredPrograms = (Array.isArray(programs) ? programs : []).filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (program.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || program.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Programs Management</h1>
              <p className="text-muted-foreground mt-2">Manage learning programs and batches</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => loadPrograms()} 
                variant="outline" 
                size="lg"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex gap-4 mb-6">
            <Link href="/admin/dashboard" className="text-primary hover:underline">
              ← Back to Dashboard
            </Link>
            <Link href="/admin/exams" className="text-primary hover:underline">
              Manage Exams
            </Link>
            <Link href="/admin/exam-setter" className="text-primary hover:underline">
              Exam Setter
            </Link>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleOpenModal()} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              New Program
            </Button>
          </div>

          {/* Programs Grid */}
          {filteredPrograms.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Programs Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? 'Try adjusting your filters' 
                    : 'Create your first program to get started'}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Program
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => (
                <Card key={program.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="relative">
                    {program.cover_image && (
                      <div className="w-full h-32 bg-gray-200 rounded-t-lg mb-4 overflow-hidden">
                        <img 
                          src={program.cover_image} 
                          alt={program.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2 text-lg">{program.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-2">
                          {program.description || 'No description'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Badge variant={
                        program.status === 'published' ? 'default' :
                        program.status === 'draft' ? 'secondary' : 'outline'
                      }>
                        {program.status}
                      </Badge>
                      {program.enrollment_fee === 0 ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : (
                        <Badge className="bg-amber-500">${program.enrollment_fee}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{program.enrolled_count} enrolled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span>{program.exam_count || 0} exams</span>
                      </div>
                      {program.max_students && (
                        <div className="flex items-center gap-2 col-span-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>Max: {program.max_students} students</span>
                        </div>
                      )}
                      {program.start_date && (
                        <div className="flex items-center gap-2 col-span-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">
                            Start: {new Date(program.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {program.end_date && (
                        <div className="flex items-center gap-2 col-span-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">
                            End: {new Date(program.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenModal(program)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteProgram(program.id)}
                        disabled={deleting === program.id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProgram ? 'Edit Program' : 'Create New Program'}</DialogTitle>
              <DialogDescription>
                {editingProgram ? 'Update program details below' : 'Fill in the details to create a new program'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Full Stack Web Development"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what students will learn in this program"
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="instructions">Default Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Enter default instructions for all exams in this program. These will be displayed before students take exams."
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cover_image">Cover Image URL</Label>
                <Input
                  id="cover_image"
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="enrollment_fee">Enrollment Fee ($)</Label>
                  <Input
                    id="enrollment_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.enrollment_fee}
                    onChange={(e) => setFormData({ ...formData, enrollment_fee: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="max_students">Max Students (Optional)</Label>
                  <Input
                    id="max_students"
                    type="number"
                    min="1"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_date">Start Date (Optional)</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Exam Control Settings - Applied to all exams in this program */}
              <div className="border-t pt-4 mt-4">
                <label className="text-sm font-semibold mb-3 block">
                  Exam Settings (Applied to all exams in this program by default)
                </label>
                
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

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="allow_change"
                      checked={formData.allow_answer_change}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, allow_answer_change: checked as boolean })
                      }
                    />
                    <Label htmlFor="allow_change" className="cursor-pointer font-normal">
                      Allow Students to Change Selected Options
                    </Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="show_counter"
                      checked={formData.show_question_counter}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, show_question_counter: checked as boolean })
                      }
                    />
                    <Label htmlFor="show_counter" className="cursor-pointer font-normal">
                      Show Question Counter During Exam
                    </Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="review_answers"
                      checked={formData.allow_answer_review}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, allow_answer_review: checked as boolean })
                      }
                    />
                    <Label htmlFor="review_answers" className="cursor-pointer font-normal">
                      Allow Students to Review All Answers Before Submission
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleSaveProgram}>
                {editingProgram ? "Update" : "Create"} Program
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  )
}
