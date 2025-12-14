"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TypographyEditorProps {
  theme: any
  onUpdate: (updates: any) => void
}

const fontFamilies = [
  "system-ui, -apple-system, sans-serif",
  "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  "'Helvetica Neue', Arial, sans-serif",
  "'Times New Roman', Times, serif",
  "'Courier New', monospace",
  "Georgia, serif",
  "'Trebuchet MS', sans-serif",
]

const fontWeights = [
  { label: "Thin (100)", value: 100 },
  { label: "Extra Light (200)", value: 200 },
  { label: "Light (300)", value: 300 },
  { label: "Normal (400)", value: 400 },
  { label: "Medium (500)", value: 500 },
  { label: "Semi Bold (600)", value: 600 },
  { label: "Bold (700)", value: 700 },
  { label: "Extra Bold (800)", value: 800 },
  { label: "Black (900)", value: 900 },
]

export default function TypographyEditor({ theme, onUpdate }: TypographyEditorProps) {
  return (
    <div className="space-y-4">
      {/* Heading Font */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Heading Font</CardTitle>
          <CardDescription>Font used for headings and titles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="heading-font">Font Family</Label>
            <Select
              value={theme.font_family_heading}
              onValueChange={(value) => onUpdate({ font_family_heading: value })}
            >
              <SelectTrigger id="heading-font">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Preview: <span style={{ fontFamily: theme.font_family_heading }}>Heading Text</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Body Font */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Body Font</CardTitle>
          <CardDescription>Font used for body text and paragraphs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="body-font">Font Family</Label>
            <Select
              value={theme.font_family_body}
              onValueChange={(value) => onUpdate({ font_family_body: value })}
            >
              <SelectTrigger id="body-font">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Preview: <span style={{ fontFamily: theme.font_family_body }}>Body Text</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Font Sizes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Font Sizes</CardTitle>
          <CardDescription>Base font size for the entire site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="base-size">Base Font Size (px)</Label>
            <Input
              id="base-size"
              type="number"
              min="12"
              max="20"
              value={theme.font_size_base || 16}
              onChange={(e) =>
                onUpdate({ font_size_base: parseInt(e.target.value) || 16 })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current size: {theme.font_size_base || 16}px
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Font Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Font Weights</CardTitle>
          <CardDescription>Default font weights for different text styles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="weight-regular">Regular Weight</Label>
            <Select
              value={String(theme.font_weight_regular || 400)}
              onValueChange={(value) =>
                onUpdate({ font_weight_regular: parseInt(value) })
              }
            >
              <SelectTrigger id="weight-regular">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontWeights.map((weight) => (
                  <SelectItem key={weight.value} value={String(weight.value)}>
                    {weight.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="weight-medium">Medium Weight</Label>
            <Select
              value={String(theme.font_weight_medium || 500)}
              onValueChange={(value) =>
                onUpdate({ font_weight_medium: parseInt(value) })
              }
            >
              <SelectTrigger id="weight-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontWeights.map((weight) => (
                  <SelectItem key={weight.value} value={String(weight.value)}>
                    {weight.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="weight-bold">Bold Weight</Label>
            <Select
              value={String(theme.font_weight_bold || 700)}
              onValueChange={(value) =>
                onUpdate({ font_weight_bold: parseInt(value) })
              }
            >
              <SelectTrigger id="weight-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontWeights.map((weight) => (
                  <SelectItem key={weight.value} value={String(weight.value)}>
                    {weight.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Line Height */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Height</CardTitle>
          <CardDescription>Spacing between lines of text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="line-height">Line Height (multiplier)</Label>
            <Input
              id="line-height"
              type="number"
              min="1"
              max="2"
              step="0.1"
              value={theme.line_height_normal || 1.5}
              onChange={(e) =>
                onUpdate({ line_height_normal: parseFloat(e.target.value) || 1.5 })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current: {(theme.line_height_normal || 1.5).toFixed(2)}x
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
