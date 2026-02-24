"use client"

import { useState } from "react"
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Target,
  TrendingUp,
  FileText,
  MessageCircle,
  Edit,
  Trash2
} from "lucide-react"
import { useMarketingCircleData } from '@/hooks/use-marketing-circle'
import { useToast } from "@/components/ui/use-toast"

export default function ActivityDetailPage() {
  const params = useParams() as { id?: string } | null
  const router = useRouter()
  const { toast } = useToast()
  const { getActivity, updateActivity, deleteActivity } = useMarketingCircleData()
  
  const activityId = (params?.id as string) || ""
  const activity = getActivity(activityId)

  if (!activity) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
            Aktivität nicht gefunden
          </h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </div>
      </div>
    )
  }

  const handleEdit = () => {
    toast({
      title: "Bearbeiten",
      description: "Bearbeitungsmodus wird geöffnet...",
    })
  }

  const handleDelete = () => {
    if (confirm('Sind Sie sicher, dass Sie diese Aktivität löschen möchten?')) {
      deleteActivity(activityId)
      toast({
        title: "Gelöscht",
        description: "Aktivität wurde erfolgreich gelöscht.",
      })
      router.push('/activities')
    }
  }

  const categoryColors: Record<string, string> = {
    'Verkaufsförderung': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Image': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Employer Branding': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Kundenpflege': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }

  const statusColors: Record<string, string> = {
    'active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'planned': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'completed': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  const priorityColors: Record<string, string> = {
    'high': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'low': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }

  const [tab, setTab] = useState("overview")

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="border-gray-300 dark:border-slate-600 w-full sm:w-auto justify-center sm:justify-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="sm:hidden">Zurück</span>
            <span className="hidden sm:inline">Zurück zu Activities</span>
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleEdit}
              className="border-gray-300 dark:border-slate-600 w-full sm:w-auto"
            >
              <Edit className="w-4 h-4 mr-2" />
              Bearbeiten
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDelete}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
          </div>
        </div>

        {/* Title Section */}
        <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-3 min-w-0">
                <CardTitle className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-white break-words">
                  {activity.title}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={categoryColors[String(activity.category)] || ""}>
                    {activity.category}
                  </Badge>
                  <Badge className={statusColors[String(activity.status)] || ""}>
                    {activity.status}
                  </Badge>
                  {activity.priority && (
                    <Badge className={priorityColors[String(activity.priority)] || ""}>
                      {activity.priority} Priority
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                  {activity.budget || 'N/A'}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Budget
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {activity.description}
            </p>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-800 dark:text-white">Datum</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{activity.date}</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-800 dark:text-white">Budget</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{activity.budget || 'Nicht festgelegt'}</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-800 dark:text-white">Zugewiesen an</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{activity.assignedTo || 'Nicht zugewiesen'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        {activity.progress !== undefined && (
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
                <TrendingUp className="w-5 h-5" />
                Fortschritt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Abgeschlossen</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{activity.progress}%</span>
                </div>
                <Progress value={activity.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Section */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-700">
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-700">
              Aufgaben
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-700">
              Dateien
            </TabsTrigger>
            <TabsTrigger value="comments" className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-700">
              Kommentare
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-white">Projektübersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-600 dark:text-slate-300">
                    Diese Aktivität ist Teil unserer strategischen Marketinginitiative für 2024. 
                    Hier finden Sie alle relevanten Informationen, Fortschritte und Ergebnisse.
                  </p>
                  <h4 className="text-slate-800 dark:text-white">Ziele:</h4>
                  <ul className="text-slate-600 dark:text-slate-300">
                    <li>Steigerung der Markenbekanntheit</li>
                    <li>Verbesserung der Kundenbindung</li>
                    <li>Erhöhung der Conversion Rate</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-white">Aufgaben</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">Keine Aufgaben verfügbar</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-white">Dateien</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">Keine Dateien hochgeladen</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-white">Kommentare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">Keine Kommentare vorhanden</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}




