import { useState, useEffect, useMemo } from "react"
import { Save, AlertTriangle, Clock, MapPin, Calendar, CheckCircle, XCircle, Info } from "lucide-react"
import Button from "../ui/Button"
import Input from "../ui/Input"
import Select from "../ui/Select"
import Modal from "../ui/Modal"

const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

const ExamForm = ({ exam = null, onSave, onCancel, isEditing = false, existingExams = [], venues: venuesProp = [], programmes: programmesProp = [] }) => {
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

  const defaultProgrammes = [
    "Computer Science", "Mathematics", "Physics", "Engineering",
    "Chemistry", "Biotechnology", "Economics", "Statistics"
  ]

  const defaultVenues = [
    "Main Auditorium", "Science Block A", "Science Block B", "Physics Lab",
    "Chemistry Lab", "Biology Lab", "Computer Lab 1", "Computer Lab 2",
    "Computer Lab 3", "Computer Lab 4", "Engineering Hall", "Business School",
    "Math Center", "Advanced Physics Lab"
  ]

  const programmes = programmesProp.length > 0 ? programmesProp : defaultProgrammes
  const levels = ["100", "200", "300", "400"]
  // Venues can be objects { id, name, block, capacity } or strings (legacy)
  const rawVenues = venuesProp.length > 0 ? venuesProp : defaultVenues
  const venueNames = rawVenues.map(v => typeof v === "object" ? v.name : v)
  const venueObjects = rawVenues.map(v => typeof v === "object" ? v : { id: v, name: v, block: "General", capacity: 50 })
  const venues = venueNames

  // Get exams on the selected date
  const sameDateExams = useMemo(() => {
    if (!formData.date) return []
    return existingExams.filter(existing =>
      existing.date === formData.date &&
      (!isEditing || existing.id !== exam?.id)
    )
  }, [formData.date, existingExams, isEditing, exam])

  // Compute venue availability for the selected date
  const venueAvailability = useMemo(() => {
    return venues.map(venue => {
      const bookings = sameDateExams.filter(e => e.venue === venue)
      const isBusyAtSelectedTime = formData.startTime && formData.endTime
        ? bookings.some(e => {
            const eStart = timeToMinutes(e.startTime)
            const eEnd = timeToMinutes(e.endTime)
            const newStart = timeToMinutes(formData.startTime)
            const newEnd = timeToMinutes(formData.endTime)
            return newStart < eEnd && newEnd > eStart
          })
        : false

      return {
        name: venue,
        bookings,
        totalBookings: bookings.length,
        isBusyAtSelectedTime,
        isFree: bookings.length === 0,
      }
    })
  }, [venues, sameDateExams, formData.startTime, formData.endTime])

  // Standard exam time slots
  const timeSlots = useMemo(() => {
    const slots = [
      { label: "Morning I", start: "07:30", end: "09:30" },
      { label: "Morning II", start: "08:30", end: "10:30" },
      { label: "Mid-Morning", start: "10:00", end: "12:00" },
      { label: "Late Morning", start: "11:00", end: "13:00" },
      { label: "Afternoon I", start: "13:00", end: "15:00" },
      { label: "Afternoon II", start: "14:00", end: "16:00" },
      { label: "Late Afternoon", start: "16:00", end: "18:00" },
    ]

    return slots.map(slot => {
      const busyVenues = sameDateExams.filter(e => {
        const eStart = timeToMinutes(e.startTime)
        const eEnd = timeToMinutes(e.endTime)
        const slotStart = timeToMinutes(slot.start)
        const slotEnd = timeToMinutes(slot.end)
        return slotStart < eEnd && slotEnd > eStart
      }).length

      return {
        ...slot,
        busyVenues,
        freeVenues: venues.length - busyVenues,
        isSelected: formData.startTime === slot.start && formData.endTime === slot.end,
      }
    })
  }, [sameDateExams, venues, formData.startTime, formData.endTime])

  // Check for conflicts and duplicates
  const checkConflicts = () => {
    const newConflicts = []
    const newWarnings = {}

    if (!formData.date || !formData.startTime || !formData.endTime || !formData.venue) {
      return { conflicts: [], warnings: {} }
    }

    const venueConflicts = sameDateExams.filter(existing =>
      existing.venue === formData.venue
    )

    if (venueConflicts.length > 0) {
      const timeOverlap = venueConflicts.filter(existing => {
        const eStart = timeToMinutes(existing.startTime)
        const eEnd = timeToMinutes(existing.endTime)
        const newStart = timeToMinutes(formData.startTime)
        const newEnd = timeToMinutes(formData.endTime)
        return newStart < eEnd && newEnd > eStart
      })

      if (timeOverlap.length > 0) {
        newConflicts.push({
          type: "venue",
          message: `Venue "${formData.venue}" is already booked at this time`,
          conflicts: timeOverlap,
          severity: "error"
        })
      }
    }

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

    const sameProgrammeSameDay = sameDateExams.filter(existing =>
      existing.programme === formData.programme
    )

    if (sameProgrammeSameDay.length >= 3) {
      newWarnings.programmeConcentration = `Programme "${formData.programme}" has ${sameProgrammeSameDay.length + 1} exams on this date`
    }

    const sameLevelSameDay = sameDateExams.filter(existing =>
      existing.level === formData.level
    )

    if (sameLevelSameDay.length >= 4) {
      newWarnings.levelConcentration = `Level ${formData.level} has ${sameLevelSameDay.length + 1} exams on this date`
    }

    setConflicts(newConflicts)
    setWarnings(newWarnings)

    return { conflicts: newConflicts, warnings: newWarnings }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.courseCode.trim()) newErrors.courseCode = "Course code is required"
    if (!formData.courseTitle.trim()) newErrors.courseTitle = "Course title is required"
    if (!formData.programme) newErrors.programme = "Programme is required"
    if (!formData.level) newErrors.level = "Level is required"
    if (!formData.date) newErrors.date = "Date is required"
    if (!formData.startTime) newErrors.startTime = "Start time is required"
    if (!formData.endTime) newErrors.endTime = "End time is required"
    if (!formData.venue) newErrors.venue = "Venue is required"

    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = "End time must be after start time"
      }
    }

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
      onSave({
        ...formData,
        id: exam?.id || Date.now().toString()
      })
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }

    if (["date", "startTime", "endTime", "venue", "courseCode"].includes(name)) {
      setTimeout(() => checkConflicts(), 300)
    }
  }

  const handleTimeSlotClick = (slot) => {
    setFormData(prev => ({ ...prev, startTime: slot.start, endTime: slot.end }))
    setErrors(prev => ({ ...prev, startTime: "", endTime: "" }))
    setTimeout(() => checkConflicts(), 300)
  }

  const handleVenueQuickSelect = (venueName) => {
    setFormData(prev => ({ ...prev, venue: venueName }))
    setErrors(prev => ({ ...prev, venue: "" }))
    setTimeout(() => checkConflicts(), 300)
  }

  const modalTitle = isEditing ? "Edit Exam" : "Schedule New Exam"

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={modalTitle}
      size="full"
      closeOnBackdrop={true}
      closeOnEscape={true}
    >
      <div className="flex flex-col lg:flex-row gap-6 max-h-[calc(100vh-200px)] overflow-hidden">
        {/* Left: Form */}
        <div className="flex-1 overflow-y-auto pr-2">
          {/* Conflicts and Warnings */}
          {(conflicts.length > 0 || Object.keys(warnings).length > 0) && (
            <div className="mb-6 space-y-3">
              {conflicts.map((conflict, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">{conflict.message}</p>
                      {conflict.conflicts.map((c, idx) => (
                        <p key={idx} className="text-xs text-red-600 mt-1">
                          {c.courseCode} • {c.startTime}–{c.endTime} • {c.venue}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {Object.entries(warnings).map(([key, message]) => (
                <div key={key} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    {message}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Course Code *
                </label>
                <Input
                  id="courseCode" name="courseCode" type="text"
                  value={formData.courseCode} onChange={handleChange}
                  placeholder="e.g., CS101"
                  className={`border-2 ${errors.courseCode ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
                />
                {errors.courseCode && <p className="text-red-500 text-xs mt-1">{errors.courseCode}</p>}
              </div>

              <div>
                <label htmlFor="programme" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Programme *
                </label>
                <Select
                  id="programme" name="programme"
                  value={formData.programme} onChange={handleChange}
                  className={`border-2 ${errors.programme ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
                >
                  <option value="">Select Programme</option>
                  {programmes.map(prog => {
                    const name = typeof prog === "string" ? prog : prog.name
                    return <option key={name} value={name}>{name}</option>
                  })}
                </Select>
                {errors.programme && <p className="text-red-500 text-xs mt-1">{errors.programme}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700 mb-1.5">
                Course Title *
              </label>
              <Input
                id="courseTitle" name="courseTitle" type="text"
                value={formData.courseTitle} onChange={handleChange}
                placeholder="e.g., Introduction to Computer Science"
                className={`border-2 ${errors.courseTitle ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
              />
              {errors.courseTitle && <p className="text-red-500 text-xs mt-1">{errors.courseTitle}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Level *
                </label>
                <Select
                  id="level" name="level"
                  value={formData.level} onChange={handleChange}
                  className={`border-2 ${errors.level ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
                >
                  {levels.map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </Select>
                {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level}</p>}
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date *
                </label>
                <Input
                  id="date" name="date" type="date"
                  value={formData.date} onChange={handleChange}
                  className={`border-2 ${errors.date ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
            </div>

            {/* Time slot quick picks */}
            {formData.date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Quick Pick Time Slot
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => handleTimeSlotClick(slot)}
                      className={`p-2 rounded-lg border-2 text-left transition-all ${
                        slot.isSelected
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                          : slot.freeVenues === 0
                          ? "border-red-200 bg-red-50 opacity-60"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-800">{slot.label}</p>
                      <p className="text-xs text-gray-500">{slot.start} – {slot.end}</p>
                      <p className={`text-xs mt-1 font-medium ${
                        slot.freeVenues === venues.length
                          ? "text-green-600"
                          : slot.freeVenues === 0
                          ? "text-red-600"
                          : "text-amber-600"
                      }`}>
                        {slot.freeVenues}/{venues.length} venues free
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Time *
                </label>
                <Input
                  id="startTime" name="startTime" type="time"
                  value={formData.startTime} onChange={handleChange}
                  className={`border-2 ${errors.startTime ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
                />
                {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Time *
                </label>
                <Input
                  id="endTime" name="endTime" type="time"
                  value={formData.endTime} onChange={handleChange}
                  className={`border-2 ${errors.endTime ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
                />
                {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
              </div>
            </div>

            {/* Venue select */}
            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1.5">
                Venue *
              </label>
              <Select
                id="venue" name="venue"
                value={formData.venue} onChange={handleChange}
                className={`border-2 ${errors.venue ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500`}
              >
                <option value="">Select Venue</option>
                {venueObjects.map(venueObj => {
                  const venueName = venueObj.name
                  const info = venueAvailability.find(v => v.name === venueName)
                  const busy = info?.isBusyAtSelectedTime
                  return (
                    <option key={venueName} value={venueName}>
                      {venueName} ({venueObj.capacity} seats) {busy ? "- busy at this time" : info?.isFree ? "" : `- ${info?.totalBookings} exam${info?.totalBookings > 1 ? "s" : ""} today`}
                    </option>
                  )
                })}
              </Select>
              {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
            </div>

            {errors.conflicts && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">{errors.conflicts}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel} className="px-6">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={conflicts.length > 0}
                className="px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "Update Exam" : "Schedule Exam"}
              </Button>
            </div>
          </form>
        </div>

        {/* Right: Availability Panel */}
        <div className="w-full lg:w-80 flex-shrink-0 overflow-y-auto border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6">
          <div className="space-y-5">
            {/* Date summary */}
            {formData.date ? (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    {new Date(formData.date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long", day: "numeric", month: "long"
                    })}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {sameDateExams.length} exam{sameDateExams.length !== 1 ? "s" : ""} scheduled
                  </p>
                </div>

                {/* Existing exams on this date */}
                {sameDateExams.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Exams on this date
                    </h4>
                    <div className="space-y-1.5">
                      {sameDateExams
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map(e => (
                        <div key={e.id} className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-800">{e.courseCode}</p>
                          <p className="text-xs text-gray-500">
                            {e.startTime}–{e.endTime} • {e.venue}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Venue availability */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    Venue Availability
                    {formData.startTime && formData.endTime && (
                      <span className="normal-case font-normal"> at {formData.startTime}–{formData.endTime}</span>
                    )}
                  </h4>
                  <div className="space-y-1">
                    {venueAvailability.map(v => {
                      const obj = venueObjects.find(vo => vo.name === v.name)
                      return (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => handleVenueQuickSelect(v.name)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all text-xs ${
                            formData.venue === v.name
                              ? "bg-blue-50 border border-blue-300 ring-1 ring-blue-300"
                              : v.isBusyAtSelectedTime
                              ? "bg-red-50 border border-red-100 opacity-60"
                              : v.isFree
                              ? "bg-green-50 border border-green-100 hover:border-green-300"
                              : "bg-amber-50 border border-amber-100 hover:border-amber-300"
                          }`}
                        >
                          {v.isBusyAtSelectedTime ? (
                            <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                          ) : v.isFree ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800 truncate block">{v.name}</span>
                            {obj && <span className="text-gray-400">{obj.capacity} seats</span>}
                          </div>
                          {v.isBusyAtSelectedTime ? (
                            <span className="text-red-600 flex-shrink-0">Busy</span>
                          ) : v.isFree ? (
                            <span className="text-green-600 flex-shrink-0">Free</span>
                          ) : (
                            <span className="text-amber-600 flex-shrink-0">{v.totalBookings} booked</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Select a date to see availability</p>
                <p className="text-xs text-gray-400 mt-1">
                  Available venues and time slots will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ExamForm
