"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircle, Send, X, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { crmAPI } from "@/lib/api"
import { sync } from "@/lib/sync"

type ChatMessage = { id: string; role: "user" | "assistant"; content: string; confirmTool?: { name: string; args: any } }

const detectLanguage = (messages: ChatMessage[]): 'de' | 'ru' | 'en' => {
  const recent = messages.slice(-5).map(m => m.content).join(' ')
  if (/[а-яА-ЯёЁ]{3,}/.test(recent)) return 'ru'
  if (/(und|der|die|das|ist|mit|für|auf|zu|ein|eine)/i.test(recent)) return 'de'
  return 'en'
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "hello",
    role: "assistant",
    content: "Hallo! 👋 Ich bin dein KI-Assistent. Frag mich nach CRM-Zahlen, Budget, Aktivitäten oder wie ich dir helfen kann."
  }])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  async function askBackend(query: string): Promise<string | null> {
    try {
      if (/umsatz|revenue|won/i.test(query) || /pipeline|deals|сделк/i.test(query)) {
        const s = await crmAPI.getStats()
        return `📊 Pipeline: CHF ${Math.round(s.pipelineValue || 0).toLocaleString()}\n💰 Won: CHF ${Math.round(s.wonValue || 0).toLocaleString()}\n🤝 Deals: ${s.totalDeals ?? 0}`
      }
      // Activities / Calendar quick answers (DE/EN/RU)
      if (/(aktivität|activity|активност)/i.test(query)) {
        const resp = await fetch('/api/activities', { credentials: 'include' })
        const arr = await resp.json().catch(() => [])
        const count = Array.isArray(arr) ? arr.length : (arr?.items?.length ?? 0)
        return `📅 Активностей: ${count}`
      }
      if (/(calendar|kalender|календар)/i.test(query)) {
        const resp = await fetch('/api/calendar', { credentials: 'include' }).catch(()=>null)
        const arr = await (resp ? resp.json().catch(() => []) : [])
        const count = Array.isArray(arr) ? arr.length : (arr?.items?.length ?? 0)
        return `🗓️ Событий в календаре: ${count}`
      }
      return null
    } catch (e: any) {
      return `⚠️ Fehler beim Abrufen der Daten: ${e.message || e}`
    }
  }

  async function askAssistant(query: string): Promise<string> {
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history: messages.map(m => ({ role: m.role, content: m.content })) })
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
        setMessages(prev => [...prev, { id: String(Date.now()+3), role: 'assistant', content: doData?.reply || 'Erstellt ✅' }])
      } else if (lastConfirm && isNo) {
        setMessages(prev => [...prev, { id: String(Date.now()+4), role: 'assistant', content: 'Операция отменена.' }])
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
                    <button
                      onClick={() => setOpen(false)}
                      className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="h-[400px] overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
                        <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
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
                                  setMessages(prev => [...prev, { id: String(Date.now()+3), role: 'assistant', content: doData?.reply || 'Erstellt ✅' }])
                                  try { sync.refreshAll() } catch {}
                                } catch (err:any) {
                                  setMessages(prev => [...prev, { id: String(Date.now()+4), role: 'assistant', content: `Ошибка: ${err?.message || String(err)}` }])
                                } finally { setSending(false) }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white text-xs shadow hover:opacity-90"
                            >Bestätigen</button>
                            <button
                              onClick={()=> setMessages(prev => [...prev, { id: String(Date.now()+5), role: 'assistant', content: 'Abgebrochen.' }])}
                              className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 border border-white/10 text-xs hover:bg-white/15"
                            >Abbrechen</button>
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
                        placeholder="Stell mir eine Frage..."
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


