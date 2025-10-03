import { Printer, BookOpen, GraduationCap, Settings } from "lucide-react"
import Button from "./ui/Button"

const Header = ({ onViewMyExams, savedExamsCount }) => {
  const handlePrint = () => {
    window.print()
  }

  const handleAdminAccess = () => {
    // Navigate to admin panel
    window.location.href = '/admin'
  }

  return (
    <header 
      className="bg-gradient-to-r from-blue-600 to-blue-800 text-white border-b print:hidden shadow-lg"
      role="banner"
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full" aria-hidden="true">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                ExamHub
              </h1>
              <p className="text-blue-100 text-sm">
                University Exam Management • Academic Excellence
              </p>
            </div>
          </div>
          
          <nav className="flex items-center gap-3" role="toolbar" aria-label="Primary navigation">
            <Button
              variant="outline"
              onClick={onViewMyExams}
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              ariaLabel={`View my saved exams${savedExamsCount > 0 ? `, ${savedExamsCount} exams saved` : ', no exams saved'}`}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              My Exams
              {savedExamsCount > 0 && (
                <span 
                  className="ml-1 px-2 py-0.5 text-xs bg-yellow-400 text-blue-900 rounded-full font-semibold"
                  aria-label={`${savedExamsCount} exams saved`}
                >
                  {savedExamsCount}
                </span>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              ariaLabel="Print current exam timetable"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print
            </Button>

            <Button
              variant="outline"
              onClick={handleAdminAccess}
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              ariaLabel="Access admin panel for exam management"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Admin
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header 