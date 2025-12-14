"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"

interface ThemePreviewProps {
  theme: any
  onClose: () => void
}

export default function ThemePreview({ theme, onClose }: ThemePreviewProps) {
  const themeVars = {
    "--primary": theme.primary_color,
    "--secondary": theme.secondary_color,
    "--accent": theme.accent_color,
    "--background": theme.background_color,
    "--text": theme.text_color,
    "--border": theme.border_color,
    "--success": theme.success_color,
    "--warning": theme.warning_color,
    "--danger": theme.danger_color,
    "--muted": theme.muted_color,
    "--radius": `${theme.border_radius}px`,
    "--font-heading": theme.font_family_heading,
    "--font-body": theme.font_family_body,
    "--shadow-sm": theme.shadow_sm,
    "--shadow-md": theme.shadow_md,
    "--shadow-lg": theme.shadow_lg,
  } as any

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Preview: {theme.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Preview Content */}
        <div
          className="flex-1 overflow-y-auto p-8"
          style={themeVars as any}
        >
          <div
            style={{ backgroundColor: theme.background_color, color: theme.text_color }}
            className="min-h-full p-8 rounded-lg space-y-6"
          >
            {/* Header Sample */}
            <div
              style={{ backgroundColor: theme.primary_color }}
              className="text-white rounded-lg p-6 space-y-2"
            >
              <h1 style={{ fontFamily: theme.font_family_heading }} className="text-3xl font-bold">
                Welcome to {theme.site_name || "Your App"}
              </h1>
              <p style={{ fontFamily: theme.font_family_body }}>
                This is a preview of your theme with all customized colors and typography
              </p>
            </div>

            {/* Color Palette */}
            <div className="space-y-2">
              <h2 style={{ fontFamily: theme.font_family_heading }} className="text-2xl font-bold">
                Color Palette
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { name: "Primary", color: theme.primary_color },
                  { name: "Secondary", color: theme.secondary_color },
                  { name: "Accent", color: theme.accent_color },
                  { name: "Success", color: theme.success_color },
                  { name: "Warning", color: theme.warning_color },
                  { name: "Danger", color: theme.danger_color },
                  { name: "Muted", color: theme.muted_color },
                  { name: "Border", color: theme.border_color },
                ].map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div
                      className="w-full h-24 rounded-lg border"
                      style={{
                        backgroundColor: item.color,
                        borderColor: theme.border_color,
                      }}
                    />
                    <p className="text-sm font-medium">{item.name}</p>
                    <code className="text-xs font-mono text-muted-foreground">{item.color}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography Sample */}
            <div className="space-y-4">
              <h2 style={{ fontFamily: theme.font_family_heading }} className="text-2xl font-bold">
                Typography
              </h2>

              <div>
                <h3 style={{ fontFamily: theme.font_family_heading }} className="text-xl font-bold">
                  Heading 1
                </h3>
                <p style={{ fontFamily: theme.font_family_body }} className="text-muted-foreground">
                  This is a sample of heading typography
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: theme.font_family_heading }} className="text-lg font-bold">
                  Heading 2
                </h4>
                <p style={{ fontFamily: theme.font_family_body }} className="text-muted-foreground">
                  This is a sample of body text using the configured font family
                </p>
              </div>

              <p style={{ fontFamily: theme.font_family_body }}>
                Regular body text with line height of {theme.line_height_normal || 1.5}x
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-4">
              <h2 style={{ fontFamily: theme.font_family_heading }} className="text-2xl font-bold">
                Buttons & Components
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  style={{
                    backgroundColor: theme.primary_color,
                    color: "white",
                    borderRadius: `${theme.border_radius}px`,
                  }}
                  className="px-4 py-2 font-medium text-sm"
                >
                  Primary
                </button>
                <button
                  style={{
                    backgroundColor: theme.secondary_color,
                    color: "white",
                    borderRadius: `${theme.border_radius}px`,
                  }}
                  className="px-4 py-2 font-medium text-sm"
                >
                  Secondary
                </button>
                <button
                  style={{
                    backgroundColor: theme.success_color,
                    color: "white",
                    borderRadius: `${theme.border_radius}px`,
                  }}
                  className="px-4 py-2 font-medium text-sm"
                >
                  Success
                </button>
                <button
                  style={{
                    backgroundColor: theme.danger_color,
                    color: "white",
                    borderRadius: `${theme.border_radius}px`,
                  }}
                  className="px-4 py-2 font-medium text-sm"
                >
                  Danger
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              <h2 style={{ fontFamily: theme.font_family_heading }} className="text-2xl font-bold">
                Card Sample
              </h2>
              <div
                style={{
                  backgroundColor: theme.background_color,
                  borderColor: theme.border_color,
                  borderRadius: `${theme.border_radius}px`,
                }}
                className="border p-6 space-y-3"
              >
                <h3 style={{ fontFamily: theme.font_family_heading }} className="text-lg font-bold">
                  Sample Card
                </h3>
                <p style={{ fontFamily: theme.font_family_body }}>
                  This is a sample card with the configured colors and typography
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    style={{
                      backgroundColor: theme.primary_color,
                      color: "white",
                      borderRadius: `${theme.border_radius}px`,
                    }}
                    className="px-4 py-2 text-sm font-medium"
                  >
                    Action
                  </button>
                </div>
              </div>
            </div>

            {/* Layout Info */}
            <div className="space-y-4">
              <h2 style={{ fontFamily: theme.font_family_heading }} className="text-2xl font-bold">
                Layout Settings
              </h2>
              <div
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
                style={{
                  backgroundColor: theme.border_color,
                  padding: `${theme.spacing_unit * 2}px`,
                  borderRadius: `${theme.border_radius}px`,
                }}
              >
                <div>
                  <p className="text-sm font-medium">Border Radius</p>
                  <p className="text-lg font-bold">{theme.border_radius}px</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Max Width</p>
                  <p className="text-lg font-bold">{theme.container_max_width}px</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Sidebar Width</p>
                  <p className="text-lg font-bold">{theme.sidebar_width}px</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Header Height</p>
                  <p className="text-lg font-bold">{theme.header_height}px</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Spacing Unit</p>
                  <p className="text-lg font-bold">{theme.spacing_unit}px</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Base Font Size</p>
                  <p className="text-lg font-bold">{theme.font_size_base}px</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
