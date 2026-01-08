"use client"

import * as React from "react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Download } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { chartColors } from "@/lib/colors"

interface ChartDataPoint {
  period: string
  leads: number
  spend: number
  cpl: number
  target?: number
}

interface CategoryData {
  category: string
  value: number
  budget: number
  leads: number
  color: string
}

interface PerformanceChartProps {
  data: ChartDataPoint[]
  categoryData?: CategoryData[]
  period?: "week" | "month" | "quarter"
  className?: string
}

export function PerformanceChart({
  data,
  categoryData = [],
  period = 'month',
  className
}: PerformanceChartProps) {
  const [activeChart, setActiveChart] = React.useState<'leads' | 'spend' | 'cpl' | 'categories'>('leads')

  // Calculate trends
  const calculateTrend = (key: keyof ChartDataPoint) => {
    if (data.length < 2) return 0
    const current = data[data.length - 1][key] as number
    const previous = data[data.length - 2][key] as number
    return ((current - previous) / previous) * 100
  }

  const leadsTrend = calculateTrend('leads')
  const spendTrend = calculateTrend('spend')
  const cplTrend = calculateTrend('cpl')

  const formatPeriod = (period: string) => {
    switch (period) {
      case 'week':
        return period.startsWith('KW') ? period : `KW${period}`
      case 'month':
        return period
      case 'quarter':
        return period
      default:
        return period
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-neutral-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{formatPeriod(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {
                entry.dataKey === 'spend' || entry.dataKey === 'cpl' 
                  ? formatCurrency(entry.value)
                  : formatNumber(entry.value)
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (trend < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return null
  }

  const renderChart = () => {
    switch (activeChart) {
      case 'leads':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickFormatter={formatPeriod}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="leads"
                stroke={chartColors[0]}
                fillOpacity={1}
                fill="url(#leadsGradient)"
                strokeWidth={2}
              />
              {data[0]?.target && (
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke={chartColors[3]}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'spend':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickFormatter={formatPeriod}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="spend" 
                fill={chartColors[1]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'cpl':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickFormatter={formatPeriod}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value} CHF`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="cpl"
                stroke={chartColors[2]}
                strokeWidth={3}
                dot={{ fill: chartColors[2], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'categories':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, value }) => `${category}: ${formatCurrency(value)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'value' ? 'Budget' : name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-heading-md">Performance Übersicht</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        {/* Chart selection */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant={activeChart === 'leads' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('leads')}
          >
            Leads
            {renderTrendIcon(leadsTrend)}
            <Badge variant="outline" className="ml-2">
              {leadsTrend > 0 ? '+' : ''}{leadsTrend.toFixed(1)}%
            </Badge>
          </Button>
          
          <Button
            variant={activeChart === 'spend' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('spend')}
          >
            Ausgaben
            {renderTrendIcon(spendTrend)}
            <Badge variant="outline" className="ml-2">
              {spendTrend > 0 ? '+' : ''}{spendTrend.toFixed(1)}%
            </Badge>
          </Button>
          
          <Button
            variant={activeChart === 'cpl' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('cpl')}
          >
            CPL
            {renderTrendIcon(-cplTrend)} {/* Negative trend is good for CPL */}
            <Badge variant="outline" className="ml-2">
              {cplTrend > 0 ? '+' : ''}{cplTrend.toFixed(1)}%
            </Badge>
          </Button>
          
          <Button
            variant={activeChart === 'categories' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('categories')}
          >
            Kategorien
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderChart()}
        
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {formatNumber(data.reduce((sum, item) => sum + item.leads, 0))}
            </p>
            <p className="text-sm text-muted-foreground">Gesamt Leads</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(data.reduce((sum, item) => sum + item.spend, 0))}
            </p>
            <p className="text-sm text-muted-foreground">Gesamt Ausgaben</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                data.reduce((sum, item) => sum + item.spend, 0) / 
                Math.max(data.reduce((sum, item) => sum + item.leads, 0), 1)
              )}
            </p>
            <p className="text-sm text-muted-foreground">Ø CPL</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
