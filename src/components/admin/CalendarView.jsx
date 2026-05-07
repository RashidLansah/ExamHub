import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users } from "lucide-react"
import Button from "../ui/Button"

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7am to 9pm
const HOUR_HEIGHT = 64 // px per hour
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

// Color palette for programmes
const PROGRAMME_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800", accent: "#3b82f6" },
  { bg: "bg-green-100", border: "border-green-300", text: "text-green-800", accent: "#22c55e" },
  { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-800", accent: "#a855f7" },
  { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-800", accent: "#f97316" },
  { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-800", accent: "#ec4899" },
  { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-800", accent: "#14b8a6" },
  { bg: "bg-red-100", border: "border-red-300", text: "text-red-800", accent: "#ef4444" },
  { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-800", accent: "#6366f1" },
  { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-800", accent: "#f59e0b" },
  { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-800", accent: "#06b6d4" },
]

const getColorForProgramme = (programme, allProgrammes) => {
  const idx = allProgrammes.indexOf(programme)
  return PROGRAMME_COLORS[idx % PROGRAMME_COLORS.length]
}

const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

const formatHour = (hour) => {
  if (hour === 0) return "12 AM"
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return "12 PM"
  return `${hour - 12} PM`
}

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate()

const getWeekDates = (date) => {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay() + 1) // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

const CalendarView = ({ exams, onAddExam, onEditExam, programmes }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState("week") // "week" | "day"
  const [hoveredExam, setHoveredExam] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const allProgrammes = useMemo(() => {
    const fromExams = exams.map(e => e.programme)
    const merged = [...new Set([...programmes, ...fromExams])]
    return merged
  }, [exams, programmes])

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])
  const visibleDates = viewMode === "week" ? weekDates : [currentDate]

  const examsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0]
    return exams.filter(e => e.date === dateStr)
  }

  const navigate = (direction) => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + direction * 7)
    } else {
      newDate.setDate(newDate.getDate() + direction)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => setCurrentDate(new Date())

  const getExamPosition = (exam) => {
    const startMinutes = timeToMinutes(exam.startTime)
    const endMinutes = timeToMinutes(exam.endTime)
    const startOffset = startMinutes - 7 * 60 // offset from 7am
    const duration = endMinutes - startMinutes

    return {
      top: (startOffset / 60) * HOUR_HEIGHT,
      height: Math.max((duration / 60) * HOUR_HEIGHT - 2, 20),
    }
  }

  // Detect overlapping exams for column layout
  const getLayoutForDate = (date) => {
    const dayExams = examsForDate(date)
    if (dayExams.length === 0) return []

    // Sort by start time
    const sorted = [...dayExams].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

    // Assign columns for overlapping events
    const columns = []
    const assigned = new Map()

    sorted.forEach(exam => {
      const start = timeToMinutes(exam.startTime)
      const end = timeToMinutes(exam.endTime)

      let col = 0
      for (const [id, { end: otherEnd, col: otherCol }] of assigned) {
        if (start < otherEnd && otherCol === col) {
          col++
        }
      }

      assigned.set(exam.id, { start, end, col })
      if (col >= columns.length) columns.push(0)
      columns[col]++
    })

    const maxCol = Math.max(...[...assigned.values()].map(v => v.col)) + 1

    return sorted.map(exam => {
      const { col } = assigned.get(exam.id)
      return {
        exam,
        col,
        totalCols: maxCol,
      }
    })
  }

  const handleExamHover = (exam, e) => {
    setHoveredExam(exam)
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  const handleCellClick = (date, hour) => {
    const dateStr = date.toISOString().split("T")[0]
    const startTime = `${String(hour).padStart(2, "0")}:00`
    const endHour = Math.min(hour + 2, 21)
    const endTime = `${String(endHour).padStart(2, "0")}:00`
    onAddExam({ date: dateStr, startTime, endTime })
  }

  // Header date range string
  const headerLabel = useMemo(() => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    }
    const first = weekDates[0]
    const last = weekDates[6]
    if (first.getMonth() === last.getMonth()) {
      return `${MONTHS[first.getMonth()]} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`
    }
    return `${MONTHS[first.getMonth()]} ${first.getDate()} – ${MONTHS[last.getMonth()]} ${last.getDate()}, ${first.getFullYear()}`
  }, [currentDate, weekDates, viewMode])

  const today = new Date()

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-gray-700 border-gray-300"
          >
            Today
          </Button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <h2 className="text-xl font-semibold text-gray-900">{headerLabel}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "day"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "week"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex overflow-auto" style={{ maxHeight: "calc(100vh - 380px)" }}>
        {/* Time gutter */}
        <div className="flex-shrink-0 w-16 border-r bg-gray-50">
          {/* Spacer for column headers */}
          <div className="h-16 border-b" />
          {HOURS.map(hour => (
            <div
              key={hour}
              className="relative border-b border-gray-100"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="absolute -top-2.5 right-2 text-xs text-gray-400 font-medium">
                {formatHour(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex flex-1">
          {visibleDates.map((date, dateIdx) => {
            const isToday = isSameDay(date, today)
            const layout = getLayoutForDate(date)

            return (
              <div
                key={dateIdx}
                className={`flex-1 min-w-0 ${dateIdx < visibleDates.length - 1 ? "border-r" : ""}`}
              >
                {/* Day header */}
                <div className={`h-16 flex flex-col items-center justify-center border-b sticky top-0 z-10 ${isToday ? "bg-blue-50" : "bg-white"}`}>
                  <span className={`text-xs font-medium uppercase ${isToday ? "text-blue-600" : "text-gray-500"}`}>
                    {DAYS_OF_WEEK[date.getDay()]}
                  </span>
                  <span
                    className={`mt-0.5 text-lg font-semibold w-9 h-9 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-blue-600 text-white"
                        : "text-gray-900"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>

                {/* Time slots */}
                <div className="relative">
                  {HOURS.map(hour => (
                    <div
                      key={hour}
                      className="border-b border-gray-100 hover:bg-blue-50/30 cursor-pointer transition-colors group"
                      style={{ height: HOUR_HEIGHT }}
                      onClick={() => handleCellClick(date, hour)}
                    >
                      {/* Add exam hint on hover */}
                      <div className="hidden group-hover:flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-blue-400 flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          Add exam
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Current time indicator */}
                  {isToday && (() => {
                    const now = new Date()
                    const currentMinutes = now.getHours() * 60 + now.getMinutes()
                    const offset = currentMinutes - 7 * 60
                    if (offset < 0 || offset > 14 * 60) return null
                    return (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ top: (offset / 60) * HOUR_HEIGHT }}
                      >
                        <div className="flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                          <div className="flex-1 h-0.5 bg-red-500" />
                        </div>
                      </div>
                    )
                  })()}

                  {/* Exam blocks */}
                  {layout.map(({ exam, col, totalCols }) => {
                    const pos = getExamPosition(exam)
                    const color = getColorForProgramme(exam.programme, allProgrammes)
                    const widthPercent = 100 / totalCols
                    const leftPercent = col * widthPercent

                    return (
                      <div
                        key={exam.id}
                        className={`absolute rounded-lg ${color.bg} ${color.border} border-l-[3px] cursor-pointer hover:shadow-md transition-shadow overflow-hidden group/exam`}
                        style={{
                          top: pos.top,
                          height: pos.height,
                          left: `calc(${leftPercent}% + 2px)`,
                          width: `calc(${widthPercent}% - 4px)`,
                          zIndex: 10,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditExam(exam)
                        }}
                        onMouseEnter={(e) => handleExamHover(exam, e)}
                        onMouseLeave={() => setHoveredExam(null)}
                      >
                        <div className="px-2 py-1 h-full overflow-hidden">
                          <p className={`text-xs font-bold ${color.text} truncate leading-tight`}>
                            {exam.courseCode}
                          </p>
                          {pos.height > 40 && (
                            <p className={`text-xs ${color.text} opacity-75 truncate leading-tight mt-0.5`}>
                              {exam.courseTitle}
                            </p>
                          )}
                          {pos.height > 60 && (
                            <p className={`text-xs ${color.text} opacity-60 truncate leading-tight mt-0.5`}>
                              {exam.startTime} – {exam.endTime}
                            </p>
                          )}
                          {pos.height > 80 && (
                            <p className={`text-xs ${color.text} opacity-60 truncate leading-tight mt-0.5 flex items-center gap-1`}>
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              {exam.venue}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredExam && (
        <div
          className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl p-3 pointer-events-none max-w-xs"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 10,
          }}
        >
          <p className="font-bold text-sm">{hoveredExam.courseCode} – {hoveredExam.courseTitle}</p>
          <div className="mt-1.5 space-y-1 text-xs text-gray-300">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{hoveredExam.startTime} – {hoveredExam.endTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span>{hoveredExam.venue}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              <span>{hoveredExam.programme} • Level {hoveredExam.level}</span>
            </div>
          </div>
        </div>
      )}

      {/* Programme Legend */}
      <div className="px-6 py-3 border-t bg-gray-50 flex flex-wrap gap-3">
        {allProgrammes.map((prog) => {
          const color = getColorForProgramme(prog, allProgrammes)
          return (
            <div key={prog} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: color.accent }}
              />
              <span className="text-xs text-gray-600">{prog}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarView
