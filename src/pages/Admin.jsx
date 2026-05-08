import { useState, useEffect } from "react"
import AdminLogin from "../components/admin/AdminLogin"
import AdminDashboard from "../components/admin/AdminDashboard"
import examsData from "../data/exams.json"
import defaultVenues from "../data/venues.json"
import defaultProgrammes from "../data/programmes.json"
import defaultStaff from "../data/staff.json"

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const DATA_VERSION = "v2"
    if (localStorage.getItem("dataVersion") !== DATA_VERSION) {
      return false
    }
    return localStorage.getItem("adminLoggedIn") === "true"
  })
  const [exams, setExams] = useState(examsData)
  const [venues, setVenues] = useState(defaultVenues)
  const [programmes, setProgrammes] = useState(defaultProgrammes)
  const [staff, setStaff] = useState(defaultStaff)
  const [schoolName, setSchoolName] = useState("Tamale Technical University")
  const [semesterTitle, setSemesterTitle] = useState("")

  // Clear stale cached data when app version changes
  useEffect(() => {
    const DATA_VERSION = "v2"
    if (localStorage.getItem("dataVersion") !== DATA_VERSION) {
      localStorage.removeItem("timetableData")
      localStorage.removeItem("venuesData")
      localStorage.removeItem("programmesData")
      localStorage.removeItem("staffData")
      localStorage.removeItem("adminLoggedIn")
      localStorage.removeItem("schoolName")
      localStorage.removeItem("semesterTitle")
      localStorage.setItem("dataVersion", DATA_VERSION)
    }
  }, [])

  // Load data from localStorage if available
  useEffect(() => {
    const savedData = localStorage.getItem("timetableData")
    if (savedData) {
      try {
        setExams(JSON.parse(savedData))
      } catch (error) {
        console.error("Error loading saved data:", error)
        setExams(examsData)
      }
    }

    const savedVenues = localStorage.getItem("venuesData")
    if (savedVenues) {
      try {
        const parsed = JSON.parse(savedVenues)
        // Handle migration from old string format to new object format
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          const migrated = parsed.map((name, i) => ({
            id: name.toLowerCase().replace(/\s+/g, ""),
            name,
            block: "General",
            capacity: 50
          }))
          setVenues(migrated)
          localStorage.setItem("venuesData", JSON.stringify(migrated))
        } else {
          setVenues(parsed)
        }
      } catch (error) {
        console.error("Error loading saved venues:", error)
        setVenues(defaultVenues)
      }
    }

    const savedProgrammes = localStorage.getItem("programmesData")
    if (savedProgrammes) {
      try {
        const parsed = JSON.parse(savedProgrammes)
        // Migrate from old string-array format to object format
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          const migrated = parsed.map((name, i) => ({
            id: name.toLowerCase().replace(/\s+/g, "-") + "-" + i,
            name,
            indexPrefix: name.split(" ").map(w => w[0]).join("").toUpperCase(),
            enrolment: { "100": 0, "200": 0, "300": 0, "400": 0 },
          }))
          setProgrammes(migrated)
          localStorage.setItem("programmesData", JSON.stringify(migrated))
        } else {
          setProgrammes(parsed)
        }
      } catch (error) {
        console.error("Error loading saved programmes:", error)
        setProgrammes(defaultProgrammes)
      }
    }

    const savedStaff = localStorage.getItem("staffData")
    if (savedStaff) {
      try {
        setStaff(JSON.parse(savedStaff))
      } catch (error) {
        console.error("Error loading saved staff:", error)
        setStaff(defaultStaff)
      }
    }

    const savedSchoolName = localStorage.getItem("schoolName")
    if (savedSchoolName) {
      setSchoolName(savedSchoolName)
    }

    const savedSemesterTitle = localStorage.getItem("semesterTitle")
    if (savedSemesterTitle) {
      setSemesterTitle(savedSemesterTitle)
    }
  }, [])

  const handleLogin = (status) => {
    setIsLoggedIn(status)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem("adminLoggedIn")
  }

  // Exam handlers
  const handleSaveExam = (examData) => {
    const newExams = [...exams, examData]
    setExams(newExams)
    localStorage.setItem("timetableData", JSON.stringify(newExams))
  }

  const handleUpdateExam = (examData) => {
    const updatedExams = exams.map(exam =>
      exam.id === examData.id ? examData : exam
    )
    setExams(updatedExams)
    localStorage.setItem("timetableData", JSON.stringify(updatedExams))
  }

  const handleDeleteExam = (examId) => {
    const filteredExams = exams.filter(exam => exam.id !== examId)
    setExams(filteredExams)
    localStorage.setItem("timetableData", JSON.stringify(filteredExams))
  }

  // Venue handlers (now objects with { id, name, block, capacity })
  const handleAddVenue = (venue) => {
    const newVenues = [...venues, venue]
    setVenues(newVenues)
    localStorage.setItem("venuesData", JSON.stringify(newVenues))
  }

  const handleUpdateVenue = (index, updatedVenue) => {
    const oldVenue = venues[index]
    const newVenues = [...venues]
    newVenues[index] = updatedVenue
    setVenues(newVenues)
    localStorage.setItem("venuesData", JSON.stringify(newVenues))

    // Update existing exams that reference the old venue name
    if (oldVenue.name !== updatedVenue.name) {
      const updatedExams = exams.map(exam =>
        exam.venue === oldVenue.name ? { ...exam, venue: updatedVenue.name } : exam
      )
      setExams(updatedExams)
      localStorage.setItem("timetableData", JSON.stringify(updatedExams))
    }
  }

  const handleDeleteVenue = (index) => {
    const newVenues = venues.filter((_, i) => i !== index)
    setVenues(newVenues)
    localStorage.setItem("venuesData", JSON.stringify(newVenues))
  }

  // Programme handlers (programmes are objects: { id, name, indexPrefix, enrolment })
  const handleAddProgramme = (programme) => {
    const newProgrammes = [...programmes, programme]
    setProgrammes(newProgrammes)
    localStorage.setItem("programmesData", JSON.stringify(newProgrammes))
  }

  const handleUpdateProgramme = (id, updatedProgramme) => {
    const oldProgramme = programmes.find(p => p.id === id)
    const newProgrammes = programmes.map(p => p.id === id ? updatedProgramme : p)
    setProgrammes(newProgrammes)
    localStorage.setItem("programmesData", JSON.stringify(newProgrammes))

    if (oldProgramme && oldProgramme.name !== updatedProgramme.name) {
      const updatedExams = exams.map(exam =>
        exam.programme === oldProgramme.name ? { ...exam, programme: updatedProgramme.name } : exam
      )
      setExams(updatedExams)
      localStorage.setItem("timetableData", JSON.stringify(updatedExams))
    }
  }

  const handleDeleteProgramme = (id) => {
    const newProgrammes = programmes.filter(p => p.id !== id)
    setProgrammes(newProgrammes)
    localStorage.setItem("programmesData", JSON.stringify(newProgrammes))
  }

  // Staff handlers
  const handleAddStaff = (staffMember) => {
    const newStaff = [...staff, staffMember]
    setStaff(newStaff)
    localStorage.setItem("staffData", JSON.stringify(newStaff))
  }

  const handleUpdateStaff = (index, updatedStaffMember) => {
    const newStaff = [...staff]
    newStaff[index] = updatedStaffMember
    setStaff(newStaff)
    localStorage.setItem("staffData", JSON.stringify(newStaff))
  }

  const handleDeleteStaff = (index) => {
    const newStaff = staff.filter((_, i) => i !== index)
    setStaff(newStaff)
    localStorage.setItem("staffData", JSON.stringify(newStaff))
  }

  // School name handler
  const handleUpdateSchoolName = (name) => {
    setSchoolName(name)
    localStorage.setItem("schoolName", name)
  }

  // Semester title handler
  const handleUpdateSemesterTitle = (title) => {
    setSemesterTitle(title)
    localStorage.setItem("semesterTitle", title)
  }

  // Bulk import handler
  const handleBulkImport = (generatedExams) => {
    setExams(generatedExams)
    localStorage.setItem("timetableData", JSON.stringify(generatedExams))
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <AdminDashboard
      onLogout={handleLogout}
      exams={exams}
      onSaveExam={handleSaveExam}
      onUpdateExam={handleUpdateExam}
      onDeleteExam={handleDeleteExam}
      venues={venues}
      onAddVenue={handleAddVenue}
      onUpdateVenue={handleUpdateVenue}
      onDeleteVenue={handleDeleteVenue}
      programmesList={programmes}
      onAddProgramme={handleAddProgramme}
      onUpdateProgramme={handleUpdateProgramme}
      onDeleteProgramme={handleDeleteProgramme}
      staff={staff}
      onAddStaff={handleAddStaff}
      onUpdateStaff={handleUpdateStaff}
      onDeleteStaff={handleDeleteStaff}
      schoolName={schoolName}
      onUpdateSchoolName={handleUpdateSchoolName}
      semesterTitle={semesterTitle}
      onUpdateSemesterTitle={handleUpdateSemesterTitle}
      onBulkImport={handleBulkImport}
    />
  )
}

export default Admin
