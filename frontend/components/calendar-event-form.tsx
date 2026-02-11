"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/form-field"
import { GlassSelect } from "@/components/ui/glass-select"
import { CalendarDays } from "lucide-react"

interface CalendarEventFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: any) => void
  editingEvent?: any
  selectedDate?: Date | null
  currentDate: Date
  isDarkMode: boolean
}

export function CalendarEventForm({
  isOpen,
  onClose,
  onSave,
  editingEvent,
  selectedDate,
  currentDate,
  // kept in props for backwards-compat; styling is now consistent in dark/light
}: CalendarEventFormProps) {
  if (!isOpen) return null

  const initialDate =
    (editingEvent?.date as string) ||
    (selectedDate?.toISOString().split("T")[0] as string | undefined) ||
    currentDate.toISOString().split("T")[0]

  const [title, setTitle] = React.useState<string>(editingEvent?.title || "")
  const [description, setDescription] = React.useState<string>(editingEvent?.description || "")
  const [date, setDate] = React.useState<string>(initialDate)
  const [time, setTime] = React.useState<string>(editingEvent?.time || "09:00")
  const [duration, setDuration] = React.useState<number>(Number(editingEvent?.duration || 60))
  const [category, setCategory] = React.useState<string>(editingEvent?.category || "meeting")
  const [location, setLocation] = React.useState<string>(editingEvent?.location || "")

  React.useEffect(() => {
    if (!isOpen) return
    setTitle(editingEvent?.title || "")
    setDescription(editingEvent?.description || "")
    setDate(initialDate)
    setTime(editingEvent?.time || "09:00")
    setDuration(Number(editingEvent?.duration || 60))
    setCategory(editingEvent?.category || "meeting")
    setLocation(editingEvent?.location || "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingEvent, selectedDate?.toISOString(), currentDate.toISOString()])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSave({
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      duration: Number(duration || 60),
      category,
      location: location.trim(),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="w-[min(92vw,760px)] sm:max-w-[760px] bg-white/80 dark:bg-slate-950/50 border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-900 dark:text-white text-base sm:text-lg font-semibold leading-tight">
                  {editingEvent ? "Termin bearbeiten" : "Neuer Termin"}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">Datum, Zeit und Details</div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField id="evt_title" label="Titel" required>
                {({ describedBy, invalid }) => (
                  <Input
                    id="evt_title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z.B. Frühlingskampagne Launch"
                    required
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                  />
                )}
              </FormField>
            </div>

            <FormField id="evt_date" label="Datum" required>
              {({ describedBy, invalid }) => (
                <Input
                  id="evt_date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                />
              )}
            </FormField>

            <FormField id="evt_time" label="Uhrzeit" required>
              {({ describedBy, invalid }) => (
                <Input
                  id="evt_time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                />
              )}
            </FormField>

            <FormField id="evt_category" label="Kategorie">
              {({ describedBy, invalid }) => (
                <GlassSelect
                  value={category}
                  onChange={(v) => setCategory(v)}
                  options={[
                    { value: "meeting", label: "Meeting" },
                    { value: "event", label: "Event" },
                    { value: "deadline", label: "Deadline" },
                    { value: "reminder", label: "Reminder" },
                  ]}
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  className="w-full"
                />
              )}
            </FormField>

            <FormField id="evt_location" label="Ort">
              {({ describedBy, invalid }) => (
                <Input
                  id="evt_location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="z.B. Hauptbüro, Zoom"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                />
              )}
            </FormField>

            <FormField id="evt_duration" label="Dauer (Min.)" hint="Standard: 60">
              {({ describedBy, invalid }) => (
                <Input
                  id="evt_duration"
                  type="number"
                  value={String(duration || 60)}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  min="5"
                  step="5"
                  placeholder="60"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                />
              )}
            </FormField>

            <div className="sm:col-span-2">
              <FormField id="evt_desc" label="Beschreibung">
                {({ describedBy, invalid }) => (
                  <Textarea
                    id="evt_desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Zusätzliche Details zum Termin…"
                    rows={4}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                  />
                )}
              </FormField>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 border-white/15 bg-white/50 hover:bg-white/70 dark:bg-slate-950/20 dark:hover:bg-slate-950/30"
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={!title.trim()} className="h-11 bg-white text-slate-900 hover:bg-white/90 dark:bg-white dark:text-slate-900">
              {editingEvent ? "Speichern" : "Erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


