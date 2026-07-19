"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"

async function verifyAdmin() {
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    throw new Error("Unauthorized: Administrative privileges required.")
  }
}

export async function getStudents() {
  await verifyAdmin()

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email, roll_number, class_section, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching students:", error)
    throw new Error(error.message)
  }

  return data.map((student) => ({
    id: student.id,
    name: student.full_name,
    email: student.email || "",
    rollNumber: student.roll_number,
    branch: student.class_section || "", // map class_section to branch for UI compatibility
    status: "Active", // user table doesn't have status, default to Active
    joinDate: new Date(student.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
  }))
}

export async function createStudent(formData: {
  name: string
  rollNumber: string
  email: string
  branch: string
  password?: string
}) {
  await verifyAdmin()

  const plainPassword = formData.password || "password123"
  const passwordHash = await bcrypt.hash(plainPassword, 10)

  // Handlers for empty fields to avoid UNIQUE key conflict on email
  const emailValue = formData.email?.trim() || null

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      role: "student",
      full_name: formData.name,
      email: emailValue,
      roll_number: formData.rollNumber,
      password_hash: passwordHash,
      class_section: formData.branch,
    })
    .select()

  if (error) {
    console.error("Error creating student:", error)
    if (error.code === "23505") {
      throw new Error(`Roll Number "${formData.rollNumber}" already exists.`)
    }
    throw new Error(error.message)
  }

  return data[0]
}

export async function updateStudent(
  id: string,
  formData: {
    name: string
    rollNumber: string
    email: string
    branch: string
  }
) {
  await verifyAdmin()

  const emailValue = formData.email?.trim() || null

  const { data, error } = await supabaseAdmin
    .from("users")
    .update({
      full_name: formData.name,
      email: emailValue,
      roll_number: formData.rollNumber,
      class_section: formData.branch,
    })
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating student:", error)
    throw new Error(error.message)
  }

  return data[0]
}

export async function deleteStudent(id: string) {
  await verifyAdmin()

  // Note: deleting a student will cascade delete their attempts if foreign keys are setup
  // but let's delete them cleanly.
  const { error } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting student:", error)
    throw new Error(error.message)
  }

  return { success: true }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  
  return result.map(val => val.replace(/^"|"$/g, "").trim())
}

export async function uploadStudentsCSV(csvText: string) {
  await verifyAdmin()

  const lines = csvText.split(/\r?\n/)
  if (lines.length <= 1) return { success: false, count: 0 }

  const studentsToInsert: any[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const row = parseCSVLine(line)

    if (row.length < 4) continue // Must have name, roll number, class, section

    const name = row[0]
    const rollNumber = row[1]
    const classVal = row[2]
    const sectionVal = row[3]
    const plainPassword = row[4] || "password123"
    const passwordHash = await bcrypt.hash(plainPassword, 10)

    studentsToInsert.push({
      role: "student",
      full_name: name,
      roll_number: rollNumber,
      class_section: `${classVal}-${sectionVal}`,
      password_hash: passwordHash,
      email: null,
    })
  }

  if (studentsToInsert.length === 0) {
    return { success: false, count: 0 }
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert(studentsToInsert)
    .select()

  if (error) {
    console.error("Error bulk uploading students:", error)
    if (error.code === "23505") {
      throw new Error("One or more roll numbers in the CSV already exist in the database. Please ensure all roll numbers are unique.")
    }
    throw new Error(error.message)
  }

  return { success: true, count: data?.length || 0 }
}
