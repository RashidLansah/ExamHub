import { useState, useEffect } from "react"
import { Save, Plus, Edit, AlertTriangle, Clock, MapPin, Calendar } from "lucide-react"
import Button from "../ui/Button"
import Input from "../ui/Input"
import Select from "../ui/Select"
import Modal from "../ui/Modal"

const ExamForm = ({ exam = null, onSave, onCancel, isEditing = false, existingExams = [] }) => {
  const [formData, setFormData] = useState({
    courseCode: "",
    courseTitle: "",
    programme: "",
    level: "100",
    date: "",
    startTime: "",
    endTime: "",
    venue: ""
  })

  const [errors, setErrors] = useState({})
  const [warnings, setWarnings] = useState({})
  const [conflicts, setConflicts] = useState([])

  useEffect(() => {
    if (exam) {
      setFormData({
        courseCode: exam.courseCode || "",
        courseTitle: exam.courseTitle || "",
        programme: exam.programme || "",
        level: exam.level || "100",
        date: exam.date || "",
        startTime: exam.startTime || "",
        endTime: exam.endTime || "",
        venue: exam.venue || ""
      })
    }
  }, [exam])

  const programmes = [
    "Computer Science",
    "Mathematics", 
    "Physics",
    "Engineering",
    "Chemistry",
    "Biotechnology",
    "Economics",
    "Statistics"
  ]

  const levels = ["100", "200", "300", "400"]
  const venues = [
    "Main Auditorium",
    "Science Block A",
    "Science Block B",
    "Physics Lab",
    "Chemistry Lab",
    "Biology Lab",
    "Computer Lab 1",
    "Computer Lab 2",
    "Computer Lab 3",
    "Computer Lab 4",
    "Engineering Hall",
    "Business School",
    "Math Center",
    "Advanced Physics Lab"
  ]

  // Check for conflicts and duplicates
  const checkConflicts = () => {
    const newConflicts = []
    const newWarnings = {}
    
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.venue) {
      return { conflicts: [], warnings: {} }
    }

    // Get exams on the same date (excluding current exam if editing)
    const sameDateExams = existingExams.filter(existing => 
      existing.date === formData.date && 
      (!isEditing || existing.id !== exam?.id)
    )

    // Check venue conflicts
    const venueConflicts = sameDateExams.filter(existing => 
      existing.venue === formData.venue
    )

    if (venueConflicts.length > 0) {
      newConflicts.push({
        type: "venue",
        message: `Venue "${formData.venue}" is already booked on ${new Date(formData.date).toLocaleDateString()}`,
        conflicts: venueConflicts,
        severity: "error"
      })
    }

    // Check time overlaps
    const timeConflicts = sameDateExams.filter(existing => {
      const existingStart = existing.startTime
      const existingEnd = existing.endTime
      const newStart = formData.startTime
      const newEnd = formData.endTime

      // Check if times overlap
      return (
        (newStart < existingEnd && newEnd > existingStart) ||
        (existingStart < newEnd && existingEnd > newStart)
      )
    })

    if (timeConflicts.length > 0) {
      newConflicts.push({
        type: "time",
        message: `Time slot conflicts with existing exams on ${new Date(formData.date).toLocaleDateString()}`,
        conflicts: timeConflicts,
        severity: "error"
      })
    }

    // Check for duplicate course codes
    const duplicateCourseCode = existingExams.find(existing => 
      existing.courseCode === formData.courseCode &&
      (!isEditing || existing.id !== exam?.id)
    )

    if (duplicateCourseCode) {
      newConflicts.push({
        type: "courseCode",
        message: `Course code "${formData.courseCode}" already exists`,
        conflicts: [duplicateCourseCode],
        severity: "error"
      })
    }

    // Check for same course on same day (different times)
    const sameCourseSameDay = sameDateExams.filter(existing => 
      existing.courseCode === formData.courseCode
    )

    if (sameCourseSameDay.length > 0) {
      newWarnings.sameCourse = `Course "${formData.courseCode}" already has exams scheduled on this date`
    }

    // Check for programme concentration on same day
    const sameProgrammeSameDay = sameDateExams.filter(existing => 
      existing.programme === formData.programme
    )

    if (sameProgrammeSameDay.length >= 3) {
      newWarnings.programmeConcentration = `Programme "${formData.programme}" has ${sameProgrammeSameDay.length + 1} exams on this date`
    }

    // Check for level concentration on same day
    const sameLevelSameDay = sameDateExams.filter(existing => 
      existing.level === formData.level
    )

    if (sameLevelSameDay.length >= 4) {
      newWarnings.levelConcentration = `Level ${formData.level} has ${sameLevelSameDay.length + 1} exams on this date`
    }

    // Check for venue type conflicts (e.g., multiple labs on same day)
    const venueType = getVenueType(formData.venue)
    const sameVenueTypeSameDay = sameDateExams.filter(existing => 
      getVenueType(existing.venue) === venueType
    )

    if (sameVenueTypeSameDay.length >= 2) {
      newWarnings.venueTypeConcentration = `Multiple ${venueType} venues are being used on this date`
    }

    setConflicts(newConflicts)
    setWarnings(newWarnings)

    return { conflicts: newConflicts, warnings: newWarnings }
  }

  // Helper function to categorize venue types
  const getVenueType = (venue) => {
    if (venue.includes("Lab")) return "laboratory"
    if (venue.includes("Auditorium") || venue.includes("Hall")) return "large venue"
    if (venue.includes("Block") || venue.includes("Center")) return "classroom"
    return "other"
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.courseCode.trim()) {
      newErrors.courseCode = "Course code is required"
    }
    if (!formData.courseTitle.trim()) {
      newErrors.courseTitle = "Course title is required"
    }
    if (!formData.programme) {
      newErrors.programme = "Programme is required"
    }
    if (!formData.level) {
      newErrors.level = "Level is required"
    }
    if (!formData.date) {
      newErrors.date = "Date is required"
    }
    if (!formData.startTime) {
      newErrors.startTime = "Start time is required"
    }
    if (!formData.endTime) {
      newErrors.endTime = "End time is required"
    }
    if (!formData.venue) {
      newErrors.venue = "Venue is required"
    }

    // Validate time logic
    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = "End time must be after start time"
      }
    }

    // Check for conflicts
    const { conflicts: newConflicts } = checkConflicts()
    if (newConflicts.length > 0) {
      newErrors.conflicts = "Please resolve scheduling conflicts before saving"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      const examData = {
        ...formData,
        id: exam?.id || Date.now().toString()
      }
      onSave(examData)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }

    // Check for conflicts when relevant fields change
    if (["date", "startTime", "endTime", "venue", "courseCode"].includes(name)) {
      setTimeout(() => checkConflicts(), 500) // Debounce conflict checking
    }
  }

  const getConflictIcon = (severity) => {
    return severity === "error" ? "🔴" : "🟡"
  }

  const getConflictColor = (severity) => {
    return severity === "error" ? "text-red-600" : "text-yellow-600"
  }

  const modalTitle = isEditing ? "Edit Exam" : "Add New Exam"

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={modalTitle}
      size="xl"
      closeOnBackdrop={true}
      closeOnEscape={true}
    >
      <div className="space-y-6">
        {/* Conflicts and Warnings Display */}
        {(conflicts.length > 0 || Object.keys(warnings).length > 0) && (
          <div className="mb-6 space-y-3">
            {/* Critical Conflicts */}
            {conflicts.map((conflict, index) => (
              <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800 mb-2">
                      {getConflictIcon(conflict.severity)} {conflict.message}
                    </h4>
                    <div className="space-y-2">
                      {conflict.conflicts.map((conflictingExam, idx) => (
                        <div key={idx} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{conflictingExam.courseCode}</span>
                            <span>•</span>
                            <span>{conflictingExam.startTime} - {conflictingExam.endTime}</span>
                            <span>•</span>
                            <MapPin className="h-3 w-3" />
                            <span>{conflictingExam.venue}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Warnings */}
            {Object.entries(warnings).map(([key, message]) => (
              <div key={key} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>🟡</span>
                  <span className="text-sm text-yellow-800">{message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-2">
                Course Code *
              </label>
              <Input
                id="courseCode"
                name="courseCode"
                type="text"
                value={formData.courseCode}
                onChange={handleChange}
                placeholder="e.g., CS101"
                className={`border-2 ${errors.courseCode ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
              />
              {errors.courseCode && (
                <p className="text-red-500 text-sm mt-1">{errors.courseCode}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="programme" className="block text-sm font-medium text-gray-700 mb-2">
                Programme *
              </label>
              <Select
                id="programme"
                name="programme"
                value={formData.programme}
                onChange={handleChange}
                className={`border-2 ${errors.programme ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
              >
                <option value="">Select Programme</option>
                {programmes.map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </Select>
              {errors.programme && (
                <p className="text-red-500 text-sm mt-1">{errors.programme}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Course Title *
            </label>
            <Input
              id="courseTitle"
              name="courseTitle"
              type="text"
              value={formData.courseTitle}
              onChange={handleChange}
              placeholder="e.g., Introduction to Computer Science"
              className={`border-2 ${errors.courseTitle ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
            />
            {errors.courseTitle && (
              <p className="text-red-500 text-sm mt-1">{errors.courseTitle}</p>
            )}
          </div>

          {/* Level and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                Level *
              </label>
              <Select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className={`border-2 ${errors.level ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
              >
                {levels.map(level => (
                  <option key={level} value={level}>Level {level}</option>
                ))}
              </Select>
              {errors.level && (
                <p className="text-red-500 text-sm mt-1">{errors.level}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className={`border-2 ${errors.date ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                className={`border-2 ${errors.startTime ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
              />
              {errors.startTime && (
                <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                className={`border-2 ${errors.endTime ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
              />
              {errors.endTime && (
                <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Venue */}
          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
              Venue *
            </label>
            <Select
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              className={`border-2 ${errors.venue ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
            >
              <option value="">Select Venue</option>
              {venues.map(venue => (
                <option key={venue} value={venue}>{venue}</option>
              ))}
            </Select>
            {errors.venue && (
              <p className="text-red-500 text-sm mt-1">{errors.venue}</p>
            )}
          </div>

          {/* General Errors */}
          {errors.conflicts && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">{errors.conflicts}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={conflicts.length > 0}
              className="px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Update Exam" : "Add Exam"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default ExamForm 