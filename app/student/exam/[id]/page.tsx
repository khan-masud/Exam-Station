"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Flag, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { WebcamMonitor } from "@/components/exam/webcam-monitor"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface Question {
  id: string
  question_text: string
  question_type_name: string
  marks: number
  negative_marks: number
  randomize_options: boolean
  explanation?: string
  time_limit?: number
  question_image?: string
  options?: Array<{
    id: string
    option_text: string
    option_label: string
    is_correct: boolean
  }>
}

interface ExamAttempt {
  attemptId: string
  exam: {
    id: string
    title: string
    duration_minutes: number
    total_marks: number
    passing_marks: number
    proctoring_enabled: boolean
    negative_marking?: number
  }
  examControls: {
    allow_answer_change: boolean
    show_question_counter: boolean
    allow_answer_review: boolean
  }
  questions: Question[]
  isResume: boolean
}

export default function ExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string
  const { user } = useAuth()

  const [attemptData, setAttemptData] = useState<ExamAttempt | null>(null)
  const [examControls, setExamControls] = useState<{ allow_answer_change: boolean; show_question_counter: boolean; allow_answer_review: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [instructionsAccepted, setInstructionsAccepted] = useState(false)
  const [programInstructions, setProgramInstructions] = useState<string>("")
  const [examInstructions, setExamInstructions] = useState<string>("")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { answerText?: string, selectedOption?: number }>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [examStartTime, setExamStartTime] = useState<number>(0)  // Time when exam actually started on server
  const [startingExam, setStartingExam] = useState(false)  // Loading state for starting exam
  
  const autosaveInterval = useRef<NodeJS.Timeout | null>(null)
  const timerInterval = useRef<NodeJS.Timeout | null>(null)
  const lastFaceEventRef = useRef<{ type: string, timestamp: number } | null>(null)
  const lastSavedAnswers = useRef<string>('')  // Track last saved state

  // Step 1: Fetch exam details and instructions (but don't start the exam yet)
  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const response = await fetch(`/api/exams/${examId}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || 'Failed to load exam')
          router.push('/student/exams')
          return
        }

        const data = await response.json()
        
        // Set instructions from exam and program
        if (data.exam.instructions) {
          setExamInstructions(data.exam.instructions)
        }
        if (data.programInstructions) {
          setProgramInstructions(data.programInstructions)
        }
        
        // Store exam controls for later use
        setExamControls(data.examControls)
        
        setLoading(false)
      } catch (error) {
        console.error('Fetch exam error:', error)
        toast.error('Failed to load exam')
        router.push('/student/exams')
      }
    }

    fetchExamDetails()
  }, [examId, router])

  // Step 2: Start exam when instructions are accepted
  const handleStartExam = async () => {
    setStartingExam(true)
    try {
      const response = await fetch('/api/exam-attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ examId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start exam')
      }

      const data = await response.json()
      console.log('[Frontend] ============ START EXAM RESPONSE ============')
      console.log('[Frontend] Full response:', data)
      console.log('[Frontend] isResume:', data.isResume)
      console.log('[Frontend] startTime from API:', data.startTime)
      console.log('[Frontend] totalTimeSpent from API:', data.totalTimeSpent)
      console.log('[Frontend] exam.duration_minutes:', data.exam.duration_minutes)
      console.log('[Frontend] examControls:', data.examControls)
      
      setAttemptData(data)
      
      // Parse server start time
      const serverStartTime = new Date(data.startTime).getTime()
      setExamStartTime(serverStartTime)
      
      // Calculate remaining time: total duration minus time already elapsed on server
      const totalDurationSeconds = data.exam.duration_minutes * 60
      const timeSpentSeconds = data.totalTimeSpent || 0
      const remainingSeconds = Math.max(0, totalDurationSeconds - timeSpentSeconds)
      
      console.log('[Frontend] TIME CALCULATION:')
      console.log('[Frontend]   Server start time:', new Date(serverStartTime).toISOString())
      console.log('[Frontend]   totalDuration:', totalDurationSeconds, 'seconds')
      console.log('[Frontend]   timeSpent (from server):', timeSpentSeconds, 'seconds')
      console.log('[Frontend]   remaining:', remainingSeconds, 'seconds')
      console.log('[Frontend] ============================================')
      
      setTimeRemaining(remainingSeconds)

      if (data.isResume) {
        toast.info('Resuming previous attempt')
        loadSavedSession(data.attemptId)
      }

      // Now accept instructions and show exam
      setInstructionsAccepted(true)
      
      // Request fullscreen when exam starts
      try {
        const elem = document.documentElement
        if (elem.requestFullscreen) {
          await elem.requestFullscreen()
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen()
        }
      } catch (fsError) {
        console.warn('Fullscreen request failed:', fsError)
        toast.warning('Could not enter fullscreen mode')
      }
    } catch (error) {
      console.error('Start exam error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start exam')
    } finally {
      setStartingExam(false)
    }
  }

  const loadSavedSession = async (attemptId: string) => {
    try {
      const response = await fetch(`/api/exam-attempts/autosave?attemptId=${attemptId}`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.progressData) {
        setCurrentQuestionIndex(data.progressData.currentQuestion || 0)
        setAnswers(data.progressData.answers || {})
        setFlaggedQuestions(new Set(data.progressData.flaggedQuestions || []))
        toast.success('Exam progress restored')
      }
    } catch (error) {
      console.error('Load session error:', error)
      toast.error('Failed to restore previous progress')
    }
  }

  useEffect(() => {
    if (!attemptData || examStartTime === 0) return

    timerInterval.current = setInterval(() => {
      // Calculate remaining time based on actual elapsed time since server start
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - examStartTime) / 1000)
      const totalDurationSeconds = attemptData.exam.duration_minutes * 60
      const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds)
      
      setTimeRemaining(remainingSeconds)
      
      // Auto-submit when time is up, but only if not already submitting
      if (remainingSeconds <= 0 && !isSubmitting) {
        if (timerInterval.current) clearInterval(timerInterval.current)
        confirmSubmitExam()
      }
    }, 1000)

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [attemptData, examStartTime, isSubmitting])

  useEffect(() => {
    if (!attemptData) return

    autosaveInterval.current = setInterval(() => {
      saveProgress()
    }, 30000)

    return () => {
      if (autosaveInterval.current) clearInterval(autosaveInterval.current)
    }
  }, [attemptData, currentQuestionIndex, answers])

  const saveProgress = async () => {
    if (!attemptData) return

    // Check if answers have actually changed since last save
    const currentAnswersJson = JSON.stringify(answers)
    if (currentAnswersJson === lastSavedAnswers.current && saveStatus === 'saved') {
      return // No changes to save
    }

    setSaveStatus('saving')
    
    try {
      const response = await fetch('/api/exam-attempts/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          attemptId: attemptData.attemptId,
          currentQuestion: currentQuestionIndex,
          answers,
          flaggedQuestions: Array.from(flaggedQuestions)
        })
      })
      
      if (response.ok) {
        lastSavedAnswers.current = currentAnswersJson  // Update last saved state
        setSaveStatus('saved')
        setTimeout(() => {
          if (saveStatus !== 'saving') setSaveStatus('saved')
        }, 2000)
      } else {
        setSaveStatus('error')
        console.error('[Frontend] Autosave failed')
      }
    } catch (error) {
      console.error('[Frontend] Autosave error:', error)
      setSaveStatus('error')
    }
  }

  useEffect(() => {
    const handleBlur = () => {
      setShowWarning(true)
      recordAntiCheatEvent('window_blur', 'high', { description: 'Window lost focus' })
      
      // Attempt to re-enter fullscreen if exited
      if (attemptData && instructionsAccepted) {
        const elem = document.documentElement
        if (!document.fullscreenElement && elem.requestFullscreen) {
          elem.requestFullscreen().catch(err => {
            console.log('Could not re-enter fullscreen:', err)
          })
        }
      }
    }

    const handleFocus = () => {
      setTimeout(() => setShowWarning(false), 3000)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordAntiCheatEvent('tab_switch', 'critical', { 
          description: 'Tab switched or minimized - Exam may be automatically submitted',
          timestamp: Date.now()
        })
        
        // Record multiple tab switches as a violation and potentially auto-submit
        toast.error('You switched to another tab! This has been recorded. Multiple violations may result in exam submission.')
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && attemptData && instructionsAccepted) {
        recordAntiCheatEvent('fullscreen_exit', 'critical', { 
          description: 'Exited fullscreen mode - Attempting to re-enter',
          timestamp: Date.now()
        })
        
        // Try to re-enter fullscreen
        setTimeout(() => {
          const elem = document.documentElement
          if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
              console.log('Could not re-enter fullscreen:', err)
              toast.error('Fullscreen was exited! Please re-enter fullscreen mode to continue the exam.')
            })
          }
        }, 500)
      }
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [attemptData, instructionsAccepted])

  // Add beforeunload warning to prevent accidental tab/window close
  useEffect(() => {
    if (!attemptData || !instructionsAccepted) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Your exam is in progress. Are you sure you want to leave? Your progress will be auto-saved but the exam may be marked as abandoned.'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [attemptData, instructionsAccepted])

  // Add keyboard and context menu blocking
  useEffect(() => {
    if (!attemptData || !instructionsAccepted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey
      
      // Block Ctrl+C/Ctrl+V (copy/paste)
      if (ctrlOrCmd && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault()
        recordAntiCheatEvent('copy_attempt', 'high', { description: 'Attempted to copy content' })
        toast.error('Copy is disabled during the exam')
        return false
      }
      
      if (ctrlOrCmd && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault()
        recordAntiCheatEvent('paste_attempt', 'high', { description: 'Attempted to paste content' })
        toast.error('Paste is disabled during the exam')
        return false
      }
      
      // Block Ctrl+S (save)
      if (ctrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        return false
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      recordAntiCheatEvent('right_click', 'medium', { description: 'Attempted right-click' })
      return false
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [attemptData, instructionsAccepted])

  const recordAntiCheatEvent = async (eventType: string, severity: string, metadata: any = {}) => {
    if (!attemptData) return

    try {
      await fetch('/api/exam-attempts/anti-cheat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          attemptId: attemptData.attemptId,
          eventType,
          severity,
          metadata
        })
      })
    } catch (error) {
      console.error('Anti-cheat event error:', error)
    }
  }

  const handleFaceDetectionEvent = async (event: { type: string, count: number, timestamp: number }) => {
    if (lastFaceEventRef.current && 
        lastFaceEventRef.current.type === event.type && 
        event.timestamp - lastFaceEventRef.current.timestamp < 5000) {
      return
    }

    lastFaceEventRef.current = event

    if (event.type === 'no_face') {
      toast.warning('No face detected! Please stay in front of camera')
      await recordAntiCheatEvent('no_face', 'high', { 
        description: 'No face detected in webcam',
        timestamp: event.timestamp
      })
    } else if (event.type === 'multiple_faces') {
      toast.error(`Multiple faces detected (${event.count})! This is not allowed`)
      await recordAntiCheatEvent('multiple_faces', 'critical', { 
        description: `${event.count} faces detected`,
        faceCount: event.count,
        timestamp: event.timestamp
      })
    }
  }

  const handleAnswerChange = async (value: string | number, questionId: string, isOption: boolean = false) => {
    console.log('[Frontend] handleAnswerChange called:', { value, isOption, questionId })
    
    if (!attemptData) {
      console.error('[Frontend] Missing attemptData')
      return
    }

    // Calculate time elapsed since exam started on server (in seconds)
    const totalTimeElapsed = Math.floor((Date.now() - examStartTime) / 1000)
    
    // Update state immediately
    const newAnswer = isOption 
      ? { selectedOption: Number(value) }
      : { answerText: String(value) }
    
    console.log('[Frontend] Updating answer state:', { questionId, newAnswer, totalTimeElapsed })
    
    setAnswers((prev: Record<string, { answerText?: string, selectedOption?: number }>) => {
      const updated = {
        ...prev,
        [questionId]: newAnswer
      }
      console.log('[Frontend] New answers state:', updated)
      return updated
    })

    try {
      const payload = {
        attemptId: attemptData.attemptId,
        questionId: questionId,
        answerText: isOption ? undefined : String(value),
        selectedOption: isOption ? Number(value) : undefined,
        timeSpent: totalTimeElapsed
      }
      
      console.log('[Frontend] Sending to API:', payload)
      
      const response = await fetch('/api/exam-attempts/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[Frontend] Save answer error:', error)
        toast.error(`Failed to save answer: ${error.error}`)
      } else {
        const data = await response.json()
        console.log('[Frontend] Answer saved successfully:', data)
      }
    } catch (error) {
      console.error('[Frontend] Save answer exception:', error)
      toast.error('Failed to save answer')
    }
  }

  const handleToggleFlag = () => {
    const currentQuestion = attemptData?.questions[currentQuestionIndex]
    if (!currentQuestion) return

    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id)
        toast.info('Flag removed')
      } else {
        newSet.add(currentQuestion.id)
        toast.info('Question flagged for review')
      }
      return newSet
    })
  }

  const handleNextQuestion = () => {
    if (!attemptData) return
    if (currentQuestionIndex < attemptData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const handleSubmitExamClick = () => {
    if (examControls?.allow_answer_review === false) {
      // Skip review and submit directly
      confirmSubmitExam()
    } else {
      // Show review confirmation
      setShowSubmitConfirmation(true)
    }
  }

  const confirmSubmitExam = async () => {
    setShowSubmitConfirmation(false)
    
    if (!attemptData) return
    
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // Calculate time spent in seconds
      const timeSpent = attemptData.exam.duration_minutes * 60 - timeRemaining
      
      const response = await fetch('/api/exam-attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          attemptId: attemptData.attemptId,
          answers: answers,
          timeSpent: timeSpent
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit exam')
      }

      const data = await response.json()
      
      console.log('[Exam Submit] Response data:', data)
      console.log('[Exam Submit] Result ID:', data.resultId)
      
      if (!data.resultId) {
        throw new Error('No result ID received from server')
      }
      
      toast.success('Exam submitted successfully!')
      router.push(`/student/results/${data.resultId}`)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit exam. Please try again.')
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Loading exam...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show instructions modal before exam has started (if we have exam data but not attemptData yet)
  if (programInstructions || examInstructions) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        {/* Instructions Modal */}
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <CardTitle>Exam Instructions</CardTitle>
              <CardDescription>
                Please read the instructions carefully before proceeding with the exam.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {programInstructions && (
                <div>
                  <h3 className="font-semibold text-base mb-3 text-primary">Program Instructions</h3>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                    {programInstructions}
                  </div>
                </div>
              )}
              
              {examInstructions && (
                <div>
                  <h3 className="font-semibold text-base mb-3 text-primary">Exam-Specific Instructions</h3>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                    {examInstructions}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Marking Scheme:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-900 dark:text-amber-100">
                  <li>Marks awarded for each correct answer</li>
                  <li>Negative marking: 0.25 marks deducted per wrong answer</li>
                  <li>No marks awarded or deducted for unanswered questions</li>
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Important:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-900 dark:text-amber-100">
                  <li>Do not close or minimize this browser window during the exam</li>
                  <li>Do not refresh the page - your progress is auto-saved</li>
                  <li>Complete the exam within the allocated time</li>
                  <li>Answer all questions to the best of your ability</li>
                </ul>
              </div>
            </CardContent>
            <div className="flex gap-3 p-6 border-t">
              <Button
                variant="default"
                onClick={handleStartExam}
                disabled={startingExam}
                className="flex-1"
              >
                {startingExam ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Exam...
                  </>
                ) : (
                  'I Understand, Start Exam'
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!attemptData) return null

  const hasInstructions = programInstructions || examInstructions

  const currentQuestion = attemptData.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === attemptData.questions.length - 1
  const currentAnswer = answers[currentQuestion.id]
  const answeredCount = Object.keys(answers).length
  const timeWarning = timeRemaining < 300

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground p-3 text-center z-50">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Warning: Window focus lost! This activity has been recorded.
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Main Content - Questions */}
          <div className="lg:col-span-3 space-y-6">
            {/* Exam Header */}
            <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{attemptData.exam.title}</CardTitle>
                  <CardDescription>
                    {attemptData.questions.length} Questions • Total Marks: {attemptData.exam.total_marks}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  {/* Auto-save indicator */}
                  <div className="flex items-center gap-1.5 text-sm">
                    {saveStatus === 'saving' && (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Saving...</span>
                      </>
                    )}
                    {saveStatus === 'saved' && (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-600">Saved</span>
                      </>
                    )}
                    {saveStatus === 'error' && (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                        <span className="text-destructive">Save failed</span>
                      </>
                    )}
                  </div>
                  {/* Timer */}
                  <div className={`flex items-center gap-2 text-lg font-bold ${timeWarning ? 'text-destructive' : ''}`}>
                    <Clock className="w-5 h-5" />
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* All Questions - Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
            {attemptData.questions.map((question, idx) => {
              const answer = answers[question.id];
              const isFlagged = flaggedQuestions.has(question.id);

              return (
                <Card key={`${question.id}-${idx}`} id={`question-${idx}`} className={isFlagged ? 'border-amber-300 border-2' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {examControls?.show_question_counter && (
                            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                              {idx + 1}
                            </div>
                          )}
                          <CardTitle className="text-base flex-1">
                            {question.question_text}
                          </CardTitle>
                        </div>
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
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{question.question_type_name}</Badge>
                          <Badge className="text-xs">{question.marks} marks</Badge>
                          {answer && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              ✓ Answered
                            </Badge>
                          )}
                          {isFlagged && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                              📍 Flagged
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant={isFlagged ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFlaggedQuestions(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(question.id)) {
                              newSet.delete(question.id);
                            } else {
                              newSet.add(question.id);
                            }
                            return newSet;
                          });
                        }}
                      >
                        <Flag className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Lock indicator if answers are not changeable */}
                    {!examControls?.allow_answer_change && answer && (
                      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 text-amber-600">🔒</div>
                        <span className="text-amber-700 dark:text-amber-200">Answer locked - changes are not allowed</span>
                      </div>
                    )}
                    
                    {/* MCQ, True/False, Dropdown Questions */}
                    {(question.question_type_name === 'MCQ' || 
                      question.question_type_name === 'True/False' || 
                      question.question_type_name === 'Dropdown') && question.options && (
                      <RadioGroup
                        value={answer?.selectedOption !== undefined ? answer.selectedOption.toString() : ""}
                        onValueChange={(value) => {
                          if (examControls?.allow_answer_change || !answer) {
                            handleAnswerChange(value, question.id, true);
                            setCurrentQuestionIndex(idx);
                          }
                        }}
                        disabled={!examControls?.allow_answer_change && !!answer}
                      >
                        <div className="space-y-3">
                          {question.options.map((option, optIdx: number) => (
                            <div 
                              key={option.id} 
                              onClick={() => {
                                if (examControls?.allow_answer_change || !answer) {
                                  handleAnswerChange(optIdx.toString(), question.id, true)
                                  setCurrentQuestionIndex(idx)
                                }
                              }}
                              className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors ${
                                (!examControls?.allow_answer_change && answer) 
                                  ? 'bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60' 
                                  : 'hover:bg-accent'
                              }`}
                            >
                              <RadioGroupItem 
                                value={optIdx.toString()} 
                                id={`option-${question.id}-${optIdx}`}
                                disabled={!examControls?.allow_answer_change && !!answer}
                              />
                              <Label 
                                htmlFor={`option-${question.id}-${optIdx}`} 
                                className={`flex-1 ${(!examControls?.allow_answer_change && answer) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <span className="font-semibold mr-2">{option.option_label}.</span>
                                {option.option_text}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}

                    {/* Short Answer, Essay, Fill in Blank Questions */}
                    {(question.question_type_name === 'Short Answer' || 
                      question.question_type_name === 'Essay' ||
                      question.question_type_name === 'Fill in Blank') && (
                      <>
                        {!examControls?.allow_answer_change && answer && (
                          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2 text-sm mb-3">
                            <div className="w-4 h-4 text-amber-600">🔒</div>
                            <span className="text-amber-700 dark:text-amber-200">Answer locked - changes are not allowed</span>
                          </div>
                        )}
                        <Textarea
                          placeholder="Type your answer here..."
                          value={answer?.answerText || ''}
                          onChange={(e) => {
                            if (examControls?.allow_answer_change || !answer) {
                              handleAnswerChange(e.target.value, question.id, false);
                              setCurrentQuestionIndex(idx);
                            }
                          }}
                          disabled={!examControls?.allow_answer_change && !!answer}
                          rows={question.question_type_name === 'Essay' ? 6 : 3}
                          className="resize-none"
                        />
                      </>
                    )}

                    {/* Explanation (if available) */}
                    {question.explanation && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm text-muted-foreground border border-blue-200 dark:border-blue-800">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Submit Section */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Ready to Submit?</CardTitle>
                  <CardDescription>
                    You have answered {Object.keys(answers).length} of {attemptData.questions.length} questions
                  </CardDescription>
                </div>
                <Button
                  onClick={handleSubmitExamClick}
                  disabled={isSubmitting}
                  size="lg"
                  className="min-w-40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Exam'
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Sidebar - Proctoring & Progress - Sticky */}
        <div className="lg:col-span-1 space-y-4 lg:space-y-6">
          <div className="lg:sticky lg:top-4">
            {attemptData.exam.proctoring_enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Proctoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <WebcamMonitor
                    enabled={attemptData.exam.proctoring_enabled}
                    onFaceDetectionEvent={handleFaceDetectionEvent}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Answered:</span>
                <span className="font-bold">{answeredCount} / {attemptData.questions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Flagged:</span>
                <span className="font-bold">{flaggedQuestions.size}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(answeredCount / attemptData.questions.length) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Answer Status</CardTitle>
              </CardHeader>
              <CardContent>
                {!examControls?.show_question_counter ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    Question counter hidden
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {attemptData.questions.map((q, idx) => {
                      const isAnswered = !!answers[q.id];
                      const isFlagged = flaggedQuestions.has(q.id);

                      return (
                        <button
                          key={`progress-${q.id}-${idx}`}
                          onClick={() => {
                            const element = document.getElementById(`question-${idx}`);
                            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className={`w-full h-8 rounded text-xs font-semibold transition-all ${
                            isAnswered
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } ${isFlagged ? 'ring-2 ring-amber-400' : ''}`}
                          title={`Q${idx + 1} ${isAnswered ? '✓ Answered' : 'Not answered'} ${isFlagged ? '📍 Flagged' : ''}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {showSubmitConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Submit Exam?</CardTitle>
              <CardDescription>
                Are you sure you want to submit your exam? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Answered Questions:</span>
                  <span className="font-semibold">{Object.keys(answers).length} / {attemptData?.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Spent:</span>
                  <span className="font-semibold">{formatTime(attemptData?.exam.duration_minutes * 60 - timeRemaining || 0)}</span>
                </div>
              </div>
            </CardContent>
            <div className="flex gap-3 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowSubmitConfirmation(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Continue Exam
              </Button>
              <Button
                variant="destructive"
                onClick={confirmSubmitExam}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Now'
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
