import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

/**
 * Groups exams by date and sorts them chronologically.
 */
const groupByDateSorted = (exams) => {
  const grouped = {}
  exams.forEach(exam => {
    if (!grouped[exam.date]) grouped[exam.date] = []
    grouped[exam.date].push(exam)
  })

  // Sort dates chronologically
  const sortedDates = Object.keys(grouped).sort()
  sortedDates.forEach(date => {
    grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
  })

  return { sortedDates, grouped }
}

/**
 * Format a date string (YYYY-MM-DD) into a readable format.
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
 * Generates and downloads a PDF timetable from saved exam data.
 * @param {Array} exams - Array of exam objects
 * @param {string} title - Title for the PDF document
 */
export const generateExamPdf = (exams, title = "My Exam Timetable") => {
  if (!exams || exams.length === 0) return

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  // ── Header ──────────────────────────────────────────────
  // Blue header bar
  doc.setFillColor(79, 70, 229) // indigo-600
  doc.rect(0, 0, pageWidth, 36, "F")

  // Title - use semester title if set, otherwise use provided title
  const storedSemesterTitle = localStorage.getItem("semesterTitle")
  const displayTitle = storedSemesterTitle || title

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(displayTitle, margin, 16)

  // Subtitle
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const now = new Date()
  doc.text(
    `Generated on ${now.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })} • ${exams.length} exam${exams.length !== 1 ? "s" : ""}`,
    margin,
    26
  )

  // School branding
  const storedSchoolName = localStorage.getItem("schoolName") || "ExamHub"
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(storedSchoolName, pageWidth - margin, 16, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text("Exam Timetable", pageWidth - margin, 22, { align: "right" })

  let yPos = 44

  // ── Group by date ───────────────────────────────────────
  const { sortedDates, grouped } = groupByDateSorted(exams)

  sortedDates.forEach((date, dateIdx) => {
    const dateExams = grouped[date]

    // Check if we need a new page (header + at least 1 row)
    if (yPos > 250) {
      doc.addPage()
      yPos = 14
    }

    // Date header
    doc.setFillColor(239, 246, 255) // blue-50
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 9, 2, 2, "F")
    doc.setTextColor(30, 64, 175) // blue-800
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(formatDate(date), margin + 4, yPos + 6.5)

    // Exam count
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 116, 139) // gray-500
    const countText = `${dateExams.length} exam${dateExams.length !== 1 ? "s" : ""}`
    doc.text(countText, pageWidth - margin - 4, yPos + 6.5, { align: "right" })

    yPos += 13

    // Build venue display string (with allocations if available)
    const getVenueDisplay = (exam) => {
      if (exam.allocations && exam.allocations.length > 0) {
        return exam.allocations.map(a => {
          let s = a.venueName
          if (a.numStudents) s += ` (${a.numStudents})`
          if (a.indexStart && a.indexEnd) s += `\nIndex: ${a.indexStart} - ${a.indexEnd}`
          return s
        }).join("\n")
      }
      return exam.venue || "TBD"
    }

    // Exam table for this date
    const tableData = dateExams.map(exam => [
      exam.courseCode,
      exam.courseTitle,
      exam.programme,
      `Level ${exam.level}`,
      `${exam.startTime} - ${exam.endTime}`,
      getVenueDisplay(exam),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["Code", "Course Title", "Programme", "Level", "Time", "Venue / Allocation"]],
      body: tableData,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [226, 232, 240], // gray-200
        lineWidth: 0.2,
        textColor: [30, 41, 59], // gray-800
      },
      headStyles: {
        fillColor: [99, 102, 241], // indigo-500
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // gray-50
      },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: "bold" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 28 },
        3: { cellWidth: 18 },
        4: { cellWidth: 28 },
        5: { cellWidth: 38 },
      },
      didDrawPage: () => {
        // Footer on each page
        const pageCount = doc.internal.getNumberOfPages()
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber
        doc.setFontSize(7)
        doc.setTextColor(148, 163, 184) // gray-400
        doc.text(
          `Page ${currentPage} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        )
        const footerSchoolName = localStorage.getItem("schoolName") || "ExamHub"
        doc.text(
          `${footerSchoolName} - Exam Timetable`,
          margin,
          doc.internal.pageSize.getHeight() - 8
        )
      },
    })

    yPos = doc.lastAutoTable.finalY + 8
  })

  // ── Summary section ─────────────────────────────────────
  if (yPos > 240) {
    doc.addPage()
    yPos = 14
  }

  // Summary box
  doc.setFillColor(248, 250, 252) // gray-50
  doc.setDrawColor(226, 232, 240) // gray-200
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 22, 2, 2, "FD")

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(30, 41, 59)
  doc.text("Summary", margin + 4, yPos + 6)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105) // gray-600

  const uniqueProgrammes = [...new Set(exams.map(e => e.programme))]
  const uniqueVenues = [...new Set(exams.map(e => e.venue))]

  const summaryItems = [
    `Total Exams: ${exams.length}`,
    `Exam Days: ${sortedDates.length}`,
    `Programmes: ${uniqueProgrammes.join(", ")}`,
    `Venues: ${uniqueVenues.join(", ")}`,
  ]

  doc.text(summaryItems[0], margin + 4, yPos + 12)
  doc.text(summaryItems[1], margin + 50, yPos + 12)
  doc.text(summaryItems[2], margin + 4, yPos + 18)

  // Download
  const fileName = title.toLowerCase().replace(/\s+/g, "-") + ".pdf"
  doc.save(fileName)
}
