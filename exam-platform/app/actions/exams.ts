"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { auth } from "@/auth"

async function verifyAuth() {
  const session = await auth()
  if (!session || !session.user) {
    throw new Error("Unauthorized")
  }
  return session as unknown as { user: { id: string; name?: string | null; email?: string | null; role: string } }
}

async function verifyAdmin() {
  const session = await verifyAuth()
  if ((session.user as any).role !== "admin") {
    throw new Error("Unauthorized: Administrative privileges required.")
  }
}

// 1. Get Exams for Admin Dashboard/Builder
export async function getExamsAdmin() {
  await verifyAdmin()

  // Execute queries in parallel batch
  const [examsRes, eqRes] = await Promise.all([
    supabaseAdmin.from("exams").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("exam_questions").select("exam_id, question_id"),
  ])

  if (examsRes.error) {
    console.error("Error fetching exams:", examsRes.error)
    throw new Error(examsRes.error.message)
  }

  const allEqData = eqRes.data || []
  const allQuestionIds = Array.from(new Set(allEqData.map((eq) => eq.question_id)))

  let questionMarksMap = new Map<string, number>()
  if (allQuestionIds.length > 0) {
    const { data: qData } = await supabaseAdmin
      .from("questions")
      .select("id, marks")
      .in("id", allQuestionIds)
    questionMarksMap = new Map((qData || []).map((q) => [q.id, Number(q.marks)]))
  }

  const examQuestionsMap = new Map<string, string[]>()
  for (const eq of allEqData) {
    if (!examQuestionsMap.has(eq.exam_id)) {
      examQuestionsMap.set(eq.exam_id, [])
    }
    examQuestionsMap.get(eq.exam_id)!.push(eq.question_id)
  }

  return (examsRes.data || []).map((exam) => {
    const questionIds = examQuestionsMap.get(exam.id) || []
    const servedCount = exam.num_questions_to_serve && exam.num_questions_to_serve > 0
      ? Math.min(exam.num_questions_to_serve, questionIds.length)
      : questionIds.length
    const servedQuestionIds = questionIds.slice(0, servedCount > 0 ? servedCount : questionIds.length)
    const totalMarks = servedQuestionIds.reduce((sum, qId) => sum + (questionMarksMap.get(qId) || 0), 0)

    return {
      id: exam.id,
      name: exam.title,
      classTarget: exam.class_section || "All",
      duration: String(exam.duration_minutes),
      startTime: exam.start_time,
      endTime: exam.end_time,
      questionsCount: servedCount > 0 ? servedCount : questionIds.length,
      totalMarks: totalMarks,
      status: getExamStatus(exam.start_time, exam.end_time),
      randomizeQuestions: exam.randomize_questions,
      numQuestionsToServe: exam.num_questions_to_serve,
      resultsPublished: exam.results_published || false,
    }
  })
}

function getExamStatus(startTime: string, endTime: string): string {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)

  if (now < start) return "Scheduled"
  if (now > end) return "Completed"
  return "Active"
}

// 2. Create Exam
export async function createExam(
  examData: {
    title: string
    durationMinutes: number
    startTime: string
    endTime: string
    classSection: string
    numQuestionsToServe: number
    randomizeQuestions: boolean
  },
  questionIds: string[]
) {
  await verifyAdmin()

  const { data: exam, error: examError } = await supabaseAdmin
    .from("exams")
    .insert({
      title: examData.title,
      duration_minutes: examData.durationMinutes,
      start_time: examData.startTime,
      end_time: examData.endTime,
      class_section: examData.classSection,
      num_questions_to_serve: examData.numQuestionsToServe || questionIds.length,
      randomize_questions: examData.randomizeQuestions,
    })
    .select()
    .single()

  if (examError) {
    console.error("Error creating exam:", examError)
    throw new Error(examError.message)
  }

  if (questionIds.length > 0) {
    const relations = questionIds.map((qId) => ({
      exam_id: exam.id,
      question_id: qId,
    }))

    const { error: relError } = await supabaseAdmin
      .from("exam_questions")
      .insert(relations)

    if (relError) {
      console.error("Error linking questions:", relError)
      throw new Error(relError.message)
    }
  }

  return exam
}

// 3. Delete Exam
export async function deleteExam(examId: string) {
  await verifyAdmin()

  const { error } = await supabaseAdmin
    .from("exams")
    .delete()
    .eq("id", examId)

  if (error) {
    console.error("Error deleting exam:", error)
    throw new Error(error.message)
  }

  return { success: true }
}

// 4. Get Exams for Student Portal
export async function getExamsStudent() {
  const session = await verifyAuth()
  const studentId = session.user.id
  const classSection = (session.user as any).class_section || null

  // Fetch student roll number, full name, class_section
  const { data: studentUser, error: uError } = await supabaseAdmin
    .from("users")
    .select("class_section")
    .eq("id", studentId)
    .single()

  if (uError) throw new Error(uError.message)

  const targetSection = studentUser.class_section

  // Fetch exams matching target class_section (or all if exam section is null/empty/All)
  let query = supabaseAdmin.from("exams").select("*")
  if (targetSection) {
    const classOnly = targetSection.split("-")[0]
    query = query.or(`class_section.eq.${targetSection},class_section.eq.${classOnly},class_section.eq.All,class_section.is.null`)
  }

  const { data: exams, error: examsError } = await query

  if (examsError) {
    console.error("Error fetching student exams:", examsError)
    throw new Error(examsError.message)
  }

  // Fetch student's attempts
  const { data: attempts, error: attError } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .eq("student_id", studentId)

  if (attError) throw new Error(attError.message)

  const attemptsMap = new Map(attempts.map((a) => [a.exam_id, a]))
  const results = []

  for (const exam of exams) {
    const attempt = attemptsMap.get(exam.id)
    const now = new Date()
    const start = new Date(exam.start_time)
    const end = new Date(exam.end_time)

    let status = "Scheduled"
    let isLaunchable = false
    let marks = "--"
    let maxMarks = "100"
    let attemptId = ""

    // Calculate max marks for the exam (sum of questions assigned)
    const { data: eqData } = await supabaseAdmin
      .from("exam_questions")
      .select("question_id")
      .eq("exam_id", exam.id)

    const questionIds = eqData?.map((x) => x.question_id) || []
    let examMaxMarks = 0
    if (questionIds.length > 0) {
      const { data: qData } = await supabaseAdmin
        .from("questions")
        .select("marks")
        .in("id", questionIds)
      examMaxMarks = qData?.reduce((sum, q) => sum + Number(q.marks), 0) || 0
    }
    maxMarks = String(examMaxMarks)

    const isPublished = exam.results_published || false

    if (attempt) {
      attemptId = attempt.id
      if (attempt.status === "in_progress") {
        const deadline = new Date(attempt.deadline)
        if (now < deadline && now < end) {
          status = "In Progress"
          isLaunchable = true
        } else {
          // If past deadline, it should count as submitted
          if (!isPublished) {
            status = "Completed (Pending Publish)"
            marks = "--"
          } else {
            status = "Submitted"
            marks = attempt.total_score !== null ? String(attempt.total_score) : "0"
          }
        }
      } else {
        if (!isPublished) {
          status = "Completed (Pending Publish)"
          marks = "--"
        } else {
          status = attempt.status === "submitted" || attempt.status === "auto_submitted" ? "Passed" : "Failed" // map outcome
          const score = Number(attempt.total_score) || 0
          marks = String(score)
          if (examMaxMarks > 0 && (score / examMaxMarks) < 0.5) {
            status = "Failed"
          } else {
            status = "Passed"
          }
        }
      }
    } else {
      // No attempt yet
      if (now >= start && now <= end) {
        status = "Scheduled"
        isLaunchable = true
      } else if (now > end) {
        status = "Missed"
        isLaunchable = false
      } else {
        status = "Scheduled"
        isLaunchable = false
      }
    }

    results.push({
      id: exam.id,
      name: exam.title,
      code: exam.title.split(" ")[0] || "EXAM", // extract code from title or generic
      date: new Date(exam.start_time).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      rawStartTime: exam.start_time,
      rawEndTime: exam.end_time,
      durationMinutes: exam.duration_minutes,
      marks: marks,
      maxMarks: maxMarks,
      status: status,
      isLaunchable: isLaunchable,
      attemptId: attemptId,
    })
  }

  return results
}

// 5. Start Attempt
export async function startAttempt(examId: string) {
  const session = await verifyAuth()
  const studentId = session.user.id

  // Check if attempt already exists
  const { data: existing, error: exError } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .eq("exam_id", examId)
    .eq("student_id", studentId)

  if (exError) throw new Error(exError.message)

  if (existing && existing.length > 0) {
    const attempt = existing[0]
    if (attempt.status === "in_progress") {
      // Check deadline
      const deadline = new Date(attempt.deadline)
      const now = new Date()
      if (now < deadline) {
        return attempt // return existing active attempt
      } else {
        // Submit automatically
        await submitAttempt(attempt.id, true)
        throw new Error("Exam deadline has already passed.")
      }
    } else {
      throw new Error("Exam already submitted.")
    }
  }

  // Get exam details
  const { data: exam, error: examError } = await supabaseAdmin
    .from("exams")
    .select("*")
    .eq("id", examId)
    .single()

  if (examError) throw new Error(examError.message)

  // Get questions linked to exam
  const { data: eqData, error: eqError } = await supabaseAdmin
    .from("exam_questions")
    .select("question_id")
    .eq("exam_id", examId)

  if (eqError) throw new Error(eqError.message)

  let questionIds = eqData.map((x) => x.question_id)
  if (questionIds.length === 0) {
    throw new Error("This exam has no questions assigned.")
  }

  // Handle randomization and slice to serve size
  if (exam.randomize_questions) {
    questionIds = questionIds.sort(() => Math.random() - 0.5)
  }

  const serveSize = exam.num_questions_to_serve || questionIds.length
  const finalQuestionIds = questionIds.slice(0, serveSize)

  // Calculate deadline
  const now = new Date()
  const durationMs = exam.duration_minutes * 60 * 1000
  const deadlineTime = new Date(Math.min(now.getTime() + durationMs, new Date(exam.end_time).getTime()))

  // Insert attempt
  const { data: newAttempt, error: insError } = await supabaseAdmin
    .from("attempts")
    .insert({
      exam_id: examId,
      student_id: studentId,
      started_at: now.toISOString(),
      deadline: deadlineTime.toISOString(),
      status: "in_progress",
      question_order: finalQuestionIds,
    })
    .select()
    .single()

  if (insError) {
    console.error("Error creating attempt:", insError)
    throw new Error(insError.message)
  }

  return newAttempt
}

// 6. Get Attempt Context
export async function getAttempt(attemptId: string) {
  const session = await verifyAuth()
  const studentId = session.user.id

  const { data: attempt, error: aError } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .single()

  if (aError) throw new Error(aError.message)

  // Security: check if attempt belongs to this student
  if (attempt.student_id !== studentId) {
    throw new Error("Unauthorized access to attempt.")
  }

  // Get exam details
  const { data: exam, error: examError } = await supabaseAdmin
    .from("exams")
    .select("*")
    .eq("id", attempt.exam_id)
    .single()

  if (examError) throw new Error(examError.message)

  // Get questions in question_order
  const questionIds = attempt.question_order

  const { data: questions, error: qError } = await supabaseAdmin
    .from("questions")
    .select("id, question_text, option_a, option_b, option_c, option_d, marks")
    .in("id", questionIds)

  if (qError) throw new Error(qError.message)

  // Sort questions to match the attempt's exact order
  const questionsMap = new Map(questions.map((q) => [q.id, q]))
  const orderedQuestions = questionIds
    .map((id: string, index: number) => {
      const q = questionsMap.get(id)
      if (!q) return null
      return {
        id: q.id,
        num: index + 1,
        text: q.question_text,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        },
        marks: Number(q.marks),
      }
    })
    .filter(Boolean)

  // Fetch responses
  const { data: responses, error: rError } = await supabaseAdmin
    .from("responses")
    .select("question_id, selected_option")
    .eq("attempt_id", attemptId)

  if (rError) throw new Error(rError.message)

  const answersMap: { [key: string]: string } = {}
  responses?.forEach((r) => {
    if (r.selected_option) {
      answersMap[r.question_id] = r.selected_option
    }
  })

  return {
    attempt,
    exam,
    questions: orderedQuestions,
    answers: answersMap,
  }
}

// 7. Save Answer Response
export async function saveResponse(
  attemptId: string,
  questionId: string,
  selectedOption: string | null
) {
  const session = await verifyAuth()

  // Security check: attempt is active
  const { data: attempt, error: aError } = await supabaseAdmin
    .from("attempts")
    .select("status, deadline, student_id")
    .eq("id", attemptId)
    .single()

  if (aError) throw new Error(aError.message)
  if (attempt.student_id !== session.user.id) {
    throw new Error("Unauthorized")
  }
  if (attempt.status !== "in_progress") {
    throw new Error("Attempt is already submitted.")
  }

  const now = new Date()
  if (now > new Date(attempt.deadline)) {
    // If deadline has passed, submit the attempt
    await submitAttempt(attemptId, true)
    throw new Error("Time limit exceeded, response not saved.")
  }

  if (selectedOption === null) {
    // Clear answer
    const { error: delError } = await supabaseAdmin
      .from("responses")
      .delete()
      .eq("attempt_id", attemptId)
      .eq("question_id", questionId)

    if (delError) throw new Error(delError.message)
    return { success: true }
  }

  const { error } = await supabaseAdmin
    .from("responses")
    .upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: selectedOption,
        answered_at: now.toISOString(),
      },
      { onConflict: "attempt_id,question_id" }
    )

  if (error) {
    console.error("Error saving response:", error)
    throw new Error(error.message)
  }

  return { success: true }
}

// 8. Submit Attempt
export async function submitAttempt(attemptId: string, isAutoSubmit = false) {
  const session = await verifyAuth()

  const { data: attempt, error: aError } = await supabaseAdmin
    .from("attempts")
    .select("status, student_id, exam_id, question_order")
    .eq("id", attemptId)
    .single()

  if (aError) throw new Error(aError.message)
  if (attempt.student_id !== session.user.id) {
    throw new Error("Unauthorized")
  }

  if (attempt.status !== "in_progress") {
    return { success: true, alreadySubmitted: true }
  }

  // Calculate total score for this attempt
  let questionIds: string[] = attempt.question_order || []
  if (questionIds.length === 0 && attempt.exam_id) {
    const { data: eqData } = await supabaseAdmin
      .from("exam_questions")
      .select("question_id")
      .eq("exam_id", attempt.exam_id)
    questionIds = (eqData || []).map((x) => x.question_id)
  }

  let computedScore = 0
  if (questionIds.length > 0) {
    const [qRes, rRes] = await Promise.all([
      supabaseAdmin.from("questions").select("id, correct_option, marks").in("id", questionIds),
      supabaseAdmin.from("responses").select("question_id, selected_option").eq("attempt_id", attemptId),
    ])

    const questionsMap = new Map((qRes.data || []).map((q) => [q.id, q]))
    const responsesMap = new Map((rRes.data || []).map((r) => [r.question_id, r.selected_option]))

    for (const qId of questionIds) {
      const q = questionsMap.get(qId)
      if (!q) continue
      const selected = responsesMap.get(qId)
      if (selected && selected === q.correct_option) {
        computedScore += Number(q.marks || 1)
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from("attempts")
    .update({
      status: isAutoSubmit ? "auto_submitted" : "submitted",
      submitted_at: new Date().toISOString(),
      total_score: computedScore,
    })
    .eq("id", attemptId)
    .select()
    .single()

  if (error) {
    console.error("Error submitting attempt:", error)
    throw new Error(error.message)
  }

  return { success: true, attempt: data }
}

// 9. Get Attempt Results Scorecard and Review
export async function getAttemptResults(attemptId: string) {
  const session = await verifyAuth()

  const { data: attempt, error: aError } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .single()

  if (aError) throw new Error(aError.message)

  // Security: only the student who took it, or an admin can view results
  if (attempt.student_id !== session.user.id && (session.user as any).role !== "admin") {
    throw new Error("Unauthorized access to results.")
  }

  // Get exam details
  const { data: exam, error: examError } = await supabaseAdmin
    .from("exams")
    .select("*")
    .eq("id", attempt.exam_id)
    .single()

  if (examError) throw new Error(examError.message)

  // If student is requesting, check if results are published
  if ((session.user as any).role === "student" && !exam.results_published) {
    throw new Error("Results for this exam have not been published by the administrator yet.")
  }

  // Fetch responses
  const { data: responses, error: rError } = await supabaseAdmin
    .from("responses")
    .select("*")
    .eq("attempt_id", attemptId)

  if (rError) throw new Error(rError.message)

  const responsesMap = new Map(responses.map((r) => [r.question_id, r]))

  // Fetch questions in question_order
  const questionIds = attempt.question_order

  const { data: questions, error: qError } = await supabaseAdmin
    .from("questions")
    .select("*")
    .in("id", questionIds)

  if (qError) throw new Error(qError.message)

  const questionsMap = new Map(questions.map((q) => [q.id, q]))
  let totalPossibleMarks = 0
  let correctCount = 0
  let wrongCount = 0

  const reviews = questionIds
    .map((id: string, index: number) => {
      const q = questionsMap.get(id)
      if (!q) return null

      const res = responsesMap.get(id)
      const isCorrect = res ? res.is_correct : false
      const marksVal = Number(q.marks)
      totalPossibleMarks += marksVal

      if (res) {
        if (isCorrect) correctCount++
        else wrongCount++
      } else {
        // unanswered
        wrongCount++
      }

      return {
        id: q.id,
        num: index + 1,
        text: q.question_text,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        },
        userAnswer: res ? res.selected_option : null,
        correctAnswer: q.correct_option,
        isCorrect: isCorrect,
        marks: marksVal,
        explanation: q.subject 
          ? `Correct answer option is ${q.correct_option}. This question pertains to the topic of ${q.subject}.`
          : `Correct answer option is ${q.correct_option}.`,
      }
    })
    .filter(Boolean)

  const score = attempt.total_score !== null ? Number(attempt.total_score) : 0
  const percentage = totalPossibleMarks > 0 ? Math.round((score / totalPossibleMarks) * 100) : 0

  // Calculate elapsed time
  const start = new Date(attempt.started_at)
  const end = attempt.submitted_at ? new Date(attempt.submitted_at) : new Date()
  const diffMs = end.getTime() - start.getTime()
  const m = Math.floor(diffMs / 60000)
  const s = Math.floor((diffMs % 60000) / 1000)
  const timeTaken = `${m}m ${s}s`

  return {
    examName: exam.title,
    score: `${score} / ${totalPossibleMarks}`,
    percentage: `${percentage}%`,
    correct: correctCount,
    wrong: wrongCount,
    timeTaken: timeTaken,
    date: new Date(attempt.submitted_at || attempt.started_at).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    reviews: reviews,
  }
}

// 10. Get System Metrics (Admin Dashboard)
export async function getAdminMetrics() {
  await verifyAdmin()

  // Execute all top-level queries in parallel using Promise.all
  const [
    studentsRes,
    attemptsRes,
    questionsRes,
    examsRes,
    submittedRes,
    recentExamsRes,
    recentStudentsRes,
    recentAttemptsRes,
    allExamQuestionsRes,
  ] = await Promise.all([
    supabaseAdmin.from("users").select("id", { count: "exact" }).eq("role", "student"),
    supabaseAdmin.from("attempts").select("exam_id, student_id"),
    supabaseAdmin.from("questions").select("id", { count: "exact" }),
    supabaseAdmin.from("exams").select("id, start_time, end_time"),
    supabaseAdmin.from("attempts").select("id, exam_id, total_score, question_order, submitted_at, started_at").neq("status", "in_progress"),
    supabaseAdmin.from("exams").select("*").order("created_at", { ascending: false }).limit(4),
    supabaseAdmin.from("users").select("roll_number, full_name, email, created_at").eq("role", "student").order("created_at", { ascending: false }).limit(4),
    supabaseAdmin.from("attempts").select("*, users(full_name), exams(title)").neq("status", "in_progress").order("submitted_at", { ascending: false }).limit(4),
    supabaseAdmin.from("exam_questions").select("exam_id, question_id"),
  ])

  const totalStudents = studentsRes.count || 0
  const activeStudentIds = new Set(attemptsRes.data?.map((a) => a.student_id).filter(Boolean))
  const activeStudents = activeStudentIds.size
  const totalQuestions = questionsRes.count || 0

  // Calculate takers count per exam
  const examTakersMap = new Map<string, number>()
  attemptsRes.data?.forEach((a) => {
    if (a.exam_id) {
      examTakersMap.set(a.exam_id, (examTakersMap.get(a.exam_id) || 0) + 1)
    }
  })

  const exams = examsRes.data || []
  const totalExams = exams.length
  const now = new Date()
  const liveExams = exams.filter((e) => now >= new Date(e.start_time) && now <= new Date(e.end_time)).length

  const submittedAttempts = submittedRes.data || []
  const recentAttempts = recentAttemptsRes.data || []

  // Map exam_id -> question_ids from exam_questions
  const examQuestionsMap = new Map<string, string[]>()
  for (const eq of (allExamQuestionsRes.data || [])) {
    if (!examQuestionsMap.has(eq.exam_id)) {
      examQuestionsMap.set(eq.exam_id, [])
    }
    examQuestionsMap.get(eq.exam_id)!.push(eq.question_id)
  }

  // Helper to get assigned question IDs for an attempt
  const getAttemptQuestionIds = (att: { question_order?: string[] | null; exam_id?: string | null }): string[] => {
    if (att.question_order && att.question_order.length > 0) {
      return att.question_order
    }
    if (att.exam_id && examQuestionsMap.has(att.exam_id)) {
      return examQuestionsMap.get(att.exam_id)!
    }
    return []
  }

  // Collect ALL question IDs needed across submitted & recent attempts
  const allNeededQuestionIds = Array.from(new Set([
    ...submittedAttempts.flatMap((a) => getAttemptQuestionIds(a)),
    ...recentAttempts.flatMap((a) => getAttemptQuestionIds(a)),
  ]))

  // Fetch targeted questions with marks
  let questionMarksMap = new Map<string, number>()
  if (allNeededQuestionIds.length > 0) {
    const { data: qData } = await supabaseAdmin
      .from("questions")
      .select("id, marks")
      .in("id", allNeededQuestionIds)

    questionMarksMap = new Map((qData || []).map((q) => [q.id, Number(q.marks)]))
  }

  // Compute scores for attempts missing total_score
  const attemptsMissingScore = [
    ...submittedAttempts.filter((a) => a.total_score === null),
    ...recentAttempts.filter((a) => a.total_score === null),
  ]
  const uniqueMissingAttemptIds = Array.from(new Set(attemptsMissingScore.map((a) => a.id)))

  const computedScoresMap = new Map<string, number>()

  if (uniqueMissingAttemptIds.length > 0) {
    const [responsesRes, questionsForScoreRes] = await Promise.all([
      supabaseAdmin.from("responses").select("attempt_id, question_id, selected_option").in("attempt_id", uniqueMissingAttemptIds),
      supabaseAdmin.from("questions").select("id, correct_option, marks").in("id", allNeededQuestionIds),
    ])

    const questionsDict = new Map((questionsForScoreRes.data || []).map((q) => [q.id, q]))
    const responsesByAttempt = new Map<string, { question_id: string; selected_option: string }[]>()

    for (const r of (responsesRes.data || [])) {
      if (!responsesByAttempt.has(r.attempt_id)) {
        responsesByAttempt.set(r.attempt_id, [])
      }
      responsesByAttempt.get(r.attempt_id)!.push(r)
    }

    const allAttemptsToScore = [...submittedAttempts, ...recentAttempts].filter((a) => uniqueMissingAttemptIds.includes(a.id))
    
    for (const att of allAttemptsToScore) {
      if (computedScoresMap.has(att.id)) continue
      const qIds = getAttemptQuestionIds(att)
      const userResp = responsesByAttempt.get(att.id) || []
      const respMap = new Map(userResp.map((r) => [r.question_id, r.selected_option]))

      let score = 0
      for (const qId of qIds) {
        const q = questionsDict.get(qId)
        if (q && respMap.get(qId) === q.correct_option) {
          score += Number(q.marks || 1)
        }
      }
      computedScoresMap.set(att.id, score)

      // Backfill score in DB
      await supabaseAdmin.from("attempts").update({ total_score: score }).eq("id", att.id)
    }
  }

  let totalPercentage = 0
  let passedCount = 0
  let gradedCount = 0

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const currentDate = new Date()
  const monthsList: { year: number; monthIdx: number; label: string; scores: number[] }[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    monthsList.push({
      year: d.getFullYear(),
      monthIdx: d.getMonth(),
      label: monthNames[d.getMonth()],
      scores: [],
    })
  }

  for (const att of submittedAttempts) {
    const scoreVal = att.total_score !== null ? Number(att.total_score) : (computedScoresMap.get(att.id) ?? 0)
    const questionIds = getAttemptQuestionIds(att)
    const maxMarks = questionIds.reduce((sum, qId) => sum + (questionMarksMap.get(qId) || 0), 0)

    if (maxMarks > 0) {
      const percentage = (scoreVal / maxMarks) * 100
      totalPercentage += percentage
      if (percentage >= 50) passedCount++
      gradedCount++

      const dateObj = new Date(att.submitted_at || att.started_at || Date.now())
      const targetMonth = monthsList.find((m) => m.year === dateObj.getFullYear() && m.monthIdx === dateObj.getMonth())
      if (targetMonth) {
        targetMonth.scores.push(Math.round(percentage))
      }
    }
  }

  const averagePercentage = gradedCount > 0 ? Math.round(totalPercentage / gradedCount) : 0
  const passRate = gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0

  const performanceTrend = monthsList.map((m) => ({
    month: m.label,
    score: m.scores.length > 0 ? Math.round(m.scores.reduce((a, b) => a + b, 0) / m.scores.length) : 0,
    count: m.scores.length,
  }))

  const monthsWithData = performanceTrend.filter((m) => m.count > 0)
  let trendText = "+0% Trend"
  let isPositiveTrend = true

  if (monthsWithData.length >= 2) {
    const prevScore = monthsWithData[monthsWithData.length - 2].score
    const currScore = monthsWithData[monthsWithData.length - 1].score
    const diff = currScore - prevScore
    trendText = diff >= 0 ? `+${diff}% Trend` : `${diff}% Trend`
    isPositiveTrend = diff >= 0
  } else if (monthsWithData.length === 1) {
    trendText = `+${monthsWithData[0].score}% Avg`
    isPositiveTrend = true
  }

  const mappedRecentResults = recentAttempts.map((att) => {
    const questionIds = getAttemptQuestionIds(att)
    const maxMarks = questionIds.reduce((sum, qId) => sum + (questionMarksMap.get(qId) || 0), 0)
    const scoreVal = att.total_score !== null ? Number(att.total_score) : (computedScoresMap.get(att.id) ?? 0)
    const pct = maxMarks > 0 ? Math.round((scoreVal / maxMarks) * 100) : 0
    return {
      student: (att.users as any)?.full_name || "Student",
      code: (att.exams as any)?.title?.split(" ")[0] || "EXAM",
      score: `${pct}%`,
      maxScore: "100%",
      date: new Date(att.submitted_at || att.started_at).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      }),
      outcome: pct >= 50 ? "Pass" : "Fail",
    }
  })

  return {
    metrics: {
      studentsTotal: String(totalStudents),
      studentsActive: String(activeStudents),
      questionsTotal: String(totalQuestions),
      examsTotal: String(totalExams),
      examsActive: `${liveExams} Live Now`,
      averagePerformance: `${averagePercentage}%`,
      passRate: `${passRate}%`,
    },
    performanceTrend,
    trendText,
    isPositiveTrend,
    recentExams: (recentExamsRes.data || []).map((e) => ({
      id: e.id,
      code: e.title.split(" ")[0] || "EXAM",
      title: e.title,
      questions: e.num_questions_to_serve || (examQuestionsMap.get(e.id)?.length || 10),
      date: new Date(e.start_time).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      duration: `${e.duration_minutes}m`,
      takers: examTakersMap.get(e.id) || 0,
    })),
    recentStudents: (recentStudentsRes.data || []).map((s) => ({
      roll: s.roll_number || "N/A",
      name: s.full_name,
      email: s.email || "N/A",
      regDate: new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      status: "Active",
    })),
    recentResults: mappedRecentResults,
  }
}

// 11. Get Exams for Public landing page
export async function getExamsPublic() {
  const [examsRes, eqRes] = await Promise.all([
    supabaseAdmin
      .from("exams")
      .select("id, title, duration_minutes, start_time, end_time, class_section")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("exam_questions").select("exam_id"),
  ])

  if (examsRes.error) {
    console.error("Error fetching public exams:", examsRes.error)
    throw new Error(examsRes.error.message)
  }

  const countMap = new Map<string, number>()
  for (const eq of eqRes.data || []) {
    countMap.set(eq.exam_id, (countMap.get(eq.exam_id) || 0) + 1)
  }

  return (examsRes.data || []).map((exam) => ({
    id: exam.id,
    title: exam.title,
    code: exam.title.split(" ")[0] || "EXAM",
    duration: `${exam.duration_minutes} mins`,
    questions: countMap.get(exam.id) || 0,
    category: exam.class_section || "General",
    status: getExamStatus(exam.start_time, exam.end_time),
  }))
}

// 12. Toggle publish/unpublish of exam results
export async function togglePublishResults(examId: string, publish: boolean) {
  await verifyAdmin()

  const { data, error } = await supabaseAdmin
    .from("exams")
    .update({ results_published: publish })
    .eq("id", examId)
    .select()

  if (error) {
    console.error("Error toggling results publication:", error)
    throw new Error(error.message)
  }

  return { success: true, exam: data[0] }
}

// 13. Get Exam Attempts Report for Admin
export async function getExamAttemptsReport(examId: string) {
  await verifyAdmin()

  // Execute all top-level queries in parallel batch
  const [examRes, eqRes, attRes, questionsRes] = await Promise.all([
    supabaseAdmin.from("exams").select("*").eq("id", examId).single(),
    supabaseAdmin.from("exam_questions").select("question_id").eq("exam_id", examId),
    supabaseAdmin.from("attempts").select("*, users(full_name, roll_number, class_section)").eq("exam_id", examId).neq("status", "in_progress"),
    supabaseAdmin.from("questions").select("id, correct_option, marks"),
  ])

  if (examRes.error) throw new Error(examRes.error.message)
  if (eqRes.error) throw new Error(eqRes.error.message)
  if (attRes.error) throw new Error(attRes.error.message)

  const exam = examRes.data
  const allQuestionsMap = new Map((questionsRes.data || []).map((q) => [q.id, q]))
  const poolQuestionIds = (eqRes.data || []).map((x) => x.question_id)
  
  const servedCount = exam.num_questions_to_serve && exam.num_questions_to_serve > 0
    ? Math.min(exam.num_questions_to_serve, poolQuestionIds.length)
    : poolQuestionIds.length

  const defaultServedQuestionIds = poolQuestionIds.slice(0, servedCount > 0 ? servedCount : poolQuestionIds.length)
  const defaultMaxMarks = defaultServedQuestionIds.reduce((sum, qId) => sum + Number(allQuestionsMap.get(qId)?.marks || 1), 0) || 1

  const attempts = attRes.data || []

  // Identify attempts that lack computed total_score
  const missingScoreAttemptIds = attempts.filter((a) => a.total_score === null).map((a) => a.id)
  const computedScoresMap = new Map<string, number>()

  if (missingScoreAttemptIds.length > 0) {
    const { data: responsesData } = await supabaseAdmin
      .from("responses")
      .select("attempt_id, question_id, selected_option")
      .in("attempt_id", missingScoreAttemptIds)

    const responsesByAttempt = new Map<string, Map<string, string>>()
    for (const r of (responsesData || [])) {
      if (!responsesByAttempt.has(r.attempt_id)) {
        responsesByAttempt.set(r.attempt_id, new Map())
      }
      responsesByAttempt.get(r.attempt_id)!.set(r.question_id, r.selected_option)
    }

    for (const att of attempts) {
      if (att.total_score !== null) continue
      const qIds: string[] = (att.question_order && att.question_order.length > 0)
        ? att.question_order
        : defaultServedQuestionIds

      const userResp = responsesByAttempt.get(att.id) || new Map()
      let score = 0
      for (const qId of qIds) {
        const q = allQuestionsMap.get(qId)
        if (q && userResp.get(qId) === q.correct_option) {
          score += Number(q.marks || 1)
        }
      }
      computedScoresMap.set(att.id, score)

      // Backfill total_score in database
      await supabaseAdmin.from("attempts").update({ total_score: score }).eq("id", att.id)
    }
  }

  const takers = attempts.map((att) => {
    const scoreVal = att.total_score !== null ? Number(att.total_score) : (computedScoresMap.get(att.id) ?? 0)
    const qIds: string[] = (att.question_order && att.question_order.length > 0)
      ? att.question_order
      : defaultServedQuestionIds

    const attMaxMarks = qIds.reduce((sum, qId) => sum + Number(allQuestionsMap.get(qId)?.marks || 1), 0) || defaultMaxMarks
    const pct = attMaxMarks > 0 ? Math.round((scoreVal / attMaxMarks) * 100) : 0
    const passed = pct >= 50

    return {
      attemptId: att.id,
      studentName: (att.users as any)?.full_name || "Unknown Student",
      rollNumber: (att.users as any)?.roll_number || "N/A",
      classSection: (att.users as any)?.class_section || "N/A",
      startedAt: att.started_at,
      submittedAt: att.submitted_at || att.started_at,
      score: scoreVal,
      maxMarks: attMaxMarks,
      percentage: pct,
      passed,
      status: att.status,
    }
  })

  // Compute overall metrics
  const totalAttempts = takers.length
  let avgPercentage = 0
  let highestPercentage = 0
  let lowestPercentage = totalAttempts > 0 ? 100 : 0
  let passCount = 0

  if (totalAttempts > 0) {
    let sumPercentages = 0
    takers.forEach((t) => {
      sumPercentages += t.percentage
      if (t.percentage > highestPercentage) highestPercentage = t.percentage
      if (t.percentage < lowestPercentage) lowestPercentage = t.percentage
      if (t.passed) passCount++
    })
    avgPercentage = Math.round(sumPercentages / totalAttempts)
  }

  const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0

  return {
    exam: {
      id: exam.id,
      title: exam.title,
      duration: exam.duration_minutes,
      startTime: exam.start_time,
      endTime: exam.end_time,
      classSection: exam.class_section,
      resultsPublished: exam.results_published || false,
      maxMarks: defaultMaxMarks,
    },
    metrics: {
      totalAttempts,
      avgPercentage,
      highestPercentage,
      lowestPercentage,
      passRate,
    },
    attempts: takers,
  }
}

export async function getStudentProfile() {
  const session = await verifyAuth()
  const studentId = session.user.id

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email, roll_number, class_section, role, created_at")
    .eq("id", studentId)
    .single()

  if (error) {
    console.error("Error fetching student profile:", error)
    throw new Error(error.message)
  }

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email || "Not provided",
    rollNumber: data.roll_number || "N/A",
    classSection: data.class_section || "10-Pearl",
    role: data.role || "student",
    createdAt: data.created_at,
  }
}
