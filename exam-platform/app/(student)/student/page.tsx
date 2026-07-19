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

// Cards statistics
const STATS = [
  { label: "Upcoming Exams", value: "3 Scheduled", sub: "Next exam today at 4:00 PM", icon: Calendar, color: "text-blue-500 bg-blue-500/10" },
  { label: "Completed Exams", value: "8 Completed", sub: "Total out of 11 assigned", icon: GraduationCap, color: "text-purple-500 bg-purple-500/10" },
  { label: "Average Score", value: "84.5%", sub: "Top 15% rank placement", icon: Award, color: "text-emerald-500 bg-emerald-500/10" },
]

// Unified Exam List Table Data
const EXAMS_DATA = [
  { id: "1", name: "Introduction to Computer Science", code: "CS101", date: "July 16, 2026 (4:00 PM)", marks: "--", maxMarks: "100", status: "Scheduled", isLaunchable: true },
  { id: "2", name: "Advanced Calculus & Linear Algebra", code: "MATH301", date: "July 17, 2026 (10:00 AM)", marks: "--", maxMarks: "100", status: "Scheduled", isLaunchable: false },
  { id: "3", name: "Web Development Essentials", code: "CS210", date: "July 12, 2026", marks: "92", maxMarks: "100", status: "Passed", isLaunchable: false },
  { id: "4", name: "Macroeconomic Principles & Policies", code: "ECON110", date: "July 08, 2026", marks: "78", maxMarks: "100", status: "Passed", isLaunchable: false },
  { id: "5", name: "Organic Chemistry Foundations", code: "CHEM220", date: "July 02, 2026", marks: "84", maxMarks: "100", status: "Passed", isLaunchable: false },
  { id: "6", name: "General Biochemistry & Genetics", code: "BIO202", date: "June 25, 2026", marks: "45", maxMarks: "100", status: "Failed", isLaunchable: false }
]

export default function StudentDashboardPage() {
  const router = useRouter()
  const [exams, setExams] = React.useState(EXAMS_DATA)
  const [selectedExam, setSelectedExam] = React.useState<typeof EXAMS_DATA[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isStartingExam, setIsStartingExam] = React.useState(false)

  const handleOpenExamModal = (exam: typeof EXAMS_DATA[0]) => {
    setSelectedExam(exam)
    setIsModalOpen(true)
  }

  const handleStartExam = () => {
    setIsStartingExam(true)
    setTimeout(() => {
      setIsStartingExam(false)
      setIsModalOpen(false)
      
      // Update local exam status to In Progress
      const updated = exams.map((e) => {
        if (e.id === selectedExam?.id) {
          return { ...e, status: "In Progress", isLaunchable: false }
        }
        return e
      })
      setExams(updated)
      
      router.push("/student/exam")
    }, 1500)
  }

  return (
    <div className="space-y-6">
      
      {/* Student Welcome Greeting */}
      <div className="rounded-2xl border bg-linear-to-br from-primary/5 via-transparent to-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Welcome back, John Student!</h1>
          <p className="text-sm text-muted-foreground">You are in good academic standing. Prepare for your upcoming examinations.</p>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          className="cursor-pointer gap-2" 
          onClick={() => handleOpenExamModal(exams[0])}
        >
          <Play className="size-3.5 fill-current" />
          <span>Launch CS101</span>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map((stat, i) => {
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
                        onClick={() => alert(`Reviewing marksheet breakdown for ${exam.name}...`)}
                      >
                        Review
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
