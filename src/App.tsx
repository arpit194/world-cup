import confetti from 'canvas-confetti'
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { GROUPS, TEAMS, TEAMS_BY_GROUP } from './teams'

// ── Types ──────────────────────────────────────────────
type EventType = 'goal' | 'yellow' | 'red'

interface MatchEvent {
  id: string
  type: EventType
  team: 'home' | 'away'
  player: string
  minute: number
  addedTime: number   // +N minutes, 0 = none
  ownGoal: boolean    // only relevant when type === 'goal'
  detail: string
}

interface MatchConfig {
  homeTeam: string
  homeInitials: string
  awayTeam: string
  awayInitials: string
  stage: string
  group: string
  aspectRatio: string
  enableRecording: boolean
  events: MatchEvent[]
}

// ── Constants ──────────────────────────────────────────
const EVENT_ICON: Record<EventType, string> = { goal: '⚽', yellow: '🟨', red: '🟥' }
const EVENT_LABEL: Record<EventType, string> = { goal: 'Goal', yellow: 'Yellow Card', red: 'Red Card' }

const DEFAULT_CONFIG: MatchConfig = {
  homeTeam: '',
  homeInitials: '',
  awayTeam: '',
  awayInitials: '',
  stage: 'GROUP STAGE',
  group: '',
  aspectRatio: '9/16',
  enableRecording: false,
  events: [],
}

const STORAGE_KEY = 'wc2026_config'

function loadConfig(): MatchConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_CONFIG
}

function saveConfig(c: MatchConfig) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)) } catch {}
}

function getTeam(name: string) {
  return TEAMS.find(t => t.name === name)
}

function getTeamColor(name: string): string {
  return getTeam(name)?.color ?? '#444'
}

function getTeamColor2(name: string): string {
  return getTeam(name)?.color2 ?? getTeamColor(name)
}

function getTeamIso(name: string): string | undefined {
  return getTeam(name)?.iso
}

function fmtMinute(e: MatchEvent) {
  return e.addedTime > 0 ? `${e.minute}+${e.addedTime}` : `${e.minute}`
}

// Derive scores from goal events; own goals count for the opponent
function calcScores(events: MatchEvent[]) {
  const goals = events.filter(e => e.type === 'goal')
  return {
    home: goals.filter(e => e.ownGoal ? e.team === 'away' : e.team === 'home').length,
    away: goals.filter(e => e.ownGoal ? e.team === 'home' : e.team === 'away').length,
  }
}

// ── Sub-components ─────────────────────────────────────
function TeamCircle({ color, initials, iso }: { color: string; initials: string; iso?: string }) {
  const [imgFailed, setImgFailed] = useState(false)
  const flagUrl = iso ? `https://flagcdn.com/w80/${iso}.png` : null

  if (flagUrl && !imgFailed) {
    return (
      <div className="flag-img-wrap" style={{ background: color }}>
        <img
          src={flagUrl}
          alt={initials}
          className="flag-img"
          onError={() => setImgFailed(true)}
        />
      </div>
    )
  }

  return (
    <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="36" cy="36" r="36" fill={color} />
      <text x="36" y="36" dominantBaseline="central" textAnchor="middle"
        fill="#fff" fontSize="16" fontWeight="900"
        fontFamily="Barlow Condensed, Arial Narrow, Arial, sans-serif" letterSpacing="1">
        {initials}
      </text>
      <circle cx="36" cy="36" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
    </svg>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="cfg-field-row">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  )
}

// ── Team select dropdown ───────────────────────────────
function TeamSelect({ id, value, onChange }: { id: string; value: string; onChange: (name: string) => void }) {
  return (
    <select id={id} className="cfg-select" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">— Select team —</option>
      {GROUPS.map(g => (
        <optgroup key={g} label={`Group ${g}`}>
          {TEAMS_BY_GROUP[g].map(t => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

// ── Configurator ───────────────────────────────────────
function Configurator({ config, onSave, onClose }: {
  config: MatchConfig
  onSave: (c: MatchConfig) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<MatchConfig>(structuredClone(config))

  const selectTeam = (side: 'home' | 'away', name: string) => {
    const t = TEAMS.find(t => t.name === name)
    if (!t) return
    if (side === 'home') {
      setDraft(d => ({
        ...d,
        homeTeam: t.name,
        homeInitials: t.initials,
        group: d.stage === 'GROUP STAGE' ? `GROUP ${t.group}` : d.group,
      }))
    } else {
      setDraft(d => ({ ...d, awayTeam: t.name, awayInitials: t.initials }))
    }
  }

  const addEvent = () => {
    const ev: MatchEvent = { id: Date.now().toString(), type: 'goal', team: 'home', player: '', minute: 1, addedTime: 0, ownGoal: false, detail: '' }
    setDraft(d => ({ ...d, events: [...d.events, ev] }))
  }

  const updateEvent = (id: string, key: keyof MatchEvent, val: string | number | boolean) =>
    setDraft(d => ({ ...d, events: d.events.map(e => e.id === id ? { ...e, [key]: val } : e) }))

  const removeEvent = (id: string) =>
    setDraft(d => ({ ...d, events: d.events.filter(e => e.id !== id) }))

  const handleSave = () => {
    onSave({ ...draft, events: [...draft.events].sort((a, b) => a.minute - b.minute) })
    onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const scores = calcScores(draft.events)

  return (
    <div className="cfg-overlay" role="dialog" aria-modal="true" aria-label="Match configurator">
      <div className="cfg-panel">

        <div className="cfg-header">
          <div className="cfg-title-row">
            <span className="cfg-title">MATCH CONFIGURATOR</span>
            <kbd className="cfg-shortcut">ESC to close</kbd>
          </div>
          <div className="cfg-hint">Press <kbd>E</kbd> anywhere to toggle</div>
        </div>

        <div className="cfg-body">

          {/* Teams */}
          <section className="cfg-section">
            <h2 className="cfg-section-title">Teams</h2>
            <div className="cfg-teams-grid">

              <div className="cfg-team-block">
                <div className="cfg-team-label home-label">Home · {scores.home} goals</div>
                <Field label="Team" id="home-team-select">
                  <TeamSelect id="home-team-select" value={draft.homeTeam} onChange={name => selectTeam('home', name)} />
                </Field>
              </div>

              <div className="cfg-team-block">
                <div className="cfg-team-label away-label">Away · {scores.away} goals</div>
                <Field label="Team" id="away-team-select">
                  <TeamSelect id="away-team-select" value={draft.awayTeam} onChange={name => selectTeam('away', name)} />
                </Field>
              </div>

            </div>
          </section>

          {/* Match info */}
          <section className="cfg-section">
            <h2 className="cfg-section-title">Match Info</h2>
            <Field label="Stage" id="match-stage">
              <select id="match-stage" className="cfg-select" value={draft.stage}
                onChange={e => {
                  const stage = e.target.value
                  const homeTeam = TEAMS.find(t => t.name === draft.homeTeam)
                  setDraft(d => ({
                    ...d,
                    stage,
                    group: stage === 'GROUP STAGE' ? `GROUP ${homeTeam?.group ?? 'A'}` : '',
                  }))
                }}>
                <option value="GROUP STAGE">Group Stage</option>
                <option value="ROUND OF 32">Round of 32</option>
                <option value="ROUND OF 16">Round of 16</option>
                <option value="QUARTER-FINAL">Quarter-Final</option>
                <option value="SEMI-FINAL">Semi-Final</option>
                <option value="THIRD PLACE">Third Place</option>
                <option value="FINAL">Final</option>
              </select>
            </Field>
            {draft.stage === 'GROUP STAGE' && (
              <div className="cfg-group-display">
                <span className="cfg-group-label">Group</span>
                <span className="cfg-group-value">{draft.group}</span>
              </div>
            )}
            <div className="cfg-field-row">
              <label className="cfg-label" htmlFor="ar-w">Aspect Ratio</label>
              <div className="cfg-aspect-inputs">
                <input id="ar-w" type="number" className="cfg-score-input" min="1" step="0.5"
                  value={draft.aspectRatio.split('/')[0]}
                  onChange={e => setDraft(d => ({ ...d, aspectRatio: `${e.target.value}/${d.aspectRatio.split('/')[1]}` }))} />
                <span className="cfg-aspect-sep">:</span>
                <input type="number" className="cfg-score-input" min="1" step="0.5"
                  value={draft.aspectRatio.split('/')[1]}
                  onChange={e => setDraft(d => ({ ...d, aspectRatio: `${d.aspectRatio.split('/')[0]}/${e.target.value}` }))} />
              </div>
            </div>
            <label className="cfg-checkbox-row" htmlFor="enable-recording">
              <input id="enable-recording" type="checkbox" checked={draft.enableRecording}
                onChange={e => setDraft(d => ({ ...d, enableRecording: e.target.checked }))} />
              <span>Record video on play</span>
            </label>
          </section>

          {/* Events */}
          <section className="cfg-section">
            <div className="cfg-section-header">
              <h2 className="cfg-section-title">Events</h2>
            </div>
            <div className="cfg-events-list">
              {draft.events.length === 0 && (
                <div className="cfg-empty">No events yet. Click "+ Add Event" to add one.</div>
              )}
              {draft.events.map((ev) => (
                <div key={ev.id} className={`cfg-event-card cfg-event-card--${ev.type}`}>
                  <div className="cfg-event-top">
                    <span className="cfg-event-icon">{EVENT_ICON[ev.type]}</span>
                    <select value={ev.type} onChange={e => updateEvent(ev.id, 'type', e.target.value)} className="cfg-select">
                      <option value="goal">⚽ Goal</option>
                      <option value="yellow">🟨 Yellow Card</option>
                      <option value="red">🟥 Red Card</option>
                    </select>
                    <select value={ev.team} onChange={e => updateEvent(ev.id, 'team', e.target.value)} className="cfg-select cfg-select--team">
                      <option value="home">Home ({draft.homeTeam})</option>
                      <option value="away">Away ({draft.awayTeam})</option>
                    </select>
                    <button type="button" className="cfg-remove-btn" onClick={() => removeEvent(ev.id)} aria-label="Remove event">✕</button>
                  </div>
                  <div className="cfg-event-fields">
                    <Field label="Player" id={`ev-player-${ev.id}`}>
                      <input id={`ev-player-${ev.id}`} value={ev.player} onChange={e => updateEvent(ev.id, 'player', e.target.value)} placeholder="Player name" />
                    </Field>
                    <div className="cfg-minute-row">
                      <Field label="Minute" id={`ev-minute-${ev.id}`}>
                        <input id={`ev-minute-${ev.id}`} type="number" min={1} max={90} value={ev.minute}
                          onChange={e => updateEvent(ev.id, 'minute', parseInt(e.target.value, 10) || 1)} className="cfg-score-input" />
                      </Field>
                      <Field label="+Added" id={`ev-added-${ev.id}`}>
                        <input id={`ev-added-${ev.id}`} type="number" min={0} max={20} value={ev.addedTime}
                          onChange={e => updateEvent(ev.id, 'addedTime', parseInt(e.target.value, 10) || 0)} className="cfg-score-input" />
                      </Field>
                    </div>
                    <Field label="Detail" id={`ev-detail-${ev.id}`}>
                      <input id={`ev-detail-${ev.id}`} value={ev.detail} onChange={e => updateEvent(ev.id, 'detail', e.target.value)} placeholder="e.g. Left foot finish" />
                    </Field>
                    {ev.type === 'goal' && (
                      <label className="cfg-checkbox-row" htmlFor={`ev-og-${ev.id}`}>
                        <input id={`ev-og-${ev.id}`} type="checkbox" checked={ev.ownGoal}
                          onChange={e => updateEvent(ev.id, 'ownGoal', e.target.checked)} />
                        Own Goal
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="cfg-add-btn cfg-add-btn--below" onClick={addEvent}>+ Add Event</button>
          </section>
        </div>

        <div className="cfg-footer">
          <button type="button" className="cfg-clear-btn" onClick={() => {
            if (window.confirm('Clear all match data? This cannot be undone.')) {
              setDraft(structuredClone(DEFAULT_CONFIG))
            }
          }}>Clear</button>
          <button type="button" className="cfg-cancel-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="cfg-save-btn" onClick={handleSave}>Apply to Match</button>
        </div>

      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────
// ── Playback types ─────────────────────────────────────
type SpotlightEvent =
  | { kind: 'match'; event: MatchEvent }
  | { kind: 'matchstart' }
  | { kind: 'halftime' }
  | { kind: 'fulltime' }

// 2 match minutes = 1 real second → tick every 100ms = 0.2 match minutes
const TICK_MS = 100
const MINS_PER_TICK = 0.5   // 5 mins/s

export default function App() {
  const [config, setConfig] = useState<MatchConfig>(loadConfig)
  const [showConfig, setShowConfig] = useState(false)

  // Playback state
  const [playing, setPlaying] = useState(false)
  const [currentMinute, setCurrentMinute] = useState(0)
  const [spotlight, setSpotlight] = useState<SpotlightEvent | null>(null)
  const pausedForRef = useRef(0)
  const [flashType, setFlashType] = useState<EventType | null>(null)

  // Track which event minutes have already fired
  const firedRef = useRef<Set<string>>(new Set())
  const halfFiredRef = useRef(false)
  const fullFiredRef = useRef(false)
  const pausedRef = useRef(false) // sync ref so interval sees pause immediately
  const [lastFiredType, setLastFiredType] = useState<EventType | null>(null)
  const eventsRef = useRef(config.events)
  useEffect(() => { eventsRef.current = config.events }, [config.events])

  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])

  const stopRecording = useCallback((delayMs = 0) => {
    const stop = () => {
      const mr = mediaRecorderRef.current
      if (!mr || mr.state === 'inactive') return
      mr.stop()
    }
    if (delayMs > 0) setTimeout(stop, delayMs)
    else stop()
  }, [])

  // Returns true if recording started successfully, false if cancelled/denied
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60 } },
        audio: true,
        // @ts-expect-error not in all TS lib versions yet
        preferCurrentTab: true,
      })
      const chunks: Blob[] = []
      recordingChunksRef.current = chunks
      // Pick best available codec: VP9 at high bitrate, fall back to default
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')
        ? 'video/webm; codecs=vp9,opus'
        : 'video/webm'
      const mr = new MediaRecorder(displayStream, { mimeType, videoBitsPerSecond: 8_000_000 })
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      mr.onstop = () => {
        for (const t of displayStream.getTracks()) t.stop()
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `match-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
        mediaRecorderRef.current = null
      }
      mediaRecorderRef.current = mr
      mr.start(100)
      return true
    } catch {
      return false
    }
  }, [])

  const resetPlayback = useCallback(() => {
    setPlaying(false)
    setCurrentMinute(0)
    setSpotlight(null)
    pausedRef.current = false
    pausedForRef.current = 0
    firedRef.current = new Set()
    halfFiredRef.current = false
    fullFiredRef.current = false
    setLastFiredType(null)
  }, [])

  // Restart when config changes
  useEffect(() => { resetPlayback() }, [resetPlayback])

  // Main tick
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      if (pausedRef.current) {
        pausedForRef.current -= TICK_MS
        if (pausedForRef.current <= 0) {
          pausedRef.current = false
          pausedForRef.current = 0
          setSpotlight(null)
          setFlashType(null)
          setTimeout(() => setLastFiredType(null), 1500)
        }
        return
      }

      setCurrentMinute(m => {
        const next = parseFloat((m + MINS_PER_TICK).toFixed(2))

        const events = eventsRef.current
        const pendingAny = events.some(e => !firedRef.current.has(e.id))

        // "First-half added time" events: base minute is 45, have addedTime > 0
        // These display as 45+N but their effective minute may interleave with second-half events
        // Halftime should fire only after ALL events with base minute <= 45 are shown
        const pendingHalfTimeBlock = events.some(
          e => e.minute <= 45 && e.addedTime === 0 && !firedRef.current.has(e.id)
        )
        // Added-time events at 45 — sorted by effective minute, fire when clock reaches them
        const pendingFirstHalfAdded = events.some(
          e => e.minute === 45 && e.addedTime > 0 && !firedRef.current.has(e.id)
        )

        // During first-half added time zone (clock past 45, halftime not fired):
        const inFirstHalfAdded = next > 45 && !halfFiredRef.current

        // Fire match events in effective-minute order.
        // Second-half events (minute > 45) must wait until halftime has fired.
        const triggered = [...events]
          .sort((a, b) => (a.minute + a.addedTime) - (b.minute + b.addedTime))
          .find(e => {
            if (firedRef.current.has(e.id)) return false
            if (next < (e.minute + e.addedTime)) return false
            // Block second-half events until halftime fires
            if (e.minute > 45 && !halfFiredRef.current) return false
            return true
          })

        const startPause = () => { pausedRef.current = true; pausedForRef.current = 3000 }

        if (triggered) {
          firedRef.current.add(triggered.id)
          setSpotlight({ kind: 'match', event: triggered })
          startPause()
          return inFirstHalfAdded || next > 90 ? next : Math.min(next, 90)
        }

        // Halftime: after all first-half events shown AND clock is 1 min past the last one
        const maxFirstHalfMinute = events
          .filter(e => e.minute <= 45)
          .reduce((max, e) => Math.max(max, e.minute + e.addedTime), 45)
        if (next >= maxFirstHalfMinute + 1 && !halfFiredRef.current && !pendingHalfTimeBlock && !pendingFirstHalfAdded) {
          halfFiredRef.current = true
          setSpotlight({ kind: 'halftime' })
          startPause()
          return next
        }

        // Keep clock advancing through added-time zone (display caps at 45 via displayTime)
        if (inFirstHalfAdded) return next

        // Full time: after all events fired AND 1 minute past the last event minute
        const maxEventMinute = events.reduce((max, e) => Math.max(max, e.minute + e.addedTime), 90)
        if (next >= maxEventMinute + 1 && !fullFiredRef.current && !pendingAny) {
          fullFiredRef.current = true
          setSpotlight({ kind: 'fulltime' })
          startPause()
          setPlaying(false)
          return next
        }

        // Allow clock past 90 while second-half added time events pending, or until fulltime fires
        const maxEventMinute2 = events.reduce((max, e) => Math.max(max, e.minute + e.addedTime), 90)
        if (next > 90 && !fullFiredRef.current && next < maxEventMinute2 + 1) return next

        return Math.min(next, 90)
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [playing])

  // Stop recording 3s after fulltime card appears
  useEffect(() => {
    if (spotlight?.kind === 'fulltime') stopRecording(3000)
  }, [spotlight, stopRecording])

  const toggleConfig = useCallback(() => setShowConfig(v => !v), [])
  const togglePlay = useCallback(async () => {
    if (!playing) {
      if (config.enableRecording) {
        const granted = await startRecording()
        if (!granted) return // user cancelled picker, don't start playback
      }
      if (currentMinute >= 90) {
        resetPlayback()
        setTimeout(() => {
          setSpotlight({ kind: 'matchstart' })
          pausedRef.current = true; pausedForRef.current = 3000
          setPlaying(true)
        }, 50)
        return
      }
      if (currentMinute === 0) {
        setSpotlight({ kind: 'matchstart' })
        pausedRef.current = true; pausedForRef.current = 3000
      }
      setPlaying(true)
    } else {
      setPlaying(false)
    }
  }, [playing, currentMinute, resetPlayback, startRecording, config.enableRecording])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.metaKey || e.ctrlKey || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'e') toggleConfig()
      if (e.key === 'p') togglePlay()
      if (e.key === 'r') resetPlayback()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleConfig, togglePlay, resetPlayback])

  // Fire confetti / flash / audio when spotlight changes
  const prevSpotlightId = useRef<string | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
  }, [])

  const playAudio = useCallback((src: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }
    const audio = new Audio(src)
    audio.volume = 0.8
    currentAudioRef.current = audio
    audio.play().catch(() => {})
  }, [])

  useEffect(() => {
    if (!spotlight) {
      prevSpotlightId.current = null
      stopAudio()
      return
    }

    if (spotlight.kind === 'matchstart') {
      prevSpotlightId.current = spotlight.kind
      setFlashType(null)
      playAudio('/Half_Time.mp3')
      return
    }
    if (spotlight.kind === 'halftime') {
      prevSpotlightId.current = spotlight.kind
      setFlashType(null)
      playAudio('/Half_Time.mp3')
      return
    }
    if (spotlight.kind === 'fulltime') {
      prevSpotlightId.current = spotlight.kind
      setFlashType(null)
      playAudio('/Final_wistle.mp3')
      return
    }

    const ev = spotlight.event
    if (ev.id === prevSpotlightId.current) return
    prevSpotlightId.current = ev.id

    setFlashType(ev.type)
    setLastFiredType(ev.type)

    playAudio(ev.type === 'goal' ? '/GOAL.mp3' : '/card.mp3')

    if (ev.type === 'goal') {
      // Own goal scores for the opponent, so celebrate with opponent's color
      const scoringTeam = ev.ownGoal
        ? (ev.team === 'home' ? 'away' : 'home')
        : ev.team
      const teamColor = scoringTeam === 'home' ? getTeamColor(config.homeTeam) : getTeamColor(config.awayTeam)
      const teamColor2 = scoringTeam === 'home' ? getTeamColor2(config.homeTeam) : getTeamColor2(config.awayTeam)
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: [teamColor, teamColor2] })
      setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.4 }, colors: [teamColor, teamColor2] }), 400)
    }
  }, [spotlight, config.homeTeam, config.awayTeam, playAudio, stopAudio])

  // Derive display values
  const displayTime = (() => {
    const m = currentMinute
    if (m > 90) return `90+${Math.floor(m - 90)}`
    if (m > 45 && !halfFiredRef.current) return `45+${Math.floor(m - 45)}`
    return `${Math.floor(m)}`
  })()
  // During playback use fired set; outside playback show all events
  const eventsUpToNow = (playing || currentMinute > 0)
    ? config.events.filter(e => firedRef.current.has(e.id))
    : config.events
  const scores = calcScores(eventsUpToNow)
  const homeColor = getTeamColor(config.homeTeam)
  const homeColor2 = getTeamColor2(config.homeTeam)
  const awayColor = getTeamColor(config.awayTeam)
  const awayColor2 = getTeamColor2(config.awayTeam)
  const homeIso = getTeamIso(config.homeTeam)
  const awayIso = getTeamIso(config.awayTeam)
  const getTeamName = (team: 'home' | 'away') => team === 'home' ? config.homeTeam : config.awayTeam

  // What to show in the spotlight
  // During playback: only show when explicitly paused on an event
  // Outside playback: show the latest event that has occurred
  const displaySpotlight = spotlight ?? (
    (playing || currentMinute > 0)
      ? null
      : eventsUpToNow.length > 0
        ? { kind: 'match' as const, event: eventsUpToNow[eventsUpToNow.length - 1] }
        : null
  )

  return (
    <>
      <div className="page" style={{ width: `calc(100svh * ${config.aspectRatio})` }}>
        <div className="card">
          <div className="content">

            <div className="header">
              <button type="button" className="fifa-logo-btn" onClick={toggleConfig}>
                <img src="/FIFA-2026-World-Cup-Logo.png" alt="FIFA World Cup 2026" className="fifa-logo" />
              </button>
              <h1 className="tournament-title">WORLD CUP <span className="year">2026</span></h1>
            </div>

            <div className="score-bar">
              <div className="flag-wrap flag-wrap--home">
                <TeamCircle color={homeColor} initials={config.homeInitials} iso={homeIso} />
              </div>
              <div className="team-bar team-bar--home" style={{ '--c1': homeColor, '--c2': homeColor2 } as React.CSSProperties}>
                <span className="team-name">{config.homeTeam}</span>
              </div>
              <button type="button" className="score-box" onClick={togglePlay}>
                <span className="score-num">{scores.home}</span>
                <span className="score-sep">:</span>
                <span className="score-num">{scores.away}</span>
              </button>
              <div className="team-bar team-bar--away" style={{ '--c1': awayColor2, '--c2': awayColor } as React.CSSProperties}>
                <span className="team-name">{config.awayTeam}</span>
              </div>
              <div className="flag-wrap flag-wrap--away">
                <TeamCircle color={awayColor} initials={config.awayInitials} iso={awayIso} />
              </div>
            </div>

            <div className="stage-label">
              <span className="stage-line" />
              <span className="stage-text">
                {config.stage}
                {config.stage === 'GROUP STAGE' && config.group ? <>&nbsp;&nbsp;•&nbsp;&nbsp;{config.group}</> : null}
              </span>
              <span className="stage-line" />
            </div>

            <div className="pitch-area">
              {displaySpotlight ? (
                <div className={[
                  'event-spotlight',
                  flashType ? `event-spotlight--flash-${flashType}` : '',
                  displaySpotlight.kind === 'halftime' ? 'event-spotlight--flash-halftime' : '',
                  displaySpotlight.kind === 'fulltime' ? 'event-spotlight--flash-fulltime' : '',
                  displaySpotlight.kind === 'matchstart' ? 'event-spotlight--flash-matchstart' : '',
                ].filter(Boolean).join(' ')}>
                  {displaySpotlight.kind === 'matchstart' ? (
                    <div className="spotlight-main spotlight-main--centered">
                      <span className="spotlight-halftime-icon">🏟</span>
                      <span className="spotlight-halftime-text">KICK OFF</span>
                      <span className="spotlight-halftime-score">{config.homeTeam} vs {config.awayTeam}</span>
                    </div>
                  ) : displaySpotlight.kind === 'halftime' ? (
                    <div className="spotlight-main spotlight-main--centered">
                      <span className="spotlight-halftime-icon">⏱</span>
                      <span className="spotlight-halftime-text">HALF TIME</span>
                      <span className="spotlight-halftime-score">{scores.home} – {scores.away}</span>
                    </div>
                  ) : displaySpotlight.kind === 'fulltime' ? (
                    <div className="spotlight-main spotlight-main--centered">
                      <span className="spotlight-halftime-icon">🏁</span>
                      <span className="spotlight-halftime-text">FULL TIME</span>
                      <span className="spotlight-halftime-score">{scores.home} – {scores.away}</span>
                    </div>
                  ) : (
                    <>
                      <div className="spotlight-badge">
                        <span className="spotlight-badge-line" />
                        <span className="spotlight-badge-text">Latest Event</span>
                        <span className="spotlight-badge-line" />
                      </div>
                      <div className={`spotlight-type-banner spotlight-type-banner--${displaySpotlight.event.type}`}>
                        {EVENT_LABEL[displaySpotlight.event.type]}
                      </div>
                      <div className="spotlight-main">
                        <div className="spotlight-icon-wrap">
                          <div className={`spotlight-icon-glow spotlight-icon-glow--${displaySpotlight.event.type}`} />
                          <span className="spotlight-icon">{EVENT_ICON[displaySpotlight.event.type]}</span>
                        </div>
                        <div className="spotlight-text">
                          <span className="spotlight-team">{getTeamName(displaySpotlight.event.team)}</span>
                          <span className="spotlight-player">
                            {displaySpotlight.event.player || '—'}
                            {displaySpotlight.event.ownGoal && <span className="own-goal-tag">OG</span>}
                          </span>
                          <span className="spotlight-sub">{displaySpotlight.event.detail}</span>
                        </div>
                      </div>
                      <div className="spotlight-minute-row">
                        <span className="spotlight-minute">{fmtMinute(displaySpotlight.event)}</span>
                        <span className="spotlight-minute-mark">'</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="pitch-empty">
                  {(playing || currentMinute > 0)
                    ? <span className="pitch-minute-display">{displayTime}'</span>
                    : <>Press <kbd className="key-hint">E</kbd> to configure · <kbd className="key-hint">P</kbd> to play</>
                  }
                </div>
              )}
            </div>

            <div className="bottom-section">
              <div className="timeline-wrapper">
                <div className="timeline-row">
                  <span className="time-label">0'</span>
                  <div className="timeline-track">
                    {eventsUpToNow.map((e) => {
                      // Added-time events stack at their base minute (45 or 90)
                      const pinMinute = e.addedTime > 0 ? e.minute : (e.minute + e.addedTime)
                      const left = `${(Math.min(pinMinute, 90) / 90) * 100}%`
                      // Stack multiple added-time events at same base minute vertically
                      const addedAtSameBase = e.addedTime > 0
                        ? eventsUpToNow.filter(x => x.addedTime > 0 && x.minute === e.minute)
                        : []
                      const stackIndex = addedAtSameBase.indexOf(e)
                      const yOffset = e.addedTime > 0 ? stackIndex * -14 : 0
                      return (
                        <div key={e.id}
                          className={`track-marker track-marker--${e.type}`}
                          style={{ left, transform: `translate(-50%, calc(-50% + ${yOffset}px))` }}
                          title={`${e.player} ${fmtMinute(e)}'`}
                        >
                          {e.type === 'goal' ? '⚽' : e.type === 'yellow' ? '🟨' : '🟥'}
                        </div>
                      )
                    })}
                    {/* Timeline indicator: shows minute when running, event icon during pause */}
                    {(playing || currentMinute > 0) && (() => {
                      // Cap dot position: added time stays pinned at 45 or 90
                      const dotMinute = currentMinute > 90 ? 90 : currentMinute > 45 && !halfFiredRef.current ? 45 : Math.min(currentMinute, 90)
                      const dotLeft = `${(dotMinute / 90) * 100}%`
                      const pausedMatchEvent = spotlight?.kind === 'match' ? spotlight.event : null
                      if (pausedMatchEvent) {
                        // Show event icon during event pause
                        const iconMap: Record<EventType, string> = { goal: '👟', yellow: '🟨', red: '🟥' }
                        return (
                          <div className="timeline-dot timeline-dot--event" style={{ left: dotLeft }}>
                            <span className="timeline-dot-icon">{iconMap[pausedMatchEvent.type]}</span>
                          </div>
                        )
                      }
                      if (spotlight?.kind === 'halftime' || spotlight?.kind === 'fulltime') {
                        return (
                          <div className="timeline-dot timeline-dot--event" style={{ left: dotLeft }}>
                            <span className="timeline-dot-icon">⏱</span>
                          </div>
                        )
                      }
                      // After an event: show its icon lingering on the dot
                      if (lastFiredType) {
                        const iconMap: Record<EventType, string> = { goal: '⚽', yellow: '🟨', red: '🟥' }
                        return (
                          <div className="timeline-dot timeline-dot--event" style={{ left: dotLeft }}>
                            <span className="timeline-dot-icon">{iconMap[lastFiredType]}</span>
                          </div>
                        )
                      }
                      // Normal running — show current minute
                      return (
                        <div className="timeline-dot timeline-dot--running" style={{ left: dotLeft }}>
                          <span className="timeline-dot-minute">{displayTime}'</span>
                        </div>
                      )
                    })()}
                    {/* Static dot when not in playback mode */}
                    {!playing && currentMinute === 0 && eventsUpToNow.length > 0 && (
                      <div className="timeline-dot" style={{ left: `${(eventsUpToNow[eventsUpToNow.length - 1].minute / 90) * 100}%` }} />
                    )}
                  </div>
                  <span className="time-label right">90'</span>
                </div>
              </div>

              <div className="event-feed">
                <span className="corner corner-tl" />
                <span className="corner corner-tr" />
                <span className="corner corner-bl" />
                <span className="corner corner-br" />
                <div className="event-list">
                  {eventsUpToNow.length === 0 && !playing && (
                    <div className="event-empty">Press <kbd className="key-hint">E</kbd> to configure the match</div>
                  )}
                  {eventsUpToNow.slice(-3).map((e) => (
                    <div key={e.id} className={`event-row event-row--${e.type}`}>
                      <span className="event-icon">{EVENT_ICON[e.type]}</span>
                      <div className="event-info">
                        <span className="event-team">{getTeamName(e.team)}</span>
                        <span className="event-player">
                          {e.player}
                          {e.ownGoal && <span className="own-goal-tag">OG</span>}
                        </span>
                      </div>
                      <span className="event-minute">{fmtMinute(e)}'</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showConfig && (
        <Configurator config={config} onSave={c => { saveConfig(c); setConfig(c) }} onClose={() => setShowConfig(false)} />
      )}
    </>
  )
}
