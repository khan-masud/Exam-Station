"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, Eye, Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import SectionBuilder from "@/components/landing-editor/section-builder"
import MenuBuilder from "@/components/landing-editor/menu-builder"
import GradientPicker from "@/components/landing-editor/gradient-picker"

export default function ThemeEditorPage() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("sections")
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/landing-config?includeInvisible=true")

      if (!response.ok) throw new Error("Failed to fetch configuration")

      const data = await response.json()
      setConfig(data.config)
      setFormData(data.config)
    } catch (error) {
      toast.error("Failed to load configuration")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/admin/landing-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: formData.site_name,
          siteTagline: formData.site_tagline,
          siteDescription: formData.site_description,
          metaTitle: formData.meta_title,
          metaDescription: formData.meta_description,
          logoUrl: formData.logo_url,
          faviconUrl: formData.favicon_url,
          backgroundType: formData.background_type,
          backgroundColor: formData.background_color,
          backgroundGradient: formData.background_gradient,
          backgroundImageUrl: formData.background_image_url,
          enableAnimatedBlobs: formData.enable_animated_blobs,
          blobColors: formData.blob_colors,
          navSticky: formData.nav_sticky,
          navTransparent: formData.nav_transparent,
          navBlur: formData.nav_blur,
          contactEmail: formData.contact_email,
          contactPhone: formData.contact_phone,
          contactAddress: formData.contact_address,
          facebookUrl: formData.facebook_url,
          twitterUrl: formData.twitter_url,
          instagramUrl: formData.instagram_url,
          linkedinUrl: formData.linkedin_url,
          copyrightText: formData.copyright_text,
        }),
      })

      if (!response.ok) throw new Error("Failed to save configuration")

      // Clear cached settings so DynamicTitle refetches
      if (typeof window !== 'undefined') {
        localStorage.removeItem('siteSettings')
      }

      toast.success("Configuration saved successfully")
      await fetchConfig()
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Landing Page Editor</h1>
          <p className="text-muted-foreground">
            Customize your landing page sections, menus, and appearance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("/", "_blank")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="menus">Menus</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <SectionBuilder onSectionsChange={fetchConfig} />
        </TabsContent>

        <TabsContent value="menus">
          <MenuBuilder onMenusChange={fetchConfig} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>Configure main site information and appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Site Name (Hero Title)</Label>
                <Input
                  value={formData.site_name || ""}
                  onChange={(e) => handleChange("site_name", e.target.value)}
                  placeholder="Exam System"
                />
              </div>
              <div>
                <Label>Site Tagline</Label>
                <Input
                  value={formData.site_tagline || ""}
                  onChange={(e) => handleChange("site_tagline", e.target.value)}
                  placeholder="Your assessment platform"
                />
              </div>
              <div>
                <Label>Site Description (Hero Subtitle)</Label>
                <Textarea
                  value={formData.site_description || ""}
                  onChange={(e) => handleChange("site_description", e.target.value)}
                  placeholder="with Expert Exams"
                />
              </div>
              <div>
                <Label>Copyright Text</Label>
                <Input
                  value={formData.copyright_text || ""}
                  onChange={(e) => handleChange("copyright_text", e.target.value)}
                  placeholder="© 2025 Exam System. All rights reserved."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Facebook</Label>
                <Input
                  value={formData.facebook_url || ""}
                  onChange={(e) => handleChange("facebook_url", e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div>
                <Label>Twitter</Label>
                <Input
                  value={formData.twitter_url || ""}
                  onChange={(e) => handleChange("twitter_url", e.target.value)}
                  placeholder="https://twitter.com/youraccount"
                />
              </div>

              <div>
                <Label>Instagram</Label>
                <Input
                  value={formData.instagram_url || ""}
                  onChange={(e) => handleChange("instagram_url", e.target.value)}
                  placeholder="https://instagram.com/youraccount"
                />
              </div>

              <div>
                <Label>LinkedIn</Label>
                <Input
                  value={formData.linkedin_url || ""}
                  onChange={(e) => handleChange("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={fetchConfig}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
