import { formatDate } from "../lib/utils"
import ExamCard from "./ExamCard"
import { Calendar, Clock } from "lucide-react"

const DaySection = ({ date, exams, onSaveToggle, savedExams }) => {
  const formatDateDisplay = (dateISO) => {
    const date = new Date(dateISO)
    const options = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }
    return date.toLocaleDateString('en-US', options)
  }

  const getDayOfWeek = (dateISO) => {
    const date = new Date(dateISO)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  return (
    <section className="mb-12" role="region" aria-label={`Exams on ${formatDate(date)}`}>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {formatDateDisplay(date)}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{exams.length} exam{exams.length !== 1 ? 's' : ''}</span>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                {getDayOfWeek(date)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress bar showing exam distribution */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((exams.length / 8) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-6" role="list">
        {exams.map((exam) => (
          <div key={exam.id} role="listitem">
            <ExamCard
              exam={exam}
              onSaveToggle={onSaveToggle}
              isSaved={savedExams.includes(exam.id)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export default DaySection 