"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import { CheckCircle2, AlertCircle, Database, User, Loader2 } from "lucide-react"
import { toast as sonnerToast } from "sonner"

type Step = 1 | 2 | 3

interface DbConfigData {
  dbHost: string
  dbUser: string
  dbPassword: string
  dbName: string
}

interface AdminConfigData {
  adminEmail: string
  adminPassword: string
  adminFullName: string
  importDemoData: boolean
}

export default function InstallPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionTested, setConnectionTested] = useState(false)
  
  const [dbConfig, setDbConfig] = useState<DbConfigData>({
    dbHost: "localhost",
    dbUser: "root",
    dbPassword: "",
    dbName: "exam_system",
  })
  
  const [adminConfig, setAdminConfig] = useState<AdminConfigData>({
    adminEmail: "",
    adminPassword: "",
    adminFullName: "",
    importDemoData: true, // Default to true
  })
  
  const [siteConfig, setSiteConfig] = useState({
    siteName: "Exam System",
    siteTagline: "Your assessment platform",
    appUrl: typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000"
  })

  const { toast } = useToast()
  const router = useRouter()

  const handleDbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDbConfig({ ...dbConfig, [e.target.id]: e.target.value })
    setConnectionTested(false) // Reset connection test when fields change
  }

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminConfig({ ...adminConfig, [e.target.id]: e.target.value })
  }
  
  const handleSiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSiteConfig({ ...siteConfig, [e.target.id]: e.target.value })
  }

  const testConnection = async () => {
    setTestingConnection(true)
    try {
      const response = await fetch("/api/install", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbConfig),
      })

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json()
        } catch (parseError) {
          console.error("[Install] JSON parse error:", parseError)
          data = { message: "Invalid response from server", error: "Could not parse JSON response" }
        }
      } else {
        const text = await response.text()
        console.error("[Install] Non-JSON response:", text)
        data = { message: "Invalid response from server", error: `Expected JSON but got ${contentType || 'unknown'} content type` }
      }

      if (response.ok) {
        setConnectionTested(true)
        toast({
          title: "Success!",
          description: data.message || "Database connection successful!",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || data.message || "Connection test failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Install] Test connection error:", error)
      toast({
        title: "Error",
        description: "Could not test database connection",
        variant: "destructive",
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleInstall = async () => {
    // Final validation
    if (!adminConfig.adminEmail || !adminConfig.adminPassword || !adminConfig.adminFullName) {
      console.error("[Install] Validation failed: missing fields")
      toast({
        title: "Validation Error",
        description: "All admin fields are required",
        variant: "destructive",
      })
      return
    }

    if (adminConfig.adminPassword.length < 6) {
      console.error("[Install] Validation failed: password too short")
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    console.log("[Install] Starting installation process...")
    setLoading(true)
    setCurrentStep(3) // Show installing step

    try {
      const payload = {
        ...dbConfig,
        ...adminConfig,
        ...siteConfig,
      }
      console.log("[Install] Sending payload:", {
        ...payload,
        adminPassword: "***",
        dbPassword: "***",
      })

      const response = await fetch("/api/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[Install] Response status:", response.status)

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json()
          console.log("[Install] Response data:", data)
        } catch (parseError) {
          console.error("[Install] JSON parse error:", parseError)
          data = { message: "Server error", error: "Could not parse server response" }
        }
      } else {
        const text = await response.text()
        console.error("[Install] Non-JSON response:", text)
        data = { message: "Server error", error: `Expected JSON but got ${contentType || 'unknown'} content type` }
      }

      if (response.ok) {
        console.log("[Install] Installation successful!")
        // Show success notification with sonner
        sonnerToast.success("Installation Complete!", {
          description: (
            <div className="space-y-1">
              <p>✓ Database configured successfully</p>
              <p>✓ Admin account created</p>
              <p>✓ System settings initialized</p>
              {adminConfig.importDemoData && <p>✓ Demo data imported</p>}
              <p>✓ Face detection models downloading...</p>
              <p className="mt-2 font-semibold text-green-600">
                Redirecting to login page...
              </p>
            </div>
          ),
          duration: 5000,
        })
        
        // Wait a moment then redirect to login
        setTimeout(() => {
          console.log("[Install] Redirecting to login...")
          router.push("/login")
        }, 3000)
      } else {
        console.error("[Install] Installation failed with status:", response.status, "Data:", data)
        setCurrentStep(2) // Go back to admin config on error
        toast({
          title: "Installation Failed",
          description: data.error || data.message || "Installation failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Install] Installation error:", error)
      setCurrentStep(2)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Installation failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Exam System Installation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome! Let's set up your exam management system
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep === step
                      ? "border-primary bg-primary text-white"
                      : currentStep > step
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white text-gray-400 dark:bg-gray-800 dark:border-gray-600"
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : step === 1 ? (
                    <Database className="w-5 h-5" />
                  ) : step === 2 ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Loader2 className="w-5 h-5" />
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      currentStep > step ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-20">
            <span className="text-sm font-medium">Database</span>
            <span className="text-sm font-medium">Admin</span>
            <span className="text-sm font-medium">Install</span>
          </div>
        </div>

        {/* Step 1: Database Configuration */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Configuration
              </CardTitle>
              <CardDescription>
                Enter your MySQL database connection details. The installer will create the database
                if it doesn't exist.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dbHost">Database Host</Label>
                  <Input
                    id="dbHost"
                    value={dbConfig.dbHost}
                    onChange={handleDbChange}
                    placeholder="localhost"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dbName">Database Name</Label>
                  <Input
                    id="dbName"
                    value={dbConfig.dbName}
                    onChange={handleDbChange}
                    placeholder="exam_system"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dbUser">Database User</Label>
                  <Input
                    id="dbUser"
                    value={dbConfig.dbUser}
                    onChange={handleDbChange}
                    placeholder="root"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dbPassword">Database Password</Label>
                  <Input
                    id="dbPassword"
                    type="password"
                    value={dbConfig.dbPassword}
                    onChange={handleDbChange}
                    placeholder="Enter password"
                  />
                </div>
              </div>

              {connectionTested && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Connection successful! You can proceed to the next step.
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={testConnection} disabled={!!testingConnection}>
                {testingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Connection
              </Button>
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!connectionTested || testingConnection}
              >
                Next: Admin Setup
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Admin Configuration */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Administrator Account
              </CardTitle>
              <CardDescription>
                Create the first administrator account for your system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={siteConfig.siteName}
                  onChange={handleSiteChange}
                  placeholder="Exam System"
                  required
                />
                <p className="text-xs text-gray-500">
                  This will be displayed in the browser title, header, and footer.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteTagline">Site Tagline</Label>
                <Input
                  id="siteTagline"
                  value={siteConfig.siteTagline}
                  onChange={handleSiteChange}
                  placeholder="Your assessment platform"
                />
                <p className="text-xs text-gray-500">
                  A short description of your exam platform.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appUrl">Application URL</Label>
                <Input
                  id="appUrl"
                  value={siteConfig.appUrl}
                  onChange={handleSiteChange}
                  placeholder="https://yourdomain.com"
                  required
                />
                <p className="text-xs text-gray-500">
                  The full URL where your application will be accessible (e.g., https://exam.yourdomain.com)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminFullName">Administrator Full Name</Label>
                <Input
                  id="adminFullName"
                  value={adminConfig.adminFullName}
                  onChange={handleAdminChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email Address</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminConfig.adminEmail}
                  onChange={handleAdminChange}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password (minimum 6 characters)</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminConfig.adminPassword}
                  onChange={handleAdminChange}
                  placeholder="Enter secure password"
                  required
                />
                <p className="text-xs text-gray-500">
                  This will be your login password. Make sure it's secure and memorable.
                </p>
              </div>
              
              {/* Demo Data Checkbox */}
              <div className="flex items-center space-x-2 pt-4 pb-2 border-t">
                <input
                  type="checkbox"
                  id="importDemoData"
                  checked={adminConfig.importDemoData}
                  onChange={(e) => setAdminConfig({ ...adminConfig, importDemoData: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="importDemoData" className="cursor-pointer font-normal">
                  Import demo data (4 users, 2 programs, 3 exams, sample results)
                </Label>
              </div>
              <p className="text-xs text-gray-500 pl-6">
                Recommended for testing. You can delete demo data later from the admin panel.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => {
                  console.log("[Install] Complete Installation button clicked!")
                  handleInstall()
                }} 
                disabled={!!loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Installation
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Installing */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Installing Your System</CardTitle>
              <CardDescription className="text-center">
                Please wait while we set up your exam management system...
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-6">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <p className="font-medium">Setting up your database...</p>
                  <p className="text-sm text-gray-500">This may take a few moments</p>
                </div>
                <div className="w-full max-w-md space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Connecting to database</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Creating database tables</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    <span>Creating admin account</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    <span>Finalizing installation</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Check the documentation or contact support</p>
        </div>
      </div>
    </div>
  )
}
