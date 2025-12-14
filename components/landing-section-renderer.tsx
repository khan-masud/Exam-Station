"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Star, Check, ChevronDown, ChevronUp, Plus, Minus,
  BookOpen, Users, Award, Target, Zap, Trophy, Brain, 
  Rocket, Shield, GraduationCap, DollarSign, Mail, ArrowRight,
  CheckCircle, Sparkles, TrendingUp, Clock, FileCheck,
  Quote, Globe, ShieldCheck, Laptop, Smartphone, Loader2
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface SectionProps {
  section: any
  programs?: any[]
  onEnrollProgram?: (programId: string, fee: number) => void
}

const iconMap: Record<string, any> = {
  'book-open': BookOpen,
  'users': Users,
  'award': Award,
  'target': Target,
  'zap': Zap,
  'trophy': Trophy,
  'brain': Brain,
  'rocket': Rocket,
  'shield': Shield,
  'graduation-cap': GraduationCap,
  'dollar-sign': DollarSign,
  'check': Check,
  'star': Star,
  'mail': Mail,
  'arrow-right': ArrowRight,
  'check-circle': CheckCircle,
  'sparkles': Sparkles,
  'trending-up': TrendingUp,
  'clock': Clock,
  'file-check': FileCheck,
  'shield-check': ShieldCheck,
  'globe': Globe,
  'laptop': Laptop,
  'smartphone': Smartphone,
}

const floatingShapes = [
  "M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,71.4,32.6C60.6,43.7,50.3,53,39,60.2C27.7,67.4,15.4,72.5,1.5,69.9C-12.4,67.3,-27.9,57,-40.6,47.4C-53.3,37.8,-63.2,28.9,-70.3,17.7C-77.4,6.5,-81.7,-7,-78.3,-19.3C-74.9,-31.6,-63.8,-42.7,-51.8,-50.6C-39.8,-58.5,-26.9,-63.2,-13.8,-65.3C-0.7,-67.4,12.4,-66.9,25.5,-66.4Z",
  "M41.3,-70.5C54.4,-63.7,66.4,-55.2,75.8,-44.3C85.2,-33.4,92,-20.1,91.2,-7.1C90.4,5.9,82,18.6,72.3,29.6C62.6,40.6,51.6,49.9,40.2,57.6C28.8,65.3,17,71.4,4.4,73.8C-8.2,76.2,-21.6,74.9,-33.6,69.1C-45.6,63.3,-56.2,53,-64.8,41.1C-73.4,29.2,-80,15.7,-79.3,2.5C-78.6,-10.7,-70.6,-23.6,-61.1,-34.8C-51.6,-46,-40.6,-55.5,-28.8,-63.1C-17,-70.7,-4.4,-76.4,8.8,-76.4C22,-76.4,35.2,-70.7,41.3,-70.5Z",
  "M38.1,-63.8C49.6,-54.9,59.4,-44.3,66.6,-32.2C73.8,-20.1,78.4,-6.5,76.3,6.3C74.2,19.1,65.4,31.1,55.3,40.7C45.2,50.3,33.8,57.5,21.3,62.3C8.8,67.1,-4.8,69.5,-17.6,66.3C-30.4,63.1,-42.4,54.3,-52.3,43.4C-62.2,32.5,-70,19.5,-71.3,5.8C-72.6,-7.9,-67.4,-22.3,-58.3,-34.1C-49.2,-45.9,-36.2,-55.1,-23.2,-62.8C-10.2,-70.5,2.8,-76.7,15.5,-76.7C28.2,-76.7,40.9,-70.5,38.1,-63.8Z",
  "M45.7,-76.3C58.9,-69.3,69.1,-56.3,76.3,-42.1C83.5,-27.9,87.7,-12.5,85.6,1.9C83.5,16.3,75.1,29.7,65.3,41.2C55.5,52.7,44.3,62.3,31.6,68.3C18.9,74.3,4.7,76.7,-8.7,75.1C-22.1,73.5,-34.7,67.9,-45.8,59.6C-56.9,51.3,-66.5,40.3,-72.6,27.6C-78.7,14.9,-81.3,0.5,-78.3,-12.8C-75.3,-26.1,-66.7,-38.3,-56.1,-48.3C-45.5,-58.3,-32.9,-66.1,-19.9,-69.5C-6.9,-72.9,6.5,-71.9,19.9,-71.4C33.3,-70.9,46.7,-70.9,45.7,-76.3Z"
]

const floatingColors = ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B"]

export function LandingSectionRenderer({ section, programs, onEnrollProgram }: SectionProps) {
  const router = useRouter()
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  // Generate deterministic random elements based on section ID
  const generateFloatingElements = () => {
    const seed = section.id || section.section_key || 'default'
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    const rand = () => {
      const x = Math.sin(hash++) * 10000
      return x - Math.floor(x)
    }

    const count = Math.floor(rand() * 2) + 1 // 1 or 2 elements
    const elements = []

    for (let i = 0; i < count; i++) {
      const shapeIndex = Math.floor(rand() * floatingShapes.length)
      const colorIndex = Math.floor(rand() * floatingColors.length)
      const size = Math.floor(rand() * 300) + 200 // 200-500px
      const top = rand() * 80 // 0-80%
      const left = rand() * 80 // 0-80%
      const delay = rand() * 5000
      const duration = Math.floor(rand() * 10000) + 10000 // 10-20s

      elements.push({
        shape: floatingShapes[shapeIndex],
        color: floatingColors[colorIndex],
        size,
        top: `${top}%`,
        left: `${left}%`,
        delay,
        duration
      })
    }
    return elements
  }

  const floatingElements = generateFloatingElements()

  const handleNewsletterSubmit = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setSubscribing(true)
      const response = await fetch('/api/public/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      toast.success('Successfully subscribed to newsletter!')
      setEmail('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to subscribe')
    } finally {
      setSubscribing(false)
    }
  }

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || BookOpen
    return Icon
  }

  const getBackgroundStyle = () => {
    const styles: any = {}
    
    if (section.background_type === 'solid' && section.background_color) {
      styles.backgroundColor = section.background_color
    } else if (section.background_type === 'gradient' && section.background_gradient) {
      const grad = section.background_gradient
      const directionMap: Record<string, string> = {
        'r': 'to right',
        'l': 'to left',
        'b': 'to bottom',
        't': 'to top',
        'br': 'to bottom right',
        'bl': 'to bottom left',
        'tr': 'to top right',
        'tl': 'to top left',
      }
      const direction = directionMap[grad.direction as string] || 'to right'
      
      if (grad.via) {
        styles.backgroundImage = `linear-gradient(${direction}, ${grad.from}, ${grad.via}, ${grad.to})`
      } else {
        styles.backgroundImage = `linear-gradient(${direction}, ${grad.from}, ${grad.to})`
      }
    } else if (section.background_type === 'image' && section.background_image_url) {
      styles.backgroundImage = `url(${section.background_image_url})`
      styles.backgroundPosition = section.background_image_position || 'center'
      styles.backgroundSize = section.background_image_size || 'cover'
    }

    if (section.background_overlay && section.background_overlay_opacity) {
      return {
        ...styles,
        position: 'relative' as const,
      }
    }

    return styles
  }

  const getContainerClass = () => {
    const widths: Record<string, string> = {
      'container': 'container mx-auto',
      'full': 'w-full',
      'narrow': 'max-w-4xl mx-auto',
      'wide': 'max-w-7xl mx-auto',
    }
    return widths[section.container_width] || 'container mx-auto'
  }

  const getPaddingClass = () => {
    return `${section.padding_top || 'py-20'} ${section.padding_bottom || 'py-20'} px-4`
  }

  const content = section.content || {}

  // Render based on section type
  const renderContent = () => {
    switch (section.section_type) {
      case 'testimonials':
        return (
          <div className="animate-in slide-in-from-bottom-10 duration-700 fade-in">
            <div className="text-center mb-20 max-w-4xl mx-auto relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
              {content.title && (
                <div className="relative inline-block mb-6">
                  <h2 className="text-3xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 drop-shadow-sm pb-2">
                    {content.title}
                  </h2>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-50"></div>
                </div>
              )}
              {content.description && (
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium mt-6">{content.description}</p>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {content.testimonials?.map((testimonial: any, index: number) => {
                const gradientFrom = testimonial.gradient?.from || '#3b82f6'
                const gradientTo = testimonial.gradient?.to || '#8b5cf6'
                
                return (
                  <div
                    key={index}
                    className="group relative bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 dark:border-gray-700/50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent pointer-events-none"></div>
                    
                    <div className="absolute top-8 right-8 text-gray-200 dark:text-gray-800 transform group-hover:scale-110 transition-transform duration-500">
                      <Quote className="w-16 h-16 fill-current opacity-50" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        {testimonial.image ? (
                          <div className="relative">
                            <div 
                              className="absolute inset-0 rounded-full blur-lg opacity-50 animate-pulse"
                              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                            />
                            <img 
                              src={testimonial.image} 
                              alt={testimonial.name}
                              className="relative w-16 h-16 rounded-full object-cover ring-4 ring-white/50 dark:ring-gray-800/50 shadow-lg"
                            />
                          </div>
                        ) : (
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white/50 dark:ring-gray-800/50"
                            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                          >
                            {testimonial.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-xl text-gray-900 dark:text-white">{testimonial.name}</p>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {testimonial.role}
                            {testimonial.company && (
                              <span className="text-blue-600 dark:text-blue-400"> @ {testimonial.company}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {testimonial.rating && (
                        <div className="flex gap-1 mb-6 bg-white/30 dark:bg-gray-800/30 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < testimonial.rating 
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-sm' 
                                  : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      
                      <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-lg font-medium italic">
                        "{testimonial.text}"
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'cta':
        return (
          <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-purple-700/90 backdrop-blur-xl px-6 py-24 md:px-16 md:py-32 text-center text-white shadow-2xl animate-in zoom-in-95 duration-700 border border-white/20">
            {/* Background Patterns */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 mix-blend-overlay"></div>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] bg-blue-400 rounded-full mix-blend-screen filter blur-[6rem] opacity-30 animate-blob"></div>
              <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-purple-400 rounded-full mix-blend-screen filter blur-[6rem] opacity-30 animate-blob animation-delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-pink-400 rounded-full mix-blend-screen filter blur-[8rem] opacity-20 animate-pulse"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
              {content.badge && (
                <Badge className="mb-10 bg-white/10 backdrop-blur-xl border-white/30 text-white hover:bg-white/20 px-6 py-2 text-base font-semibold rounded-full shadow-lg">
                  <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
                  {content.badge}
                </Badge>
              )}
              
              {content.title && (
                <h2 className="text-4xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight drop-shadow-lg">
                  {content.title}
                </h2>
              )}
              
              {content.description && (
                <p className="text-lg md:text-3xl mb-12 text-blue-50 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-md">
                  {content.description}
                </p>
              )}
              
              {content.buttons && (
                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                  {content.buttons.map((button: any, index: number) => {
                    const Icon = button.icon ? getIcon(button.icon) : null
                    return (
                      <Button
                        key={index}
                        size="lg"
                        className={`${
                          button.variant === 'solid' 
                            ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-xl hover:shadow-2xl hover:-translate-y-1' 
                            : 'bg-white/10 backdrop-blur-md border-2 border-white/50 text-white hover:bg-white/20 hover:-translate-y-1 shadow-lg'
                        } text-xl px-10 py-8 rounded-2xl transition-all duration-300 font-bold`}
                        onClick={() => router.push(button.link)}
                      >
                        {Icon && <Icon className="mr-3 h-6 w-6" />}
                        {button.text}
                      </Button>
                    )
                  })}
                </div>
              )}
              
              {content.features && (
                <div className="flex flex-wrap gap-x-10 gap-y-6 justify-center text-base font-semibold text-white/90">
                  {content.features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 bg-white/10 px-5 py-2 rounded-full backdrop-blur-sm border border-white/10">
                      <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      </div>
                      <span className="drop-shadow-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'custom':
        // Handle FAQ, Pricing, Newsletter, etc.
        if (content.faqs) {
          return (
            <div className="animate-in slide-in-from-bottom-10 duration-700 fade-in">
              <div className="text-center mb-20 max-w-4xl mx-auto relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
                {content.title && (
                  <div className="relative inline-block mb-6">
                    <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 drop-shadow-sm pb-2">
                      {content.title}
                    </h2>
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-50"></div>
                  </div>
                )}
                {content.description && (
                  <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium mt-6">{content.description}</p>
                )}
              </div>
              
              <div className="max-w-3xl mx-auto space-y-4">
                {content.faqs.map((faq: any, index: number) => (
                  <div 
                    key={index} 
                    className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-lg"
                  >
                    <button
                      className="w-full p-6 text-left flex justify-between items-center gap-4"
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    >
                      <span className="font-semibold text-lg text-gray-900 dark:text-white">{faq.question}</span>
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedFaq === index ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {expandedFaq === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </button>
                    <div 
                      className={`px-6 text-gray-600 dark:text-gray-400 leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${
                        expandedFaq === index ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        } else if (content.plans) {
          return (
            <div className="animate-in slide-in-from-bottom-10 duration-700 fade-in">
              <div className="text-center mb-20 max-w-4xl mx-auto relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
                {content.title && (
                  <div className="relative inline-block mb-6">
                    <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 drop-shadow-sm pb-2">
                      {content.title}
                    </h2>
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-50"></div>
                  </div>
                )}
                {content.description && (
                  <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium mt-6">{content.description}</p>
                )}
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-start">
                {content.plans.map((plan: any, index: number) => (
                  <div
                    key={index}
                    className={`relative bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                      plan.highlighted 
                        ? 'border-2 border-blue-600 shadow-2xl shadow-blue-600/10 z-10 scale-105' 
                        : 'border border-white/50 dark:border-gray-700/50 shadow-xl'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent pointer-events-none"></div>
                    
                    {plan.highlighted && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white px-4 py-1.5 text-sm font-medium rounded-full shadow-lg">
                          {plan.badge || 'Most Popular'}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{plan.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-gray-500 dark:text-gray-400 font-medium">/{plan.period}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      {plan.features?.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className={`w-full py-6 rounded-xl text-base font-semibold transition-all duration-300 ${
                        plan.highlighted 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                      onClick={() => router.push(plan.buttonLink)}
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )
        } else if (content.placeholder) {
          // Newsletter
          return (
            <div className="max-w-4xl mx-auto bg-gray-900/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-16 text-center text-white shadow-2xl relative overflow-hidden border border-white/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-16 -mb-16"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-md">
                  <Mail className="w-8 h-8 text-blue-400" />
                </div>
                
                {content.title && (
                  <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">{content.title}</h2>
                )}
                {content.description && (
                  <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">{content.description}</p>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
                  <Input
                    type="email"
                    placeholder={content.placeholder}
                    className="flex-1 bg-white/10 border-white/10 text-white placeholder:text-gray-400 h-14 px-6 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNewsletterSubmit()}
                    disabled={subscribing}
                  />
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                    onClick={handleNewsletterSubmit}
                    disabled={subscribing}
                  >
                    {subscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      content.buttonText || 'Subscribe'
                    )}
                  </Button>
                </div>
                
                {content.features && (
                  <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-400">
                    {content.features.map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        } else if (content.logos) {
          // Trust badges
          return (
            <div className="text-center py-8">
              {content.title && <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-8">{content.title}</p>}
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                {content.logos.map((logo: any, idx: number) => (
                  <div key={idx} className="text-xl font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {logo.name}
                  </div>
                ))}
              </div>
            </div>
          )
        } else if (content.stats) {
          // About section with stats
          return (
            <div className="animate-in slide-in-from-bottom-10 duration-700 fade-in">
              <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
                <div className="space-y-8">
                  {content.subtitle && (
                    <div className="text-blue-600 dark:text-blue-400 font-bold tracking-wide uppercase text-sm">
                      {content.subtitle}
                    </div>
                  )}
                  {content.title && (
                    <div className="relative inline-block mb-6">
                      <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 drop-shadow-sm pb-2">
                        {content.title}
                      </h2>
                      <div className="absolute -bottom-4 left-0 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      <div className="absolute -bottom-4 left-0 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-50"></div>
                    </div>
                  )}
                  {content.description && (
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                      {content.description}
                    </p>
                  )}
                  
                  {content.features && (
                    <div className="space-y-6 pt-4">
                      {content.features.map((feature: any, idx: number) => {
                        const Icon = feature.icon ? getIcon(feature.icon) : BookOpen
                        return (
                          <div key={idx} className="flex gap-6 group">
                            <div className="shrink-0 w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                              <Icon className="w-7 h-7" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {content.stats && content.stats.map((stat: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${idx % 2 === 1 ? 'translate-y-12' : ''}`}
                    >
                      <div className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2 drop-shadow-sm">
                        {stat.value}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 font-bold text-lg">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        }
        return null

      case 'features':
        return (
          <div className="animate-in slide-in-from-bottom-10 duration-700 fade-in">
            <div className="text-center mb-20 max-w-4xl mx-auto relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
              {content.title && (
                <div className="relative inline-block mb-6">
                  <h2 className="text-3xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 drop-shadow-sm pb-2">
                    {content.title}
                  </h2>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-50"></div>
                </div>
              )}
              {content.description && (
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium mt-6">{content.description}</p>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {content.features?.map((feature: any, index: number) => {
                const Icon = feature.icon ? getIcon(feature.icon) : BookOpen
                const gradientFrom = feature.gradient?.from || '#3b82f6'
                const gradientTo = feature.gradient?.to || '#8b5cf6'
                
                return (
                  <div
                    key={index}
                    className="group relative bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-[2rem] p-8 border border-white/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent pointer-events-none"></div>
                    
                    <div 
                      className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br opacity-20 rounded-bl-full transition-transform group-hover:scale-150 duration-700 blur-2xl"
                      style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                    />
                    
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500 relative z-10"
                      style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                    >
                      <Icon className="h-8 w-8 text-white drop-shadow-md" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors relative z-10">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed relative z-10 font-medium">
                      {feature.description}
                    </p>
                    
                    <div className="mt-8 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 relative z-10">
                      Learn more <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'programs':
        return (
          <div className="animate-in slide-in-from-bottom-10 duration-700 fade-in">
            <div className="text-center mb-20 max-w-4xl mx-auto relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
              {content.title && (
                <div className="relative inline-block mb-6">
                  <h2 className="text-3xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 drop-shadow-sm pb-2">
                    {content.title}
                  </h2>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-50"></div>
                </div>
              )}
              {content.description && (
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium mt-6">{content.description}</p>
              )}
            </div>

            {programs && programs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {programs.map((program: any) => (
                  <div
                    key={program.id}
                    className="group flex flex-col bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full"
                  >
                    <div className="relative h-64 overflow-hidden">
                      {program.cover_image ? (
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: `url(${program.cover_image})` }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-violet-600 transition-transform duration-700 group-hover:scale-110" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                      
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className={`${program.enrollment_fee === 0 ? 'bg-green-500/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md text-gray-900'} border-0 shadow-lg px-3 py-1 text-sm font-bold`}>
                          {program.enrollment_fee === 0 ? 'Free' : `$${program.enrollment_fee}`}
                        </Badge>
                      </div>
                      
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                         <h3 className="text-2xl font-bold text-white mb-1 line-clamp-2 drop-shadow-md">
                          {program.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-8 flex flex-col flex-1 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent pointer-events-none"></div>
                      
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-6 text-sm leading-relaxed flex-1 font-medium relative z-10">
                        {program.description || 'No description available'}
                      </p>

                      <div className="flex items-center gap-6 mb-8 text-sm font-semibold text-gray-500 dark:text-gray-400 border-t border-gray-200/50 dark:border-gray-700/50 pt-6 relative z-10">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <span>{program.exam_count || 0} exams</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-500" />
                          <span>{program.enrolled_count || 0} enrolled</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-gray-900 hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-400 dark:hover:to-blue-500 rounded-xl py-6 transition-all duration-300 shadow-lg hover:shadow-xl font-bold relative z-10"
                        onClick={() => onEnrollProgram && onEnrollProgram(program.id, program.enrollment_fee)}
                      >
                        View Program
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/20 dark:bg-gray-900/20 backdrop-blur-md rounded-[2rem] border border-dashed border-gray-300 dark:border-gray-700 p-20 text-center">
                <div className="w-20 h-20 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                  <BookOpen className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">No programs available</h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Check back later for new programs</p>
              </div>
            )}
          </div>
        )

      case 'newsletter':
        return (
          <div className="animate-in slide-in-from-bottom-10 duration-700 fade-in">
            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl px-6 py-20 md:px-16 md:py-32 text-center text-white shadow-2xl border border-white/20">
              {/* Background Patterns */}
              <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 mix-blend-overlay"></div>
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] bg-blue-400 rounded-full mix-blend-screen filter blur-[6rem] opacity-30 animate-blob"></div>
                <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-purple-400 rounded-full mix-blend-screen filter blur-[6rem] opacity-30 animate-blob animation-delay-2000"></div>
              </div>

              <div className="relative z-10 max-w-2xl mx-auto">
                {content.title && (
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                    {content.title}
                  </h2>
                )}
                
                {content.subtitle && (
                  <p className="text-xl md:text-2xl text-white/80 mb-12 font-medium">
                    {content.subtitle}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Input
                    type="email"
                    placeholder={content.input_placeholder || "Enter your email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 h-12 rounded-full px-6"
                    disabled={subscribing}
                  />
                  <Button
                    onClick={async () => {
                      if (!email) {
                        toast.error("Please enter an email")
                        return
                      }
                      setSubscribing(true)
                      try {
                        const response = await fetch('/api/public/newsletter', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email })
                        })
                        const data = await response.json()
                        if (response.ok) {
                          toast.success(data.message || "Successfully subscribed!")
                          setEmail('')
                        } else {
                          toast.error(data.error || "Failed to subscribe")
                        }
                      } catch (error) {
                        toast.error("Failed to subscribe")
                      } finally {
                        setSubscribing(false)
                      }
                    }}
                    disabled={subscribing}
                    className="bg-white text-purple-600 hover:bg-white/90 font-bold h-12 px-8 rounded-full whitespace-nowrap"
                  >
                    {subscribing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      content.button_text || "Subscribe Now"
                    )}
                  </Button>
                </div>

                {content.description && (
                  <p className="text-sm text-white/70 italic">
                    {content.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )

      default:
        // Handle custom HTML sections
        if (section.section_type === 'custom-html' && content.html_code) {
          return (
            <div 
              className="animate-in fade-in duration-700"
              dangerouslySetInnerHTML={{ __html: content.html_code }}
            />
          )
        }
        return null
    }
  }

  const renderedContent = renderContent()

  if (!renderedContent) {
    return null
  }

  return (
    <section
      id={section.section_key}
      className={`${getPaddingClass()} ${section.min_height || ''} relative overflow-hidden border border-white/20 dark:border-gray-800/50 shadow-xl bg-white/10 dark:bg-gray-900/20 backdrop-blur-md mx-4 md:mx-6 rounded-[2.5rem] group`}
    >
      {/* Configured Background (Low Opacity) */}
      <div className="absolute inset-0 -z-30 opacity-30 transition-opacity duration-500 group-hover:opacity-40" style={getBackgroundStyle()} />

      {/* Animated Isomorphic Background */}
      <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-[100px] animate-blob"></div>
        <div className="absolute -bottom-[30%] -right-[10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-500/5 to-blue-500/5 blur-[80px] animate-pulse"></div>
      </div>

      {/* Decorative Background Elements */}
      {floatingElements.map((el, i) => (
        <div 
          key={i}
          className="absolute -z-10 opacity-30 dark:opacity-20 animate-float"
          style={{
            top: el.top,
            left: el.left,
            animationDelay: `${el.delay}ms`,
            animationDuration: `${el.duration}ms`
          }}
        >
          <svg width={el.size} height={el.size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill={el.color} d={el.shape} transform="translate(100 100)" />
          </svg>
        </div>
      ))}

      {/* Glass Shine Overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/20 via-transparent to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent pointer-events-none"></div>

      {section.background_overlay && section.background_overlay_opacity && (
        <div 
          className="absolute inset-0 pointer-events-none -z-10" 
          style={{
            backgroundColor: section.background_overlay,
            opacity: section.background_overlay_opacity,
          }}
        />
      )}
      <div className={`${getContainerClass()} relative z-10`}>
        {renderedContent}
      </div>
    </section>
  )
}
