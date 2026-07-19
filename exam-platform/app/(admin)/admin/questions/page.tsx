"use client"

import * as React from "react"
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
  AlertTriangle 
} from "lucide-react"

// Initial Dummy Questions Data
const INITIAL_QUESTIONS = [
  { 
    id: "Q1", 
    questionText: "What is the primary function of the CSS flexbox layout model?", 
    options: {
      A: "To build 3D transformations",
      B: "To lay out items in one dimension (row or column)",
      C: "To style database tables",
      D: "To create web sockets connections"
    },
    correctAnswer: "B",
    marks: 2,
    subject: "Tech",
    difficulty: "Easy"
  },
  { 
    id: "Q2", 
    questionText: "Which of the following is true about a binary search tree?", 
    options: {
      A: "Every node has exactly 3 children",
      B: "The right child is always smaller than the parent",
      C: "The left subtree contains only nodes with keys less than the parent node",
      D: "It operates in O(N^2) average search time"
    },
    correctAnswer: "C",
    marks: 4,
    subject: "Tech",
    difficulty: "Medium"
  },
  { 
    id: "Q3", 
    questionText: "Find the limit of (sin x) / x as x approaches 0.", 
    options: {
      A: "0",
      B: "Infinity",
      C: "1",
      D: "Undefined"
    },
    correctAnswer: "C",
    marks: 3,
    subject: "Math",
    difficulty: "Easy"
  },
  { 
    id: "Q4", 
    questionText: "Which chemical bond involves the sharing of electron pairs between atoms?", 
    options: {
      A: "Ionic bond",
      B: "Covalent bond",
      C: "Hydrogen bond",
      D: "Metallic bond"
    },
    correctAnswer: "B",
    marks: 2,
    subject: "Science",
    difficulty: "Easy"
  },
  { 
    id: "Q5", 
    questionText: "What is the primary role of a central bank in monetary policy?", 
    options: {
      A: "To finance startup companies directly",
      B: "To regulate the money supply and interest rates",
      C: "To determine corporate stock prices",
      D: "To set global exchange standards"
    },
    correctAnswer: "B",
    marks: 3,
    subject: "Business",
    difficulty: "Medium"
  },
  { 
    id: "Q6", 
    questionText: "In React, what hook is used to perform side effects in functional components?", 
    options: {
      A: "useState",
      B: "useContext",
      C: "useReducer",
      D: "useEffect"
    },
    correctAnswer: "D",
    marks: 2,
    subject: "Tech",
    difficulty: "Easy"
  },
  { 
    id: "Q7", 
    questionText: "Solve the derivative of f(x) = 3x^2 + 5x - 9 with respect to x.", 
    options: {
      A: "6x",
      B: "6x + 5",
      C: "3x + 5",
      D: "6x - 9"
    },
    correctAnswer: "B",
    marks: 4,
    subject: "Math",
    difficulty: "Medium"
  },
  { 
    id: "Q8", 
    questionText: "Which of the following acts as the powerhouse of eukaryotic cells?", 
    options: {
      A: "Ribosome",
      B: "Lysosome",
      C: "Mitochondria",
      D: "Nucleus"
    },
    correctAnswer: "C",
    marks: 3,
    subject: "Science",
    difficulty: "Hard"
  }
]

export default function QuestionBankPage() {
  const [questions, setQuestions] = React.useState(INITIAL_QUESTIONS)
  const [search, setSearch] = React.useState("")
  const [subjectFilter, setSubjectFilter] = React.useState("All")
  const [difficultyFilter, setDifficultyFilter] = React.useState("All")
  
  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 5

  // Modals state
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [targetQuestion, setTargetQuestion] = React.useState<typeof INITIAL_QUESTIONS[0] | null>(null)
  
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
    difficulty: "Easy"
  })

  // Filter & Search Logic
  const filteredQuestions = React.useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch = 
        q.questionText.toLowerCase().includes(search.toLowerCase()) ||
        q.id.toLowerCase().includes(search.toLowerCase())
      
      const matchesSubject = subjectFilter === "All" || q.subject === subjectFilter
      const matchesDifficulty = difficultyFilter === "All" || q.difficulty === difficultyFilter

      return matchesSearch && matchesSubject && matchesDifficulty
    })
  }, [questions, search, subjectFilter, difficultyFilter])

  // Reset page on filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, subjectFilter, difficultyFilter])

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
      difficulty: "Easy"
    })
    setTargetQuestion(null)
  }

  // Add Question Submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (
      !formData.questionText || 
      !formData.optionA || 
      !formData.optionB || 
      !formData.optionC || 
      !formData.optionD
    ) {
      alert("Please fill in the question text and all four options.")
      return
    }

    const newQuestion = {
      id: `Q${questions.length + 1}`,
      questionText: formData.questionText,
      options: {
        A: formData.optionA,
        B: formData.optionB,
        C: formData.optionC,
        D: formData.optionD
      },
      correctAnswer: formData.correctAnswer,
      marks: Number(formData.marks) || 2,
      subject: formData.subject,
      difficulty: formData.difficulty
    }

    setQuestions([newQuestion, ...questions])
    setIsAddOpen(false)
    resetForm()
  }

  // Open Edit Dialog
  const handleOpenEdit = (q: typeof INITIAL_QUESTIONS[0]) => {
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
      difficulty: q.difficulty
    })
    setIsEditOpen(true)
  }

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetQuestion) return

    if (
      !formData.questionText || 
      !formData.optionA || 
      !formData.optionB || 
      !formData.optionC || 
      !formData.optionD
    ) {
      alert("Please fill in the question text and all four options.")
      return
    }

    const updated = questions.map((q) => {
      if (q.id === targetQuestion.id) {
        return {
          ...q,
          questionText: formData.questionText,
          options: {
            A: formData.optionA,
            B: formData.optionB,
            C: formData.optionC,
            D: formData.optionD
          },
          correctAnswer: formData.correctAnswer,
          marks: Number(formData.marks) || 2,
          subject: formData.subject,
          difficulty: formData.difficulty
        }
      }
      return q
    })

    setQuestions(updated)
    setIsEditOpen(false)
    resetForm()
  }

  // Open Delete Confirm
  const handleOpenDelete = (q: typeof INITIAL_QUESTIONS[0]) => {
    setTargetQuestion(q)
    setIsDeleteOpen(true)
  }

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!targetQuestion) return
    setQuestions(questions.filter((q) => q.id !== targetQuestion.id))
    setIsDeleteOpen(false)
    setTargetQuestion(null)
  }

  // Mock CSV parse
  const handleCSVUpload = (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploadOpen(false)
    alert("Mock CSV uploaded successfully! 5 questions parsed and added to pool.")
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
                <SelectTrigger className="w-[120px] h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Subjects</SelectItem>
                  <SelectItem value="Tech">Tech</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Math">Math</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
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

          </div>

        </CardContent>
      </Card>

      {/* Questions Data Table */}
      <Card className="border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {filteredQuestions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <HelpCircle className="size-8 stroke-1" />
              <span className="font-semibold text-sm">No questions match your filter query.</span>
              <Button 
                variant="link" 
                onClick={() => {
                  setSearch("")
                  setSubjectFilter("All")
                  setDifficultyFilter("All")
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
                  <TableHead className="w-[70px]">ID</TableHead>
                  <TableHead className="min-w-[250px] max-w-[400px]">Question Text</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="text-center">Answer</TableHead>
                  <TableHead className="text-center">Marks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedQuestions.map((q) => (
                  <TableRow key={q.id} className="hover:bg-muted/30 transition-colors">
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
            <p>questionText, optionA, optionB, optionC, optionD, correctAnswer, marks, subject, difficulty</p>
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
              <label className="text-xs font-bold text-muted-foreground">
                Subject Branch *
              </label>
              <Select value={formData.subject} onValueChange={(val) => handleSelectChange("subject", val || "Tech")}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tech">Tech</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Math">Math</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
              <label className="text-xs font-bold text-muted-foreground">
                Subject Branch *
              </label>
              <Select value={formData.subject} onValueChange={(val) => handleSelectChange("subject", val || "Tech")}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tech">Tech</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Math">Math</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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

    </div>
  )
}
