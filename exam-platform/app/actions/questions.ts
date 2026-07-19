"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { auth } from "@/auth"

async function verifyAdmin() {
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    throw new Error("Unauthorized: Administrative privileges required.")
  }
}

// Maps marks to difficulty for UI compatibility since DB has no difficulty column
function getDifficultyByMarks(marks: number): string {
  if (marks <= 2) return "Easy"
  if (marks <= 4) return "Medium"
  return "Hard"
}

export async function getQuestions() {
  await verifyAdmin()

  const { data, error } = await supabaseAdmin
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching questions:", error)
    throw new Error(error.message)
  }

  return data.map((q) => ({
    id: q.id,
    questionText: q.question_text,
    options: {
      A: q.option_a,
      B: q.option_b,
      C: q.option_c,
      D: q.option_d,
    },
    correctAnswer: q.correct_option,
    marks: Number(q.marks),
    subject: q.subject || "General",
    difficulty: getDifficultyByMarks(Number(q.marks)),
  }))
}

export async function createQuestion(formData: {
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  marks: string | number
  subject: string
}) {
  await verifyAdmin()

  const { data, error } = await supabaseAdmin
    .from("questions")
    .insert({
      question_text: formData.questionText,
      option_a: formData.optionA,
      option_b: formData.optionB,
      option_c: formData.optionC,
      option_d: formData.optionD,
      correct_option: formData.correctAnswer,
      marks: Number(formData.marks) || 1,
      subject: formData.subject,
    })
    .select()

  if (error) {
    console.error("Error creating question:", error)
    throw new Error(error.message)
  }

  return data[0]
}

export async function updateQuestion(
  id: string,
  formData: {
    questionText: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    correctAnswer: string
    marks: string | number
    subject: string
  }
) {
  await verifyAdmin()

  const { data, error } = await supabaseAdmin
    .from("questions")
    .update({
      question_text: formData.questionText,
      option_a: formData.optionA,
      option_b: formData.optionB,
      option_c: formData.optionC,
      option_d: formData.optionD,
      correct_option: formData.correctAnswer,
      marks: Number(formData.marks) || 1,
      subject: formData.subject,
    })
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating question:", error)
    throw new Error(error.message)
  }

  return data[0]
}

export async function deleteQuestion(id: string) {
  await verifyAdmin()

  const { error } = await supabaseAdmin
    .from("questions")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting question:", error)
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

export async function uploadQuestionsCSV(csvText: string) {
  await verifyAdmin()

  const lines = csvText.split(/\r?\n/)
  if (lines.length <= 1) return { success: false, count: 0 }

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase())
  const questionsToInsert: any[] = []

  // Simple CSV parser
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const row = parseCSVLine(line)

    if (row.length < 6) continue // Must have question text + 4 options + correct option

    // Let's assume columns map to:
    // questionText, optionA, optionB, optionC, optionD, correctAnswer, marks, subject
    const questionText = row[0]
    const optionA = row[1]
    const optionB = row[2]
    const optionC = row[3]
    const optionD = row[4]
    const correctOption = row[5]?.toUpperCase() || "A"
    const marks = Number(row[6]) || 1
    const subject = row[7] || "General"

    questionsToInsert.push({
      question_text: questionText,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption,
      marks,
      subject,
    })
  }

  if (questionsToInsert.length === 0) {
    return { success: false, count: 0 }
  }

  const { error } = await supabaseAdmin
    .from("questions")
    .insert(questionsToInsert)

  if (error) {
    console.error("Error uploading questions CSV:", error)
    throw new Error(error.message)
  }

  return { success: true, count: questionsToInsert.length }
}
