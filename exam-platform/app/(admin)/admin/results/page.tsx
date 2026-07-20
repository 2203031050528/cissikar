"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchBox } from "@/components/ui/search-box"
import { Loader } from "@/components/ui/loader"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  BarChart3,
  Eye,
  Globe,
  GlobeLock,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  Search,
} from "lucide-react"

import { getExamsAdmin, togglePublishResults, getExamAttemptsReport } from "@/app/actions/exams"

// ===================== Types =====================

interface ExamRow {
  id: string
  name: string
  classTarget: string
  duration: string
  startTime: string
  endTime: string
  questionsCount: number
  totalMarks: number
  status: string
  resultsPublished: boolean
}

interface AttemptRow {
  attemptId: string
  studentName: string
  rollNumber: string
  classSection: string
  startedAt: string
  submittedAt: string
  score: number
  percentage: number
  passed: boolean
  status: string
}

interface ReportData {
  exam: {
    id: string
    title: string
    duration: number
    startTime: string
    endTime: string
    classSection: string | null
    resultsPublished: boolean
    maxMarks: number
  }
  metrics: {
    totalAttempts: number
    avgPercentage: number
    highestPercentage: number
    lowestPercentage: number
    passRate: number
  }
  attempts: AttemptRow[]
}

// ===================== Component =====================

export default function AdminResultsPage() {
  const [exams, setExams] = React.useState<ExamRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("All")
  const [publishFilter, setPublishFilter] = React.useState("All")
  const [togglingId, setTogglingId] = React.useState<string | null>(null)

  // Report modal state
  const [reportOpen, setReportOpen] = React.useState(false)
  const [reportLoading, setReportLoading] = React.useState(false)
  const [reportData, setReportData] = React.useState<ReportData | null>(null)
  const [reportSearch, setReportSearch] = React.useState("")
  const [reportSort, setReportSort] = React.useState<"name" | "score" | "roll">("score")
  const [reportSortDir, setReportSortDir] = React.useState<"asc" | "desc">("desc")

  // Pagination
  const [page, setPage] = React.useState(1)
  const ITEMS_PER_PAGE = 10

  // Fetch exams
  const fetchExams = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getExamsAdmin()
      setExams(data as unknown as ExamRow[])
    } catch (err: any) {
      console.error("Failed to fetch exams:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchExams()
  }, [fetchExams])

  // Toggle publish/unpublish
  const handleTogglePublish = async (examId: string, currentState: boolean) => {
    setTogglingId(examId)
    try {
      await togglePublishResults(examId, !currentState)
      setExams((prev) =>
        prev.map((e) => (e.id === examId ? { ...e, resultsPublished: !currentState } : e))
      )
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to toggle publish status"))
    } finally {
      setTogglingId(null)
    }
  }

  // Open report modal
  const handleViewReport = async (examId: string) => {
    setReportOpen(true)
    setReportLoading(true)
    setReportData(null)
    setReportSearch("")
    setReportSort("score")
    setReportSortDir("desc")
    try {
      const data = await getExamAttemptsReport(examId)
      setReportData(data as ReportData)
    } catch (err: any) {
      console.error("Failed to load report:", err)
      alert("Error: " + (err.message || "Failed to load report"))
      setReportOpen(false)
    } finally {
      setReportLoading(false)
    }
  }

  // Print report
  const handlePrintReport = () => {
    window.print()
  }

  // ===================== Filtering & Pagination =====================

  const filteredExams = React.useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "All" || exam.status === statusFilter
      const matchesPublish =
        publishFilter === "All" ||
        (publishFilter === "Published" && exam.resultsPublished) ||
        (publishFilter === "Unpublished" && !exam.resultsPublished)
      return matchesSearch && matchesStatus && matchesPublish
    })
  }, [exams, searchTerm, statusFilter, publishFilter])

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / ITEMS_PER_PAGE))
  const paginatedExams = filteredExams.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter, publishFilter])

  // Report student sorting and filtering
  const filteredAttempts = React.useMemo(() => {
    if (!reportData) return []
    let arr = reportData.attempts.filter((a) => {
      const q = reportSearch.toLowerCase()
      return (
        a.studentName.toLowerCase().includes(q) ||
        a.rollNumber.toLowerCase().includes(q)
      )
    })
    arr.sort((a, b) => {
      let cmp = 0
      if (reportSort === "score") cmp = a.percentage - b.percentage
      else if (reportSort === "name") cmp = a.studentName.localeCompare(b.studentName)
      else if (reportSort === "roll") cmp = a.rollNumber.localeCompare(b.rollNumber)
      return reportSortDir === "asc" ? cmp : -cmp
    })
    return arr
  }, [reportData, reportSearch, reportSort, reportSortDir])

  const toggleReportSort = (col: "name" | "score" | "roll") => {
    if (reportSort === col) {
      setReportSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setReportSort(col)
      setReportSortDir(col === "score" ? "desc" : "asc")
    }
  }

  // ===================== Stats =====================

  const completedExamsCount = exams.filter((e) => e.status === "Completed").length
  const publishedCount = exams.filter((e) => e.resultsPublished).length
  const unpublishedCount = exams.filter((e) => !e.resultsPublished && e.status === "Completed").length

  // ===================== Render =====================

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-report, .print-report * { visibility: visible; }
          .print-report { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-6 no-print">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Exam Results & Reports</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage result publication and generate performance reports for all exams.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Exams",
              value: exams.length,
              sub: `${completedExamsCount} completed`,
              icon: BarChart3,
              color: "bg-primary/10 text-primary",
            },
            {
              label: "Published",
              value: publishedCount,
              sub: "Results visible to students",
              icon: Globe,
              color: "bg-emerald-500/10 text-emerald-500",
            },
            {
              label: "Pending Publish",
              value: unpublishedCount,
              sub: "Completed but not published",
              icon: GlobeLock,
              color: "bg-amber-500/10 text-amber-500",
            },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card key={i} className="border shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </span>
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

        {/* Filters */}
        <Card className="border shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold">All Exams</CardTitle>
            <CardDescription className="text-xs">
              View result status, toggle publication, and generate detailed performance reports.
            </CardDescription>
          </CardHeader>

          <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
            <SearchBox
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search exams..."
              className="sm:max-w-xs"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "All")}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Live">Live</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={publishFilter} onValueChange={(v) => setPublishFilter(v || "All")}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Publication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Publication</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Unpublished">Unpublished</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3">
                <Loader size="lg" />
                <span className="text-xs text-muted-foreground animate-pulse">
                  Loading exam data...
                </span>
              </div>
            ) : paginatedExams.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No exams match your current filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Class</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-center">Questions</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExams.map((exam) => (
                    <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-xs">{exam.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {exam.classTarget}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {new Date(exam.startTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium">
                        {exam.questionsCount}
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium">
                        {exam.totalMarks}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            exam.status === "Live"
                              ? "default"
                              : exam.status === "Completed"
                              ? "secondary"
                              : "outline"
                          }
                          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                            exam.status === "Live"
                              ? "bg-emerald-500/10 text-emerald-500 border-transparent"
                              : exam.status === "Completed"
                              ? "bg-blue-500/10 text-blue-500 border-transparent"
                              : ""
                          }`}
                        >
                          {exam.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {exam.resultsPublished ? (
                          <Badge
                            variant="default"
                            className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border-transparent"
                          >
                            Published
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-500 border-amber-500/30"
                          >
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant={exam.resultsPublished ? "outline" : "default"}
                            size="xs"
                            className="text-[10px] font-semibold cursor-pointer"
                            disabled={togglingId === exam.id}
                            onClick={() => handleTogglePublish(exam.id, exam.resultsPublished)}
                          >
                            {togglingId === exam.id ? (
                              <Loader size="sm" />
                            ) : exam.resultsPublished ? (
                              <>
                                <GlobeLock className="size-3 mr-1" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Globe className="size-3 mr-1" />
                                Publish
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-[10px] font-medium cursor-pointer"
                            onClick={() => handleViewReport(exam.id)}
                          >
                            <Eye className="size-3 mr-1" />
                            Report
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Pagination */}
          {filteredExams.length > ITEMS_PER_PAGE && (
            <CardFooter className="bg-muted/10 border-t p-3 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, filteredExams.length)} of {filteredExams.length}
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-[10px] cursor-pointer"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-[10px] cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* ===================== Report Modal ===================== */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" showCloseButton={true}>
          {reportLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader size="lg" />
              <span className="text-xs text-muted-foreground animate-pulse">
                Generating report...
              </span>
            </div>
          ) : reportData ? (
            <div className="print-report">
              {/* Report Header */}
              <DialogHeader className="pb-3 border-b mb-4">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="size-5 text-primary" />
                  {reportData.exam.title}
                </DialogTitle>
                <DialogDescription className="text-xs flex flex-wrap gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {reportData.exam.duration} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="size-3" />
                    {reportData.exam.maxMarks} marks
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    Class: {reportData.exam.classSection || "All"}
                  </span>
                  <span>
                    Date:{" "}
                    {new Date(reportData.exam.startTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </DialogDescription>
              </DialogHeader>

              {/* Analytics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                {[
                  {
                    label: "Total Takers",
                    value: reportData.metrics.totalAttempts,
                    icon: Users,
                    color: "text-primary",
                    bgColor: "bg-primary/10",
                  },
                  {
                    label: "Average",
                    value: `${reportData.metrics.avgPercentage}%`,
                    icon: TrendingUp,
                    color: "text-blue-500",
                    bgColor: "bg-blue-500/10",
                  },
                  {
                    label: "Highest",
                    value: `${reportData.metrics.highestPercentage}%`,
                    icon: Award,
                    color: "text-emerald-500",
                    bgColor: "bg-emerald-500/10",
                  },
                  {
                    label: "Lowest",
                    value: `${reportData.metrics.lowestPercentage}%`,
                    icon: TrendingDown,
                    color: "text-red-500",
                    bgColor: "bg-red-500/10",
                  },
                  {
                    label: "Pass Rate",
                    value: `${reportData.metrics.passRate}%`,
                    icon: Target,
                    color: "text-amber-500",
                    bgColor: "bg-amber-500/10",
                  },
                ].map((metric, i) => {
                  const Icon = metric.icon
                  return (
                    <div
                      key={i}
                      className="rounded-xl border bg-card p-3 flex flex-col items-center text-center"
                    >
                      <div className={`p-1.5 rounded-lg ${metric.bgColor} mb-1.5`}>
                        <Icon className={`size-4 ${metric.color}`} />
                      </div>
                      <span className="text-lg font-bold tracking-tight">{metric.value}</span>
                      <span className="text-[10px] text-muted-foreground">{metric.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Performance Distribution Visual */}
              <div className="mb-5 rounded-xl border bg-card p-4">
                <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">
                  Score Distribution
                </h3>
                <div className="flex gap-1.5 items-end h-20">
                  {(() => {
                    const buckets = [0, 0, 0, 0, 0] // 0-20, 20-40, 40-60, 60-80, 80-100
                    const labels = ["0-20%", "20-40%", "40-60%", "60-80%", "80-100%"]
                    const colors = [
                      "bg-red-500",
                      "bg-orange-500",
                      "bg-amber-500",
                      "bg-blue-500",
                      "bg-emerald-500",
                    ]
                    reportData.attempts.forEach((a) => {
                      const idx = Math.min(Math.floor(a.percentage / 20), 4)
                      buckets[idx]++
                    })
                    const maxBucket = Math.max(...buckets, 1)
                    return buckets.map((count, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-semibold">{count}</span>
                        <div
                          className={`w-full rounded-t-md ${colors[i]} transition-all`}
                          style={{
                            height: `${Math.max((count / maxBucket) * 100, 4)}%`,
                            minHeight: "3px",
                          }}
                        />
                        <span className="text-[8px] text-muted-foreground leading-tight">
                          {labels[i]}
                        </span>
                      </div>
                    ))
                  })()}
                </div>
              </div>

              {/* Student Scores Table */}
              <div className="rounded-xl border overflow-hidden">
                <div className="p-3 border-b bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Student Scores ({filteredAttempts.length})
                  </h3>
                  <div className="flex items-center gap-2 no-print">
                    <div className="relative w-48">
                      <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        placeholder="Search student..."
                        className="h-8 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-[10px] cursor-pointer"
                      onClick={handlePrintReport}
                    >
                      <Printer className="size-3 mr-1" />
                      Print
                    </Button>
                  </div>
                </div>

                {filteredAttempts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    {reportData.metrics.totalAttempts === 0
                      ? "No students have attempted this exam yet."
                      : "No students match your search."}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead
                          className="cursor-pointer select-none"
                          onClick={() => toggleReportSort("roll")}
                        >
                          <span className="flex items-center gap-1">
                            Roll No
                            <ArrowUpDown className="size-3 text-muted-foreground" />
                          </span>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer select-none"
                          onClick={() => toggleReportSort("name")}
                        >
                          <span className="flex items-center gap-1">
                            Student
                            <ArrowUpDown className="size-3 text-muted-foreground" />
                          </span>
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">Class</TableHead>
                        <TableHead
                          className="text-center cursor-pointer select-none"
                          onClick={() => toggleReportSort("score")}
                        >
                          <span className="flex items-center justify-center gap-1">
                            Score
                            <ArrowUpDown className="size-3 text-muted-foreground" />
                          </span>
                        </TableHead>
                        <TableHead className="text-center">%</TableHead>
                        <TableHead className="text-center">Result</TableHead>
                        <TableHead className="hidden md:table-cell">Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttempts.map((att, idx) => (
                        <TableRow key={att.attemptId} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="text-xs font-mono font-semibold text-muted-foreground">
                            {att.rollNumber}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">{att.studentName}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                            {att.classSection}
                          </TableCell>
                          <TableCell className="text-center text-xs font-semibold">
                            {att.score} / {reportData.exam.maxMarks}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`text-xs font-bold ${
                                att.percentage >= 80
                                  ? "text-emerald-500"
                                  : att.percentage >= 50
                                  ? "text-blue-500"
                                  : "text-destructive"
                              }`}
                            >
                              {att.percentage}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {att.passed ? (
                              <Badge className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border-transparent">
                                <CheckCircle2 className="size-3 mr-0.5" />
                                Pass
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-destructive/10 text-destructive border-transparent"
                              >
                                <XCircle className="size-3 mr-0.5" />
                                Fail
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {new Date(att.submittedAt).toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Report Footer with publication state */}
              <DialogFooter className="mt-4 no-print" showCloseButton={true}>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={reportData.exam.resultsPublished ? "default" : "outline"}
                    className={`text-[10px] ${
                      reportData.exam.resultsPublished
                        ? "bg-emerald-500/10 text-emerald-500 border-transparent"
                        : "text-amber-500 border-amber-500/30"
                    }`}
                  >
                    {reportData.exam.resultsPublished ? "Results Published" : "Results Not Published"}
                  </Badge>
                </div>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
