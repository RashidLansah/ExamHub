import { useState, useEffect } from "react"
import Header from "../components/Header"
import Filters from "../components/Filters"
import DaySection from "../components/DaySection"
import EmptyState from "../components/EmptyState"
import Sheet from "../components/ui/Sheet"
import { Card, CardContent } from "../components/ui/Card"
import { filterExams } from "../lib/filters"
import { groupByDate } from "../lib/utils"
import examsData from "../data/exams.json"
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react"

const Home = () => {
  const [exams, setExams] = useState(examsData)
  const [filteredExams, setFilteredExams] = useState(examsData)
  const [savedExams, setSavedExams] = useState([])
  const [showMyExams, setShowMyExams] = useState(false)

  // Load saved exams from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("myExams")
    if (saved) {
      try {
        setSavedExams(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading saved exams:", error)
        setSavedExams([])
      }
    }
  }, [])

  // Load exam data from localStorage or use default data
  useEffect(() => {
    const savedData = localStorage.getItem("timetableData")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setExams(parsedData)
        setFilteredExams(parsedData)
      } catch (error) {
        console.error("Error loading timetable data:", error)
        setExams(examsData)
        setFilteredExams(examsData)
      }
    }
  }, [])

  // Save exams to localStorage whenever savedExams changes
  useEffect(() => {
    localStorage.setItem("myExams", JSON.stringify(savedExams))
  }, [savedExams])

  const handleFiltersChange = (filters) => {
    const filtered = filterExams(exams, filters)
    setFilteredExams(filtered)
  }

  const handleSaveToggle = (examId, isSaved) => {
    if (isSaved) {
      setSavedExams(prev => [...prev, examId])
    } else {
      setSavedExams(prev => prev.filter(id => id !== examId))
    }
  }

  const handleResetFilters = () => {
    // This will trigger the Filters component to reset
    setFilteredExams(exams)
  }

  const groupedExams = groupByDate(filteredExams)
  const savedExamsData = exams.filter(exam => savedExams.includes(exam.id))

  // Calculate summary statistics
  const totalExams = filteredExams.length
  const totalDays = groupedExams.size
  const totalProgrammes = new Set(filteredExams.map(exam => exam.programme)).size
  const totalVenues = new Set(filteredExams.map(exam => exam.venue)).size

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header 
        onViewMyExams={() => setShowMyExams(true)}
        savedExamsCount={savedExams.length}
      />
      
      <Filters 
        exams={exams}
        onFiltersChange={handleFiltersChange}
      />
      
      <main className="max-w-6xl mx-auto p-6">
        {/* Summary Statistics */}
        {filteredExams.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <BookOpen className="h-6 w-6" />
                    </div>
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
                    <div className="p-3 bg-white/20 rounded-full">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-green-100 text-sm">Exam Days</p>
                      <p className="text-2xl font-bold">{totalDays}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-purple-100 text-sm">Venues</p>
                      <p className="text-2xl font-bold">{totalVenues}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-orange-100 text-sm">Programmes</p>
                      <p className="text-2xl font-bold">{totalProgrammes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Exam Results */}
        {filteredExams.length === 0 ? (
          <EmptyState onResetFilters={handleResetFilters} />
        ) : (
          <div>
            {Array.from(groupedExams.entries()).map(([date, dateExams]) => (
              <DaySection
                key={date}
                date={date}
                exams={dateExams}
                onSaveToggle={handleSaveToggle}
                savedExams={savedExams}
              />
            ))}
          </div>
        )}
      </main>

      {/* My Exams Sheet */}
      <Sheet
        open={showMyExams}
        onOpenChange={setShowMyExams}
        side="right"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Saved Exams ({savedExamsData.length})
            </h3>
            {savedExamsData.length > 0 && (
              <button
                onClick={() => setSavedExams([])}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove All
              </button>
            )}
          </div>
          
          {savedExamsData.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <div className="p-4 bg-yellow-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="font-medium mb-2">No saved exams yet</p>
              <p className="text-sm">Click the star icon on any exam to save it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedExamsData.map((exam) => (
                <Card key={exam.id} className="p-4 hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-900 mb-1">
                          {exam.courseCode} - {exam.courseTitle}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          {exam.startTime} • {exam.venue}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{exam.programme}</span>
                          <span>•</span>
                          <span>Level {exam.level}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSaveToggle(exam.id, false)}
                        className="ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        aria-label="Remove from saved exams"
                      >
                        ×
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Sheet>
    </div>
  )
}

export default Home 