// @ts-nocheck

// @ts-nocheck

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, Plus, Circle, List, Calendar, TrendingUp, Activity, CheckCircle2, Clock, Users } from "lucide-react"
                                                                                                                                                                                                                                                                                      
// Marketing activities data
const marketingActivities = [
  { id: '1', tipp: 'Tipp 1', title: 'Planung', category: 'Verkaufsförderung', color: '#4a5fc1', size: 'large', angle: 0, status: 'active', progress: 85 },
  { id: '2', tipp: 'Tipp 2', title: '', category: 'Verkaufsförderung', color: '#4a5fc1', size: 'small', angle: 25, status: 'planned', progress: 20 },
  { id: '3', tipp: 'Tipp 3', title: 'Frauenpower', category: 'Image', color: '#e879b9', size: 'small', angle: 50, status: 'active', progress: 60 },
  { id: '4', tipp: 'Tipp 4', title: 'Frühlingspflege', category: 'Image', color: '#e879b9', size: 'small', angle: 75, status: 'completed', progress: 100 },
  { id: '5', tipp: '', title: 'Unterhalt', category: 'Verkaufsförderung', color: '#4a5fc1', size: 'large', angle: 100, status: 'active', progress: 75 },
  { id: '6', tipp: 'Tipp 5', title: 'Frauenpower', category: 'Employer Branding', color: '#fbbf24', size: 'small', angle: 125, status: 'planned', progress: 30 },
  { id: '7', tipp: 'Tipp 6', title: 'Schnuppern', category: 'Employer Branding', color: '#fbbf24', size: 'small', angle: 145, status: 'active', progress: 55 },
  { id: '8', tipp: 'Tipp 7', title: 'Referenzen', category: 'Image', color: '#e879b9', size: 'large', angle: 170, status: 'active', progress: 90 },
  { id: '9', tipp: 'Tipp 8', title: '', category: 'Image', color: '#e879b9', size: 'small', angle: 195, status: 'planned', progress: 15 },
  { id: '10', tipp: 'Tipp 9', title: 'Pool', category: 'Verkaufsförderung', color: '#4a5fc1', size: 'large', angle: 220, status: 'active', progress: 70 },
  { id: '11', tipp: '', title: 'neue/r Mitarbeiter/in Lehre', category: 'Employer Branding', color: '#fbbf24', size: 'small', angle: 245, status: 'planned', progress: 25 },
  { id: '12', tipp: 'Tipp 10', title: 'Herbstpflege', category: 'Image', color: '#e879b9', size: 'small', angle: 265, status: 'active', progress: 50 },
  { id: '13', tipp: 'Tipp 11', title: 'neue/r Mitarbeiter/in', category: 'Employer Branding', color: '#fbbf24', size: 'small', angle: 290, status: 'completed', progress: 100 },
  { id: '14', tipp: 'Tipp 12', title: 'Weihnachten', category: 'Kundenpflege', color: '#99d6c6', size: 'small', angle: 315, status: 'planned', progress: 10 },
  { id: '15', tipp: '', title: 'MARKETING', category: 'Image', color: '#e879b9', size: 'medium', angle: 340, status: 'active', progress: 65 },
]

export default function ActivitiesPage() {
  const [view, setView] = useState<"circle" | "list">("circle")
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })

  const handlePointClick = (id: string, event: React.MouseEvent) => {
    const rect = (event.target as SVGElement).getBoundingClientRect()
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    })
    setSelectedPoint(selectedPoint === id ? null : id)
  }

  const getPointRadius = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'large': return 22
      case 'medium': return 16
      case 'small': return 8
      default: return 8
    }
  }

  // Calculate category distribution for chart
  const categoryStats = marketingActivities.reduce((acc, activity) => {
    acc[activity.category] = (acc[activity.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalActivities = marketingActivities.length
  const activeCount = marketingActivities.filter(a => a.status === 'active').length
  const completedCount = marketingActivities.filter(a => a.status === 'completed').length
  const plannedCount = marketingActivities.filter(a => a.status === 'planned').length

  return (
    <div className="space-y-8 relative">
      {/* Elegant Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20">
              <Target className="h-10 w-10 text-blue-400" />
            </div>
            <div>
              <h1 className="text-5xl font-light tracking-tight text-white mb-3">
                Marketing Circle
              </h1>
              <p className="text-slate-300 text-lg font-light tracking-wide">
                GARTUS 2023 <span className="mx-3 text-slate-600">•</span> Strategische Jahresplanung
              </p>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  <span className="text-sm font-light">Live</span>
                </div>
                <div className="text-slate-500 text-sm font-light">
                  {new Date().toLocaleTimeString('de-DE')}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 backdrop-blur-sm rounded-xl p-1.5 border border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("circle")}
                className={`text-white hover:bg-white/10 transition-all duration-300 font-light ${
                  view === "circle" ? "bg-white/20 shadow-lg" : ""
                }`}
              >
                <Circle className="h-4 w-4 mr-2" />
                Circle
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("list")}
                className={`text-white hover:bg-white/10 transition-all duration-300 font-light ${
                  view === "list" ? "bg-white/20 shadow-lg" : ""
                }`}
              >
                <List className="h-4 w-4 mr-2" />
                Liste
              </Button>
            </div>
            
            <Button 
              onClick={() => alert('Neue Aktivität')}
              className="bg-white/10 text-white hover:bg-white/20 font-light shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 backdrop-blur-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Aktivität
            </Button>
          </div>
        </div>
      </div>

      {/* Elegant Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Gesamt", value: totalActivities.toString(), subtitle: "Aktivitäten", icon: Target, gradient: "from-blue-500/10 to-blue-600/10", border: "border-blue-500/20", text: "text-blue-400" },
          { title: "Aktiv", value: activeCount.toString(), subtitle: "In Bearbeitung", icon: Activity, gradient: "from-emerald-500/10 to-emerald-600/10", border: "border-emerald-500/20", text: "text-emerald-400" },
          { title: "Abgeschlossen", value: completedCount.toString(), subtitle: "Erfolgreich", icon: CheckCircle2, gradient: "from-purple-500/10 to-purple-600/10", border: "border-purple-500/20", text: "text-purple-400" },
          { title: "Geplant", value: plannedCount.toString(), subtitle: "In Vorbereitung", icon: Clock, gradient: "from-amber-500/10 to-amber-600/10", border: "border-amber-500/20", text: "text-amber-400" },
        ].map((stat, idx) => (
          <Card key={idx} className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} border ${stat.border} backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-1`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center border ${stat.border} shadow-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.text}`} />
                </div>
              </div>
              <div className={`text-4xl font-light ${stat.text} mb-1`}>{stat.value}</div>
              <p className="text-sm font-light text-slate-400">{stat.title}</p>
              <p className="text-xs font-light text-slate-500 mt-1">{stat.subtitle}</p>
              
              {/* Decorative element */}
              <div className={`absolute -bottom-4 -right-4 w-24 h-24 ${stat.gradient} rounded-full blur-2xl opacity-20`}></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Circle - Premium Edition */}
        <div className="lg:col-span-2">
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-purple-900/5 to-pink-900/5"></div>
            
            <CardHeader className="relative border-b border-slate-700/30 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-light text-white mb-2">
                    Marketing Circle 2023
                  </CardTitle>
                  <p className="text-slate-400 text-sm font-light">Interaktive Jahresübersicht</p>
                </div>
                <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-emerald-400 text-sm font-light">Live</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8 relative">
              <div className="relative w-full h-[700px] flex items-center justify-center">
                <svg width="700" height="700" viewBox="0 0 700 700" className="w-full h-full">
                  <defs>
                    {/* Premium Gradients */}
                    <radialGradient id="premiumOuter" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                      <stop offset="30%" stopColor="#a78bfa" stopOpacity="0.6" />
                      <stop offset="60%" stopColor="#ec4899" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.4" />
                    </radialGradient>
                    
                    <radialGradient id="premiumInner" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.3" />
                    </radialGradient>
                    
                    <radialGradient id="premiumCenter" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1e293b" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
                    </radialGradient>
                    
                    <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                      <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>

                    {/* Premium Filters */}
                    <filter id="premiumGlow" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="6" result="blur"/>
                      <feComposite in="blur" in2="blur" operator="over" result="doubleBlur"/>
                      <feMerge>
                        <feMergeNode in="doubleBlur"/>
                        <feMergeNode in="doubleBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    
                    <filter id="premiumShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.5)"/>
                    </filter>
                    
                    <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                      <feOffset dx="0" dy="2" result="offsetblur"/>
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.5"/>
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Rotating background shimmer */}
                  <circle
                    cx="350"
                    cy="350"
                    r="310"
                    fill="none"
                    stroke="url(#shimmer)"
                    strokeWidth="20"
                    opacity="0.1"
                    className="animate-spin"
                    style={{ animationDuration: '20s' }}
                  />

                  {/* Outer Ring - Elegant & Refined */}
                  <circle
                    cx="350"
                    cy="350"
                    r="295"
                    fill="none"
                    stroke="url(#premiumOuter)"
                    strokeWidth="2"
                    opacity="0.5"
                    filter="url(#premiumGlow)"
                    className="animate-pulse"
                    style={{ animationDuration: '4s' }}
                  />
                  
                  {/* Outer ring decoration */}
                  <circle
                    cx="350"
                    cy="350"
                    r="288"
                    fill="none"
                    stroke="url(#premiumOuter)"
                    strokeWidth="0.5"
                    strokeDasharray="3,8"
                    opacity="0.3"
                    className="animate-spin"
                    style={{ animationDuration: '30s' }}
                  />

                  {/* Inner Ring (VERKAUF) - Refined */}
                  <circle
                    cx="350"
                    cy="350"
                    r="150"
                    fill="none"
                    stroke="url(#premiumInner)"
                    strokeWidth="1.5"
                    opacity="0.4"
                    filter="url(#premiumGlow)"
                  />
                  
                  {/* Inner ring glow */}
                  <circle
                    cx="350"
                    cy="350"
                    r="145"
                    fill="none"
                    stroke="url(#premiumInner)"
                    strokeWidth="0.5"
                    strokeDasharray="4,6"
                    opacity="0.2"
                  />

                  {/* VERKAUF label */}
                  <text
                    x="350"
                    y="220"
                    textAnchor="middle"
                    className="text-sm font-light fill-slate-400"
                    letterSpacing="0.2em"
                    filter="url(#premiumGlow)"
                  >
                    VERKAUF
                  </text>
                  
                  {/* Refined tick marks */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                    const radian = (angle - 90) * Math.PI / 180
                    const x1 = 350 + 142 * Math.cos(radian)
                    const y1 = 350 + 142 * Math.sin(radian)
                    const x2 = 350 + 158 * Math.cos(radian)
                    const y2 = 350 + 158 * Math.sin(radian)
                    return (
                      <g key={angle}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#6366f1"
                          strokeWidth="1"
                          opacity="0.3"
                        />
                      </g>
                    )
                  })}

                  {/* Center Circle - GARTUS 2023 Refined */}
                  <circle
                    cx="350"
                    cy="350"
                    r="85"
                    fill="url(#premiumCenter)"
                    opacity="0.95"
                    filter="url(#premiumShadow)"
                  />
                  
                  <circle
                    cx="350"
                    cy="350"
                    r="80"
                    fill="none"
                    stroke="url(#premiumInner)"
                    strokeWidth="2"
                    opacity="0.5"
                    filter="url(#premiumGlow)"
                  />
                  
                  {/* Inner decorative rings */}
                  <circle
                    cx="350"
                    cy="350"
                    r="72"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="0.5"
                    opacity="0.25"
                  />
                  
                  <circle
                    cx="350"
                    cy="350"
                    r="64"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="0.3"
                    strokeDasharray="3,6"
                    opacity="0.15"
                    className="animate-spin"
                    style={{ animationDuration: '15s', transformOrigin: '350px 350px' }}
                  />

                  {/* Refined GARTUS Logo */}
                  <g transform="translate(350, 338)">
                    <circle cx="0" cy="0" r="20" fill="#6366f1" opacity="0.08"/>
                    <path
                      d="M-14,-9 L-5,0 L-14,9 M-5,0 L14,0 M14,-9 L5,0 L14,9 M0,-14 L0,14"
                      stroke="url(#premiumOuter)"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.7"
                      filter="url(#premiumGlow)"
                    />
                  </g>

                  <text
                    x="350"
                    y="375"
                    textAnchor="middle"
                    className="text-xl font-light fill-white"
                    letterSpacing="0.18em"
                    filter="url(#premiumGlow)"
                  >
                    GARTUS
                  </text>
                  
                  <text
                    x="350"
                    y="400"
                    textAnchor="middle"
                    className="text-3xl font-extralight fill-slate-200"
                    letterSpacing="0.12em"
                    opacity="0.9"
                  >
                    2023
                  </text>
                  
                  {/* Decorative sparkles */}
                  {[
                    { cx: 320, cy: 320, delay: '0s' },
                    { cx: 380, cy: 325, delay: '0.5s' },
                    { cx: 325, cy: 380, delay: '1s' },
                    { cx: 375, cy: 375, delay: '1.5s' },
                  ].map((sparkle, i) => (
                    <circle
                      key={i}
                      cx={sparkle.cx}
                      cy={sparkle.cy}
                      r="2"
                      fill="#60a5fa"
                      opacity="0.6"
                      className="animate-pulse"
                      style={{ animationDelay: sparkle.delay, animationDuration: '3s' }}
                    />
                  ))}

                  {/* Activity Points - Premium */}
                  {marketingActivities.map((activity) => {
                    const isSelected = selectedPoint === activity.id
                    const isHovered = hoveredPoint === activity.id
                    const pointRadius = getPointRadius(activity.size as 'small' | 'medium' | 'large')
                    const radian = (activity.angle - 90) * Math.PI / 180
                    const radius = 295
                    const x = 350 + radius * Math.cos(radian)
                    const y = 350 + radius * Math.sin(radian)

                    const labelRadius = 340
                    const labelX = 350 + labelRadius * Math.cos(radian)
                    const labelY = 350 + labelRadius * Math.sin(radian)

                    return (
                      <g key={activity.id}>
                        {/* Connection line */}
                        <line
                          x1="350"
                          y1="350"
                          x2={x}
                          y2={y}
                          stroke={activity.color}
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          opacity={isHovered || isSelected ? "0.5" : "0.2"}
                          className="transition-all duration-300"
                          filter={isHovered || isSelected ? "url(#premiumGlow)" : ""}
                        />

                        {/* Subtle glow effect */}
                        {(isSelected || isHovered) && (
                          <circle
                            cx={x}
                            cy={y}
                            r={pointRadius + 8}
                            fill={activity.color}
                            opacity="0.2"
                            filter="url(#premiumGlow)"
                            className="animate-pulse"
                          />
                        )}

                        {/* Progress ring for large points */}
                        {activity.size === 'large' && (
                          <circle
                            cx={x}
                            cy={y}
                            r={pointRadius + 4}
                            fill="none"
                            stroke={activity.color}
                            strokeWidth="1.5"
                            strokeDasharray={`${2 * Math.PI * (pointRadius + 4) * activity.progress / 100} ${2 * Math.PI * (pointRadius + 4)}`}
                            opacity="0.35"
                            transform={`rotate(-90 ${x} ${y})`}
                          />
                        )}

                        {/* Subtle Shadow */}
                        <circle
                          cx={x + 1}
                          cy={y + 1.5}
                          r={isHovered ? pointRadius + 1.5 : pointRadius}
                          fill="rgba(0,0,0,0.25)"
                          className="pointer-events-none"
                        />

                        {/* Main Point - Refined */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? pointRadius + 1.5 : pointRadius}
                          fill={activity.color}
                          stroke={isSelected ? "#ffffff" : activity.size === 'large' ? "#ffffff" : "#f1f5f9"}
                          strokeWidth={activity.size === 'large' ? "2.5" : activity.size === 'medium' ? "2" : "1.5"}
                          filter="url(#premiumShadow)"
                          className="cursor-pointer transition-all duration-300"
                          onClick={(e) => handlePointClick(activity.id, e)}
                          onMouseEnter={() => setHoveredPoint(activity.id)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          style={{ cursor: 'pointer' }}
                        />

                        {/* Refined inner decoration for large points */}
                        {activity.size === 'large' && (
                          <>
                            <circle
                              cx={x}
                              cy={y}
                              r={pointRadius - 6}
                              fill="none"
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="1"
                              className="pointer-events-none"
                            />
                            <circle
                              cx={x - 5}
                              cy={y - 5}
                              r={pointRadius / 4}
                              fill="rgba(255,255,255,0.6)"
                              className="pointer-events-none"
                            />
                          </>
                        )}
                        
                        {/* Subtle status indicator */}
                        {activity.status === 'completed' && (
                          <circle
                            cx={x + pointRadius - 2}
                            cy={y - pointRadius + 2}
                            r="3"
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth="1"
                            className="pointer-events-none"
                          />
                        )}

                        {/* Refined Labels with better spacing */}
                        {activity.tipp && (
                          <text
                            x={labelX}
                            y={labelY - 8}
                            textAnchor="middle"
                            className="text-xs font-light pointer-events-none fill-pink-300"
                            opacity="0.9"
                          >
                            {activity.tipp}
                          </text>
                        )}
                        
                        {activity.title && (
                          <text
                            x={labelX}
                            y={labelY + (activity.tipp ? 6 : 2)}
                            textAnchor="middle"
                            className="text-sm font-light pointer-events-none fill-slate-200"
                            opacity="0.95"
                          >
                            {activity.title}
                          </text>
                        )}
                      </g>
                    )
                  })}

                  {/* Premium Legend */}
                  <g transform="translate(100, 625)">
                    <circle cx="0" cy="0" r="7" fill="#4a5fc1" opacity="0.9" filter="url(#premiumGlow)"/>
                    <circle cx="0" cy="0" r="4" fill="#6366f1" />
                    <text x="18" y="5" className="text-sm font-light fill-slate-200">
                      Verkaufsförderung
                    </text>
                  </g>
                  
                  <g transform="translate(100, 655)">
                    <circle cx="0" cy="0" r="7" fill="#e879b9" opacity="0.9" filter="url(#premiumGlow)"/>
                    <circle cx="0" cy="0" r="4" fill="#ec4899" />
                    <text x="18" y="5" className="text-sm font-light fill-slate-200">
                      Image
                    </text>
                  </g>
                  
                  <g transform="translate(350, 625)">
                    <circle cx="0" cy="0" r="7" fill="#fbbf24" opacity="0.9" filter="url(#premiumGlow)"/>
                    <circle cx="0" cy="0" r="4" fill="#f59e0b" />
                    <text x="18" y="5" className="text-sm font-light fill-slate-200">
                      Employer Branding
                    </text>
                  </g>
                  
                  <g transform="translate(350, 655)">
                    <circle cx="0" cy="0" r="7" fill="#99d6c6" opacity="0.9" filter="url(#premiumGlow)"/>
                    <circle cx="0" cy="0" r="4" fill="#6ee7b7" />
                    <text x="18" y="5" className="text-sm font-light fill-slate-200">
                      Kundenpflege
                    </text>
                  </g>
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Charts & Info */}
        <div className="space-y-6">
          {/* Category Distribution */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 shadow-xl">
            <CardHeader className="border-b border-slate-700/30">
              <CardTitle className="text-xl font-light text-white">Verteilung</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Object.entries(categoryStats).map(([category, count], idx) => {
                  const percentage = (count / totalActivities) * 100
                  const colors = {
                    'Verkaufsförderung': { bg: 'bg-blue-500', glow: 'shadow-blue-500/50' },
                    'Image': { bg: 'bg-pink-500', glow: 'shadow-pink-500/50' },
                    'Employer Branding': { bg: 'bg-amber-500', glow: 'shadow-amber-500/50' },
                    'Kundenpflege': { bg: 'bg-teal-500', glow: 'shadow-teal-500/50' }
                  }
                  const color = colors[category as keyof typeof colors] || colors['Verkaufsförderung']
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300 font-light">{category}</span>
                        <span className="text-slate-400 font-light">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${color.bg} rounded-full transition-all duration-1000 shadow-lg ${color.glow}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Status Progress */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 shadow-xl">
            <CardHeader className="border-b border-slate-700/30">
              <CardTitle className="text-xl font-light text-white">Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-light text-slate-300">Aktiv</p>
                    <p className="text-2xl font-light text-emerald-400">{activeCount}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-light text-slate-300">Abgeschlossen</p>
                    <p className="text-2xl font-light text-purple-400">{completedCount}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-light text-slate-300">Geplant</p>
                    <p className="text-2xl font-light text-amber-400">{plannedCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 shadow-xl">
            <CardHeader className="border-b border-slate-700/30">
              <CardTitle className="text-xl font-light text-white">Team</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-center p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10">
                <div className="text-center">
                  <Users className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-3xl font-light text-white mb-1">8</p>
                  <p className="text-sm font-light text-slate-400">Aktive Mitarbeiter</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Popup - Premium */}
      {selectedPoint && (() => {
        const activity = marketingActivities.find(a => a.id === selectedPoint)
        if (!activity) return null
        
        return (
          <div 
            className="fixed z-50 transform -translate-x-1/2 -translate-y-full mb-4"
            style={{ 
              left: `${popupPosition.x}px`, 
              top: `${popupPosition.y}px`,
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <div className="relative">
              {/* Popup arrow */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
              
              {/* Popup content */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 shadow-2xl p-6 min-w-[320px] backdrop-blur-xl">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-light text-white mb-1">
                        {activity.title || activity.tipp}
                      </h3>
                      <p className="text-sm font-light text-slate-400">
                        {activity.category}
                      </p>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: activity.color }}
                    >
                      <Target className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-light">Fortschritt</span>
                      <span className="text-white font-light">{activity.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 shadow-lg"
                        style={{ 
                          width: `${activity.progress}%`,
                          backgroundColor: activity.color,
                          boxShadow: `0 0 10px ${activity.color}50`
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`font-light ${
                        activity.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        activity.status === 'completed' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                        'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      } border`}
                    >
                      {activity.status === 'active' ? '🟢 Aktiv' : activity.status === 'completed' ? '✅ Abgeschlossen' : '⏳ Geplant'}
                    </Badge>
                    {activity.tipp && (
                      <Badge className="border border-slate-600 text-slate-300 font-light bg-transparent">
                        {activity.tipp}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 bg-white/10 text-white hover:bg-white/20 font-light border border-white/20"
                      size="sm"
                      onClick={() => alert(`Details: ${activity.title || activity.tipp}`)}
                    >
                      Details
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white hover:bg-white/10"
                      onClick={() => setSelectedPoint(null)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(calc(-100% - 10px));
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(calc(-100% - 16px));
          }
        }
      `}</style>
    </div>
  )
}
