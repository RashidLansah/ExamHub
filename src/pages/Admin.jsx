import { useState, useEffect } from "react"
import AdminLogin from "../components/admin/AdminLogin"
import AdminDashboard from "../components/admin/AdminDashboard"
import examsData from "../data/exams.json"

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [exams, setExams] = useState(examsData)

  // Check if admin is already logged in
  useEffect(() => {
    const adminStatus = localStorage.getItem("adminLoggedIn")
    if (adminStatus === "true") {
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogin = (status) => {
    setIsLoggedIn(status)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem("adminLoggedIn")
  }

  const handleSaveExam = (examData) => {
    const newExams = [...exams, examData]
    setExams(newExams)
    // In production, this would save to a database
    localStorage.setItem("timetableData", JSON.stringify(newExams))
  }

  const handleUpdateExam = (examData) => {
    const updatedExams = exams.map(exam => 
      exam.id === examData.id ? examData : exam
    )
    setExams(updatedExams)
    // In production, this would update the database
    localStorage.setItem("timetableData", JSON.stringify(updatedExams))
  }

  const handleDeleteExam = (examId) => {
    const filteredExams = exams.filter(exam => exam.id !== examId)
    setExams(filteredExams)
    // In production, this would delete from the database
    localStorage.setItem("timetableData", JSON.stringify(filteredExams))
  }

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
  }, [])

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
    />
  )
}

export default Admin 