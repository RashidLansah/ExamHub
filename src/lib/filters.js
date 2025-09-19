export function filterExams(exams, filters) {
  return exams.filter(exam => {
    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        exam.courseCode.toLowerCase().includes(searchLower) ||
        exam.courseTitle.toLowerCase().includes(searchLower) ||
        exam.programme.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }
    
    // Programme filter
    if (filters.programme && exam.programme !== filters.programme) {
      return false
    }
    
    // Level filter
    if (filters.level && exam.level !== filters.level) {
      return false
    }
    
    // Date filter
    if (filters.date && exam.date !== filters.date) {
      return false
    }
    
    // Day filter
    if (filters.day && filters.day.length > 0) {
      const examDay = new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short' })
      if (!filters.day.includes(examDay)) {
        return false
      }
    }
    
    // Time window filter
    if (filters.timeWindow && filters.timeWindow !== 'All') {
      const examTimeWindow = getTimeWindow(exam.startTime)
      if (examTimeWindow !== filters.timeWindow) {
        return false
      }
    }
    
    // Venue filter
    if (filters.venue && exam.venue !== filters.venue) {
      return false
    }
    
    return true
  })
}

function getTimeWindow(time) {
  const hour = parseInt(time.split(':')[0])
  return hour < 12 ? 'AM' : 'PM'
} 