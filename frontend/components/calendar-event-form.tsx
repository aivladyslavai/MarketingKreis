"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  isDarkMode
}: CalendarEventFormProps) {
  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      duration: parseInt((formData.get('duration') as string) || '60') || 60,
      category: (formData.get('category') as string) || 'meeting',
      priority: formData.get('priority') as string,
      location: formData.get('location') as string,
      assignee: formData.get('assignee') as string,
    }
    onSave(eventData)
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl bg-white text-slate-900 border-slate-200 dark:bg-slate-900/90 dark:text-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {editingEvent ? '📅 Termin bearbeiten' : '📅 Neuer Termin'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                  Titel *
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  defaultValue={editingEvent?.title || ''}
                  className={`w-full p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'} focus:ring-2 focus:ring-blue-500/20`}
                  placeholder="z.B. Frühlingskampagne Launch"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                  Datum *
                </label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={editingEvent?.date || (selectedDate?.toISOString().split('T')[0]) || currentDate.toISOString().split('T')[0]}
                  className={`w-full p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'} focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                  Uhrzeit *
                </label>
                <input
                  name="time"
                  type="time"
                  required
                  defaultValue={editingEvent?.time || '09:00'}
                  className={`w-full p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'} focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                  Kategorie
                </label>
                <select
                  name="category"
                  defaultValue={(editingEvent?.category as string) || 'meeting'}
                  className={`w-full p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'} focus:ring-2 focus:ring-blue-500/20`}
                >
                  <option value="meeting">Meeting</option>
                  <option value="event">Event</option>
                  <option value="deadline">Deadline</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                  Ort
                </label>
                <input
                  name="location"
                  type="text"
                  defaultValue={editingEvent?.location || ''}
                  className={`w-full p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'} focus:ring-2 focus:ring-blue-500/20`}
                  placeholder="z.B. Hauptbüro, Zoom"
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                  Beschreibung
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingEvent?.description || ''}
                  className={`w-full p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'} focus:ring-2 focus:ring-blue-500/20`}
                  placeholder="Zusätzliche Details zum Termin..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-medium"
              >
                {editingEvent ? '💾 Speichern' : '📅 Erstellen'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-3 rounded-xl border transition-all font-medium ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                Abbrechen
              </button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  )
}


