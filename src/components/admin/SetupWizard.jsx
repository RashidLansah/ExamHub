import { useState, useMemo, useCallback } from "react"
import {
  Upload, Calendar, Clock, Shuffle, Check, ChevronRight, ChevronLeft,
  FileSpreadsheet, AlertTriangle, X, Download, Eye, MapPin, BookOpen, Trash2, Link2, Unlink2
} from "lucide-react"
import * as XLSX from "xlsx"
import Button from "../ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"

const STEPS = [
  { id: 1, title: "Upload Courses", icon: Upload },
  { id: 2, title: "Semester & Period", icon: Calendar },
  { id: 3, title: "Common Courses", icon: Link2 },
  { id: 4, title: "Generate & Preview", icon: Eye },
  { id: 5, title: "Confirm", icon: Check },
]

const DEFAULT_SESSIONS = [
  { id: 1, label: "Session 1", start: "08:30", end: "11:30" },
  { id: 2, label: "Session 2", start: "14:00", end: "17:00" },
]

const SetupWizard = ({ venues, programmes, onComplete, onCancel, existingExams }) => {
  const [step, setStep] = useState(1)
  const [courses, setCourses] = useState([])
  const [parseErrors, setParseErrors] = useState([])
  const [fileName, setFileName] = useState("")

  // Step 2 - Period settings
  const [semesterTitle, setSemesterTitle] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [excludeWeekends, setExcludeWeekends] = useState(true)
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS)

  // Step 3 - Common courses
  const [commonGroups, setCommonGroups] = useState([])
  const [uncommittedCommon, setUncommittedCommon] = useState([])

  // Step 4 - Generated schedule
  const [generatedExams, setGeneratedExams] = useState([])
  const [scheduleStats, setScheduleStats] = useState({})

  // Step 5 - Confirm
  const [replaceExisting, setReplaceExisting] = useState(true)

  // ─── Excel Upload with Smart Column Detection ────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setParseErrors([])

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

        if (jsonData.length === 0) {
          setParseErrors(["The spreadsheet appears to be empty."])
          return
        }

        // Smart column detection (case-insensitive)
        const headerMap = {}
        const rawHeaders = Object.keys(jsonData[0])
        const mappings = {
          courseCode: ["course code", "coursecode", "code", "course_code", "course id", "courseid"],
          courseTitle: ["course title", "coursetitle", "title", "course_title", "course name", "coursename", "name", "course"],
          programme: ["programme", "program", "department", "dept", "dept.", "option", "faculty"],
          level: ["level", "year", "lvl"],
          numStudents: ["no of students", "noofstudents", "students", "no of candidates", "no of cand", "candidates", "number", "count"],
          indexStart: ["index start", "indexstart", "index number", "indexnumber"],
        }

        rawHeaders.forEach(h => {
          const lower = h.toLowerCase().trim()
          for (const [key, aliases] of Object.entries(mappings)) {
            if (aliases.includes(lower)) {
              headerMap[key] = h
              break
            }
          }
        })

        const errors = []
        if (!headerMap.courseCode) errors.push("Missing column: Course Code (expected: 'Course Code', 'Code', etc.)")
        if (!headerMap.courseTitle) errors.push("Missing column: Course Title (expected: 'Course Title', 'Title', 'Name', etc.)")
        if (!headerMap.programme) errors.push("Missing column: Programme/Department (expected: 'Programme', 'Department', 'Option', etc.)")

        if (errors.length > 0) {
          setParseErrors(errors)
          setCourses([])
          return
        }

        const parsed = jsonData
          .map((row, idx) => {
            const numStudentsStr = String(row[headerMap.numStudents] || "0").trim()
            const numStudents = parseInt(numStudentsStr, 10) || 0
            return {
              id: idx,
              courseCode: String(row[headerMap.courseCode] || "").trim(),
              courseTitle: String(row[headerMap.courseTitle] || "").trim(),
              programme: String(row[headerMap.programme] || "").trim(),
              level: headerMap.level ? String(row[headerMap.level] || "100").trim() : "100",
              numStudents: numStudents,
            }
          })
          .filter(c => c.courseCode && c.courseTitle)

        if (parsed.length === 0) {
          setParseErrors(["No valid course rows found. Ensure Course Code and Course Title are filled in."])
          return
        }

        setCourses(parsed)
        setCommonGroups([])
        setUncommittedCommon([])
      } catch (err) {
        setParseErrors(["Failed to parse the file. Please ensure it's a valid .xlsx, .xls, or .csv file."])
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // ─── Template download ───────────────────────────────────
  const handleDownloadTemplate = () => {
    const templateData = [
      { "Course Code": "CS101", "Course Title": "Intro to Computer Science", "Programme": "Computer Science", "Level": "100", "No of Students": "180" },
      { "Course Code": "MATH201", "Course Title": "Linear Algebra", "Programme": "Mathematics", "Level": "200", "No of Students": "95" },
      { "Course Code": "PHY102", "Course Title": "Mechanics", "Programme": "Physics", "Level": "100", "No of Students": "65" },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Courses")
    ws["!cols"] = [{ wch: 14 }, { wch: 35 }, { wch: 22 }, { wch: 8 }, { wch: 16 }]
    XLSX.writeFile(wb, "course_template.xlsx")
  }

  // ─── Session management ────────────────────────────────
  const updateSession = (idx, field, value) => {
    const updated = [...sessions]
    updated[idx] = { ...updated[idx], [field]: value }
    setSessions(updated)
  }

  // ─── Common courses detection ───────────────────────────
  const detectCommonCourses = useCallback(() => {
    const potential = []
    const titleMap = {}
    const codeMap = {}

    // Group by title
    courses.forEach(c => {
      const titleKey = c.courseTitle.toLowerCase()
      if (!titleMap[titleKey]) titleMap[titleKey] = []
      titleMap[titleKey].push(c)
    })

    // Group by code
    courses.forEach(c => {
      const codeKey = c.courseCode.toLowerCase()
      if (!codeMap[codeKey]) codeMap[codeKey] = []
      codeMap[codeKey].push(c)
    })

    // Find potential common courses
    Object.entries(titleMap).forEach(([title, courseList]) => {
      if (courseList.length > 1 && new Set(courseList.map(c => c.programme)).size > 1) {
        const ids = courseList.map(c => c.id)
        if (!potential.find(p => JSON.stringify(p.courseIds.sort()) === JSON.stringify(ids.sort()))) {
          potential.push({
            id: `common_${Math.random().toString(36).substr(2, 9)}`,
            name: courseList[0].courseTitle,
            courseIds: ids,
            courses: courseList,
            type: "title"
          })
        }
      }
    })

    Object.entries(codeMap).forEach(([code, courseList]) => {
      if (courseList.length > 1 && new Set(courseList.map(c => c.programme)).size > 1) {
        const ids = courseList.map(c => c.id)
        if (!potential.find(p => JSON.stringify(p.courseIds.sort()) === JSON.stringify(ids.sort()))) {
          potential.push({
            id: `common_${Math.random().toString(36).substr(2, 9)}`,
            name: `${courseList[0].courseCode} (${courseList[0].courseTitle})`,
            courseIds: ids,
            courses: courseList,
            type: "code"
          })
        }
      }
    })

    setUncommittedCommon(potential)
  }, [courses])

  const markAsCommon = (commonId) => {
    const item = uncommittedCommon.find(c => c.id === commonId)
    if (item) {
      setCommonGroups([...commonGroups, item])
      setUncommittedCommon(uncommittedCommon.filter(c => c.id !== commonId))
    }
  }

  const unmarkAsCommon = (commonId) => {
    const item = commonGroups.find(c => c.id === commonId)
    if (item) {
      setUncommittedCommon([...uncommittedCommon, item])
      setCommonGroups(commonGroups.filter(c => c.id !== commonId))
    }
  }

  // ─── Available exam days ─────────────────────────────────
  const examDays = useMemo(() => {
    if (!startDate || !endDate) return []
    const days = []
    const current = new Date(startDate + "T12:00:00")
    const end = new Date(endDate + "T12:00:00")
    while (current <= end) {
      const day = current.getDay()
      if (!excludeWeekends || (day !== 0 && day !== 6)) {
        days.push(new Date(current))
      }
      current.setDate(current.getDate() + 1)
    }
    return days
  }, [startDate, endDate, excludeWeekends])

  const totalSlots = examDays.length * sessions.length
  const maxCoursesPerProgramme = useMemo(() => {
    if (courses.length === 0) return 0
    const byProg = {}
    courses.forEach(c => { byProg[c.programme] = (byProg[c.programme] || 0) + 1 })
    return Math.max(...Object.values(byProg))
  }, [courses])
  const slotsNeeded = maxCoursesPerProgramme
  const hasEnoughSlots = totalSlots >= slotsNeeded

  // ─── Enhanced Schedule Generation with Venue Allocation ─────────────────────────────────
  const generateSchedule = useCallback(() => {
    if (courses.length === 0 || examDays.length === 0 || sessions.length === 0 || venues.length === 0) return

    // Build available slots
    const availableSlots = []
    examDays.forEach(day => {
      sessions.forEach(session => {
        availableSlots.push({
          date: day.toISOString().split("T")[0],
          startTime: session.start,
          endTime: session.end,
          sessionId: session.id,
          sessionLabel: session.label,
        })
      })
    })

    // Group courses by programme
    const coursesByProgramme = {}
    courses.forEach(c => {
      if (!coursesByProgramme[c.programme]) coursesByProgramme[c.programme] = []
      coursesByProgramme[c.programme].push(c)
    })

    // Identify courses in common groups
    const commonCourseIds = new Set()
    commonGroups.forEach(g => {
      g.courseIds.forEach(id => commonCourseIds.add(id))
    })

    // Schedule common courses first (all to same slot)
    const scheduled = []
    // usedProgSlots tracks which slots are taken per programme: `${programme}_${date}_${sessionId}`
    const usedProgSlots = {}

    commonGroups.forEach((group, groupIdx) => {
      if (availableSlots.length > groupIdx) {
        const slot = availableSlots[groupIdx]
        const slotKey = `${slot.date}_${slot.sessionId}`

        group.courseIds.forEach(courseId => {
          const course = courses.find(c => c.id === courseId)
          if (course) {
            const exam = {
              id: `gen_${Date.now()}_${courseId}`,
              courseCode: course.courseCode,
              courseTitle: course.courseTitle,
              programme: course.programme,
              level: course.level,
              date: slot.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              session: slot.sessionId,
              numStudents: course.numStudents || 0,
              isCommon: true,
              commonGroupId: group.id,
              allocations: [],
              venue: "",
            }
            scheduled.push(exam)
            usedProgSlots[`${course.programme}_${slotKey}`] = true
          }
        })
      }
    })

    // Schedule remaining (non-common) courses
    const remainingCourses = courses.filter(c => !commonCourseIds.has(c.id))

    // Group by programme and interleave
    const programmeKeys = Object.keys(coursesByProgramme).filter(p => {
      const progCourses = coursesByProgramme[p].filter(c => !commonCourseIds.has(c.id))
      return progCourses.length > 0
    })

    const interleaved = []
    let maxLen = Math.max(...programmeKeys.map(k => coursesByProgramme[k].filter(c => !commonCourseIds.has(c.id)).length), 0)

    for (let i = 0; i < maxLen; i++) {
      programmeKeys.forEach(prog => {
        const progCourses = coursesByProgramme[prog].filter(c => !commonCourseIds.has(c.id))
        if (i < progCourses.length) {
          interleaved.push({ ...progCourses[i], _programme: prog })
        }
      })
    }

    interleaved.forEach(course => {
      let assigned = false

      for (let slotIdx = 0; slotIdx < availableSlots.length && !assigned; slotIdx++) {
        const slot = availableSlots[slotIdx]
        const slotKey = `${slot.date}_${slot.sessionId}`
        const progSlotKey = `${course.programme}_${slotKey}`

        // Skip if this programme already has an exam in this exact slot
        if (usedProgSlots[progSlotKey]) continue

        // Find venue allocations for this course
        const allocations = allocateVenues(course, venues)
        if (allocations.length === 0) continue

        const exam = {
          id: `gen_${Date.now()}_${course.id}`,
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          programme: course.programme,
          level: course.level,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          session: slot.sessionId,
          numStudents: course.numStudents || 0,
          isCommon: false,
          commonGroupId: null,
          allocations: allocations,
          venue: allocations.map(a => a.venueName).join(", "),
        }

        scheduled.push(exam)
        usedProgSlots[progSlotKey] = true
        assigned = true
      }
    })

    // Calculate statistics
    const usedDays = new Set(scheduled.map(e => e.date)).size
    const totalCapacity = venues.reduce((sum, v) => sum + v.capacity, 0) * examDays.length * sessions.length
    const utilizedCapacity = scheduled.reduce((sum, e) => sum + (e.numStudents || 0), 0)
    const utilizationPercent = totalCapacity > 0 ? Math.round((utilizedCapacity / totalCapacity) * 100) : 0

    setGeneratedExams(scheduled)
    setScheduleStats({
      totalExams: scheduled.length,
      usedDays,
      totalDays: examDays.length,
      utilization: utilizationPercent,
    })
  }, [courses, examDays, sessions, commonGroups, venues])

  // ─── Venue Allocation Logic ────────────────────────────────
  const allocateVenues = (course, venueList) => {
    const numStudents = course.numStudents || 0
    if (numStudents === 0 || venueList.length === 0) return []

    // Look up programme prefix and derive admission year from exam period + level
    const progObj = programmes.find(
      p => p.name === course.programme || p.indexPrefix === course.programme
    )
    const prefix = progObj?.indexPrefix || course.programme?.split(" ").map(w => w[0]).join("").toUpperCase() || "XX"
    const level = parseInt(course.level) || 100
    const examYear = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear()
    const admissionYear = String((examYear - (Math.floor(level / 100) - 1)) % 100).padStart(2, "0")

    // Sort venues by capacity (largest first)
    const sortedVenues = [...venueList].sort((a, b) => (b.capacity || 0) - (a.capacity || 0))

    const allocations = []
    let remainingStudents = numStudents
    let seqStart = 1

    for (const venue of sortedVenues) {
      if (remainingStudents <= 0) break
      const capacityToUse = Math.min(venue.capacity || 0, remainingStudents)
      const seqEnd = seqStart + capacityToUse - 1

      allocations.push({
        venueId: venue.id,
        venueName: venue.name,
        capacity: venue.capacity,
        numStudents: capacityToUse,
        indexStart: `${prefix}/${String(seqStart).padStart(3, "0")}/${admissionYear}`,
        indexEnd: `${prefix}/${String(seqEnd).padStart(3, "0")}/${admissionYear}`,
      })

      remainingStudents -= capacityToUse
      seqStart = seqEnd + 1
    }

    return remainingStudents > 0 ? [] : allocations
  }

  // ─── Conflict detection in preview ───────────────────────
  const previewConflicts = useMemo(() => {
    const conflicts = []
    for (let i = 0; i < generatedExams.length; i++) {
      for (let j = i + 1; j < generatedExams.length; j++) {
        const a = generatedExams[i]
        const b = generatedExams[j]

        // Venue conflict: same venue in same date/session
        if (a.date === b.date && a.session === b.session) {
          const aVenues = a.allocations.map(al => al.venueId)
          const bVenues = b.allocations.map(al => al.venueId)
          if (aVenues.some(v => bVenues.includes(v))) {
            conflicts.push({ a, b, type: "venue" })
          }
        }

        // Student conflict: same programme has 2 exams in same session
        if (a.date === b.date && a.session === b.session && a.programme === b.programme) {
          conflicts.push({ a, b, type: "student" })
        }
      }
    }
    return conflicts
  }, [generatedExams])

  // ─── Group preview by date ───────────────────────────────
  const previewGrouped = useMemo(() => {
    const grouped = {}
    generatedExams.forEach(exam => {
      if (!grouped[exam.date]) grouped[exam.date] = []
      grouped[exam.date].push(exam)
    })
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, exams]) => [date, exams.sort((a, b) => a.startTime.localeCompare(b.startTime))])
  }, [generatedExams])

  // ─── Handle confirm ──────────────────────────────────────
  const handleConfirm = () => {
    onComplete({
      exams: replaceExisting ? generatedExams : [...existingExams, ...generatedExams],
      semesterTitle: semesterTitle.trim(),
      replace: replaceExisting,
    })
  }

  const canProceed = () => {
    switch (step) {
      case 1: return courses.length > 0
      case 2: return startDate && endDate && semesterTitle.trim() && hasEnoughSlots
      case 3: return true // Can always skip common courses
      case 4: return generatedExams.length > 0
      case 5: return generatedExams.length > 0
      default: return false
    }
  }

  const handleNext = () => {
    if (step === 1) {
      detectCommonCourses()
    } else if (step === 3) {
      // Auto-generate schedule when entering Step 4
      generateSchedule()
    }
    setStep(s => Math.min(s + 1, 5))
  }

  // ─── Detected programmes from upload ─────────────────────
  const detectedProgrammes = useMemo(() => {
    return [...new Set(courses.map(c => c.programme))].sort()
  }, [courses])

  const detectedLevels = useMemo(() => {
    return [...new Set(courses.map(c => c.level))].sort()
  }, [courses])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-700 rounded-t-xl">
            <div>
              <h2 className="text-xl font-bold text-white">Exam Schedule Setup Wizard</h2>
              <p className="text-indigo-200 text-sm mt-1">Auto-generate your exam timetable from a course list</p>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between mb-8">
              {STEPS.map((s, idx) => {
                const Icon = s.icon
                const isActive = step === s.id
                const isComplete = step > s.id
                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isComplete ? "bg-green-500 text-white" :
                        isActive ? "bg-indigo-600 text-white" :
                        "bg-gray-200 text-gray-400"
                      }`}>
                        {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <span className={`text-xs mt-1.5 font-medium ${
                        isActive ? "text-indigo-600" : isComplete ? "text-green-600" : "text-gray-400"
                      }`}>{s.title}</span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-3 mt-[-18px] ${
                        step > s.id ? "bg-green-500" : "bg-gray-200"
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="px-6 pb-6 min-h-[360px]">
            {/* STEP 1: Upload */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Course List</h3>
                  <p className="text-sm text-gray-600">
                    Upload an Excel spreadsheet containing all courses. The file should have columns for
                    Course Code, Course Title, Programme/Department, and optionally Level.
                  </p>
                </div>

                {/* Template download */}
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Download className="h-4 w-4" /> Download template spreadsheet
                </button>

                {/* Upload area */}
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                  <FileSpreadsheet className="h-10 w-10 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-600">
                    {fileName ? fileName : "Click to upload .xlsx or .xls file"}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">or drag and drop</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Parse errors */}
                {parseErrors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                      <AlertTriangle className="h-4 w-4" /> Issues found
                    </div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {parseErrors.map((e, i) => <li key={i}>• {e}</li>)}
                    </ul>
                  </div>
                )}

                {/* Preview parsed data */}
                {courses.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {courses.length} courses found across {detectedProgrammes.length} programme{detectedProgrammes.length !== 1 ? "s" : ""}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {detectedProgrammes.map(p => (
                        <span key={p} className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">{p}</span>
                      ))}
                    </div>
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left p-2.5 font-medium text-gray-600">Code</th>
                            <th className="text-left p-2.5 font-medium text-gray-600">Title</th>
                            <th className="text-left p-2.5 font-medium text-gray-600">Programme</th>
                            <th className="text-left p-2.5 font-medium text-gray-600">Level</th>
                            <th className="text-right p-2.5 font-medium text-gray-600">Students</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {courses.slice(0, 50).map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="p-2.5 font-medium text-gray-900">{c.courseCode}</td>
                              <td className="p-2.5 text-gray-700">{c.courseTitle}</td>
                              <td className="p-2.5 text-gray-600">{c.programme}</td>
                              <td className="p-2.5 text-gray-600">{c.level}</td>
                              <td className="p-2.5 text-gray-600 text-right">{c.numStudents || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {courses.length > 50 && (
                        <p className="text-xs text-gray-400 p-2 text-center">Showing first 50 of {courses.length} courses</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Semester & Period */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Semester Title & Exam Period</h3>
                  <p className="text-sm text-gray-600">
                    Set the semester title and date range for exams. Exams will be scheduled within this period.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester Title</label>
                  <input
                    type="text"
                    value={semesterTitle}
                    onChange={(e) => setSemesterTitle(e.target.value)}
                    placeholder="e.g. First Semester Exams 2025-2026"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeWeekends}
                    onChange={(e) => setExcludeWeekends(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Exclude weekends (Saturday & Sunday)</span>
                </label>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Session Configuration</h4>
                  <div className="space-y-2">
                    {sessions.map((session, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          value={session.label}
                          onChange={(e) => updateSession(idx, "label", e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
                          placeholder="Session label"
                        />
                        <input
                          type="time"
                          value={session.start}
                          onChange={(e) => updateSession(idx, "start", e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <span className="text-gray-400 text-sm">to</span>
                        <input
                          type="time"
                          value={session.end}
                          onChange={(e) => updateSession(idx, "end", e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary stats */}
                {startDate && endDate && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-700">{examDays.length}</p>
                      <p className="text-xs text-blue-600 mt-1">Exam Days</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-700">{totalSlots}</p>
                      <p className="text-xs text-purple-600 mt-1">Total Slots ({sessions.length}/day)</p>
                    </div>
                    <div className={`p-4 rounded-lg text-center ${hasEnoughSlots ? "bg-green-50" : "bg-red-50"}`}>
                      <p className={`text-2xl font-bold ${hasEnoughSlots ? "text-green-700" : "text-red-700"}`}>{slotsNeeded}</p>
                      <p className={`text-xs mt-1 ${hasEnoughSlots ? "text-green-600" : "text-red-600"}`}>Courses to Schedule</p>
                    </div>
                  </div>
                )}

                {startDate && endDate && !hasEnoughSlots && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">
                      Not enough slots ({totalSlots}) for {slotsNeeded} courses. Extend the date range or add more sessions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Common Courses */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Common Courses</h3>
                  <p className="text-sm text-gray-600">
                    Identify courses taken by multiple programmes. Common courses are scheduled in the same session for all programmes.
                  </p>
                </div>

                {uncommittedCommon.length === 0 && commonGroups.length === 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-sm text-blue-700">No potential common courses detected.</p>
                  </div>
                )}

                {/* Potential common courses */}
                {uncommittedCommon.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Potential Common Courses</h4>
                    <div className="space-y-2">
                      {uncommittedCommon.map(item => (
                        <div key={item.id} className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {item.courses.map(c => c.programme).join(", ")}
                              </p>
                            </div>
                            <button
                              onClick={() => markAsCommon(item.id)}
                              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors flex items-center gap-1"
                            >
                              <Link2 className="h-3.5 w-3.5" /> Mark as Common
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1 text-xs">
                            {item.courses.map((c, i) => (
                              <span key={i} className="px-2 py-1 bg-white rounded text-gray-600">
                                {c.courseCode} ({c.programme})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmed common courses */}
                {commonGroups.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Scheduled as Common ({commonGroups.length})</h4>
                    <div className="space-y-2">
                      {commonGroups.map(item => (
                        <div key={item.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {item.courses.map(c => c.programme).join(", ")}
                              </p>
                            </div>
                            <button
                              onClick={() => unmarkAsCommon(item.id)}
                              className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                            >
                              <Unlink2 className="h-3.5 w-3.5" /> Unmark
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1 text-xs">
                            {item.courses.map((c, i) => (
                              <span key={i} className="px-2 py-1 bg-white rounded text-gray-600">
                                {c.courseCode} ({c.programme})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Venues: {venues.map(v => v.name).join(", ") || "None configured"}
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: Generate & Preview */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Generate & Preview Schedule</h3>
                    <p className="text-sm text-gray-600">
                      {generatedExams.length > 0
                        ? "Review the generated schedule below. Click \"Re-shuffle\" to randomize again."
                        : "Generating your exam timetable using the allocation engine..."}
                    </p>
                  </div>
                  <button
                    onClick={generateSchedule}
                    disabled={courses.length === 0 || examDays.length === 0 || venues.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Shuffle className="h-4 w-4" /> {generatedExams.length > 0 ? "Re-shuffle Schedule" : "Generate Schedule"}
                  </button>
                </div>

                {generatedExams.length > 0 && (
                  <>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-xl font-bold text-blue-700">{scheduleStats.totalExams || 0}</p>
                        <p className="text-xs text-blue-600 mt-1">Total Exams</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg text-center">
                        <p className="text-xl font-bold text-purple-700">{scheduleStats.usedDays || 0}/{scheduleStats.totalDays || 0}</p>
                        <p className="text-xs text-purple-600 mt-1">Days Used</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-xl font-bold text-green-700">{scheduleStats.utilization || 0}%</p>
                        <p className="text-xs text-green-600 mt-1">Venue Utilization</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg text-center">
                        <p className="text-xl font-bold text-amber-700">{previewConflicts.length}</p>
                        <p className="text-xs text-amber-600 mt-1">Conflicts</p>
                      </div>
                    </div>

                    {previewConflicts.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          {previewConflicts.filter(c => c.type === "student").length} potential student conflicts.
                          Try clicking "Generate Schedule" again to re-shuffle.
                        </p>
                      </div>
                    )}

                    {/* Schedule preview */}
                    <div className="max-h-[280px] overflow-y-auto border rounded-lg bg-white">
                      {previewGrouped.map(([date, dateExams]) => (
                        <div key={date}>
                          <div className="sticky top-0 px-3 py-2 bg-indigo-50 border-b font-medium text-sm text-indigo-700 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(date + "T12:00:00").toLocaleDateString("en-US", {
                              weekday: "short", day: "numeric", month: "short", year: "numeric"
                            })}
                            <span className="text-indigo-400 font-normal ml-auto">{dateExams.length} exams</span>
                          </div>
                          <table className="w-full text-xs">
                            <tbody className="divide-y divide-gray-100">
                              {dateExams.map((exam, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 font-medium text-gray-900 w-20">{exam.courseCode}</td>
                                  <td className="px-3 py-2 text-gray-700">{exam.courseTitle.substring(0, 25)}</td>
                                  <td className="px-3 py-2 text-gray-500 w-20">{exam.programme}</td>
                                  <td className="px-3 py-2 text-gray-500 w-16">{exam.startTime}</td>
                                  <td className="px-3 py-2 text-gray-600 text-xs">{exam.venue}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 5: Confirm */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm & Import Schedule</h3>
                  <p className="text-sm text-gray-600">
                    Review the summary and choose how to import the generated schedule.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Semester</p>
                    <p className="text-lg font-bold text-blue-700 mt-1">{semesterTitle || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">Total Exams</p>
                    <p className="text-lg font-bold text-purple-700 mt-1">{generatedExams.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Exam Days</p>
                    <p className="text-lg font-bold text-green-700 mt-1">{scheduleStats.usedDays || 0}</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm font-medium text-amber-900">Programmes</p>
                    <p className="text-lg font-bold text-amber-700 mt-1">{[...new Set(generatedExams.map(e => e.programme))].length}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Import Mode</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors" style={{borderColor: replaceExisting ? '#4f46e5' : '#e5e7eb', backgroundColor: replaceExisting ? '#eef2ff' : 'transparent'}}>
                      <input
                        type="radio"
                        checked={replaceExisting}
                        onChange={() => setReplaceExisting(true)}
                        className="w-5 h-5 text-indigo-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Replace All Exams</p>
                        <p className="text-xs text-gray-600">Clear all existing exams and import new schedule</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors" style={{borderColor: !replaceExisting ? '#4f46e5' : '#e5e7eb', backgroundColor: !replaceExisting ? '#eef2ff' : 'transparent'}}>
                      <input
                        type="radio"
                        checked={!replaceExisting}
                        onChange={() => setReplaceExisting(false)}
                        className="w-5 h-5 text-indigo-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Add to Existing Exams</p>
                        <p className="text-xs text-gray-600">Keep {existingExams.length} existing exam(s) and add new schedule</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-xl">
            <Button
              variant="outline"
              onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}
              className="text-gray-600"
            >
              {step === 1 ? (
                "Cancel"
              ) : (
                <><ChevronLeft className="h-4 w-4 mr-1" /> Back</>
              )}
            </Button>

            {step < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                disabled={generatedExams.length === 0}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 disabled:opacity-40"
              >
                <Check className="h-4 w-4 mr-2" /> Confirm & Import
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupWizard
