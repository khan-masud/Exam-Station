"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Download, Share2, ArrowLeft, BarChart3, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const resultId = params?.id as string
  const { user, logout } = useAuth()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const fetchResultDetails = async (showToast = false) => {
    try {
      // Ensure resultId is available
      if (!resultId) {
        setLoading(false)
        return
      }

      if (showToast) setRefreshing(true)
      else setLoading(true)

      const response = await fetch(`/api/student/results/${resultId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch result details')
      }

      const data = await response.json()
      setResult(data)
      
      if (showToast) {
        toast.success('Results refreshed successfully')
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load result details')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (resultId) {
      fetchResultDetails()
    }
  }, [resultId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-4 sm:p-6 pt-20 lg:pt-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <div>
                  <h1 className="text-2xl font-bold mb-2">Result Not Found</h1>
                  <p className="text-muted-foreground mb-2">
                    The exam result you're looking for doesn't exist.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Requested ID: <code className="bg-muted px-2 py-1 rounded">{resultId}</code>
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium mb-4">This could happen if:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 text-left mb-6">
                      <li>• The exam hasn't been submitted yet</li>
                      <li>• Results have been deleted</li>
                      <li>• The URL was incorrectly typed or shared</li>
                    </ul>
                  </div>
                </div>
                <Button onClick={() => router.push('/student/dashboard')} size="lg">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-4 sm:p-6 pt-20 lg:pt-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Exam Results</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base truncate">{result.examTitle}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => fetchResultDetails(true)} 
              variant="outline" 
              size="sm"
              disabled={refreshing}
              className="text-xs sm:text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm" className="text-xs sm:text-sm">
              <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        <Link
          href="/student/dashboard"
          className="text-primary hover:underline text-xs sm:text-sm mb-4 sm:mb-6 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Back to Dashboard
        </Link>

        {/* Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Score Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Your Score</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                {result.scoreObtained}/{result.totalScore}
              </p>
              <p className="text-xs text-muted-foreground">Total Marks</p>
            </CardContent>
          </Card>

          {/* Percentage Card */}
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Percentage</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">{result.percentage}%</p>
              <p className="text-xs text-muted-foreground">Score Obtained</p>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className={result.result === "Pass" ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Result</p>
              <p className={`text-2xl sm:text-3xl font-bold mb-1 ${result.result === "Pass" ? "text-green-600" : "text-red-600"}`}>
                {result.result}
              </p>
              <p className="text-xs text-muted-foreground">Required: {result.passingMarks} marks</p>
            </CardContent>
          </Card>

          {/* Time Card */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Time Spent</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">{result.timeSpent}</p>
              <p className="text-xs text-muted-foreground">Duration: {result.durationMinutes}m</p>
            </CardContent>
          </Card>

          {/* Negative Marking Card */}
          {result.negativeMarksDeducted > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Penalty</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">-{(result.negativeMarksDeducted || 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Negative Marking</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Score Breakdown */}
        <Card className="mb-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Answer Statistics</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Breakdown of your answers</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Correct Answers */}
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-3">
                  <span className="font-medium">Correct Answers</span>
                  <span className="font-bold text-green-600">
                    {result.correctAnswers} / {result.totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 mb-2">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: `${result.totalQuestions > 0 ? (result.correctAnswers / result.totalQuestions) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.totalQuestions > 0 ? Math.round((result.correctAnswers / result.totalQuestions) * 100) : 0}% Success Rate
                </p>
              </div>

              {/* Wrong Answers */}
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-3">
                  <span className="font-medium">Wrong Answers</span>
                  <span className="font-bold text-red-600">
                    {result.wrongAnswers} / {result.totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 mb-2">
                  <div
                    className="bg-red-500 h-3 rounded-full"
                    style={{ width: `${result.totalQuestions > 0 ? (result.wrongAnswers / result.totalQuestions) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.totalQuestions > 0 ? Math.round((result.wrongAnswers / result.totalQuestions) * 100) : 0}% Error Rate
                </p>
              </div>

              {/* Unanswered */}
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-3">
                  <span className="font-medium">Unanswered</span>
                  <span className="font-bold text-gray-600">
                    {result.unanswered} / {result.totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 mb-2">
                  <div
                    className="bg-gray-500 h-3 rounded-full"
                    style={{ width: `${result.totalQuestions > 0 ? (result.unanswered / result.totalQuestions) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.totalQuestions > 0 ? Math.round((result.unanswered / result.totalQuestions) * 100) : 0}% Skipped
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        {result.categoryResults && result.categoryResults.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <BarChart3 className="w-5 h-5" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {result.categoryResults.map((cat: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 mb-2">
                      <span className="font-medium text-sm sm:text-base">{cat.name}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {cat.correct}/{cat.questions} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          cat.percentage >= 80 ? "bg-green-500" : cat.percentage >= 60 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
          <Button className="w-full sm:w-auto text-sm sm:text-base">
            <Download className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Download Report</span>
            <span className="sm:hidden">Download</span>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
            <Share2 className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Share Results</span>
            <span className="sm:hidden">Share</span>
          </Button>
        </div>

        {/* Question Review */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Question Review</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {result.questionReview && result.questionReview.length > 0 
                ? `${result.questionReview.length} question${result.questionReview.length > 1 ? 's' : ''} - Review all questions with answers`
                : "Review your answers and correct solutions"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {result.questionReview && result.questionReview.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                {result.questionReview.map((qr: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 sm:p-6 rounded-lg border-2 transition-colors ${
                      qr.status === "correct" 
                        ? "bg-green-50/50 border-green-200" 
                        : qr.status === "incorrect"
                        ? "bg-red-50/50 border-red-200"
                        : "bg-gray-50/50 border-gray-200"
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base">Question {qr.qNo}</span>
                          {qr.difficulty && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              qr.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              qr.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {qr.difficulty}
                            </span>
                          )}
                          {qr.topicName && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                              {qr.topicName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground">{qr.questionText}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap w-fit sm:w-auto ${
                          qr.status === "correct" 
                            ? "bg-green-200 text-green-800" 
                            : qr.status === "incorrect"
                            ? "bg-red-200 text-red-800"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {qr.status === "correct" ? `✓ Correct (+${qr.marksObtained}/${qr.marks})` : 
                         qr.status === "incorrect" ? `✗ Incorrect (0/${qr.marks})` : 
                         `⊘ Unattempted (0/${qr.marks})`}
                      </span>
                    </div>

                    {/* Options */}
                    {qr.options && qr.options.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Options</p>
                        <div className="space-y-2">
                          {qr.options.map((option: any, optIdx: number) => {
                            const isCorrect = option.isCorrect
                            const isSelected = qr.studentAnswer === option.text
                            const isWrongSelection = isSelected && !isCorrect

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-lg border-2 transition-colors ${
                                  isCorrect
                                    ? "bg-green-50 border-green-400 dark:bg-green-950"
                                    : isWrongSelection
                                    ? "bg-red-50 border-red-400 dark:bg-red-950"
                                    : isSelected
                                    ? "bg-blue-50 border-blue-300 dark:bg-blue-950"
                                    : "bg-background border-muted"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`mt-1 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                                      isCorrect
                                        ? "bg-green-500 border-green-600 text-white"
                                        : isWrongSelection
                                        ? "bg-red-500 border-red-600 text-white"
                                        : isSelected
                                        ? "bg-blue-500 border-blue-600 text-white"
                                        : "bg-muted border-muted-foreground text-muted-foreground"
                                    }`}
                                  >
                                    {isCorrect ? "✓" : isWrongSelection ? "✗" : String.fromCharCode(65 + optIdx)}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                      isCorrect ? "text-green-700 dark:text-green-400" :
                                      isWrongSelection ? "text-red-700 dark:text-red-400" :
                                      isSelected ? "text-blue-700 dark:text-blue-400" :
                                      "text-foreground"
                                    }`}>
                                      {option.text}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                      {isCorrect && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-semibold">
                                          ✓ Correct Answer
                                        </span>
                                      )}
                                      {isWrongSelection && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 font-semibold">
                                          ✗ Your Answer (Wrong)
                                        </span>
                                      )}
                                      {isSelected && !isCorrect && !isWrongSelection && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold">
                                          Your Selection
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Answer Summary */}
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded bg-background border">
                          <p className="text-xs text-muted-foreground font-semibold mb-1">Your Answer</p>
                          <p className={`font-mono text-sm font-semibold ${
                            qr.status === "correct" ? "text-green-700" :
                            qr.status === "incorrect" ? "text-red-700" :
                            "text-muted-foreground"
                          }`}>
                            {qr.studentAnswer || <span className="italic">Not answered</span>}
                          </p>
                        </div>
                        <div className="p-3 rounded bg-green-50 border border-green-200">
                          <p className="text-xs text-muted-foreground font-semibold mb-1">Correct Answer</p>
                          <p className="font-mono text-sm font-semibold text-green-700">
                            {qr.correctAnswer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <BarChart3 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm font-medium">No questions available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
