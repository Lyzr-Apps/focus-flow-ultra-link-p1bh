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
  FaFire, FaShieldAlt, FaBolt, FaBed, FaCoffee, FaMusic, FaBriefcase,
  FaSmile, FaHistory, FaTrophy, FaHeart, FaPills, FaWineGlass, FaCheck,
  FaTimes, FaLightbulb, FaStar, FaMedal, FaRocket, FaMoon, FaLock,
  FaChevronDown, FaChevronUp, FaSun, FaCloudSun,
} from 'react-icons/fa'
import {
  Home, MessageCircle, Clock, Loader2, Send, X, Sparkles, Shield, Zap,
  Smile, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Target,
} from 'lucide-react'

// ============================================================
// CONSTANTS
// ============================================================

const CHECKIN_AGENT_ID = '699ea162006f1f9bd420ce52'
const COACH_AGENT_ID = '699ea17f55140cb9a8fc8c83'
const ORACLE_AGENT_ID = '699ea16355140cb9a8fc8c57'

const STORAGE_KEY = 'creatr_app_state'

// ============================================================
// TYPES
// ============================================================

type CheckInPeriod = 'morning' | 'afternoon' | 'evening'

interface DailyCheckIns {
  date: string
  morning: boolean
  afternoon: boolean
  evening: boolean
}

interface MedicationEntry {
  name: string
  generic: string
  dosageMg: number
  timeTaken: string
  duration: { min: number; max: number }
}

interface PatternInsight {
  pattern: string
  severity: string
  recommendation: string
}

interface CheckInEntry {
  id: string
  date: string
  period: CheckInPeriod
  sleepQuality: number
  energyLevel: number
  caffeineIntake: number
  alcoholIntake: number
  medications: MedicationEntry[]
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
  todayCheckIns: DailyCheckIns
}

// ============================================================
// MEDICATION LIST
// ============================================================

const MEDICATION_LIST = [
  { name: 'Vyvanse', generic: 'lisdexamfetamine', duration: { min: 10, max: 14 } },
  { name: 'Dexamphetamine', generic: 'dextroamphetamine', duration: { min: 4, max: 6 } },
  { name: 'Ritalin', generic: 'methylphenidate', duration: { min: 3, max: 4 } },
  { name: 'Concerta', generic: 'methylphenidate ER', duration: { min: 10, max: 12 } },
  { name: 'Adderall', generic: 'mixed amphetamine salts', duration: { min: 4, max: 6 } },
  { name: 'Adderall XR', generic: 'mixed amphetamine salts XR', duration: { min: 10, max: 12 } },
  { name: 'Strattera', generic: 'atomoxetine', duration: { min: 16, max: 24 } },
  { name: 'Modafinil', generic: 'modafinil', duration: { min: 12, max: 15 } },
  { name: 'Wellbutrin', generic: 'bupropion', duration: { min: 12, max: 24 } },
  { name: 'Sertraline', generic: 'Zoloft', duration: { min: 24, max: 26 } },
  { name: 'Escitalopram', generic: 'Lexapro', duration: { min: 24, max: 30 } },
  { name: 'Melatonin', generic: 'melatonin', duration: { min: 5, max: 8 } },
  { name: 'Magnesium', generic: 'magnesium', duration: { min: 6, max: 8 } },
]

// ============================================================
// SLIDER DESCRIPTIONS
// ============================================================

const SLEEP_DESCRIPTIONS: Record<number, string> = {
  1: 'Severely disrupted -- barely any sleep',
  2: 'Very poor -- woke frequently, restless',
  3: 'Poor -- fragmented, unrefreshing',
  4: 'Below average -- some rest but not enough',
  5: 'Moderate -- adequate but could improve',
  6: 'Fair -- decent rest, some interruptions',
  7: 'Good -- mostly solid, refreshing',
  8: 'Very good -- deep, restorative sleep',
  9: 'Excellent -- full cycles, woke refreshed',
  10: 'Exceptional -- perfect, peak recovery',
}

const ENERGY_DESCRIPTIONS: Record<number, string> = {
  1: 'Depleted -- struggling to function',
  2: 'Very low -- heavy fatigue, brain fog',
  3: 'Low -- sluggish, needing stimulants',
  4: 'Below baseline -- functioning but drained',
  5: 'Baseline -- neutral, getting by',
  6: 'Moderate -- capable, some motivation',
  7: 'Good -- clear-headed, productive',
  8: 'High -- focused, creative flow accessible',
  9: 'Very high -- sharp, motivated, in the zone',
  10: 'Peak -- firing on all cylinders, unstoppable',
}

// ============================================================
// MANTRAS & WORDS
// ============================================================

const MANTRAS = [
  { quote: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
  { quote: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { quote: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { quote: "Nothing will work unless you do.", author: "Maya Angelou" },
  { quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { quote: "Be water, my friend.", author: "Bruce Lee" },
  { quote: "Imagination is more important than knowledge.", author: "Albert Einstein" },
  { quote: "We suffer more in imagination than in reality.", author: "Seneca" },
  { quote: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus" },
  { quote: "The wound is the place where the Light enters you.", author: "Rumi" },
  { quote: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "What you do speaks so loudly that I cannot hear what you say.", author: "Ralph Waldo Emerson" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Knowing is not enough, we must apply. Willing is not enough, we must do.", author: "Bruce Lee" },
  { quote: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { quote: "It is not the strongest that survive, nor the most intelligent, but the most responsive to change.", author: "Charles Darwin" },
  { quote: "The cosmos is within us. We are made of star-stuff.", author: "Carl Sagan" },
  { quote: "People often say that motivation doesn't last. Well, neither does bathing. That's why we recommend it daily.", author: "Zig Ziglar" },
  { quote: "If you are not willing to risk the usual, you will have to settle for the ordinary.", author: "Jim Rohn" },
  { quote: "Absorb what is useful, discard what is useless and add what is specifically your own.", author: "Bruce Lee" },
  { quote: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
]

const WORDS_OF_DAY = [
  { word: "Eudaimonia", pronunciation: "yoo-dye-MOH-nee-uh", definition: "A Greek concept of human flourishing through living with virtue and purpose" },
  { word: "Kairos", pronunciation: "KY-ross", definition: "The perfect, opportune moment for decisive action" },
  { word: "Sonder", pronunciation: "SON-der", definition: "The realization that each passerby has a life as vivid and complex as your own" },
  { word: "Ikigai", pronunciation: "ee-kee-GUY", definition: "A Japanese concept meaning 'a reason for being' -- the intersection of what you love, what you're good at, what the world needs, and what you can be paid for" },
  { word: "Meraki", pronunciation: "meh-RAH-kee", definition: "To do something with soul, creativity, or love -- putting a piece of yourself into your work" },
  { word: "Ubuntu", pronunciation: "oo-BOON-too", definition: "A South African philosophy meaning 'I am because we are' -- shared humanity and interconnectedness" },
  { word: "Hygge", pronunciation: "HOO-gah", definition: "A Danish quality of cosiness and comfortable conviviality that engenders contentment" },
  { word: "Wabi-sabi", pronunciation: "WAH-bee SAH-bee", definition: "A Japanese aesthetic centered on acceptance of imperfection and transience" },
  { word: "Ataraxia", pronunciation: "at-uh-RAK-see-uh", definition: "A state of serene calmness and freedom from emotional disturbance or anxiety" },
  { word: "Praxis", pronunciation: "PRAK-sis", definition: "The process of translating ideas and theory into practical action and application" },
  { word: "Kintsukuroi", pronunciation: "kin-TSOO-koo-roy", definition: "The art of repairing broken pottery with gold, treating breakage as part of an object's history rather than something to disguise" },
  { word: "Fernweh", pronunciation: "FERN-vay", definition: "An ache for distant places; a craving for travel and new experiences" },
  { word: "Jouissance", pronunciation: "zhwee-SAHNS", definition: "A French term for extreme pleasure or ecstasy, often found in creative breakthroughs" },
  { word: "Sophrosyne", pronunciation: "soh-FROS-uh-nee", definition: "An ancient Greek concept of healthy-mindedness, moderation, and self-control" },
]

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

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEFAULT_STATE: AppState = {
  streak: 0, hp: 0, hpMax: 100, shields: 0, lastCheckIn: null,
  checkInHistory: [], patternHistory: [], suggestions: [], chatMessages: [],
  achievements: DEFAULT_ACHIEVEMENTS,
  stats: { sleepQuality: null, energyLevel: null, caffeineIntake: null, creativeTime: null, practicalTime: null, mood: null },
  coachingNote: null, energyAssessment: null, motivationalMessage: null,
  todayCheckIns: { date: getTodayStr(), morning: false, afternoon: false, evening: false },
}

// ============================================================
// SAMPLE DATA
// ============================================================

const SAMPLE_STATE: AppState = {
  streak: 5, hp: 72, hpMax: 100, shields: 2,
  lastCheckIn: new Date().toISOString(),
  checkInHistory: [
    {
      id: 's1', date: new Date(Date.now() - 86400000).toISOString(), period: 'morning',
      sleepQuality: 7, energyLevel: 6, caffeineIntake: 2, alcoholIntake: 0,
      medications: [{ name: 'Vyvanse', generic: 'lisdexamfetamine', dosageMg: 40, timeTaken: '08:00', duration: { min: 10, max: 14 } }],
      intimacy: false, creativeTime: 90, practicalTime: 120,
      moodNotes: 'Good day, felt productive', streakCount: 4, hpValue: 65,
      hpMax: 100, shieldCount: 1, motivationalMessage: '4-day streak! You are building real momentum.',
      statsSummary: 'Sleep: 7/10, Energy: 6/10, Creative: 1h 30m', moodAssessment: 'Productive and focused',
      patternInsights: [{ pattern: 'Energy peaks around 10am after coffee', severity: 'thriving', recommendation: 'Schedule creative work for late morning' }],
    },
    {
      id: 's2', date: new Date(Date.now() - 172800000).toISOString(), period: 'afternoon',
      sleepQuality: 8, energyLevel: 7, caffeineIntake: 1, alcoholIntake: 1,
      medications: [{ name: 'Vyvanse', generic: 'lisdexamfetamine', dosageMg: 40, timeTaken: '08:00', duration: { min: 10, max: 14 } }, { name: 'Dexamphetamine', generic: 'dextroamphetamine', dosageMg: 10, timeTaken: '14:00', duration: { min: 4, max: 6 } }],
      intimacy: true, creativeTime: 60, practicalTime: 30,
      moodNotes: 'Relaxed and creative', streakCount: 3, hpValue: 58,
      hpMax: 100, shieldCount: 1, motivationalMessage: 'Keep building that streak!',
      statsSummary: 'Sleep: 8/10, Energy: 7/10, Creative: 1h', moodAssessment: 'Relaxed and happy',
      patternInsights: [{ pattern: 'Better sleep on low-caffeine days', severity: 'thriving', recommendation: 'Keep caffeine to 1-2 espresso shots' }],
    },
  ],
  patternHistory: [
    { pattern: 'Energy drops after 2+ espresso shots past 3pm', severity: 'watch', recommendation: 'Try switching to decaf after 2pm' },
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
  stats: { sleepQuality: 7, energyLevel: 6, caffeineIntake: 2, creativeTime: 90, practicalTime: 120, mood: 'Productive and focused' },
  coachingNote: 'You have been productive this week. One quick creative win today keeps the momentum going.',
  energyAssessment: 'Moderate energy - good for quick creative tasks, avoid deep work',
  motivationalMessage: '5-day streak! You are building real momentum. Keep showing up.',
  todayCheckIns: { date: getTodayStr(), morning: true, afternoon: false, evening: false },
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
  } catch { return 'N/A' }
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch { return '' }
}

function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function getCurrentPeriod(): CheckInPeriod {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
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

function getMedAlerts(medications: MedicationEntry[]): { med: MedicationEntry; status: 'active' | 'wearing_off' | 'worn_off'; wearOffTime: string }[] {
  const now = new Date()
  return medications.map(med => {
    const parts = med.timeTaken.split(':').map(Number)
    const h = parts[0] ?? 0
    const m = parts[1] ?? 0
    const taken = new Date()
    taken.setHours(h, m, 0, 0)
    const wearOffMin = new Date(taken.getTime() + med.duration.min * 3600000)
    const wearOffMax = new Date(taken.getTime() + med.duration.max * 3600000)
    let status: 'active' | 'wearing_off' | 'worn_off' = 'active'
    if (now >= wearOffMax) status = 'worn_off'
    else if (now >= wearOffMin) status = 'wearing_off'
    const wearOffTime = `${wearOffMin.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${wearOffMax.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    return { med, status, wearOffTime }
  })
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
          <p className="text-lg font-bold font-sans tracking-tight text-foreground truncate">{displayVal}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const iconMap: Record<string, React.ReactNode> = {
    star: <FaStar className="w-5 h-5" />, fire: <FaFire className="w-5 h-5" />,
    rocket: <FaRocket className="w-5 h-5" />, palette: <FaMusic className="w-5 h-5" />,
    moon: <FaMoon className="w-5 h-5" />, shield: <FaShieldAlt className="w-5 h-5" />,
    trophy: <FaTrophy className="w-5 h-5" />, check: <FaCheck className="w-5 h-5" />,
    message: <MessageCircle className="w-5 h-5" />, medal: <FaMedal className="w-5 h-5" />,
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
  isOpen, onClose, onComplete, sessionId, period,
}: {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: any, agentResult: any) => void
  sessionId: string
  period: CheckInPeriod
}) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [agentResult, setAgentResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    sleepQuality: 5, energyLevel: 5, caffeineIntake: 0, alcoholIntake: 0,
    medications: [] as MedicationEntry[],
    intimacy: false,
    creativeTimeHours: 0, creativeTimeMinutes: 0,
    practicalTimeHours: 0, practicalTimeMinutes: 0,
    moodNotes: '',
  })

  const [customMedName, setCustomMedName] = useState('')

  const steps = [
    { title: 'Sleep Quality', subtitle: 'How well did you sleep last night?' },
    { title: 'Energy Level', subtitle: 'How is your energy right now?' },
    { title: 'Espresso Shots', subtitle: 'How many espresso shots today?' },
    { title: 'Alcohol', subtitle: 'How many drinks today?' },
    { title: 'Medications', subtitle: 'What did you take today?' },
    { title: 'Intimacy', subtitle: 'Any intimacy today?' },
    { title: 'Creative Time', subtitle: 'Time spent on creative activities' },
    { title: 'Practical Time', subtitle: 'Time spent on practical tasks' },
    { title: 'Mood Notes', subtitle: 'How are you feeling? Any notes?' },
  ]

  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    const creativeTotal = formData.creativeTimeHours * 60 + formData.creativeTimeMinutes
    const practicalTotal = formData.practicalTimeHours * 60 + formData.practicalTimeMinutes
    const medsStr = formData.medications.length > 0
      ? formData.medications.map(m => `${m.name} ${m.dosageMg}mg at ${m.timeTaken}`).join(', ')
      : 'none'
    const sleepDesc = SLEEP_DESCRIPTIONS[formData.sleepQuality] ?? ''
    const energyDesc = ENERGY_DESCRIPTIONS[formData.energyLevel] ?? ''
    const message = `${periodLabel} check-in: Sleep quality: ${formData.sleepQuality}/10 (${sleepDesc}), Energy: ${formData.energyLevel}/10 (${energyDesc}), Caffeine: ${formData.caffeineIntake} espresso shots, Alcohol: ${formData.alcoholIntake} drinks, Medications: ${medsStr}, Intimacy: ${formData.intimacy ? 'yes' : 'no'}, Creative time: ${creativeTotal} min (${formatHoursMinutes(creativeTotal)}), Practical time: ${practicalTotal} min (${formatHoursMinutes(practicalTotal)}), Mood notes: ${formData.moodNotes || 'No specific notes'}`

    try {
      const result = await callAIAgent(message, CHECKIN_AGENT_ID, { session_id: sessionId })
      if (result?.success) {
        const parsed = parseAgentResult(result)
        setAgentResult(parsed)
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          setShowResults(true)
        }, 2000)
        onComplete({ ...formData, creativeTime: creativeTotal, practicalTime: practicalTotal, period }, parsed)
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
    setShowSuccess(false)
    setAgentResult(null)
    setError(null)
    setFormData({
      sleepQuality: 5, energyLevel: 5, caffeineIntake: 0, alcoholIntake: 0,
      medications: [], intimacy: false,
      creativeTimeHours: 0, creativeTimeMinutes: 0,
      practicalTimeHours: 0, practicalTimeMinutes: 0, moodNotes: '',
    })
    setCustomMedName('')
    onClose()
  }

  const addMedication = (med: typeof MEDICATION_LIST[0]) => {
    const exists = formData.medications.some(m => m.name === med.name)
    if (exists) return
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: med.name, generic: med.generic, dosageMg: 0, timeTaken: '08:00', duration: med.duration }],
    }))
  }

  const removeMedication = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== idx),
    }))
  }

  const updateMedication = (idx: number, field: 'dosageMg' | 'timeTaken', value: number | string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((m, i) => i === idx ? { ...m, [field]: value } : m),
    }))
  }

  const addCustomMed = () => {
    if (!customMedName.trim()) return
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: customMedName.trim(), generic: customMedName.trim(), dosageMg: 0, timeTaken: '08:00', duration: { min: 4, max: 8 } }],
    }))
    setCustomMedName('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="animate-checkin-success flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[hsl(155,40%,25%)] flex items-center justify-center shadow-[0_0_40px_hsl(155,40%,30%)]">
              <FaCheck className="w-12 h-12 text-[hsl(155,50%,70%)]" />
            </div>
            <p className="text-xl font-bold font-sans tracking-tight text-[hsl(155,50%,70%)]">Check-In Complete!</p>
            <p className="text-sm text-muted-foreground">{periodLabel} check-in logged</p>
          </div>
          <style>{`
            @keyframes checkinSuccess {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.15); opacity: 1; }
              70% { transform: scale(0.95); }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-checkin-success {
              animation: checkinSuccess 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
          `}</style>
        </div>
      )}

      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-sans text-xl font-extrabold tracking-tight">{periodLabel} Check-In</h2>
        <button onClick={handleReset} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!showResults && !showSuccess && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1 mb-2">
            {steps.map((_, i) => (
              <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= step ? 'bg-accent' : 'bg-muted')} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</p>
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        {showResults ? (
          <div className="space-y-6 pb-20">
            <Card className="bg-card border-accent/30 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <FaFire className="w-10 h-10 text-accent" />
                </div>
                <h3 className="font-sans text-2xl font-extrabold tracking-tight mb-1">{agentResult?.streak_count ?? 0}-Day Streak</h3>
                <p className="text-muted-foreground text-sm">Keep showing up!</p>
              </CardContent>
            </Card>

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

            {agentResult?.stats_summary && (
              <Card className="bg-card border-border shadow-lg rounded-2xl">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Stats Summary</CardTitle></CardHeader>
                <CardContent className="pt-0">{renderMarkdown(agentResult.stats_summary)}</CardContent>
              </Card>
            )}

            {agentResult?.mood_assessment && (
              <Card className="bg-card border-border shadow-lg rounded-2xl">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Smile className="w-4 h-4 text-accent" />Mood Assessment</CardTitle></CardHeader>
                <CardContent className="pt-0"><p className="text-sm text-muted-foreground">{agentResult.mood_assessment}</p></CardContent>
              </Card>
            )}

            {Array.isArray(agentResult?.pattern_insights) && agentResult.pattern_insights.length > 0 && (
              <Card className="bg-card border-border shadow-lg rounded-2xl">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-accent" />Pattern Insights</CardTitle></CardHeader>
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

            {agentResult?.motivational_message && (
              <Card className="bg-accent/10 border-accent/30 shadow-lg rounded-2xl">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-6 h-6 text-accent mx-auto mb-3" />
                  <p className="text-sm font-medium italic">{agentResult.motivational_message}</p>
                </CardContent>
              </Card>
            )}

            <Button onClick={handleReset} className="w-full rounded-2xl h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">Close and Return to Dashboard</Button>
          </div>
        ) : !showSuccess ? (
          <div className="space-y-6 pb-20">
            <div className="text-center py-4">
              <h3 className="font-sans text-xl font-extrabold tracking-tight mb-1">{steps[step]?.title}</h3>
              <p className="text-sm text-muted-foreground">{steps[step]?.subtitle}</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaBed className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-4xl font-bold mb-2">{formData.sleepQuality}/10</p>
                </div>
                <Slider value={[formData.sleepQuality]} onValueChange={([v]) => setFormData(prev => ({ ...prev, sleepQuality: v }))} min={1} max={10} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>Terrible</span><span>Amazing</span></div>
                <p className="text-sm text-center text-muted-foreground mt-3 italic min-h-[1.5rem]">{SLEEP_DESCRIPTIONS[formData.sleepQuality]}</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaBolt className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-4xl font-bold mb-2">{formData.energyLevel}/10</p>
                </div>
                <Slider value={[formData.energyLevel]} onValueChange={([v]) => setFormData(prev => ({ ...prev, energyLevel: v }))} min={1} max={10} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>Exhausted</span><span>Energized</span></div>
                <p className="text-sm text-center text-muted-foreground mt-3 italic min-h-[1.5rem]">{ENERGY_DESCRIPTIONS[formData.energyLevel]}</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaCoffee className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-4xl font-bold mb-2">{formData.caffeineIntake}</p>
                  <p className="text-sm text-muted-foreground">espresso shots</p>
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

            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <FaPills className="w-12 h-12 text-accent mx-auto mb-4" />
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {MEDICATION_LIST.map((med) => {
                    const isSelected = formData.medications.some(m => m.name === med.name)
                    return (
                      <button key={med.name} onClick={() => isSelected ? removeMedication(formData.medications.findIndex(m => m.name === med.name)) : addMedication(med)} className={cn('p-2 rounded-xl border text-left text-xs transition-all', isSelected ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-muted/50 border-border text-muted-foreground hover:border-accent/30')}>
                        <p className="font-semibold">{med.name}</p>
                        <p className="text-[10px] opacity-70">{med.generic}</p>
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <Input value={customMedName} onChange={(e) => setCustomMedName(e.target.value)} placeholder="Other medication..." className="flex-1 rounded-xl bg-input border-border text-sm" />
                  <Button variant="outline" size="sm" onClick={addCustomMed} disabled={!customMedName.trim()} className="rounded-xl">Add</Button>
                </div>
                {formData.medications.length > 0 && (
                  <div className="space-y-3 mt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Selected Medications</p>
                    {formData.medications.map((med, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-xl p-3 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">{med.name}</span>
                          <button onClick={() => removeMedication(idx)} className="text-muted-foreground hover:text-red-400">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground">Dosage (mg)</Label>
                            <Input type="number" min={0} value={med.dosageMg} onChange={(e) => updateMedication(idx, 'dosageMg', parseInt(e.target.value) || 0)} className="h-8 text-sm rounded-lg bg-input border-border" />
                          </div>
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground">Time taken</Label>
                            <Input type="time" value={med.timeTaken} onChange={(e) => updateMedication(idx, 'timeTaken', e.target.value)} className="h-8 text-sm rounded-lg bg-input border-border" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center"><FaHeart className="w-12 h-12 text-accent mx-auto mb-4" /></div>
                <div className="flex items-center justify-center gap-6">
                  <Button variant={formData.intimacy ? 'default' : 'outline'} className={cn('rounded-2xl h-16 w-28 text-lg font-semibold', formData.intimacy && 'bg-accent text-accent-foreground')} onClick={() => setFormData(prev => ({ ...prev, intimacy: true }))}>Yes</Button>
                  <Button variant={!formData.intimacy ? 'default' : 'outline'} className={cn('rounded-2xl h-16 w-28 text-lg font-semibold', !formData.intimacy && 'bg-secondary text-secondary-foreground')} onClick={() => setFormData(prev => ({ ...prev, intimacy: false }))}>No</Button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <div className="text-center"><FaMusic className="w-12 h-12 text-accent mx-auto mb-4" /></div>
                <div className="flex items-center gap-3 justify-center">
                  <div className="text-center">
                    <Input type="number" min={0} max={12} value={formData.creativeTimeHours} onChange={(e) => setFormData(prev => ({ ...prev, creativeTimeHours: Math.min(12, Math.max(0, parseInt(e.target.value) || 0)) }))} className="w-20 text-center text-2xl h-14 rounded-2xl bg-input border-border" />
                    <p className="text-xs text-muted-foreground mt-1">Hours</p>
                  </div>
                  <span className="text-2xl font-bold text-muted-foreground">:</span>
                  <div className="text-center">
                    <Input type="number" min={0} max={59} value={formData.creativeTimeMinutes} onChange={(e) => setFormData(prev => ({ ...prev, creativeTimeMinutes: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) }))} className="w-20 text-center text-2xl h-14 rounded-2xl bg-input border-border" />
                    <p className="text-xs text-muted-foreground mt-1">Minutes</p>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">{formatHoursMinutes(formData.creativeTimeHours * 60 + formData.creativeTimeMinutes)}</p>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6">
                <div className="text-center"><FaBriefcase className="w-12 h-12 text-accent mx-auto mb-4" /></div>
                <div className="flex items-center gap-3 justify-center">
                  <div className="text-center">
                    <Input type="number" min={0} max={12} value={formData.practicalTimeHours} onChange={(e) => setFormData(prev => ({ ...prev, practicalTimeHours: Math.min(12, Math.max(0, parseInt(e.target.value) || 0)) }))} className="w-20 text-center text-2xl h-14 rounded-2xl bg-input border-border" />
                    <p className="text-xs text-muted-foreground mt-1">Hours</p>
                  </div>
                  <span className="text-2xl font-bold text-muted-foreground">:</span>
                  <div className="text-center">
                    <Input type="number" min={0} max={59} value={formData.practicalTimeMinutes} onChange={(e) => setFormData(prev => ({ ...prev, practicalTimeMinutes: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) }))} className="w-20 text-center text-2xl h-14 rounded-2xl bg-input border-border" />
                    <p className="text-xs text-muted-foreground mt-1">Minutes</p>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">{formatHoursMinutes(formData.practicalTimeHours * 60 + formData.practicalTimeMinutes)}</p>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-6">
                <div className="text-center"><FaSmile className="w-12 h-12 text-accent mx-auto mb-4" /></div>
                <Textarea value={formData.moodNotes} onChange={(e) => setFormData(prev => ({ ...prev, moodNotes: e.target.value }))} placeholder="How are you feeling today? Any thoughts to share..." rows={4} className="rounded-2xl bg-input border-border resize-none" />
              </div>
            )}
          </div>
        ) : null}
      </ScrollArea>

      {!showResults && !showSuccess && (
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'history'>('dashboard')
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [checkInPeriod, setCheckInPeriod] = useState<CheckInPeriod>('morning')
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
  const [currentPeriod, setCurrentPeriod] = useState<CheckInPeriod>('morning')
  const [dailyMantra, setDailyMantra] = useState(MANTRAS[0])
  const [dailyWord, setDailyWord] = useState(WORDS_OF_DAY[0])

  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('creatr_session_id')
      if (stored) return stored
      const newId = crypto.randomUUID()
      localStorage.setItem('creatr_session_id', newId)
      return newId
    }
    return ''
  })

  useEffect(() => {
    setMounted(true)
    setCurrentPeriod(getCurrentPeriod())
    const dayIdx = getDayOfYear()
    setDailyMantra(MANTRAS[dayIdx % MANTRAS.length])
    setDailyWord(WORDS_OF_DAY[(dayIdx + 7) % WORDS_OF_DAY.length])
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

  useEffect(() => {
    if (mounted && typeof window !== 'undefined' && !sampleMode) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState))
      } catch { /* ignore */ }
    }
  }, [appState, mounted, sampleMode])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [appState.chatMessages, chatLoading])

  const displayState = sampleMode ? SAMPLE_STATE : appState

  const todayCheckIns = (() => {
    const today = getTodayStr()
    if (displayState.todayCheckIns?.date === today) return displayState.todayCheckIns
    return { date: today, morning: false, afternoon: false, evening: false }
  })()

  const latestMeds = (() => {
    const history = displayState.checkInHistory
    if (!Array.isArray(history) || history.length === 0) return []
    const latest = history[0]
    return Array.isArray(latest?.medications) ? latest.medications : []
  })()

  const medAlerts = latestMeds.length > 0 ? getMedAlerts(latestMeds) : []

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

  const handleCheckInComplete = useCallback((formData: any, agentResult: any) => {
    const entry: CheckInEntry = {
      id: generateId(), date: new Date().toISOString(), period: formData.period ?? currentPeriod,
      sleepQuality: formData.sleepQuality, energyLevel: formData.energyLevel,
      caffeineIntake: formData.caffeineIntake, alcoholIntake: formData.alcoholIntake,
      medications: Array.isArray(formData.medications) ? formData.medications : [],
      intimacy: formData.intimacy,
      creativeTime: formData.creativeTime, practicalTime: formData.practicalTime,
      moodNotes: formData.moodNotes,
      streakCount: agentResult?.streak_count, hpValue: agentResult?.hp_value,
      hpMax: agentResult?.hp_max, shieldCount: agentResult?.shield_count,
      patternInsights: Array.isArray(agentResult?.pattern_insights) ? agentResult.pattern_insights : [],
      motivationalMessage: agentResult?.motivational_message,
      statsSummary: agentResult?.stats_summary, moodAssessment: agentResult?.mood_assessment,
    }
    const newPatterns = Array.isArray(agentResult?.pattern_insights) ? agentResult.pattern_insights : []
    const entryPeriod: CheckInPeriod = formData.period ?? currentPeriod

    setAppState(prev => {
      const today = getTodayStr()
      const prevTodayCheckIns = prev.todayCheckIns?.date === today ? prev.todayCheckIns : { date: today, morning: false, afternoon: false, evening: false }
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
        todayCheckIns: { ...prevTodayCheckIns, [entryPeriod]: true },
      }
      newState.achievements = checkAchievements(newState)
      return newState
    })
  }, [checkAchievements, currentPeriod])

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
          ? parsed.suggestions.map((s: any) => ({ ...s, done: false, skipped: false })) : []
        setAppState(prev => ({
          ...prev, suggestions,
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

  const handleSendChat = useCallback(async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || chatLoading) return
    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: trimmed, timestamp: new Date().toISOString() }
    setAppState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, userMsg] }))
    setChatInput('')
    setChatLoading(true)
    setChatError(null)
    setActiveAgentId(ORACLE_AGENT_ID)
    const contextPrefix = `[Context: User streak=${displayState.streak}, energy=${displayState.stats.energyLevel ?? 'unknown'}, HP=${displayState.hp}/${displayState.hpMax}] `
    try {
      const result = await callAIAgent(contextPrefix + trimmed, ORACLE_AGENT_ID, { session_id: sessionId })
      if (result?.success) {
        const parsed = parseAgentResult(result)
        const assistantMsg: ChatMessage = {
          id: generateId(), role: 'assistant',
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

  const openCheckIn = (p: CheckInPeriod) => {
    setCheckInPeriod(p)
    setShowCheckIn(true)
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-xl font-extrabold tracking-tight">Creatr</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <FaFire className={cn('w-5 h-5', displayState.streak > 0 ? 'text-accent' : 'text-muted-foreground')} />
                {displayState.streak > 0 && <div className="absolute -inset-1 rounded-full bg-accent/20 animate-ping pointer-events-none" />}
              </div>
              <span className="font-bold text-sm">{displayState.streak}</span>
            </div>
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

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-lg mx-auto px-4 py-4">

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="relative space-y-6">
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[hsl(155,20%,8%)] to-transparent pointer-events-none" />

                {/* Streak Card */}
                <Card className="relative bg-card border-border shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center', displayState.streak > 0 ? 'bg-accent/20' : 'bg-muted')}>
                          <FaFire className={cn('w-8 h-8', displayState.streak > 0 ? 'text-accent' : 'text-muted-foreground')} />
                        </div>
                        {displayState.streak > 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shadow-lg shadow-accent/30">{displayState.streak}</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="font-sans text-2xl font-extrabold tracking-tight">
                          {displayState.streak > 0 ? `${displayState.streak}-Day Streak` : 'Start Your Streak'}
                        </h2>
                        <p className="text-sm text-muted-foreground">{displayState.streak > 0 ? 'Keep the momentum going!' : 'Complete a check-in to begin'}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <FaShieldAlt className="w-3.5 h-3.5 text-accent" />
                          <span className="text-xs font-semibold">HP {displayState.hp}/{displayState.hpMax}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]"><Shield className="w-3 h-3 mr-1" />{displayState.shields} Shields</Badge>
                      </div>
                      <Progress value={((displayState.hp) / (displayState.hpMax || 100)) * 100} className="h-3 rounded-full" />
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Mantra */}
                <Card className="relative bg-card/60 border-border shadow-md rounded-2xl">
                  <CardContent className="p-5 text-center">
                    <p className="text-sm font-medium italic text-foreground/80 leading-relaxed">"{dailyMantra?.quote}"</p>
                    <p className="text-xs text-muted-foreground mt-2">-- {dailyMantra?.author}</p>
                  </CardContent>
                </Card>

                {/* Word of the Day */}
                <div className="relative flex items-center gap-3 px-4 py-3 bg-card/40 rounded-2xl border border-border/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-accent">{dailyWord?.word}</span>
                      <span className="text-[11px] text-muted-foreground italic">/{dailyWord?.pronunciation}/</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{dailyWord?.definition}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="relative grid grid-cols-2 gap-3">
                  <StatCard icon={<FaBed className="w-4 h-4" />} value={displayState.stats.sleepQuality} label="Sleep Quality" unit="/10" />
                  <StatCard icon={<FaBolt className="w-4 h-4" />} value={displayState.stats.energyLevel} label="Energy Level" unit="/10" />
                  <StatCard icon={<FaCoffee className="w-4 h-4" />} value={displayState.stats.caffeineIntake} label="Espresso Shots" />
                  <StatCard icon={<FaMusic className="w-4 h-4" />} value={displayState.stats.creativeTime != null ? formatHoursMinutes(displayState.stats.creativeTime) : null} label="Creative Time" />
                  <StatCard icon={<FaBriefcase className="w-4 h-4" />} value={displayState.stats.practicalTime != null ? formatHoursMinutes(displayState.stats.practicalTime) : null} label="Practical Time" />
                  <StatCard icon={<FaSmile className="w-4 h-4" />} value={displayState.stats.mood ? (displayState.stats.mood.length > 15 ? displayState.stats.mood.substring(0, 15) + '...' : displayState.stats.mood) : null} label="Mood" />
                </div>

                {/* Check-In Period Buttons */}
                <div className="relative">
                  <h3 className="font-sans text-lg font-extrabold tracking-tight mb-3">Check-In</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { p: 'morning' as CheckInPeriod, icon: <FaSun className="w-5 h-5" />, label: 'Morning', time: '6am-12pm' },
                      { p: 'afternoon' as CheckInPeriod, icon: <FaCloudSun className="w-5 h-5" />, label: 'Afternoon', time: '12pm-6pm' },
                      { p: 'evening' as CheckInPeriod, icon: <FaMoon className="w-5 h-5" />, label: 'Evening', time: '6pm-12am' },
                    ]).map(({ p, icon, label, time }) => {
                      const isDone = todayCheckIns[p] === true
                      const isCurrent = currentPeriod === p
                      return (
                        <button key={p} onClick={() => openCheckIn(p)} disabled={sampleMode} className={cn('relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-300', isCurrent && !isDone ? 'border-accent/60 bg-accent/10' : 'border-border bg-card', isDone && 'opacity-70')}>
                          {isCurrent && !isDone && (
                            <Badge className="absolute -top-2 right-1 text-[9px] bg-accent text-accent-foreground px-1.5 py-0">Now</Badge>
                          )}
                          {isDone && (
                            <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-2xl">
                              <FaCheck className="w-6 h-6 text-green-400" />
                            </div>
                          )}
                          <div className="text-accent">{icon}</div>
                          <span className="text-xs font-semibold">{label}</span>
                          <span className="text-[10px] text-muted-foreground">{time}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Get Suggestions */}
                <div className="relative">
                  <Button onClick={handleGetSuggestions} disabled={suggestionsLoading} variant="outline" className="w-full h-14 rounded-2xl border-2 border-accent/30 hover:bg-accent/10 font-semibold text-sm">
                    {suggestionsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FaLightbulb className="w-4 h-4 mr-2 text-accent" />}
                    Get Suggestions
                  </Button>
                </div>

                {suggestionsError && (
                  <div className="relative p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{suggestionsError}</div>
                )}

                {/* Medication Alert Card */}
                {medAlerts.length > 0 && (
                  <Card className="relative bg-card border-border shadow-lg rounded-2xl">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FaPills className="w-4 h-4 text-accent" />Medication Status</CardTitle></CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {medAlerts.map((alert, i) => (
                        <div key={i} className={cn('flex items-center justify-between p-2 rounded-xl border text-xs', alert.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' : alert.status === 'wearing_off' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-muted/50 border-border text-muted-foreground')}>
                          <div>
                            <span className="font-semibold">{alert.med.name}</span>
                            <span className="ml-1 opacity-70">{alert.med.dosageMg}mg</span>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className={cn('text-[10px]', alert.status === 'active' ? 'border-green-500/30 text-green-400' : alert.status === 'wearing_off' ? 'border-amber-500/30 text-amber-400' : 'border-border text-muted-foreground')}>
                              {alert.status === 'active' ? 'Active' : alert.status === 'wearing_off' ? 'Wearing Off' : 'Worn Off'}
                            </Badge>
                            <p className="text-[10px] opacity-70 mt-0.5">{alert.wearOffTime}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Suggestions */}
                {(displayState.suggestions?.length ?? 0) > 0 && (
                  <div className="relative space-y-3">
                    <h3 className="font-sans text-lg font-extrabold tracking-tight flex items-center gap-2">
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
                              <Badge variant="secondary" className="text-[10px]"><Clock className="w-3 h-3 mr-1" />{sug?.time_estimate ?? ''}</Badge>
                              {sug?.priority && (
                                <Badge variant="secondary" className={cn('text-[10px]', sug.priority === 'high' ? 'text-amber-400' : 'text-muted-foreground')}>{sug.priority} priority</Badge>
                              )}
                            </div>
                            {sug?.reasoning && <p className="text-[11px] text-muted-foreground italic mb-2">{sug.reasoning}</p>}
                            {sug?.trending_relevance && sug.trending_relevance !== 'N/A' && (
                              <p className="text-[11px] text-accent/80 mb-3"><Sparkles className="w-3 h-3 inline mr-1" />{sug.trending_relevance}</p>
                            )}
                            {!isDone && !isSkipped && !sampleMode && (
                              <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => handleSuggestionAction(i, 'done')} className="rounded-xl h-8 bg-accent text-accent-foreground hover:bg-accent/90 text-xs flex-1"><FaCheck className="w-3 h-3 mr-1" /> Done</Button>
                                <Button size="sm" variant="outline" onClick={() => handleSuggestionAction(i, 'skip')} className="rounded-xl h-8 text-xs flex-1"><FaTimes className="w-3 h-3 mr-1" /> Skip</Button>
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

                {/* Latest Pattern */}
                {(displayState.patternHistory?.length ?? 0) > 0 && (
                  <Card className={cn('relative border-2 shadow-lg rounded-2xl', getSeverityColor(displayState.patternHistory?.[0]?.severity))}>
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

                {/* Motivational */}
                {displayState.motivationalMessage && (
                  <Card className="relative bg-accent/5 border-accent/20 shadow-lg rounded-2xl">
                    <CardContent className="p-6 text-center">
                      <Sparkles className="w-5 h-5 text-accent mx-auto mb-2" />
                      <p className="text-sm font-medium italic text-muted-foreground">{displayState.motivationalMessage}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Empty state */}
                {!sampleMode && displayState.streak === 0 && (displayState.checkInHistory?.length ?? 0) === 0 && (
                  <Card className="relative bg-card border-border shadow-lg rounded-2xl">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-sans text-lg font-extrabold tracking-tight mb-2">Welcome to Creatr</h3>
                      <p className="text-sm text-muted-foreground mb-4">Track your daily habits, get AI-powered coaching, and build momentum with streaks and HP.</p>
                      <p className="text-xs text-accent">Choose a check-in period above to start your journey</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="relative flex flex-col" style={{ minHeight: 'calc(100vh - 180px)' }}>
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[hsl(210,25%,8%)] to-transparent pointer-events-none" />

                <div className="relative flex items-center gap-3 p-3 bg-card rounded-2xl border border-border shadow-md mb-4">
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

                <ScrollArea className="relative flex-1 pr-1">
                  <div className="space-y-4 pb-4">
                    {(displayState.chatMessages?.length ?? 0) === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-sans text-lg font-extrabold tracking-tight mb-2">Chat with the Oracle</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Ask anything - life advice, creative ideas, or just vent. The Oracle listens and guides.</p>
                      </div>
                    )}

                    {Array.isArray(displayState.chatMessages) && displayState.chatMessages.map((msg) => (
                      <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[85%] rounded-2xl p-4', msg.role === 'user' ? 'bg-accent text-accent-foreground' : msg.isIntervention ? 'bg-card border-l-4 border-amber-500 shadow-lg' : 'bg-card border border-border shadow-md')}>
                          {msg.isIntervention && msg.interventionType !== 'none' && (
                            <Badge className="mb-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" />{msg.interventionType}</Badge>
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
                          {Array.isArray(msg.actionItems) && msg.actionItems.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              <p className="text-[10px] font-semibold uppercase text-accent">Action Items</p>
                              {msg.actionItems.map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs"><Target className="w-3 h-3 mt-0.5 text-accent shrink-0" /><span>{item}</span></div>
                              ))}
                            </div>
                          )}
                          {Array.isArray(msg.topicsExplored) && msg.topicsExplored.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {msg.topicsExplored.map((t, i) => <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>)}
                            </div>
                          )}
                          {msg.conversationMood && msg.role === 'assistant' && (
                            <p className="text-[10px] text-muted-foreground mt-2 italic">Mood: {msg.conversationMood}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground/60 mt-2">{formatTime(msg.timestamp)}</p>
                        </div>
                      </div>
                    ))}

                    {Array.isArray(displayState.chatMessages) && displayState.chatMessages.length > 0 && displayState.chatMessages[displayState.chatMessages.length - 1]?.isIntervention && !chatLoading && (
                      <div className="flex gap-2 justify-start pl-2">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs border-accent/30 hover:bg-accent/10" onClick={() => { setChatInput("You're right, let me focus"); }}>You are right, let me focus</Button>
                        <Button size="sm" variant="outline" className="rounded-xl text-xs border-border" onClick={() => { setChatInput("I hear you, but I need to explore this"); }}>I need to explore this</Button>
                      </div>
                    )}

                    {chatLoading && (
                      <div className="flex justify-start"><div className="bg-card border border-border rounded-2xl shadow-md"><TypingIndicator /></div></div>
                    )}

                    {chatError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{chatError}</div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                <div className="relative sticky bottom-20 bg-background pt-2">
                  <div className="flex items-center gap-2">
                    <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask the Oracle anything..." className="flex-1 rounded-2xl h-12 bg-card border-border pr-12" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }} disabled={chatLoading || sampleMode} />
                    <Button onClick={handleSendChat} disabled={!chatInput.trim() || chatLoading || sampleMode} size="icon" className="rounded-2xl w-12 h-12 bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
                      {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="relative space-y-4">
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[hsl(28,20%,7%)] to-transparent pointer-events-none" />

                <Tabs value={historyTab} onValueChange={(v) => setHistoryTab(v as 'logs' | 'patterns' | 'achievements')}>
                  <TabsList className="relative w-full bg-card border border-border rounded-2xl h-11">
                    <TabsTrigger value="logs" className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"><FaHistory className="w-3.5 h-3.5 mr-1.5" />Logs</TabsTrigger>
                    <TabsTrigger value="patterns" className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"><AlertTriangle className="w-3.5 h-3.5 mr-1.5" />Patterns</TabsTrigger>
                    <TabsTrigger value="achievements" className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"><FaTrophy className="w-3.5 h-3.5 mr-1.5" />Achievements</TabsTrigger>
                  </TabsList>

                  <TabsContent value="logs" className="relative mt-4 space-y-3">
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
                      const entryMeds = Array.isArray(entry.medications) ? entry.medications : []
                      return (
                        <Card key={entry.id} className="bg-card border-border shadow-lg rounded-2xl">
                          <CardContent className="p-4">
                            <button onClick={() => setExpandedLogId(isExpanded ? null : entry.id)} className="w-full flex items-center justify-between">
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold">{formatDate(entry.date)}</p>
                                  {entry.period && <Badge variant="secondary" className="text-[10px]">{entry.period}</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">Sleep: {entry.sleepQuality}/10 | Energy: {entry.energyLevel}/10 | Creative: {formatHoursMinutes(entry.creativeTime)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {(entry.streakCount ?? 0) > 0 && (
                                  <Badge variant="secondary" className="text-[10px]"><FaFire className="w-2.5 h-2.5 mr-1 text-accent" />{entry.streakCount}</Badge>
                                )}
                                {isExpanded ? <FaChevronUp className="w-3 h-3 text-muted-foreground" /> : <FaChevronDown className="w-3 h-3 text-muted-foreground" />}
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-border space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Sleep:</span> <span className="font-semibold">{entry.sleepQuality}/10</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Energy:</span> <span className="font-semibold">{entry.energyLevel}/10</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Espresso:</span> <span className="font-semibold">{entry.caffeineIntake} shots</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Alcohol:</span> <span className="font-semibold">{entry.alcoholIntake} drinks</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Meds:</span> <span className="font-semibold">{entryMeds.length > 0 ? entryMeds.map(m => m.name).join(', ') : 'None'}</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Intimacy:</span> <span className="font-semibold">{entry.intimacy ? 'Yes' : 'No'}</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Creative:</span> <span className="font-semibold">{formatHoursMinutes(entry.creativeTime)}</span></div>
                                  <div className="bg-muted/50 rounded-xl p-2"><span className="text-muted-foreground">Practical:</span> <span className="font-semibold">{formatHoursMinutes(entry.practicalTime)}</span></div>
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
                                {entry.statsSummary && <p className="text-xs text-muted-foreground">{entry.statsSummary}</p>}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </TabsContent>

                  <TabsContent value="patterns" className="relative mt-4 space-y-3">
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

                  <TabsContent value="achievements" className="relative mt-4">
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

        {/* AGENT STATUS FOOTER */}
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

        {/* BOTTOM TAB BAR */}
        <nav className="sticky bottom-0 z-40 bg-background/90 backdrop-blur-md border-t border-border">
          <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">
            <button onClick={() => setActiveTab('dashboard')} className={cn('flex flex-col items-center gap-1 transition-colors', activeTab === 'dashboard' ? 'text-[hsl(155,50%,50%)]' : 'text-muted-foreground hover:text-foreground')}>
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium">Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('chat')} className={cn('flex flex-col items-center gap-1 transition-colors', activeTab === 'chat' ? 'text-[hsl(210,60%,55%)]' : 'text-muted-foreground hover:text-foreground')}>
              <MessageCircle className="w-5 h-5" />
              <span className="text-[10px] font-medium">Chat</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={cn('flex flex-col items-center gap-1 transition-colors', activeTab === 'history' ? 'text-[hsl(28,75%,55%)]' : 'text-muted-foreground hover:text-foreground')}>
              <Clock className="w-5 h-5" />
              <span className="text-[10px] font-medium">History</span>
            </button>
          </div>
        </nav>

        {/* CHECK-IN MODAL */}
        <CheckInModal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} onComplete={handleCheckInComplete} sessionId={sessionId} period={checkInPeriod} />
      </div>
    </ErrorBoundary>
  )
}
