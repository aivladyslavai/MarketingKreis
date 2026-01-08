import { NextRequest, NextResponse } from "next/server"

function ensureAuthenticated(req: NextRequest) {
  const cookie = req.headers.get("cookie") || ""
  // We rely on backend-issued JWT cookie; if none present, deny.
  if (!cookie.includes("access_token")) {
    throw new Error("unauthenticated")
  }
}

export async function POST(req: NextRequest) {
  try {
    try {
      ensureAuthenticated(req)
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, history, forceTool } = await req.json().catch(() => ({ message: null, history: [], forceTool: null }))
    
    // Allow forceTool without message (for confirmation)
    if (!forceTool && (!message || typeof message !== 'string')) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    const model = process.env.NEXT_PUBLIC_ASSISTANT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }

    const systemPrompt = `You are a focused, intelligent assistant for a marketing CRM platform. You help users manage contacts, deals, activities, and calendar events.

CORE PRINCIPLES:
- Stay strictly on topic: CRM data, scheduling, activity management.
- CAREFULLY READ the conversation history. Extract all details (date, time, title, description) from previous messages.
- Be concise, warm, and actionable. Max 80 words unless the user asks for detail.
- Always respond in the user's language (RU/DE/EN).

ACTION RULES:
1. Data requests → IMMEDIATELY call the tool. Do NOT narrate.
2. Create/update/delete requests:
   a. FIRST: Scan conversation history for all details (title, date, time, location, participants).
   b. If you have title + date/time from history → IMMEDIATELY call create_calendar_event or create_activity with ALL collected info. IMPORTANT: Set confirm=false in the tool call. The system will show a confirmation UI to the user. DO NOT SAY ANYTHING. DO NOT write "Event created" or any text - JUST CALL THE TOOL SILENTLY with confirm=false.
   c. If critical info is truly missing (no date OR no title anywhere in history) → Ask ONCE in a single short question: "Welches Datum und Uhrzeit?" or "Какие дата и время?"
   d. After user provides missing info → IMMEDIATELY call the tool WITHOUT any text response, with confirm=false.

3. NEVER write "I will create", "Теперь создам", "Erstelle", "Creating" or similar. ONLY call the tool function directly.
4. When user says "я же уже говорил" or "I said tomorrow 15:00" → Parse the date/time from CURRENT message and ANY previous messages, then call the tool.

PARSING EXAMPLES:
- "завтра с 15:00 по 17:00" → start: tomorrow 15:00, end: tomorrow 17:00
- "morgen um 15:00 Uhr" → start: tomorrow 15:00
- "tomorrow at 3pm" → start: tomorrow 15:00
- "встреча инвесторов" → title: "Встреча инвесторов"
- "Investorenmeeting" → title: "Investorenmeeting"
- User said title in message 3, date in message 5 → Combine both and create event.
- If user says "morgen" or "завтра" or "tomorrow" → Use tomorrow's date.

CRITICAL RULES FOR WRITE OPERATIONS:
- When creating/updating/deleting, you MUST NOT reply with text.
- You MUST ONLY make the tool call with confirm=false.
- The system will automatically show a beautiful confirmation card to the user with all details (title, date, time, description).
- NEVER write "Event created", "*Event created.*", "Erstellt", "Создано" or similar. The system handles user feedback.

NEVER:
- Say you will create something. Just create it silently with confirm=false.
- Write "Event created" or any confirmation text. Let the system show the confirmation UI.
- Set confirm=true in tool calls (always use confirm=false for initial proposal).
- Ask for info the user already provided.
- Ask multiple questions in a row.
- Give advice unless explicitly asked.`

    const cookie = req.headers.get('cookie') || ''
    const api = async (path: string, init: RequestInit = {}) => {
      const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const url = path.startsWith('http') ? path : `${base}/api${path.startsWith('/') ? path : '/' + path}`
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as any || {}) }
      if (cookie) headers['cookie'] = cookie
      const res = await fetch(url, { ...init, headers, cache: 'no-store' })
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        throw new Error(text || `HTTP ${res.status}`)
      }
      try { return await res.json() } catch { return null }
    }

    const tools = [
      { type: 'function', function: { name: 'get_crm_stats', description: 'Get CRM KPIs', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
      { type: 'function', function: { name: 'list_companies', description: 'List companies (optional fuzzy query q)', parameters: { type: 'object', properties: { q: { type: 'string' } }, additionalProperties: false } } },
      { type: 'function', function: { name: 'list_contacts', description: 'List contacts', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
      { type: 'function', function: { name: 'list_deals', description: 'List deals', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
      { type: 'function', function: { name: 'list_activities', description: 'List activities with filters', parameters: { type: 'object', properties: { status: { type: 'string' }, category: { type: 'string' }, year: { type: 'number' }, from: { type: 'string' }, to: { type: 'string' }, limit: { type: 'number' } }, additionalProperties: false } } },
      { type: 'function', function: { name: 'create_activity', description: 'Create activity (requires confirm:true)', parameters: { type: 'object', properties: { title: { type: 'string' }, category: { type: 'string' }, start: { type: 'string' }, end: { type: 'string', nullable: true }, status: { type: 'string' }, notes: { type: 'string', nullable: true }, budgetCHF: { type: 'number', nullable: true }, confirm: { type: 'boolean' } }, required: ['title','category','start','status'], additionalProperties: false } } },
      { type: 'function', function: { name: 'update_activity', description: 'Update activity (requires confirm:true)', parameters: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, category: { type: 'string' }, start: { type: 'string' }, end: { type: 'string', nullable: true }, status: { type: 'string' }, notes: { type: 'string', nullable: true }, budgetCHF: { type: 'number', nullable: true }, confirm: { type: 'boolean' } }, required: ['id'], additionalProperties: false } } },
      { type: 'function', function: { name: 'delete_activity', description: 'Delete activity (requires confirm:true)', parameters: { type: 'object', properties: { id: { type: 'string' }, confirm: { type: 'boolean' } }, required: ['id'], additionalProperties: false } } },
      { type: 'function', function: { name: 'list_calendar_events', description: 'List calendar events with optional range', parameters: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } }, additionalProperties: false } } },
      { type: 'function', function: { name: 'create_calendar_event', description: 'Create calendar event (requires confirm:true)', parameters: { type: 'object', properties: { title: { type: 'string' }, start: { type: 'string' }, end: { type: 'string', nullable: true }, description: { type: 'string', nullable: true }, color: { type: 'string', nullable: true }, category: { type: 'string', nullable: true }, confirm: { type: 'boolean' } }, required: ['title','start'], additionalProperties: false } } },
      { type: 'function', function: { name: 'update_calendar_event', description: 'Update calendar event (requires confirm:true)', parameters: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, start: { type: 'string' }, end: { type: 'string', nullable: true }, description: { type: 'string', nullable: true }, color: { type: 'string', nullable: true }, category: { type: 'string', nullable: true }, confirm: { type: 'boolean' } }, required: ['id'], additionalProperties: false } } },
      { type: 'function', function: { name: 'delete_calendar_event', description: 'Delete calendar event (requires confirm:true)', parameters: { type: 'object', properties: { id: { type: 'string' }, confirm: { type: 'boolean' } }, required: ['id'], additionalProperties: false } } },
    ] as any

    const payload: any = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...(Array.isArray(history) ? history.slice(-8) : []),
        { role: 'user', content: message },
      ],
      tools,
      tool_choice: 'auto', // Will be overridden to 'required' for write intents
    }

    // Optional direct execution from client confirmation
    if (forceTool && typeof forceTool.name === 'string') {
      const allowWrite = process.env.ASSISTANT_ALLOW_WRITE === 'true'
      if (!allowWrite) {
        return NextResponse.json({ reply: 'Запись отключена политикой сервера (ASSISTANT_ALLOW_WRITE=false).' })
      }
      const args = { ...(forceTool.args || {}), confirm: true }
      try {
        let out: any = null
        if (forceTool.name === 'create_activity') out = await api('/activities', { method: 'POST', body: JSON.stringify(args) })
        else if (forceTool.name === 'update_activity') out = await api(`/activities/${args.id}`, { method: 'PUT', body: JSON.stringify(args) })
        else if (forceTool.name === 'delete_activity') out = await api(`/activities/${args.id}`, { method: 'DELETE' })
        else if (forceTool.name === 'create_calendar_event') out = await api('/calendar', { method: 'POST', body: JSON.stringify(args) })
        else if (forceTool.name === 'update_calendar_event') out = await api(`/calendar/${args.id}`, { method: 'PUT', body: JSON.stringify(args) })
        else if (forceTool.name === 'delete_calendar_event') out = await api(`/calendar/${args.id}`, { method: 'DELETE' })
        else return NextResponse.json({ reply: 'Неизвестное действие' }, { status: 400 })
        return NextResponse.json({ reply: 'Geschafft ✅', result: out })
      } catch (err: any) {
        return NextResponse.json({ reply: `Ошибка: ${err?.message || String(err)}` })
      }
    }
    async function call(modelName: string, bodyOverride?: any) {
      return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...(bodyOverride || payload), model: modelName }),
        cache: 'no-store'
      })
    }

    const extractText = (val: any): string => {
      if (!val) return ''
      if (typeof val === 'string') return val
      if (Array.isArray(val)) return val.map(extractText).filter(Boolean).join(' ')
      if (typeof val === 'object') {
        // common shapes: { text }, { content }, { output: [...] }
        if (val.text) return extractText(val.text)
        if (val.content) return extractText(val.content)
        if (val.output) return extractText(val.output)
        if (val.message) return extractText(val.message)
      }
      return ''
    }

    // Server-side natural language date parsing hint (heute/morgen/übermorgen)
    let enrichedMessage = message
    let isWriteIntent = false
    const base = new Date()
    const addDays = (d: number) => { const x = new Date(base); x.setDate(base.getDate() + d); return x }
    const normalizeDate = (d: Date) => d.toISOString().split('T')[0]
    const timeMatch = message.match(/(\d{1,2}):(\d{2})/)
    if (/(übermorgen|uebermorgen|послезавтра|day after tomorrow)/i.test(message)) {
      const target = addDays(2)
      enrichedMessage += ` [System hint: User means date=${normalizeDate(target)}${timeMatch ? `, time=${timeMatch[0]}` : ''}]`
    } else if (/(morgen|завтра|tomorrow)/i.test(message)) {
      const target = addDays(1)
      enrichedMessage += ` [System hint: User means date=${normalizeDate(target)}${timeMatch ? `, time=${timeMatch[0]}` : ''}]`
    } else if (/(heute|сегодня|today)/i.test(message) && timeMatch) {
      const target = addDays(0)
      enrichedMessage += ` [System hint: User means date=${normalizeDate(target)}, time=${timeMatch[0]}]`
    }
    // Detect write intent (create/update/delete)
    if (/(erstelle|создай|create|добавь|add|plan|запланируй|schedule)/i.test(message)) {
      isWriteIntent = true
    }

    // Iterative tool-call loop until content is returned
    let messagesChain: any[] = [ { role: 'system', content: systemPrompt }, ...(Array.isArray(history) ? history.slice(-10) : []), { role: 'user', content: enrichedMessage } ]
    let safety = 0
    let reply = ''
    let currentToolCalls: any = null
    while (safety++ < 5) {
      // Force tool call for write intents
      const currentPayload = { ...payload, messages: messagesChain }
      if (isWriteIntent && safety === 1) {
        currentPayload.tool_choice = 'required'
      }
      const resp = await call(model, currentPayload)
      if (!resp.ok) {
        const text = await resp.text()
        return NextResponse.json({ error: text }, { status: resp.status })
      }
      const j = await resp.json()
      const m = j?.choices?.[0]?.message
      if (m?.tool_calls?.length) {
        currentToolCalls = m.tool_calls
        const toolResults: any[] = []
        const allowWrite = process.env.ASSISTANT_ALLOW_WRITE === 'true'
        let pendingConfirm: null | { name: string; args: any } = null
        for (const tc of m.tool_calls) {
          const name = tc.function?.name
          const args = (() => { try { return JSON.parse(tc.function?.arguments || '{}') } catch { return {} } })()
          try {
            let result: any = null
            console.log('[AssistantTool]', name, args)
            if (name === 'get_crm_stats') result = await api('/crm/stats')
            else if (name === 'list_companies') result = await api('/crm/companies')
            else if (name === 'list_contacts') result = await api('/crm/contacts')
            else if (name === 'list_deals') result = await api('/crm/deals')
            else if (name === 'list_activities') {
              const list = await api('/activities')
              const items = Array.isArray(list) ? list : (list?.items ?? [])
              const from = args.from ? new Date(args.from) : null
              const to = args.to ? new Date(args.to) : null
              const year = args.year ? Number(args.year) : null
              let filtered = items as any[]
              if (args.status) filtered = filtered.filter(a => String(a.status || '').toUpperCase().includes(String(args.status).toUpperCase()))
              if (args.category) filtered = filtered.filter(a => String(a.category || '').toUpperCase() === String(args.category).toUpperCase())
              if (year) filtered = filtered.filter(a => a.start ? new Date(a.start).getFullYear() === year : true)
              if (from) filtered = filtered.filter(a => a.start ? new Date(a.start) >= from : true)
              if (to) filtered = filtered.filter(a => a.start ? new Date(a.start) <= to : true)
              if (args.limit) filtered = filtered.slice(0, Number(args.limit))
              result = filtered
            }
            else if (name === 'create_activity' || name === 'update_activity' || name === 'delete_activity' || name?.startsWith('create_calendar') || name?.startsWith('update_calendar') || name?.startsWith('delete_calendar')) {
              if (!allowWrite) {
                result = { error: 'Writes are disabled by server policy (ASSISTANT_ALLOW_WRITE=false)' }
              } else if (!args.confirm) {
                result = { requires_confirmation: true, hint: 'Add "confirm": true in tool call to proceed.' }
                pendingConfirm = { name, args }
              } else {
                if (name === 'create_activity') result = await api('/activities', { method: 'POST', body: JSON.stringify(args) })
                else if (name === 'update_activity') result = await api(`/activities/${args.id}`, { method: 'PUT', body: JSON.stringify(args) })
                else if (name === 'delete_activity') result = await api(`/activities/${args.id}`, { method: 'DELETE' })
                else if (name === 'create_calendar_event') result = await api('/calendar', { method: 'POST', body: JSON.stringify(args) })
                else if (name === 'update_calendar_event') result = await api(`/calendar/${args.id}`, { method: 'PUT', body: JSON.stringify(args) })
                else if (name === 'delete_calendar_event') result = await api(`/calendar/${args.id}`, { method: 'DELETE' })
              }
            }
            toolResults.push({ role: 'tool', tool_call_id: tc.id, name, content: JSON.stringify(result ?? {}) })
          } catch (err: any) {
            toolResults.push({ role: 'tool', tool_call_id: tc.id, name, content: JSON.stringify({ error: err?.message || String(err) }) })
          }
        }
        if (pendingConfirm) {
          // Validate required details for creation; if missing, ask clarifying question instead of confirm
          const args = pendingConfirm.args || {}
          const name = String(args.title || '').trim().toLowerCase()
          const genericNames = ['neues event','new event','termin','meeting','событие','event']
          const missingTitle = !args.title || genericNames.includes(name)
          const startStr: string = String(args.start || '')
          const hasExplicitTime = /T\d{2}:\d{2}/.test(startStr) && !/T00:00/.test(startStr)
          const missingTime = !startStr || !hasExplicitTime
          if ((pendingConfirm.name === 'create_calendar_event' || pendingConfirm.name === 'create_activity') && (missingTitle || missingTime)) {
            const q = missingTitle && missingTime
              ? 'Wie soll der Termin heißen und um wie viel Uhr? (z.B. 15:00). Optional: kurze Beschreibung.'
              : missingTitle
                ? 'Wie soll der Termin heißen? Optional: kurze Beschreibung.'
                : 'Bitte geben Sie die Uhrzeit an (z.B. 15:00). Optional: kurze Beschreibung.'
            return NextResponse.json({ reply: q })
          }

          // Format a nice preview message based on the tool arguments
          let preview = ''
          if (pendingConfirm.name === 'create_calendar_event' || pendingConfirm.name === 'create_activity') {
            preview = `📅 **${args.title || 'Neues Event'}**\n\n`
            if (args.start) preview += `🕒 ${new Date(args.start).toLocaleString('de-DE')}`
            if (args.end) preview += ` bis ${new Date(args.end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
            if (args.description) preview += `\n\n📝 ${args.description}`
            preview += `\n\nMöchten Sie dieses Event erstellen?`
          }
          return NextResponse.json({ reply: preview || 'Требуется подтверждение выполнения действия.', confirm: pendingConfirm })
        }
        messagesChain = [ 
          { role: 'system', content: systemPrompt + '\n\nNow synthesize a clear, final answer based on the tool results. Do not say you will fetch data again - the data is already provided above.' }, 
          { role: 'user', content: message }, 
          { role: 'assistant', tool_calls: currentToolCalls }, 
          ...toolResults 
        ]
        continue
      }
      reply = extractText(m)
      if (reply && String(reply).trim()) {
        // If model says it's creating/scheduling but didn't call a tool, force it to do so
        const lowerReply = String(reply).toLowerCase()
        if (/(созда[юл]|планиру|запис|теперь.*созда|сейчас.*созда|create|schedule|erstelle|now.*creat)/i.test(lowerReply) && !currentToolCalls && safety < 4) {
          console.log('[Assistant] Model said it would create but did not call tool. Forcing tool call.')
          messagesChain = [
            { role: 'system', content: systemPrompt + '\n\nCRITICAL: You said you would create/schedule something, but you did NOT call any tool. You MUST call create_calendar_event or create_activity NOW with all details from the conversation history. Use the information provided: title, date, time, description. DO NOT reply with text - ONLY make the tool call.' },
            ...messagesChain.slice(1),
            { role: 'assistant', content: reply },
            { role: 'user', content: '[System: Execute the tool call immediately with all available information from history.]' }
          ]
          continue
        }
        break
      }
    }
    if (!reply || !String(reply).trim()) {
      // Final attempt: ask model without tools, forcing a concise answer
      const fallbackBody = {
        model,
        input: [
          { role: 'system', content: systemPrompt + ' Always produce a final answer. Never return an empty message.' },
          { role: 'user', content: message },
        ],
        tool_choice: 'none' as const,
      }
      const resp2 = await call(model, fallbackBody)
      if (resp2.ok) {
        const j2 = await resp2.json()
        const m2 = j2?.output?.[0] ?? j2?.choices?.[0]?.message
        const txt = extractText(m2)
        if (txt && String(txt).trim()) {
          return NextResponse.json({ reply: String(txt) })
        }
      }
      const raw = await resp2.text().catch(()=>null)
      return NextResponse.json({ error: 'Empty response from model', raw }, { status: 502 })
    }
    return NextResponse.json({ reply: String(reply) })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}



