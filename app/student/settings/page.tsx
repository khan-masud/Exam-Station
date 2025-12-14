"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Eye, Globe, Moon, Smartphone, Shield } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      examReminders: true,
      results: true,
      announcements: false,
      emailDigest: true,
      smsAlerts: false
    },
    privacy: {
      showProfile: true,
      showStats: false,
      allowMessages: true
    },
    preferences: {
      language: 'en',
      theme: 'system',
      timezone: 'UTC'
    }
  })

  const handleSave = () => {
    toast.success('Settings saved successfully!')
  }

  return (
    <div className="p-6 pt-20 lg:pt-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your exam experience</p>
      </div>

      <div className="grid gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="exam-reminders" className="flex flex-col gap-1">
                <span>Exam Reminders</span>
                <span className="font-normal text-sm text-muted-foreground">Get notified before exams start</span>
              </Label>
              <Switch
                id="exam-reminders"
                checked={settings.notifications.examReminders}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, examReminders: checked }
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="results" className="flex flex-col gap-1">
                <span>Result Notifications</span>
                <span className="font-normal text-sm text-muted-foreground">Receive your exam results</span>
              </Label>
              <Switch
                id="results"
                checked={settings.notifications.results}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, results: checked }
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="announcements" className="flex flex-col gap-1">
                <span>Announcements</span>
                <span className="font-normal text-sm text-muted-foreground">Important platform updates</span>
              </Label>
              <Switch
                id="announcements"
                checked={settings.notifications.announcements}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, announcements: checked }
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms" className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  SMS Alerts
                </span>
                <span className="font-normal text-sm text-muted-foreground">Get text messages for urgent updates</span>
              </Label>
              <Switch
                id="sms"
                checked={settings.notifications.smsAlerts}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, smsAlerts: checked }
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy
            </CardTitle>
            <CardDescription>Control your profile visibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-profile" className="flex flex-col gap-1">
                <span>Public Profile</span>
                <span className="font-normal text-sm text-muted-foreground">Allow others to view your profile</span>
              </Label>
              <Switch
                id="show-profile"
                checked={settings.privacy.showProfile}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, showProfile: checked }
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-stats" className="flex flex-col gap-1">
                <span>Show Statistics</span>
                <span className="font-normal text-sm text-muted-foreground">Display your exam stats publicly</span>
              </Label>
              <Switch
                id="show-stats"
                checked={settings.privacy.showStats}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, showStats: checked }
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Preferences
            </CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={settings.preferences.language} onValueChange={(value) => setSettings({
                ...settings,
                preferences: { ...settings.preferences, language: value }
              })}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme" className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Theme
              </Label>
              <Select value={settings.preferences.theme} onValueChange={(value) => setSettings({
                ...settings,
                preferences: { ...settings.preferences, theme: value }
              })}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} size="lg" className="w-full md:w-auto">
          Save All Settings
        </Button>
      </div>
    </div>
  )
}
