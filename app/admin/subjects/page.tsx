"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, LogOut, X, RefreshCw, BookOpen, HelpCircle, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface Subject {
  id: string
  name: string
  description: string
  total_questions: number
  total_exams: number
}

export default function SubjectsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/subjects", {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects || [])
      } else {
        setSubjects([])
      }
    } catch (error) {
      setSubjects([])
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSubjects()
    setRefreshing(false)
  }

  const handleOpenModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject)
      setFormData({ name: subject.name, description: subject.description })
    } else {
      setEditingSubject(null)
      setFormData({ name: "", description: "" })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSubject(null)
  }

  const handleSaveSubject = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a subject name")
      return
    }

    try {
      if (editingSubject) {
        // Update existing subject
        const response = await fetch(`/api/subjects`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: editingSubject.id,
            name: formData.name,
            description: formData.description,
          })
        })

        if (response.ok) {
          await fetchSubjects()
          handleCloseModal()
          toast.success("Subject updated successfully")
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to update subject')
        }
      } else {
        // Create new subject
        const response = await fetch(`/api/subjects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            organization_id: user?.organizationId || null,
          })
        })

        if (response.ok) {
          await fetchSubjects()
          handleCloseModal()
          toast.success("Subject created successfully")
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to create subject')
        }
      }
    } catch (error) {
      toast.error('Failed to save subject')
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      try {
        const response = await fetch(`/api/subjects?id=${id}`, {
          method: 'DELETE',
          credentials: 'include'
        })

        if (response.ok) {
          await fetchSubjects()
          toast.success("Subject deleted successfully")
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to delete subject')
        }
      } catch (error) {
        toast.error('Failed to delete subject')
      }
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Subject Management</h1>
              <p className="text-muted-foreground">Create and manage exam subjects</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleOpenModal()} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Subject
              </Button>
            </div>
          </div>

          <Link href="/admin/dashboard" className="text-primary hover:underline text-sm mb-6 inline-block">
            ← Back to Dashboard
          </Link>

          {/* Subjects Grid */}
          {loading ? (
            <div className="text-center py-8">Loading subjects...</div>
          ) : subjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No subjects created yet</p>
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Subject
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2">{subject.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">{subject.description || "No description"}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats Grid */}
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-muted-foreground">Questions</span>
                        <span className="font-bold text-lg">{subject.total_questions}</span>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      {subject.total_questions > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {subject.total_questions} {subject.total_questions === 1 ? 'Question' : 'Questions'}
                        </Badge>
                      )}
                      {subject.total_questions === 0 && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                          No questions
                        </Badge>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleOpenModal(subject)}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
                  <h2 className="text-xl font-bold">{editingSubject ? "Edit Subject" : "Create Subject"}</h2>
                  <button onClick={handleCloseModal} className="p-1 hover:bg-muted rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject Name</label>
                    <Input
                      placeholder="Enter subject name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      placeholder="Enter description"
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={handleCloseModal} className="flex-1 bg-transparent">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveSubject} className="flex-1">
                      {editingSubject ? "Update" : "Create"}
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
