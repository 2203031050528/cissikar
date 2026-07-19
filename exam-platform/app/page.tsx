"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { SearchBox } from "@/components/ui/search-box"
import { Modal } from "@/components/ui/modal"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { GraduationCap, BookOpen, Clock, Award, CheckCircle2, User, AlertCircle } from "lucide-react"

import { getExamsPublic } from "@/app/actions/exams"

interface Exam {
  id: string
  title: string
  code: string
  duration: string
  questions: number
  category: string
  status: string
}

export default function ExamPlatformHome() {
  const router = useRouter()
  const [exams, setExams] = React.useState<Exam[]>([])
  const [search, setSearch] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)
  const [filteredExams, setFilteredExams] = React.useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = React.useState<Exam | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const loadExams = async () => {
    setIsSearching(true)
    try {
      const data = await getExamsPublic()
      setExams(data)
      setFilteredExams(data)
    } catch (err) {
      console.error("Failed to load public exams:", err)
    } finally {
      setIsSearching(false)
    }
  }

  React.useEffect(() => {
    loadExams()
  }, [])

  // Handle search logic
  React.useEffect(() => {
    if (search === "") {
      setFilteredExams(exams)
      return
    }

    const delayDebounceFn = setTimeout(() => {
      const results = exams.filter((exam) =>
        exam.title.toLowerCase().includes(search.toLowerCase()) ||
        exam.code.toLowerCase().includes(search.toLowerCase()) ||
        exam.category.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredExams(results)
    }, 200)

    return () => clearTimeout(delayDebounceFn)
  }, [search, exams])

  const handleOpenExamModal = (exam: Exam) => {
    setSelectedExam(exam)
    setIsModalOpen(true)
  }

  const handleStartExam = () => {
    setIsModalOpen(false)
    router.push("/login")
  }

  return (
    <div className="flex-1 w-full flex flex-col bg-background text-foreground">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <GraduationCap className="size-6" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Cissikar Exams
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => router.push("/login")}>
              <User className="size-4" />
              <span>Sign In</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Intro Banner */}
        <section className="relative rounded-2xl overflow-hidden border bg-linear-to-br from-primary/5 via-transparent to-primary/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs uppercase tracking-wider">
              Exam Platform Ready
            </Badge>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
              Assessments Made Simple, Fast, and Secure
            </h1>
            <p className="text-muted-foreground text-base max-w-xl">
              Access your student dashboard to review active assessments, view scheduled exams, and check historical performance records.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="default" className="shadow-xs cursor-pointer">
              Dashboard Overview
            </Button>
            <Button variant="outline" className="cursor-pointer">
              View Schedules
            </Button>
          </div>
        </section>

        {/* Global Notifications / Alerts Demo */}
        <section className="space-y-4">
          <Alert variant="default" className="border-primary/20 bg-primary/5 text-primary-foreground dark:text-foreground">
            <AlertCircle className="size-4" />
            <AlertTitle>Important Update</AlertTitle>
            <AlertDescription>
              A new term exam calendar has been released. Check your profile settings to view update logs.
            </AlertDescription>
          </Alert>
        </section>

        {/* Interactive Search & Table Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">Active Assessments</h2>
              <p className="text-sm text-muted-foreground">Select an exam to review details and begin testing.</p>
            </div>
            
            {/* Custom SearchBox Component */}
            <div className="w-full sm:max-w-xs">
              <SearchBox 
                value={search} 
                onChange={setSearch} 
                placeholder="Search by exam title or code..." 
              />
            </div>
          </div>

          <Card className="border shadow-xs overflow-hidden">
            <CardContent className="p-0">
              {isSearching ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  {/* Custom Loader Component */}
                  <Loader size="lg" variant="primary" />
                  <span className="text-sm text-muted-foreground animate-pulse">Filtering assessments...</span>
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <BookOpen className="size-8 stroke-1" />
                  <span className="font-medium">No assessments match your search criteria.</span>
                  <Button variant="link" onClick={() => setSearch("")} className="text-primary text-xs font-semibold">
                    Clear Search Query
                  </Button>
                </div>
              ) : (
                /* Shadcn Table Component */
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Code</TableHead>
                      <TableHead>Exam Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExams.map((exam) => (
                      <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono font-semibold text-xs text-muted-foreground">{exam.code}</TableCell>
                        <TableCell className="font-medium">{exam.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs font-normal">
                            {exam.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="size-3.5" />
                          <span className="text-xs">{exam.duration}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{exam.questions} items</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              exam.status === "Active" ? "default" :
                              exam.status === "Upcoming" ? "secondary" : 
                              "ghost"
                            }
                            className="rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide"
                          >
                            {exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant={exam.status === "Active" ? "default" : "outline"} 
                            size="sm" 
                            disabled={exam.status !== "Active"}
                            onClick={() => handleOpenExamModal(exam)}
                            className="cursor-pointer"
                          >
                            {exam.status === "Active" ? "Start" : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            
            {/* Custom Pagination Integration Demo */}
            <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Showing <strong className="text-foreground">{filteredExams.length}</strong> of <strong className="text-foreground">{exams.length}</strong> entries
              </span>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" className="pointer-events-none opacity-50" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardFooter>
          </Card>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cissikar Platform &copy; 2026
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Designed and optimized for secure academic assessments. Unauthorized access is strictly prohibited.
          </p>
        </div>
      </footer>

      {/* Custom Modal Component - Exam Start confirmation */}
      {selectedExam && (
        <Modal
          isOpen={isModalOpen}
          onClose={setIsModalOpen}
          title={
            <div className="flex items-center gap-2">
              <Award className="size-5 text-primary" />
              <span>Confirm Exam Initiation</span>
            </div>
          }
          description={`Please read the instruction guide below prior to starting ${selectedExam.title} (${selectedExam.code}).`}
          footer={
            <div className="flex gap-2 w-full sm:justify-end">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleStartExam}
                className="min-w-28 cursor-pointer"
              >
                Sign In to Start
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-sm text-muted-foreground mt-2 border rounded-lg p-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="font-semibold text-foreground">Duration:</span>
              <span>{selectedExam.duration}</span>
              <span className="font-semibold text-foreground">Questions:</span>
              <span>{selectedExam.questions} MCQ Items</span>
              <span className="font-semibold text-foreground">Passing Score:</span>
              <span>70% or higher</span>
            </div>
            
            <div className="border-t pt-3 space-y-2 text-xs">
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                <span>Once started, the timer cannot be paused or stopped.</span>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                <span>Do not close your browser tab or navigate away.</span>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                <span>Your activity is monitored for safety and integrity.</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
