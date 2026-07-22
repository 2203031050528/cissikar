"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Calendar, Clock, Play, AlertTriangle } from "lucide-react"
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

export default function UpcomingExamsPage() {
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
      // Filter for scheduled and in-progress exams (exclude completed/submitted/missed/passed/failed)
      const upcoming = data.filter(
        (e: any) => e.status === "Scheduled" || e.status === "In Progress" || e.status === "Completed (Pending Publish)"
      )
      setExams(upcoming)
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
      toast.error(err.message || "Failed to start exam attempt.")
    } finally {
      setIsStartingExam(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Upcoming Examinations
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View and launch exams assigned to your class section.
        </p>
      </div>

      {/* Main Card */}
      <Card className="border shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold">Upcoming Assessments</CardTitle>
          <CardDescription className="text-xs">
            Exams that are active now or scheduled for a future date.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <Loader size="lg" />
              <span className="text-xs text-muted-foreground animate-pulse">Loading assessments...</span>
            </div>
          ) : exams.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <BookOpen className="size-8 text-muted-foreground/60" />
              <span>No upcoming or active exams scheduled at this time.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Course Code</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Schedule Date</TableHead>
                  <TableHead className="text-center">Duration</TableHead>
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
                      {exam.durationMinutes} mins
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={exam.status === "Scheduled" ? "secondary" : "outline"}
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                          exam.status === "In Progress"
                            ? "bg-amber-500/10 text-amber-500 border-transparent animate-pulse"
                            : exam.status === "Completed (Pending Publish)"
                            ? "bg-amber-500/10 text-amber-500 border-transparent"
                            : "bg-blue-500/10 text-blue-500 border-transparent"
                        }`}
                      >
                        {exam.status === "Completed (Pending Publish)" 
                          ? "Awaiting Results" 
                          : exam.status === "In Progress" 
                          ? "In Progress" 
                          : "Scheduled"}
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
                          disabled
                          className="text-[10px] font-medium text-muted-foreground"
                        >
                          Pending
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
          <span>Make sure you have a stable internet connection before beginning.</span>
          <span>Security monitoring will be active.</span>
        </CardFooter>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={setIsModalOpen}
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            <span>Confirm Starting Examination</span>
          </div>
        }
        description={`You are about to start the examination: ${selectedExam?.name}`}
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground leading-normal">
            By starting the exam, you agree to follow all academic integrity rules.
          </p>

          <div className="border rounded-lg p-3 bg-muted/40 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exam Name:</span>
              <span className="font-bold text-foreground">{selectedExam?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-bold text-foreground">{selectedExam?.durationMinutes} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maximum Marks:</span>
              <span className="font-bold text-foreground">{selectedExam?.maxMarks} marks</span>
            </div>
          </div>

          <div className="bg-destructive/10 text-destructive text-[11px] p-3 rounded-lg border border-destructive/20 text-left space-y-1">
            <p className="font-semibold">⚠️ Secure Mode Integrity Rules:</p>
            <ul className="list-disc list-inside space-y-0.5 mt-1">
              <li>Exiting full screen will trigger a violation warning.</li>
              <li>Switching tabs or minimizing the browser is prohibited.</li>
              <li>Receiving 3 violations will result in automatic submission.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isStartingExam}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleStartExam}
              disabled={isStartingExam}
              className="min-w-28 cursor-pointer"
            >
              {isStartingExam ? <Loader size="sm" variant="default" className="text-current" /> : "Start Secure Exam"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
