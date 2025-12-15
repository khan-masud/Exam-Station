"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Trash2, Save, CheckCircle, Circle, Loader2, Filter, X, Edit2, Clock, BookOpen, Target, Zap, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

interface Question {
  id: string
  question_text: string
  difficulty_level: string
  marks: number
  question_type: string
  subject_name: string
  subject_id: string
  topics: string
  options_count: number
}

interface Exam {
  id: string
  title: string
  description: string
  total_questions: number
  total_marks: number
  duration_minutes: number
  instructions?: string
  program_name?: string
  program_id?: string
  programs?: Array<{ id: string; title: string }>
  proctoring_enabled?: boolean
  allow_answer_change?: boolean
  show_question_counter?: boolean
  allow_answer_review?: boolean
  exam_date?: string
  exam_start_time?: string
  exam_end_time?: string
  status?: 'draft' | 'published'
  negative_marking?: number
  passing_marks?: number
}

interface Program {
  id: string
  title: string
  status: string
  enrollment_fee: number
}

interface Subject {
  id: string
  name: string
}

interface Topic {
  id: string
  name: string
  color: string
}

interface CreateExamFormData {
  title: string
  duration_minutes: string
  total_questions: string
  total_marks: string
  exam_date: string
  exam_start_time: string
  exam_end_time: string
  proctoring_enabled: boolean
  allow_answer_change: boolean
  show_question_counter: boolean
  allow_answer_review: boolean
  status: 'draft' | 'published'
  negative_marking: string
  passing_marks: string
}

export default function ExamSetterPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [filteredExams, setFilteredExams] = useState<Exam[]>([])
  const [examSearch, setExamSearch] = useState("")
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [examDetails, setExamDetails] = useState<Exam | null>(null)
  const [examInstructions, setExamInstructions] = useState<string>("")
  const [isEditingInstructions, setIsEditingInstructions] = useState(false)
  const [isSavingInstructions, setIsSavingInstructions] = useState(false)
  
  // Exam Controls
  const [isEditingControls, setIsEditingControls] = useState(false)
  const [isSavingControls, setIsSavingControls] = useState(false)
  const [examControls, setExamControls] = useState({
    proctoring_enabled: false,
    allow_answer_change: true,
    show_question_counter: true,
    allow_answer_review: true,
  })
  const [programControls, setProgramControls] = useState({
    proctoring_enabled: false,
    allow_answer_change: true,
    show_question_counter: true,
    allow_answer_review: true,
  })
  const [resolvedControls, setResolvedControls] = useState({
    proctoring_enabled: false,
    allow_answer_change: true,
    show_question_counter: true,
    allow_answer_review: true,
  })
  
  const [assignedQuestions, setAssignedQuestions] = useState<Question[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  
  // Programs
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set())
  const [savingPrograms, setSavingPrograms] = useState(false)
  
  // Filters
  const [search, setSearch] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [topicSearch, setTopicSearch] = useState("")
  const [selectedTopicId, setSelectedTopicId] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([])
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Exam Creation Step & UI States
  const [currentStep, setCurrentStep] = useState<'list' | 'create' | 'edit'>('list') // 'list': Show exam list, 'create': Create new, 'edit': Edit existing
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [creatingExam, setCreatingExam] = useState(false)
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null)
  const [filteredExamsForList, setFilteredExamsForList] = useState<Exam[]>([])
  const [examsSearchTerm, setExamsSearchTerm] = useState("")
  
  // Create Exam Form Data
  const [createFormData, setCreateFormData] = useState<CreateExamFormData>({
    title: "",
    duration_minutes: "",
    total_questions: "",
    total_marks: "",
    exam_date: "",
    exam_start_time: "09:00",
    exam_end_time: "11:00",
    proctoring_enabled: false,
    allow_answer_change: true,
    show_question_counter: true,
    allow_answer_review: true,
    status: 'draft',
    negative_marking: "0.25",
    passing_marks: "40",
  })

  useEffect(() => {
    fetchExams()
    fetchSubjects()
    fetchTopics()
    fetchPrograms()
  }, [])

  useEffect(() => {
    // Filter exams based on search
    if (examSearch.trim()) {
      const filtered = exams.filter(exam => 
        exam.title.toLowerCase().includes(examSearch.toLowerCase()) ||
        exam.description?.toLowerCase().includes(examSearch.toLowerCase())
      )
      setFilteredExams(filtered)
    } else {
      setFilteredExams(exams)
    }
  }, [exams, examSearch])

  // Filter exams for list view (with separate search term)
  useEffect(() => {
    if (examsSearchTerm.trim()) {
      const filtered = exams.filter(exam => 
        exam.title.toLowerCase().includes(examsSearchTerm.toLowerCase())
      )
      setFilteredExamsForList(filtered)
    } else {
      setFilteredExamsForList(exams)
    }
  }, [exams, examsSearchTerm])

  useEffect(() => {
    if (selectedExam) {
      fetchExamDetails()
      fetchAssignedQuestions()
      fetchExamPrograms()
    } else {
      setSelectedPrograms(new Set())
    }
  }, [selectedExam])

  // Filter topics based on search term
  useEffect(() => {
    if (topicSearch.trim()) {
      const filtered = topics.filter(topic =>
        topic.name.toLowerCase().includes(topicSearch.toLowerCase())
      )
      setFilteredTopics(filtered)
    } else {
      setFilteredTopics(topics)
    }
  }, [topicSearch, topics])

  useEffect(() => {
    fetchAvailableQuestions()
  }, [search, difficulty, subjectId, selectedTopicId, page])

  // Recalculate resolved controls when exam or program controls change
  useEffect(() => {
    // In the new model, resolved = exam values (which are already copies of program defaults)
    // No need for runtime inheritance - exam table has actual values
    const resolved = {
      proctoring_enabled: examControls.proctoring_enabled ?? programControls.proctoring_enabled,
      allow_answer_change: examControls.allow_answer_change ?? programControls.allow_answer_change,
      show_question_counter: examControls.show_question_counter ?? programControls.show_question_counter,
      allow_answer_review: examControls.allow_answer_review ?? programControls.allow_answer_review,
    }
    setResolvedControls(resolved)
  }, [examControls, programControls])

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/admin/exams', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch exams')
      const data = await response.json()
      setExams(data.exams || [])
    } catch (error) {
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch subjects')
      const data = await response.json()
      setSubjects(data.subjects || [])
    } catch (error) {
    }
  }

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/admin/topics', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch topics')
      const data = await response.json()
      setTopics(data.topics || [])
    } catch (error) {
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch programs')
      const data = await response.json()
      setPrograms(data.programs || [])
    } catch (error) {
    }
  }

  const fetchExamPrograms = async () => {
    try {
      const response = await fetch(`/api/admin/exams/${selectedExam}/programs`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch exam programs')
      const data = await response.json()
      const programIds = data.programs?.map((p: any) => p.id) || []
      setSelectedPrograms(new Set(programIds))
    } catch (error) {
    }
  }

  const fetchExamDetails = async () => {
    try {
      const response = await fetch(`/api/admin/exams/${selectedExam}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch exam details')
      const data = await response.json()
      setExamDetails(data.exam)
      setExamInstructions(data.exam.instructions || "")
      
      // Store exam-specific controls (these are actual values, not nullable anymore)
      const examCtrl = {
        proctoring_enabled: data.exam.proctoring_enabled || false,
        allow_answer_change: data.exam.allow_answer_change !== 0 && data.exam.allow_answer_change !== false ? true : false,
        show_question_counter: data.exam.show_question_counter !== 0 && data.exam.show_question_counter !== false ? true : false,
        allow_answer_review: data.exam.allow_answer_review !== 0 && data.exam.allow_answer_review !== false ? true : false,
      }
      setExamControls(examCtrl)
      
      // Fetch and store program controls
      if (data.exam.program_id) {
        try {
          const programResponse = await fetch(`/api/programs/${data.exam.program_id}`, {
            credentials: 'include'
          })
          if (programResponse.ok) {
            const programData = await programResponse.json()
            const program = programData.program
            const programCtrl = {
              proctoring_enabled: program.proctoring_enabled || false,
              allow_answer_change: program.allow_answer_change ?? true,
              show_question_counter: program.show_question_counter ?? true,
              allow_answer_review: program.allow_answer_review ?? true,
            }
            setProgramControls(programCtrl)
          }
        } catch (err) {
        }
      }
      
      setIsEditingInstructions(false)
      setIsEditingControls(false)
    } catch (error) {
      toast.error('Failed to load exam details')
    }
  }

  // ============ EXAM CREATION HANDLERS ============
  
  const handleOpenCreateModal = () => {
    setEditingExam(null)
    setCreateFormData({
      title: "",
      duration_minutes: "",
      total_questions: "",
      total_marks: "",
      exam_date: "",
      exam_start_time: "09:00",
      exam_end_time: "11:00",
      proctoring_enabled: false,
      allow_answer_change: true,
      show_question_counter: true,
      allow_answer_review: true,
      status: 'draft',
      negative_marking: "0.25",
      passing_marks: "40",
    })
    setShowCreateModal(true)
  }

  const handleOpenEditModal = (exam: Exam) => {
    setEditingExam(exam)
    
    // Format exam_date to YYYY-MM-DD if it exists
    let formattedDate = ""
    if (exam.exam_date) {
      const dateObj = new Date(exam.exam_date)
      formattedDate = dateObj.toISOString().split('T')[0]
    }
    
    // Format times - handle both HH:MM and HH:MM:SS formats
    const formatTime = (time: string | undefined) => {
      if (!time) return "09:00"
      return time.substring(0, 5) // Get HH:MM part
    }
    
    setCreateFormData({
      title: exam.title,
      duration_minutes: exam.duration_minutes.toString(),
      total_questions: exam.total_questions.toString(),
      total_marks: exam.total_marks.toString(),
      exam_date: formattedDate,
      exam_start_time: formatTime(exam.exam_start_time),
      exam_end_time: formatTime(exam.exam_end_time),
      proctoring_enabled: exam.proctoring_enabled || false,
      allow_answer_change: exam.allow_answer_change ?? true,
      show_question_counter: exam.show_question_counter ?? true,
      allow_answer_review: exam.allow_answer_review ?? true,
      status: (exam.status === 'published' || exam.status === 'draft' ? exam.status : 'draft') as 'draft' | 'published',
      negative_marking: (exam.negative_marking || 0.25).toString(),
      passing_marks: (exam.passing_marks || 40).toString(),
    })
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setEditingExam(null)
  }

  const handleCreateOrUpdateExam = async () => {
    // Validation
    if (!createFormData.title.trim()) {
      toast.error("Exam title is required")
      return
    }
    if (!createFormData.duration_minutes || Number(createFormData.duration_minutes) <= 0) {
      toast.error("Duration must be greater than 0")
      return
    }
    if (!createFormData.total_questions || Number(createFormData.total_questions) <= 0) {
      toast.error("Number of questions must be greater than 0")
      return
    }
    if (!createFormData.total_marks || Number(createFormData.total_marks) <= 0) {
      toast.error("Total marks must be greater than 0")
      return
    }

    setCreatingExam(true)
    try {
      const method = editingExam ? 'PUT' : 'POST'
      const endpoint = editingExam ? `/api/exams` : `/api/exams`
      
      const payload = {
        ...(editingExam && { id: editingExam.id }),
        title: createFormData.title,
        duration_minutes: Number(createFormData.duration_minutes),
        total_questions: Number(createFormData.total_questions),
        total_marks: Number(createFormData.total_marks),
        exam_date: createFormData.exam_date,
        exam_start_time: createFormData.exam_start_time,
        exam_end_time: createFormData.exam_end_time,
        proctoring_enabled: createFormData.proctoring_enabled,
        allow_answer_change: createFormData.allow_answer_change,
        show_question_counter: createFormData.show_question_counter,
        allow_answer_review: createFormData.allow_answer_review,
        status: createFormData.status,
        negative_marking: parseFloat(createFormData.negative_marking || '0.25'),
        passing_marks: Number(createFormData.passing_marks || 40),
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save exam')
      }

      const data = await response.json()
      toast.success(editingExam ? "Exam updated successfully" : "Exam created successfully")
      
      // After creating/updating, move to Step 2 (Add Questions)
      setShowCreateModal(false)
      await fetchExams()
      
      const newExamId = editingExam ? editingExam.id : data.id
      setSelectedExam(newExamId)
      setCurrentStep('edit')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save exam')
    } finally {
      setCreatingExam(false)
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return
    }

    setDeletingExamId(examId)
    try {
      const response = await fetch(`/api/exams?id=${examId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete exam')
      }

      toast.success("Exam deleted successfully")
      await fetchExams()
      
      // If the deleted exam was selected, deselect it
      if (selectedExam === examId) {
        setSelectedExam("")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete exam')
    } finally {
      setDeletingExamId(null)
    }
  }

  // ============ TOGGLE EXAM STATUS ============
  const handleToggleExamStatus = async (examId: string, currentStatus: 'draft' | 'published', newStatus: 'draft' | 'published') => {
    try {
      const response = await fetch(`/api/admin/exams/${examId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus
        })
      })


      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update exam status')
      }

      const responseData = await response.json()
      
      toast.success(`Exam ${newStatus === 'published' ? 'published' : 'drafted'} successfully`)
      await fetchExams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update exam status')
    }
  }

  // ============ END EXAM CREATION HANDLERS ============

  const handleSaveExamControls = async () => {
    if (!selectedExam) return
    
    setIsSavingControls(true)
    try {
      const response = await fetch(`/api/exams/${selectedExam}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          proctoring_enabled: examControls.proctoring_enabled,
          allow_answer_change: examControls.allow_answer_change,
          show_question_counter: examControls.show_question_counter,
          allow_answer_review: examControls.allow_answer_review,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save exam controls')
      }
      const saveData = await response.json()
      
      toast.success('Exam controls saved successfully')
      setIsEditingControls(false)
      await fetchExamDetails()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save exam controls')
    } finally {
      setIsSavingControls(false)
    }
  }

  const fetchAssignedQuestions = async () => {
    try {
      const response = await fetch(`/api/admin/exams/${selectedExam}/questions`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch assigned questions')
      const data = await response.json()
      setAssignedQuestions(data.questions || [])
    } catch (error) {
    }
  }

  const fetchAvailableQuestions = async () => {
    setQuestionsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      if (search) params.append('search', search)
      if (difficulty) params.append('difficulty', difficulty)
      if (subjectId) params.append('subjectId', subjectId)
      if (selectedTopicId) params.append('topicId', selectedTopicId)

      const response = await fetch(`/api/admin/questions?${params}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch questions')
      const data = await response.json()
      setAvailableQuestions(data.questions || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      toast.error('Failed to load questions')
    } finally {
      setQuestionsLoading(false)
    }
  }

  const handleQuestionToggle = (questionId: string) => {
    const isAlreadyAssigned = assignedQuestions.some(q => q.id === questionId)
    
    if (isAlreadyAssigned) {
      toast.error('This question is already assigned to this exam')
      return
    }

    const newSelected = new Set(selectedQuestions)
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId)
    } else {
      newSelected.add(questionId)
    }
    setSelectedQuestions(newSelected)
  }

  const handleProgramToggle = (programId: string) => {
    const newSelected = new Set(selectedPrograms)
    if (newSelected.has(programId)) {
      newSelected.delete(programId)
    } else {
      newSelected.add(programId)
    }
    setSelectedPrograms(newSelected)
  }

  const handleSavePrograms = async () => {
    setSavingPrograms(true)
    try {
      const response = await fetch(`/api/admin/exams/${selectedExam}/programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ programIds: Array.from(selectedPrograms) })
      })

      if (!response.ok) throw new Error('Failed to save programs')
      
      toast.success('Programs updated successfully')
      await fetchExamDetails()
    } catch (error) {
      toast.error('Failed to save programs')
    } finally {
      setSavingPrograms(false)
    }
  }

  const handleSaveInstructions = async () => {
    if (!selectedExam) return
    
    setIsSavingInstructions(true)
    try {
      const response = await fetch(`/api/exams/${selectedExam}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ instructions: examInstructions || null })
      })

      if (!response.ok) throw new Error('Failed to save instructions')
      
      toast.success('Instructions saved successfully')
      setIsEditingInstructions(false)
      await fetchExamDetails()
    } catch (error) {
      toast.error('Failed to save instructions')
    } finally {
      setIsSavingInstructions(false)
    }
  }

  const handleAddQuestions = async () => {
    if (selectedQuestions.size === 0) {
      toast.error('Please select at least one question')
      return
    }

    // Check for duplicates
    const currentAssignedIds = assignedQuestions.map(q => q.id)
    const duplicates = Array.from(selectedQuestions).filter(qId => currentAssignedIds.includes(qId))
    
    if (duplicates.length > 0) {
      toast.error(`${duplicates.length} question(s) already assigned to this exam`)
      // Remove duplicates from selection
      const newSelected = new Set(selectedQuestions)
      duplicates.forEach(id => newSelected.delete(id))
      setSelectedQuestions(newSelected)
      return
    }

    setSaving(true)
    try {
      const allQuestionIds = [...currentAssignedIds, ...Array.from(selectedQuestions)]

      const response = await fetch(`/api/admin/exams/${selectedExam}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questionIds: allQuestionIds })
      })

      if (!response.ok) throw new Error('Failed to add questions')
      
      const data = await response.json()
      toast.success(`Added ${selectedQuestions.size} question(s) successfully`)
      setSelectedQuestions(new Set())
      await fetchAssignedQuestions()
      await fetchExamDetails()
    } catch (error) {
      toast.error('Failed to add questions')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/admin/exams/${selectedExam}/questions?questionId=${questionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to remove question')
      
      toast.success('Question removed successfully')
      await fetchAssignedQuestions()
      await fetchExamDetails()
    } catch (error) {
      toast.error('Failed to remove question')
    }
  }

  const clearFilters = () => {
    setSearch("")
    setDifficulty("")
    setSubjectId("")
    setSelectedTopicId("")
    setTopicSearch("")
    setPage(1)
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getExamStatus = (exam: Exam) => {
    if (!exam.exam_date) return { status: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300' }
    
    let dateStr = ''
    
    // Handle both string and Date object formats
    if (typeof exam.exam_date === 'object' && exam.exam_date !== null && 'getFullYear' in exam.exam_date) {
      // It's a Date object
      const examDate = exam.exam_date as any
      const year = examDate.getFullYear()
      const month = String(examDate.getMonth() + 1).padStart(2, '0')
      const day = String(examDate.getDate()).padStart(2, '0')
      dateStr = `${year}-${month}-${day}`
    } else if (typeof exam.exam_date === 'string') {
      // It's a string - extract just the date part
      dateStr = exam.exam_date.includes('T') ? exam.exam_date.split('T')[0] : exam.exam_date
    }
    
    if (!dateStr) {
      return { status: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300' }
    }
    
    // Create local date (not UTC)
    const [year, month, day] = dateStr.split('-').map(Number)
    
    // Parse exam times
    const [startHour, startMin] = (exam.exam_start_time || '00:00').split(':').map(Number)
    const [endHour, endMin] = (exam.exam_end_time || '23:59').split(':').map(Number)
    
    const examDateTime = new Date(year, month - 1, day, startHour, startMin, 0)
    const endDateTime = new Date(year, month - 1, day, endHour, endMin, 59)
    const now = new Date()
    
    // Debug log
    
    if (now < examDateTime) {
      return { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
    } else if (now >= examDateTime && now <= endDateTime) {
      return { status: 'ongoing', label: 'Ongoing', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
    } else {
      return { status: 'previous', label: 'Previous', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Exam Setter</h1>
        <p className="text-muted-foreground">Create exams and manage questions from the question bank</p>
      </div>

      {/* ============ STEP 1: EXAM LIST VIEW ============ */}
      {!selectedExam && (
        <div className="space-y-6">
          {/* Create Exam Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Your Exams</h2>
              <p className="text-sm text-muted-foreground">Step 1: Create or select an exam</p>
            </div>
            <Button onClick={handleOpenCreateModal} className="gap-2">
              <Plus className="w-4 h-4" />
              Create New Exam
            </Button>
          </div>

          {/* Exams List Card */}
          <Card>
            <CardHeader>
              <CardTitle>Exams</CardTitle>
              <CardDescription>List of all exams with stats and quick actions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exams by title..."
                    value={examsSearchTerm}
                    onChange={(e) => setExamsSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Exams Table/Grid */}
              {filteredExamsForList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No exams found. Create your first exam!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[800px] overflow-y-auto">
                  {filteredExamsForList.map((exam) => (
                    <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <CardTitle className="line-clamp-2 text-lg">{exam.title}</CardTitle>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={`${getExamStatus(exam).color}`}>
                            {getExamStatus(exam).label}
                          </Badge>
                          <Badge className={exam.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}>
                            {exam.status === 'published' ? 'Published' : exam.status === 'draft' ? 'Draft' : `Unknown: ${exam.status}`}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Duration</span>
                              <span className="font-medium">{exam.duration_minutes}m</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-500" />
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Questions</span>
                              <span className="font-medium">{exam.total_questions}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Marks</span>
                              <span className="font-medium">{exam.total_marks}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-500" />
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Per Q</span>
                              <span className="font-medium">{exam.total_questions > 0 ? (exam.total_marks / exam.total_questions).toFixed(1) : 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-2 text-xs">
                          {exam.exam_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(exam.exam_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {exam.exam_start_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>Start: {exam.exam_start_time}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedExam(exam.id)}
                          >
                            Manage
                          </Button>
                          <Select value={exam.status || 'draft'} onValueChange={(newStatus) => {
                            handleToggleExamStatus(exam.id, (exam.status as 'draft' | 'published') || 'draft', newStatus as 'draft' | 'published')
                          }}>
                            <SelectTrigger className="w-[110px] h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Publish</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenEditModal(exam)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDeleteExam(exam.id)}
                            disabled={deletingExamId === exam.id}
                          >
                            {deletingExamId === exam.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============ CREATE/EDIT EXAM MODAL ============ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-card">
              <h2 className="text-xl font-bold">
                {editingExam ? "Edit Exam" : "Create New Exam"}
              </h2>
              <button 
                onClick={handleCloseCreateModal} 
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CardContent className="p-6 space-y-4">
              {/* Exam Title */}
              <div className="space-y-2">
                <Label>Exam Title *</Label>
                <Input
                  placeholder="Enter exam title"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                />
              </div>

              {/* Duration & Questions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes) *</Label>
                  <Input
                    placeholder="60"
                    type="number"
                    min="1"
                    value={createFormData.duration_minutes}
                    onChange={(e) => setCreateFormData({ ...createFormData, duration_minutes: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Questions *</Label>
                  <Input
                    placeholder="30"
                    type="number"
                    min="1"
                    value={createFormData.total_questions}
                    onChange={(e) => setCreateFormData({ ...createFormData, total_questions: e.target.value })}
                  />
                </div>
              </div>

              {/* Total Marks & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Marks *</Label>
                  <Input
                    placeholder="100"
                    type="number"
                    min="1"
                    value={createFormData.total_marks}
                    onChange={(e) => setCreateFormData({ ...createFormData, total_marks: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exam Date</Label>
                  <Input
                    type="date"
                    value={createFormData.exam_date}
                    onChange={(e) => setCreateFormData({ ...createFormData, exam_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={createFormData.exam_start_time}
                    onChange={(e) => setCreateFormData({ ...createFormData, exam_start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={createFormData.exam_end_time}
                    onChange={(e) => setCreateFormData({ ...createFormData, exam_end_time: e.target.value })}
                  />
                </div>
              </div>

              {/* Exam Status */}
              <div className="space-y-2 border-t pt-4 mt-6">
                <Label>Exam Status *</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="status_draft"
                      name="status"
                      value="draft"
                      checked={createFormData.status === 'draft'}
                      onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value as 'draft' | 'published' })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="status_draft" className="cursor-pointer font-normal">
                      Draft
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="status_published"
                      name="status"
                      value="published"
                      checked={createFormData.status === 'published'}
                      onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value as 'draft' | 'published' })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="status_published" className="cursor-pointer font-normal">
                      Publish
                    </Label>
                  </div>
                </div>
              </div>

              {/* Negative Marking */}
              <div className="space-y-2">
                <Label htmlFor="negative_marking">Negative Marking (per wrong answer)</Label>
                <Input
                  id="negative_marking"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.25"
                  value={createFormData.negative_marking}
                  onChange={(e) => setCreateFormData({ ...createFormData, negative_marking: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Default: 0.25 marks deducted per wrong answer</p>
              </div>

              {/* Passing Marks */}
              <div className="space-y-2">
                <Label htmlFor="passing_marks">Minimum Passing Marks</Label>
                <Input
                  id="passing_marks"
                  type="number"
                  min="0"
                  placeholder="40"
                  value={createFormData.passing_marks}
                  onChange={(e) => setCreateFormData({ ...createFormData, passing_marks: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Minimum marks required to pass the exam</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleCloseCreateModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateOrUpdateExam}
                  disabled={creatingExam}
                  className="flex-1"
                >
                  {creatingExam ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingExam ? (
                    "Update Exam"
                  ) : (
                    "Create Exam"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============ STEP 2: EXAM SELECTOR & QUESTION MANAGEMENT ============ */}
      {selectedExam && (
        <>
          {/* Back Button */}
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedExam("")}
            >
              ← Back to Exams
            </Button>
            <span className="text-sm text-muted-foreground">Step 2: Add Questions</span>
          </div>

          {/* Exam Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Exam</CardTitle>
              <CardDescription>Manage questions for this exam</CardDescription>
            </CardHeader>
            <CardContent>
              {examDetails && (
                <div className="flex items-end gap-6 bg-muted p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Exam Title</p>
                    <p className="text-lg font-semibold">{examDetails.title}</p>
                  </div>
                  {examDetails.program_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Program</p>
                      <p className="text-lg font-semibold">{examDetails.program_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-2xl font-bold">{examDetails.duration_minutes}m</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Questions</p>
                    <p className="text-2xl font-bold">{examDetails.total_questions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Marks</p>
                    <p className="text-2xl font-bold">{examDetails.total_marks}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Program Assignment */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assign Programs</CardTitle>
                  <CardDescription>Select which programs can access this exam</CardDescription>
                </div>
                <Button onClick={handleSavePrograms} disabled={savingPrograms}>
                  {savingPrograms ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Programs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {programs.filter(p => p.status === 'published').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No published programs available. Create and publish programs first.
                  </p>
                ) : (
                  programs.filter(p => p.status === 'published').map((program) => (
                    <div
                      key={program.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => handleProgramToggle(program.id)}
                    >
                      <Checkbox
                        checked={selectedPrograms.has(program.id)}
                        onCheckedChange={() => handleProgramToggle(program.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{program.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {program.enrollment_fee > 0 ? `$${Number(program.enrollment_fee).toFixed(2)}` : 'Free'}
                        </p>
                      </div>
                      {selectedPrograms.has(program.id) && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exam Instructions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exam Instructions</CardTitle>
                  <CardDescription>Set instructions that students will see before the exam</CardDescription>
                </div>
                {isEditingInstructions && (
                  <Button onClick={handleSaveInstructions} disabled={isSavingInstructions}>
                    {isSavingInstructions ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Instructions
                  </Button>
                )}
                {!isEditingInstructions && (
                  <Button variant="outline" onClick={() => setIsEditingInstructions(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingInstructions ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Enter exam instructions that will be displayed to students before they start the exam. You can also add program instructions from the programs page."
                    value={examInstructions}
                    onChange={(e) => setExamInstructions(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingInstructions(false)
                        setExamInstructions(examDetails?.instructions || "")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {examInstructions ? (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm whitespace-pre-wrap">
                      {examInstructions}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No instructions set yet. Click Edit to add exam instructions.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exam Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exam Controls</CardTitle>
                  <CardDescription>Configure exam-specific settings (NULL = inherit from program)</CardDescription>
                </div>
                {isEditingControls && (
                  <Button onClick={handleSaveExamControls} disabled={isSavingControls}>
                    {isSavingControls ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Controls
                  </Button>
                )}
                {!isEditingControls && (
                  <Button variant="outline" onClick={() => setIsEditingControls(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingControls ? (
                <div className="space-y-4">
                  <div className="space-y-3 pb-4 border-b">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="proctoring"
                        checked={examControls.proctoring_enabled}
                        onCheckedChange={(checked) =>
                          setExamControls({ ...examControls, proctoring_enabled: checked as boolean })
                        }
                      />
                      <Label htmlFor="proctoring" className="cursor-pointer font-normal">
                        Enable Proctoring System
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="allow_change"
                        checked={examControls.allow_answer_change}
                        onCheckedChange={(checked) =>
                          setExamControls({ ...examControls, allow_answer_change: checked as boolean })
                        }
                      />
                      <Label htmlFor="allow_change" className="cursor-pointer font-normal">
                        Allow Students to Change Selected Options
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="show_counter"
                        checked={examControls.show_question_counter}
                        onCheckedChange={(checked) =>
                          setExamControls({ ...examControls, show_question_counter: checked as boolean })
                        }
                      />
                      <Label htmlFor="show_counter" className="cursor-pointer font-normal">
                        Show Question Counter During Exam
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="review_answers"
                        checked={examControls.allow_answer_review}
                        onCheckedChange={(checked) =>
                          setExamControls({ ...examControls, allow_answer_review: checked as boolean })
                        }
                      />
                      <Label htmlFor="review_answers" className="cursor-pointer font-normal">
                        Allow Students to Review All Answers Before Submission
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingControls(false)
                        if (examDetails) {
                          setExamControls({
                            proctoring_enabled: (examDetails as any).proctoring_enabled,
                            allow_answer_change: (examDetails as any).allow_answer_change,
                            show_question_counter: (examDetails as any).show_question_counter,
                            allow_answer_review: (examDetails as any).allow_answer_review,
                          })
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {/* Program Defaults (Left) */}
                  <div className="text-sm">
                    <p className="font-medium mb-3 text-slate-600 dark:text-slate-400">Program Defaults:</p>
                    <ul className="space-y-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <li className="flex items-center gap-2">
                        {programControls.proctoring_enabled ? "✓" : "✗"} Proctoring:
                        <span className="text-muted-foreground text-xs">
                          {programControls.proctoring_enabled ? "Enabled" : "Disabled"}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        {programControls.allow_answer_change ? "✓" : "✗"} Answer Changes:
                        <span className="text-muted-foreground text-xs">
                          {programControls.allow_answer_change ? "Allowed" : "Not Allowed"}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        {programControls.show_question_counter ? "✓" : "✗"} Question Counter:
                        <span className="text-muted-foreground text-xs">
                          {programControls.show_question_counter ? "Shown" : "Hidden"}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        {programControls.allow_answer_review ? "✓" : "✗"} Review Before Submit:
                        <span className="text-muted-foreground text-xs">
                          {programControls.allow_answer_review ? "Allowed" : "Not Allowed"}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Exam Settings (Right) */}
                  <div className="text-sm">
                    <p className="font-medium mb-3 text-green-700 dark:text-green-400">Exam Settings (What Students Will Experience):</p>
                    <ul className="space-y-2 bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <li className="flex items-center gap-2 text-green-700 dark:text-green-200">
                        {examControls.proctoring_enabled ? "✓" : "✗"} Proctoring:
                        <span className="text-xs">
                          {examControls.proctoring_enabled ? "Enabled" : "Disabled"}
                          {examControls.proctoring_enabled !== programControls.proctoring_enabled && " (Modified)"}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-green-700 dark:text-green-200">
                        {examControls.allow_answer_change ? "✓" : "✗"} Answer Changes:
                        <span className="text-xs">
                          {examControls.allow_answer_change ? "Allowed" : "Not Allowed"}
                          {examControls.allow_answer_change !== programControls.allow_answer_change && " (Modified)"}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-green-700 dark:text-green-200">
                        {examControls.show_question_counter ? "✓" : "✗"} Question Counter:
                        <span className="text-xs">
                          {examControls.show_question_counter ? "Shown" : "Hidden"}
                          {examControls.show_question_counter !== programControls.show_question_counter && " (Modified)"}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-green-700 dark:text-green-200">
                        {examControls.allow_answer_review ? "✓" : "✗"} Review Before Submit:
                        <span className="text-xs">
                          {examControls.allow_answer_review ? "Allowed" : "Not Allowed"}
                          {examControls.allow_answer_review !== programControls.allow_answer_review && " (Modified)"}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
          {/* Question Bank */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Question Bank</CardTitle>
                  <CardDescription>Search and filter questions to add</CardDescription>
                </div>
                {selectedQuestions.size > 0 && (
                  <Button onClick={handleAddQuestions} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add ({selectedQuestions.size})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Topic Search Field */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search topics..."
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    className="pl-10"
                  />
                  
                  {/* Dropdown suggestions for topics */}
                  {topicSearch && filteredTopics.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white dark:bg-slate-950 shadow-lg z-50">
                      {filteredTopics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => {
                            setSelectedTopicId(topic.id)
                            setTopicSearch(topic.name)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 border-b last:border-b-0 flex items-center gap-2"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: topic.color }}
                          />
                          {topic.name}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {selectedTopicId && (
                    <button
                      onClick={() => {
                        setSelectedTopicId("")
                        setTopicSearch("")
                      }}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {(search || difficulty || subjectId || selectedTopicId) && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {questionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : availableQuestions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No questions found</p>
                ) : (
                  availableQuestions
                    .filter(question => !assignedQuestions.some(aq => aq.id === question.id))
                    .map((question) => (
                    <div
                      key={`available-${question.id}`}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => handleQuestionToggle(question.id)}
                    >
                      <Checkbox
                        checked={selectedQuestions.has(question.id)}
                        onCheckedChange={() => handleQuestionToggle(question.id)}
                      />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm line-clamp-2">{question.question_text}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getDifficultyColor(question.difficulty_level)}>
                            {question.difficulty_level}
                          </Badge>
                          <Badge variant="outline">{question.subject_name}</Badge>
                          <Badge variant="secondary">{question.marks} mark(s)</Badge>
                          {question.topics && (
                            <Badge variant="outline" className="text-xs">
                              {question.topics.split(',')[0]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Questions ({assignedQuestions.length})</CardTitle>
              <CardDescription>Questions currently in this exam</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[700px] overflow-y-auto">
                {assignedQuestions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No questions assigned yet</p>
                ) : (
                  assignedQuestions.map((question, index) => (
                    <div
                      key={`assigned-${question.id}-${index}`}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm line-clamp-2">{question.question_text}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getDifficultyColor(question.difficulty_level)}>
                            {question.difficulty_level}
                          </Badge>
                          <Badge variant="outline">{question.subject_name}</Badge>
                          <Badge variant="secondary">{question.marks} mark(s)</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuestion(question.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        </>
      )}
    </div>
  )
}
