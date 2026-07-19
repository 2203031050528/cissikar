"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Calendar, Award, GraduationCap, Clock, Play, HelpCircle } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Loader } from "@/components/ui/loader"

import { getExamsStudent, startAttempt } from "@/app/actions/exams"
import { useSession } from "next-auth/react"

interface StudentExam {
  id: string
  name: string
  code: string
  date: string
  rawStartTime: string
  rawEndTime: string
  durationMinutes: number
  marks: string
  maxMarks: string
  status: string
  isLaunchable: boolean
  attemptId: string
}

export default function StudentDashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [exams, setExams] = React.useState<StudentExam[]>([])
  const [selectedExam, setSelectedExam] = React.useState<StudentExam | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isStartingExam, setIsStartingExam] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadExams = async () => {
    setIsLoading(true)
    try {
      const data = await getExamsStudent()
      setExams(data)
    } catch (err) {
      console.error("Failed to load student exams:", err)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadExams()
  }, [])

  const handleOpenExamModal = (exam: StudentExam) => {
    setSelectedExam(exam)
    setIsModalOpen(true)
  }

  const handleStartExam = async () => {
    if (!selectedExam) return
    setIsStartingExam(true)
    try {
      const attempt = await startAttempt(selectedExam.id)
      setIsModalOpen(false)
      router.push(`/student/exam?attemptId=${attempt.id}`)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to start exam attempt.")
    } finally {
      setIsStartingExam(false)
    }
  }

  // Compute dynamic stats
  const stats = React.useMemo(() => {
    const upcomingCount = exams.filter(e => e.status === "Scheduled").length
    const completedExams = exams.filter(e => e.status === "Passed" || e.status === "Failed" || e.status === "Submitted")
    const completedCount = completedExams.length
    
    let totalScore = 0
    let totalPossible = 0
    completedExams.forEach(e => {
      const score = Number(e.marks)
      const possible = Number(e.maxMarks)
      if (!isNaN(score) && !isNaN(possible) && possible > 0) {
        totalScore += score
        totalPossible += possible
      }
    })

    const avgScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0

    return [
      { label: "Upcoming Exams", value: `${upcomingCount} Scheduled`, sub: "Assigned to your section", icon: Calendar, color: "text-blue-500 bg-blue-500/10" },
      { label: "Completed Exams", value: `${completedCount} Completed`, sub: `Total out of ${exams.length} exams`, icon: GraduationCap, color: "text-purple-500 bg-purple-500/10" },
      { label: "Average Score", value: `${avgScore}%`, sub: "Passed vs completed average", icon: Award, color: "text-emerald-500 bg-emerald-500/10" },
    ]
  }, [exams])

  return (
    <div className="space-y-6">
      
      {/* Student Welcome Greeting */}
      <div className="rounded-2xl border bg-linear-to-br from-primary/5 via-transparent to-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {session?.user?.name || "Student User"}!
          </h1>
          <p className="text-sm text-muted-foreground">You are in good academic standing. Prepare for your upcoming examinations.</p>
        </div>
        {exams.length > 0 && exams[0].isLaunchable && (
          <Button 
            variant="default" 
            size="sm" 
            className="cursor-pointer gap-2" 
            onClick={() => handleOpenExamModal(exams[0])}
          >
            <Play className="size-3.5 fill-current" />
            <span>Launch {exams[0].name.split(" ")[0]}</span>
          </Button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="border shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-[10px] text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Table: Assessments List */}
      <Card className="border shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold">Academic Assessment Registry</CardTitle>
          <CardDescription className="text-xs">Your full history of completed exams and upcoming assignments.</CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <Loader size="lg" />
              <span className="text-xs text-muted-foreground animate-pulse">Loading assessments registry...</span>
            </div>
          ) : exams.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No exams assigned to your class section.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Course Code</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-bold text-xs text-muted-foreground">{exam.code}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">{exam.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exam.date}</TableCell>
                    <TableCell className="text-center font-semibold text-xs">
                      {exam.marks === "--" ? (
                        <span className="text-muted-foreground">--</span>
                      ) : (
                        <span className={exam.status === "Failed" ? "text-destructive" : "text-emerald-500"}>
                          {exam.marks} / {exam.maxMarks}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          exam.status === "Scheduled" ? "secondary" :
                          exam.status === "Passed" ? "default" :
                          exam.status === "In Progress" ? "outline" :
                          "destructive"
                        }
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                          exam.status === "Passed" ? "bg-emerald-500/10 text-emerald-500 border-transparent" :
                          exam.status === "Failed" ? "bg-destructive/10 text-destructive border-transparent" : ""
                        }`}
                      >
                        {exam.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {exam.status === "Scheduled" ? (
                        <Button 
                          variant={exam.isLaunchable ? "default" : "outline"} 
                          size="xs"
                          disabled={!exam.isLaunchable}
                          onClick={() => handleOpenExamModal(exam)}
                          className="cursor-pointer font-semibold text-[10px]"
                        >
                          {exam.isLaunchable ? "Start Exam" : "Locked"}
                        </Button>
                      ) : exam.status === "In Progress" ? (
                        <Button 
                          variant="default" 
                          size="xs"
                          onClick={() => handleOpenExamModal(exam)}
                          className="cursor-pointer font-semibold text-[10px] bg-amber-500 hover:bg-amber-600 text-white border-transparent"
                        >
                          Resume
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="xs" 
                          className="text-[10px] font-medium cursor-pointer"
                          onClick={() => router.push(`/student/results?attemptId=${exam.attemptId}`)}
                        >
                          Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        
        <CardFooter className="bg-muted/10 border-t p-3 text-[10px] text-muted-foreground flex justify-between">
          <span>Passing Criteria: 50% score weight minimum.</span>
          <span>Last database sync: Today at 22:20</span>
        </CardFooter>
      </Card>

      {/* Initiation Modal */}
      {selectedExam && (
        <Modal
          isOpen={isModalOpen}
          onClose={setIsModalOpen}
          title={
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              <span>Confirm Exam Launch</span>
            </div>
          }
          description={`Please read the regulations before starting "${selectedExam.name}".`}
          footer={
            <div className="flex gap-2 w-full sm:justify-end">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={isStartingExam}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleStartExam}
                disabled={isStartingExam}
                className="min-w-28 cursor-pointer"
              >
                {isStartingExam ? <Loader size="sm" variant="default" className="text-current" /> : "Initiate"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-muted-foreground mt-2 border rounded-lg p-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-y-1.5">
              <span className="font-semibold text-foreground">Course Code:</span>
              <span className="font-mono">{selectedExam.code}</span>
              <span className="font-semibold text-foreground">Duration Limit:</span>
              <span>90 Minutes</span>
              <span className="font-semibold text-foreground">Passing Grade:</span>
              <span>50 / 100 Marks</span>
            </div>
            
            <div className="border-t pt-3 space-y-1.5 text-[11px]">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>The secure exam browser will lock tab changes and actions.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Any network drop will pause the timer for up to 5 minutes only.</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}
