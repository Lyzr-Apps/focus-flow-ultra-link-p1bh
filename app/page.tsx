'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  FaFire,
  FaShieldAlt,
  FaBolt,
  FaBed,
  FaCoffee,
  FaMusic,
  FaBriefcase,
  FaSmile,
  FaHistory,
  FaTrophy,
  FaHeart,
  FaPills,
  FaWineGlass,
  FaCheck,
  FaTimes,
  FaLightbulb,
  FaStar,
  FaMedal,
  FaRocket,
  FaMoon,
  FaLock,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa'
import {
  Home,
  MessageCircle,
  Clock,
  Loader2,
  Send,
  X,
  Sparkles,
  Shield,
  Zap,
  Smile,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Target,
} from 'lucide-react'

// ============================================================
// CONSTANTS
// ============================================================

const CHECKIN_AGENT_ID = '699ea162006f1f9bd420ce52'
const COACH_AGENT_ID = '699ea17f55140cb9a8fc8c83'
const ORACLE_AGENT_ID = '699ea16355140cb9a8fc8c57'

const STORAGE_KEY = 'flowstate_app_state'

// ============================================================
// TYPES
// ============================================================

interface PatternInsight {
  pattern: string
  severity: string
  recommendation: string
}

interface CheckInEntry {
  id: string
  date: string
  sleepQuality: number
  energyLevel: number
  caffeineIntake: number
  alcoholIntake: number
  medsTaken: boolean
  intimacy: boolean
  creativeTime: number
  practicalTime: number
  moodNotes: string
  streakCount?: number
  hpValue?: number
  hpMax?: number
  shieldCount?: number
  patternInsights?: PatternInsight[]
  motivationalMessage?: string
  statsSummary?: string
  moodAssessment?: string
}

interface Suggestion {
  title: string
  description: string
  time_estimate: string
  reasoning: string
  category: string
  priority: string
  trending_relevance: string
  done?: boolean
  skipped?: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isIntervention?: boolean
  interventionType?: string
  interventionMessage?: string
  topicsExplored?: string[]
  actionItems?: string[]
  conversationMood?: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
}

interface AppStats {
  sleepQuality: number | null
  energyLevel: number | null
  caffeineIntake: number | null
  creativeTime: number | null
  practicalTime: number | null
  mood: string | null
}

interface AppState {
  streak: number
  hp: number
  hpMax: number
  shields: number
  lastCheckIn: string | null
  checkInHistory: CheckInEntry[]
  patternHistory: PatternInsight[]
  suggestions: Suggestion[]
  chatMessages: ChatMessage[]
  achievements: Achievement[]
  stats: AppStats
  coachingNote: string | null
  energyAssessment: string | null
  motivationalMessage: string | null
}

// ============================================================
// DEFAULTS
// ============================================================

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_checkin', title: 'First Check-In', description: 'Complete your first daily check-in', icon: 'star', unlocked: false },
  { id: 'streak_3', title: '3-Day Streak', description: 'Maintain a 3-day check-in streak', icon: 'fire', unlocked: false },
  { id: 'streak_7', title: '7-Day Streak', description: 'Maintain a 7-day check-in streak', icon: 'fire', unlocked: false },
  { id: 'streak_30', title: '30-Day Streak', description: 'Maintain a 30-day streak', icon: 'rocket', unlocked: false },
  { id: 'creative_hour', title: 'Creative Hour', description: 'Log 60+ minutes of creative time', icon: 'palette', unlocked: false },
  { id: 'night_owl', title: 'Night Owl Recovery', description: 'Log sleep quality 8+ after a low day', icon: 'moon', unlocked: false },
  { id: 'hp_50', title: 'Half HP', description: 'Reach 50 HP', icon: 'shield', unlocked: false },
  { id: 'hp_100', title: 'Full HP', description: 'Reach 100 HP', icon: 'trophy', unlocked: false },
  { id: 'suggestion_done', title: 'Action Taker', description: 'Complete a coaching suggestion', icon: 'check', unlocked: false },
  { id: 'chat_5', title: 'Deep Diver', description: 'Have 5+ messages with the Oracle', icon: 'message', unlocked: false },
]

const DEFAULT_STATE: AppState = {
  streak: 0,
  hp: 0,
  hpMax: 100,
  shields: 0,
  lastCheckIn: null,
  checkInHistory: [],
  patternHistory: [],
  suggestions: [],
  chatMessages: [],
  achievements: DEFAULT_ACHIEVEMENTS,
  stats: { sleepQuality: null, energyLevel: null, caffeineIntake: null, creativeTime: null, practicalTime: null, mood: null },
  coachingNote: null,
  energyAssessment: null,
  motivationalMessage: null,
}

// ============================================================
// SAMPLE DATA
// ============================================================

const SAMPLE_STATE: AppState = {
  streak: 5,
  hp: 72,
  hpMax: 100,
  shields: 2,
  lastCheckIn: new Date().toISOString(),
  checkInHistory: [
    {
      id: 's1', date: new Date(Date.now() - 86400000).toISOString(), sleepQuality: 7, energyLevel: 6,
      caffeineIntake: 2, alcoholIntake: 0, medsTaken: true, intimacy: false, creativeTime: 45,
      practicalTime: 90, moodNotes: 'Good day, felt productive', streakCount: 4, hpValue: 65,
      hpMax: 100, shieldCount: 1, motivationalMessage: '4-day streak! You are building real momentum.',
      statsSummary: 'Sleep: 7/10, Energy: 6/10, Creative: 45min', moodAssessment: 'Productive and focused',
      patternInsights: [{ pattern: 'Energy peaks around 10am after coffee', severity: 'thriving', recommendation: 'Schedule creative work for late morning' }],
    },
    {
      id: 's2', date: new Date(Date.now() - 172800000).toISOString(), sleepQuality: 8, energyLevel: 7,
      caffeineIntake: 1, alcoholIntake: 1, medsTaken: true, intimacy: true, creativeTime: 60,
      practicalTime: 30, moodNotes: 'Relaxed and creative', streakCount: 3, hpValue: 58,
      hpMax: 100, shieldCount: 1, motivationalMessage: 'Keep building that streak!',
      statsSummary: 'Sleep: 8/10, Energy: 7/10, Creative: 60min', moodAssessment: 'Relaxed and happy',
      patternInsights: [{ pattern: 'Better sleep on low-caffeine days', severity: 'thriving', recommendation: 'Keep caffeine to 1-2 cups' }],
    },
  ],
  patternHistory: [
    { pattern: 'Energy drops after 2+ coffees past 3pm', severity: 'watch', recommendation: 'Try switching to decaf after 2pm' },
    { pattern: 'Creative output peaks on days with 7+ sleep', severity: 'thriving', recommendation: 'Protect your sleep for creative days' },
    { pattern: 'Mood dips after 3 days without creative time', severity: 'intervene', recommendation: 'Schedule at least 15 min of creative time daily' },
  ],
  suggestions: [
    { title: 'Quick bass practice session', description: 'You have moderate energy - perfect for a 15-minute focused practice.', time_estimate: '15 min', reasoning: 'Short creative wins boost mood on moderate days.', category: 'creative_win', priority: 'high', trending_relevance: 'Music content trending +30%', done: false, skipped: false },
    { title: 'Review weekly budget', description: 'Low-energy practical task to clear mental load.', time_estimate: '10 min', reasoning: 'Practical tasks reduce anxiety.', category: 'practical_reminder', priority: 'medium', trending_relevance: 'N/A', done: false, skipped: false },
    { title: 'Take a 20-minute nap', description: 'Your energy has been below 6 for 2 days. A power nap can reset.', time_estimate: '20 min', reasoning: 'Rest permission based on energy patterns.', category: 'rest_permission', priority: 'high', trending_relevance: 'N/A', done: false, skipped: false },
  ],
  chatMessages: [
    { id: 'c1', role: 'user', content: 'Should I start a Patreon for my music?', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'c2', role: 'assistant', content: 'Starting a Patreon is a solid move for musicians with an engaged audience. Start with 2 tiers - a $5 "behind the scenes" tier and a $15 "exclusive content" tier. Don\'t overcomplicate it.', timestamp: new Date(Date.now() - 3500000).toISOString(), isIntervention: false, interventionType: 'none', topicsExplored: ['monetization', 'Patreon', 'music business'], actionItems: ['Set up Patreon account with 2 tiers this week', 'Post announcement to existing audience'], conversationMood: 'curious and motivated' },
  ],
  achievements: DEFAULT_ACHIEVEMENTS.map(a => {
    if (a.id === 'first_checkin') return { ...a, unlocked: true, unlockedAt: new Date(Date.now() - 432000000).toISOString() }
    if (a.id === 'streak_3') return { ...a, unlocked: true, unlockedAt: new Date(Date.now() - 172800000).toISOString() }
    if (a.id === 'creative_hour') return { ...a, unlocked: true, unlockedAt: new Date(Date.now() - 172800000).toISOString() }
    if (a.id === 'hp_50') return { ...a, unlocked: true, unlockedAt: new Date(Date.now() - 86400000).toISOString() }
    return a
  }),
  stats: { sleepQuality: 7, energyLevel: 6, caffeineIntake: 2, creativeTime: 45, practicalTime: 90, mood: 'Productive and focused' },
  coachingNote: 'You have been productive this week. One quick creative win today keeps the momentum going.',
  energyAssessment: 'Moderate energy - good for quick creative tasks, avoid deep work',
  motivationalMessage: '5-day streak! You are building real momentum. Keep showing up.',
}

// ============================================================
// HELPERS
// ============================================================

const parseAgentResult = (result: any) => {
  if (!result) return null
  const raw = result?.response?.result
  if (!raw) return null
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return null }
  }
  return raw
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return 'N/A'
  }
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}

function getSeverityColor(severity: string | undefined): string {
  const s = (severity ?? '').toLowerCase()
  if (s === 'thriving' || s === 'low' || s === 'green') return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (s === 'watch' || s === 'medium' || s === 'amber') return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (s === 'intervene' || s === 'high' || s === 'red') return 'bg-red-500/20 text-red-400 border-red-500/30'
  return 'bg-muted text-muted-foreground border-border'
}

function getCategoryStyle(category: string | undefined): { bg: string; text: string; label: string } {
  const c = (category ?? '').toLowerCase()
  if (c.includes('creative')) return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Creative Win' }
  if (c.includes('practical')) return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Practical' }
  if (c.includes('rest')) return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Rest' }
  return { bg: 'bg-muted', text: 'text-muted-foreground', label: category ?? 'General' }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

// ============================================================
// ERROR BOUNDARY
// ============================================================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// SUB COMPONENTS
// ============================================================

function StatCard({ icon, value, label, unit }: { icon: React.ReactNode; value: string | number | null; label: string; unit?: string }) {
  const displayVal = value !== null && value !== undefined ? `${value}${unit ?? ''}` : '--'
  return (
    <Card className="bg-card border-border shadow-lg rounded-2xl">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight text-foreground truncate">{displayVal}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const iconMap: Record<string, React.ReactNode> = {
    star: <FaStar className="w-5 h-5" />,
    fire: <FaFire className="w-5 h-5" />,
    rocket: <FaRocket className="w-5 h-5" />,
    palette: <FaMusic className="w-5 h-5" />,
    moon: <FaMoon className="w-5 h-5" />,
    shield: <FaShieldAlt className="w-5 h-5" />,
    trophy: <FaTrophy className="w-5 h-5" />,
    check: <FaCheck className="w-5 h-5" />,
    message: <MessageCircle className="w-5 h-5" />,
    medal: <FaMedal className="w-5 h-5" />,
  }
  return (
    <div className={cn('flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300', achievement.unlocked ? 'bg-accent/10 border-accent/40' : 'bg-muted/50 border-border opacity-50')}>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', achievement.unlocked ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground')}>
        {achievement.unlocked ? (iconMap[achievement.icon] ?? <FaStar className="w-5 h-5" />) : <FaLock className="w-5 h-5" />}
      </div>
      <p className="text-xs font-semibold text-center leading-tight">{achievement.title}</p>
      <p className="text-[10px] text-muted-foreground text-center leading-tight">{achievement.description}</p>
      {achievement.unlocked && achievement.unlockedAt && (
        <p className="text-[10px] text-accent">{formatDate(achievement.unlockedAt)}</p>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// ============================================================
// CHECK-IN MODAL
// ============================================================

function CheckInModal({
  isOpen,
  onClose,
  onComplete,
  sessionId,
}: {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: any, agentResult: any) => void
  sessionId: string
}) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [agentResult, setAgentResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    sleepQuality: 5,
    energyLevel: 5,
    caffeineIntake: 0,
    alcoholIntake: 0,
    medsTaken: false,
    intimacy: false,
    creativeTime: 0,
    practicalTime: 0,
    moodNotes: '',
  })

  const steps = [
    { title: 'Sleep Quality', subtitle: 'How well did you sleep last night?' },
    { title: 'Energy Level', subtitle: 'How is your energy right now?' },
    { title: 'Caffeine', subtitle: 'How many cups of coffee/tea today?' },
    { title: 'Alcohol', subtitle: 'How many drinks today?' },
    { title: 'Medications', subtitle: 'Did you take your meds today?' },
    { title: 'Intimacy', subtitle: 'Any intimacy today?' },
    { title: 'Creative Time', subtitle: 'Minutes spent on creative activities' },
    { title: 'Practical Time', subtitle: 'Minutes spent on practical tasks' },
    { title: 'Mood Notes', subtitle: 'How are you feeling? Any notes?' },
  ]

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    const message = `Daily check-in: Sleep quality: ${formData.sleepQuality}/10, Energy: ${formData.energyLevel}/10, Caffeine: ${formData.caffeineIntake} cups, Alcohol: ${formData.alcoholIntake} drinks, Meds: ${formData.medsTaken ? 'yes' : 'no'}, Intimacy: ${formData.intimacy ? 'yes' : 'no'}, Creative time: ${formData.creativeTime} min, Practical time: ${formData.practicalTime} min, Mood notes: ${formData.moodNotes || 'No specific notes'}`

    try {
      const result = await callAIAgent(message, CHECKIN_AGENT_ID, { session_id: sessionId })
      if (result?.success) {
        const parsed = parseAgentResult(result)
        setAgentResult(parsed)
        setShowResults(true)
        onComplete(formData, parsed)
      } else {
        setError(result?.error ?? 'Failed to submit check-in. Please try again.')
      }
    } catch (e) {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  const handleReset = () => {
    setStep(0)
    setShowResults(false)
    setAgentResult(null)
    setError(null)
    setFormData({
      sleepQuality: 5, energyLevel: 5, caffeineIntake: 0, alcoholIntake: 0,
      medsTaken: false, intimacy: false, creativeTime: 0, practicalTime: 0, moodNotes: '',
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-serif text-xl font-bold tracking-tight">Daily Check-In</h2>
        <button onClick={handleReset} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress */}
      {!showResults && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1 mb-2">
            {steps.map((_, i) => (
              <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= step ? 'bg-accent' : 'bg-muted')} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</p>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {showResults ? (
          <div className="space-y-6 pb-20">
            {/* Streak Update */}
            <Card className="bg-card border-accent/30 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <FaFire className="w-10 h-10 text-accent" />
                </div>
                <h3 className="font-serif text-2xl font-bold tracking-tight mb-1">
                  {agentResult?.streak_count ?? 0}-Day Streak
                </h3>
                <p className="text-muted-foreground text-sm">Keep showing up!</p>
              </CardContent>
            </Card>

            {/* HP Update */}
            <Card className="bg-card border-border shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FaShieldAlt className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-sm">HP: {agentResult?.hp_value ?? 0}/{agentResult?.hp_max ?? 100}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{agentResult?.shield_count ?? 0} Shields</Badge>
                </div>
                <Progress value={((agentResult?.hp_value ?? 0) / (agentResult?.hp_max ?? 100)) * 100} className="h-3 rounded-full" />
              </CardContent>
            </Card>

            {/* Stats Summary */}
            {agentResult?.stats_summary && (
              <Card className="bg-card border-border shadow-lg rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Stats Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">{renderMarkdown(agentResult.stats_summary)}</CardContent>
              </Card>
            )}

            {/* Mood Assessment */}
            {agentResult?.mood_assessment && (
              <Card className="bg-card border-border shadow-lg rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2"><Smile className="w-4 h-4 text-accent" />Mood Assessment</CardTitle>
                </CardHeader>
                <CardContent className="pt-0"><p className="text-sm text-muted-foreground">{agentResult.mood_assessment}</p></CardContent>
              </Card>
            )}

            {/* Pattern Insights */}
            {Array.isArray(agentResult?.pattern_insights) && agentResult.pattern_insights.length > 0 && (
              <Card className="bg-card border-border shadow-lg rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-accent" />Pattern Insights</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {agentResult.pattern_insights.map((p: PatternInsight, i: number) => (
                    <div key={i} className={cn('p-3 rounded-xl border', getSeverityColor(p?.severity))}>
                      <p className="text-sm font-semibold mb-1">{p?.pattern ?? 'Pattern detected'}</p>
                      <p className="text-xs opacity-80">{p?.recommendation ?? ''}</p>
                      <Badge variant="outline" className={cn('mt-2 text-[10px]', getSeverityColor(p?.severity))}>{p?.severity ?? 'info'}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Motivational Message */}
            {agentResult?.motivational_message && (
              <Card className="bg-accent/10 border-accent/30 shadow-lg rounded-2xl">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-6 h-6 text-accent mx-auto mb-3" />
                  <p className="text-sm font-medium italic">{agentResult.motivational_message}</p>
                </CardContent>
              </Card>
            )}

            <Button onClick={handleReset} className="w-full rounded-2xl h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              Close and Return to Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            <div className="text-center py-4">
              <h3 className="font-serif text-xl font-bold tracking-tight mb-1">{steps[step]?.title}</h3>
              <p className="text-sm text-muted-foreground">{steps[step]?.subtitle}</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            {/* Step 0: Sleep Quality */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaBed className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-4xl font-bold mb-2">{formData.sleepQuality}/10</p>
                </div>
                <Slider value={[formData.sleepQuality]} onValueChange={([v]) => setFormData(prev => ({ ...prev, sleepQuality: v }))} min={1} max={10} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>Terrible</span><span>Amazing</span></div>
              </div>
            )}

            {/* Step 1: Energy Level */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaBolt className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-4xl font-bold mb-2">{formData.energyLevel}/10</p>
                </div>
                <Slider value={[formData.energyLevel]} onValueChange={([v]) => setFormData(prev => ({ ...prev, energyLevel: v }))} min={1} max={10} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>Exhausted</span><span>Energized</span></div>
              </div>
            )}

            {/* Step 2: Caffeine */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaCoffee className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-4xl font-bold mb-2">{formData.caffeineIntake}</p>
                  <p className="text-sm text-muted-foreground">cups</p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="icon" className="rounded-xl w-12 h-12" onClick={() => setFormData(prev => ({ ...prev, caffeineIntake: Math.max(0, prev.caffeineIntake - 1) }))} disabled={formData.caffeineIntake <= 0}>
                    <span className="text-xl font-bold">-</span>
                  </Button>
                  <span className="text-2xl font-bold w-12 text-center">{formData.caffeineIntake}</span>
                  <Button variant="outline" size="icon" className="rounded-xl w-12 h-12" onClick={() => setFormData(prev => ({ ...prev, caffeineIntake: prev.caffeineIntake + 1 }))}>
                    <span className="text-xl font-bold">+</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Alcohol */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaWineGlass className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-4xl font-bold mb-2">{formData.alcoholIntake}</p>
                  <p className="text-sm text-muted-foreground">drinks</p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="icon" className="rounded-xl w-12 h-12" onClick={() => setFormData(prev => ({ ...prev, alcoholIntake: Math.max(0, prev.alcoholIntake - 1) }))} disabled={formData.alcoholIntake <= 0}>
                    <span className="text-xl font-bold">-</span>
                  </Button>
                  <span className="text-2xl font-bold w-12 text-center">{formData.alcoholIntake}</span>
                  <Button variant="outline" size="icon" className="rounded-xl w-12 h-12" onClick={() => setFormData(prev => ({ ...prev, alcoholIntake: prev.alcoholIntake + 1 }))}>
                    <span className="text-xl font-bold">+</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Medications */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaPills className="w-12 h-12 text-accent mx-auto mb-4" />
                </div>
                <div className="flex items-center justify-center gap-6">
                  <Button variant={formData.medsTaken ? 'default' : 'outline'} className={cn('rounded-2xl h-16 w-28 text-lg font-semibold', formData.medsTaken && 'bg-accent text-accent-foreground')} onClick={() => setFormData(prev => ({ ...prev, medsTaken: true }))}>Yes</Button>
                  <Button variant={!formData.medsTaken ? 'default' : 'outline'} className={cn('rounded-2xl h-16 w-28 text-lg font-semibold', !formData.medsTaken && 'bg-secondary text-secondary-foreground')} onClick={() => setFormData(prev => ({ ...prev, medsTaken: false }))}>No</Button>
                </div>
              </div>
            )}

            {/* Step 5: Intimacy */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaHeart className="w-12 h-12 text-accent mx-auto mb-4" />
                </div>
                <div className="flex items-center justify-center gap-6">
                  <Button variant={formData.intimacy ? 'default' : 'outline'} className={cn('rounded-2xl h-16 w-28 text-lg font-semibold', formData.intimacy && 'bg-accent text-accent-foreground')} onClick={() => setFormData(prev => ({ ...prev, intimacy: true }))}>Yes</Button>
                  <Button variant={!formData.intimacy ? 'default' : 'outline'} className={cn('rounded-2xl h-16 w-28 text-lg font-semibold', !formData.intimacy && 'bg-secondary text-secondary-foreground')} onClick={() => setFormData(prev => ({ ...prev, intimacy: false }))}>No</Button>
                </div>
              </div>
            )}

            {/* Step 6: Creative Time */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaMusic className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-4xl font-bold mb-2">{formData.creativeTime}</p>
                  <p className="text-sm text-muted-foreground">minutes</p>
                </div>
                <Input type="number" min={0} max={480} value={formData.creativeTime} onChange={(e) => setFormData(prev => ({ ...prev, creativeTime: parseInt(e.target.value) || 0 }))} className="text-center text-2xl h-14 rounded-2xl bg-input border-border" placeholder="0" />
              </div>
            )}

            {/* Step 7: Practical Time */}
            {step === 7 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaBriefcase className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-4xl font-bold mb-2">{formData.practicalTime}</p>
                  <p className="text-sm text-muted-foreground">minutes</p>
                </div>
                <Input type="number" min={0} max={480} value={formData.practicalTime} onChange={(e) => setFormData(prev => ({ ...prev, practicalTime: parseInt(e.target.value) || 0 }))} className="text-center text-2xl h-14 rounded-2xl bg-input border-border" placeholder="0" />
              </div>
            )}

            {/* Step 8: Mood Notes */}
            {step === 8 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaSmile className="w-12 h-12 text-accent mx-auto mb-4" />
                </div>
                <Textarea value={formData.moodNotes} onChange={(e) => setFormData(prev => ({ ...prev, moodNotes: e.target.value }))} placeholder="How are you feeling today? Any thoughts to share..." rows={4} className="rounded-2xl bg-input border-border resize-none" />
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Navigation */}
      {!showResults && (
        <div className="p-4 border-t border-border flex items-center gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-2xl flex-1 h-12">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} className="rounded-2xl flex-1 h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="rounded-2xl flex-1 h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><CheckCircle className="w-4 h-4 mr-2" /> Submit Check-In</>}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function Page() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'history'>('dashboard')
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [sampleMode, setSampleMode] = useState(false)
  const [appState, setAppState] = useState<AppState>(DEFAULT_STATE)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [historyTab, setHistoryTab] = useState<'logs' | 'patterns' | 'achievements'>('logs')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Session ID
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('flowstate_session_id')
      if (stored) return stored
      const newId = crypto.randomUUID()
      localStorage.setItem('flowstate_session_id', newId)
      return newId
    }
    return ''
  })

  // --- Load state from localStorage on mount ---
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          setAppState(prev => ({ ...prev, ...parsed }))
        }
      } catch { /* ignore */ }
    }
  }, [])

  // --- Save state to localStorage ---
  useEffect(() => {
    if (mounted && typeof window !== 'undefined' && !sampleMode) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState))
      } catch { /* ignore */ }
    }
  }, [appState, mounted, sampleMode])

  // --- Scroll chat to bottom ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [appState.chatMessages, chatLoading])

  // --- Compute display state ---
  const displayState = sampleMode ? SAMPLE_STATE : appState

  // --- Check achievements ---
  const checkAchievements = useCallback((state: AppState): Achievement[] => {
    const achs = [...state.achievements]
    const unlock = (id: string) => {
      const idx = achs.findIndex(a => a.id === id)
      if (idx >= 0 && !achs[idx].unlocked) {
        achs[idx] = { ...achs[idx], unlocked: true, unlockedAt: new Date().toISOString() }
      }
    }
    if (state.checkInHistory.length > 0) unlock('first_checkin')
    if (state.streak >= 3) unlock('streak_3')
    if (state.streak >= 7) unlock('streak_7')
    if (state.streak >= 30) unlock('streak_30')
    if ((state.stats.creativeTime ?? 0) >= 60) unlock('creative_hour')
    if (state.hp >= 50) unlock('hp_50')
    if (state.hp >= 100) unlock('hp_100')
    if (state.suggestions.some(s => s.done)) unlock('suggestion_done')
    if (state.chatMessages.filter(m => m.role === 'user').length >= 5) unlock('chat_5')
    return achs
  }, [])

  // --- Handle check-in complete ---
  const handleCheckInComplete = useCallback((formData: any, agentResult: any) => {
    const entry: CheckInEntry = {
      id: generateId(),
      date: new Date().toISOString(),
      sleepQuality: formData.sleepQuality,
      energyLevel: formData.energyLevel,
      caffeineIntake: formData.caffeineIntake,
      alcoholIntake: formData.alcoholIntake,
      medsTaken: formData.medsTaken,
      intimacy: formData.intimacy,
      creativeTime: formData.creativeTime,
      practicalTime: formData.practicalTime,
      moodNotes: formData.moodNotes,
      streakCount: agentResult?.streak_count,
      hpValue: agentResult?.hp_value,
      hpMax: agentResult?.hp_max,
      shieldCount: agentResult?.shield_count,
      patternInsights: Array.isArray(agentResult?.pattern_insights) ? agentResult.pattern_insights : [],
      motivationalMessage: agentResult?.motivational_message,
      statsSummary: agentResult?.stats_summary,
      moodAssessment: agentResult?.mood_assessment,
    }

    const newPatterns = Array.isArray(agentResult?.pattern_insights) ? agentResult.pattern_insights : []

    setAppState(prev => {
      const newState: AppState = {
        ...prev,
        streak: agentResult?.streak_count ?? prev.streak,
        hp: agentResult?.hp_value ?? prev.hp,
        hpMax: agentResult?.hp_max ?? prev.hpMax,
        shields: agentResult?.shield_count ?? prev.shields,
        lastCheckIn: new Date().toISOString(),
        checkInHistory: [entry, ...prev.checkInHistory],
        patternHistory: [...newPatterns, ...prev.patternHistory],
        stats: {
          sleepQuality: agentResult?.sleep_quality ?? formData.sleepQuality,
          energyLevel: agentResult?.energy_level ?? formData.energyLevel,
          caffeineIntake: agentResult?.caffeine_intake ?? formData.caffeineIntake,
          creativeTime: agentResult?.creative_time_minutes ?? formData.creativeTime,
          practicalTime: agentResult?.practical_time_minutes ?? formData.practicalTime,
          mood: agentResult?.mood_assessment ?? prev.stats.mood,
        },
        motivationalMessage: agentResult?.motivational_message ?? prev.motivationalMessage,
        achievements: prev.achievements,
      }
      newState.achievements = checkAchievements(newState)
      return newState
    })
  }, [checkAchievements])

  // --- Get Suggestions ---
  const handleGetSuggestions = useCallback(async () => {
    setSuggestionsLoading(true)
    setSuggestionsError(null)
    setActiveAgentId(COACH_AGENT_ID)

    const energy = displayState.stats.energyLevel ?? 'unknown'
    const creative = displayState.stats.creativeTime ?? 0
    const message = `I need suggestions based on my current state. My recent energy has been ${energy}/10 and I've logged ${creative} min of creative time. What should I focus on right now?`

    try {
      const result = await callAIAgent(message, COACH_AGENT_ID, { session_id: sessionId })
      if (result?.success) {
        const parsed = parseAgentResult(result)
        const suggestions = Array.isArray(parsed?.suggestions)
          ? parsed.suggestions.map((s: any) => ({ ...s, done: false, skipped: false }))
          : []
        setAppState(prev => ({
          ...prev,
          suggestions,
          coachingNote: parsed?.coaching_note ?? prev.coachingNote,
          energyAssessment: parsed?.overall_energy_assessment ?? prev.energyAssessment,
        }))
      } else {
        setSuggestionsError(result?.error ?? 'Failed to get suggestions.')
      }
    } catch {
      setSuggestionsError('Network error getting suggestions.')
    }
    setActiveAgentId(null)
    setSuggestionsLoading(false)
  }, [displayState.stats, sessionId])

  // --- Chat Send ---
  const handleSendChat = useCallback(async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || chatLoading) return

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }

    setAppState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, userMsg] }))
    setChatInput('')
    setChatLoading(true)
    setChatError(null)
    setActiveAgentId(ORACLE_AGENT_ID)

    const contextPrefix = `[Context: User streak=${displayState.streak}, energy=${displayState.stats.energyLevel ?? 'unknown'}, HP=${displayState.hp}/${displayState.hpMax}] `
    const fullMessage = contextPrefix + trimmed

    try {
      const result = await callAIAgent(fullMessage, ORACLE_AGENT_ID, { session_id: sessionId })
      if (result?.success) {
        const parsed = parseAgentResult(result)
        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: parsed?.response_text ?? 'I hear you. Let me think about that.',
          timestamp: new Date().toISOString(),
          isIntervention: parsed?.is_intervention === true,
          interventionType: parsed?.intervention_type ?? 'none',
          interventionMessage: parsed?.intervention_message ?? '',
          topicsExplored: Array.isArray(parsed?.topics_explored) ? parsed.topics_explored : [],
          actionItems: Array.isArray(parsed?.action_items) ? parsed.action_items : [],
          conversationMood: parsed?.conversation_mood ?? '',
        }
        setAppState(prev => {
          const newState = { ...prev, chatMessages: [...prev.chatMessages, assistantMsg] }
          newState.achievements = checkAchievements(newState)
          return newState
        })
      } else {
        setChatError(result?.error ?? 'Failed to get response.')
      }
    } catch {
      setChatError('Network error. Please try again.')
    }
    setActiveAgentId(null)
    setChatLoading(false)
  }, [chatInput, chatLoading, displayState, sessionId, checkAchievements])

  // --- Mark suggestion done/skip ---
  const handleSuggestionAction = useCallback((idx: number, action: 'done' | 'skip') => {
    setAppState(prev => {
      const newSugs = [...prev.suggestions]
      if (newSugs[idx]) {
        newSugs[idx] = { ...newSugs[idx], [action === 'done' ? 'done' : 'skipped']: true }
      }
      const newState = { ...prev, suggestions: newSugs }
      newState.achievements = checkAchievements(newState)
      return newState
    })
  }, [checkAchievements])

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
        {/* ============ TOP HEADER ============ */}
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            {/* Left: Brand */}
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl font-extrabold tracking-tight">FlowState</h1>
            </div>

            {/* Center: Streak */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <FaFire className={cn('w-5 h-5', displayState.streak > 0 ? 'text-accent' : 'text-muted-foreground')} />
                {displayState.streak > 0 && <div className="absolute -inset-1 rounded-full bg-accent/20 animate-ping pointer-events-none" />}
              </div>
              <span className="font-bold text-sm">{displayState.streak}</span>
            </div>

            {/* Right: HP + Sample Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <FaShieldAlt className="w-3.5 h-3.5 text-accent" />
                <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((displayState.hp) / (displayState.hpMax || 100)) * 100)}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{displayState.hp}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="sample-toggle" className="text-[10px] text-muted-foreground">Sample</Label>
                <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} className="scale-75" />
              </div>
            </div>
          </div>
        </header>

        {/* ============ MAIN CONTENT ============ */}
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-lg mx-auto px-4 py-4">

            {/* -------- DASHBOARD TAB -------- */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Hero Streak Card */}
                <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center', displayState.streak > 0 ? 'bg-accent/20' : 'bg-muted')}>
                          <FaFire className={cn('w-8 h-8', displayState.streak > 0 ? 'text-accent' : 'text-muted-foreground')} />
                        </div>
                        {displayState.streak > 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shadow-lg shadow-accent/30">
                            {displayState.streak}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="font-serif text-2xl font-extrabold tracking-tight">
                          {displayState.streak > 0 ? `${displayState.streak}-Day Streak` : 'Start Your Streak'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {displayState.streak > 0 ? 'Keep the momentum going!' : 'Complete a check-in to begin'}
                        </p>
                      </div>
                    </div>

                    {/* HP Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <FaShieldAlt className="w-3.5 h-3.5 text-accent" />
                          <span className="text-xs font-semibold">HP {displayState.hp}/{displayState.hpMax}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          <Shield className="w-3 h-3 mr-1" />{displayState.shields} Shields
                        </Badge>
                      </div>
                      <Progress value={((displayState.hp) / (displayState.hpMax || 100)) * 100} className="h-3 rounded-full" />
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={<FaBed className="w-4 h-4" />} value={displayState.stats.sleepQuality} label="Sleep Quality" unit="/10" />
                  <StatCard icon={<FaBolt className="w-4 h-4" />} value={displayState.stats.energyLevel} label="Energy Level" unit="/10" />
                  <StatCard icon={<FaCoffee className="w-4 h-4" />} value={displayState.stats.caffeineIntake} label="Caffeine" unit=" cups" />
                  <StatCard icon={<FaMusic className="w-4 h-4" />} value={displayState.stats.creativeTime} label="Creative Time" unit=" min" />
                  <StatCard icon={<FaBriefcase className="w-4 h-4" />} value={displayState.stats.practicalTime} label="Practical Time" unit=" min" />
                  <StatCard icon={<FaSmile className="w-4 h-4" />} value={displayState.stats.mood ? (displayState.stats.mood.length > 15 ? displayState.stats.mood.substring(0, 15) + '...' : displayState.stats.mood) : null} label="Mood" />
                </div>

                {/* Action CTAs */}
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => setShowCheckIn(true)} className="h-14 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-lg shadow-accent/20 text-sm">
                    <Sparkles className="w-4 h-4 mr-2" /> Daily Check-In
                  </Button>
                  <Button onClick={handleGetSuggestions} disabled={suggestionsLoading} variant="outline" className="h-14 rounded-2xl border-2 border-accent/30 hover:bg-accent/10 font-semibold text-sm">
                    {suggestionsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FaLightbulb className="w-4 h-4 mr-2 text-accent" />}
                    Get Suggestions
                  </Button>
                </div>

                {suggestionsError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{suggestionsError}</div>
                )}

                {/* Suggestions */}
                {(displayState.suggestions?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-serif text-lg font-bold tracking-tight flex items-center gap-2">
                      <FaLightbulb className="w-4 h-4 text-accent" /> Suggestions
                    </h3>

                    {displayState.energyAssessment && (
                      <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl">{displayState.energyAssessment}</p>
                    )}

                    {Array.isArray(displayState.suggestions) && displayState.suggestions.map((sug, i) => {
                      const catStyle = getCategoryStyle(sug?.category)
                      const isDone = sug?.done === true
                      const isSkipped = sug?.skipped === true
                      return (
                        <Card key={i} className={cn('bg-card border-border shadow-lg rounded-2xl transition-all duration-300', (isDone || isSkipped) && 'opacity-50')}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-sm flex-1">{sug?.title ?? 'Suggestion'}</h4>
                              <Badge variant="outline" className={cn('text-[10px] shrink-0', catStyle.bg, catStyle.text)}>{catStyle.label}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{sug?.description ?? ''}</p>
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <Badge variant="secondary" className="text-[10px]">
                                <Clock className="w-3 h-3 mr-1" />{sug?.time_estimate ?? ''}
                              </Badge>
                              {sug?.priority && (
                                <Badge variant="secondary" className={cn('text-[10px]', sug.priority === 'high' ? 'text-amber-400' : 'text-muted-foreground')}>
                                  {sug.priority} priority
                                </Badge>
                              )}
                            </div>
                            {sug?.reasoning && (
                              <p className="text-[11px] text-muted-foreground italic mb-2">{sug.reasoning}</p>
                            )}
                            {sug?.trending_relevance && sug.trending_relevance !== 'N/A' && (
                              <p className="text-[11px] text-accent/80 mb-3">
                                <Sparkles className="w-3 h-3 inline mr-1" />{sug.trending_relevance}
                              </p>
                            )}
                            {!isDone && !isSkipped && !sampleMode && (
                              <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => handleSuggestionAction(i, 'done')} className="rounded-xl h-8 bg-accent text-accent-foreground hover:bg-accent/90 text-xs flex-1">
                                  <FaCheck className="w-3 h-3 mr-1" /> Done
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleSuggestionAction(i, 'skip')} className="rounded-xl h-8 text-xs flex-1">
                                  <FaTimes className="w-3 h-3 mr-1" /> Skip
                                </Button>
                              </div>
                            )}
                            {isDone && <p className="text-xs text-green-400 font-medium"><FaCheck className="w-3 h-3 inline mr-1" />Completed</p>}
                            {isSkipped && <p className="text-xs text-muted-foreground font-medium">Skipped</p>}
                          </CardContent>
                        </Card>
                      )
                    })}

                    {displayState.coachingNote && (
                      <Card className="bg-accent/5 border-accent/20 shadow-lg rounded-2xl">
                        <CardContent className="p-4">
                          <p className="text-xs font-semibold text-accent mb-1">Coaching Note</p>
                          <p className="text-sm text-muted-foreground">{displayState.coachingNote}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Latest Pattern Insight */}
                {(displayState.patternHistory?.length ?? 0) > 0 && (
                  <Card className={cn('border-2 shadow-lg rounded-2xl', getSeverityColor(displayState.patternHistory?.[0]?.severity))}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Latest Pattern</span>
                      </div>
                      <p className="text-sm font-medium mb-1">{displayState.patternHistory?.[0]?.pattern ?? ''}</p>
                      <p className="text-xs opacity-80">{displayState.patternHistory?.[0]?.recommendation ?? ''}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Motivational Message */}
                {displayState.motivationalMessage && (
                  <Card className="bg-accent/5 border-accent/20 shadow-lg rounded-2xl">
                    <CardContent className="p-6 text-center">
                      <Sparkles className="w-5 h-5 text-accent mx-auto mb-2" />
                      <p className="text-sm font-medium italic text-muted-foreground">{displayState.motivationalMessage}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Empty state when no data */}
                {!sampleMode && displayState.streak === 0 && (displayState.checkInHistory?.length ?? 0) === 0 && (
                  <Card className="bg-card border-border shadow-lg rounded-2xl">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-serif text-lg font-bold tracking-tight mb-2">Welcome to FlowState</h3>
                      <p className="text-sm text-muted-foreground mb-4">Track your daily habits, get AI-powered coaching, and build momentum with streaks and HP.</p>
                      <p className="text-xs text-accent">Tap "Daily Check-In" above to start your journey</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* -------- CHAT TAB -------- */}
            {activeTab === 'chat' && (
              <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 180px)' }}>
                {/* Context Bar */}
                <div className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border shadow-md mb-4">
                  <div className="flex items-center gap-1.5">
                    <FaFire className={cn('w-3.5 h-3.5', displayState.streak > 0 ? 'text-accent' : 'text-muted-foreground')} />
                    <span className="text-xs font-semibold">{displayState.streak}-day streak</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs">Energy: {displayState.stats.energyLevel ?? '--'}/10</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs">HP: {displayState.hp}</span>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 pr-1">
                  <div className="space-y-4 pb-4">
                    {(displayState.chatMessages?.length ?? 0) === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-serif text-lg font-bold tracking-tight mb-2">Chat with the Oracle</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Ask anything - life advice, creative ideas, or just vent. The Oracle listens and guides.</p>
                      </div>
                    )}

                    {Array.isArray(displayState.chatMessages) && displayState.chatMessages.map((msg) => (
                      <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[85%] rounded-2xl p-4', msg.role === 'user' ? 'bg-accent text-accent-foreground' : msg.isIntervention ? 'bg-card border-l-4 border-amber-500 shadow-lg' : 'bg-card border border-border shadow-md')}>
                          {msg.isIntervention && msg.interventionType !== 'none' && (
                            <Badge className="mb-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                              <AlertTriangle className="w-3 h-3 mr-1" />{msg.interventionType}
                            </Badge>
                          )}

                          {msg.isIntervention && msg.interventionMessage ? (
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-amber-400">{renderMarkdown(msg.interventionMessage)}</div>
                              <Separator className="opacity-30" />
                              <div className="text-sm">{renderMarkdown(msg.content)}</div>
                            </div>
                          ) : (
                            <div className="text-sm">{msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}</div>
                          )}

                          {/* Action items */}
                          {Array.isArray(msg.actionItems) && msg.actionItems.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              <p className="text-[10px] font-semibold uppercase text-accent">Action Items</p>
                              {msg.actionItems.map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                  <Target className="w-3 h-3 mt-0.5 text-accent shrink-0" />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Topics */}
                          {Array.isArray(msg.topicsExplored) && msg.topicsExplored.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {msg.topicsExplored.map((t, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                              ))}
                            </div>
                          )}

                          {/* Mood */}
                          {msg.conversationMood && msg.role === 'assistant' && (
                            <p className="text-[10px] text-muted-foreground mt-2 italic">Mood: {msg.conversationMood}</p>
                          )}

                          <p className="text-[10px] text-muted-foreground/60 mt-2">{formatTime(msg.timestamp)}</p>
                        </div>
                      </div>
                    ))}

                    {/* Intervention quick replies */}
                    {Array.isArray(displayState.chatMessages) && displayState.chatMessages.length > 0 && displayState.chatMessages[displayState.chatMessages.length - 1]?.isIntervention && !chatLoading && (
                      <div className="flex gap-2 justify-start pl-2">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs border-accent/30 hover:bg-accent/10" onClick={() => { setChatInput("You're right, let me focus"); }}>
                          You are right, let me focus
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl text-xs border-border" onClick={() => { setChatInput("I hear you, but I need to explore this"); }}>
                          I need to explore this
                        </Button>
                      </div>
                    )}

                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-card border border-border rounded-2xl shadow-md">
                          <TypingIndicator />
                        </div>
                      </div>
                    )}

                    {chatError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{chatError}</div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="sticky bottom-20 bg-background pt-2">
                  <div className="flex items-center gap-2">
                    <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask the Oracle anything..." className="flex-1 rounded-2xl h-12 bg-card border-border pr-12" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }} disabled={chatLoading || sampleMode} />
                    <Button onClick={handleSendChat} disabled={!chatInput.trim() || chatLoading || sampleMode} size="icon" className="rounded-2xl w-12 h-12 bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
                      {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* -------- HISTORY TAB -------- */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <Tabs value={historyTab} onValueChange={(v) => setHistoryTab(v as 'logs' | 'patterns' | 'achievements')}>
                  <TabsList className="w-full bg-card border border-border rounded-2xl h-11">
                    <TabsTrigger value="logs" className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                      <FaHistory className="w-3.5 h-3.5 mr-1.5" />Logs
                    </TabsTrigger>
                    <TabsTrigger value="patterns" className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />Patterns
                    </TabsTrigger>
                    <TabsTrigger value="achievements" className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                      <FaTrophy className="w-3.5 h-3.5 mr-1.5" />Achievements
                    </TabsTrigger>
                  </TabsList>

                  {/* Logs */}
                  <TabsContent value="logs" className="mt-4 space-y-3">
                    {(displayState.checkInHistory?.length ?? 0) === 0 && (
                      <Card className="bg-card border-border shadow-lg rounded-2xl">
                        <CardContent className="p-8 text-center">
                          <FaHistory className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No check-ins yet. Complete your first daily check-in to see history here.</p>
                        </CardContent>
                      </Card>
                    )}
                    {Array.isArray(displayState.checkInHistory) && displayState.checkInHistory.map((entry) => {
                      const isExpanded = expandedLogId === entry.id
                      return (
                        <Card key={entry.id} className="bg-card border-border shadow-lg rounded-2xl">
                          <CardContent className="p-4">
                            <button onClick={() => setExpandedLogId(isExpanded ? null : entry.id)} className="w-full flex items-center justify-between">
                              <div className="text-left">
                                <p className="text-sm font-semibold">{formatDate(entry.date)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Sleep: {entry.sleepQuality}/10 | Energy: {entry.energyLevel}/10 | Creative: {entry.creativeTime}min
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {(entry.streakCount ?? 0) > 0 && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    <FaFire className="w-2.5 h-2.5 mr-1 text-accent" />{entry.streakCount}
                                  </Badge>
                                )}
                                {isExpanded ? <FaChevronUp className="w-3 h-3 text-muted-foreground" /> : <FaChevronDown className="w-3 h-3 text-muted-foreground" />}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-border space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Sleep:</span> <span className="font-semibold">{entry.sleepQuality}/10</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Energy:</span> <span className="font-semibold">{entry.energyLevel}/10</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Caffeine:</span> <span className="font-semibold">{entry.caffeineIntake} cups</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Alcohol:</span> <span className="font-semibold">{entry.alcoholIntake} drinks</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Meds:</span> <span className="font-semibold">{entry.medsTaken ? 'Yes' : 'No'}</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Intimacy:</span> <span className="font-semibold">{entry.intimacy ? 'Yes' : 'No'}</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Creative:</span> <span className="font-semibold">{entry.creativeTime} min</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Practical:</span> <span className="font-semibold">{entry.practicalTime} min</span></div>
                                </div>
                                {entry.moodNotes && (
                                  <div className="bg-muted/50 rounded-xl p-3">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Mood Notes</p>
                                    <p className="text-xs">{entry.moodNotes}</p>
                                  </div>
                                )}
                                {entry.moodAssessment && (
                                  <div className="bg-muted/50 rounded-xl p-3">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">AI Mood Assessment</p>
                                    <p className="text-xs">{entry.moodAssessment}</p>
                                  </div>
                                )}
                                {entry.motivationalMessage && (
                                  <div className="bg-accent/5 rounded-xl p-3 border border-accent/20">
                                    <p className="text-xs italic text-accent">{entry.motivationalMessage}</p>
                                  </div>
                                )}
                                {Array.isArray(entry.patternInsights) && entry.patternInsights.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Patterns Detected</p>
                                    {entry.patternInsights.map((p, i) => (
                                      <div key={i} className={cn('p-2 rounded-xl border text-xs', getSeverityColor(p?.severity))}>
                                        <p className="font-medium">{p?.pattern ?? ''}</p>
                                        <p className="opacity-80 mt-0.5">{p?.recommendation ?? ''}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {entry.statsSummary && (
                                  <p className="text-xs text-muted-foreground">{entry.statsSummary}</p>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </TabsContent>

                  {/* Patterns */}
                  <TabsContent value="patterns" className="mt-4 space-y-3">
                    {(displayState.patternHistory?.length ?? 0) === 0 && (
                      <Card className="bg-card border-border shadow-lg rounded-2xl">
                        <CardContent className="p-8 text-center">
                          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No patterns detected yet. Complete a few check-ins and the AI will start spotting trends.</p>
                        </CardContent>
                      </Card>
                    )}
                    {Array.isArray(displayState.patternHistory) && displayState.patternHistory.map((p, i) => (
                      <Card key={i} className={cn('border-2 shadow-lg rounded-2xl', getSeverityColor(p?.severity))}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-semibold flex-1">{p?.pattern ?? 'Pattern'}</p>
                            <Badge variant="outline" className={cn('text-[10px] shrink-0', getSeverityColor(p?.severity))}>{p?.severity ?? 'info'}</Badge>
                          </div>
                          <p className="text-xs opacity-80">{p?.recommendation ?? ''}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* Achievements */}
                  <TabsContent value="achievements" className="mt-4">
                    <div className="grid grid-cols-3 gap-3">
                      {Array.isArray(displayState.achievements) && displayState.achievements.map((ach) => (
                        <AchievementBadge key={ach.id} achievement={ach} />
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-xs text-muted-foreground">
                        {displayState.achievements?.filter(a => a.unlocked).length ?? 0} / {displayState.achievements?.length ?? 0} unlocked
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </main>

        {/* ============ AGENT STATUS FOOTER ============ */}
        <div className="max-w-lg mx-auto px-4 pb-2 w-full">
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-3 mb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Agents</p>
              {activeAgentId && <div className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin text-accent" /><span className="text-[10px] text-accent">Active</span></div>}
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <div className="flex items-center gap-1.5">
                <div className={cn('w-1.5 h-1.5 rounded-full', activeAgentId === CHECKIN_AGENT_ID ? 'bg-accent animate-pulse' : 'bg-muted-foreground/40')} />
                <span className="text-[10px] text-muted-foreground">Check-In</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn('w-1.5 h-1.5 rounded-full', activeAgentId === COACH_AGENT_ID ? 'bg-accent animate-pulse' : 'bg-muted-foreground/40')} />
                <span className="text-[10px] text-muted-foreground">Coach</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn('w-1.5 h-1.5 rounded-full', activeAgentId === ORACLE_AGENT_ID ? 'bg-accent animate-pulse' : 'bg-muted-foreground/40')} />
                <span className="text-[10px] text-muted-foreground">Oracle</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============ BOTTOM TAB BAR ============ */}
        <nav className="sticky bottom-0 z-40 bg-background/90 backdrop-blur-md border-t border-border">
          <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">
            <button onClick={() => setActiveTab('dashboard')} className={cn('flex flex-col items-center gap-1 transition-colors', activeTab === 'dashboard' ? 'text-accent' : 'text-muted-foreground hover:text-foreground')}>
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium">Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('chat')} className={cn('flex flex-col items-center gap-1 transition-colors', activeTab === 'chat' ? 'text-accent' : 'text-muted-foreground hover:text-foreground')}>
              <MessageCircle className="w-5 h-5" />
              <span className="text-[10px] font-medium">Chat</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={cn('flex flex-col items-center gap-1 transition-colors', activeTab === 'history' ? 'text-accent' : 'text-muted-foreground hover:text-foreground')}>
              <Clock className="w-5 h-5" />
              <span className="text-[10px] font-medium">History</span>
            </button>
          </div>
        </nav>

        {/* ============ CHECK-IN MODAL ============ */}
        <CheckInModal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} onComplete={handleCheckInComplete} sessionId={sessionId} />
      </div>
    </ErrorBoundary>
  )
}
