import { useState, useEffect } from "react"
import { Printer, BookOpen, GraduationCap } from "lucide-react"
import Button from "./ui/Button"

const Header = ({ onViewMyExams, savedExamsCount }) => {
  const [schoolName, setSchoolName] = useState("ExamHub")
  const [semesterTitle, setSemesterTitle] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("schoolName")
    if (saved) setSchoolName(saved)
    const savedTitle = localStorage.getItem("semesterTitle")
    if (savedTitle) setSemesterTitle(savedTitle)
  }, [])

  return (
    <header
      className="bg-gradient-to-r from-blue-700 to-blue-900 text-white border-b print:hidden shadow-lg"
      role="banner"
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/15 rounded-2xl" aria-hidden="true">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{schoolName}</h1>
              <p className="text-blue-200 text-sm">{semesterTitle || "Exam Timetable"}</p>
            </div>
          </div>

          <nav className="flex items-center gap-2" role="toolbar" aria-label="Primary navigation">
            <Button
              variant="outline"
              onClick={onViewMyExams}
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 rounded-xl"
              ariaLabel={`View my saved exams${savedExamsCount > 0 ? `, ${savedExamsCount} saved` : ""}`}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              My Exams
              {savedExamsCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-amber-400 text-blue-900 rounded-full font-bold">
                  {savedExamsCount}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 rounded-xl"
              ariaLabel="Print exam timetable"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header 