"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, GripVertical, Eye, EyeOff, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import GradientPicker from "./gradient-picker"
import ImagePicker from "./image-picker"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

interface Section {
  id: string
  section_key: string
  section_name: string
  section_type: string
  is_visible: boolean
  display_order: number
  background_type: string
  background_color?: string
  background_gradient?: any
  background_image_url?: string
  content: any
  [key: string]: any
}

interface SectionBuilderProps {
  onSectionsChange?: () => void
}

export default function SectionBuilder({ onSectionsChange }: SectionBuilderProps) {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/landing-config/sections')
      if (response.ok) {
        const data = await response.json()
        setSections(data.sections || [])
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error)
      toast.error('Failed to load sections')
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(sections)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update display order
    const updatedSections = items.map((item, index) => ({
      ...item,
      display_order: index,
    }))

    setSections(updatedSections)

    // Save new order to backend
    try {
      for (const section of updatedSections) {
        await fetch('/api/admin/landing-config/sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: section.id,
            displayOrder: section.display_order,
          }),
        })
      }
      toast.success('Section order updated')
      onSectionsChange?.()
    } catch (error) {
      console.error('Failed to update section order:', error)
      toast.error('Failed to update section order')
    }
  }

  const handleToggleVisibility = async (section: Section) => {
    try {
      const response = await fetch('/api/admin/landing-config/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: section.id,
          isVisible: !section.is_visible,
        }),
      })

      if (!response.ok) throw new Error('Failed to update visibility')

      setSections(sections.map(s => 
        s.id === section.id ? { ...s, is_visible: !s.is_visible } : s
      ))
      toast.success(`Section ${!section.is_visible ? 'shown' : 'hidden'}`)
      onSectionsChange?.()
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
      toast.error('Failed to update section visibility')
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return

    try {
      const response = await fetch(`/api/admin/landing-config/sections?id=${sectionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete section')

      setSections(sections.filter(s => s.id !== sectionId))
      toast.success('Section deleted successfully')
      onSectionsChange?.()
    } catch (error) {
      console.error('Failed to delete section:', error)
      toast.error('Failed to delete section')
    }
  }

  const handleCreateSection = () => {
    setSelectedSection({
      id: '',
      section_key: '',
      section_name: 'New Section',
      section_type: 'custom',
      is_visible: true,
      display_order: sections.length,
      background_type: 'transparent',
      content: {},
    } as Section)
    setEditMode(true)
  }

  const handleEditSection = (section: Section) => {
    setSelectedSection(section)
    setEditMode(true)
  }

  const handleSaveSection = async (sectionData: Partial<Section>) => {
    try {
      setSaving(true)
      
      const isNew = !sectionData.id

      // Convert snake_case to camelCase for API
      const payload: any = {
        sectionId: sectionData.id,
        sectionKey: sectionData.section_key,
        sectionName: sectionData.section_name,
        sectionType: sectionData.section_type,
        isVisible: sectionData.is_visible,
        displayOrder: sectionData.display_order,
        containerWidth: sectionData.container_width,
        paddingTop: sectionData.padding_top,
        paddingBottom: sectionData.padding_bottom,
        minHeight: sectionData.min_height,
        backgroundType: sectionData.background_type,
        backgroundColor: sectionData.background_color,
        backgroundGradient: sectionData.background_gradient,
        backgroundImageUrl: sectionData.background_image_url,
        backgroundImagePosition: sectionData.background_image_position,
        backgroundImageSize: sectionData.background_image_size,
        backgroundOpacity: sectionData.background_opacity,
        backgroundOverlay: sectionData.background_overlay,
        backgroundOverlayOpacity: sectionData.background_overlay_opacity,
        content: sectionData.content,
        customClasses: sectionData.custom_classes,
        enableAnimations: sectionData.enable_animations,
        animationType: sectionData.animation_type,
      }

      const response = await fetch('/api/admin/landing-config/sections', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save section')
      }

      toast.success(`Section ${isNew ? 'created' : 'updated'} successfully`)
      setEditMode(false)
      setSelectedSection(null)
      await fetchSections()
      onSectionsChange?.()
    } catch (error: any) {
      console.error('Failed to save section:', error)
      toast.error(error.message || 'Failed to save section')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (editMode && selectedSection) {
    return (
      <SectionEditor
        section={selectedSection}
        onSave={handleSaveSection}
        onCancel={() => {
          setEditMode(false)
          setSelectedSection(null)
        }}
        saving={saving}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Landing Page Sections</h3>
          <p className="text-sm text-muted-foreground">
            Drag to reorder, click to edit
          </p>
        </div>
        <Button onClick={handleCreateSection}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p>No sections yet. Click "Add Section" to get started.</p>
          </div>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {sections.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{section.section_name}</h4>
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                  {section.section_type}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Key: {section.section_key}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleVisibility(section)}
                                title={section.is_visible ? 'Hide section' : 'Show section'}
                              >
                                {section.is_visible ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSection(section)}
                              >
                                Edit
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSection(section.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}

// Section Editor Component
interface SectionEditorProps {
  section: Section
  onSave: (section: Partial<Section>) => void
  onCancel: () => void
  saving: boolean
}

function SectionEditor({ section, onSave, onCancel, saving }: SectionEditorProps) {
  const [formData, setFormData] = useState<Partial<Section>>(section)
  const [activeTab, setActiveTab] = useState("basic")

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContentChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: { ...(prev.content || {}), [field]: value }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {section.id ? 'Edit Section' : 'Create Section'}
        </h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Section
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="style">Style & Background</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <Label>Section Key *</Label>
              <Input
                value={formData.section_key || ''}
                onChange={(e) => handleChange('section_key', e.target.value)}
                placeholder="e.g., hero, features, stats"
                required
                disabled={!!section.id}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Unique identifier (lowercase, no spaces)
              </p>
            </div>

            <div>
              <Label>Section Name *</Label>
              <Input
                value={formData.section_name || ''}
                onChange={(e) => handleChange('section_name', e.target.value)}
                placeholder="e.g., Hero Section"
                required
              />
            </div>

            <div>
              <Label>Section Type *</Label>
              <Select
                value={formData.section_type || 'custom'}
                onValueChange={(value) => handleChange('section_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero</SelectItem>
                  <SelectItem value="statistics">Statistics</SelectItem>
                  <SelectItem value="features">Features</SelectItem>
                  <SelectItem value="programs">Programs</SelectItem>
                  <SelectItem value="testimonials">Testimonials</SelectItem>
                  <SelectItem value="call-to-action">Call to Action</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="custom-html">Custom HTML</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Visible</Label>
              <Switch
                checked={formData.is_visible !== false}
                onCheckedChange={(checked) => handleChange('is_visible', checked)}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <Label>Background Type</Label>
              <Select
                value={formData.background_type || 'transparent'}
                onValueChange={(value) => handleChange('background_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transparent">Transparent</SelectItem>
                  <SelectItem value="solid">Solid Color</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.background_type === 'solid' && (
              <div>
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.background_color || '#ffffff'}
                    onChange={(e) => handleChange('background_color', e.target.value)}
                    className="w-12 h-9 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.background_color || '#ffffff'}
                    onChange={(e) => handleChange('background_color', e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            )}

            {formData.background_type === 'gradient' && (
              <GradientPicker
                value={formData.background_gradient}
                onChange={(gradient) => handleChange('background_gradient', gradient)}
                label="Background Gradient"
              />
            )}

            {formData.background_type === 'image' && (
              <ImagePicker
                value={formData.background_image_url || null}
                onChange={(url) => handleChange('background_image_url', url)}
                label="Background Image"
              />
            )}

            <div>
              <Label>Padding Top</Label>
              <Input
                value={formData.padding_top || 'py-20'}
                onChange={(e) => handleChange('padding_top', e.target.value)}
                placeholder="py-20"
              />
            </div>

            <div>
              <Label>Padding Bottom</Label>
              <Input
                value={formData.padding_bottom || 'py-20'}
                onChange={(e) => handleChange('padding_bottom', e.target.value)}
                placeholder="py-20"
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card className="p-4">
            <Label>Section Content (JSON)</Label>
            <Textarea
              value={JSON.stringify(formData.content || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  handleChange('content', parsed)
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
              rows={15}
              className="font-mono text-sm"
              placeholder='{"title": "Section Title", "description": "Section description..."}'
            />
            <p className="text-xs text-muted-foreground mt-2">
              Edit section content as JSON. Must be valid JSON format.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
