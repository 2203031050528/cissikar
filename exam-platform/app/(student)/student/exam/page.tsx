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

import { getAttempt, saveResponse, submitAttempt } from "@/app/actions/exams"
import { useSearchParams } from "next/navigation"

interface Question {
  id: string
  num: number
  text: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  marks: number
}

export default function ExamScreenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const attemptId = searchParams.get("attemptId")

  const [exam, setExam] = React.useState<any>(null)
  const [questions, setQuestions] = React.useState<Question[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  // Active Question Index
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const currentQuestion = questions[currentIndex]

  // Timer: Seconds Left
  const [timeLeft, setTimeLeft] = React.useState(0)
  
  // Student Answers Store { questionId: selectedOptionA/B/C/D }
  const [answers, setAnswers] = React.useState<{ [key: string]: string }>({})
  
  // Review Status
  const [markedForReview, setMarkedForReview] = React.useState<string[]>([])
  
  // Visited Tracker
  const [visited, setVisited] = React.useState<string[]>([])

  // Auto-save Indicator state
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving">("saved")
  const [lastSavedTime, setLastSavedTime] = React.useState("Just now")

  // Submission Dialogs
  const [isSubmitOpen, setIsSubmitOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Fullscreen and cheating prevention states
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [hasStarted, setHasStarted] = React.useState(false)
  const [warningsCount, setWarningsCount] = React.useState(0)
  const [showWarningModal, setShowWarningModal] = React.useState(false)
  const [warningReason, setWarningReason] = React.useState("")

  // Load Exam Attempt Data
  React.useEffect(() => {
    if (!attemptId) {
      router.push("/student")
      return
    }

    async function loadAttemptData() {
      setIsLoading(true)
      try {
        const data = await getAttempt(attemptId!)
        setExam(data.exam)
        setQuestions(data.questions as Question[])
        setAnswers(data.answers)
        
        // Calculate remaining seconds
        const deadline = new Date(data.attempt.deadline).getTime()
        const now = new Date().getTime()
        const diffSecs = Math.max(0, Math.floor((deadline - now) / 1000))
        setTimeLeft(diffSecs)
        
        if (data.questions.length > 0) {
          setVisited([data.questions[0].id])
        }
      } catch (err: any) {
        console.error(err)
        alert(err.message || "Failed to load active exam attempt.")
        router.push("/student")
      } finally {
        setIsLoading(false)
      }
    }

    loadAttemptData()
  }, [attemptId, router])

  // Countdown timer trigger
  React.useEffect(() => {
    if (isLoading || timeLeft === 0) return

    if (timeLeft <= 0) {
      handleAutoSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, isLoading])

  // Request fullscreen wrapper
  const enterFullscreen = () => {
    const docEl = document.documentElement
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {})
    } else if ((docEl as any).webkitRequestFullscreen) {
      (docEl as any).webkitRequestFullscreen()
    } else if ((docEl as any).mozRequestFullScreen) {
      (docEl as any).mozRequestFullScreen()
    } else if ((docEl as any).msRequestFullscreen) {
      (docEl as any).msRequestFullscreen()
    }
    setIsFullscreen(true)
  }

  // Trigger security violation warning or automatic submit
  const triggerViolation = React.useCallback((reason: string) => {
    setWarningsCount(prev => {
      const nextCount = prev + 1
      setWarningReason(reason)
      if (nextCount >= 3) {
        handleViolationAutoSubmit()
      } else {
        setShowWarningModal(true)
      }
      return nextCount
    })
  }, [attemptId])

  // Fullscreen changes detection
  React.useEffect(() => {
    if (isLoading || !exam || !hasStarted) return

    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullscreen(isFull)

      if (!isFull) {
        triggerViolation("You exited full screen mode.")
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [isLoading, exam, hasStarted, triggerViolation])

  // Tab switching, browser minimize, window blur monitoring
  React.useEffect(() => {
    if (isLoading || !exam || !isFullscreen || !hasStarted) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerViolation("You switched tabs or minimized the browser.")
      }
    }

    const handleWindowBlur = () => {
      if (!isSubmitOpen && !showWarningModal) {
        triggerViolation("You navigated away from the exam window.")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleWindowBlur)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)
    }
  }, [isLoading, exam, isFullscreen, hasStarted, isSubmitOpen, showWarningModal, triggerViolation])

  // Track visited questions when index changes
  React.useEffect(() => {
    if (!currentQuestion) return
    const qId = currentQuestion.id
    if (!visited.includes(qId)) {
      setVisited(prev => [...prev, qId])
    }
  }, [currentIndex, currentQuestion, visited])

  // Time Formatter
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Answer picking
  const handleSelectOption = async (option: string) => {
    if (!attemptId || !currentQuestion) return

    // Set UI state immediately
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }))
    
    setSaveStatus("saving")
    try {
      await saveResponse(attemptId, currentQuestion.id, option)
      setSaveStatus("saved")
      const now = new Date()
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err: any) {
      console.error(err)
      setSaveStatus("saved")
      alert(err.message || "Failed to save response. Check connection.")
    }
  }

  // Toggle Marked for review
  const handleToggleReview = () => {
    if (!currentQuestion) return
    const qId = currentQuestion.id
    setMarkedForReview(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    )
  }

  // Clear answer choice
  const handleClearAnswer = async () => {
    if (!attemptId || !currentQuestion) return

    setAnswers(prev => {
      const updated = { ...prev }
      delete updated[currentQuestion.id]
      return updated
    })

    setSaveStatus("saving")
    try {
      await saveResponse(attemptId, currentQuestion.id, null)
      setSaveStatus("saved")
      const now = new Date()
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err: any) {
      console.error(err)
      setSaveStatus("saved")
      alert(err.message || "Failed to clear response.")
    }
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
    if (currentIndex < questions.length - 1) {
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
    const unvisitedCount = questions.length - visited.length
    const visitedNotAnswered = visited.length - answeredCount
    
    return {
      answered: answeredCount,
      marked: reviewCount,
      notAnswered: Math.max(0, visitedNotAnswered),
      unvisited: unvisitedCount
    }
  }, [answers, markedForReview, visited, questions])

  // Submit action triggers
  const handleManualSubmit = () => {
    setIsSubmitOpen(true)
  }

  const handleConfirmSubmit = async () => {
    if (!attemptId) return
    setIsSubmitting(true)
    try {
      await submitAttempt(attemptId, false)
      setIsSubmitOpen(false)
      alert("Exam submitted successfully!")
      router.push("/student")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to submit exam attempt.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAutoSubmit = async () => {
    if (!attemptId) return
    try {
      await submitAttempt(attemptId, true)
      alert("Time limit reached! Your responses were auto-submitted.")
    } catch (err) {
      console.error("Auto submit failed:", err)
    } finally {
      router.push("/student")
    }
  }

  const handleViolationAutoSubmit = async () => {
    if (!attemptId) return
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {})
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen().catch(() => {})
      }
    } catch (err) {
      console.error(err)
    }

    try {
      await submitAttempt(attemptId, true)
      alert("Exam auto-submitted due to 3 consecutive academic integrity violations (switching tabs or exiting full screen).")
    } catch (err) {
      console.error("Violation auto submit failed:", err)
    } finally {
      router.push("/student")
    }
  }

  if (isLoading || !exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader size="lg" />
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading secure exam window environment...
        </span>
      </div>
    )
  }

  if (!isFullscreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full border shadow-lg text-center p-6 space-y-6">
          <div className="flex justify-center text-amber-500">
            <AlertTriangle className="size-16 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Secure Exam Mode Required</h2>
            <p className="text-xs text-muted-foreground">
              To proceed with **{exam?.title}**, you must enter full-screen mode.
            </p>
          </div>
          <div className="bg-destructive/10 text-destructive text-[11px] p-3 rounded-lg border border-destructive/20 text-left space-y-1">
            <p className="font-semibold text-center sm:text-left">⚠️ Monitoring & Integrity Rules:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Exiting full screen will trigger a violation warning.</li>
              <li>Switching tabs or minimizing the browser is prohibited.</li>
              <li>Receiving 3 violations will result in automatic submission.</li>
            </ul>
          </div>
          <Button 
            className="w-full font-bold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              setHasStarted(true)
              enterFullscreen()
            }}
          >
            {hasStarted ? "Re-enter Full Screen & Resume Exam" : "Enter Full Screen & Start Exam"}
          </Button>
        </Card>
      </div>
    )
  }



  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      
      {/* Secure Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md h-16 flex items-center justify-between px-6">
        
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-base bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {exam?.title}
            </span>
          </div>

          {warningsCount > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-destructive/20 bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-wider animate-pulse">
              <AlertTriangle className="size-3 shrink-0" />
              <span>Violations: {warningsCount} / 3</span>
            </div>
          )}

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
                Question {currentQuestion.num} of {questions.length}
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
              disabled={currentIndex === questions.length - 1}
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
                {questions.map((q, idx) => (
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
                <span className="font-bold text-emerald-500">{examStats.answered} / {questions.length}</span>
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
              <span className="font-bold text-foreground">{questions.length}</span>
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
              <span className="font-bold text-destructive">{questions.length - examStats.answered}</span>
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

      {/* Security Violation Warning Modal */}
      <Modal
        isOpen={showWarningModal}
        onClose={setShowWarningModal}
        showCloseButton={false}
        title={
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <span>Academic Integrity Warning</span>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-foreground leading-normal">
            A violation was detected: <strong className="text-destructive font-bold">{warningReason}</strong>
          </p>
          <p className="text-xs text-muted-foreground leading-normal">
            Tab switching, minimizing, or exiting full screen is strictly prohibited and monitored.
          </p>
          <div className="bg-destructive/10 text-destructive text-[11px] p-3 rounded-lg border border-destructive/20 text-center font-bold">
            Warning count: {warningsCount} / 3. 
            {"\n"}At 3 warnings, your exam will be automatically submitted.
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              type="button"
              variant="default"
              className="cursor-pointer w-full font-bold"
              onClick={() => {
                setShowWarningModal(false)
                enterFullscreen()
              }}
            >
              I Understand & Resume Exam
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
