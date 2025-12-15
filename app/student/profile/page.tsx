"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Phone, Calendar, Award, Settings, Lock, Loader2, RefreshCw, Shield, Check, Camera, X } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, checkAuth } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    emailVerified: false,
    phoneVerified: false,
    createdAt: '',
    profilePicture: ''
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [verificationCode, setVerificationCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [verificationType, setVerificationType] = useState<'email' | 'phone' | null>(null)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      setProfileData({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || '',
        emailVerified: data.emailVerified,
        phoneVerified: data.phoneVerified,
        createdAt: data.createdAt,
        profilePicture: data.profilePicture || ''
      })
    } catch (error) {

      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleUpdateProfile = async () => {
    setUpdating(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully!')
      fetchProfile()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast.success('Password changed successfully!')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSendVerificationCode = async (type: 'email' | 'phone') => {
    setSendingCode(true)
    setVerificationType(type)
    try {
      const value = type === 'email' ? profileData.email : profileData.phone

      if (!value) {
        toast.error(`Please add your ${type} first`)
        return
      }

      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, value })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      setCodeSent(true)
      toast.success(data.message || 'Verification code sent!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send code')
      setVerificationType(null)
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || !verificationType) {
      toast.error('Please enter verification code')
      return
    }

    setVerifying(true)
    try {
      const response = await fetch('/api/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          type: verificationType, 
          code: verificationCode 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code')
      }

      toast.success(data.message || 'Verified successfully!')
      setVerificationCode('')
      setCodeSent(false)
      setVerificationType(null)
      fetchProfile()
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code')
    } finally {
      setVerifying(false)
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploadingPicture(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/picture', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload picture')
      }

      toast.success('Profile picture updated!')
      await fetchProfile()
      // Refresh auth context to update sidebar with new profile picture
      await checkAuth()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload picture')
    } finally {
      setUploadingPicture(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePicture = async () => {
    setUploadingPicture(true)
    try {
      const response = await fetch('/api/profile/picture', {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove picture')
      }

      toast.success('Profile picture removed!')
      await fetchProfile()
      // Refresh auth context to update sidebar
      await checkAuth()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove picture')
    } finally {
      setUploadingPicture(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 pt-20 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <Button onClick={fetchProfile} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Summary */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {profileData.profilePicture ? (
                    <AvatarImage src={profileData.profilePicture} alt={profileData.fullName} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl font-bold">
                      {profileData.fullName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={handleFileSelect}
                    disabled={uploadingPicture}
                  >
                    {uploadingPicture ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  {profileData.profilePicture && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 rounded-full p-0"
                      onClick={handleRemovePicture}
                      disabled={uploadingPicture}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">{profileData.fullName}</h2>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
                <Badge className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600">Student</Badge>
                <div className="mt-2 flex gap-2 justify-center">
                  {profileData.emailVerified && (
                    <Badge variant="outline" className="text-xs">
                      ✓ Email Verified
                    </Badge>
                  )}
                  {profileData.phoneVerified && (
                    <Badge variant="outline" className="text-xs">
                      ✓ Phone Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Joined {new Date(profileData.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Card className="md:col-span-2">
          <Tabs defaultValue="general" className="p-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">
                <User className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="security">
                <Lock className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="verification">
                <Shield className="w-4 h-4 mr-2" />
                Verification
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={updating}>
                {updating ? 'Updating...' : 'Save Changes'}
              </Button>
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? 'Updating...' : 'Change Password'}
              </Button>
            </TabsContent>

            <TabsContent value="verification" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Verification</CardTitle>
                  <CardDescription>
                    {profileData.emailVerified 
                      ? 'Your email is verified ✓' 
                      : 'Verify your email address to enable important notifications'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.email}</span>
                    {profileData.emailVerified && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        <Check className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  {!profileData.emailVerified && (
                    <div className="space-y-2">
                      {!codeSent || verificationType !== 'email' ? (
                        <Button 
                          onClick={() => handleSendVerificationCode('email')} 
                          disabled={sendingCode}
                          size="sm"
                          variant="outline"
                        >
                          {sendingCode ? 'Sending...' : 'Send Verification Code'}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="emailCode">Enter 6-digit code sent to your email</Label>
                          <div className="flex gap-2">
                            <Input
                              id="emailCode"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              placeholder="123456"
                              maxLength={6}
                            />
                            <Button onClick={handleVerifyCode} disabled={verifying}>
                              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Code expires in 10 minutes</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Phone Verification</CardTitle>
                  <CardDescription>
                    {profileData.phoneVerified 
                      ? 'Your phone number is verified ✓' 
                      : 'Verify your phone number for SMS notifications'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profileData.phone ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{profileData.phone}</span>
                        {profileData.phoneVerified && (
                          <Badge variant="outline" className="text-xs ml-auto">
                            <Check className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      
                      {!profileData.phoneVerified && (
                        <div className="space-y-2">
                          {!codeSent || verificationType !== 'phone' ? (
                            <Button 
                              onClick={() => handleSendVerificationCode('phone')} 
                              disabled={sendingCode}
                              size="sm"
                              variant="outline"
                            >
                              {sendingCode ? 'Sending...' : 'Send Verification Code'}
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Label htmlFor="phoneCode">Enter 6-digit code sent to your phone</Label>
                              <div className="flex gap-2">
                                <Input
                                  id="phoneCode"
                                  value={verificationCode}
                                  onChange={(e) => setVerificationCode(e.target.value)}
                                  placeholder="123456"
                                  maxLength={6}
                                />
                                <Button onClick={handleVerifyCode} disabled={verifying}>
                                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">Code expires in 10 minutes</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Please add your phone number in the General tab first</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Notifications</CardTitle>
                  <CardDescription>Receive updates about your exams and results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Exam reminders</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Result notifications</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekly summary</span>
                    <input type="checkbox" className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
