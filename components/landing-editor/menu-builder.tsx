"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, GripVertical, Edit, Save, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

interface MenuItem {
  id: string
  menu_location: string
  label: string
  url?: string
  link_type: string
  icon?: string
  parent_id?: string
  display_order: number
  is_visible: boolean
  badge_text?: string
  badge_color?: string
  open_in_new_tab: boolean
}

interface MenuBuilderProps {
  onMenusChange?: () => void
}

export default function MenuBuilder({ onMenusChange }: MenuBuilderProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [groupedMenus, setGroupedMenus] = useState<Record<string, MenuItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string>('navbar')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/landing-config/menus')
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data.menuItems || [])
        setGroupedMenus(data.groupedMenus || {})
      }
    } catch (error) {
      toast.error('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const location = selectedLocation
    const items = Array.from(groupedMenus[location] || [])
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update display order
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index,
    }))

    setGroupedMenus(prev => ({
      ...prev,
      [location]: updatedItems
    }))

    // Save new order to backend
    try {
      await fetch('/api/admin/landing-config/menus', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItems: updatedItems.map(item => ({
            id: item.id,
            displayOrder: item.display_order
          }))
        }),
      })
      toast.success('Menu order updated')
      onMenusChange?.()
    } catch (error) {
      toast.error('Failed to update menu order')
    }
  }

  const handleCreateItem = () => {
    setEditingItem({
      id: '',
      menu_location: selectedLocation,
      label: '',
      url: '',
      link_type: 'internal',
      display_order: (groupedMenus[selectedLocation]?.length || 0),
      is_visible: true,
      open_in_new_tab: false,
    } as MenuItem)
    setShowDialog(true)
  }

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setShowDialog(true)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return

    try {
      const response = await fetch(`/api/admin/landing-config/menus?id=${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete menu item')
      }

      toast.success('Menu item deleted successfully')
      await fetchMenuItems()
      onMenusChange?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete menu item')
    }
  }

  const handleSaveItem = async (itemData: Partial<MenuItem>) => {
    try {
      const isNew = !itemData.id

      const response = await fetch('/api/admin/landing-config/menus', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuId: itemData.id,
          menuLocation: itemData.menu_location,
          label: itemData.label,
          url: itemData.url,
          linkType: itemData.link_type,
          icon: itemData.icon,
          displayOrder: itemData.display_order,
          isVisible: itemData.is_visible,
          badgeText: itemData.badge_text,
          badgeColor: itemData.badge_color,
          openInNewTab: itemData.open_in_new_tab,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save menu item')
      }

      toast.success(`Menu item ${isNew ? 'created' : 'updated'} successfully`)
      setShowDialog(false)
      setEditingItem(null)
      await fetchMenuItems()
      onMenusChange?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save menu item')
    }
  }

  const menuLocations = [
    { value: 'navbar', label: 'Navigation Bar' },
    { value: 'footer-links', label: 'Footer - Quick Links' },
    { value: 'footer-support', label: 'Footer - Support' },
    { value: 'mobile', label: 'Mobile Menu' },
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const currentItems = groupedMenus[selectedLocation] || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Menu Builder</h3>
          <p className="text-sm text-muted-foreground">
            Customize navigation and footer menus
          </p>
        </div>
      </div>

      <Tabs value={selectedLocation} onValueChange={setSelectedLocation}>
        <TabsList className="grid w-full grid-cols-4">
          {menuLocations.map(loc => (
            <TabsTrigger key={loc.value} value={loc.value}>
              {loc.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {menuLocations.map(loc => (
          <TabsContent key={loc.value} value={loc.value} className="space-y-4">
            <Button onClick={handleCreateItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>

            {currentItems.length === 0 ? (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <p>No menu items in this location yet.</p>
                </div>
              </Card>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={`menu-${loc.value}`}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {currentItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
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
                                      <h4 className="font-semibold">{item.label}</h4>
                                      {!item.is_visible && (
                                        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                                          Hidden
                                        </span>
                                      )}
                                      {item.badge_text && (
                                        <span className={`text-xs px-2 py-1 bg-${item.badge_color || 'blue'}-100 dark:bg-${item.badge_color || 'blue'}-900 text-${item.badge_color || 'blue'}-700 dark:text-${item.badge_color || 'blue'}-300 rounded`}>
                                          {item.badge_text}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {item.url || 'No URL'} • {item.link_type}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditItem(item)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteItem(item.id)}
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
          </TabsContent>
        ))}
      </Tabs>

      {editingItem && (
        <MenuItemDialog
          item={editingItem}
          open={showDialog}
          onOpenChange={setShowDialog}
          onSave={handleSaveItem}
        />
      )}
    </div>
  )
}

// Menu Item Dialog Component
interface MenuItemDialogProps {
  item: MenuItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: Partial<MenuItem>) => void
}

function MenuItemDialog({ item, open, onOpenChange, onSave }: MenuItemDialogProps) {
  const [formData, setFormData] = useState<Partial<MenuItem>>(item)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFormData(item)
  }, [item])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave(formData)
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.id ? 'Edit Menu Item' : 'Create Menu Item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Label *</Label>
              <Input
                value={formData.label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                placeholder="e.g., Home, About, Contact"
                required
              />
            </div>

            <div>
              <Label>URL *</Label>
              <Input
                value={formData.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="/page or https://example.com"
                required
              />
            </div>

            <div>
              <Label>Link Type</Label>
              <Select
                value={formData.link_type || 'internal'}
                onValueChange={(value) => handleChange('link_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                  <SelectItem value="scroll">Scroll (Anchor)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Icon (Lucide name)</Label>
              <Input
                value={formData.icon || ''}
                onChange={(e) => handleChange('icon', e.target.value)}
                placeholder="e.g., home, user, settings"
              />
            </div>

            <div>
              <Label>Badge Text</Label>
              <Input
                value={formData.badge_text || ''}
                onChange={(e) => handleChange('badge_text', e.target.value)}
                placeholder="New, Hot, etc."
              />
            </div>

            <div className="flex items-center justify-between col-span-2">
              <Label>Visible</Label>
              <Switch
                checked={formData.is_visible !== false}
                onCheckedChange={(checked) => handleChange('is_visible', checked)}
              />
            </div>

            <div className="flex items-center justify-between col-span-2">
              <Label>Open in New Tab</Label>
              <Switch
                checked={formData.open_in_new_tab || false}
                onCheckedChange={(checked) => handleChange('open_in_new_tab', checked)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
