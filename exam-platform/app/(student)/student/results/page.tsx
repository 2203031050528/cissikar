"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Award, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  GraduationCap, 
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  HelpCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

import { getAttemptResults } from "@/app/actions/exams"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader } from "@/components/ui/loader"

export default function StudentResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const attemptId = searchParams.get("attemptId")

  const [data, setData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [expandedQuestions, setExpandedQuestions] = React.useState<string[]>([])

  React.useEffect(() => {
    if (!attemptId) {
      router.push("/student")
      return
    }

    async function fetchResults() {
      setIsLoading(true)
      try {
        const res = await getAttemptResults(attemptId!)
        setData(res)
        if (res.reviews.length > 0) {
          setExpandedQuestions([res.reviews[0].id])
        }
      } catch (err: any) {
        console.error(err)
        alert(err.message || "Failed to load results. Direct access is restricted.")
        router.push("/student")
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [attemptId, router])

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestions(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    )
  }

  if (isLoading || !data) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader size="lg" />
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          Evaluating scorecard breakdown...
        </span>
      </div>
    )
  }

  const selectedResult = {
    name: data.examName,
    score: data.score,
    percentage: data.percentage,
    correct: data.correct,
    wrong: data.wrong,
    timeTaken: data.timeTaken,
    date: data.date
  }
  const questions = data.reviews
  const exam = { title: data.examName }


  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground font-bold">
            Results: {exam.title}
          </h1>
          <p className="text-sm text-muted-foreground">View detailed marksheets, scorecards, and questions answers review sheets.</p>
        </div>
      </div>

      {/* KPI Scores Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* Score Card */}
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Score</span>
            <div className="p-1.5 rounded-lg text-primary bg-primary/10">
              <Award className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl font-extrabold tracking-tight">{selectedResult.score}</div>
            <p className="text-[9px] text-muted-foreground mt-0.5">Total marks weight points</p>
          </CardContent>
        </Card>

        {/* Percentage Card */}
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Percentage</span>
            <div className="p-1.5 rounded-lg text-emerald-500 bg-emerald-500/10">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl font-extrabold tracking-tight text-emerald-500">{selectedResult.percentage}</div>
            <p className="text-[9px] text-muted-foreground mt-0.5">Grade score ratio</p>
          </CardContent>
        </Card>

        {/* Correct Answers Card */}
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Correct</span>
            <div className="p-1.5 rounded-lg text-emerald-500 bg-emerald-500/10">
              <CheckCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl font-extrabold tracking-tight text-emerald-500">{selectedResult.correct} Items</div>
            <p className="text-[9px] text-muted-foreground mt-0.5">Correct choices checked</p>
          </CardContent>
        </Card>

        {/* Wrong Answers Card */}
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Wrong</span>
            <div className="p-1.5 rounded-lg text-destructive bg-destructive/10">
              <XCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl font-extrabold tracking-tight text-destructive">{selectedResult.wrong} Items</div>
            <p className="text-[9px] text-muted-foreground mt-0.5">Incorrect choices checked</p>
          </CardContent>
        </Card>

        {/* Time Taken Card */}
        <Card className="border shadow-xs sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time Taken</span>
            <div className="p-1.5 rounded-lg text-blue-500 bg-blue-500/10">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl font-extrabold tracking-tight">{selectedResult.timeTaken}</div>
            <p className="text-[9px] text-muted-foreground mt-0.5">Elapsed testing window time</p>
          </CardContent>
        </Card>

      </div>

      {/* Question review Section */}
      <Card className="border shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="size-4.5 text-primary" />
            <span>Question Review Sheet</span>
          </CardTitle>
          <CardDescription className="text-xs">Review correct answers, your submitted options, and details explanations.</CardDescription>
        </CardHeader>

        <CardContent className="p-0 divide-y">
          {questions.map((q: any) => {
            const isExpanded = expandedQuestions.includes(q.id)
            return (
              <div key={q.id} className="p-4 sm:p-6 space-y-4">
                
                {/* Accordion Trigger Header */}
                <div 
                  className="flex items-start justify-between gap-4 cursor-pointer select-none"
                  onClick={() => toggleQuestionExpand(q.id)}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[9px] font-bold text-muted-foreground uppercase">Question {q.num}</span>
                      <Badge variant="outline" className="px-1.5 py-0 rounded-md text-[8px] font-normal">{q.marks} pts</Badge>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "px-2 py-0 text-[8px] font-bold uppercase tracking-wider border-transparent",
                          q.isCorrect ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {q.isCorrect ? "Correct" : "Incorrect"}
                      </Badge>
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground leading-normal">{q.text}</h3>
                  </div>

                  <Button variant="ghost" size="icon-xs" className="text-muted-foreground shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </Button>
                </div>

                {/* Expanded Questionnaire reviews */}
                {isExpanded && (
                  <div className="space-y-4 pt-2 pl-0 sm:pl-4 border-l-2 border-muted animate-slide-down">
                    
                    {/* Options list */}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {Object.entries(q.options).map(([key, value]) => {
                        const isUserAnswer = q.userAnswer === key
                        const isCorrectAnswer = q.correctAnswer === key
                        
                        return (
                          <div
                            key={key}
                            className={cn(
                              "p-3 rounded-lg border text-xs font-semibold flex items-center justify-between",
                              isCorrectAnswer 
                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-500" 
                                : isUserAnswer && !q.isCorrect 
                                ? "bg-destructive/5 border-destructive/20 text-destructive" 
                                : "border-border text-muted-foreground bg-muted/10"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={cn(
                                "size-5 flex items-center justify-center rounded-full text-[10px] font-bold border shrink-0",
                                isCorrectAnswer 
                                  ? "bg-emerald-500 border-emerald-500 text-white" 
                                  : isUserAnswer && !q.isCorrect 
                                  ? "bg-destructive border-destructive text-white" 
                                  : "border-input bg-muted/40 text-muted-foreground"
                              )}>
                                {key}
                              </span>
                              <span>{value as string}</span>
                            </div>
                            
                            {/* Badges for answer tags */}
                            <div className="flex gap-1 shrink-0">
                              {isCorrectAnswer && (
                                <Badge className="bg-emerald-500 text-white text-[8px] px-1 py-0 border-transparent rounded">
                                  Correct
                                </Badge>
                              )}
                              {isUserAnswer && (
                                <Badge className={cn("text-white text-[8px] px-1 py-0 border-transparent rounded", q.isCorrect ? "bg-emerald-600" : "bg-destructive")}>
                                  Your Choice
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Explanations Text Area */}
                    <div className="p-3 bg-muted/30 border rounded-lg text-xs leading-relaxed space-y-1">
                      <p className="font-bold text-foreground flex items-center gap-1.5">
                        <HelpCircle className="size-3.5 text-primary" />
                        <span>Explanation Explanation:</span>
                      </p>
                      <p className="text-muted-foreground">{q.explanation}</p>
                    </div>

                  </div>
                )}

              </div>
            )
          })}
        </CardContent>

        <CardFooter className="bg-muted/10 border-t p-4 flex justify-between items-center">
          <Link href="/student">
            <Button variant="outline" size="sm" className="cursor-pointer gap-2">
              <ArrowLeft className="size-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <span className="text-xs text-muted-foreground font-semibold">
            Result issued on: {selectedResult.date}
          </span>
        </CardFooter>
      </Card>

    </div>
  )
}
