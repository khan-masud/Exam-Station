"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, Shield, Users, CreditCard, AlertTriangle, Settings, Globe, Lock, Database, Download, Upload, Trash2, HardDrive } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { CouponManagement } from "@/components/admin/coupon-management"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

// Backup & Restore Component
function BackupRestoreSection() {
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [backupType, setBackupType] = useState<'full' | 'questions'>('full')
  const [includeUploads, setIncludeUploads] = useState(true)
  const [clearExisting, setClearExisting] = useState(false)
  const [restoreUploads, setRestoreUploads] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [restoreConfirm, setRestoreConfirm] = useState<File | null>(null)
  const fileInputRef = useState<HTMLInputElement | null>(null)

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/backup', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
      }
    } catch (error) {
      toast.error('Failed to load backups')
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ includeUploads, backupType }),
      })

      if (!response.ok) {
        throw new Error('Failed to create backup')
      }

      const data = await response.json()
      toast.success(`Backup created successfully: ${data.filename}`)
      loadBackups()
    } catch (error) {
      toast.error('Failed to create backup')
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = (filename: string) => {
    window.location.href = `/api/admin/backup/download/${filename}`
    toast.success('Downloading backup...')
  }

  const deleteBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/admin/backup/delete/${filename}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete backup')
      }

      toast.success('Backup deleted successfully')
      loadBackups()
    } catch (error) {
      toast.error('Failed to delete backup')
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.name.endsWith('.zip')) {
        setRestoreConfirm(file)
      } else {
        toast.error('Please select a valid backup file (.zip)')
      }
    }
  }

  const restoreBackup = async () => {
    if (!restoreConfirm) return

    setRestoring(true)
    try {
      const formData = new FormData()
      formData.append('backup', restoreConfirm)
      formData.append('clearExisting', clearExisting.toString())
      formData.append('restoreUploads', restoreUploads.toString())

      const response = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to restore backup')
      }

      const data = await response.json()
      toast.success(`Backup restored successfully! ${data.tablesRestored} tables restored.`)
      
      // Reload the page after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore backup')
    } finally {
      setRestoring(false)
      setRestoreConfirm(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Create New Backup
          </CardTitle>
          <CardDescription>
            Create a complete backup of your system including database, configurations, and optionally uploaded files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Backup Type</Label>
              <p className="text-sm text-muted-foreground">
                Choose what to include in the backup
              </p>
            </div>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value as 'full' | 'questions')}
              className="border rounded-md px-3 py-2 bg-background"
            >
              <option value="full">Full Backup (All Data)</option>
              <option value="questions">Questions Only</option>
            </select>
          </div>

          {backupType === 'full' && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Include Uploaded Files</Label>
              <p className="text-sm text-muted-foreground">
                Include all user-uploaded files (questions, answers, etc.) in the backup
              </p>
            </div>
            <Switch
              checked={includeUploads}
              onCheckedChange={setIncludeUploads}
            />
          </div>
          )}

          <Button 
            onClick={createBackup} 
            disabled={creating}
            className="w-full"
            size="lg"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {backupType === 'full' ? 'Create Full Backup' : 'Create Questions Backup'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Restore Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Restore from Backup
          </CardTitle>
          <CardDescription>
            Restore your system from a previous backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Clear Existing Data</Label>
                <p className="text-sm text-muted-foreground">
                  Remove all existing data before restoring (recommended for clean restore)
                </p>
              </div>
              <Switch
                checked={clearExisting}
                onCheckedChange={setClearExisting}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Restore Uploaded Files</Label>
                <p className="text-sm text-muted-foreground">
                  Restore user-uploaded files from backup (if available)
                </p>
              </div>
              <Switch
                checked={restoreUploads}
                onCheckedChange={setRestoreUploads}
              />
            </div>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              className="hidden"
              id="backup-file"
            />
            <label htmlFor="backup-file" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium">Click to select backup file</p>
              <p className="text-xs text-muted-foreground mt-1">Only .zip files are supported</p>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Existing Backups Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Available Backups
          </CardTitle>
          <CardDescription>
            Manage your system backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Loading backups...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No backups available</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{backup.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {backup.backupType && (
                            <Badge variant={backup.backupType === 'questions' ? 'secondary' : 'default'} className="text-xs">
                              {backup.backupType === 'questions' ? 'Questions Only' : 'Full Backup'}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(backup.size)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(backup.created)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadBackup(backup.name)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(backup.name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup? This action cannot be undone.
              <br />
              <span className="font-medium text-foreground mt-2 block">{deleteConfirm}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteBackup(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreConfirm} onOpenChange={() => setRestoreConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Backup</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>
                  Are you sure you want to restore from this backup?
                </p>
                {clearExisting && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium text-destructive">
                      ⚠️ Warning: This will delete all existing data!
                    </p>
                  </div>
                )}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-foreground">
                    File: {restoreConfirm?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Size: {restoreConfirm ? formatFileSize(restoreConfirm.size) : '0'}
                  </p>
                </div>
                <p className="text-sm">
                  The system will be restored and the page will reload automatically.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={restoreBackup}
              disabled={restoring}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {restoring ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Restoring...
                </>
              ) : (
                'Restore Backup'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const [settings, setSettings] = useState({
    // Authentication & User Management
    userManagement: {
      allowSelfRegistration: true,
      requireEmailVerification: true,
      requireAdminApproval: false,
      minPasswordLength: 8,
      requireStrongPassword: true,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
    },
    // Payments
    payments: {
      allowManualPayments: true,
      autoApprovePayments: false,
      paymentCurrency: "USD",
      manualPaymentEnabled: true,
      allowCash: true,
      allowBankTransfer: true,
      allowMobileMoney: true,
      allowCheque: false,
      allowOther: true,
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankRoutingNumber: "",
      bankSwiftCode: "",
      bankBranch: "",
      mobileMoneyProvider: "",
      mobileMoneyNumber: "",
      mobileMoneyAccountName: "",
      cashPaymentInstructions: "Please visit our office during business hours to make cash payments.",
      requirePaymentProof: true,
    },
    // Anti-Cheat & Proctoring
    antiCheat: {
      proctoringEnabled: true,
      faceDetectionEnabled: true,
      tabSwitchDetection: true,
      copyPasteDisabled: true,
      autoSubmitOnViolation: false,
      maxViolations: 5,
    },
    // User Permissions
    userPermissions: {
      studentsCanDownloadCertificates: true,
      maxExamAttemptsPerStudent: 3,
      allowExamRetake: true,
      retakeCooldownDays: 7,
    },
    // Exam Settings
    examSettings: {
      shuffleQuestions: true,
      showResultsImmediately: false,
      allowReviewAfterSubmission: true,
    },
    // Security
    security: {
      enableRateLimiting: true,
      maxRequestsPerMinute: 60,
    },
    // General
    general: {
      organizationName: "Exam System",
      sessionTimeout: 30,
      siteName: "",
      siteTagline: "",
      siteEmail: "",
      sitePhone: "",
      siteAddress: "",
      logoUrl: "",
      faviconUrl: "",
      copyrightText: "",
    },
    // SEO
    seo: {
      title: "",
      description: "",
      keywords: "",
      ogImage: "",
      googleAnalyticsId: "",
    },
    // OAuth
    oauth: {
      googleClientId: "",
      googleClientSecret: "",
      googleEnabled: false,
      facebookAppId: "",
      facebookAppSecret: "",
      facebookEnabled: false,
    },
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to load settings')
      }

      const data = await response.json()
      if (data.settings) {
        const s = data.settings
        setSettings(prev => ({
          userManagement: {
            ...prev.userManagement,
            ...s.userManagement,
          },
          payments: {
            ...prev.payments,
            ...s.payments,
          },
          antiCheat: {
            ...prev.antiCheat,
            ...s.antiCheat,
          },
          userPermissions: {
            ...prev.userPermissions,
            ...s.userPermissions,
          },
          examSettings: {
            ...prev.examSettings,
            ...s.examSettings,
          },
          security: {
            ...prev.security,
            ...s.security,
          },
          general: {
            ...prev.general,
            ...s.general,
          },
          seo: {
            ...prev.seo,
            ...s.seo,
          },
          oauth: {
            ...prev.oauth,
            ...s.oauth,
          },
        }))
      }
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }))
  }

  const handleSaveSettings = async () => {
    setSaveLoading(true)
    try {
      const flatSettings: Record<string, any> = {}
      
      Object.entries(settings).forEach(([category, categorySettings]) => {
        Object.entries(categorySettings).forEach(([key, value]) => {
          flatSettings[`${category}.${key}`] = value
        })
      })
      

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings: flatSettings }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      // After successful save, reload settings from the server to ensure persistence
      try {
        const data = await response.json()
        // if server returned the saved settings, we can optionally sync UI
        if (data && data.saved) {
          // Merge saved values into current settings state by re-loading from server
          await loadSettings()
        } else {
          // Fallback: reload settings anyway
          await loadSettings()
        }
      } catch (err) {
        // If parsing fails, still reload
        await loadSettings()
      }

      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground mt-1">Configure essential system settings</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saveLoading}>
          <Save className="w-4 h-4 mr-2" />
          {saveLoading ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs defaultValue="authentication" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="authentication">
            <Users className="w-4 h-4 mr-2" />
            Auth
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="proctoring">
            <Shield className="w-4 h-4 mr-2" />
            Proctoring
          </TabsTrigger>
          <TabsTrigger value="exams">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Exams
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Globe className="w-4 h-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="oauth">
            <Lock className="w-4 h-4 mr-2" />
            OAuth
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="w-4 h-4 mr-2" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* Authentication Tab */}
        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Registration</CardTitle>
              <CardDescription>Control how users can register and access the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Self Registration</Label>
                  <p className="text-sm text-muted-foreground">Users can register without admin intervention</p>
                </div>
                <Switch
                  checked={settings.userManagement.allowSelfRegistration}
                  onCheckedChange={(checked) => updateSetting('userManagement', 'allowSelfRegistration', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">Users must verify email before logging in</p>
                </div>
                <Switch
                  checked={settings.userManagement.requireEmailVerification}
                  onCheckedChange={(checked) => updateSetting('userManagement', 'requireEmailVerification', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Admin Approval</Label>
                  <p className="text-sm text-muted-foreground">New accounts need admin approval to activate</p>
                </div>
                <Switch
                  checked={settings.userManagement.requireAdminApproval}
                  onCheckedChange={(checked) => updateSetting('userManagement', 'requireAdminApproval', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password Policy</CardTitle>
              <CardDescription>Configure password requirements for all users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
                <Input
                  id="minPasswordLength"
                  type="number"
                  min="6"
                  max="32"
                  value={settings.userManagement.minPasswordLength ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    updateSetting('userManagement', 'minPasswordLength', val === '' ? '' : parseInt(val))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      updateSetting('userManagement', 'minPasswordLength', 8)
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">Minimum characters required (6-32)</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Strong Password</Label>
                  <p className="text-sm text-muted-foreground">Must include uppercase, lowercase, number, and special character</p>
                </div>
                <Switch
                  checked={settings.userManagement.requireStrongPassword}
                  onCheckedChange={(checked) => updateSetting('userManagement', 'requireStrongPassword', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login Security</CardTitle>
              <CardDescription>Protect accounts from brute force attacks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Maximum Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  min="3"
                  max="10"
                  value={settings.userManagement.maxLoginAttempts ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    updateSetting('userManagement', 'maxLoginAttempts', val === '' ? '' : parseInt(val))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      updateSetting('userManagement', 'maxLoginAttempts', 5)
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">Failed attempts before account lockout</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                <Input
                  id="lockoutDuration"
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.userManagement.lockoutDuration ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    updateSetting('userManagement', 'lockoutDuration', val === '' ? '' : parseInt(val))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      updateSetting('userManagement', 'lockoutDuration', 30)
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">How long account remains locked</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Options</CardTitle>
              <CardDescription>Configure how students can pay for exams and programs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Manual Payments</Label>
                  <p className="text-sm text-muted-foreground">Allow students to submit manual payment (bank transfer, cash, etc.)</p>
                </div>
                <Switch
                  checked={settings.payments.manualPaymentEnabled}
                  onCheckedChange={(checked) => updateSetting('payments', 'manualPaymentEnabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Approve Manual Payments</Label>
                  <p className="text-sm text-muted-foreground">Automatically approve and enroll students (not recommended)</p>
                </div>
                <Switch
                  checked={settings.payments.autoApprovePayments}
                  onCheckedChange={(checked) => updateSetting('payments', 'autoApprovePayments', checked)}
                  disabled={!settings.payments.manualPaymentEnabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Payment Proof</Label>
                  <p className="text-sm text-muted-foreground">Students must upload payment receipt/proof</p>
                </div>
                <Switch
                  checked={settings.payments.requirePaymentProof}
                  onCheckedChange={(checked) => updateSetting('payments', 'requirePaymentProof', checked)}
                  disabled={!settings.payments.manualPaymentEnabled}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="paymentCurrency">Payment Currency</Label>
                <Input
                  id="paymentCurrency"
                  type="text"
                  placeholder="USD"
                  value={settings.payments.paymentCurrency}
                  onChange={(e) => updateSetting('payments', 'paymentCurrency', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Default currency code (USD, BDT, EUR, etc.)</p>
              </div>
            </CardContent>
          </Card>

          {/* Manual Payment Methods */}
          {settings.payments.manualPaymentEnabled && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Manual Payment Methods</CardTitle>
                  <CardDescription>Select which payment methods are available to students</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowCash"
                        checked={settings.payments.allowCash}
                        onCheckedChange={(checked) => updateSetting('payments', 'allowCash', checked)}
                      />
                      <Label htmlFor="allowCash" className="cursor-pointer">Cash Payment</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowBankTransfer"
                        checked={settings.payments.allowBankTransfer}
                        onCheckedChange={(checked) => updateSetting('payments', 'allowBankTransfer', checked)}
                      />
                      <Label htmlFor="allowBankTransfer" className="cursor-pointer">Bank Transfer</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowMobileMoney"
                        checked={settings.payments.allowMobileMoney}
                        onCheckedChange={(checked) => updateSetting('payments', 'allowMobileMoney', checked)}
                      />
                      <Label htmlFor="allowMobileMoney" className="cursor-pointer">Mobile Money</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowCheque"
                        checked={settings.payments.allowCheque}
                        onCheckedChange={(checked) => updateSetting('payments', 'allowCheque', checked)}
                      />
                      <Label htmlFor="allowCheque" className="cursor-pointer">Cheque</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowOther"
                        checked={settings.payments.allowOther}
                        onCheckedChange={(checked) => updateSetting('payments', 'allowOther', checked)}
                      />
                      <Label htmlFor="allowOther" className="cursor-pointer">Other Methods</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Transfer Details */}
              {settings.payments.allowBankTransfer && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bank Transfer Details</CardTitle>
                    <CardDescription>This information will be shown to students when making bank transfers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          placeholder="e.g., ABC Bank"
                          value={settings.payments.bankName}
                          onChange={(e) => updateSetting('payments', 'bankName', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankBranch">Branch Name</Label>
                        <Input
                          id="bankBranch"
                          placeholder="e.g., Main Branch"
                          value={settings.payments.bankBranch}
                          onChange={(e) => updateSetting('payments', 'bankBranch', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankAccountName">Account Name</Label>
                        <Input
                          id="bankAccountName"
                          placeholder="e.g., Exam System Ltd."
                          value={settings.payments.bankAccountName}
                          onChange={(e) => updateSetting('payments', 'bankAccountName', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">Account Number</Label>
                        <Input
                          id="bankAccountNumber"
                          placeholder="e.g., 1234567890"
                          value={settings.payments.bankAccountNumber}
                          onChange={(e) => updateSetting('payments', 'bankAccountNumber', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankRoutingNumber">Routing Number</Label>
                        <Input
                          id="bankRoutingNumber"
                          placeholder="e.g., 026009593"
                          value={settings.payments.bankRoutingNumber}
                          onChange={(e) => updateSetting('payments', 'bankRoutingNumber', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankSwiftCode">SWIFT/BIC Code</Label>
                        <Input
                          id="bankSwiftCode"
                          placeholder="e.g., ABCDUS33XXX"
                          value={settings.payments.bankSwiftCode}
                          onChange={(e) => updateSetting('payments', 'bankSwiftCode', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mobile Money Details */}
              {settings.payments.allowMobileMoney && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mobile Money Details</CardTitle>
                    <CardDescription>Configure mobile money payment information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobileMoneyProvider">Provider Name</Label>
                        <Input
                          id="mobileMoneyProvider"
                          placeholder="e.g., M-Pesa, bKash, EasyPaisa"
                          value={settings.payments.mobileMoneyProvider}
                          onChange={(e) => updateSetting('payments', 'mobileMoneyProvider', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mobileMoneyNumber">Mobile Number</Label>
                        <Input
                          id="mobileMoneyNumber"
                          placeholder="e.g., +1234567890"
                          value={settings.payments.mobileMoneyNumber}
                          onChange={(e) => updateSetting('payments', 'mobileMoneyNumber', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="mobileMoneyAccountName">Account Name</Label>
                        <Input
                          id="mobileMoneyAccountName"
                          placeholder="e.g., Exam System"
                          value={settings.payments.mobileMoneyAccountName}
                          onChange={(e) => updateSetting('payments', 'mobileMoneyAccountName', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cash Payment Instructions */}
              {settings.payments.allowCash && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cash Payment Instructions</CardTitle>
                    <CardDescription>Provide instructions for students paying with cash</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="cashPaymentInstructions">Instructions</Label>
                      <Input
                        id="cashPaymentInstructions"
                        placeholder="e.g., Visit our office at..."
                        value={settings.payments.cashPaymentInstructions}
                        onChange={(e) => updateSetting('payments', 'cashPaymentInstructions', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        This message will be displayed to students selecting cash payment
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Coupon Management */}
          <CouponManagement />
        </TabsContent>

        {/* Proctoring Tab */}
        <TabsContent value="proctoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anti-Cheat & Proctoring</CardTitle>
              <CardDescription>Configure exam monitoring and violation detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Proctoring</Label>
                  <p className="text-sm text-muted-foreground">Activate webcam monitoring during exams</p>
                </div>
                <Switch
                  checked={settings.antiCheat.proctoringEnabled}
                  onCheckedChange={(checked) => updateSetting('antiCheat', 'proctoringEnabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Face Detection</Label>
                  <p className="text-sm text-muted-foreground">Detect and track faces during exam</p>
                </div>
                <Switch
                  checked={settings.antiCheat.faceDetectionEnabled}
                  onCheckedChange={(checked) => updateSetting('antiCheat', 'faceDetectionEnabled', checked)}
                  disabled={!settings.antiCheat.proctoringEnabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tab Switch Detection</Label>
                  <p className="text-sm text-muted-foreground">Alert when student switches browser tabs</p>
                </div>
                <Switch
                  checked={settings.antiCheat.tabSwitchDetection}
                  onCheckedChange={(checked) => updateSetting('antiCheat', 'tabSwitchDetection', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Disable Copy/Paste</Label>
                  <p className="text-sm text-muted-foreground">Prevent copying and pasting during exam</p>
                </div>
                <Switch
                  checked={settings.antiCheat.copyPasteDisabled}
                  onCheckedChange={(checked) => updateSetting('antiCheat', 'copyPasteDisabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Submit on Violation</Label>
                  <p className="text-sm text-muted-foreground">Automatically submit exam when max violations reached</p>
                </div>
                <Switch
                  checked={settings.antiCheat.autoSubmitOnViolation}
                  onCheckedChange={(checked) => updateSetting('antiCheat', 'autoSubmitOnViolation', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxViolations">Maximum Violations</Label>
                <Input
                  id="maxViolations"
                  type="number"
                  min="1"
                  max="20"
                  value={settings.antiCheat.maxViolations ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    updateSetting('antiCheat', 'maxViolations', val === '' ? '' : parseInt(val))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      updateSetting('antiCheat', 'maxViolations', 5)
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">Violations allowed before action is taken</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Behavior</CardTitle>
              <CardDescription>Configure how exams work for students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Shuffle Questions</Label>
                  <p className="text-sm text-muted-foreground">Randomize question order for each student</p>
                </div>
                <Switch
                  checked={settings.examSettings.shuffleQuestions}
                  onCheckedChange={(checked) => updateSetting('examSettings', 'shuffleQuestions', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Results Immediately</Label>
                  <p className="text-sm text-muted-foreground">Display results right after submission</p>
                </div>
                <Switch
                  checked={settings.examSettings.showResultsImmediately}
                  onCheckedChange={(checked) => updateSetting('examSettings', 'showResultsImmediately', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Review After Submission</Label>
                  <p className="text-sm text-muted-foreground">Students can review answers after completing exam</p>
                </div>
                <Switch
                  checked={settings.examSettings.allowReviewAfterSubmission}
                  onCheckedChange={(checked) => updateSetting('examSettings', 'allowReviewAfterSubmission', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exam Attempts</CardTitle>
              <CardDescription>Control how many times students can attempt exams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maxExamAttempts">Maximum Attempts Per Student</Label>
                <Input
                  id="maxExamAttempts"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.userPermissions.maxExamAttemptsPerStudent ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    updateSetting('userPermissions', 'maxExamAttemptsPerStudent', val === '' ? '' : parseInt(val))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      updateSetting('userPermissions', 'maxExamAttemptsPerStudent', 3)
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">How many times a student can take the same exam</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Exam Retake</Label>
                  <p className="text-sm text-muted-foreground">Students can retake failed exams</p>
                </div>
                <Switch
                  checked={settings.userPermissions.allowExamRetake}
                  onCheckedChange={(checked) => updateSetting('userPermissions', 'allowExamRetake', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="retakeCooldown">Retake Cooldown (days)</Label>
                <Input
                  id="retakeCooldown"
                  type="number"
                  min="0"
                  max="90"
                  value={settings.userPermissions.retakeCooldownDays ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    updateSetting('userPermissions', 'retakeCooldownDays', val === '' ? '' : parseInt(val))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      updateSetting('userPermissions', 'retakeCooldownDays', 7)
                    }
                  }}
                  disabled={!settings.userPermissions.allowExamRetake}
                />
                <p className="text-sm text-muted-foreground">Days student must wait before retaking</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Students Can Download Certificates</Label>
                  <p className="text-sm text-muted-foreground">Allow students to download completion certificates</p>
                </div>
                <Switch
                  checked={settings.userPermissions.studentsCanDownloadCertificates}
                  onCheckedChange={(checked) => updateSetting('userPermissions', 'studentsCanDownloadCertificates', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security & Performance</CardTitle>
              <CardDescription>System-wide security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">Protect API from abuse</p>
                </div>
                <Switch
                  checked={settings.security.enableRateLimiting}
                  onCheckedChange={(checked) => updateSetting('security', 'enableRateLimiting', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxRequests">Max Requests Per Minute</Label>
                <Input
                  id="maxRequests"
                  type="number"
                  min="10"
                  max="300"
                  value={settings.security.maxRequestsPerMinute ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    updateSetting('security', 'maxRequestsPerMinute', val === '' ? '' : parseInt(val))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      updateSetting('security', 'maxRequestsPerMinute', 60)
                    }
                  }}
                  disabled={!settings.security.enableRateLimiting}
                />
                <p className="text-sm text-muted-foreground">API requests allowed per user per minute</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.general.sessionTimeout ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    updateSetting('general', 'sessionTimeout', val === '' ? '' : parseInt(val))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      updateSetting('general', 'sessionTimeout', 30)
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">Inactivity period before auto-logout</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  type="text"
                  placeholder="Exam System"
                  value={settings.general.organizationName}
                  onChange={(e) => updateSetting('general', 'organizationName', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Displayed in emails and certificates</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic site information and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    placeholder="Exam System"
                    value={settings.general?.siteName || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, siteName: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="siteTagline">Site Tagline</Label>
                  <Input
                    id="siteTagline"
                    placeholder="Your assessment platform"
                    value={settings.general?.siteTagline || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, siteTagline: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="siteEmail">Site Email</Label>
                  <Input
                    id="siteEmail"
                    type="email"
                    placeholder="support@example.com"
                    value={settings.general?.siteEmail || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, siteEmail: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="sitePhone">Site Phone</Label>
                  <Input
                    id="sitePhone"
                    placeholder="+1234567890"
                    value={settings.general?.sitePhone || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, sitePhone: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="siteAddress">Site Address</Label>
                <Textarea
                  id="siteAddress"
                  placeholder="Your office address"
                  rows={3}
                  value={settings.general?.siteAddress || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, siteAddress: e.target.value },
                    })
                  }
                />
              </div>

              <Separator />
              <h3 className="text-lg font-semibold">Branding</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={settings.general?.logoUrl || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, logoUrl: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="faviconUrl">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    placeholder="https://example.com/favicon.ico"
                    value={settings.general?.faviconUrl || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, faviconUrl: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="copyrightText">Copyright Text</Label>
                <Input
                  id="copyrightText"
                  placeholder={`© ${new Date().getFullYear()} Exam System. All rights reserved.`}
                  value={settings.general?.copyrightText || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, copyrightText: e.target.value },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">Displayed in the footer of public pages</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Configure search engine optimization and meta tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="seoTitle">Page Title</Label>
                <Input
                  id="seoTitle"
                  placeholder="Exam System - Online Assessment Platform"
                  value={settings.seo?.title || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, title: e.target.value },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">Recommended: 50-60 characters</p>
              </div>

              <div>
                <Label htmlFor="seoDescription">Meta Description</Label>
                <Textarea
                  id="seoDescription"
                  placeholder="Describe your exam platform"
                  rows={3}
                  value={settings.seo?.description || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, description: e.target.value },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">Recommended: 150-160 characters</p>
              </div>

              <div>
                <Label htmlFor="seoKeywords">Keywords</Label>
                <Textarea
                  id="seoKeywords"
                  placeholder="exam, assessment, online, test, education"
                  rows={3}
                  value={settings.seo?.keywords || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, keywords: e.target.value },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated keywords for SEO</p>
              </div>

              <div>
                <Label htmlFor="seoOgImage">Open Graph Image URL</Label>
                <Input
                  id="seoOgImage"
                  placeholder="https://example.com/og-image.png"
                  value={settings.seo?.ogImage || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, ogImage: e.target.value },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used when sharing on social media (1200x630px recommended)
                </p>
              </div>

              <div>
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  placeholder="G-XXXXXXXXXX"
                  value={settings.seo?.googleAnalyticsId || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, googleAnalyticsId: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OAuth Settings Tab */}
        <TabsContent value="oauth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OAuth Authentication</CardTitle>
              <CardDescription>Configure social media authentication for login and signup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Redirect URI Information */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">OAuth Redirect URI</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Use this redirect URI when configuring OAuth apps:
                </p>
                <code className="block bg-background p-2 rounded text-sm break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/oauth/callback
                </code>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Google OAuth</h3>
                  <Switch
                    checked={settings.oauth?.googleEnabled || false}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        oauth: { ...settings.oauth, googleEnabled: checked },
                      })
                    }
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="googleClientId">Client ID</Label>
                    <Input
                      id="googleClientId"
                      type="text"
                      placeholder="Your Google Client ID"
                      value={settings.oauth?.googleClientId || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          oauth: { ...settings.oauth, googleClientId: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="googleClientSecret">Client Secret</Label>
                    <Input
                      id="googleClientSecret"
                      type="password"
                      placeholder="Your Google Client Secret"
                      value={settings.oauth?.googleClientSecret || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          oauth: { ...settings.oauth, googleClientSecret: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="text-sm space-y-2">
                    <p className="font-medium">Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                      <li>Create a new project or select existing</li>
                      <li>Enable Google+ API</li>
                      <li>Create OAuth 2.0 credentials (Web application)</li>
                      <li>Add the redirect URI above to Authorized redirect URIs</li>
                      <li>Copy Client ID and Client Secret and paste above</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Facebook OAuth</h3>
                  <Switch
                    checked={settings.oauth?.facebookEnabled || false}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        oauth: { ...settings.oauth, facebookEnabled: checked },
                      })
                    }
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="facebookAppId">App ID</Label>
                    <Input
                      id="facebookAppId"
                      type="text"
                      placeholder="Your Facebook App ID"
                      value={settings.oauth?.facebookAppId || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          oauth: { ...settings.oauth, facebookAppId: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebookAppSecret">App Secret</Label>
                    <Input
                      id="facebookAppSecret"
                      type="password"
                      placeholder="Your Facebook App Secret"
                      value={settings.oauth?.facebookAppSecret || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          oauth: { ...settings.oauth, facebookAppSecret: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="text-sm space-y-2">
                    <p className="font-medium">Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Facebook for Developers</a></li>
                      <li>Create an app (Consumer type)</li>
                      <li>Add Facebook Login product</li>
                      <li>In Facebook Login Settings, add the redirect URI above</li>
                      <li>Copy App ID and App Secret and paste above</li>
                      <li>Enable "Use Strict Mode for Redirect URIs"</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore Tab */}
        <TabsContent value="backup" className="space-y-4">
          <BackupRestoreSection />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSaveSettings} disabled={saveLoading} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saveLoading ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  )
}
