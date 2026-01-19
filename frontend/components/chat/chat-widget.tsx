"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Send, X, Sparkles, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { sync } from "@/lib/sync"

type ChatMessage = { id: string; role: "user" | "assistant"; content: string; confirmTool?: { name: string; args: any } }

const detectLanguage = (messages: ChatMessage[]): 'de' | 'ru' | 'en' => {
  const recent = messages.slice(-5).map(m => m.content).join(' ')
  if (/[а-яА-ЯёЁ]{3,}/.test(recent)) return 'ru'
  if (/(und|der|die|das|ist|mit|für|auf|zu|ein|eine)/i.test(recent)) return 'de'
  return 'en'
}

const detectBrowserLanguage = (): 'de' | 'ru' | 'en' => {
  if (typeof navigator === 'undefined') return 'en'
  const lang = (navigator.language || '').toLowerCase()
  if (lang.startsWith('ru') || lang.includes('ru')) return 'ru'
  if (lang.startsWith('de') || lang.includes('de')) return 'de'
  return 'en'
}

const defaultHello = (lang: 'de' | 'ru' | 'en') => {
  if (lang === 'ru') {
    return "Привет! Я твой KI‑ассистент. Спроси про CRM‑цифры, контент‑план, дедлайны, календарь или попроси создать/запланировать."
  }
  if (lang === 'de') {
    return "Hallo! Ich bin dein KI‑Assistent. Frag mich nach CRM‑Zahlen, Content‑Plan, Deadlines, Kalender – oder lass mich etwas erstellen/planen."
  }
  return "Hi! I’m your AI assistant. Ask about CRM KPIs, content plan, deadlines, calendar – or let me create/schedule something."
}

const placeholderByLang = (lang: 'de' | 'ru' | 'en') => {
  if (lang === 'ru') return 'Задай вопрос…'
  if (lang === 'de') return 'Stell mir eine Frage…'
  return 'Ask a question…'
}

type Suggestion = { label: string; message: string }

function buildSuggestions(pathname: string, lang: 'de' | 'ru' | 'en'): Suggestion[] {
  const p = (pathname || '').toLowerCase()
  const isContent = p.startsWith('/content')
  const isCrm = p.startsWith('/crm')
  const isCalendar = p.startsWith('/calendar')

  const t = (ru: string, de: string, en: string) => (lang === 'ru' ? ru : lang === 'de' ? de : en)

  const common: Suggestion[] = [
    { label: t('CRM: KPI', 'CRM: KPI', 'CRM: KPIs'), message: t('Покажи CRM KPI: pipeline, won, deals.', 'Zeig CRM KPIs: Pipeline, Won, Deals.', 'Show CRM KPIs: pipeline, won, deals.') },
    { label: t('Сегодня в календаре', 'Heute im Kalender', "Today's calendar"), message: t('Что у меня сегодня в календаре? Коротко списком.', 'Was habe ich heute im Kalender? Kurz als Liste.', "What's on my calendar today? Short list.") },
  ]

  if (isContent) {
    return [
      ...common,
      { label: t('Дедлайны 7 дней', 'Deadlines 7 Tage', 'Deadlines 7 days'), message: t('Покажи Content Items и Tasks с дедлайном в ближайшие 7 дней.', 'Zeig Content Items und Tasks mit Deadline in den nächsten 7 Tagen.', 'Show content items and tasks due in the next 7 days.') },
      { label: t('План на неделю', 'Plan (Woche)', 'Plan (week)'), message: t('Составь контент‑план на неделю: 5 постов (LinkedIn) + 1 newsletter + 1 blog. Дай даты и short brief.', 'Erstelle einen Content‑Plan für 1 Woche: 5 LinkedIn Posts + 1 Newsletter + 1 Blog. Mit Datum + kurzem Brief.', 'Create a 1-week content plan: 5 LinkedIn posts + 1 newsletter + 1 blog. Include dates + short briefs.') },
      { label: t('Создать item', 'Item erstellen', 'Create item'), message: t('Создай Content Item: "LinkedIn Carousel: ABM Teaser", запланируй на пятницу 10:00, теги: abm, teaser.', 'Erstelle ein Content Item: "LinkedIn Carousel: ABM Teaser", plane es für Freitag 10:00, Tags: abm, teaser.', 'Create a content item: "LinkedIn Carousel: ABM Teaser", schedule Friday 10:00, tags: abm, teaser.') },
    ]
  }
  if (isCrm) {
    return [
      ...common,
      { label: t('Pipeline список', 'Pipeline Liste', 'Pipeline list'), message: t('Покажи топ‑10 сделок в pipeline (название + стадия + value).', 'Zeig Top‑10 Deals im Pipeline (Titel + Stage + Value).', 'Show top 10 pipeline deals (title + stage + value).') },
      { label: t('Авто‑контент из сделки', 'Content aus Deal', 'Content from deal'), message: t('Для Deal #1 создай пакет контента по шаблону (deal_won).', 'Für Deal #1 erstelle ein Content‑Pack aus dem Template (deal_won).', 'For Deal #1 create a content pack from template (deal_won).') },
    ]
  }
  if (isCalendar) {
    return [
      ...common,
      { label: t('Создать встречу', 'Termin erstellen', 'Create meeting'), message: t('Создай встречу завтра 15:00–15:30: "Клиентский созвон (Helvetia)" + описание/agenda.', 'Erstelle morgen 15:00–15:30: "Kunden‑Call (Helvetia)" + Agenda.', 'Create tomorrow 15:00–15:30: "Client call (Helvetia)" + agenda.') },
      { label: t('События недели', 'Woche Termine', 'This week'), message: t('Покажи события в календаре на эту неделю.', 'Zeig Termine für diese Woche.', 'Show calendar events for this week.') },
    ]
  }
  return [
    ...common,
    { label: t('Контент дедлайны', 'Content Deadlines', 'Content deadlines'), message: t('Покажи ближайшие дедлайны по контенту (items + tasks) на 7 дней.', 'Zeig die nächsten Content‑Deadlines (Items + Tasks) für 7 Tage.', 'Show upcoming content deadlines (items + tasks) for 7 days.') },
  ]
}

function renderSafeText(content: string) {
  const lines = String(content || '').split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, idx) => (
        <div key={idx} className="leading-relaxed">
          {line.split(/\*\*(.+?)\*\*/g).map((part, i) =>
            i % 2 === 1 ? (
              <strong key={i} className="font-semibold text-white">{part}</strong>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>
      ))}
    </div>
  )
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const initialLang = useMemo(() => detectBrowserLanguage(), [])
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem('mk_assistant_messages')
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr) && arr.length) {
          return arr
            .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
            .slice(-50)
            .map((m: any, i: number) => ({ id: String(m.id || `m-${i}`), role: m.role, content: m.content }))
        }
      }
    } catch {}
    return [{
      id: "hello",
      role: "assistant",
      content: defaultHello(initialLang)
    }]
  })
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window === 'undefined') return '/'
    return window.location?.pathname || '/'
  })
  useEffect(() => {
    if (!open) return
    try {
      setPathname(window.location?.pathname || '/')
    } catch {}
  }, [open])

  const lang = useMemo(() => detectLanguage(messages) || initialLang, [messages, initialLang])
  const suggestions = useMemo(() => buildSuggestions(pathname, lang), [pathname, lang])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  useEffect(() => {
    // Persist last messages (no confirmTool) to localStorage
    try {
      const compact = messages.slice(-50).map(m => ({ id: m.id, role: m.role, content: m.content }))
      localStorage.setItem('mk_assistant_messages', JSON.stringify(compact))
    } catch {}
  }, [messages])

  async function askAssistant(query: string): Promise<string> {
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          context: {
            pathname,
            title: typeof document !== 'undefined' ? document.title : undefined,
            tz: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
            lang: typeof navigator !== 'undefined' ? navigator.language : undefined,
          }
        })
      })
      const data = await res.json().catch(() => ({}))
      // If server asks for confirmation, render the preview + CTA bubble
      if (data?.confirm) {
        const tool = data.confirm
        const preview = data.reply || 'Möchten Sie diese Aktion ausführen?'
        setMessages(prev => [...prev, { id: String(Date.now()+2), role: 'assistant', content: preview, confirmTool: tool }])
        return ''
      }
      return data?.reply || 'Ich konnte keine Antwort generieren.'
    } catch (e: any) {
      return `⚠️ Assistant-Fehler: ${e?.message || e}`
    }
  }

  const sendMessage = async () => {
    const q = input.trim()
    if (!q || sending) return
    setInput("")
    const userMsg: ChatMessage = { id: String(Date.now()), role: "user", content: q }
    setMessages(prev => [...prev, userMsg])
    const lastConfirm = [...messages].reverse().find(m => m.confirmTool)
    const isYes = /^(да|yes|ja|подтверждаю|ок|okay|ok|confirm|go)\b/i.test(q)
    const isNo = /^(нет|no|nein|cancel|отмена)\b/i.test(q)
    try {
      setSending(true)
      if (lastConfirm && isYes) {
        const doRes = await fetch('/api/assistant/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'confirm', history: messages.map(m => ({ role: m.role, content: m.content })), forceTool: lastConfirm.confirmTool })
        })
        const doData = await doRes.json().catch(()=>({}))
        setMessages(prev => [...prev, { id: String(Date.now()+3), role: 'assistant', content: doData?.reply || (lang === 'ru' ? 'Готово ✅' : lang === 'de' ? 'Geschafft ✅' : 'Done ✅') }])
      } else if (lastConfirm && isNo) {
        setMessages(prev => [...prev, { id: String(Date.now()+4), role: 'assistant', content: lang === 'ru' ? 'Операция отменена.' : lang === 'de' ? 'Abgebrochen.' : 'Cancelled.' }])
      } else {
        // Smart context assembly: if user provides date/time after title in previous messages, combine them
        const recentMsgs = [...messages, userMsg].slice(-6).filter(m => m.role === 'user').map(m => m.content)
        const hasTitle = recentMsgs.some(c => /(встреч|meeting|treffen|событи|event|aktivität)/i.test(c))
        const hasDateTime = /((завтра|morgen|tomorrow)|(\d{1,2}:\d{2})|(\d{1,2}\.\d{1,2}\.\d{2,4}))/i.test(q)
        if (hasTitle && hasDateTime && recentMsgs.length > 1) {
          // Assemble enriched message with full context hint
          const enrichedMsg = `[Context: User previously mentioned event details. Current message: "${q}". Please combine all info from history and create the event.]`
          const reply = await askAssistant(enrichedMsg)
          if (reply && reply.trim()) {
            const bot: ChatMessage = { id: String(Date.now() + 1), role: "assistant", content: reply }
            setMessages(prev => [...prev, bot])
          }
        } else {
          const reply = await askAssistant(q)
          if (reply && reply.trim()) {
            const bot: ChatMessage = { id: String(Date.now() + 1), role: "assistant", content: reply }
            setMessages(prev => [...prev, bot])
          }
        }
      }
    } finally {
      setSending(false)
    }
  }

  const clearChat = () => {
    const hello: ChatMessage = { id: "hello", role: "assistant", content: defaultHello(initialLang) }
    setMessages([hello])
    setInput("")
    try { localStorage.removeItem('mk_assistant_messages') } catch {}
  }

  const sendSuggestion = async (msg: string) => {
    if (!msg.trim() || sending) return
    setInput(msg)
    // allow input state to update, then send
    setTimeout(() => { try { setInput(""); } catch {} }, 0)
    const userMsg: ChatMessage = { id: String(Date.now()), role: "user", content: msg }
    setMessages(prev => [...prev, userMsg])
    try {
      setSending(true)
      const reply = await askAssistant(msg)
      if (reply && reply.trim()) {
        setMessages(prev => [...prev, { id: String(Date.now() + 1), role: "assistant", content: reply }])
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating button with pulse animation */}
      <AnimatePresence>
        {!open && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => setOpen(true)}
              className="group relative rounded-full h-16 w-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[2px] shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110"
            >
              {/* Pulsing ring */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-75 blur-md animate-pulse" />
              
              {/* Inner button */}
              <div className="relative flex items-center justify-center h-full w-full rounded-full bg-slate-900">
                <Sparkles className="h-7 w-7 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel with glassmorphism */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-[420px] max-w-[90vw] z-50"
          >
            {/* Glass card with gradient border */}
            <div className="relative rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 p-[1px] shadow-2xl">
              <div className="rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-white/10">
                {/* Header with gradient */}
                <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 px-6 py-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">KI-Assistent</h3>
                        <p className="text-xs text-slate-400">Immer für dich da</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={clearChat}
                        className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        title={lang === 'ru' ? 'Очистить' : lang === 'de' ? 'Leeren' : 'Clear'}
                      >
                        <Trash2 className="h-4 w-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => setOpen(false)}
                        className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        title={lang === 'ru' ? 'Закрыть' : lang === 'de' ? 'Schließen' : 'Close'}
                      >
                        <X className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="h-[400px] overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {messages.length <= 1 && (
                    <div className="flex flex-wrap gap-2">
                      {suggestions.slice(0, 6).map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition"
                          onClick={() => sendSuggestion(s.message)}
                          disabled={sending}
                          title={s.message}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {messages.map((m, idx) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {m.role === 'assistant' && (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mr-2 flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`
                          max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap break-words
                          ${m.role === 'user' 
                            ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-blue-500/30' 
                            : 'bg-white/5 text-slate-200 border border-white/10 backdrop-blur-xl'
                          }
                        `}
                      >
                        {renderSafeText(m.content)}
                        {m.confirmTool && (
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={async ()=>{
                                setSending(true)
                                try {
                                  const doRes = await fetch('/api/assistant/chat', {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ message: 'confirm', history: messages.map(mm => ({ role: mm.role, content: mm.content })), forceTool: m.confirmTool })
                                  })
                                  const doData = await doRes.json().catch(()=>({}))
                                  setMessages(prev => [...prev, { id: String(Date.now()+3), role: 'assistant', content: doData?.reply || (lang === 'ru' ? 'Готово ✅' : lang === 'de' ? 'Geschafft ✅' : 'Done ✅') }])
                                  try { sync.refreshAll() } catch {}
                                } catch (err:any) {
                                  setMessages(prev => [...prev, { id: String(Date.now()+4), role: 'assistant', content: `Ошибка: ${err?.message || String(err)}` }])
                                } finally { setSending(false) }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white text-xs shadow hover:opacity-90"
                            >{lang === 'ru' ? 'Подтвердить' : lang === 'de' ? 'Bestätigen' : 'Confirm'}</button>
                            <button
                              onClick={()=> setMessages(prev => [...prev, { id: String(Date.now()+5), role: 'assistant', content: lang === 'ru' ? 'Операция отменена.' : lang === 'de' ? 'Abgebrochen.' : 'Cancelled.' }])}
                              className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 border border-white/10 text-xs hover:bg-white/15"
                            >{lang === 'ru' ? 'Отмена' : lang === 'de' ? 'Abbrechen' : 'Cancel'}</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Typing indicator with status */}
                  {sending && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white animate-pulse" />
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                              className="h-2 w-2 rounded-full bg-slate-400"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                              className="h-2 w-2 rounded-full bg-slate-400"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                              className="h-2 w-2 rounded-full bg-slate-400"
                            />
                          </div>
                          <span className="text-xs text-slate-400">
                            {detectLanguage(messages) === 'de' ? 'Arbeite mit Daten...' : detectLanguage(messages) === 'ru' ? 'Работаю с данными...' : 'Working with data...'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input with gradient border */}
                <div className="px-6 py-4 border-t border-white/10">
                  <div className="relative rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 p-[1px]">
                    <div className="flex items-center gap-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl px-4 py-2">
                      <input
                        type="text"
                        placeholder={placeholderByLang(lang)}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey ? sendMessage() : undefined}
                        disabled={sending}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || !input.trim()}
                        className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                      >
                        <Send className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">Powered by OpenAI · MarketingKreis AI</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}


