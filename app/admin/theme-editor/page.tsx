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
          metaKeywords: formData.meta_keywords,
          ogImage: formData.og_image,
          googleAnalyticsId: formData.google_analytics_id,
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="menus">Menus</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
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

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Site Information</CardTitle>
              <CardDescription>Configure basic site information and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Site Email</Label>
                  <Input
                    value={formData.contact_email || ""}
                    onChange={(e) => handleChange("contact_email", e.target.value)}
                    placeholder="support@example.com"
                    type="email"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Contact email for inquiries</p>
                </div>
                <div>
                  <Label>Site Phone</Label>
                  <Input
                    value={formData.contact_phone || ""}
                    onChange={(e) => handleChange("contact_phone", e.target.value)}
                    placeholder="+1234567890"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Contact phone number</p>
                </div>
              </div>

              <div>
                <Label>Site Address</Label>
                <Textarea
                  value={formData.contact_address || ""}
                  onChange={(e) => handleChange("contact_address", e.target.value)}
                  placeholder="Your office address"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">Physical address for footer</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Branding</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Logo URL</Label>
                    <Input
                      value={formData.logo_url || ""}
                      onChange={(e) => handleChange("logo_url", e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground mt-1">URL to your logo image</p>
                  </div>
                  <div>
                    <Label>Favicon URL</Label>
                    <Input
                      value={formData.favicon_url || ""}
                      onChange={(e) => handleChange("favicon_url", e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Browser tab icon</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Meta Tags</CardTitle>
              <CardDescription>Optimize your site for search engines and social media</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Meta Title</Label>
                <Input
                  value={formData.meta_title || ""}
                  onChange={(e) => handleChange("meta_title", e.target.value)}
                  placeholder="Exam System - Online Assessment Platform"
                />
                <p className="text-xs text-muted-foreground mt-1">Page title for search engines (50-60 characters recommended)</p>
              </div>

              <div>
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.meta_description || ""}
                  onChange={(e) => handleChange("meta_description", e.target.value)}
                  placeholder="Comprehensive online exam platform for educational institutions"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">Description for search results (150-160 characters recommended)</p>
              </div>

              <div>
                <Label>Keywords</Label>
                <Textarea
                  value={formData.meta_keywords || ""}
                  onChange={(e) => handleChange("meta_keywords", e.target.value)}
                  placeholder="exam, assessment, online test, education, quiz"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated keywords for SEO</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Social Media</h3>
                
                <div>
                  <Label>Open Graph Image</Label>
                  <Input
                    value={formData.og_image || ""}
                    onChange={(e) => handleChange("og_image", e.target.value)}
                    placeholder="https://example.com/og-image.png"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Image shown when sharing on social media (1200x630px recommended)</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Analytics</h3>
                
                <div>
                  <Label>Google Analytics ID</Label>
                  <Input
                    value={formData.google_analytics_id || ""}
                    onChange={(e) => handleChange("google_analytics_id", e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Track website traffic with Google Analytics</p>
                </div>
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
