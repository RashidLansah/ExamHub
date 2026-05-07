import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Groups exams by date and sorts chronologically.
 */
const groupByDateSorted = (exams) => {
  const grouped = {}
  exams.forEach(exam => {
    if (!grouped[exam.date]) grouped[exam.date] = []
    grouped[exam.date].push(exam)
  })
  const sortedDates = Object.keys(grouped).sort()
  sortedDates.forEach(date => {
    grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
  })
  return { sortedDates, grouped }
}

/**
 * Format date string to readable format.
 */
const formatDate = (dateStr) => {
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Assigns staff to exam sessions randomly.
 * Each exam session gets at least 1 invigilator; larger venues get more.
 * Staff are distributed evenly across sessions to avoid overloading.
 *
 * @param {Array} exams - Array of exam objects
 * @param {Array} staff - Array of staff objects { id, name, department, phone, email }
 * @returns {Array} - Array of assignment objects { exam, assignedStaff: [...] }
 */
export const assignInvigilators = (exams, staff) => {
  if (!exams.length || !staff.length) return []

  const { sortedDates, grouped } = groupByDateSorted(exams)
  const assignments = []

  // Track how many times each staff has been assigned (for fairness)
  const staffLoadCount = {}
  staff.forEach(s => { staffLoadCount[s.id] = 0 })

  sortedDates.forEach(date => {
    const dateExams = grouped[date]

    // Group exams by session (same time slot = same session)
    const sessions = {}
    dateExams.forEach(exam => {
      const key = `${exam.startTime}-${exam.endTime}`
      if (!sessions[key]) sessions[key] = []
      sessions[key].push(exam)
    })

    Object.entries(sessions).forEach(([timeKey, sessionExams]) => {
      // Each exam in this session needs invigilators
      // Sort staff by load count (least loaded first) then shuffle within same count for randomness
      const sortedStaff = [...staff].sort((a, b) => {
        const diff = staffLoadCount[a.id] - staffLoadCount[b.id]
        return diff !== 0 ? diff : Math.random() - 0.5
      })

      let staffIndex = 0

      sessionExams.forEach(exam => {
        // Determine how many invigilators based on venue info
        // If exam has allocations with multiple venues, assign per venue
        const numInvigilators = exam.allocations
          ? Math.max(exam.allocations.length, 1)
          : 1

        const assigned = []
        for (let i = 0; i < numInvigilators && staffIndex < sortedStaff.length; i++) {
          assigned.push(sortedStaff[staffIndex])
          staffLoadCount[sortedStaff[staffIndex].id]++
          staffIndex++
        }

        // If we've exhausted the list, wrap around
        if (staffIndex >= sortedStaff.length) {
          staffIndex = 0
        }

        assignments.push({
          exam,
          date,
          timeSlot: timeKey,
          assignedStaff: assigned,
        })
      })
    })
  })

  return assignments
}

/**
 * Generates the Master Invigilation Schedule PDF (for admin).
 * Shows all dates, sessions, exams, venues, and assigned invigilators.
 *
 * @param {Array} assignments - Output of assignInvigilators()
 * @param {string} title - PDF title
 */
export const generateInvigilationMasterPdf = (assignments, title = "Invigilation Schedule") => {
  if (!assignments || assignments.length === 0) return

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  // Header
  doc.setFillColor(15, 118, 110) // teal-700
  doc.rect(0, 0, pageWidth, 32, "F")

  const storedSchoolName = localStorage.getItem("schoolName") || "ExamHub"
  const storedSemesterTitle = localStorage.getItem("semesterTitle") || ""

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("Invigilation Schedule", margin, 14)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(storedSemesterTitle || title, margin, 22)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text(storedSchoolName, pageWidth - margin, 14, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  const now = new Date()
  doc.text(
    `Generated: ${now.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}`,
    pageWidth - margin, 22, { align: "right" }
  )

  let yPos = 40

  // Group assignments by date
  const byDate = {}
  assignments.forEach(a => {
    if (!byDate[a.date]) byDate[a.date] = []
    byDate[a.date].push(a)
  })

  const sortedDates = Object.keys(byDate).sort()

  sortedDates.forEach(date => {
    const dateAssignments = byDate[date]

    if (yPos > pageHeight - 40) {
      doc.addPage()
      yPos = 14
    }

    // Date header
    doc.setFillColor(240, 253, 250) // teal-50
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 9, 2, 2, "F")
    doc.setTextColor(17, 94, 89) // teal-800
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(formatDate(date), margin + 4, yPos + 6.5)

    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 116, 139)
    doc.text(`${dateAssignments.length} exam${dateAssignments.length !== 1 ? "s" : ""}`, pageWidth - margin - 4, yPos + 6.5, { align: "right" })

    yPos += 13

    // Table for this date
    const tableData = dateAssignments.map(a => [
      `${a.exam.startTime} - ${a.exam.endTime}`,
      a.exam.courseCode,
      a.exam.courseTitle,
      a.exam.programme,
      `Level ${a.exam.level}`,
      a.exam.venue || (a.exam.allocations ? a.exam.allocations.map(al => al.venueName).join(", ") : "TBD"),
      a.assignedStaff.map(s => s.name).join(", ") || "Unassigned",
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["Time", "Code", "Course", "Programme", "Level", "Venue(s)", "Invigilator(s)"]],
      body: tableData,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        lineColor: [209, 213, 219],
        lineWidth: 0.2,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [15, 118, 110], // teal-700
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 22, fontStyle: "bold" },
        2: { cellWidth: "auto" },
        3: { cellWidth: 30 },
        4: { cellWidth: 18 },
        5: { cellWidth: 35 },
        6: { cellWidth: 45 },
      },
      didDrawPage: () => {
        const pageCount = doc.internal.getNumberOfPages()
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber
        doc.setFontSize(7)
        doc.setTextColor(148, 163, 184)
        doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" })
        doc.text(`${storedSchoolName} - Invigilation Schedule (CONFIDENTIAL)`, margin, pageHeight - 8)
      },
    })

    yPos = doc.lastAutoTable.finalY + 8
  })

  // Summary section
  if (yPos > pageHeight - 50) {
    doc.addPage()
    yPos = 14
  }

  // Staff workload summary
  const staffWorkload = {}
  assignments.forEach(a => {
    a.assignedStaff.forEach(s => {
      if (!staffWorkload[s.id]) staffWorkload[s.id] = { ...s, count: 0 }
      staffWorkload[s.id].count++
    })
  })

  const workloadData = Object.values(staffWorkload)
    .sort((a, b) => b.count - a.count)
    .map(s => [s.name, s.department || "-", s.phone || "-", s.email || "-", String(s.count)])

  if (workloadData.length > 0) {
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(209, 213, 219)

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 41, 59)
    doc.text("Staff Workload Summary", margin, yPos + 4)
    yPos += 10

    autoTable(doc, {
      startY: yPos,
      head: [["Staff Name", "Department", "Phone", "Email", "Sessions"]],
      body: workloadData,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [209, 213, 219],
        lineWidth: 0.2,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [107, 114, 128], // gray-500
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    })
  }

  const fileName = "invigilation-schedule.pdf"
  doc.save(fileName)
}

/**
 * Generates individual invigilator PDFs (one per staff member).
 * Each PDF shows only that staff member's assignments.
 *
 * @param {Array} assignments - Output of assignInvigilators()
 * @param {Object} staffMember - The specific staff member object
 */
export const generateStaffInvigilationPdf = (assignments, staffMember) => {
  const myAssignments = assignments.filter(a =>
    a.assignedStaff.some(s => s.id === staffMember.id)
  )

  if (myAssignments.length === 0) return

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  const storedSchoolName = localStorage.getItem("schoolName") || "ExamHub"
  const storedSemesterTitle = localStorage.getItem("semesterTitle") || ""

  // Header
  doc.setFillColor(15, 118, 110)
  doc.rect(0, 0, pageWidth, 40, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Invigilation Assignment", margin, 14)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(storedSemesterTitle || "Exam Invigilation", margin, 22)

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text(staffMember.name, margin, 34)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  if (staffMember.department) {
    doc.text(staffMember.department, margin + doc.getTextWidth(staffMember.name) + 4, 34)
  }

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(storedSchoolName, pageWidth - margin, 14, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`${myAssignments.length} session${myAssignments.length !== 1 ? "s" : ""} assigned`, pageWidth - margin, 22, { align: "right" })

  let yPos = 50

  // Sort by date then time
  const sorted = [...myAssignments].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.exam.startTime.localeCompare(b.exam.startTime)
  })

  const tableData = sorted.map(a => [
    formatDate(a.date),
    `${a.exam.startTime} - ${a.exam.endTime}`,
    a.exam.courseCode,
    a.exam.courseTitle,
    a.exam.venue || (a.exam.allocations ? a.exam.allocations.map(al => al.venueName).join(", ") : "TBD"),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [["Date", "Time", "Code", "Course", "Venue"]],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [209, 213, 219],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 253, 250],
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 28 },
      2: { cellWidth: 22, fontStyle: "bold" },
      3: { cellWidth: "auto" },
      4: { cellWidth: 30 },
    },
    didDrawPage: () => {
      const pageCount = doc.internal.getNumberOfPages()
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" })
      doc.text(`${storedSchoolName} - ${staffMember.name} Invigilation Schedule`, margin, pageHeight - 8)
    },
  })

  // Note at bottom
  yPos = doc.lastAutoTable.finalY + 10
  if (yPos < pageHeight - 30) {
    doc.setFillColor(254, 252, 232) // yellow-50
    doc.setDrawColor(253, 224, 71) // yellow-300
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 16, 2, 2, "FD")
    doc.setFontSize(8)
    doc.setTextColor(113, 63, 18) // yellow-900
    doc.setFont("helvetica", "bold")
    doc.text("Important:", margin + 4, yPos + 5)
    doc.setFont("helvetica", "normal")
    doc.text("Please arrive at your assigned venue at least 15 minutes before the exam start time.", margin + 4, yPos + 10)
  }

  const fileName = `invigilation-${staffMember.name.toLowerCase().replace(/\s+/g, "-")}.pdf`
  doc.save(fileName)
}
