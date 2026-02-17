"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Target,
  Video,
  FileText,
  Presentation,
} from "lucide-react"

// Mock Events Data
const events = [
  { 
    id: 1, 
    title: "Marketing Meeting", 
    date: "2024-06-15", 
    time: "10:00", 
    type: "meeting", 
    attendees: 5,
    color: "bg-blue-500",
    icon: Users,
  },
  { 
    id: 2, 
    title: "Campaign Launch", 
    date: "2024-06-18", 
    time: "14:00", 
    type: "campaign", 
    attendees: 12,
    color: "bg-purple-500",
    icon: Target,
  },
  { 
    id: 3, 
    title: "Content Review", 
    date: "2024-06-20", 
    time: "11:00", 
    type: "review", 
    attendees: 3,
    color: "bg-orange-500",
    icon: FileText,
  },
  { 
    id: 4, 
    title: "Client Presentation", 
    date: "2024-06-22", 
    time: "15:00", 
    type: "presentation", 
    attendees: 8,
    color: "bg-kaboom-red",
    icon: Presentation,
  },
  { 
    id: 5, 
    title: "Team Standup", 
    date: "2024-06-16", 
    time: "09:00", 
    type: "meeting", 
    attendees: 10,
    color: "bg-blue-500",
    icon: Video,
  },
  { 
    id: 6, 
    title: "Q2 Review", 
    date: "2024-06-25", 
    time: "16:00", 
    type: "review", 
    attendees: 15,
    color: "bg-orange-500",
    icon: FileText,
  },
]

type ViewMode = 'month' | 'week' | 'day' | 'year'

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date(2024, 5, 15)) // June 15, 2024

  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

  // Generate calendar days for month view
  const generateMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Monday = 0

    const days = []
    
    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: '', isCurrentMonth: false, date: '' })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({ day, isCurrentMonth: true, date: dateStr })
    }
    
    return days
  }

  // Check if date has events
  const getEventsForDate = (dateStr: string) => {
    return events.filter(event => event.date === dateStr)
  }

  // Navigation handlers
  const goToPrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))
    } else if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))
    } else if (viewMode === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))
    }
  }

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
    } else if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))
    } else if (viewMode === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date(2024, 5, 15))
  }

  // Render Month View
  const renderMonthView = () => {
    const days = generateMonthDays()
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="text-center font-semibold text-sm text-slate-600 dark:text-slate-400 py-2">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((dayObj, idx) => {
          const dayEvents = dayObj.date ? getEventsForDate(dayObj.date) : []
          const isToday = dayObj.date === '2024-06-15'
          
          return (
            <div
              key={idx}
              className={`
                min-h-[100px] p-2 rounded-lg border transition-all cursor-pointer
                ${dayObj.isCurrentMonth 
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-kaboom-red dark:hover:border-kaboom-red hover:shadow-lg' 
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
                }
                ${isToday ? 'ring-2 ring-kaboom-red' : ''}
              `}
              onClick={() => dayObj.date && alert(`Datum: ${dayObj.date}\nEvents: ${dayEvents.length}`)}
            >
              {dayObj.day && (
                <>
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-kaboom-red' : 'text-slate-900 dark:text-white'}`}>
                    {dayObj.day}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs px-2 py-1 rounded ${event.color} text-white truncate`}
                          title={event.title}
                        >
                          {event.time} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 px-2">
                          +{dayEvents.length - 2} mehr
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Render Week View
  const renderWeekView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentDate)
      date.setDate(date.getDate() - date.getDay() + i + 1)
      return date
    })

    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 gap-2 min-w-[800px]">
          {/* Time column */}
          <div className="space-y-2">
            <div className="h-12"></div>
            {hours.map(hour => (
              <div key={hour} className="h-16 text-xs text-slate-600 dark:text-slate-400">
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          
          {/* Day columns */}
          {weekDays.map((date, idx) => {
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            const dayEvents = getEventsForDate(dateStr)
            const isToday = dateStr === '2024-06-15'
            
            return (
              <div key={idx} className="space-y-2">
                <div className={`h-12 text-center ${isToday ? 'bg-kaboom-red text-white' : 'bg-slate-100 dark:bg-slate-800'} rounded-lg flex flex-col justify-center`}>
                  <div className="text-xs font-semibold">{dayNames[idx]}</div>
                  <div className="text-lg font-bold">{date.getDate()}</div>
                </div>
                <div className="space-y-2">
                  {dayEvents.map(event => {
                    const eventHour = parseInt(event.time.split(':')[0])
                    return (
                      <div
                        key={event.id}
                        className={`${event.color} text-white p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity`}
                        style={{ marginTop: `${eventHour * 4}rem` }}
                        onClick={() => alert(`Event: ${event.title}\nZeit: ${event.time}\nTeilnehmer: ${event.attendees}`)}
                      >
                        <div className="font-semibold">{event.time}</div>
                        <div className="truncate">{event.title}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render Day View
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
    const dayEvents = getEventsForDate(dateStr)

    return (
      <div className="space-y-2">
        {hours.map(hour => {
          const hourEvents = dayEvents.filter(e => parseInt(e.time.split(':')[0]) === hour)
          
          return (
            <div key={hour} className="flex gap-4 border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="w-20 text-sm text-slate-600 dark:text-slate-400 font-semibold">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="flex-1 space-y-2">
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    className={`${event.color} text-white p-4 rounded-lg cursor-pointer hover:opacity-90 transition-opacity`}
                    onClick={() => alert(`Event: ${event.title}\nZeit: ${event.time}\nTeilnehmer: ${event.attendees}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg">{event.title}</div>
                        <div className="text-sm opacity-90 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.attendees} Teilnehmer
                          </span>
                        </div>
                      </div>
                      <event.icon className="h-6 w-6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Render Year View
  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i)
    
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {months.map(month => {
          const monthEvents = events.filter(e => {
            const eventMonth = parseInt(e.date.split('-')[1]) - 1
            return eventMonth === month
          })
          
          return (
            <Card 
              key={month} 
              className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
              onClick={() => {
                setCurrentDate(new Date(currentDate.getFullYear(), month, 1))
                setViewMode('month')
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                  {monthNames[month]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-kaboom-red">{monthEvents.length}</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Events</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-kaboom-red to-red-600 flex items-center justify-center shadow-lg">
            <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Kalender</h1>
            <p className="text-slate-600 dark:text-slate-400">Termine und Events verwalten</p>
          </div>
        </div>
        <Button 
          className="bg-kaboom-red hover:bg-red-700"
          onClick={() => alert('Neuen Termin erstellen...')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Neuer Termin
        </Button>
      </div>

      {/* Controls */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* View Mode Buttons */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('year')}
                className={viewMode === 'year' ? 'bg-kaboom-red hover:bg-red-700' : ''}
              >
                Jahr
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
                className={viewMode === 'month' ? 'bg-kaboom-red hover:bg-red-700' : ''}
              >
                Monat
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
                className={viewMode === 'week' ? 'bg-kaboom-red hover:bg-red-700' : ''}
              >
                Woche
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
                className={viewMode === 'day' ? 'bg-kaboom-red hover:bg-red-700' : ''}
              >
                Tag
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-lg font-bold text-slate-900 dark:text-white min-w-[200px] text-center">
                {viewMode === 'year' && currentDate.getFullYear()}
                {viewMode === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                {viewMode === 'week' && `KW ${Math.ceil(currentDate.getDate() / 7)} - ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                {viewMode === 'day' && `${currentDate.getDate()}. ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              </div>
              
              <Button variant="outline" size="sm" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={goToToday}>
                Heute
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
        <CardContent className="p-6">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'year' && renderYearView()}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-kaboom-red" />
            Wichtige Kommende Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.slice(0, 6).map((event) => (
              <div
                key={event.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-kaboom-red dark:hover:border-kaboom-red transition-all cursor-pointer hover:shadow-lg"
                onClick={() => alert(`Event: ${event.title}\nDatum: ${event.date}\nZeit: ${event.time}\nTeilnehmer: ${event.attendees}`)}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg ${event.color} flex items-center justify-center flex-shrink-0`}>
                    <event.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{event.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.time}
                      </div>
                    </div>
                    <Badge className="mt-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                      {event.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
