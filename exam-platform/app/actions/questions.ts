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
    classTarget: q.class || "All",
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
  classTarget: string
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
      class: formData.classTarget,
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
    classTarget: string
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
      class: formData.classTarget,
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

export async function deleteManyQuestions(ids: string[]) {
  await verifyAdmin()

  if (ids.length === 0) return { success: true, deleted: 0 }

  // Remove from exam_questions join table first
  const { error: eqErr } = await supabaseAdmin
    .from("exam_questions")
    .delete()
    .in("question_id", ids)

  if (eqErr) {
    console.error("Error removing questions from exams:", eqErr)
    throw new Error(eqErr.message)
  }

  // Delete questions
  const { error } = await supabaseAdmin
    .from("questions")
    .delete()
    .in("id", ids)

  if (error) {
    console.error("Error bulk deleting questions:", error)
    throw new Error(error.message)
  }

  return { success: true, deleted: ids.length }
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

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const questionsToInsert: any[] = []

  // Helper to resolve index from multiple possible names or a fallback default
  const getColIndex = (names: string[], defaultIdx: number) => {
    for (const name of names) {
      const idx = headers.indexOf(name.toLowerCase())
      if (idx !== -1) return idx
    }
    return defaultIdx
  }

  // Detect if there's an empty first column causing a shift (e.g. leading commas)
  const shift = headers[0] === "" ? 1 : 0

  const qIdx = getColIndex(["questiontext", "question_text", "question"], 0 + shift)
  const aIdx = getColIndex(["optiona", "option_a", "a"], 1 + shift)
  const bIdx = getColIndex(["optionb", "option_b", "b"], 2 + shift)
  const cIdx = getColIndex(["optionc", "option_c", "c"], 3 + shift)
  const dIdx = getColIndex(["optiond", "option_d", "d"], 4 + shift)
  const ansIdx = getColIndex(["correctanswer", "correct_answer", "correct_option", "answer"], 5 + shift)
  const marksIdx = getColIndex(["marks", "mark", "pts"], 6 + shift)
  const subIdx = getColIndex(["subject", "branch"], 7 + shift)
  const classIdx = getColIndex(["class", "class_target", "class_section"], 9 + shift)

  // Simple CSV parser
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const row = parseCSVLine(line)

    if (row.length < 6) continue // Must have question text + 4 options + correct option

    const questionText = row[qIdx] || ""
    const optionA = row[aIdx] || ""
    const optionB = row[bIdx] || ""
    const optionC = row[cIdx] || ""
    const optionD = row[dIdx] || ""
    const correctOption = row[ansIdx]?.toUpperCase() || "A"
    const marks = Number(row[marksIdx]) || 1
    const subject = row[subIdx] || "General"
    const classTarget = row[classIdx] || "All"

    // Skip header row copies if they are repeated or empty questions
    if (!questionText || questionText.toLowerCase() === "questiontext") continue

    questionsToInsert.push({
      question_text: questionText,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption,
      marks,
      subject,
      class: classTarget,
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

    const msg = error.message || ""
    if (
      msg.includes("column 'class'") ||
      msg.includes('column "class"') ||
      msg.includes("schema cache") ||
      error.code === "42703"
    ) {
      throw new Error(
        "The database is missing the 'class' column on the 'questions' table. Please run the following SQL command in your Supabase SQL Editor first:\n\nALTER TABLE questions ADD COLUMN class TEXT;"
      )
    }

    if (error.code === "23514") {
      throw new Error(
        "Check constraint violation. Please make sure that all rows have a correct answer option (correctAnswer) of 'A', 'B', 'C', or 'D' in uppercase."
      )
    }

    if (error.code === "22001") {
      throw new Error(
        "Value too long for character(1). Please make sure that your 'correctAnswer' column only contains a single character ('A', 'B', 'C', or 'D')."
      )
    }

    throw new Error(error.message)
  }

  return { success: true, count: questionsToInsert.length }
}
