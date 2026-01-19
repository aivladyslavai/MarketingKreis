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

    const { message, history, forceTool, context } = await req
      .json()
      .catch(() => ({ message: null, history: [], forceTool: null, context: null }))
    
    // Allow forceTool without message (for confirmation)
    if (!forceTool && (!message || typeof message !== 'string')) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    const model = process.env.NEXT_PUBLIC_ASSISTANT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }

    const detectLang = (text: string): 'de' | 'ru' | 'en' => {
      const t = String(text || '')
      if (/[а-яА-ЯёЁ]{3,}/.test(t)) return 'ru'
      if (/(und|der|die|das|ist|mit|für|auf|zu|ein|eine|bitte|heute|morgen)/i.test(t)) return 'de'
      return 'en'
    }

    const lang: 'de' | 'ru' | 'en' = detectLang(
      [
        typeof message === 'string' ? message : '',
        Array.isArray(history) ? JSON.stringify(history.slice(-8)) : '',
        String(context?.lang || ''),
        String(context?.pathname || ''),
      ].join(' ')
    )

    const t = (ru: string, de: string, en: string) => (lang === 'ru' ? ru : lang === 'de' ? de : en)

    const systemPrompt = `You are a focused, intelligent assistant for a marketing CRM + Content Hub platform. You help users manage CRM (companies, contacts, deals), activities, calendar events, and content production (content items, tasks, templates, approvals, assets).

UI CONTEXT (from the app):
- page: ${String(context?.pathname || '')}
- timezone: ${String(context?.tz || '')}

Always use the UI context to interpret the request (e.g. on /content focus on content items/tasks; on /calendar focus on scheduling).

CORE PRINCIPLES:
- Stay strictly on topic: CRM data, content hub, scheduling, task/activity management.
- CAREFULLY READ the conversation history. Extract all details (date, time, title, description) from previous messages.
- Be concise, warm, and actionable. Max 80 words unless the user asks for detail.
- Always respond in the user's language (RU/DE/EN).

ACTION RULES:
1. Data requests → IMMEDIATELY call the tool. Do NOT narrate.
2. Create/update/delete requests (calendar, activities, content items, content tasks):
   a. FIRST: Scan conversation history for all details (title, date, time, location, participants).
   b. If you have enough details from history → IMMEDIATELY call the correct create/update/delete tool with ALL collected info. IMPORTANT: Set confirm=false in the tool call. The system will show a confirmation UI to the user. DO NOT SAY ANYTHING. DO NOT write "created" or any text - JUST CALL THE TOOL SILENTLY with confirm=false.
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
      const base =
        req.nextUrl?.origin ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3000'
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
      { type: 'function', function: { name: 'list_content_items', description: 'List content items (Content Hub)', parameters: { type: 'object', properties: { q: { type: 'string' }, status: { type: 'string' }, limit: { type: 'number' }, scheduled_from: { type: 'string' }, scheduled_to: { type: 'string' } }, additionalProperties: false } } },
      { type: 'function', function: { name: 'get_content_item', description: 'Get content item by id', parameters: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'], additionalProperties: false } } },
      { type: 'function', function: { name: 'create_content_item', description: 'Create content item (requires confirm:true)', parameters: { type: 'object', properties: { title: { type: 'string' }, channel: { type: 'string' }, format: { type: 'string', nullable: true }, status: { type: 'string', nullable: true }, tags: { type: 'array', items: { type: 'string' }, nullable: true }, brief: { type: 'string', nullable: true }, body: { type: 'string', nullable: true }, due_at: { type: 'string', nullable: true }, scheduled_at: { type: 'string', nullable: true }, company_id: { type: 'number', nullable: true }, project_id: { type: 'number', nullable: true }, activity_id: { type: 'number', nullable: true }, blocked_reason: { type: 'string', nullable: true }, confirm: { type: 'boolean' } }, required: ['title'], additionalProperties: false } } },
      { type: 'function', function: { name: 'update_content_item', description: 'Update content item (requires confirm:true)', parameters: { type: 'object', properties: { id: { type: 'number' }, title: { type: 'string' }, channel: { type: 'string' }, format: { type: 'string', nullable: true }, status: { type: 'string', nullable: true }, tags: { type: 'array', items: { type: 'string' }, nullable: true }, brief: { type: 'string', nullable: true }, body: { type: 'string', nullable: true }, due_at: { type: 'string', nullable: true }, scheduled_at: { type: 'string', nullable: true }, company_id: { type: 'number', nullable: true }, project_id: { type: 'number', nullable: true }, activity_id: { type: 'number', nullable: true }, blocked_reason: { type: 'string', nullable: true }, confirm: { type: 'boolean' } }, required: ['id'], additionalProperties: false } } },
      { type: 'function', function: { name: 'delete_content_item', description: 'Delete content item (requires confirm:true)', parameters: { type: 'object', properties: { id: { type: 'number' }, confirm: { type: 'boolean' } }, required: ['id'], additionalProperties: false } } },
      { type: 'function', function: { name: 'list_content_tasks', description: 'List content tasks', parameters: { type: 'object', properties: { q: { type: 'string' }, status: { type: 'string' }, content_item_id: { type: 'number' }, limit: { type: 'number' } }, additionalProperties: false } } },
      { type: 'function', function: { name: 'create_content_task', description: 'Create content task (requires confirm:true)', parameters: { type: 'object', properties: { title: { type: 'string' }, channel: { type: 'string' }, format: { type: 'string', nullable: true }, status: { type: 'string', nullable: true }, priority: { type: 'string', nullable: true }, deadline: { type: 'string', nullable: true }, notes: { type: 'string', nullable: true }, content_item_id: { type: 'number', nullable: true }, recurrence: { type: 'object', nullable: true }, confirm: { type: 'boolean' } }, required: ['title'], additionalProperties: false } } },
      { type: 'function', function: { name: 'update_content_task', description: 'Update content task (requires confirm:true)', parameters: { type: 'object', properties: { id: { type: 'number' }, title: { type: 'string' }, channel: { type: 'string' }, format: { type: 'string', nullable: true }, status: { type: 'string', nullable: true }, priority: { type: 'string', nullable: true }, deadline: { type: 'string', nullable: true }, notes: { type: 'string', nullable: true }, content_item_id: { type: 'number', nullable: true }, recurrence: { type: 'object', nullable: true }, confirm: { type: 'boolean' } }, required: ['id'], additionalProperties: false } } },
      { type: 'function', function: { name: 'delete_content_task', description: 'Delete content task (requires confirm:true)', parameters: { type: 'object', properties: { id: { type: 'number' }, confirm: { type: 'boolean' } }, required: ['id'], additionalProperties: false } } },
      { type: 'function', function: { name: 'complete_content_task', description: 'Complete recurring task (requires confirm:true)', parameters: { type: 'object', properties: { id: { type: 'number' }, confirm: { type: 'boolean' } }, required: ['id'], additionalProperties: false } } },
      { type: 'function', function: { name: 'list_content_templates', description: 'List content templates', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
      { type: 'function', function: { name: 'list_automation_rules', description: 'List automation rules', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
      { type: 'function', function: { name: 'apply_content_template', description: 'Apply template to content item (requires confirm:true)', parameters: { type: 'object', properties: { item_id: { type: 'number' }, template_id: { type: 'number' }, confirm: { type: 'boolean' } }, required: ['item_id','template_id'], additionalProperties: false } } },
      { type: 'function', function: { name: 'generate_content_from_deal', description: 'Generate content item from deal (requires confirm:true)', parameters: { type: 'object', properties: { deal_id: { type: 'number' }, template_id: { type: 'number', nullable: true }, confirm: { type: 'boolean' } }, required: ['deal_id'], additionalProperties: false } } },
      { type: 'function', function: { name: 'list_notifications', description: 'List notifications', parameters: { type: 'object', properties: { unread_only: { type: 'boolean' }, limit: { type: 'number' } }, additionalProperties: false } } },
      { type: 'function', function: { name: 'run_content_reminders', description: 'Create deadline reminders (requires confirm:true)', parameters: { type: 'object', properties: { confirm: { type: 'boolean' } }, additionalProperties: false } } },
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
        return NextResponse.json({ reply: t('Запись отключена политикой сервера (ASSISTANT_ALLOW_WRITE=false).', 'Schreiben ist serverseitig deaktiviert (ASSISTANT_ALLOW_WRITE=false).', 'Writes are disabled by server policy (ASSISTANT_ALLOW_WRITE=false).') })
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
        else if (forceTool.name === 'create_content_item') out = await api('/content/items', { method: 'POST', body: JSON.stringify(args) })
        else if (forceTool.name === 'update_content_item') out = await api(`/content/items/${args.id}`, { method: 'PATCH', body: JSON.stringify(args) })
        else if (forceTool.name === 'delete_content_item') out = await api(`/content/items/${args.id}`, { method: 'DELETE' })
        else if (forceTool.name === 'create_content_task') out = await api('/content/tasks', { method: 'POST', body: JSON.stringify(args) })
        else if (forceTool.name === 'update_content_task') out = await api(`/content/tasks/${args.id}`, { method: 'PATCH', body: JSON.stringify(args) })
        else if (forceTool.name === 'delete_content_task') out = await api(`/content/tasks/${args.id}`, { method: 'DELETE' })
        else if (forceTool.name === 'complete_content_task') out = await api(`/content/tasks/${args.id}/complete`, { method: 'POST', body: JSON.stringify(args) })
        else if (forceTool.name === 'apply_content_template') out = await api(`/content/items/${args.item_id}/apply-template`, { method: 'POST', body: JSON.stringify({ template_id: args.template_id }) })
        else if (forceTool.name === 'generate_content_from_deal') out = await api(`/content/generate/from-deal/${args.deal_id}`, { method: 'POST', body: JSON.stringify({ template_id: args.template_id ?? null }) })
        else if (forceTool.name === 'run_content_reminders') out = await api('/content/reminders/run', { method: 'POST', body: JSON.stringify(args) })
        else return NextResponse.json({ reply: 'Неизвестное действие' }, { status: 400 })
        return NextResponse.json({ reply: t('Готово ✅', 'Geschafft ✅', 'Done ✅'), result: out })
      } catch (err: any) {
        const msg = String(err?.message || err || '')
        const isDemo = /demo|read-only|readonly|forbidden|403/i.test(msg)
        if (isDemo) {
          return NextResponse.json({ reply: t('Этот аккаунт в DEMO режиме (read‑only) — запись запрещена.', 'Dieser Account ist im DEMO‑Modus (read‑only) — Schreiben ist gesperrt.', 'This account is in DEMO (read-only) mode — writes are blocked.') })
        }
        return NextResponse.json({ reply: t(`Ошибка: ${msg}`, `Fehler: ${msg}`, `Error: ${msg}`) })
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
    if (/(erstelle|erstellen|создай|создать|create|add|добавь|plan|plane|запланируй|schedule|update|измен|перенес|verschieb|delete|удал|löschen|apply|шаблон|template|reminder|напоминан)/i.test(message)) {
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
            else if (name === 'list_companies') {
              const all = await api('/crm/companies')
              let items = Array.isArray(all) ? all : (all?.items ?? [])
              const qv = String(args.q || '').trim().toLowerCase()
              if (qv) {
                items = items.filter((c: any) => {
                  const name = String(c?.name || '').toLowerCase()
                  const industry = String(c?.industry || '').toLowerCase()
                  const tags = String(c?.tags || '').toLowerCase()
                  return name.includes(qv) || industry.includes(qv) || tags.includes(qv)
                })
              }
              result = items
            }
            else if (name === 'list_contacts') result = await api('/crm/contacts')
            else if (name === 'list_deals') result = await api('/crm/deals')
            else if (name === 'list_content_items') {
              const sp = new URLSearchParams()
              if (args.q) sp.set('q', String(args.q))
              if (args.status) sp.set('status', String(args.status))
              const qs = sp.toString()
              const all = await api(`/content/items${qs ? `?${qs}` : ''}`)
              let items = Array.isArray(all) ? all : (all?.items ?? [])
              const from = args.scheduled_from ? new Date(args.scheduled_from) : null
              const to = args.scheduled_to ? new Date(args.scheduled_to) : null
              if (from) items = items.filter((it: any) => it?.scheduled_at ? new Date(it.scheduled_at) >= from : false)
              if (to) items = items.filter((it: any) => it?.scheduled_at ? new Date(it.scheduled_at) <= to : false)
              if (args.limit) items = items.slice(0, Number(args.limit))
              result = items
            }
            else if (name === 'get_content_item') {
              const id = Number(args.id)
              result = await api(`/content/items/${id}`)
            }
            else if (name === 'list_content_tasks') {
              const sp = new URLSearchParams()
              if (args.q) sp.set('q', String(args.q))
              if (args.status) sp.set('status', String(args.status))
              if (args.content_item_id != null) sp.set('content_item_id', String(args.content_item_id))
              const qs = sp.toString()
              const all = await api(`/content/tasks${qs ? `?${qs}` : ''}`)
              let items = Array.isArray(all) ? all : (all?.items ?? [])
              if (args.limit) items = items.slice(0, Number(args.limit))
              result = items
            }
            else if (name === 'list_content_templates') result = await api('/content/templates')
            else if (name === 'list_automation_rules') result = await api('/content/automation-rules')
            else if (name === 'list_notifications') {
              const sp = new URLSearchParams()
              if (args.unread_only) sp.set('unread_only', 'true')
              if (args.limit) sp.set('limit', String(args.limit))
              const qs = sp.toString()
              result = await api(`/content/notifications${qs ? `?${qs}` : ''}`)
            }
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
            else if (
              name === 'create_activity' ||
              name === 'update_activity' ||
              name === 'delete_activity' ||
              name?.startsWith('create_calendar') ||
              name?.startsWith('update_calendar') ||
              name?.startsWith('delete_calendar') ||
              name === 'create_content_item' ||
              name === 'update_content_item' ||
              name === 'delete_content_item' ||
              name === 'create_content_task' ||
              name === 'update_content_task' ||
              name === 'delete_content_task' ||
              name === 'complete_content_task' ||
              name === 'apply_content_template' ||
              name === 'generate_content_from_deal' ||
              name === 'run_content_reminders'
            ) {
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
                else if (name === 'create_content_item') result = await api('/content/items', { method: 'POST', body: JSON.stringify(args) })
                else if (name === 'update_content_item') result = await api(`/content/items/${args.id}`, { method: 'PATCH', body: JSON.stringify(args) })
                else if (name === 'delete_content_item') result = await api(`/content/items/${args.id}`, { method: 'DELETE' })
                else if (name === 'create_content_task') result = await api('/content/tasks', { method: 'POST', body: JSON.stringify(args) })
                else if (name === 'update_content_task') result = await api(`/content/tasks/${args.id}`, { method: 'PATCH', body: JSON.stringify(args) })
                else if (name === 'delete_content_task') result = await api(`/content/tasks/${args.id}`, { method: 'DELETE' })
                else if (name === 'complete_content_task') result = await api(`/content/tasks/${args.id}/complete`, { method: 'POST', body: JSON.stringify(args) })
                else if (name === 'apply_content_template') result = await api(`/content/items/${args.item_id}/apply-template`, { method: 'POST', body: JSON.stringify({ template_id: args.template_id }) })
                else if (name === 'generate_content_from_deal') result = await api(`/content/generate/from-deal/${args.deal_id}`, { method: 'POST', body: JSON.stringify({ template_id: args.template_id ?? null }) })
                else if (name === 'run_content_reminders') result = await api(`/content/reminders/run`, { method: 'POST', body: JSON.stringify(args) })
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
          const titleNorm = String(args.title || '').trim().toLowerCase()
          const genericNames = ['neues event','new event','termin','meeting','событие','event','content item','item','task','задача']
          const missingTitle = !args.title || genericNames.includes(titleNorm)
          const locale = lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'en-US'
          const fmtDT = (v: any) => {
            try { return new Date(String(v)).toLocaleString(locale) } catch { return String(v || '') }
          }
          const fmtTime = (v: any) => {
            try { return new Date(String(v)).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) } catch { return String(v || '') }
          }

          // calendar/activity: title + explicit time required
          const startStr: string = String(args.start || '')
          const hasExplicitTime = /T\d{2}:\d{2}/.test(startStr) && !/T00:00/.test(startStr)
          const missingTime = !startStr || !hasExplicitTime
          if ((pendingConfirm.name === 'create_calendar_event' || pendingConfirm.name === 'create_activity') && (missingTitle || missingTime)) {
            const q = missingTitle && missingTime
              ? t('Как назовём и на какое время? (напр. 15:00). Можно добавить описание.', 'Wie soll der Termin heißen und um wie viel Uhr? (z.B. 15:00). Optional: kurze Beschreibung.', 'What should it be called and at what time? (e.g. 15:00). Optional: short description.')
              : missingTitle
                ? t('Как назовём? Можно добавить описание.', 'Wie soll der Termin heißen? Optional: kurze Beschreibung.', 'What should it be called? Optional: short description.')
                : t('Укажи время (например 15:00). Можно добавить описание.', 'Bitte geben Sie die Uhrzeit an (z.B. 15:00). Optional: kurze Beschreibung.', 'Please provide the time (e.g. 15:00). Optional: short description.')
            return NextResponse.json({ reply: q })
          }
          if (pendingConfirm.name === 'create_content_item' && missingTitle) {
            return NextResponse.json({ reply: t('Как назвать Content Item?', 'Wie soll das Content Item heißen?', 'What should the content item be called?') })
          }
          if (pendingConfirm.name === 'create_content_task' && missingTitle) {
            return NextResponse.json({ reply: t('Как назвать задачу?', 'Wie soll die Aufgabe heißen?', 'What should the task be called?') })
          }

          // Format a nice preview message based on the tool arguments
          let preview = ''
          if (pendingConfirm.name === 'create_calendar_event' || pendingConfirm.name === 'create_activity') {
            preview = `📅 **${args.title || t('Новое событие', 'Neues Event', 'New event')}**\n\n`
            if (args.start) preview += `🕒 ${fmtDT(args.start)}`
            if (args.end) preview += ` ${t('до', 'bis', 'to')} ${fmtTime(args.end)}`
            if (args.category) preview += `\n🏷️ ${args.category}`
            if (args.description) preview += `\n\n📝 ${args.description}`
            preview += `\n\n${t('Создать?', 'Erstellen?', 'Create?')}`
          } else if (pendingConfirm.name === 'create_content_item' || pendingConfirm.name === 'update_content_item') {
            preview = `🧩 **${args.title || t('Content Item', 'Content Item', 'Content item')}**\n\n`
            preview += `🏷️ ${String(args.channel || 'Website')}${args.format ? ` · ${args.format}` : ''}\n`
            if (args.status) preview += `📌 ${args.status}\n`
            if (args.due_at) preview += `⏳ ${t('Дедлайн', 'Deadline', 'Due')}: ${fmtDT(args.due_at)}\n`
            if (args.scheduled_at) preview += `🗓️ ${t('Публикация', 'Publikation', 'Publish')}: ${fmtDT(args.scheduled_at)}\n`
            if (Array.isArray(args.tags) && args.tags.length) preview += `# ${args.tags.slice(0, 8).join(', ')}\n`
            if (args.brief) preview += `\n📝 ${String(args.brief).slice(0, 220)}${String(args.brief).length > 220 ? '…' : ''}`
            preview += `\n\n${t('Подтвердить изменения?', 'Änderungen bestätigen?', 'Confirm changes?')}`
          } else if (pendingConfirm.name === 'delete_content_item') {
            preview = `🗑️ ${t('Удалить Content Item', 'Content Item löschen', 'Delete content item')} #${args.id}?\n\n${t('Это действие необратимо.', 'Diese Aktion ist nicht rückgängig zu machen.', 'This action cannot be undone.')}`
          } else if (pendingConfirm.name === 'create_content_task' || pendingConfirm.name === 'update_content_task') {
            preview = `✅ **${args.title || t('Задача', 'Aufgabe', 'Task')}**\n\n`
            preview += `🏷️ ${String(args.channel || 'Website')}${args.format ? ` · ${args.format}` : ''}\n`
            if (args.status) preview += `📌 ${args.status}\n`
            if (args.priority) preview += `⚡ ${args.priority}\n`
            if (args.deadline) preview += `⏳ ${t('Дедлайн', 'Deadline', 'Due')}: ${fmtDT(args.deadline)}\n`
            if (args.content_item_id != null) preview += `🔗 Content Item: #${args.content_item_id}\n`
            preview += `\n${t('Подтвердить?', 'Bestätigen?', 'Confirm?')}`
          } else if (pendingConfirm.name === 'delete_content_task') {
            preview = `🗑️ ${t('Удалить задачу', 'Aufgabe löschen', 'Delete task')} #${args.id}?\n\n${t('Это действие необратимо.', 'Diese Aktion ist nicht rückgängig zu machen.', 'This action cannot be undone.')}`
          } else if (pendingConfirm.name === 'complete_content_task') {
            preview = `✅ ${t('Завершить задачу', 'Aufgabe abschließen', 'Complete task')} #${args.id}?\n\n${t('Если задача повторяющаяся, будет создан следующий цикл.', 'Wenn die Aufgabe wiederkehrend ist, wird die nächste erstellt.', 'If recurring, the next occurrence will be created.')}`
          } else if (pendingConfirm.name === 'apply_content_template') {
            preview = `🧩 ${t('Применить шаблон', 'Template anwenden', 'Apply template')} #${args.template_id} ${t('к Content Item', 'auf Content Item', 'to content item')} #${args.item_id}?`
          } else if (pendingConfirm.name === 'generate_content_from_deal') {
            preview = `✨ ${t('Создать Content Item из Deal', 'Content Item aus Deal erzeugen', 'Generate content item from deal')} #${args.deal_id}${args.template_id ? ` (${t('шаблон', 'Template', 'template')} #${args.template_id})` : ''}?`
          } else if (pendingConfirm.name === 'run_content_reminders') {
            preview = `🔔 ${t('Запустить напоминания по дедлайнам (24ч).', 'Deadline‑Reminders ausführen (24h).', 'Run deadline reminders (24h).')}`
          }

          return NextResponse.json({ reply: preview || t('Требуется подтверждение выполнения действия.', 'Bestätigung erforderlich.', 'Confirmation required.'), confirm: pendingConfirm })
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
            { role: 'system', content: systemPrompt + '\n\nCRITICAL: You said you would create/schedule something, but you did NOT call any tool. You MUST call the correct tool NOW (create_calendar_event / create_activity / create_content_item / create_content_task / update_* / delete_*). Use ALL details from the conversation history (title, date, time, description, channel, status, deadline). DO NOT reply with text - ONLY make the tool call.' },
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



