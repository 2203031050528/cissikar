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
  AlertTriangle 
} from "lucide-react"

import { getStudents, createStudent, updateStudent, deleteStudent } from "@/app/actions/students"

interface Student {
  id: string
  name: string
  rollNumber: string
  email: string
  branch: string
  status: string
  joinDate: string
}

export default function StudentsManagementPage() {
  const [students, setStudents] = React.useState<Student[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [branchFilter, setBranchFilter] = React.useState("All")
  const [statusFilter, setStatusFilter] = React.useState("All")
  
  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 5

  // Modals state
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [targetStudent, setTargetStudent] = React.useState<Student | null>(null)

  // Form states
  const [formData, setFormData] = React.useState({
    name: "",
    rollNumber: "",
    email: "",
    branch: "10-A",
    status: "Active"
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
        s.rollNumber.includes(search) ||
        s.email.toLowerCase().includes(search.toLowerCase())
      
      const matchesBranch = branchFilter === "All" || s.branch === branchFilter
      const matchesStatus = statusFilter === "All" || s.status === statusFilter

      return matchesSearch && matchesBranch && matchesStatus
    })
  }, [students, search, branchFilter, statusFilter])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, branchFilter, statusFilter])

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

  const handleBranchChange = (value: string) => {
    setFormData((prev) => ({ ...prev, branch: value }))
  }

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }))
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
        email: formData.email,
        branch: formData.branch,
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
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      branch: student.branch,
      status: student.status
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
        email: formData.email,
        branch: formData.branch,
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
      email: "",
      branch: "10-A",
      status: "Active"
    })
    setTargetStudent(null)
  }

  return (
    <div className="space-y-6">
      
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Student Management</h1>
          <p className="text-sm text-muted-foreground">Manage student registrations, academic branches, and credentials.</p>
        </div>
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

      {/* Search, Filter, Action Controls */}
      <Card className="border shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="w-full md:max-w-xs">
            <SearchBox 
              value={search} 
              onChange={setSearch} 
              placeholder="Search by name, roll, email..." 
            />
          </div>

          {/* Filters Select */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Filter by Branch */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="size-3" />
                <span>Branch:</span>
              </span>
              <Select value={branchFilter} onValueChange={(val) => setBranchFilter(val || "All")}>
                <SelectTrigger className="w-[120px] h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Branches</SelectItem>
                  <SelectItem value="Tech">Tech</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Math">Math</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
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
                  setBranchFilter("All")
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
                  <TableHead>Email</TableHead>
                  <TableHead>Branch</TableHead>
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
                    <TableCell className="text-xs text-muted-foreground">{student.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs font-normal">
                        {student.branch}
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

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="branch">
                Academic Branch *
              </label>
              <Select value={formData.branch} onValueChange={(val) => handleBranchChange(val || "Tech")}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Branch" />
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
            <label className="text-xs font-bold text-muted-foreground" htmlFor="email">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input 
                id="email" 
                name="email" 
                type="email"
                placeholder="e.g. alice@cissikar.edu" 
                className="pl-8 h-8 text-xs"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
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

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="edit-branch">
                Academic Branch *
              </label>
              <Select value={formData.branch} onValueChange={(val) => handleBranchChange(val || "Tech")}>
                <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Branch" />
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
            <label className="text-xs font-bold text-muted-foreground" htmlFor="edit-email">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input 
                id="edit-email" 
                name="email" 
                type="email"
                className="pl-8 h-8 text-xs"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
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

    </div>
  )
}
