"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Users,
  MousePointer,
  Eye,
  Target,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Mock Data
const monthlyData = [
  { month: 'Jan', umsatz: 180000, leads: 850, conversions: 210, roi: 240 },
  { month: 'Feb', umsatz: 195000, leads: 920, conversions: 245, roi: 255 },
  { month: 'Mär', umsatz: 210000, leads: 1050, conversions: 280, roi: 265 },
  { month: 'Apr', umsatz: 225000, leads: 1150, conversions: 310, roi: 275 },
  { month: 'Mai', umsatz: 240000, leads: 1234, conversions: 340, roi: 285 },
  { month: 'Jun', umsatz: 260000, leads: 1350, conversions: 380, roi: 295 },
]

const channelData = [
  { name: 'Social Media', value: 35, color: '#e62e3e' },
  { name: 'Email', value: 25, color: '#3b82f6' },
  { name: 'SEO', value: 20, color: '#10b981' },
  { name: 'Paid Ads', value: 15, color: '#f59e0b' },
  { name: 'Direct', value: 5, color: '#8b5cf6' },
]

const campaignPerformance = [
  { name: 'Frühlingskampagne', clicks: 12500, conversions: 450, roi: 320, status: 'active', budget: 25000, spent: 18500 },
  { name: 'Sommersale', clicks: 15200, conversions: 580, roi: 385, status: 'active', budget: 30000, spent: 22000 },
  { name: 'Newsletter Q2', clicks: 8900, conversions: 290, roi: 245, status: 'completed', budget: 15000, spent: 15000 },
  { name: 'LinkedIn Ads', clicks: 6700, conversions: 180, roi: 195, status: 'active', budget: 20000, spent: 12000 },
]

export default function PerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleExport = () => {
    alert('📊 Exportiere Performance-Daten als CSV...')
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const handleCampaignClick = (campaign: string) => {
    alert(`📈 Öffne Details für: ${campaign}`)
  }

  // KPI Stats
  const stats = [
    { 
      title: "Gesamtumsatz", 
      value: "CHF 2.4M", 
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    { 
      title: "Leads Generiert", 
      value: "1,234", 
      change: "+23%",
      trend: "up",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    { 
      title: "Conversions", 
      value: "340", 
      change: "+15%",
      trend: "up",
      icon: Target,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    { 
      title: "ROI", 
      value: "285%", 
      change: "+8%",
      trend: "up",
      icon: TrendingUp,
      color: "text-kaboom-red",
      bgColor: "bg-red-50 dark:bg-red-900/20"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-kaboom-red to-red-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Performance Übersicht</h1>
            <p className="text-slate-600 dark:text-slate-400">Metriken, Analytics und Kampagnen-Performance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {['7d', '30d', '90d'].map((period) => (
              <Button
                key={period}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className={`text-xs ${
                  selectedPeriod === period 
                    ? 'bg-white dark:bg-slate-700 shadow-sm' 
                    : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                {period === '7d' ? '7 Tage' : period === '30d' ? '30 Tage' : '90 Tage'}
              </Button>
            ))}
          </div>

          <Button 
            onClick={handleRefresh}
            variant="outline" 
            size="sm"
            disabled={isRefreshing}
            className="border-slate-300 dark:border-slate-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>

          <Button 
            onClick={handleExport}
            variant="outline" 
            size="sm"
            className="border-slate-300 dark:border-slate-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <Badge className={`${
                  stat.trend === 'up' 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {stat.change}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="channels">Kanäle</TabsTrigger>
          <TabsTrigger value="campaigns">Kampagnen</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
              <CardHeader className="border-b dark:border-slate-700">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Umsatzentwicklung
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorUmsatz" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="umsatz" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorUmsatz)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Leads & Conversions Chart */}
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
              <CardHeader className="border-b dark:border-slate-700">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Users className="h-5 w-5 text-blue-600" />
                  Leads & Conversions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="leads" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="conversions" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ROI Trend */}
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
            <CardHeader className="border-b dark:border-slate-700">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <TrendingUp className="h-5 w-5 text-kaboom-red" />
                ROI Entwicklung
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="roi" 
                    stroke="#e62e3e" 
                    strokeWidth={3}
                    dot={{ fill: '#e62e3e', r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Distribution */}
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
              <CardHeader className="border-b dark:border-slate-700">
                <CardTitle className="text-slate-900 dark:text-white">Kanal-Verteilung</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Channel Stats */}
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
              <CardHeader className="border-b dark:border-slate-700">
                <CardTitle className="text-slate-900 dark:text-white">Kanal-Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {channelData.map((channel, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: channel.color }}
                        />
                        <span className="font-medium text-slate-900 dark:text-white">{channel.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{channel.value}%</span>
                        <Button size="sm" variant="ghost" onClick={() => alert(`Details für ${channel.name}`)}>
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
            <CardHeader className="border-b dark:border-slate-700">
              <CardTitle className="text-slate-900 dark:text-white">Aktive Kampagnen</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {campaignPerformance.map((campaign, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-kaboom-red dark:hover:border-kaboom-red transition-all cursor-pointer hover:shadow-lg"
                    onClick={() => handleCampaignClick(campaign.name)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{campaign.name}</h3>
                        <Badge className={
                          campaign.status === 'active' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mt-2' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 mt-2'
                        }>
                          {campaign.status === 'active' ? '🟢 Aktiv' : '✅ Abgeschlossen'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Budget</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                          CHF {(campaign.spent / 1000).toFixed(1)}k / {(campaign.budget / 1000).toFixed(0)}k
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Clicks</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Conversions</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{campaign.conversions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">ROI</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{campaign.roi}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-kaboom-red h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
