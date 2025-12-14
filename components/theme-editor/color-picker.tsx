"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface ColorPickerProps {
  theme: any
  onUpdate: (updates: any) => void
}

const colorFields = [
  { key: "primary_color", label: "Primary Color", description: "Main brand color" },
  { key: "secondary_color", label: "Secondary Color", description: "Secondary brand color" },
  { key: "accent_color", label: "Accent Color", description: "Highlight and accent color" },
  { key: "background_color", label: "Background", description: "Main background color" },
  { key: "text_color", label: "Text Color", description: "Primary text color" },
  { key: "border_color", label: "Border Color", description: "Default border color" },
  { key: "success_color", label: "Success Color", description: "Success messages and alerts" },
  { key: "warning_color", label: "Warning Color", description: "Warning messages and alerts" },
  { key: "danger_color", label: "Danger Color", description: "Error messages and alerts" },
  { key: "muted_color", label: "Muted Color", description: "Disabled and muted text" },
]

export default function ColorPicker({ theme, onUpdate }: ColorPickerProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const handleColorChange = (key: string, value: string) => {
    onUpdate({ [key]: value })
  }

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  return (
    <div className="space-y-4">
      {colorFields.map((field) => (
        <Card key={field.key}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label className="text-sm font-semibold">{field.label}</Label>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-muted cursor-pointer"
                  style={{ backgroundColor: theme[field.key] }}
                  onClick={() => {
                    const input = document.querySelector(
                      `input[data-color-key="${field.key}"]`
                    ) as HTMLInputElement
                    input?.click()
                  }}
                />
                <div className="space-y-1">
                  <Input
                    type="color"
                    value={theme[field.key] || "#000000"}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    className="w-16 h-10 cursor-pointer"
                    data-color-key={field.key}
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    value={theme[field.key] || "#000000"}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    placeholder="#000000"
                    className="w-24 font-mono text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(theme[field.key])}
                  title="Copy to clipboard"
                >
                  {copiedColor === theme[field.key] ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
