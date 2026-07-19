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
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Mail, 
  Hash, 
  BookOpen, 
  Filter, 
  ChevronRight,
  AlertTriangle,
  Upload
} from "lucide-react"

import { getStudents, createStudent, updateStudent, deleteStudent, uploadStudentsCSV } from "@/app/actions/students"

interface Student {
  id: string
  name: string
  rollNumber: string
  email: string
  branch: string
  status: string
  joinDate: string
}

const parseClassSection = (str: string) => {
  if (!str) return { classVal: "1", sectionVal: "Pearl" }
  const parts = str.split("-")
  if (parts.length === 2) {
    return { classVal: parts[0], sectionVal: parts[1] }
  }
  const match = str.match(/^(\d+)(.*)$/)
  if (match) {
    const num = match[1]
    let sec = match[2].replace(/^-/, "") || "Pearl"
    if (sec === "A") sec = "Pearl"
    if (sec === "B") sec = "Ruby"
    return { classVal: num, sectionVal: sec }
  }
  return { classVal: "1", sectionVal: "Pearl" }
}

const formatBranch = (branch: string) => {
  if (!branch) return "--"
  const parts = branch.split("-")
  if (parts.length === 2) {
    return `Class ${parts[0]} - ${parts[1]}`
  }
  return branch
}

export default function StudentsManagementPage() {
  const [students, setStudents] = React.useState<Student[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [classFilter, setClassFilter] = React.useState("All")
  const [sectionFilter, setSectionFilter] = React.useState("All")
  const [statusFilter, setStatusFilter] = React.useState("All")
  
  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  // Modals state
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [targetStudent, setTargetStudent] = React.useState<Student | null>(null)

  // Form states
  const [formData, setFormData] = React.useState({
    name: "",
    rollNumber: "",
    classVal: "1",
    sectionVal: "Pearl",
    status: "Active",
    password: ""
  })

  const loadStudents = async () => {
    setIsLoading(true)
    try {
      const data = await getStudents()
      setStudents(data)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to load students.")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadStudents()
  }, [])

  // Filter & Search Logic
  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = 
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNumber.includes(search)
      
      const { classVal, sectionVal } = parseClassSection(s.branch)
      const matchesClass = classFilter === "All" || classVal === classFilter
      const matchesSection = sectionFilter === "All" || sectionVal === sectionFilter
      const matchesStatus = statusFilter === "All" || s.status === statusFilter

      return matchesSearch && matchesClass && matchesSection && matchesStatus
    })
  }, [students, search, classFilter, sectionFilter, statusFilter])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, classFilter, sectionFilter, statusFilter])

  // Paginated Students
  const paginatedStudents = React.useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return filteredStudents.slice(startIdx, startIdx + pageSize)
  }, [filteredStudents, currentPage])

  const totalPages = Math.ceil(filteredStudents.length / pageSize)

  // Handle Form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleClassChange = (value: string | null) => {
    setFormData((prev) => ({ ...prev, classVal: value || "1" }))
  }

  const handleSectionChange = (value: string | null) => {
    setFormData((prev) => ({ ...prev, sectionVal: value || "Pearl" }))
  }

  const handleStatusChange = (value: string | null) => {
    setFormData((prev) => ({ ...prev, status: value || "Active" }))
  }

  // Add Student Submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Quick validation
    if (!formData.name || !formData.rollNumber) {
      alert("Please fill all the required fields.")
      return
    }

    const isRollExists = students.some((s) => s.rollNumber === formData.rollNumber)
    if (isRollExists) {
      alert("A student with this Roll Number already exists.")
      return
    }

    setIsLoading(true)
    try {
      await createStudent({
        name: formData.name,
        rollNumber: formData.rollNumber,
        email: "",
        branch: `${formData.classVal}-${formData.sectionVal}`,
        password: formData.password,
      })
      setIsAddOpen(false)
      resetForm()
      await loadStudents()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to create student.")
      setIsLoading(false)
    }
  }

  // Edit Button Action
  const handleOpenEdit = (student: Student) => {
    setTargetStudent(student)
    const { classVal, sectionVal } = parseClassSection(student.branch)
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      classVal,
      sectionVal,
      status: student.status,
      password: ""
    })
    setIsEditOpen(true)
  }

  // Edit Student Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetStudent) return

    if (!formData.name || !formData.rollNumber) {
      alert("Please fill all required fields.")
      return
    }

    setIsLoading(true)
    try {
      await updateStudent(targetStudent.id, {
        name: formData.name,
        rollNumber: formData.rollNumber,
        email: "",
        branch: `${formData.classVal}-${formData.sectionVal}`,
      })
      setIsEditOpen(false)
      resetForm()
      await loadStudents()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to update student.")
      setIsLoading(false)
    }
  }

  // Delete Action Click
  const handleOpenDelete = (student: Student) => {
    setTargetStudent(student)
    setIsDeleteOpen(true)
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!targetStudent) return
    setIsLoading(true)
    try {
      await deleteStudent(targetStudent.id)
      setIsDeleteOpen(false)
      setTargetStudent(null)
      await loadStudents()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to delete student.")
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      rollNumber: "",
      classVal: "1",
      sectionVal: "Pearl",
      status: "Active",
      password: ""
    })
    setTargetStudent(null)
  }

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const input = document.getElementById("student-csv-input") as HTMLInputElement
    const file = input?.files?.[0]
    if (!file) {
      alert("Please select a CSV file first.")
      return
    }

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const text = evt.target?.result as string
      if (!text) return

      setIsLoading(true)
      try {
        const res = await uploadStudentsCSV(text)
        if (res.success) {
          alert(`Successfully uploaded ${res.count} students.`)
          setIsUploadOpen(false)
          await loadStudents()
        } else {
          alert("No valid students found in CSV.")
        }
      } catch (err: any) {
        console.error(err)
        alert(err.message || "Failed to upload CSV.")
      } finally {
        setIsLoading(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Student Management</h1>
          <p className="text-sm text-muted-foreground">Manage student registrations, academic branches, and credentials.</p>
        </div>
        <div className="flex items-center gap-2">
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
            <UserPlus className="size-4" />
            <span>Add Student</span>
          </Button>
        </div>
      </div>

      {/* Search, Filter, Action Controls */}
      <Card className="border shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="w-full md:max-w-xs">
            <SearchBox 
              value={search} 
              onChange={setSearch} 
              placeholder="Search by name or roll number..." 
            />
          </div>

          {/* Filters Select */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Filter by Class (1 to 12) */}
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

            {/* Filter by Section (Pearl, Ruby, Diamond) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="size-3" />
                <span>Section:</span>
              </span>
              <Select value={sectionFilter} onValueChange={(val) => setSectionFilter(val || "All")}>
                <SelectTrigger className="w-[110px] h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sections</SelectItem>
                  <SelectItem value="Pearl">Pearl</SelectItem>
                  <SelectItem value="Ruby">Ruby</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="size-3" />
                <span>Status:</span>
              </span>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "All")}>
                <SelectTrigger className="w-[120px] h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

        </CardContent>
      </Card>

      {/* Student List Table */}
      <Card className="border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader size="lg" />
              <span className="text-xs text-muted-foreground animate-pulse">Loading student records...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Users className="size-8 stroke-1" />
              <span className="font-semibold text-sm">No student records found matching your filters.</span>
              <Button 
                variant="link" 
                onClick={() => {
                  setSearch("")
                  setClassFilter("All")
                  setSectionFilter("All")
                  setStatusFilter("All")
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
                  <TableHead className="w-[120px]">Roll Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class Section</TableHead>
                  <TableHead>Date of Join</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-bold text-xs text-muted-foreground">{student.rollNumber}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">{student.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs font-normal">
                        {formatBranch(student.branch)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{student.joinDate}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={student.status === "Active" ? "default" : "secondary"}
                        className="rounded-full px-2.5 py-0.5 text-[9px] font-semibold tracking-wide"
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="icon-xs" 
                          className="hover:text-primary cursor-pointer text-muted-foreground"
                          onClick={() => handleOpenEdit(student)}
                        >
                          <Edit className="size-3.5" />
                          <span className="sr-only">Edit student</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-xs" 
                          className="hover:text-destructive cursor-pointer text-muted-foreground"
                          onClick={() => handleOpenDelete(student)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Delete student</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        
        {/* Pagination bar */}
        {filteredStudents.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Showing <strong className="text-foreground">{paginatedStudents.length}</strong> of <strong className="text-foreground">{filteredStudents.length}</strong> students
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

      {/* --- Modals & Dialogs UI --- */}

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={setIsAddOpen}
        title={
          <div className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            <span>Add New Student Profile</span>
          </div>
        }
        description="Register a new candidate onto the Cissikar Exam Platform database."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground" htmlFor="name">
              Full Name *
            </label>
            <Input 
              id="name" 
              name="name" 
              placeholder="e.g. Alice Cooper" 
              className="h-8 text-xs"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground" htmlFor="rollNumber">
              Roll Number *
            </label>
            <div className="relative">
              <Hash className="absolute left-2.5 top-2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input 
                id="rollNumber" 
                name="rollNumber" 
                placeholder="e.g. 20264009" 
                className="pl-8 h-8 text-xs"
                value={formData.rollNumber}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Class *
              </label>
              <Select value={formData.classVal} onValueChange={handleClassChange}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Section *
              </label>
              <Select value={formData.sectionVal} onValueChange={handleSectionChange}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pearl">Pearl</SelectItem>
                  <SelectItem value="Ruby">Ruby</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground" htmlFor="password">
              Password *
            </label>
            <Input 
              id="password" 
              name="password" 
              type="password"
              placeholder="Min 6 characters" 
              className="h-8 text-xs"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">
              Registration Status *
            </label>
            <Select value={formData.status} onValueChange={(val) => handleStatusChange(val || "Active")}>
              <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="cursor-pointer"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm"
              className="cursor-pointer"
            >
              Save Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={setIsEditOpen}
        title={
          <div className="flex items-center gap-2">
            <Edit className="size-5 text-primary" />
            <span>Edit Student Profile</span>
          </div>
        }
        description={`Update account specifications for ${targetStudent?.name}.`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground" htmlFor="edit-name">
              Full Name *
            </label>
            <Input 
              id="edit-name" 
              name="name" 
              className="h-8 text-xs"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground" htmlFor="edit-roll">
              Roll Number *
            </label>
            <div className="relative">
              <Hash className="absolute left-2.5 top-2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input 
                id="edit-roll" 
                name="rollNumber" 
                className="pl-8 h-8 text-xs bg-muted/20"
                value={formData.rollNumber}
                onChange={handleInputChange}
                disabled // Roll Number should not be editable as it is a unique key
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Class *
              </label>
              <Select value={formData.classVal} onValueChange={handleClassChange}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Section *
              </label>
              <Select value={formData.sectionVal} onValueChange={handleSectionChange}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pearl">Pearl</SelectItem>
                  <SelectItem value="Ruby">Ruby</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">
              Registration Status *
            </label>
            <Select value={formData.status} onValueChange={(val) => handleStatusChange(val || "Active")}>
              <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="cursor-pointer"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm"
              className="cursor-pointer"
            >
              Apply Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={setIsDeleteOpen}
        title={
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <span>Confirm Deletion</span>
          </div>
        }
        description="Are you absolutely sure you want to delete this student profile?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground leading-normal">
            This action will permanently delete the student profile for <strong className="text-foreground">{targetStudent?.name} ({targetStudent?.rollNumber})</strong>. They will no longer be able to log in or take scheduled examinations. This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="cursor-pointer"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              size="sm"
              className="cursor-pointer"
              onClick={handleConfirmDelete}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload CSV Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={setIsUploadOpen}
        title={
          <div className="flex items-center gap-2">
            <Upload className="size-5 text-primary" />
            <span>Upload Students via CSV</span>
          </div>
        }
        description="Select a comma-separated values (CSV) file matching our student directory layout template."
      >
        <form onSubmit={handleCSVUpload} className="space-y-4 pt-2">
          
          <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-muted/10">
            <Upload className="size-8 text-muted-foreground stroke-1 mb-1" />
            <input 
              id="student-csv-input" 
              type="file" 
              accept=".csv" 
              className="text-xs text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
              required 
            />
          </div>

          <div className="text-[11px] text-muted-foreground leading-normal space-y-1.5 bg-muted/20 p-3 rounded-lg border">
            <p className="font-bold text-foreground">Expected CSV Column Structure:</p>
            <ul className="list-disc pl-4 space-y-1 font-mono">
              <li><strong>Column 1 (Name):</strong> Full name of the student</li>
              <li><strong>Column 2 (Roll Number):</strong> Unique roll identifier</li>
              <li><strong>Column 3 (Class):</strong> Numeric class value (e.g. 1 to 12)</li>
              <li><strong>Column 4 (Section):</strong> Section type (Pearl, Ruby, Diamond)</li>
              <li><strong>Column 5 (Password - Optional):</strong> Plaintext password (defaults to "password123")</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="cursor-pointer"
              onClick={() => setIsUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm"
              className="cursor-pointer"
            >
              Import Students
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
