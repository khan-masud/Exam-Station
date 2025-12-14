"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react"
import { toast } from "sonner"

interface SectionBuilderProps {
  themeId: string
}

const pages = [
  { value: "/landing", label: "Landing Page" },
  { value: "/dashboard", label: "Dashboard" },
  { value: "/student/browse-exams", label: "Browse Exams" },
  { value: "/admin/dashboard", label: "Admin Dashboard" },
]

const sectionTypes = [
  { value: "custom", label: "Custom" },
  { value: "hero", label: "Hero Section" },
  { value: "features", label: "Features" },
  { value: "testimonials", label: "Testimonials" },
  { value: "cta", label: "Call to Action" },
  { value: "faq", label: "FAQ" },
]

export default function SectionBuilder({ themeId }: SectionBuilderProps) {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingSection, setEditingSection] = useState<any>(null)

  // Form state
  const [pagePath, setPagePath] = useState("")
  const [sectionKey, setSectionKey] = useState("")
  const [sectionName, setSectionName] = useState("")
  const [sectionType, setSectionType] = useState("custom")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [description, setDescription] = useState("")
  const [isVisible, setIsVisible] = useState(true)
  const [ctaText, setCtaText] = useState("")
  const [ctaLink, setCtaLink] = useState("")

  useEffect(() => {
    fetchSections()
  }, [themeId])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/theme/sections?themeId=${themeId}`,
        { credentials: "include" }
      )

      if (!response.ok) throw new Error("Failed to fetch sections")

      const data = await response.json()
      setSections(data.sections || [])
    } catch (error) {
      console.error("Error fetching sections:", error)
      toast.error("Failed to load sections")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pagePath || !sectionKey || !sectionName) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setSaving(true)

      const method = editingSection ? "PATCH" : "POST"
      const url = editingSection
        ? `/api/admin/theme/sections?sectionId=${editingSection.id}`
        : "/api/admin/theme/sections"

      const payload = editingSection
        ? {
            section_name: sectionName,
            title,
            subtitle,
            description,
            is_visible: isVisible,
            cta_text: ctaText,
            cta_link: ctaLink,
          }
        : {
            themeId,
            pagePath,
            sectionKey,
            sectionName,
            sectionType,
            title,
            subtitle,
            description,
            isVisible,
            ctaText,
            ctaLink,
          }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to save section")

      toast.success(editingSection ? "Section updated" : "Section created")
      resetForm()
      fetchSections()
    } catch (error: any) {
      toast.error(error.message || "Failed to save section")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return

    try {
      setSaving(true)

      const response = await fetch(
        `/api/admin/theme/sections?sectionId=${sectionId}`,
        { method: "DELETE", credentials: "include" }
      )

      if (!response.ok) throw new Error("Failed to delete section")

      toast.success("Section deleted")
      fetchSections()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete section")
    } finally {
      setSaving(false)
    }
  }

  const handleEditSection = (section: any) => {
    setEditingSection(section)
    setPagePath(section.page_path)
    setSectionKey(section.section_key)
    setSectionName(section.section_name)
    setSectionType(section.section_type)
    setTitle(section.title)
    setSubtitle(section.subtitle)
    setDescription(section.description)
    setIsVisible(section.is_visible)
    setCtaText(section.cta_text)
    setCtaLink(section.cta_link)
  }

  const resetForm = () => {
    setEditingSection(null)
    setPagePath("")
    setSectionKey("")
    setSectionName("")
    setSectionType("custom")
    setTitle("")
    setSubtitle("")
    setDescription("")
    setIsVisible(true)
    setCtaText("")
    setCtaLink("")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingSection ? "Edit Section" : "Add Section"}</CardTitle>
          <CardDescription>Create or modify page sections</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSection} className="space-y-4">
            <div>
              <Label htmlFor="page">Page *</Label>
              <Select value={pagePath} onValueChange={setPagePath} disabled={!!editingSection}>
                <SelectTrigger disabled={!!editingSection}>
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((page) => (
                    <SelectItem key={page.value} value={page.value}>
                      {page.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="key">Section Key *</Label>
              <Input
                id="key"
                placeholder="e.g., hero, features"
                value={sectionKey}
                onChange={(e) => setSectionKey(e.target.value)}
                disabled={!!editingSection}
              />
            </div>

            <div>
              <Label htmlFor="name">Section Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Hero Section"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="type">Section Type</Label>
              <Select value={sectionType} onValueChange={setSectionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sectionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Section title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                placeholder="Section subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Section description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="visible"
                checked={isVisible}
                onCheckedChange={(checked) => setIsVisible(checked as boolean)}
              />
              <Label htmlFor="visible" className="font-normal">
                Visible on site
              </Label>
            </div>

            <div>
              <Label htmlFor="cta-text">CTA Button Text</Label>
              <Input
                id="cta-text"
                placeholder="e.g., Learn More"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="cta-link">CTA Button Link</Label>
              <Input
                id="cta-link"
                placeholder="e.g., /signup"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              {editingSection && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {editingSection ? "Update" : "Create"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sections List */}
      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
          <CardDescription>Manage page sections</CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No sections created yet
            </p>
          ) : (
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{section.section_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pages.find((p) => p.value === section.page_path)?.label} • {section.section_key}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditSection(section)}
                      disabled={saving}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSection(section.id)}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
