"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Loader } from "@/components/ui/loader"
import { 
  Clock, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Bookmark, 
  Flag,
  HelpCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

// Exam Question Set (10 questions)
const EXAM_QUESTIONS = [
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
    marks: 2
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
    marks: 3
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
    marks: 2
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
    marks: 2
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
    marks: 3
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
    marks: 2
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
    marks: 4
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
    marks: 2
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
    marks: 3
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
    marks: 2
  }
]

export default function ExamScreenPage() {
  const router = useRouter()
  
  // Active Question
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const currentQuestion = EXAM_QUESTIONS[currentIndex]

  // Timer: 45 Minutes (2700 Seconds)
  const [timeLeft, setTimeLeft] = React.useState(2700)
  
  // Student Answers Store { questionId: selectedOptionA/B/C/D }
  const [answers, setAnswers] = React.useState<{ [key: string]: string }>({})
  
  // Review Status
  const [markedForReview, setMarkedForReview] = React.useState<string[]>([])
  
  // Visited Tracker
  const [visited, setVisited] = React.useState<string[]>(["Q1"])

  // Auto-save Indicator state
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving">("saved")
  const [lastSavedTime, setLastSavedTime] = React.useState("Just now")

  // Submission Dialogs
  const [isSubmitOpen, setIsSubmitOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Countdown timer trigger
  React.useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Track visited questions when index changes
  React.useEffect(() => {
    const qId = currentQuestion.id
    if (!visited.includes(qId)) {
      setVisited(prev => [...prev, qId])
    }
  }, [currentIndex, currentQuestion])

  // Mock auto-save effect mimicking database updates every 10 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSaveStatus("saving")
      setTimeout(() => {
        setSaveStatus("saved")
        const now = new Date()
        setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }, 800)
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  // Time Formatter
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Answer picking
  const handleSelectOption = (option: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }))
    
    // Auto-save feedback on action
    setSaveStatus("saving")
    setTimeout(() => {
      setSaveStatus("saved")
      setLastSavedTime("Just now")
    }, 400)
  }

  // Toggle Marked for review
  const handleToggleReview = () => {
    const qId = currentQuestion.id
    setMarkedForReview(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    )
  }

  // Clear answer choice
  const handleClearAnswer = () => {
    setAnswers(prev => {
      const updated = { ...prev }
      delete updated[currentQuestion.id]
      return updated
    })
  }

  // Palette item helper to figure out node status classes
  const getPaletteStatus = (qId: string, qNum: number) => {
    const isAnswered = answers[qId] !== undefined
    const isMarked = markedForReview.includes(qId)
    const isVis = visited.includes(qId)
    const isActive = currentIndex === qNum - 1

    if (isActive) return "ring-2 ring-primary ring-offset-2 scale-105"
    if (isMarked) return "bg-purple-500 hover:bg-purple-600 text-white border-transparent"
    if (isAnswered) return "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
    if (isVis) return "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
    return "bg-muted hover:bg-muted/80 text-muted-foreground"
  }

  // Next / Prev Actions
  const handleNext = () => {
    if (currentIndex < EXAM_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  // Stats calculation
  const examStats = React.useMemo(() => {
    const answeredCount = Object.keys(answers).length
    const reviewCount = markedForReview.length
    const unvisitedCount = EXAM_QUESTIONS.length - visited.length
    const visitedNotAnswered = visited.length - answeredCount
    
    return {
      answered: answeredCount,
      marked: reviewCount,
      notAnswered: Math.max(0, visitedNotAnswered),
      unvisited: unvisitedCount
    }
  }, [answers, markedForReview, visited])

  // Submit action triggers
  const handleManualSubmit = () => {
    setIsSubmitOpen(true)
  }

  const handleConfirmSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitOpen(false)
      alert("Exam submitted successfully! Results are being processed.")
      router.push("/student")
    }, 2000)
  }

  const handleAutoSubmit = () => {
    alert("Time limit reached! Your responses are auto-saved and submitted.")
    router.push("/student")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      
      {/* Secure Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md h-16 flex items-center justify-between px-6">
        
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-base bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              CS101 Midterm assessment
            </span>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />
          
          {/* Custom Auto-Save Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Save className={cn("size-3.5", saveStatus === "saving" ? "animate-pulse text-amber-500" : "text-emerald-500")} />
            <span>
              {saveStatus === "saving" ? "Auto-saving..." : `Saved (${lastSavedTime})`}
            </span>
          </div>
        </div>

        {/* Right: Timer & Submit */}
        <div className="flex items-center gap-4">
          
          {/* Custom Timer Component */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all",
            timeLeft < 300 
              ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse" 
              : "bg-muted/40 text-foreground"
          )}>
            <Clock className="size-4" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>

          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleManualSubmit}
            className="cursor-pointer font-bold h-9 px-4"
          >
            Submit Exam
          </Button>

        </div>
      </header>

      {/* Main Split Interface */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid gap-6 md:grid-cols-4 items-start">
        
        {/* Left Side: Question, Prompt & Options */}
        <Card className="border shadow-md md:col-span-3 min-h-[480px] flex flex-col justify-between">
          
          {/* Question Meta Header */}
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Question {currentQuestion.num} of {EXAM_QUESTIONS.length}
              </CardTitle>
              <CardDescription className="text-xs">
                Marks Weight: <strong className="text-foreground">{currentQuestion.marks} Marks</strong>
              </CardDescription>
            </div>
            
            {/* Mark for review toggle */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "cursor-pointer text-xs gap-1.5",
                markedForReview.includes(currentQuestion.id) 
                  ? "text-purple-500 hover:text-purple-600 bg-purple-500/5" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={handleToggleReview}
            >
              <Bookmark className="size-4" />
              <span className="hidden sm:inline">
                {markedForReview.includes(currentQuestion.id) ? "Marked for Review" : "Mark for Review"}
              </span>
            </Button>
          </CardHeader>

          {/* Question Text Area */}
          <CardContent className="py-6 space-y-6 flex-1">
            <p className="text-sm sm:text-base font-semibold leading-relaxed text-foreground">
              {currentQuestion.text}
            </p>

            {/* Options selection List */}
            <div className="space-y-3">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isSelected = answers[currentQuestion.id] === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectOption(key)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between outline-none cursor-pointer select-none",
                      isSelected 
                        ? "bg-primary/5 border-primary/40 ring-1 ring-primary/40 shadow-xs" 
                        : "border-border hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      {/* Styled circle marker */}
                      <span className={cn(
                        "size-6 flex items-center justify-center rounded-full text-xs font-bold border transition-colors shrink-0",
                        isSelected 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : "border-input bg-muted/40 text-muted-foreground"
                      )}>
                        {key}
                      </span>
                      <span className={isSelected ? "text-foreground font-semibold" : "text-muted-foreground"}>
                        {value}
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          </CardContent>

          {/* Bottom navigation actions bar */}
          <CardFooter className="border-t p-4 flex items-center justify-between bg-muted/10 rounded-b-xl">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="cursor-pointer gap-1.5"
            >
              <ChevronLeft className="size-4" />
              <span>Previous</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAnswer}
              disabled={answers[currentQuestion.id] === undefined}
              className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
            >
              Clear Response
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === EXAM_QUESTIONS.length - 1}
              className="cursor-pointer gap-1.5"
            >
              <span>Next</span>
              <ChevronRight className="size-4" />
            </Button>
          </CardFooter>

        </Card>

        {/* Right Side: Question Palette Drawer */}
        <div className="space-y-6">
          
          {/* Palette Card */}
          <Card className="border shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold">Question Palette</CardTitle>
              <CardDescription className="text-[10px]">Jump directly to any question by clicking its index number below.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              
              {/* Numbers Grid */}
              <div className="grid grid-cols-5 gap-2">
                {EXAM_QUESTIONS.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "h-9 rounded-md text-xs font-bold border flex items-center justify-center transition-all cursor-pointer outline-none select-none",
                      getPaletteStatus(q.id, q.num)
                    )}
                  >
                    {q.num}
                  </button>
                ))}
              </div>

              {/* Status Legends */}
              <div className="border-t pt-3 space-y-2 text-[10px] text-muted-foreground font-semibold">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground pb-1">Legend Status</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="size-3.5 rounded bg-emerald-500 shrink-0" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-3.5 rounded bg-purple-500 shrink-0" />
                    <span>Marked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-3.5 rounded bg-destructive/10 border border-destructive/20 shrink-0" />
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-3.5 rounded bg-muted shrink-0" />
                    <span>Not Visited</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Real-time stats progress card */}
          <Card className="border shadow-xs">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Answered:</span>
                <span className="font-bold text-emerald-500">{examStats.answered} / {EXAM_QUESTIONS.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Marked for Review:</span>
                <span className="font-bold text-purple-500">{examStats.marked}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Not Visited:</span>
                <span className="font-bold text-muted-foreground">{examStats.unvisited}</span>
              </div>
            </CardContent>
          </Card>

        </div>

      </main>

      {/* Manual Submission Confirmation Modal */}
      <Modal
        isOpen={isSubmitOpen}
        onClose={setIsSubmitOpen}
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            <span>Confirm Final Submission</span>
          </div>
        }
        description="Are you sure you want to finish and submit your responses?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground leading-normal">
            Once submitted, you will not be able to change your answers or log back into this examination session.
          </p>

          <div className="border rounded-lg p-3 bg-muted/40 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Questions:</span>
              <span className="font-bold text-foreground">{EXAM_QUESTIONS.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Answered responses:</span>
              <span className="font-bold text-emerald-500">{examStats.answered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Marked for review:</span>
              <span className="font-bold text-purple-500">{examStats.marked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Not answered:</span>
              <span className="font-bold text-destructive">{EXAM_QUESTIONS.length - examStats.answered}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsSubmitOpen(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="default" 
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="min-w-28 cursor-pointer"
            >
              {isSubmitting ? <Loader size="sm" variant="default" className="text-current" /> : "Confirm Submit"}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
