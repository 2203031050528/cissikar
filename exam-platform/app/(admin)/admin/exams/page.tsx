"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  GraduationCap, 
  Calendar, 
  Clock, 
  BookOpen, 
  Plus, 
  Save, 
  Check, 
  Search, 
  Trash2, 
  AlertCircle 
} from "lucide-react"

// Initial Questions Pool for picking
const QUESTIONS_POOL = [
  { id: "Q1", questionText: "What is the primary function of the CSS flexbox layout model?", subject: "Tech", difficulty: "Easy", marks: 2 },
  { id: "Q2", questionText: "Which of the following is true about a binary search tree?", subject: "Tech", difficulty: "Medium", marks: 4 },
  { id: "Q3", questionText: "Find the limit of (sin x) / x as x approaches 0.", subject: "Math", difficulty: "Easy", marks: 3 },
  { id: "Q4", questionText: "Which chemical bond involves the sharing of electron pairs between atoms?", subject: "Science", difficulty: "Easy", marks: 2 },
  { id: "Q5", questionText: "What is the primary role of a central bank in monetary policy?", subject: "Business", difficulty: "Medium", marks: 3 },
  { id: "Q6", questionText: "In React, what hook is used to perform side effects in functional components?", subject: "Tech", difficulty: "Easy", marks: 2 },
  { id: "Q7", questionText: "Solve the derivative of f(x) = 3x^2 + 5x - 9 with respect to x.", subject: "Math", difficulty: "Medium", marks: 4 },
  { id: "Q8", questionText: "Which of the following acts as the powerhouse of eukaryotic cells?", subject: "Science", difficulty: "Hard", marks: 3 }
]

// Existing Exams list
const INITIAL_EXAMS = [
  { id: "E1", name: "CS101 Midterm Assessment", classTarget: "CS-A", duration: "90", startTime: "2026-07-20T09:00", endTime: "2026-07-20T10:30", questionsCount: 5, totalMarks: 13, status: "Scheduled" },
  { id: "E2", name: "MATH301 Final Exam", classTarget: "MATH-3", duration: "120", startTime: "2026-07-22T14:00", endTime: "2026-07-22T16:00", questionsCount: 4, totalMarks: 14, status: "Draft" },
  { id: "E3", name: "BIO202 Genetics Quiz", classTarget: "BIO-2", duration: "45", startTime: "2026-07-16T10:00", endTime: "2026-07-16T10:45", questionsCount: 3, totalMarks: 7, status: "Active" }
]

export default function ExamBuilderPage() {
  const [exams, setExams] = React.useState(INITIAL_EXAMS)
  const [selectedQuestions, setSelectedQuestions] = React.useState<string[]>([])
  const [searchQuestion, setSearchQuestion] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  // Exam Form Fields
  const [formFields, setFormFields] = React.useState({
    name: "",
    duration: "",
    startTime: "",
    endTime: "",
    classTarget: "CS-A"
  })

  // Filtered Questions in Picker
  const filteredQuestions = React.useMemo(() => {
    return QUESTIONS_POOL.filter(q => 
      q.questionText.toLowerCase().includes(searchQuestion.toLowerCase()) ||
      q.id.toLowerCase().includes(searchQuestion.toLowerCase())
    )
  }, [searchQuestion])

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormFields(prev => ({ ...prev, [name]: value }))
  }

  const handleClassChange = (value: string) => {
    setFormFields(prev => ({ ...prev, classTarget: value }))
  }

  // Toggle Question checkbox selection
  const handleToggleQuestion = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    )
  }

  // Calculate stats of selected questions
  const selectedStats = React.useMemo(() => {
    const questions = QUESTIONS_POOL.filter(q => selectedQuestions.includes(q.id))
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)
    return {
      count: questions.length,
      marks: totalMarks
    }
  }, [selectedQuestions])

  // Save Exam Builder Form
  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formFields.name || !formFields.duration || !formFields.startTime || !formFields.endTime) {
      alert("Please fill in all exam parameters.")
      return
    }

    if (selectedQuestions.length === 0) {
      alert("Please pick at least one question for this exam.")
      return
    }

    setIsSaving(true)

    setTimeout(() => {
      const newExam = {
        id: `E${exams.length + 1}`,
        name: formFields.name,
        classTarget: formFields.classTarget,
        duration: formFields.duration,
        startTime: formFields.startTime,
        endTime: formFields.endTime,
        questionsCount: selectedQuestions.length,
        totalMarks: selectedStats.marks,
        status: "Scheduled"
      }

      setExams([newExam, ...exams])
      setIsSaving(false)
      
      // Reset Form & Selection
      setFormFields({
        name: "",
        duration: "",
        startTime: "",
        endTime: "",
        classTarget: "CS-A"
      })
      setSelectedQuestions([])
      alert(`Exam "${newExam.name}" built and saved successfully!`)
    }, 1200)
  }

  const handleDeleteExam = (id: string) => {
    setExams(exams.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Exam Builder & Manager</h1>
        <p className="text-sm text-muted-foreground">Draft and configure scheduled testing parameters for courses and classes.</p>
      </div>

      {/* Main Grid: Builder Form & Picker split */}
      <div className="grid gap-6 lg:grid-cols-5">
        
        {/* Left Side: Exam Parameters Form */}
        <Card className="border shadow-xs lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="size-4.5 text-primary" />
              <span>Exam Specifications</span>
            </CardTitle>
            <CardDescription className="text-xs">Define timings, durations, and target classrooms.</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSaveExam}>
            <CardContent className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground" htmlFor="name">
                  Exam Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. CS101 Midterm Assessment"
                  className="h-9 text-xs"
                  value={formFields.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground" htmlFor="duration">
                    Duration (Minutes) *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      min="10"
                      max="300"
                      placeholder="e.g. 90"
                      className="pl-9 h-9 text-xs"
                      value={formFields.duration}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    Target Class *
                  </label>
                  <Select value={formFields.classTarget} onValueChange={(val) => handleClassChange(val || "CS-A")}>
                    <SelectTrigger className="w-full h-9 text-xs cursor-pointer">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CS-A">CS-A (Tech)</SelectItem>
                      <SelectItem value="CS-B">CS-B (Tech)</SelectItem>
                      <SelectItem value="MATH-3">MATH-3 (Math)</SelectItem>
                      <SelectItem value="BIO-2">BIO-2 (Science)</SelectItem>
                      <SelectItem value="ECON-1">ECON-1 (Business)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground" htmlFor="startTime">
                  Start Window Time *
                </label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="datetime-local"
                  className="h-9 text-xs"
                  value={formFields.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground" htmlFor="endTime">
                  End Window Time *
                </label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="datetime-local"
                  className="h-9 text-xs"
                  value={formFields.endTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Selection Summary banner */}
              <div className="border rounded-lg p-3 bg-muted/40 flex items-center justify-between text-xs mt-6">
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">Picked Summary</p>
                  <p className="text-muted-foreground">{selectedStats.count} questions selected</p>
                </div>
                <Badge variant="secondary" className="font-bold text-xs bg-primary/10 text-primary border-transparent px-2.5 py-1">
                  {selectedStats.marks} Total Marks
                </Badge>
              </div>

            </CardContent>

            <CardFooter className="border-t p-4 flex gap-2 justify-end bg-muted/20 rounded-b-xl">
              <Button
                type="submit"
                className="w-full sm:w-auto h-9 cursor-pointer gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader size="sm" variant="default" className="text-current animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>Save Exam Layout</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Right Side: Question Picker Checklist */}
        <Card className="border shadow-xs lg:col-span-3 flex flex-col justify-between">
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BookOpen className="size-4.5 text-primary" />
                  <span>Question Picker Checklist</span>
                </CardTitle>
                <CardDescription className="text-xs">Select questions from the bank pool to attach to this exam.</CardDescription>
              </div>
              <div className="w-full sm:max-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search query..."
                    className="h-8 w-full rounded-md border border-input pl-8 pr-3 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
                    value={searchQuestion}
                    onChange={(e) => setSearchQuestion(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          {/* List of Questions with checkbox */}
          <CardContent className="p-0 overflow-y-auto max-h-[350px] divide-y flex-1">
            {filteredQuestions.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <AlertCircle className="size-6 stroke-1 text-muted-foreground" />
                <span>No matching questions pool found.</span>
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isChecked = selectedQuestions.includes(q.id)
                return (
                  <label
                    key={q.id}
                    className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer select-none"
                  >
                    {/* Custom Styled Checkbox */}
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleQuestion(q.id)}
                        className="sr-only"
                      />
                      <div className={`size-4.5 rounded border flex items-center justify-center transition-all ${
                        isChecked 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : "border-input bg-transparent hover:border-ring"
                      }`}>
                        {isChecked && <Check className="size-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-muted-foreground uppercase">{q.id}</span>
                        <Badge variant="outline" className="px-1.5 py-0 rounded-md text-[8px] font-normal">{q.subject}</Badge>
                        <Badge variant="secondary" className="px-1.5 py-0 rounded-full text-[8px] font-semibold">{q.difficulty}</Badge>
                      </div>
                      <p className="text-xs text-foreground font-medium leading-relaxed">{q.questionText}</p>
                    </div>

                    <span className="text-xs font-bold text-muted-foreground whitespace-nowrap pt-1">
                      {q.marks} pts
                    </span>
                  </label>
                )
              })
            )}
          </CardContent>
          
          <div className="p-3 border-t bg-muted/20 text-center text-[10px] text-muted-foreground rounded-b-xl flex items-center justify-between px-6">
            <span>Check the box to add a question.</span>
            <span>Total pool size: {QUESTIONS_POOL.length} items</span>
          </div>
        </Card>

      </div>

      {/* Existing Exams Table list */}
      <Card className="border shadow-xs overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-bold">Existing Assessments</CardTitle>
          <CardDescription className="text-xs">View or delete exams registered on the system.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          {exams.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Calendar className="size-6 stroke-1 text-muted-foreground" />
              <span>No exams registered. Use the builder specifications form to add one.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Exam ID</TableHead>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Target Class</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-center">Total Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-muted-foreground">{exam.id}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">{exam.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs font-normal">
                        {exam.classTarget}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exam.duration} mins</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exam.startTime.replace("T", " ")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exam.endTime.replace("T", " ")}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground font-semibold">{exam.questionsCount}</TableCell>
                    <TableCell className="text-center text-xs font-bold text-foreground">{exam.totalMarks} pts</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          exam.status === "Active" ? "default" :
                          exam.status === "Scheduled" ? "secondary" : 
                          "outline"
                        }
                        className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                      >
                        {exam.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon-xs" 
                        className="hover:text-destructive text-muted-foreground cursor-pointer"
                        onClick={() => handleDeleteExam(exam.id)}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Delete exam</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
