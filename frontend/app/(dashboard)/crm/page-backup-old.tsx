"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Plus, 
  Search, 
  TrendingUp, 
  Mail, 
  Phone, 
  Building2,
  DollarSign,
  Activity,
  Filter,
  Download,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MapPin,
  Star,
  CheckCircle2,
  Clock,
  Target,
  Briefcase,
  UserPlus,
  FileText,
  Settings,
  Eye
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

export default function CRMPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedView, setSelectedView] = useState("companies")

  // Mock comprehensive data
  const companies = [
    { 
      id: '1', 
      name: 'ACME Corporation', 
      industry: 'Technology', 
      employees: 250, 
      revenue: 15000000, 
      status: 'active',
      contact: 'John Smith',
      email: 'john@acme.com',
      phone: '+41 44 123 45 67',
      deals: 8,
      value: 450000,
      lastContact: '2 days ago',
      logo: '🏢'
    },
    { 
      id: '2', 
      name: 'Swiss Innovations AG', 
      industry: 'Manufacturing', 
      employees: 180, 
      revenue: 12500000, 
      status: 'active',
      contact: 'Anna Müller',
      email: 'anna@swiss-inn.ch',
      phone: '+41 44 987 65 43',
      deals: 5,
      value: 320000,
      lastContact: '1 week ago',
      logo: '🏭'
    },
    { 
      id: '3', 
      name: 'Global Solutions Ltd', 
      industry: 'Consulting', 
      employees: 95, 
      revenue: 8000000, 
      status: 'active',
      contact: 'Peter Weber',
      email: 'peter@global.com',
      phone: '+41 44 555 12 34',
      deals: 12,
      value: 680000,
      lastContact: '3 days ago',
      logo: '🌐'
    },
    { 
      id: '4', 
      name: 'Tech Startup Inc', 
      industry: 'Technology', 
      employees: 45, 
      revenue: 3500000, 
      status: 'prospect',
      contact: 'Lisa Chen',
      email: 'lisa@techstartup.io',
      phone: '+41 44 789 01 23',
      deals: 2,
      value: 85000,
      lastContact: '5 days ago',
      logo: '🚀'
    },
    { 
      id: '5', 
      name: 'Finance Partners', 
      industry: 'Finance', 
      employees: 120, 
      revenue: 9500000, 
      status: 'active',
      contact: 'Michael Brown',
      email: 'michael@finpart.ch',
      phone: '+41 44 456 78 90',
      deals: 6,
      value: 420000,
      lastContact: '1 day ago',
      logo: '💰'
    },
  ]

  const contacts = [
    { 
      id: '1', 
      name: 'John Smith', 
      email: 'john@acme.com', 
      phone: '+41 44 123 45 67', 
      position: 'CEO', 
      company: 'ACME Corporation',
      status: 'hot',
      avatar: 'JS',
      lastInteraction: '2 hours ago',
      deals: 3,
      value: 250000
    },
    { 
      id: '2', 
      name: 'Anna Müller', 
      email: 'anna@swiss-inn.ch', 
      phone: '+41 44 987 65 43', 
      position: 'CTO', 
      company: 'Swiss Innovations AG',
      status: 'warm',
      avatar: 'AM',
      lastInteraction: '1 day ago',
      deals: 2,
      value: 180000
    },
    { 
      id: '3', 
      name: 'Peter Weber', 
      email: 'peter@global.com', 
      phone: '+41 44 555 12 34', 
      position: 'Director', 
      company: 'Global Solutions Ltd',
      status: 'hot',
      avatar: 'PW',
      lastInteraction: '5 hours ago',
      deals: 5,
      value: 420000
    },
    { 
      id: '4', 
      name: 'Lisa Chen', 
      email: 'lisa@techstartup.io', 
      phone: '+41 44 789 01 23', 
      position: 'Founder', 
      company: 'Tech Startup Inc',
      status: 'cold',
      avatar: 'LC',
      lastInteraction: '1 week ago',
      deals: 1,
      value: 45000
    },
    { 
      id: '5', 
      name: 'Michael Brown', 
      email: 'michael@finpart.ch', 
      phone: '+41 44 456 78 90', 
      position: 'CFO', 
      company: 'Finance Partners',
      status: 'warm',
      avatar: 'MB',
      lastInteraction: '3 days ago',
      deals: 2,
      value: 195000
    },
  ]

  const deals = [
    { 
      id: '1', 
      title: 'Enterprise License Agreement', 
      value: 250000, 
      stage: 'negotiation', 
      probability: 85, 
      closeDate: '2024-12-15', 
      company: 'ACME Corporation',
      contact: 'John Smith',
      age: 45,
      nextAction: 'Contract review call'
    },
    { 
      id: '2', 
      title: 'Cloud Migration Project', 
      value: 180000, 
      stage: 'proposal', 
      probability: 70, 
      closeDate: '2024-11-30', 
      company: 'Swiss Innovations AG',
      contact: 'Anna Müller',
      age: 28,
      nextAction: 'Send proposal'
    },
    { 
      id: '3', 
      title: 'Annual Support Contract', 
      value: 420000, 
      stage: 'won', 
      probability: 100, 
      closeDate: '2024-10-01', 
      company: 'Global Solutions Ltd',
      contact: 'Peter Weber',
      age: 15,
      nextAction: 'Onboarding'
    },
    { 
      id: '4', 
      title: 'Consulting Services', 
      value: 45000, 
      stage: 'qualification', 
      probability: 40, 
      closeDate: '2025-01-20', 
      company: 'Tech Startup Inc',
      contact: 'Lisa Chen',
      age: 12,
      nextAction: 'Discovery meeting'
    },
    { 
      id: '5', 
      title: 'Platform Implementation', 
      value: 195000, 
      stage: 'negotiation', 
      probability: 75, 
      closeDate: '2024-12-10', 
      company: 'Finance Partners',
      contact: 'Michael Brown',
      age: 38,
      nextAction: 'Price negotiation'
    },
  ]

  // Stats
  const totalRevenue = deals.reduce((sum, deal) => sum + deal.value, 0)
  const activeDeals = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length
  const wonDeals = deals.filter(d => d.stage === 'won').length
  const avgDealSize = Math.round(totalRevenue / deals.length)

  const stats = [
    {
      title: "Total Companies",
      value: companies.length.toString(),
      change: "+12%",
      trend: "up",
      icon: Building2,
      color: "blue",
      description: "Active clients"
    },
    {
      title: "Active Contacts",
      value: contacts.length.toString(),
      change: "+8%",
      trend: "up",
      icon: Users,
      color: "green",
      description: "Decision makers"
    },
    {
      title: "Pipeline Value",
      value: `CHF ${(totalRevenue / 1000).toFixed(0)}K`,
      change: "+23%",
      trend: "up",
      icon: TrendingUp,
      color: "purple",
      description: "Total opportunity"
    },
    {
      title: "Avg Deal Size",
      value: `CHF ${(avgDealSize / 1000).toFixed(0)}K`,
      change: "+15%",
      trend: "up",
      icon: DollarSign,
      color: "orange",
      description: "Per opportunity"
    },
  ]

  // Chart data
  const revenueData = [
    { month: 'Jan', revenue: 450, deals: 12, forecast: 480 },
    { month: 'Feb', revenue: 520, deals: 15, forecast: 550 },
    { month: 'Mar', revenue: 480, deals: 13, forecast: 520 },
    { month: 'Apr', revenue: 610, deals: 18, forecast: 640 },
    { month: 'May', revenue: 550, deals: 16, forecast: 580 },
    { month: 'Jun', revenue: 720, deals: 22, forecast: 750 },
  ]

  const pipelineData = [
    { name: 'Qualification', value: 3, amount: 285000, color: '#3b82f6' },
    { name: 'Proposal', value: 4, amount: 420000, color: '#8b5cf6' },
    { name: 'Negotiation', value: 5, amount: 680000, color: '#f59e0b' },
    { name: 'Won', value: 2, amount: 420000, color: '#10b981' },
  ]

  const industryData = [
    { name: 'Technology', value: 40, color: '#3b82f6' },
    { name: 'Finance', value: 25, color: '#10b981' },
    { name: 'Manufacturing', value: 20, color: '#f59e0b' },
    { name: 'Consulting', value: 15, color: '#8b5cf6' },
  ]

  // Filter data
  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDeals = deals.filter(deal =>
    deal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'warm': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'cold': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'prospect': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'qualification': return 'bg-blue-500/20 text-blue-400'
      case 'proposal': return 'bg-purple-500/20 text-purple-400'
      case 'negotiation': return 'bg-orange-500/20 text-orange-400'
      case 'won': return 'bg-green-500/20 text-green-400'
      case 'lost': return 'bg-red-500/20 text-red-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <div className="border-b border-slate-800 bg-[#0f1419]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Customer Relationship Management</h1>
                  <p className="text-sm text-slate-400">Manage your business relationships</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                New Contact
              </Button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            {stats.map((stat, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">{stat.title}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        {stat.trend === 'up' ? (
                          <ArrowUpRight className="h-3 w-3 text-green-400" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-400" />
                        )}
                        <span className={`text-xs ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-slate-700">
              <Building2 className="h-4 w-4 mr-2" />
              Companies ({companies.length})
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-slate-700">
              <Users className="h-4 w-4 mr-2" />
              Contacts ({contacts.length})
            </TabsTrigger>
            <TabsTrigger value="deals" className="data-[state=active]:bg-slate-700">
              <Target className="h-4 w-4 mr-2" />
              Deals ({deals.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Revenue Trend */}
              <Card className="col-span-2 bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Revenue & Forecast Trend</CardTitle>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">6 Months</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} name="Revenue (K)" />
                      <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="Forecast (K)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pipeline Funnel */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Pipeline by Stage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pipelineData.map((stage, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{stage.name}</span>
                          <span className="text-slate-400">{stage.value} deals</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${(stage.value / 14) * 100}%`,
                              backgroundColor: stage.color
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500">CHF {(stage.amount / 1000).toFixed(0)}K</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Deal won', company: 'Global Solutions', time: '2 hours ago', type: 'success' },
                      { action: 'Meeting scheduled', company: 'ACME Corp', time: '5 hours ago', type: 'info' },
                      { action: 'Proposal sent', company: 'Swiss Innovations', time: '1 day ago', type: 'warning' },
                      { action: 'New contact added', company: 'Finance Partners', time: '2 days ago', type: 'info' },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
                        <div className={`h-2 w-2 rounded-full ${
                          activity.type === 'success' ? 'bg-green-400' :
                          activity.type === 'warning' ? 'bg-orange-400' :
                          'bg-blue-400'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-slate-200">{activity.action}</p>
                          <p className="text-xs text-slate-400">{activity.company}</p>
                        </div>
                        <p className="text-xs text-slate-500">{activity.time}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-orange-400" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contacts.slice(0, 4).map((contact, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                          {contact.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-200 font-medium">{contact.name}</p>
                          <p className="text-xs text-slate-400">{contact.company}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-200 font-semibold">CHF {(contact.value / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-slate-400">{contact.deals} deals</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 gap-4">
              {filteredCompanies.map((company) => (
                <Card key={company.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
                          {company.logo}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                            <Badge className={getStatusColor(company.status)}>
                              {company.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-6 mt-4">
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Industry</p>
                              <p className="text-sm text-slate-200">{company.industry}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Employees</p>
                              <p className="text-sm text-slate-200">{company.employees}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Revenue</p>
                              <p className="text-sm text-slate-200">CHF {(company.revenue / 1000000).toFixed(1)}M</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Pipeline</p>
                              <p className="text-sm text-slate-200">CHF {(company.value / 1000).toFixed(0)}K</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Users className="h-4 w-4" />
                              {company.contact}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Mail className="h-4 w-4" />
                              {company.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Phone className="h-4 w-4" />
                              {company.phone}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Contacts Grid */}
            <div className="grid grid-cols-3 gap-4">
              {filteredContacts.map((contact) => (
                <Card key={contact.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {contact.avatar}
                      </div>
                      <Badge className={getStatusColor(contact.status)}>
                        {contact.status}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{contact.name}</h3>
                    <p className="text-sm text-slate-400 mb-3">{contact.position}</p>
                    <p className="text-sm text-slate-400 mb-4">{contact.company}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <div>
                        <p className="text-xs text-slate-500">Pipeline</p>
                        <p className="text-sm font-semibold text-white">CHF {(contact.value / 1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Deals</p>
                        <p className="text-sm font-semibold text-white">{contact.deals}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Deals List */}
            <div className="space-y-3">
              {filteredDeals.map((deal) => (
                <Card key={deal.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{deal.title}</h3>
                            <Badge className={getStageColor(deal.stage)}>
                              {deal.stage}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-5 gap-6 mt-4">
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Value</p>
                              <p className="text-sm font-semibold text-white">CHF {(deal.value / 1000).toFixed(0)}K</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Probability</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${deal.probability}%` }}
                                  />
                                </div>
                                <span className="text-sm text-slate-300">{deal.probability}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Company</p>
                              <p className="text-sm text-slate-200">{deal.company}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Close Date</p>
                              <p className="text-sm text-slate-200">{new Date(deal.closeDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Next Action</p>
                              <p className="text-sm text-blue-400">{deal.nextAction}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
