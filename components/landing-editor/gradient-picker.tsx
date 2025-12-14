"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Check, Palette } from "lucide-react"

interface GradientConfig {
  from: string
  via?: string
  to: string
  direction: string
}

interface GradientPickerProps {
  value: GradientConfig | null
  onChange: (gradient: GradientConfig | null) => void
  label?: string
}

export default function GradientPicker({ value, onChange, label = "Gradient" }: GradientPickerProps) {
  const [gradient, setGradient] = useState<GradientConfig>(
    value || { from: "#3b82f6", to: "#8b5cf6", direction: "r" }
  )
  const [presets, setPresets] = useState<any[]>([])
  const [showPresets, setShowPresets] = useState(false)

  useEffect(() => {
    fetchPresets()
  }, [])

  useEffect(() => {
    if (value) {
      setGradient(value)
    }
  }, [value])

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/admin/landing-config/gradients')
      if (response.ok) {
        const data = await response.json()
        setPresets(data.presets || [])
      }
    } catch (error) {
      console.error('Failed to fetch gradient presets:', error)
    }
  }

  const handleChange = (field: keyof GradientConfig, value: string) => {
    const newGradient = { ...gradient, [field]: value }
    setGradient(newGradient)
    onChange(newGradient)
  }

  const handlePresetSelect = (preset: any) => {
    setGradient(preset.gradient_config)
    onChange(preset.gradient_config)
    setShowPresets(false)
  }

  const getGradientCSS = (g: GradientConfig) => {
    const directionMap: any = {
      'r': 'to right',
      'l': 'to left',
      't': 'to top',
      'b': 'to bottom',
      'br': 'to bottom right',
      'bl': 'to bottom left',
      'tr': 'to top right',
      'tl': 'to top left',
    }
    const cssDir = directionMap[g.direction] || 'to right'
    let css = `linear-gradient(${cssDir}, ${g.from}`
    if (g.via) css += `, ${g.via}`
    css += `, ${g.to})`
    return css
  }

  const directionOptions = [
    { value: "r", label: "Right" },
    { value: "l", label: "Left" },
    { value: "t", label: "Top" },
    { value: "b", label: "Bottom" },
    { value: "br", label: "Bottom Right" },
    { value: "bl", label: "Bottom Left" },
    { value: "tr", label: "Top Right" },
    { value: "tl", label: "Top Left" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPresets(!showPresets)}
        >
          <Palette className="h-4 w-4 mr-2" />
          Presets
        </Button>
      </div>

      {/* Preview */}
      <div
        className="h-20 rounded-lg border"
        style={{ background: getGradientCSS(gradient) }}
      />

      {/* Presets */}
      {showPresets && presets.length > 0 && (
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="relative h-16 rounded-md border hover:border-blue-500 transition-colors"
                style={{ background: getGradientCSS(preset.gradient_config) }}
                title={preset.preset_name}
              >
                {gradient.from === preset.gradient_config.from &&
                 gradient.to === preset.gradient_config.to && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Custom Gradient Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">From Color</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="color"
              value={gradient.from}
              onChange={(e) => handleChange('from', e.target.value)}
              className="w-12 h-9 p-1"
            />
            <Input
              type="text"
              value={gradient.from}
              onChange={(e) => handleChange('from', e.target.value)}
              placeholder="#3b82f6"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">To Color</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="color"
              value={gradient.to}
              onChange={(e) => handleChange('to', e.target.value)}
              className="w-12 h-9 p-1"
            />
            <Input
              type="text"
              value={gradient.to}
              onChange={(e) => handleChange('to', e.target.value)}
              placeholder="#8b5cf6"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Via Color (Optional)</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="color"
              value={gradient.via || "#6366f1"}
              onChange={(e) => handleChange('via', e.target.value)}
              className="w-12 h-9 p-1"
            />
            <Input
              type="text"
              value={gradient.via || ""}
              onChange={(e) => handleChange('via', e.target.value)}
              placeholder="Optional"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Direction</Label>
          <Select 
            value={gradient.direction} 
            onValueChange={(value) => handleChange('direction', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {directionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setGradient({ from: "#3b82f6", to: "#8b5cf6", direction: "r" })
          onChange({ from: "#3b82f6", to: "#8b5cf6", direction: "r" })
        }}
        className="w-full"
      >
        Reset to Default
      </Button>
    </div>
  )
}
