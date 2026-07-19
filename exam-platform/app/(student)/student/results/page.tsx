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

// Mock results overview
const RESULTS_LIST = [
  { id: "R1", name: "CS101 Midterm Assessment", score: "24 / 30", percentage: "80%", correct: 8, wrong: 2, timeTaken: "34m 12s", date: "July 16, 2026" },
  { id: "R2", name: "Web Development Essentials", score: "23 / 25", percentage: "92%", correct: 23, wrong: 2, timeTaken: "52m 04s", date: "July 12, 2026" },
  { id: "R3", name: "Macroeconomic Principles", score: "31 / 40", percentage: "78%", correct: 31, wrong: 9, timeTaken: "74m 15s", date: "July 08, 2026" }
]

// Detailed Question Review data for R1 (CS101)
const QUESTION_REVIEW_DATA = [
  {
    id: "Q1",
    num: 1,
    text: "What is the primary function of the CSS flexbox layout model?",
    options: {
      A: "To build 3D transformations and shadow elevations",
      B: "To lay out items in one dimension (as a row or a column)",
      C: "To style structural backend database tables",
      D: "To facilitate real-time WebSocket communication sessions"
    },
    userAnswer: "B",
    correctAnswer: "B",
    isCorrect: true,
    marks: 2,
    explanation: "Flexbox is designed for laying out items in a single dimension (either rows or columns). 2D grid layouts are best handled by CSS Grid."
  },
  {
    id: "Q2",
    num: 2,
    text: "Which of the following is true about a binary search tree?",
    options: {
      A: "Every node in the tree has exactly three children",
      B: "The right child of a node is always smaller than its parent node",
      C: "The left subtree of a node contains only nodes with keys less than the parent node's key",
      D: "It operates in O(N^2) average search time complexity"
    },
    userAnswer: "C",
    correctAnswer: "C",
    isCorrect: true,
    marks: 3,
    explanation: "By definition, the left child node in a binary search tree contains a value smaller than the parent node, and the right child node contains a value greater than the parent node."
  },
  {
    id: "Q3",
    num: 3,
    text: "Find the mathematical limit of (sin x) / x as x approaches 0.",
    options: {
      A: "0",
      B: "Infinity",
      C: "1",
      D: "Undefined"
    },
    userAnswer: "A",
    correctAnswer: "C",
    isCorrect: false,
    marks: 2,
    explanation: "By L'Hopital's rule or basic trigonometric properties, the limit of (sin x) / x as x approaches 0 is equal to 1."
  },
  {
    id: "Q4",
    num: 4,
    text: "Which chemical bond involves the sharing of electron pairs between atoms?",
    options: {
      A: "Ionic bond structure",
      B: "Covalent bond structure",
      C: "Hydrogen bond connection",
      D: "Metallic lattice bond"
    },
    userAnswer: "B",
    correctAnswer: "B",
    isCorrect: true,
    marks: 2,
    explanation: "Covalent bonding involves the sharing of electron pairs between atoms to reach structural stability."
  },
  {
    id: "Q5",
    num: 5,
    text: "What is the primary role of a central bank in monetary policy?",
    options: {
      A: "To finance start-up companies directly through seed investments",
      B: "To regulate the money supply, print currency, and set target interest rates",
      C: "To determine individual corporate stock market pricing values",
      D: "To set global exchange currency conversion standards"
    },
    userAnswer: "B",
    correctAnswer: "B",
    isCorrect: true,
    marks: 3,
    explanation: "Central banks manage the money supply, print currency bills, and adjust short-term interest rates to maintain low inflation and promote employment."
  },
  {
    id: "Q6",
    num: 6,
    text: "In React, what hook is used to perform side effects in functional components?",
    options: {
      A: "useState",
      B: "useContext",
      C: "useReducer",
      D: "useEffect"
    },
    userAnswer: "D",
    correctAnswer: "D",
    isCorrect: true,
    marks: 2,
    explanation: "The useEffect Hook lets you perform side effects (such as fetching data, manipulating DOM elements directly) in functional components."
  },
  {
    id: "Q7",
    num: 7,
    text: "Solve the derivative of f(x) = 3x^2 + 5x - 9 with respect to x.",
    options: {
      A: "6x",
      B: "6x + 5",
      C: "3x + 5",
      D: "6x - 9"
    },
    userAnswer: "B",
    correctAnswer: "B",
    isCorrect: true,
    marks: 4,
    explanation: "Using the power rule, the derivative of 3x^2 is 6x, and the derivative of 5x is 5. The derivative of constant -9 is 0. So f'(x) = 6x + 5."
  },
  {
    id: "Q8",
    num: 8,
    text: "Which of the following organelle structures acts as the powerhouse of eukaryotic cells?",
    options: {
      A: "Ribosome",
      B: "Lysosome",
      C: "Mitochondria",
      D: "Nucleus"
    },
    userAnswer: "A",
    correctAnswer: "C",
    isCorrect: false,
    marks: 2,
    explanation: "Mitochondria are membrane-bound organelles that generate most of the chemical energy needed to power the cell's biochemical reactions."
  },
  {
    id: "Q9",
    num: 9,
    text: "Which SQL clause is used to filter records in a group based on aggregate functions?",
    options: {
      A: "WHERE",
      B: "HAVING",
      C: "GROUP BY",
      D: "ORDER BY"
    },
    userAnswer: "B",
    correctAnswer: "B",
    isCorrect: true,
    marks: 3,
    explanation: "The HAVING clause was added to SQL because the WHERE keyword could not be used with aggregate functions."
  },
  {
    id: "Q10",
    num: 10,
    text: "What is the key objective of the HTTP POST request method?",
    options: {
      A: "To retrieve resource data from a server safely without changes",
      B: "To submit data to be processed and create/update a resource on the server",
      C: "To delete an existing file or resource from the server storage",
      D: "To test the latency and reachability of the destination host"
    },
    userAnswer: "B",
    correctAnswer: "B",
    isCorrect: true,
    marks: 2,
    explanation: "HTTP POST is used to send data to a server to create or update resources on the target database."
  }
]

export default function StudentResultsPage() {
  const [selectedResult, setSelectedResult] = React.useState(RESULTS_LIST[0])
  const [expandedQuestions, setExpandedQuestions] = React.useState<string[]>(["Q1"])

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestions(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    )
  }

  const handleSelectResult = (id: string) => {
    const res = RESULTS_LIST.find(r => r.id === id)
    if (res) {
      setSelectedResult(res)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground font-bold">Exam Results Summary</h1>
          <p className="text-sm text-muted-foreground">View detailed marksheets, scorecards, and questions answers review sheets.</p>
        </div>
        
        {/* Exam Select Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Choose Assessment:</span>
          <select 
            value={selectedResult.id} 
            onChange={(e) => handleSelectResult(e.target.value)}
            className="h-8 rounded-lg border border-input px-2 text-xs outline-none bg-background focus:ring-1 focus:ring-ring font-semibold text-muted-foreground cursor-pointer"
          >
            {RESULTS_LIST.map((res) => (
              <option key={res.id} value={res.id}>{res.name}</option>
            ))}
          </select>
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
          {QUESTION_REVIEW_DATA.map((q) => {
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
                              <span>{value}</span>
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
