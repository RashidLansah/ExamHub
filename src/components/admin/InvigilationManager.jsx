import { useState, useMemo } from "react"
import { FileText, Shuffle, Download, Users, Calendar, Clock, MapPin, ChevronDown, ChevronRight, AlertCircle, CheckCircle } from "lucide-react"
import Button from "../ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"
import { assignInvigilators, generateInvigilationMasterPdf, generateStaffInvigilationPdf } from "../../lib/generateInvigilationPdf"

const InvigilationManager = ({ exams, staff }) => {
  const [assignments, setAssignments] = useState([])
  const [expandedDates, setExpandedDates] = useState({})
  const [hasGenerated, setHasGenerated] = useState(false)

  const handleGenerate = () => {
    const newAssignments = assignInvigilators(exams, staff)
    setAssignments(newAssignments)
    setHasGenerated(true)
    // Auto-expand all dates
    const dates = {}
    newAssignments.forEach(a => { dates[a.date] = true })
    setExpandedDates(dates)
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  const handleDownloadMasterPdf = () => {
    generateInvigilationMasterPdf(assignments)
  }

  const handleDownloadStaffPdf = (staffMember) => {
    generateStaffInvigilationPdf(assignments, staffMember)
  }

  const handleDownloadAllStaffPdfs = () => {
    staff.forEach(s => {
      const hasAssignments = assignments.some(a =>
        a.assignedStaff.some(as => as.id === s.id)
      )
      if (hasAssignments) {
        setTimeout(() => generateStaffInvigilationPdf(assignments, s), 200)
      }
    })
  }

  const toggleDate = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }))
  }

  // Group assignments by date
  const assignmentsByDate = useMemo(() => {
    const byDate = {}
    assignments.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = []
      byDate[a.date].push(a)
    })
    return byDate
  }, [assignments])

  const sortedDates = useMemo(() =>
    Object.keys(assignmentsByDate).sort(),
    [assignmentsByDate]
  )

  // Staff workload summary
  const staffWorkload = useMemo(() => {
    const workload = {}
    staff.forEach(s => { workload[s.id] = { ...s, count: 0 } })
    assignments.forEach(a => {
      a.assignedStaff.forEach(s => {
        if (workload[s.id]) workload[s.id].count++
      })
    })
    return Object.values(workload).sort((a, b) => b.count - a.count)
  }, [assignments, staff])

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T12:00:00")
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Check prerequisites
  const hasExams = exams && exams.length > 0
  const hasStaff = staff && staff.length > 0
  const canGenerate = hasExams && hasStaff

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <FileText className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Invigilation Management</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Randomly assign staff to exam sessions and generate invigilation schedules
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Prerequisites check */}
          {!canGenerate && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Prerequisites needed</p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-700">
                    {!hasExams && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        Add exams to the timetable first (use Setup Wizard or manual entry)
                      </li>
                    )}
                    {!hasStaff && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        Add staff members in the Staff tab
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-6 disabled:opacity-50"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              {hasGenerated ? "Re-generate Assignments" : "Generate Random Assignments"}
            </Button>

            {hasGenerated && assignments.length > 0 && (
              <>
                <Button
                  onClick={handleDownloadMasterPdf}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Master Schedule (PDF)
                </Button>
                <Button
                  onClick={handleDownloadAllStaffPdfs}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Download All Staff PDFs
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          {hasGenerated && assignments.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-teal-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-teal-700">{assignments.length}</p>
                <p className="text-sm text-teal-600">Total Sessions</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{sortedDates.length}</p>
                <p className="text-sm text-blue-600">Exam Days</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-700">{staff.length}</p>
                <p className="text-sm text-purple-600">Staff Members</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">
                  {staffWorkload.length > 0 ? Math.round(assignments.length / staffWorkload.filter(s => s.count > 0).length * 10) / 10 : 0}
                </p>
                <p className="text-sm text-green-600">Avg Sessions/Staff</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Preview */}
      {hasGenerated && assignments.length > 0 && (
        <>
          {/* Schedule by Date */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Assignment Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {sortedDates.map(date => (
                <div key={date} className="border-b last:border-b-0">
                  <button
                    onClick={() => toggleDate(date)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedDates[date] ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900">{formatDate(date)}</span>
                      <span className="text-sm text-gray-500">
                        {assignmentsByDate[date].length} exam{assignmentsByDate[date].length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </button>

                  {expandedDates[date] && (
                    <div className="px-4 pb-4">
                      <div className="space-y-3">
                        {assignmentsByDate[date]
                          .sort((a, b) => a.exam.startTime.localeCompare(b.exam.startTime))
                          .map((assignment, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-semibold text-gray-900 text-sm">{assignment.exam.courseCode}</span>
                                <span className="text-sm text-gray-600">{assignment.exam.courseTitle}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {assignment.exam.startTime} - {assignment.exam.endTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {assignment.exam.venue || "TBD"}
                                </span>
                                <span>{assignment.exam.programme} • Level {assignment.exam.level}</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {assignment.assignedStaff.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {assignment.assignedStaff.map(s => (
                                    <span key={s.id} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full font-medium">
                                      <Users className="h-3 w-3" />
                                      {s.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-red-500">Unassigned</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Staff Workload */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-emerald-50 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Staff Workload</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {staffWorkload.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.department || "No department"}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        s.count === 0
                          ? "bg-gray-100 text-gray-500"
                          : s.count <= 3
                          ? "bg-green-100 text-green-700"
                          : s.count <= 6
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {s.count} session{s.count !== 1 ? "s" : ""}
                      </span>
                      {s.count > 0 && (
                        <button
                          onClick={() => handleDownloadStaffPdf(s)}
                          className="p-1 text-gray-400 hover:text-teal-600 transition-colors"
                          title={`Download PDF for ${s.name}`}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default InvigilationManager
