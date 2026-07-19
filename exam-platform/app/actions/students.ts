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
