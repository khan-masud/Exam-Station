"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Trash2, Edit2, GripVertical } from "lucide-react"
import { toast } from "sonner"

interface MenuBuilderProps {
  themeId: string
}

const menuLocations = [
  { value: "header", label: "Header Menu" },
  { value: "footer", label: "Footer Menu" },
  { value: "sidebar", label: "Sidebar Menu" },
  { value: "mobile", label: "Mobile Menu" },
]

const visibilityRoles = [
  { value: "all", label: "All Users" },
  { value: "guest", label: "Guest Only" },
  { value: "student", label: "Students" },
  { value: "teacher", label: "Teachers" },
  { value: "admin", label: "Admins" },
]

const icons = [
  "home",
  "user",
  "settings",
  "book",
  "briefcase",
  "chart",
  "bell",
  "lock",
  "log-out",
  "menu",
  "search",
  "heart",
  "star",
]

export default function MenuBuilder({ themeId }: MenuBuilderProps) {
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form state
  const [menuLocation, setMenuLocation] = useState("header")
  const [menuKey, setMenuKey] = useState("")
  const [label, setLabel] = useState("")
  const [url, setUrl] = useState("")
  const [icon, setIcon] = useState("home")
  const [isVisible, setIsVisible] = useState(true)
  const [visibleForRole, setVisibleForRole] = useState("all")
  const [badgeText, setBadgeText] = useState("")
  const [displayOrder, setDisplayOrder] = useState(0)

  useEffect(() => {
    fetchMenuItems()
  }, [themeId])

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/theme/menu?themeId=${themeId}`,
        { credentials: "include" }
      )

      if (!response.ok) throw new Error("Failed to fetch menu items")

      const data = await response.json()
      setMenuItems(data.menuItems || [])
    } catch (error) {
      console.error("Error fetching menu items:", error)
      toast.error("Failed to load menu items")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!menuKey || !label) {
      toast.error("Menu key and label are required")
      return
    }

    try {
      setSaving(true)

      const method = editingItem ? "PATCH" : "POST"
      const apiUrl = editingItem
        ? `/api/admin/theme/menu?menuItemId=${editingItem.id}`
        : "/api/admin/theme/menu"

      const payload = editingItem
        ? {
            label,
            url,
            icon,
            display_order: displayOrder,
            is_visible: isVisible,
            visible_for_role: visibleForRole,
            badge_text: badgeText,
          }
        : {
            themeId,
            menuLocation,
            menuKey,
            label,
            url,
            icon,
            displayOrder,
            isVisible,
            visibleForRole,
            badgeText,
          }

      const response = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to save menu item")

      toast.success(editingItem ? "Menu item updated" : "Menu item created")
      resetForm()
      fetchMenuItems()
    } catch (error: any) {
      toast.error(error.message || "Failed to save menu item")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return

    try {
      setSaving(true)

      const response = await fetch(
        `/api/admin/theme/menu?menuItemId=${itemId}`,
        { method: "DELETE", credentials: "include" }
      )

      if (!response.ok) throw new Error("Failed to delete menu item")

      toast.success("Menu item deleted")
      fetchMenuItems()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete menu item")
    } finally {
      setSaving(false)
    }
  }

  const handleEditMenuItem = (item: any) => {
    setEditingItem(item)
    setMenuLocation(item.menu_location)
    setMenuKey(item.menu_key)
    setLabel(item.label)
    setUrl(item.url)
    setIcon(item.icon)
    setIsVisible(item.is_visible)
    setVisibleForRole(item.visible_for_role)
    setBadgeText(item.badge_text)
    setDisplayOrder(item.display_order)
  }

  const resetForm = () => {
    setEditingItem(null)
    setMenuLocation("header")
    setMenuKey("")
    setLabel("")
    setUrl("")
    setIcon("home")
    setIsVisible(true)
    setVisibleForRole("all")
    setBadgeText("")
    setDisplayOrder(0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const groupedItems = menuLocations.reduce((acc, location) => {
    acc[location.value] = menuItems.filter((item) => item.menu_location === location.value)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</CardTitle>
          <CardDescription>Create or modify navigation menu items</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveMenuItem} className="space-y-4">
            <div>
              <Label htmlFor="location">Menu Location *</Label>
              <Select
                value={menuLocation}
                onValueChange={setMenuLocation}
                disabled={!!editingItem}
              >
                <SelectTrigger disabled={!!editingItem}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {menuLocations.map((loc) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="key">Menu Key *</Label>
              <Input
                id="key"
                placeholder="e.g., home, about, contact"
                value={menuKey}
                onChange={(e) => setMenuKey(e.target.value)}
                disabled={!!editingItem}
              />
            </div>

            <div>
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                placeholder="Display label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="e.g., /home"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="icon">Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {icons.map((ico) => (
                    <SelectItem key={ico} value={ico}>
                      {ico}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="role">Visible For</Label>
              <Select value={visibleForRole} onValueChange={setVisibleForRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibilityRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="badge">Badge Text</Label>
              <Input
                id="badge"
                placeholder="e.g., New, Hot"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="visible"
                checked={isVisible}
                onCheckedChange={(checked) => setIsVisible(checked as boolean)}
              />
              <Label htmlFor="visible" className="font-normal">
                Visible
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              {editingItem && (
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
                    {editingItem ? "Update" : "Create"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Menu Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>Manage navigation menus</CardDescription>
        </CardHeader>
        <CardContent>
          {menuItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No menu items created yet
            </p>
          ) : (
            <div className="space-y-4">
              {menuLocations.map((location) => {
                const items = groupedItems[location.value]
                if (items.length === 0) return null

                return (
                  <div key={location.value}>
                    <h4 className="font-medium text-sm mb-2">{location.label}</h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{item.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.url} • {item.visible_for_role}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditMenuItem(item)}
                              disabled={saving}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteMenuItem(item.id)}
                              disabled={saving}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
