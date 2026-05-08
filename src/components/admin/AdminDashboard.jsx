import { useState } from "react"
import { Plus, Edit, Trash2, LogOut, Calendar, Clock, MapPin, BookOpen, Users, Share2, AlertTriangle, AlertCircle, Building, GraduationCap, List, LayoutGrid, Settings, Check, Wand2, Upload, UserPlus, FileText } from "lucide-react"
import Button from "../ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"
import ExamForm from "./ExamForm"
import CalendarView from "./CalendarView"
import VenueManager from "./VenueManager"
import ProgrammeManager from "./ProgrammeManager"
import SetupWizard from "./SetupWizard"
import StaffManager from "./StaffManager"
import InvigilationManager from "./InvigilationManager"
import OnboardingChecklist from "./OnboardingChecklist"
import { groupByDate } from "../../lib/utils"

const AdminDashboard = ({
  onLogout, exams, onSaveExam, onDeleteExam, onUpdateExam,
  venues, onAddVenue, onUpdateVenue, onDeleteVenue,
  programmesList, onAddProgramme, onUpdateProgramme, onDeleteProgramme,
  staff, onAddStaff, onUpdateStaff, onDeleteStaff,
  schoolName, onUpdateSchoolName,
  semesterTitle, onUpdateSemesterTitle, onBulkImport
}) => {
  const [showForm, setShowForm] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [prefillData, setPrefillData] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProgramme, setSelectedProgramme] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [activeTab, setActiveTab] = useState("exams")
  const [examViewMode, setExamViewMode] = useState("calendar") // "calendar" | "list"
  const [editingSchoolName, setEditingSchoolName] = useState(schoolName || "")
  const [schoolNameSaved, setSchoolNameSaved] = useState(false)
  const [editingSemesterTitle, setEditingSemesterTitle] = useState(semesterTitle || "")
  const [semesterTitleSaved, setSemesterTitleSaved] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  const programmes = [...new Set(exams.map(exam => exam.programme))]
  const programmeNames = programmesList.map(p => typeof p === "string" ? p : p.name)
  const levels = [...new Set(exams.map(exam => exam.level))]

  const filteredExams = exams.filter(exam => {
    const matchesSearch =
      exam.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.programme.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProgramme = !selectedProgramme || exam.programme === selectedProgramme
    const matchesLevel = !selectedLevel || exam.level === selectedLevel

    return matchesSearch && matchesProgramme && matchesLevel
  })

  const groupedExams = groupByDate(filteredExams)

  // Conflict detection
  const detectConflicts = () => {
    const conflicts = []
    const warnings = []

    const examsByDate = {}
    exams.forEach(exam => {
      if (!examsByDate[exam.date]) examsByDate[exam.date] = []
      examsByDate[exam.date].push(exam)
    })

    Object.entries(examsByDate).forEach(([date, dateExams]) => {
      if (dateExams.length <= 1) return

      for (let i = 0; i < dateExams.length; i++) {
        for (let j = i + 1; j < dateExams.length; j++) {
          const exam1 = dateExams[i]
          const exam2 = dateExams[j]

          if (exam1.venue === exam2.venue) {
            const start1 = exam1.startTime
            const end1 = exam1.endTime
            const start2 = exam2.startTime
            const end2 = exam2.endTime

            if ((start1 < end2 && end1 > start2) || (start2 < end1 && end2 > start1)) {
              conflicts.push({
                type: "time",
                date,
                message: `Time overlap: "${exam1.venue}" on ${new Date(date).toLocaleDateString()}`,
                exams: [exam1, exam2]
              })
            }
          }
        }
      }

      const programmeCounts = {}
      dateExams.forEach(exam => {
        programmeCounts[exam.programme] = (programmeCounts[exam.programme] || 0) + 1
      })
      Object.entries(programmeCounts).forEach(([programme, count]) => {
        if (count >= 4) {
          warnings.push({
            type: "programme", date,
            message: `Programme "${programme}" has ${count} exams on ${new Date(date).toLocaleDateString()}`,
            exams: dateExams.filter(exam => exam.programme === programme)
          })
        }
      })
    })

    return { conflicts, warnings }
  }

  const { conflicts, warnings } = detectConflicts()

  const handleAddExam = (prefill = null) => {
    setEditingExam(null)
    setPrefillData(prefill)
    setShowForm(true)
  }

  const handleEditExam = (exam) => {
    setEditingExam(exam)
    setPrefillData(null)
    setShowForm(true)
  }

  const handleDeleteExam = (examId) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      onDeleteExam(examId)
    }
  }

  const handleSaveExam = (examData) => {
    if (editingExam) {
      onUpdateExam(examData)
    } else {
      onSaveExam(examData)
    }
    setShowForm(false)
    setEditingExam(null)
    setPrefillData(null)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingExam(null)
    setPrefillData(null)
  }

  const handleWizardComplete = ({ exams: generatedExams, semesterTitle: wizardTitle, replace }) => {
    onBulkImport(generatedExams)
    if (wizardTitle) {
      onUpdateSemesterTitle(wizardTitle)
      setEditingSemesterTitle(wizardTitle)
    }
    setShowWizard(false)
  }

  const handleShareTimetable = () => {
    const url = window.location.origin
    navigator.clipboard.writeText(url)
    alert("Timetable URL copied to clipboard! Students can access it at: " + url)
  }

  const totalExams = exams.length
  const totalDays = groupedExams.size
  const totalProgrammes = programmesList.length
  const totalVenues = venues.length
  const totalStaff = staff ? staff.length : 0

  const tabs = [
    { id: "exams", label: "Exams", icon: BookOpen },
    { id: "venues", label: "Venues", icon: Building },
    { id: "programmes", label: "Programmes", icon: GraduationCap },
    { id: "staff", label: "Staff", icon: UserPlus },
    { id: "invigilation", label: "Invigilation", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  // Build prefilled exam data for the form (from calendar click)
  const getExamForForm = () => {
    if (editingExam) return editingExam
    if (prefillData) return prefillData
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{schoolName || "Admin Dashboard"}</h1>
                <p className="text-indigo-100 text-lg">{semesterTitle || "Exam Timetable Management"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleShareTimetable}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30">
                <Share2 className="h-4 w-4 mr-2" /> Share Timetable
              </Button>
              <Button variant="outline" onClick={onLogout}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Onboarding checklist — hidden once all steps complete */}
        <OnboardingChecklist
          venues={venues}
          programmes={programmesList}
          schoolName={schoolName}
          onNavigate={setActiveTab}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab("exams")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full"><BookOpen className="h-6 w-6" /></div>
                <div>
                  <p className="text-blue-100 text-sm">Total Exams</p>
                  <p className="text-2xl font-bold">{totalExams}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full"><Calendar className="h-6 w-6" /></div>
                <div>
                  <p className="text-green-100 text-sm">Exam Days</p>
                  <p className="text-2xl font-bold">{totalDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab("programmes")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full"><Users className="h-6 w-6" /></div>
                <div>
                  <p className="text-purple-100 text-sm">Programmes</p>
                  <p className="text-2xl font-bold">{totalProgrammes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab("venues")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full"><MapPin className="h-6 w-6" /></div>
                <div>
                  <p className="text-orange-100 text-sm">Venues</p>
                  <p className="text-2xl font-bold">{totalVenues}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="flex border-b">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}>
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "exams" && (
          <>
            {/* Conflict Detection */}
            {(conflicts.length > 0 || warnings.length > 0) && (
              <div className="mb-8">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <CardTitle className="text-xl text-gray-900">
                        Schedule Conflicts & Warnings
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {conflicts.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Critical Conflicts ({conflicts.length})
                          </h4>
                          <div className="space-y-3">
                            {conflicts.map((conflict, index) => (
                              <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-red-800 mb-2">{conflict.message}</p>
                                    <div className="space-y-2">
                                      {conflict.exams.map((exam, idx) => (
                                        <div key={idx} className="text-sm text-red-700 bg-red-100 p-2 rounded flex items-center gap-2">
                                          <Clock className="h-4 w-4" />
                                          <span className="font-medium">{exam.courseCode}</span>
                                          <span>•</span>
                                          <span>{exam.startTime} - {exam.endTime}</span>
                                          <span>•</span>
                                          <MapPin className="h-3 w-3" />
                                          <span>{exam.venue}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <Button variant="outline" size="sm" onClick={() => handleEditExam(conflict.exams[0])}
                                    className="text-red-600 border-red-200 hover:bg-red-50">
                                    <Edit className="h-4 w-4 mr-1" /> Fix
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {warnings.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Warnings ({warnings.length})
                          </h4>
                          <div className="space-y-3">
                            {warnings.map((warning, index) => (
                              <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="font-medium text-yellow-800 mb-2">{warning.message}</p>
                                <div className="space-y-2">
                                  {warning.exams.map((exam, idx) => (
                                    <div key={idx} className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      <span className="font-medium">{exam.courseCode}</span>
                                      <span>•</span>
                                      <span>{exam.startTime} - {exam.endTime}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Controls bar with view toggle */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* View mode toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setExamViewMode("calendar")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        examViewMode === "calendar"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Calendar
                    </button>
                    <button
                      onClick={() => setExamViewMode("list")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        examViewMode === "list"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <List className="h-4 w-4" />
                      List
                    </button>
                  </div>

                  {/* Search - only in list mode */}
                  {examViewMode === "list" && (
                    <>
                      <input
                        type="text"
                        placeholder="Search exams..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none w-64"
                      />
                      <select value={selectedProgramme} onChange={(e) => setSelectedProgramme(e.target.value)}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none">
                        <option value="">All Programmes</option>
                        {programmes.map(prog => <option key={prog} value={prog}>{prog}</option>)}
                      </select>
                      <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none">
                        <option value="">All Levels</option>
                        {levels.map(level => <option key={level} value={level}>Level {level}</option>)}
                      </select>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={() => setShowWizard(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-2">
                    <Wand2 className="h-4 w-4 mr-2" /> Setup Wizard
                  </Button>
                  <Button onClick={() => handleAddExam()}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2">
                    <Plus className="h-4 w-4 mr-2" /> Add Exam
                  </Button>
                </div>
              </div>
            </div>

            {/* Calendar View */}
            {examViewMode === "calendar" && (
              <CalendarView
                exams={exams}
                onAddExam={(prefill) => handleAddExam(prefill)}
                onEditExam={handleEditExam}
                programmes={programmeNames}
              />
            )}

            {/* List View */}
            {examViewMode === "list" && (
              <>
                <div className="space-y-6">
                  {Array.from(groupedExams.entries()).map(([date, dateExams]) => (
                    <Card key={date} className="shadow-lg border-0">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl text-gray-900">
                              {new Date(date).toLocaleDateString('en-US', {
                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                              })}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              {dateExams.length} exam{dateExams.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {dateExams.map((exam) => (
                            <div key={exam.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2">
                                  <h3 className="font-semibold text-gray-900">{exam.courseCode} - {exam.courseTitle}</h3>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Level {exam.level}</span>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>{exam.startTime} - {exam.endTime}</span></div>
                                  <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span>{exam.programme}</span></div>
                                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>{exam.venue}</span></div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditExam(exam)}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                  <Edit className="h-4 w-4 mr-1" /> Edit
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteExam(exam.id)}
                                  className="text-red-600 border-red-200 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredExams.length === 0 && (
                  <div className="text-center py-16">
                    <div className="p-6 bg-blue-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No exams found</h3>
                    <p className="text-gray-600 mb-6">
                      {exams.length === 0
                        ? "Start by adding your first exam using the 'Add Exam' button above."
                        : "Try adjusting your search criteria to see more results."}
                    </p>
                    {exams.length === 0 && (
                      <Button onClick={() => handleAddExam()}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Add Your First Exam
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "venues" && (
          <VenueManager venues={venues} onAdd={onAddVenue} onUpdate={onUpdateVenue} onDelete={onDeleteVenue} exams={exams} />
        )}

        {activeTab === "programmes" && (
          <ProgrammeManager programmes={programmesList} onAdd={onAddProgramme} onUpdate={onUpdateProgramme} onDelete={onDeleteProgramme} exams={exams} />
        )}

        {activeTab === "staff" && (
          <StaffManager staff={staff} onAdd={onAddStaff} onUpdate={onUpdateStaff} onDelete={onDeleteStaff} />
        )}

        {activeTab === "invigilation" && (
          <InvigilationManager exams={exams} staff={staff} />
        )}

        {activeTab === "settings" && (
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Settings className="h-5 w-5 text-indigo-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">School Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="max-w-lg space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School / Institution Name
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    This name appears on the student timetable page and in PDF downloads.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={editingSchoolName}
                      onChange={(e) => {
                        setEditingSchoolName(e.target.value)
                        setSchoolNameSaved(false)
                      }}
                      placeholder="e.g. University of Ghana"
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-gray-900"
                    />
                    <Button
                      onClick={() => {
                        onUpdateSchoolName(editingSchoolName.trim())
                        setSchoolNameSaved(true)
                        setTimeout(() => setSchoolNameSaved(false), 2000)
                      }}
                      disabled={!editingSchoolName.trim()}
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6"
                    >
                      {schoolNameSaved ? (
                        <><Check className="h-4 w-4 mr-2" /> Saved</>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester / Exam Title
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    This title is displayed as the main heading on the student timetable and PDF exports.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={editingSemesterTitle}
                      onChange={(e) => {
                        setEditingSemesterTitle(e.target.value)
                        setSemesterTitleSaved(false)
                      }}
                      placeholder="e.g. Second Semester 2026 Exam Timetable"
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-gray-900"
                    />
                    <Button
                      onClick={() => {
                        onUpdateSemesterTitle(editingSemesterTitle.trim())
                        setSemesterTitleSaved(true)
                        setTimeout(() => setSemesterTitleSaved(false), 2000)
                      }}
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6"
                    >
                      {semesterTitleSaved ? (
                        <><Check className="h-4 w-4 mr-2" /> Saved</>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Exam Form Modal */}
      {showForm && (
        <ExamForm
          exam={getExamForForm()}
          onSave={handleSaveExam}
          onCancel={handleCancelForm}
          isEditing={!!editingExam}
          existingExams={exams}
          venues={venues}
          programmes={programmesList}
        />
      )}

      {/* Setup Wizard Modal */}
      {showWizard && (
        <SetupWizard
          venues={venues}
          programmes={programmesList}
          existingExams={exams}
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  )
}

export default AdminDashboard
