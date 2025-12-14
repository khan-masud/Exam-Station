"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, Users, Award, ArrowRight, Play, GraduationCap, 
  Zap, Trophy, Brain, Rocket, Menu, X, Target,
  MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin,
  CheckCircle2, Sparkles, Globe, ShieldCheck, TrendingUp
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { LandingSectionRenderer } from "@/components/landing-section-renderer"

export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [landingConfig, setLandingConfig] = useState<any>(null)
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'Exam System',
    siteTagline: 'Your assessment platform',
    siteEmail: 'support@example.com',
    sitePhone: '+1234567890',
    siteAddress: 'Your office address',
    copyrightText: `© ${new Date().getFullYear()} Exam System. All rights reserved.`,
  })

  useEffect(() => {
    const loadData = async () => {
      await fetchPrograms()
      // Fetch settings first (base layer)
      await fetchSiteSettings()
      // Fetch landing config last (overrides)
      await fetchLandingConfig()
    }
    loadData()
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const fetchSiteSettings = async () => {
    try {
      const response = await fetch(`/api/public/settings?t=${Date.now()}`)
      if (response.ok) {
        const data = await response.json()
        setSiteSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      // Failed to load site settings
    }
  }

  const fetchLandingConfig = async () => {
    try {
      const response = await fetch(`/api/public/landing-config?t=${Date.now()}`)
      if (response.ok) {
        const data = await response.json()
        setLandingConfig(data)
        
        // Update site settings from landing config if available
        if (data.config) {
          setSiteSettings(prev => ({
            ...prev,
            siteName: data.config.site_name || prev.siteName,
            siteTagline: data.config.site_tagline || prev.siteTagline,
            siteEmail: data.config.contact_email || prev.siteEmail,
            sitePhone: data.config.contact_phone || prev.sitePhone,
            siteAddress: data.config.contact_address || prev.siteAddress,
            copyrightText: data.config.copyright_text || prev.copyrightText,
          }))
        }
      }
    } catch (error) {
      // Failed to load landing configuration
    }
  }

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('status', 'published') // Only show published programs
      
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/programs?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
      } else {
        // Failed to fetch programs
      }
    } catch (error) {
      // Failed to fetch programs
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrograms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const handleEnrollProgram = (programId: string, enrollmentFee: number) => {
    const token = document.cookie.includes('auth_token')
    
    if (!token) {
      toast.info('Please login to enroll in programs')
      router.push(`/login?redirect=/student/programs`)
      return
    }

    // Redirect to programs page where they can enroll
    router.push(`/student/programs`)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      
      {/* Modern Mesh Gradient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {landingConfig?.config?.background_type === 'solid' ? (
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: landingConfig.config.background_color || '#ffffff' }}
          ></div>
        ) : landingConfig?.config?.background_type === 'image' ? (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${landingConfig.config.background_image_url})` }}
            ></div>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-white dark:bg-gray-950">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-400/20 dark:bg-purple-900/20 blur-[100px] animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-400/20 dark:bg-blue-900/20 blur-[100px] animate-blob animation-delay-2000"></div>
            <div className="absolute top-[40%] left-[40%] w-[600px] h-[600px] rounded-full bg-pink-400/10 dark:bg-pink-900/10 blur-[120px] animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
          </div>
        )}
      </div>

      {/* Modern Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm py-3' 
          : 'bg-transparent py-6'
      }`}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                <GraduationCap className="w-6 h-6 text-white" />
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white">
                {siteSettings.siteName || "ExamPro"}
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-gray-900/50 p-1 rounded-full border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-md mr-4">
                {landingConfig?.menuItems?.filter((item: any) => item.menu_location === 'navbar').map((item: any) => (
                  <a 
                    key={item.id} 
                    href={item.url} 
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-300"
                    target={item.open_in_new_tab ? '_blank' : undefined}
                    rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
                  >
                    {item.label}
                  </a>
                )) || (
                  <>
                    <a href="#programs" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-300">Programs</a>
                    <a href="#features" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-300">Features</a>
                    <a href="#about" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-300">About</a>
                  </>
                )}
              </div>

              {user ? (
                <Button 
                  onClick={() => {
                    const roleRoutes: Record<string, string> = {
                      admin: "/admin/dashboard",
                      proctor: "/proctor/dashboard",
                      student: "/student/dashboard",
                    }
                    router.push(roleRoutes[user.role] || "/student/dashboard")
                  }}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-full px-6 shadow-lg shadow-gray-900/20 dark:shadow-white/10 transition-all hover:scale-105"
                >
                  Dashboard
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push('/login')}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full px-5"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => router.push('/register')}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-lg shadow-blue-600/20 transition-all hover:scale-105 hover:shadow-blue-600/40"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            <button 
              className="md:hidden p-2 text-gray-600 dark:text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-xl animate-in slide-in-from-top-5">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {landingConfig?.menuItems?.filter((item: any) => item.menu_location === 'mobile' || item.menu_location === 'navbar').map((item: any) => (
                <a 
                  key={item.id} 
                  href={item.url} 
                  className="text-lg font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 py-2 border-b border-gray-100 dark:border-gray-800/50" 
                  onClick={() => setMobileMenuOpen(false)}
                  target={item.open_in_new_tab ? '_blank' : undefined}
                  rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
                >
                  {item.label}
                </a>
              )) || (
                <>
                  <a href="#programs" className="text-lg font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 py-2 border-b border-gray-100 dark:border-gray-800/50" onClick={() => setMobileMenuOpen(false)}>Programs</a>
                  <a href="#features" className="text-lg font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 py-2 border-b border-gray-100 dark:border-gray-800/50" onClick={() => setMobileMenuOpen(false)}>Features</a>
                  <a href="#about" className="text-lg font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 py-2 border-b border-gray-100 dark:border-gray-800/50" onClick={() => setMobileMenuOpen(false)}>About</a>
                </>
              )}
              <div className="flex flex-col gap-3 pt-4">
                {user ? (
                  <Button 
                    onClick={() => {
                      const roleRoutes: Record<string, string> = {
                        admin: "/admin/dashboard",
                        proctor: "/proctor/dashboard",
                        student: "/student/dashboard",
                      }
                      router.push(roleRoutes[user.role] || "/student/dashboard")
                      setMobileMenuOpen(false)
                    }} 
                    className="w-full bg-blue-600 text-white rounded-xl py-6"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => router.push('/login')} className="w-full rounded-xl py-6 border-gray-200 dark:border-gray-800">
                      Sign In
                    </Button>
                    <Button onClick={() => router.push('/register')} className="w-full bg-blue-600 text-white rounded-xl py-6 shadow-lg shadow-blue-600/20">
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Global Animated Background */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] dark:opacity-[0.05]"></div>
      </div>

      {/* Ultra Modern Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-4 overflow-hidden border border-white/20 dark:border-gray-800/50 shadow-xl bg-white/10 dark:bg-gray-900/20 backdrop-blur-md mx-4 md:mx-6 rounded-[2.5rem] mb-8 group">
        {/* Animated Isomorphic Background */}
        <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
          <div className="absolute -top-[30%] -left-[10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-[100px] animate-blob"></div>
          <div className="absolute -bottom-[30%] -right-[10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-[100px] animate-blob animation-delay-2000"></div>
        </div>
        
        {/* Glass Shine Overlay */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/20 via-transparent to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent pointer-events-none"></div>

        {/* Decorative Background Elements */}
        <div className="absolute top-20 right-0 -z-10 opacity-30 dark:opacity-20 animate-float">
          <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#3B82F6" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,71.4,32.6C60.6,43.7,50.3,53,39,60.2C27.7,67.4,15.4,72.5,1.5,69.9C-12.4,67.3,-27.9,57,-40.6,47.4C-53.3,37.8,-63.2,28.9,-70.3,17.7C-77.4,6.5,-81.7,-7,-78.3,-19.3C-74.9,-31.6,-63.8,-42.7,-51.8,-50.6C-39.8,-58.5,-26.9,-63.2,-13.8,-65.3C-0.7,-67.4,12.4,-66.9,25.5,-66.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="absolute bottom-20 left-0 -z-10 opacity-30 dark:opacity-20 animate-float animation-delay-2000">
          <svg width="500" height="500" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#8B5CF6" d="M41.3,-70.5C54.4,-63.7,66.4,-55.2,75.8,-44.3C85.2,-33.4,92,-20.1,91.2,-7.1C90.4,5.9,82,18.6,72.3,29.6C62.6,40.6,51.6,49.9,40.2,57.6C28.8,65.3,17,71.4,4.4,73.8C-8.2,76.2,-21.6,74.9,-33.6,69.1C-45.6,63.3,-56.2,53,-64.8,41.1C-73.4,29.2,-80,15.7,-79.3,2.5C-78.6,-10.7,-70.6,-23.6,-61.1,-34.8C-51.6,-46,-40.6,-55.5,-28.8,-63.1C-17,-70.7,-4.4,-76.4,8.8,-76.4C22,-76.4,35.2,-70.7,41.3,-70.5Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-16 lg:gap-24">
            
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left space-y-8 animate-in slide-in-from-bottom-10 duration-700 fade-in lg:pt-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all cursor-default group">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r from-blue-500 to-purple-500"></span>
                </span>
                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  {landingConfig?.config?.site_tagline || "The Future of Assessment is Here"}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1] drop-shadow-sm">
                {landingConfig?.config?.site_name || "Master Your Skills"} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient">
                  {landingConfig?.config?.site_description || "with Expert Exams"}
                </span>
              </h1>
              
              <p className="text-lg md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                Join thousands of students achieving their goals through our comprehensive examination platform. <span className="text-blue-600 dark:text-blue-400 font-bold">AI-powered insights</span>, instant certification, and global recognition.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-6">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 md:px-10 md:py-8 text-lg md:text-xl rounded-2xl shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1 transition-all duration-300 border border-white/20"
                  onClick={() => router.push('/register')}
                >
                  Start Learning Free
                  <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-2 border-white/50 dark:border-gray-700/50 px-8 py-6 md:px-10 md:py-8 text-lg md:text-xl rounded-2xl hover:bg-white/60 dark:hover:bg-gray-800/60 hover:-translate-y-1 transition-all duration-300 text-gray-800 dark:text-white shadow-lg"
                  onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="mr-2 h-5 w-5 md:h-6 md:w-6 fill-current" />
                  Explore Programs
                </Button>
              </div>

              <div className="pt-10 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 dark:border-gray-700/30">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-bold">No credit card required</span>
                </div>
                <div className="flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 dark:border-gray-700/30">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-bold">14-day free trial</span>
                </div>
                <div className="flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 dark:border-gray-700/30">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-bold">Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right Visual - Ultra Modern Glass Card */}
            <div className="flex-1 relative w-full max-w-xl lg:max-w-none animate-in slide-in-from-right-10 duration-1000 fade-in perspective-1000 lg:-mt-12">
              <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square transform transition-transform hover:rotate-y-6 hover:rotate-x-6 duration-500 preserve-3d">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
                
                {/* Main Glass Card */}
                <div className="absolute inset-4 bg-white/10 dark:bg-gray-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 dark:border-gray-700/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent pointer-events-none"></div>
                  
                  {/* Grid Pattern Overlay */}
                  <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>

                  <div className="p-8 h-full flex flex-col justify-between relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-lg text-white transform group-hover:scale-110 transition-transform duration-500">
                        <GraduationCap className="w-10 h-10" />
                      </div>
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-6 py-3 rounded-2xl text-sm font-bold text-green-600 dark:text-green-400 shadow-lg border border-white/50 dark:border-gray-700 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        +24% Growth
                      </div>
                    </div>

                    <div className="space-y-8 my-auto">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm font-bold text-gray-700 dark:text-gray-200">
                          <span>Course Progress</span>
                          <span>85%</span>
                        </div>
                        <div className="h-4 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
                          <div className="h-full w-[85%] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-shimmer relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/40 dark:bg-gray-800/40 rounded-3xl p-6 border border-white/40 dark:border-gray-700/40 backdrop-blur-md hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors">
                          <Trophy className="w-8 h-8 text-yellow-500 mb-3 drop-shadow-md" />
                          <div className="text-3xl font-bold text-gray-900 dark:text-white">12</div>
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Certificates</div>
                        </div>
                        <div className="bg-white/40 dark:bg-gray-800/40 rounded-3xl p-6 border border-white/40 dark:border-gray-700/40 backdrop-blur-md hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors">
                          <Target className="w-8 h-8 text-red-500 mb-3 drop-shadow-md" />
                          <div className="text-3xl font-bold text-gray-900 dark:text-white">98%</div>
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Avg Score</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-8 border-t border-gray-200/30 dark:border-gray-700/30">
                      <div className="flex -space-x-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-md transform hover:scale-110 transition-transform z-0 hover:z-10">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" className="w-full h-full" />
                          </div>
                        ))}
                        <div className="w-12 h-12 rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md z-10">
                          +10k
                        </div>
                      </div>
                      <div className="text-sm">
                        <p className="font-bold text-gray-900 dark:text-white text-lg">Active Students</p>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Joined this month</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements with 3D effect */}
                <div className="absolute -right-12 top-1/4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700 animate-float z-20">
                  <Brain className="w-10 h-10 text-purple-500 drop-shadow-lg" />
                </div>
                <div className="absolute -left-12 bottom-1/3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700 animate-float animation-delay-2000 z-20">
                  <Rocket className="w-10 h-10 text-blue-500 drop-shadow-lg" />
                </div>
                <div className="absolute right-1/4 -bottom-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700 animate-float animation-delay-4000 z-20 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-green-500" />
                  <span className="font-bold text-sm">Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Render dynamic sections from database */}
      <div className="space-y-8">
        {landingConfig?.sections?.map((section: any) => (
          <LandingSectionRenderer 
            key={section.id}
            section={section}
            programs={programs}
            onEnrollProgram={handleEnrollProgram}
          />
        ))}
      </div>

      {/* Modern Footer */}
      <footer id="contact" className="relative bg-gray-950/90 backdrop-blur-xl text-white pt-24 pb-12 overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[100px] animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
        </div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">{landingConfig?.config?.site_name || siteSettings.siteName}</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                {landingConfig?.config?.site_tagline || siteSettings.siteTagline}
              </p>
              <div className="flex gap-4">
                {[
                  { icon: Facebook, url: landingConfig?.config?.facebook_url },
                  { icon: Twitter, url: landingConfig?.config?.twitter_url },
                  { icon: Instagram, url: landingConfig?.config?.instagram_url },
                  { icon: Linkedin, url: landingConfig?.config?.linkedin_url }
                ].map((social, i) => social.url && (
                  <a 
                    key={i} 
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Platform</h3>
              <ul className="space-y-4">
                {landingConfig?.menuItems?.filter((item: any) => item.menu_location === 'footer-links').map((item: any) => (
                  <li key={item.id}>
                    <a 
                      href={item.url} 
                      className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                      target={item.open_in_new_tab ? '_blank' : undefined}
                      rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-blue-400 transition-colors"></span>
                      {item.label}
                    </a>
                  </li>
                )) || (
                  <>
                    <li><a href="#programs" className="text-gray-400 hover:text-blue-400 transition-colors">Browse Programs</a></li>
                    <li><a href="#features" className="text-gray-400 hover:text-blue-400 transition-colors">Features</a></li>
                    <li><Link href="/register" className="text-gray-400 hover:text-blue-400 transition-colors">Sign Up</Link></li>
                    <li><Link href="/login" className="text-gray-400 hover:text-blue-400 transition-colors">Login</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Support</h3>
              <ul className="space-y-4">
                {landingConfig?.menuItems?.filter((item: any) => item.menu_location === 'footer-support').map((item: any) => (
                  <li key={item.id}>
                    <a 
                      href={item.url} 
                      className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                      target={item.open_in_new_tab ? '_blank' : undefined}
                      rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-blue-400 transition-colors"></span>
                      {item.label}
                    </a>
                  </li>
                )) || (
                  <>
                    <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Help Center</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Terms of Service</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">FAQ</a></li>
                  </>
                )}
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Contact Us</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm leading-relaxed">{siteSettings.siteAddress}</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-blue-400" />
                  </div>
                  <a href={`tel:${siteSettings.sitePhone}`} className="text-sm hover:text-white transition-colors">
                    {siteSettings.sitePhone}
                  </a>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <a href={`mailto:${siteSettings.siteEmail}`} className="text-sm hover:text-white transition-colors">
                    {siteSettings.siteEmail}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              {siteSettings.copyrightText}
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
