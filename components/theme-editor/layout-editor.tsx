"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface LayoutEditorProps {
  theme: any
  onUpdate: (updates: any) => void
}

export default function LayoutEditor({ theme, onUpdate }: LayoutEditorProps) {
  return (
    <div className="space-y-4">
      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Border Radius</CardTitle>
          <CardDescription>Roundness of corners for all elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="border-radius">Border Radius (px)</Label>
            <div className="space-y-2">
              <Slider
                id="border-radius"
                min={0}
                max={24}
                step={1}
                value={[theme.border_radius || 6]}
                onValueChange={(values) =>
                  onUpdate({ border_radius: values[0] })
                }
              />
              <p className="text-xs text-muted-foreground">
                Current: {theme.border_radius || 6}px
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div
                className="aspect-square"
                style={{
                  backgroundColor: theme.primary_color || "#3b82f6",
                  borderRadius: `${theme.border_radius || 6}px`,
                }}
              />
              <div
                className="aspect-square"
                style={{
                  backgroundColor: theme.secondary_color || "#8b5cf6",
                  borderRadius: `${theme.border_radius || 6}px`,
                }}
              />
              <div
                className="aspect-square"
                style={{
                  backgroundColor: theme.accent_color || "#ec4899",
                  borderRadius: `${theme.border_radius || 6}px`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Container Width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Container</CardTitle>
          <CardDescription>Maximum width for page content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="max-width">Max Width (px)</Label>
            <Input
              id="max-width"
              type="number"
              min="800"
              max="1920"
              step="100"
              value={theme.container_max_width || 1280}
              onChange={(e) =>
                onUpdate({
                  container_max_width: parseInt(e.target.value) || 1280,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current: {theme.container_max_width || 1280}px
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sidebar</CardTitle>
          <CardDescription>Width of the sidebar layout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sidebar-width">Sidebar Width (px)</Label>
            <Input
              id="sidebar-width"
              type="number"
              min="200"
              max="400"
              step="10"
              value={theme.sidebar_width || 256}
              onChange={(e) =>
                onUpdate({
                  sidebar_width: parseInt(e.target.value) || 256,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current: {theme.sidebar_width || 256}px
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Header</CardTitle>
          <CardDescription>Height of the top navigation header</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="header-height">Header Height (px)</Label>
            <Input
              id="header-height"
              type="number"
              min="40"
              max="100"
              step="2"
              value={theme.header_height || 64}
              onChange={(e) =>
                onUpdate({
                  header_height: parseInt(e.target.value) || 64,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current: {theme.header_height || 64}px
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Spacing Unit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spacing Unit</CardTitle>
          <CardDescription>Base unit for all spacing (margins, padding)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="spacing-unit">Base Unit (px)</Label>
            <Input
              id="spacing-unit"
              type="number"
              min="2"
              max="12"
              step="1"
              value={theme.spacing_unit || 4}
              onChange={(e) =>
                onUpdate({
                  spacing_unit: parseInt(e.target.value) || 4,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current: {theme.spacing_unit || 4}px
            </p>
            <div className="mt-4 space-y-1">
              <p className="text-xs font-medium">Spacing Scale:</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 6, 8, 12].map((multiplier) => (
                  <div
                    key={multiplier}
                    className="bg-muted text-xs px-2 py-1 rounded text-center"
                  >
                    {multiplier}x = {(theme.spacing_unit || 4) * multiplier}px
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shadow Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shadows</CardTitle>
          <CardDescription>Shadow effects for depth</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shadow-sm">Small Shadow</Label>
            <Input
              id="shadow-sm"
              type="text"
              value={theme.shadow_sm || ""}
              onChange={(e) => onUpdate({ shadow_sm: e.target.value })}
              placeholder="0 1px 2px 0 rgba(0,0,0,0.05)"
            />
            <div
              className="mt-2 p-4 bg-white rounded"
              style={{
                boxShadow: theme.shadow_sm,
              }}
            >
              Small Shadow
            </div>
          </div>

          <div>
            <Label htmlFor="shadow-md">Medium Shadow</Label>
            <Input
              id="shadow-md"
              type="text"
              value={theme.shadow_md || ""}
              onChange={(e) => onUpdate({ shadow_md: e.target.value })}
              placeholder="0 4px 6px -1px rgba(0,0,0,0.1)"
            />
            <div
              className="mt-2 p-4 bg-white rounded"
              style={{
                boxShadow: theme.shadow_md,
              }}
            >
              Medium Shadow
            </div>
          </div>

          <div>
            <Label htmlFor="shadow-lg">Large Shadow</Label>
            <Input
              id="shadow-lg"
              type="text"
              value={theme.shadow_lg || ""}
              onChange={(e) => onUpdate({ shadow_lg: e.target.value })}
              placeholder="0 10px 15px -3px rgba(0,0,0,0.1)"
            />
            <div
              className="mt-2 p-4 bg-white rounded"
              style={{
                boxShadow: theme.shadow_lg,
              }}
            >
              Large Shadow
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
