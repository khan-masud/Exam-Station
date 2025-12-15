"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  LogOut, 
  X,
  CheckCircle,
  XCircle,
  ListOrdered,
  FileText,
  HelpCircle,
  Shuffle,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface Subject {
  id: string
  name: string
  description: string
}

interface Topic {
  id: string
  name: string
  slug: string
  color: string
}

interface QuestionOption {
  id?: string
  option_text: string
  is_correct: boolean
  option_label: string
}

interface Question {
  id: string
  question_text: string
  question_type_id: number
  question_type_name: string
  subject_id: string
  subject_name: string
  difficulty_level: "easy" | "medium" | "hard"
  marks: number
  allow_multiple_answers: boolean
  randomize_options: boolean
  explanation: string
  topics?: string
  question_image?: string
  options: QuestionOption[]
}

const QUESTION_TYPES = [
  { id: 1, name: 'MCQ', icon: ListOrdered },
  { id: 2, name: 'True/False', icon: HelpCircle },
  { id: 3, name: 'Dropdown', icon: FileText },
  { id: 4, name: 'Short Answer', icon: FileText },
  { id: 5, name: 'Essay', icon: FileText },
]

export default function QuestionsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [topicsInputValue, setTopicsInputValue] = useState("")
  const [recentlyUsedTopics, setRecentlyUsedTopics] = useState<Topic[]>([])
  const [questionImage, setQuestionImage] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterDifficulty, setFilterDifficulty] = useState("all")
  const [filterSubject, setFilterSubject] = useState("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState({
    question_text: "",
    question_type_id: 1,
    subject_id: "",
    difficulty_level: "medium" as "easy" | "medium" | "hard",
    marks: 1,
    allow_multiple_answers: false,
    randomize_options: true,
    explanation: "",
  })
  const [options, setOptions] = useState<QuestionOption[]>([
    { option_text: "", is_correct: false, option_label: "A" },
    { option_text: "", is_correct: false, option_label: "B" },
    { option_text: "", is_correct: false, option_label: "C" },
    { option_text: "", is_correct: false, option_label: "D" },
  ])

  useEffect(() => {
    // Debugging: Log questions state whenever it changes
    if (questions.length > 0) {
    }
  }, [questions])

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user && user.role === 'admin') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [subjectsResponse, questionsResponse, topicsResponse, recentlyUsedResponse] = await Promise.all([
        fetch("/api/subjects", { credentials: 'include' }),
        fetch("/api/questions", { credentials: 'include' }),
        fetch("/api/admin/topics", { credentials: 'include' }),
        fetch("/api/admin/questions/recently-used-topics", { credentials: 'include' })
      ])

      if (subjectsResponse.ok) {
        const data = await subjectsResponse.json()
        setSubjects(data.subjects || [])
      }

      if (questionsResponse.ok) {
        const data = await questionsResponse.json()
        setQuestions(data.questions || [])
      }

      if (topicsResponse.ok) {
        const data = await topicsResponse.json()
        setTopics(data.topics || [])
      } else {
        toast.error('Failed to load topics')
      }

      if (recentlyUsedResponse.ok) {
        const data = await recentlyUsedResponse.json()
        setRecentlyUsedTopics(data.topics || [])
      } else {
      }
    } catch (error) {
      toast.error('Failed to load questions')
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleOpenModal = async (question?: Question) => {
    if (question) {
      setEditingQuestion(question)
      setFormData({
        question_text: question.question_text,
        question_type_id: question.question_type_id,
        subject_id: question.subject_id,
        difficulty_level: question.difficulty_level,
        marks: question.marks,
        allow_multiple_answers: question.allow_multiple_answers,
        randomize_options: question.randomize_options,
        explanation: question.explanation || "",
      })
      setOptions(question.options.length > 0 ? question.options : [
        { option_text: "", is_correct: false, option_label: "A" },
        { option_text: "", is_correct: false, option_label: "B" },
        { option_text: "", is_correct: false, option_label: "C" },
        { option_text: "", is_correct: false, option_label: "D" },
      ])
      
      // Load topics from the question's topics column
      if (question.topics) {
        setTopicsInputValue(question.topics)
        // Parse topic names to match with available topics for selectedTopics
        const topicNames = question.topics
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0)
        const topicIds = topicNames
          .map(name => topics.find(t => t.name.toLowerCase() === name.toLowerCase())?.id)
          .filter(Boolean) as string[]
        setSelectedTopics(topicIds)
      } else {
        setTopicsInputValue("")
        setSelectedTopics([])
      }
      
      // Load image
      if (question.question_image) {
        setQuestionImage(question.question_image)
        setImagePreview(question.question_image)
      } else {
        setQuestionImage("")
        setImagePreview("")
      }
      setImageFile(null)
    } else {
      setEditingQuestion(null)
      setSelectedTopics([])
      setTopicsInputValue("")
      setQuestionImage("")
      setImagePreview("")
      setImageFile(null)
      setFormData({
        question_text: "",
        question_type_id: 1,
        subject_id: subjects[0]?.id || "",
        difficulty_level: "medium",
        marks: 1,
        allow_multiple_answers: false,
        randomize_options: true,
        explanation: "",
      })
      setOptions([
        { option_text: "", is_correct: false, option_label: "A" },
        { option_text: "", is_correct: false, option_label: "B" },
        { option_text: "", is_correct: false, option_label: "C" },
        { option_text: "", is_correct: false, option_label: "D" },
      ])
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingQuestion(null)
  }

  const handleAddOption = () => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    setOptions([...options, {
      option_text: "",
      is_correct: false,
      option_label: labels[options.length] || `${options.length + 1}`
    }])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    } else {
      toast.error("At least 2 options are required")
    }
  }

  const handleOptionChange = (index: number, field: string, value: any) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    
    // For single choice, uncheck other options when one is checked
    if (field === 'is_correct' && value && !formData.allow_multiple_answers && (formData.question_type_id === 1 || formData.question_type_id === 2)) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.is_correct = false
      })
    }
    
    setOptions(newOptions)
  }

  const handleSaveQuestion = async () => {
    if (!formData.question_text.trim()) {
      toast.error("Question text is required")
      return
    }

    if (!formData.subject_id) {
      toast.error("Please select a subject")
      return
    }

    // Validate options for MCQ and True/False
    if ([1, 2, 3].includes(formData.question_type_id)) {
      const hasCorrectAnswer = options.some(opt => opt.is_correct && opt.option_text.trim())
      if (!hasCorrectAnswer) {
        toast.error("Please mark at least one correct answer")
        return
      }

      const allOptionsFilled = options.every(opt => opt.option_text.trim())
      if (!allOptionsFilled) {
        toast.error("Please fill all option texts")
        return
      }
    }

    try {
      // Convert topicsInputValue to array of topic names
      
      let topicNames: string[] = []
      if (topicsInputValue && typeof topicsInputValue === 'string' && topicsInputValue.trim().length > 0) {
        topicNames = topicsInputValue
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0)
      }
      

      const payload = {
        ...formData,
        options: [1, 2, 3].includes(formData.question_type_id) ? options : [],
        topics: topicNames,
        question_image: imagePreview,
        id: editingQuestion?.id
      }


      const response = await fetch('/api/questions', {
        method: editingQuestion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(editingQuestion ? "Question updated successfully" : "Question created successfully")
        handleCloseModal()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save question')
      }
    } catch (error) {
      toast.error('Failed to save question')
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return

    try {
      const response = await fetch(`/api/questions?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast.success("Question deleted successfully")
        fetchData()
      } else {
        toast.error('Failed to delete question')
      }
    } catch (error) {
      toast.error('Failed to delete question')
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || q.question_type_id.toString() === filterType
    const matchesDifficulty = filterDifficulty === "all" || q.difficulty_level === filterDifficulty
    const matchesSubject = filterSubject === "all" || q.subject_id === filterSubject
    
    // Filter by selected topics
    let matchesTopics = selectedTopics.length === 0 // If no topics selected, show all
    if (selectedTopics.length > 0 && q.topics) {
      // Parse topics - could be JSON array or comma-separated string
      let questionTopics: string[] = []
      try {
        questionTopics = JSON.parse(q.topics)
      } catch {
        questionTopics = q.topics.split(',').map((t: string) => t.trim())
      }
      // Check if any selected topic matches
      matchesTopics = selectedTopics.some((selectedId: string) => 
        questionTopics.includes(selectedId)
      )
    }
    
    return matchesSearch && matchesType && matchesDifficulty && matchesSubject && matchesTopics
  })

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
    return colors[difficulty as keyof typeof colors] || colors.medium
  }

  const getQuestionTypeIcon = (typeId: number) => {
    const type = QUESTION_TYPES.find(t => t.id === typeId)
    return type ? type.icon : FileText
  }

  const renderQuestionForm = () => {
    const isMCQ = formData.question_type_id === 1
    const isTrueFalse = formData.question_type_id === 2

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Question Type</Label>
          <Select
            value={formData.question_type_id?.toString() || ""}
            onValueChange={(value) => {
              const typeId = parseInt(value)
              setFormData({ ...formData, question_type_id: typeId })
              
              if (typeId === 2) {
                setOptions([
                  { option_text: "True", is_correct: false, option_label: "A" },
                  { option_text: "False", is_correct: false, option_label: "B" }
                ])
              } else if (typeId === 1) {
                setOptions([
                  { option_text: "", is_correct: false, option_label: "A" },
                  { option_text: "", is_correct: false, option_label: "B" },
                  { option_text: "", is_correct: false, option_label: "C" },
                  { option_text: "", is_correct: false, option_label: "D" },
                ])
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select question type" />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map(type => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Question Text *</Label>
          <Textarea
            placeholder="Enter your question here..."
            value={formData.question_text}
            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Question Image (Optional)</Label>
          <p className="text-sm text-muted-foreground mb-2">Upload an image to help illustrate the question. Useful for mathematical, geometry, or diagram-based questions.</p>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 p-2 bg-slate-100 rounded border">
              <img 
                src={imagePreview} 
                alt="Question preview" 
                className="max-w-full max-h-64 rounded object-contain" 
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview("")
                  setImageFile(null)
                  setQuestionImage("")
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                ✕ Remove Image
              </button>
            </div>
          )}
          
          {/* Image File Input */}
          {!imagePreview && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setImageFile(file)
                  // Create preview
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    setImagePreview(reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base file:border-0 file:bg-transparent file:text-foreground file:font-medium"
            />
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select
              value={formData.subject_id}
              onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              value={formData.difficulty_level}
              onValueChange={(value: any) => setFormData({ ...formData, difficulty_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Marks</Label>
            <Input
              type="number"
              min="1"
              value={formData.marks}
              onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Topics/Tags</Label>
          
          {/* Plain Text Input for Topics */}
          <Input
            placeholder="Enter topics separated by commas (e.g., JavaScript, Functions, Variables)"
            value={topicsInputValue}
            onChange={(e) => {
              const text = e.target.value
              setTopicsInputValue(text)
              
              // Parse the text and find matching topics
              const topicNames = text.split(',').map(name => name.trim()).filter(Boolean)
              
              // Find matching topic IDs
              const foundTopics = topicNames
                .map(name => topics.find(t => t.name.toLowerCase() === name.toLowerCase())?.id)
                .filter(Boolean) as string[]
              
              setSelectedTopics(foundTopics)
            }}
            className="mb-3"
          />
          
          {/* Recently Used Topics - Quick Add Buttons */}
          {recentlyUsedTopics.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Recently Used Topics (5)</p>
              <div className="flex flex-wrap gap-2">
                {recentlyUsedTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      // Add topic name to the input field
                      const currentNames = topicsInputValue
                        .split(',')
                        .map(t => t.trim())
                        .filter(t => t.length > 0)
                      
                      // Check if topic name already exists
                      if (!currentNames.includes(topic.name)) {
                        const updatedNames = [...currentNames, topic.name]
                        const newValue = updatedNames.join(", ")
                        setTopicsInputValue(newValue)
                        
                        // Also update selectedTopics with matching topic IDs
                        const foundTopics = updatedNames
                          .map(name => topics.find(t => t.name.toLowerCase() === name.toLowerCase())?.id)
                          .filter(Boolean) as string[]
                        setSelectedTopics(foundTopics)
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:shadow-md active:scale-95"
                    style={{ 
                      backgroundColor: `${topic.color}15`,
                      color: topic.color,
                      border: `1.5px solid ${topic.color}40`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${topic.color}25`
                      e.currentTarget.style.borderColor = `${topic.color}60`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${topic.color}15`
                      e.currentTarget.style.borderColor = `${topic.color}40`
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: topic.color }}></span>
                    {topic.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-3">
            💡 Type topics separated by commas, or click recently used tags to add them (optional)
          </p>
        </div>

        {(isMCQ || isTrueFalse) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Options *</Label>
              <div className="flex gap-2">
                {isMCQ && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="multiple"
                      checked={formData.allow_multiple_answers}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, allow_multiple_answers: checked as boolean })
                      }
                    />
                    <label htmlFor="multiple" className="text-sm">
                      Multiple Answers
                    </label>
                  </div>
                )}
                {isMCQ && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="randomize"
                      checked={formData.randomize_options}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, randomize_options: checked as boolean })
                      }
                    />
                    <label htmlFor="randomize" className="text-sm flex items-center gap-1">
                      <Shuffle className="w-3 h-3" />
                      Randomize
                    </label>
                  </div>
                )}
              </div>
            </div>

            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded font-semibold text-sm">
                  {option.option_label}
                </div>
                <Checkbox
                  checked={option.is_correct}
                  onCheckedChange={(checked) => handleOptionChange(index, 'is_correct', checked)}
                  title="Mark as correct answer"
                />
                <Input
                  placeholder={`Option ${option.option_label}`}
                  value={option.option_text}
                  onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                  className="flex-1"
                  disabled={isTrueFalse}
                />
                {isMCQ && !isTrueFalse && options.length > 2 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveOption(index)}
                    className="text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            {isMCQ && !isTrueFalse && options.length < 10 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddOption}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Answer Explanation (Optional)</Label>
          <Textarea
            placeholder="Explain the correct answer. This will be shown to students in the results page after exam submission."
            value={formData.explanation || ""}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Question Bank</h1>
            <p className="text-muted-foreground mt-2">Create and manage exam questions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="lg" disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outline" size="lg">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Link href="/admin/dashboard" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {QUESTION_TYPES.map(type => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>

        {/* Topics Filter */}
        {topics.length > 0 && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <Label className="text-sm font-semibold mb-3 block">Filter by Topics:</Label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTopics([])}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTopics.length === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                All Topics
              </button>
              {topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopics(prev =>
                      prev.includes(topic.id)
                        ? prev.filter(id => id !== topic.id)
                        : [...prev, topic.id]
                    )
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTopics.includes(topic.id)
                      ? `text-white`
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                  style={{
                    backgroundColor: selectedTopics.includes(topic.id) ? topic.color : undefined
                  }}
                >
                  {topic.name}
                </button>
              ))}
            </div>
            {selectedTopics.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing questions with {selectedTopics.length} selected topic(s)
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4">
          {filteredQuestions.map((question, qIdx) => {
            const Icon = getQuestionTypeIcon(question.question_type_id)
            return (
              <Card key={question.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                          <Badge variant="outline">{question.question_type_name}</Badge>
                          <Badge className={getDifficultyColor(question.difficulty_level)}>
                            {question.difficulty_level}
                          </Badge>
                          <Badge variant="secondary">{question.subject_name}</Badge>
                          <Badge variant="secondary">{question.marks} marks</Badge>
                          {question.randomize_options && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Shuffle className="w-3 h-3" />
                              Randomized
                            </Badge>
                          )}
                          {/* Topics Display - In First Row */}
                          {question.topics && question.topics.trim().length > 0 && (
                            <>
                              <Badge variant="outline" className="bg-purple-100 text-purple-800">📌 Topics:</Badge>
                              {question.topics
                                .split(',')
                                .map(t => t.trim())
                                .filter(t => t.length > 0)
                                .map((topic, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
                                  >
                                    {topic}
                                  </Badge>
                                ))}
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-foreground font-medium mb-2">{question.question_text}</p>
                      
                      {/* Question Image Display */}
                      {question.question_image && (
                        <div className="mb-3 p-2 bg-slate-50 rounded border flex justify-center">
                          <img 
                            src={question.question_image} 
                            alt="Question illustration" 
                            className="max-w-full max-h-64 rounded object-contain"
                            style={{maxWidth: '100%', height: 'auto'}}
                          />
                        </div>
                      )}
                      
                      {question.options.length > 0 && (
                        <div className="space-y-1 mt-3">
                          {question.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {opt.is_correct ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-400" />
                              )}
                              <span className={opt.is_correct ? "font-semibold text-green-600" : "text-muted-foreground"}>
                                {opt.option_label}. {opt.option_text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenModal(question)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredQuestions.length === 0 && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-semibold">No questions found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchTerm || filterType !== "all" || filterDifficulty !== "all" || filterSubject !== "all" || selectedTopics.length > 0
                    ? "Try adjusting your filters"
                    : "Create your first question to get started"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingQuestion ? "Edit Question" : "Add New Question"}
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={handleCloseModal}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {renderQuestionForm()}
                
                <div className="flex gap-2 pt-6 border-t mt-6">
                  <Button variant="outline" onClick={handleCloseModal} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveQuestion} className="flex-1">
                    {editingQuestion ? "Update Question" : "Create Question"}
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
