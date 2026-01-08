"use client"

import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}



import * as React from "react"
import Link from "next/link"

// Полная dashboard страница с оригинальным контентом из complex файла, но без проблемных зависимостей
export default function DashboardFullPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Оригинальные данные из complex файла
  const demoChart = [
    { period: 'Jan', leads: 120, spend: 20000, cpl: 166, conversion: 3.2 },
    { period: 'Feb', leads: 150, spend: 22000, cpl: 146, conversion: 3.8 },
    { period: 'Mar', leads: 180, spend: 24000, cpl: 133, conversion: 4.1 },
    { period: 'Apr', leads: 165, spend: 21000, cpl: 127, conversion: 4.5 },
    { period: 'Mai', leads: 195, spend: 25000, cpl: 128, conversion: 4.2 },
    { period: 'Jun', leads: 220, spend: 26000, cpl: 118, conversion: 4.8 },
  ]

  const categoryData = [
    { name: 'Digital Marketing', value: 35, color: '#3B82F6' },
    { name: 'Content Marketing', value: 25, color: '#8B5CF6' },
    { name: 'Event Marketing', value: 20, color: '#06B6D4' },
    { name: 'PR & Branding', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' },
  ]

  // Оригинальные marketing data из complex файла
  const marketingData = [
    {
      id: '1',
      title: 'Q4 SEO Kampagne',
      category: 'Digital Marketing',
      status: 'active',
      priority: 'high',
      budget: 25000,
      expectedLeads: 180,
      actualLeads: 165,
      cpl: 151,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      assignee: 'Marketing Team',
      description: 'Umfassende SEO-Optimierung für Q4 mit Fokus auf lokale Suchanfragen'
    },
    {
      id: '2',
      title: 'Product Launch Event',
      category: 'Event Marketing',
      status: 'completed',
      priority: 'high',
      budget: 30000,
      expectedLeads: 220,
      actualLeads: 245,
      cpl: 122,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 100,
      assignee: 'Event Team',
      description: 'Großes Launch-Event für neues Produktportfolio'
    },
    {
      id: '3',
      title: 'Social Media Strategie',
      category: 'Content Marketing',
      status: 'active',
      priority: 'medium',
      budget: 15000,
      expectedLeads: 120,
      actualLeads: 95,
      cpl: 158,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      progress: 45,
      assignee: 'Content Team',
      description: 'Kontinuierliche Social Media Präsenz mit wöchentlichen Posts'
    },
    {
      id: '4',
      title: 'Email Newsletter Campaign',
      category: 'Email Marketing',
      status: 'active',
      priority: 'medium',
      budget: 8000,
      expectedLeads: 95,
      actualLeads: 88,
      cpl: 91,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 60,
      assignee: 'Marketing Team',
      description: 'Monatlicher Newsletter mit personalisierten Inhalten'
    },
    {
      id: '5',
      title: 'Brand Awareness Campaign',
      category: 'PR & Branding',
      status: 'planning',
      priority: 'low',
      budget: 18000,
      expectedLeads: 160,
      actualLeads: 0,
      cpl: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-31',
      progress: 20,
      assignee: 'PR Team',
      description: 'Langfristige Markenaufbau-Kampagne über verschiedene Kanäle'
    }
  ]

  // Oригинальная навигация
  const navigation = [
    { name: "Dashboard", href: "/dashboard-full", icon: "📊", description: "Überblick und KPIs" },
    { name: "Marketing Circle", href: "/activities", icon: "🎯", description: "Radiale Jahresplanung" },
    { name: "Kalender", href: "/calendar", icon: "📅", description: "Wochen- und Monatsansicht" },
    { name: "Budget & KPIs", href: "/budget", icon: "💰", description: "Finanzplanung und Metriken" },
    { name: "Content Plan", href: "/content", icon: "📝", description: "Inhaltsplanung und -verwaltung" },
    { name: "CRM", href: "/crm", icon: "👥", description: "Kunden und Leads" },
    { name: "Reports", href: "/reports", icon: "📈", description: "Berichte und Analysen" },
  ]

  const user = {
    name: "Marketing Manager",
    email: "manager@marketingkreis.ch",
    role: "MANAGER",
    avatar: "MM"
  }

  // Calculate stats from marketing data - оригинальная логика
  const stats = React.useMemo(() => {
    const totalLeads = marketingData.reduce((sum, item) => sum + (item.expectedLeads || 0), 0)
    const totalBudget = marketingData.reduce((sum, item) => sum + (item.budget || 0), 0)
    const activeActivities = marketingData.filter(item => item.status === 'active').length
    const completedActivities = marketingData.filter(item => item.status === 'completed').length
    
    return {
      totalLeads,
      totalBudget,
      activeActivities,
      completedActivities,
      conversionRate: marketingData.length > 0 ? (completedActivities / marketingData.length) * 100 : 33.3,
      avgCpl: totalLeads > 0 ? totalBudget / totalLeads : 0,
      monthlyGrowth: 12.5,
      roi: 285
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EDITOR': return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Button handlers - оригинальная логика
  const handleRefresh = () => {
    console.log("Dashboard-Daten werden aktualisiert...")
  }

  const handleExport = () => {
    console.log("Dashboard-Daten werden exportiert...")
  }

  const handleCreateActivity = () => {
    console.log("Neue Aktivität wird erstellt...")
  }

  const handleViewDetails = (type: string) => {
    console.log(`Details für ${type} werden geladen...`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ОРИГИНАЛЬНЫЙ COMPLEX ДИЗАЙН */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🎯</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Marketing Kreis
                </h1>
                <p className="text-xs text-slate-500">Swiss Marketing Platform</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-slate-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard-full'
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}>
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-xs opacity-75 ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 space-y-2 border-t border-slate-200/50">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
              <span className="text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">
                    Übersicht über Ihre Marketing-Aktivitäten und KPIs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🔍</button>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors relative">
                  🔔
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Unified CRM
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">🌙</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6">
            {/* Header with Actions - ОРИГИНАЛЬНЫЙ КОНТЕНТ */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                  Übersicht über Ihre Marketing-Aktivitäten und KPIs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Aktualisieren</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="text-lg">📥</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button onClick={handleCreateActivity} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">Neue Aktivität</span>
                </button>
              </div>
            </div>

            {/* Stats Cards - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div onClick={() => handleViewDetails('Leads')} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-700">Leads</h3>
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.totalLeads}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +{stats.monthlyGrowth}%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Budget')} className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-purple-700">Budget Ausgaben</h3>
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(stats.totalBudget)}</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +5%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>

              <div onClick={() => handleViewDetails('Aktivitäten')} className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-green-700">Aktive Projekte</h3>
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.activeActivities}</div>
                <p className="text-sm text-slate-500">{stats.completedActivities} abgeschlossen</p>
              </div>

              <div onClick={() => handleViewDetails('Conversion')} className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-orange-700">Conversion Rate</h3>
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-semibold">📈 +2.1%</span>
                  <span className="text-slate-500 ml-1">vs. letzter Monat</span>
                </div>
              </div>
            </div>

            {/* Charts Section - ОРИГИНАЛЬНЫЙ ДИЗАЙН */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">📊</span> Performance Übersicht
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-600 font-medium">Lead Tracking Chart</p>
                    <p className="text-sm text-slate-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-600 text-2xl">🎯</span> Kategorie Verteilung
                </h3>
                <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <p className="text-slate-600 font-medium">Category Distribution</p>
                    <p className="text-sm text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - ОРИГИНАЛЬНЫЙ КОНТЕНТ С ПОЛНЫМИ ДАННЫМИ */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Marketing Aktivitäten
              </h3>
              <div className="space-y-4">
                {marketingData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 
                        activity.status === 'planning' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.category} • {activity.assignee}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(activity.budget)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{activity.progress}%</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-green-700">Vollständige Original-Platform! 🇨🇭</span>
        </div>
      </div>
    </div>
  )
}


