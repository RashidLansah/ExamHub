import { useState, useEffect } from "react"
import { Star, Clock, MapPin, BookOpen, Users } from "lucide-react"
import { Card, CardContent } from "./ui/Card"
import Badge from "./ui/Badge"
import { getTimeWindow } from "../lib/utils"

const ExamCard = ({ exam, onSaveToggle, isSaved = false }) => {
  const [saved, setSaved] = useState(isSaved)

  useEffect(() => {
    setSaved(isSaved)
  }, [isSaved])

  const handleSaveToggle = () => {
    const newSavedState = !saved
    setSaved(newSavedState)
    onSaveToggle(exam.id, newSavedState)
  }

  const timeWindow = getTimeWindow(exam.startTime)

  return (
    <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-blue-50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Time Section with enhanced design */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <span className="text-3xl font-bold text-gray-900">
                    {exam.startTime}
                  </span>
                  <span className="text-xl text-gray-500 mx-2">-</span>
                  <span className="text-3xl font-bold text-gray-900">
                    {exam.endTime}
                  </span>
                </div>
              </div>
              <Badge 
                variant={timeWindow === "AM" ? "default" : "secondary"}
                className="text-sm px-4 py-2 font-semibold"
              >
                {timeWindow === "AM" ? "🌅 Morning" : "🌆 Afternoon"}
              </Badge>
            </div>

            {/* Course Information with enhanced typography */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {exam.courseCode}
                </h3>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2 leading-relaxed">
                {exam.courseTitle}
              </h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{exam.programme}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Level {exam.level}</span>
                </div>
              </div>
            </div>

            {/* Venue with enhanced styling */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <Badge variant="outline" className="text-sm px-4 py-2 font-medium border-2">
                📍 {exam.venue}
              </Badge>
            </div>
          </div>

          {/* Enhanced Save Button */}
          <button
            onClick={handleSaveToggle}
            className={`ml-6 p-4 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-200 ${
              saved
                ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 shadow-lg"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            }`}
            aria-label={saved ? "Remove from saved exams" : "Save exam"}
            title={saved ? "Remove from saved exams" : "Save exam"}
          >
            <Star className={`h-6 w-6 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ExamCard 