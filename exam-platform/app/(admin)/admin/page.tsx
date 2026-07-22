"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  FileQuestion, 
  GraduationCap, 
  Award, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus,
  ArrowRight,
  TrendingUp
} from "lucide-react"

import { getAdminMetrics } from "@/app/actions/exams"
import { useRouter } from "next/navigation"
import { Loader } from "@/components/ui/loader"

const CHART_DATA = [
  { month: "Jan", score: 72 },
  { month: "Feb", score: 75 },
  { month: "Mar", score: 74 },
  { month: "Apr", score: 78 },
  { month: "May", score: 81 },
  { month: "Jun", score: 80 },
  { month: "Jul", score: 83 },
]

export default function AdminDashboardPage() {
  const router = useRouter()
  const [data, setData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchMetrics() {
      setIsLoading(true)
      try {
        const res = await getAdminMetrics()
        setData(res)
      } catch (err) {
        console.error("Failed to fetch admin metrics", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  if (isLoading || !data) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader size="lg" />
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          Retrieving admin dashboard metrics...
        </span>
      </div>
    )
  }

  const { metrics, recentExams, recentStudents, recentResults } = data

  return (
    <div className="space-y-8">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Comprehensive system metrics and activity insights for the Cissikar Exam Platform.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => window.print()}>
            Print / Export
          </Button>
          <Button size="sm" className="cursor-pointer gap-2" onClick={() => router.push("/admin/exams")}>
            <Plus className="size-4" />
            <span>Create Exam</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Students Card */}
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registered Students</span>
            <div className="p-2 rounded-lg text-blue-500 bg-blue-500/10">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{metrics.studentsTotal}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-1 py-0.5 rounded-sm">+100% active</span>
              <span className="text-[10px] text-muted-foreground">({metrics.studentsActive} took exams)</span>
            </div>
          </CardContent>
        </Card>

        {/* Questions Card */}
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question Pool Bank</span>
            <div className="p-2 rounded-lg text-amber-500 bg-amber-500/10">
              <FileQuestion className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{metrics.questionsTotal}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-1 py-0.5 rounded-sm">Verified</span>
              <span className="text-[10px] text-muted-foreground">({metrics.questionsTotal} active)</span>
            </div>
          </CardContent>
        </Card>

        {/* Exams Card */}
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created Assessments</span>
            <div className="p-2 rounded-lg text-emerald-500 bg-emerald-500/10">
              <GraduationCap className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{metrics.examsTotal}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-1 py-0.5 rounded-sm">{metrics.examsActive}</span>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average Performance</span>
            <div className="p-2 rounded-lg text-purple-500 bg-purple-500/10">
              <Award className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{metrics.averagePerformance}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-purple-500 font-semibold bg-purple-500/10 px-1 py-0.5 rounded-sm">{metrics.passRate} pass rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Main Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Performance Chart Component */}
        <Card className="border shadow-xs lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Performance Chart</CardTitle>
                <CardDescription className="text-xs">Average examination score trend over the past 7 months.</CardDescription>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <TrendingUp className="size-3.5" />
                <span>+15.2% Trend</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            
            {/* Custom Responsive SVG Chart */}
            <div className="relative w-full h-[220px] mt-2">
              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Guidelines */}
                <line x1="40" y1="20" x2="580" y2="20" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="70" x2="580" y2="70" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="120" x2="580" y2="120" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="170" x2="580" y2="170" stroke="var(--border)" strokeWidth="1" />

                {/* Y-Axis Labels */}
                <text x="15" y="24" fill="var(--muted-foreground)" fontSize="10" fontWeight="500">100%</text>
                <text x="15" y="74" fill="var(--muted-foreground)" fontSize="10" fontWeight="500">80%</text>
                <text x="15" y="124" fill="var(--muted-foreground)" fontSize="10" fontWeight="500">60%</text>
                <text x="15" y="174" fill="var(--muted-foreground)" fontSize="10" fontWeight="500">40%</text>

                {/* Area under the line */}
                <path
                  d="M 40 170 L 40 110 L 130 99 L 220 102 L 310 88 L 400 78 L 490 81 L 580 72 L 580 170 Z"
                  fill="url(#areaGradient)"
                />

                {/* Line Path */}
                <path
                  d="M 40 110 L 130 99 L 220 102 L 310 88 L 400 78 L 490 81 L 580 72"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data Nodes */}
                <circle cx="40" cy="110" r="4.5" fill="var(--background)" stroke="var(--primary)" strokeWidth="2.5" />
                <circle cx="130" cy="99" r="4.5" fill="var(--background)" stroke="var(--primary)" strokeWidth="2.5" />
                <circle cx="220" cy="102" r="4.5" fill="var(--background)" stroke="var(--primary)" strokeWidth="2.5" />
                <circle cx="310" cy="88" r="4.5" fill="var(--background)" stroke="var(--primary)" strokeWidth="2.5" />
                <circle cx="400" cy="78" r="4.5" fill="var(--background)" stroke="var(--primary)" strokeWidth="2.5" />
                <circle cx="490" cy="81" r="4.5" fill="var(--background)" stroke="var(--primary)" strokeWidth="2.5" />
                <circle cx="580" cy="72" r="4.5" fill="var(--background)" stroke="var(--primary)" strokeWidth="2.5" />
              </svg>

              {/* X-Axis Labels */}
              <div className="absolute left-[40px] right-0 bottom-0 flex justify-between px-1 text-[10px] text-muted-foreground font-semibold">
                {CHART_DATA.map((d: any, index: number) => (
                  <span key={index}>{d.month}</span>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center items-center gap-4 text-xs mt-4">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Class Average Score</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Results Section */}
        <Card className="border shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Recent Results</CardTitle>
                <CardDescription className="text-xs">Latest submissions grade logs.</CardDescription>
              </div>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <div className="divide-y">
              {recentResults.map((res: any, i: number) => (
                <div key={i} className="p-3.5 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground leading-none">{res.student}</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase">{res.code} &bull; {res.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{res.score}</p>
                    <Badge 
                      variant="secondary"
                      className={`rounded-full px-2 py-0 text-[8px] font-semibold uppercase tracking-wider border-transparent ${
                        res.outcome === "Pass" 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {res.outcome}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Recent Exams & Recent Students */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Recent Exams Section */}
        <Card className="border shadow-xs overflow-hidden flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Recent Exams</CardTitle>
                <CardDescription className="text-xs">Newly structured examination slots.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Takers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExams.map((exam: any) => (
                  <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-bold text-xs text-muted-foreground">{exam.code}</TableCell>
                    <TableCell className="font-medium text-xs">{exam.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exam.duration}</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-foreground">{exam.takers} takers</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Students Section */}
        <Card className="border shadow-xs overflow-hidden flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Recent Students</CardTitle>
                <CardDescription className="text-xs">Recently registered candidate profiles.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentStudents.map((student: any) => (
                  <TableRow key={student.roll} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">{student.roll}</TableCell>
                    <TableCell className="font-medium text-xs">
                      <div>{student.name}</div>
                      <div className="text-[9px] text-muted-foreground">{student.email}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{student.regDate}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={student.status === "Active" ? "default" : "outline"}
                        className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
