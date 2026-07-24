"use client"

import * as React from "react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchBox } from "@/components/ui/search-box"
import { Modal } from "@/components/ui/modal"
import { Loader } from "@/components/ui/loader"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { 
  FileQuestion, 
  Plus, 
  Upload, 
  Edit, 
  Trash2, 
  Filter, 
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  X
} from "lucide-react"

import { getQuestions, createQuestion, updateQuestion, deleteQuestion, deleteManyQuestions, uploadQuestionsCSV } from "@/app/actions/questions"

interface Question {
  id: string
  questionText: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: string
  marks: number
  subject: string
  difficulty: string
  classTarget?: string
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = React.useState<Question[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [subjectFilter, setSubjectFilter] = React.useState("All")
  const [difficultyFilter, setDifficultyFilter] = React.useState("All")
  const [classFilter, setClassFilter] = React.useState("All")
  
  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  // Multi-select state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false)

  // Modals state
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [targetQuestion, setTargetQuestion] = React.useState<Question | null>(null)
  
  // Form states
  const [formData, setFormData] = React.useState({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    marks: "2",
    subject: "Tech",
    classTarget: "All",
    difficulty: "Easy"
  })

  const loadQuestions = async () => {
    setIsLoading(true)
    try {
      const data = await getQuestions()
      setQuestions(data)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to load questions.")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadQuestions()
  }, [])

  // Extract unique subjects from questions
  const availableSubjects = React.useMemo(() => {
    const subjectsSet = new Set<string>()
    questions.forEach((q) => {
      if (q.subject) {
        subjectsSet.add(q.subject)
      }
    })
    return Array.from(subjectsSet).sort()
  }, [questions])

  // Filter & Search Logic
  const filteredQuestions = React.useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch = 
        q.questionText.toLowerCase().includes(search.toLowerCase()) ||
        q.id.toLowerCase().includes(search.toLowerCase())
      
      const matchesSubject = subjectFilter === "All" || q.subject === subjectFilter
      const matchesDifficulty = difficultyFilter === "All" || q.difficulty === difficultyFilter
      const matchesClass = classFilter === "All" || q.classTarget === classFilter

      return matchesSearch && matchesSubject && matchesDifficulty && matchesClass
    })
  }, [questions, search, subjectFilter, difficultyFilter, classFilter])

  // Reset page on filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, subjectFilter, difficultyFilter, classFilter])

  // Paginated Questions
  const paginatedQuestions = React.useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return filteredQuestions.slice(startIdx, startIdx + pageSize)
  }, [filteredQuestions, currentPage])

  const totalPages = Math.ceil(filteredQuestions.length / pageSize)

  // Form Field Changers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
      marks: "2",
      subject: "Tech",
      classTarget: "All",
      difficulty: "Easy"
    })
    setTargetQuestion(null)
  }

  // Add Question Submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (
      !formData.questionText || 
      !formData.optionA || 
      !formData.optionB || 
      !formData.optionC || 
      !formData.optionD
    ) {
      toast.warning("Please fill in the question text and all four options.")
      return
    }

    setIsLoading(true)
    try {
      await createQuestion({
        questionText: formData.questionText,
        optionA: formData.optionA,
        optionB: formData.optionB,
        optionC: formData.optionC,
        optionD: formData.optionD,
        correctAnswer: formData.correctAnswer,
        marks: formData.marks,
        subject: formData.subject,
        classTarget: formData.classTarget,
      })
      setIsAddOpen(false)
      resetForm()
      await loadQuestions()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to create question.")
      setIsLoading(false)
    }
  }

  // Open Edit Dialog
  const handleOpenEdit = (q: Question) => {
    setTargetQuestion(q)
    setFormData({
      questionText: q.questionText,
      optionA: q.options.A,
      optionB: q.options.B,
      optionC: q.options.C,
      optionD: q.options.D,
      correctAnswer: q.correctAnswer,
      marks: String(q.marks),
      subject: q.subject,
      classTarget: q.classTarget || "All",
      difficulty: q.difficulty
    })
    setIsEditOpen(true)
  }

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetQuestion) return

    if (
      !formData.questionText || 
      !formData.optionA || 
      !formData.optionB || 
      !formData.optionC || 
      !formData.optionD
    ) {
      toast.warning("Please fill in the question text and all four options.")
      return
    }

    setIsLoading(true)
    try {
      await updateQuestion(targetQuestion.id, {
        questionText: formData.questionText,
        optionA: formData.optionA,
        optionB: formData.optionB,
        optionC: formData.optionC,
        optionD: formData.optionD,
        correctAnswer: formData.correctAnswer,
        marks: formData.marks,
        subject: formData.subject,
        classTarget: formData.classTarget,
      })
      setIsEditOpen(false)
      resetForm()
      await loadQuestions()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to update question.")
      setIsLoading(false)
    }
  }

  // Open Delete Confirm
  const handleOpenDelete = (q: Question) => {
    setTargetQuestion(q)
    setIsDeleteOpen(true)
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!targetQuestion) return
    setIsLoading(true)
    try {
      await deleteQuestion(targetQuestion.id)
      setIsDeleteOpen(false)
      setTargetQuestion(null)
      await loadQuestions()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to delete question.")
      setIsLoading(false)
    }
  }

  // Multi-select handlers
  const isAllPageSelected = paginatedQuestions.length > 0 && paginatedQuestions.every((q) => selectedIds.has(q.id))
  const isIndeterminate = paginatedQuestions.some((q) => selectedIds.has(q.id)) && !isAllPageSelected

  const toggleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        paginatedQuestions.forEach((q) => next.delete(q.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        paginatedQuestions.forEach((q) => next.add(q.id))
        return next
      })
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setIsLoading(true)
    try {
      await deleteManyQuestions(ids)
      toast.success(`${ids.length} question${ids.length > 1 ? "s" : ""} deleted successfully.`)
      setIsBulkDeleteOpen(false)
      clearSelection()
      await loadQuestions()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to delete selected questions.")
      setIsLoading(false)
    }
  }

  // CSV file reading and parsing
  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const input = document.getElementById("csv-input") as HTMLInputElement
    const file = input?.files?.[0]
    if (!file) {
      toast.warning("Please select a CSV file first.")
      return
    }

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const text = evt.target?.result as string
      if (!text) return

      setIsLoading(true)
      try {
        const res = await uploadQuestionsCSV(text)
        if (res.success) {
          toast.success(`Successfully uploaded ${res.count} questions.`)
          setIsUploadOpen(false)
          await loadQuestions()
        } else {
          toast.warning("No valid questions found in CSV.")
        }
      } catch (err: any) {
        console.error(err)
        toast.error(err.message || "Failed to upload CSV.")
      } finally {
        setIsLoading(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Question Bank</h1>
          <p className="text-sm text-muted-foreground">Manage your questions bank pool, structured by branches and complexities.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="cursor-pointer gap-2"
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload className="size-4" />
            <span>Upload CSV</span>
          </Button>
          <Button 
            size="sm" 
            className="cursor-pointer gap-2"
            onClick={() => {
              resetForm()
              setIsAddOpen(true)
            }}
          >
            <Plus className="size-4" />
            <span>Add Question</span>
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">
              {selectedIds.size} question{selectedIds.size > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={clearSelection}
            >
              <X className="size-3 mr-1" />
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs cursor-pointer gap-1.5"
              onClick={() => setIsBulkDeleteOpen(true)}
            >
              <Trash2 className="size-3" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <Card className="border shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="w-full md:max-w-xs">
            <SearchBox 
              value={search} 
              onChange={setSearch} 
              placeholder="Search questions text..." 
            />
          </div>

          {/* Filters Select */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Subject Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="size-3" />
                <span>Subject:</span>
              </span>
              <Select value={subjectFilter} onValueChange={(val) => setSubjectFilter(val || "All")}>
                <SelectTrigger className="w-[140px] h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Subjects</SelectItem>
                  {availableSubjects.map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="size-3" />
                <span>Difficulty:</span>
              </span>
              <Select value={difficultyFilter} onValueChange={(val) => setDifficultyFilter(val || "All")}>
                <SelectTrigger className="w-[120px] h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="size-3" />
                <span>Class:</span>
              </span>
              <Select value={classFilter} onValueChange={(val) => setClassFilter(val || "All")}>
                <SelectTrigger className="w-[110px] h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Classes</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>

        </CardContent>
      </Card>

      {/* Questions Data Table */}
      <Card className="border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader size="lg" />
              <span className="text-xs text-muted-foreground animate-pulse">Loading question bank...</span>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <HelpCircle className="size-8 stroke-1" />
              <span className="font-semibold text-sm">No questions match your filter query.</span>
              <Button 
                variant="link" 
                onClick={() => {
                  setSearch("")
                  setSubjectFilter("All")
                  setDifficultyFilter("All")
                  setClassFilter("All")
                }} 
                className="text-primary text-xs font-semibold"
              >
                Reset Search Filters
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="size-3.5 cursor-pointer accent-primary rounded"
                      checked={isAllPageSelected}
                      ref={(el) => { if (el) el.indeterminate = isIndeterminate }}
                      onChange={toggleSelectAll}
                      aria-label="Select all on this page"
                    />
                  </TableHead>
                  <TableHead className="w-[70px]">ID</TableHead>
                  <TableHead className="min-w-[250px] max-w-[400px]">Question Text</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="text-center">Answer</TableHead>
                  <TableHead className="text-center">Marks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedQuestions.map((q) => (
                  <TableRow key={q.id} className={`hover:bg-muted/30 transition-colors ${selectedIds.has(q.id) ? "bg-destructive/5" : ""}`}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="size-3.5 cursor-pointer accent-primary rounded"
                        checked={selectedIds.has(q.id)}
                        onChange={() => toggleSelectOne(q.id)}
                        aria-label={`Select question ${q.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-muted-foreground">{q.id}</TableCell>
                    <TableCell className="font-medium text-xs py-3 leading-relaxed">
                      <div className="line-clamp-2">{q.questionText}</div>
                      <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-muted-foreground">
                        <span><strong>A:</strong> {q.options.A}</span>
                        <span>&bull;</span>
                        <span><strong>B:</strong> {q.options.B}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs font-normal">
                        {q.subject}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs font-normal">
                        {q.classTarget === "All" ? "All Classes" : `Class ${q.classTarget}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          q.difficulty === "Easy" ? "secondary" :
                          q.difficulty === "Medium" ? "default" :
                          "destructive"
                        }
                        className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                      >
                        {q.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="font-mono bg-emerald-500/10 text-emerald-500 border-transparent rounded-md px-1.5 py-0.5 text-xs font-bold">
                        {q.correctAnswer}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-xs text-foreground">{q.marks} pts</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="icon-xs" 
                          className="hover:text-primary cursor-pointer text-muted-foreground"
                          onClick={() => handleOpenEdit(q)}
                        >
                          <Edit className="size-3.5" />
                          <span className="sr-only">Edit question</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-xs" 
                          className="hover:text-destructive cursor-pointer text-muted-foreground"
                          onClick={() => handleOpenDelete(q)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Delete question</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination Card Footer */}
        {filteredQuestions.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Showing <strong className="text-foreground">{paginatedQuestions.length}</strong> of <strong className="text-foreground">{filteredQuestions.length}</strong> questions
            </span>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) setCurrentPage(currentPage - 1)
                      }}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink 
                          href="#" 
                          isActive={pageNum === currentPage}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(pageNum)
                          }}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardFooter>
        )}
      </Card>

      {/* --- Dialog Modals --- */}

      {/* Upload CSV Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={setIsUploadOpen}
        title={
          <div className="flex items-center gap-2">
            <Upload className="size-5 text-primary" />
            <span>Upload Questions via CSV</span>
          </div>
        }
        description="Select a comma-separated values (CSV) file matching our question bank layout template."
      >
        <form onSubmit={handleCSVUpload} className="space-y-4 pt-2">
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-muted/10 transition-colors">
            <HelpCircle className="size-8 stroke-1 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Drag and drop file here, or click to browse</span>
            <input type="file" accept=".csv" className="hidden" id="csv-input" />
            <Button type="button" variant="outline" size="xs" onClick={() => document.getElementById("csv-input")?.click()}>
              Browse Files
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground leading-normal">
            <p className="font-bold text-foreground">Expected CSV Column Structure:</p>
            <p className="font-mono bg-muted/30 p-2 rounded-md border mt-1">questionText, optionA, optionB, optionC, optionD, correctAnswer, marks, subject, difficulty, class</p>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Upload and Parse
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Question Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={setIsAddOpen}
        title={
          <div className="flex items-center gap-2">
            <FileQuestion className="size-5 text-primary" />
            <span>Add New Exam Question</span>
          </div>
        }
        description="Fill out the questionnaire text, option values, and grading configuration."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground" htmlFor="questionText">
              Question Text *
            </label>
            <textarea
              id="questionText"
              name="questionText"
              placeholder="Type your question prompt here..."
              rows={3}
              className="w-full text-xs border rounded-lg p-2 bg-transparent outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 resize-none transition-colors"
              value={formData.questionText}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="optionA">
                Option A *
              </label>
              <Input
                id="optionA"
                name="optionA"
                placeholder="Option A label"
                className="h-8 text-xs"
                value={formData.optionA}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="optionB">
                Option B *
              </label>
              <Input
                id="optionB"
                name="optionB"
                placeholder="Option B label"
                className="h-8 text-xs"
                value={formData.optionB}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="optionC">
                Option C *
              </label>
              <Input
                id="optionC"
                name="optionC"
                placeholder="Option C label"
                className="h-8 text-xs"
                value={formData.optionC}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="optionD">
                Option D *
              </label>
              <Input
                id="optionD"
                name="optionD"
                placeholder="Option D label"
                className="h-8 text-xs"
                value={formData.optionD}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t pt-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Correct Answer *
              </label>
              <Select value={formData.correctAnswer} onValueChange={(val) => handleSelectChange("correctAnswer", val || "A")}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Correct" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Option A</SelectItem>
                  <SelectItem value="B">Option B</SelectItem>
                  <SelectItem value="C">Option C</SelectItem>
                  <SelectItem value="D">Option D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="marks">
                Weight Marks *
              </label>
              <Input
                id="marks"
                name="marks"
                type="number"
                min="1"
                max="10"
                className="h-8 text-xs"
                value={formData.marks}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="subject">
                Subject Branch *
              </label>
              <Input
                id="subject"
                name="subject"
                placeholder="e.g. English, Mathematics"
                className="h-8 text-xs"
                value={formData.subject}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Difficulty Tier *
              </label>
              <Select value={formData.difficulty} onValueChange={(val) => handleSelectChange("difficulty", val || "Easy")}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Target Class *
              </label>
              <Select value={formData.classTarget} onValueChange={(val) => handleSelectChange("classTarget", val || "All")}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Target Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Classes</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Question
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Question Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={setIsEditOpen}
        title={
          <div className="flex items-center gap-2">
            <Edit className="size-5 text-primary" />
            <span>Edit Exam Question</span>
          </div>
        }
        description={`Modify structural details for ${targetQuestion?.id}.`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground" htmlFor="edit-questionText">
              Question Text *
            </label>
            <textarea
              id="edit-questionText"
              name="questionText"
              rows={3}
              className="w-full text-xs border rounded-lg p-2 bg-transparent outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 resize-none transition-colors"
              value={formData.questionText}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="edit-optionA">
                Option A *
              </label>
              <Input
                id="edit-optionA"
                name="optionA"
                className="h-8 text-xs"
                value={formData.optionA}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="edit-optionB">
                Option B *
              </label>
              <Input
                id="edit-optionB"
                name="optionB"
                className="h-8 text-xs"
                value={formData.optionB}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="edit-optionC">
                Option C *
              </label>
              <Input
                id="edit-optionC"
                name="optionC"
                className="h-8 text-xs"
                value={formData.optionC}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="edit-optionD">
                Option D *
              </label>
              <Input
                id="edit-optionD"
                name="optionD"
                className="h-8 text-xs"
                value={formData.optionD}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t pt-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Correct Answer *
              </label>
              <Select value={formData.correctAnswer} onValueChange={(val) => handleSelectChange("correctAnswer", val || "A")}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Correct" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Option A</SelectItem>
                  <SelectItem value="B">Option B</SelectItem>
                  <SelectItem value="C">Option C</SelectItem>
                  <SelectItem value="D">Option D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="edit-marks">
                Weight Marks *
              </label>
              <Input
                id="edit-marks"
                name="marks"
                type="number"
                min="1"
                max="10"
                className="h-8 text-xs"
                value={formData.marks}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="edit-subject">
                Subject Branch *
              </label>
              <Input
                id="edit-subject"
                name="subject"
                placeholder="e.g. English, Mathematics"
                className="h-8 text-xs"
                value={formData.subject}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Difficulty Tier *
              </label>
              <Select value={formData.difficulty} onValueChange={(val) => handleSelectChange("difficulty", val || "Easy")}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Target Class *
              </label>
              <Select value={formData.classTarget} onValueChange={(val) => handleSelectChange("classTarget", val || "All")}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Target Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Classes</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Apply Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={setIsDeleteOpen}
        title={
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <span>Confirm Deletion</span>
          </div>
        }
        description="Are you absolutely sure you want to remove this question from the bank?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground leading-normal">
            This action will permanently delete the question <strong className="text-foreground">{targetQuestion?.id}</strong>: <em>&quot;{targetQuestion?.questionText}&quot;</em>. This question will be deleted from all active questions banks and drafts. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleConfirmDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isBulkDeleteOpen}
        onClose={setIsBulkDeleteOpen}
        title={
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <span>Bulk Delete Questions</span>
          </div>
        }
        description={`You are about to permanently delete ${selectedIds.size} question${selectedIds.size > 1 ? "s" : ""} from the question bank.`}
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-xs text-destructive font-semibold mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" />
              This action is irreversible
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All <strong className="text-foreground">{selectedIds.size} selected question{selectedIds.size > 1 ? "s" : ""}</strong> will be permanently removed from the question bank and unlinked from any exams that reference them. This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4 mt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" size="sm" className="gap-1.5" onClick={handleBulkDelete}>
              <Trash2 className="size-3.5" />
              Delete {selectedIds.size} Question{selectedIds.size > 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
