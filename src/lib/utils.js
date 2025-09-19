import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getTimeWindow(time) {
  const hour = parseInt(time.split(':')[0])
  return hour < 12 ? 'AM' : 'PM'
}

export function groupByDate(exams) {
  const grouped = new Map()
  
  exams.forEach(exam => {
    const dateISO = exam.date
    if (!grouped.has(dateISO)) {
      grouped.set(dateISO, [])
    }
    grouped.get(dateISO).push(exam)
  })
  
  // Sort exams within each date by start time
  grouped.forEach(exams => {
    exams.sort((a, b) => a.startTime.localeCompare(b.startTime))
  })
  
  return grouped
}

export function formatDate(dateISO) {
  const date = new Date(dateISO)
  const options = { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  }
  return date.toLocaleDateString('en-US', options)
}

export function getUniqueValues(exams, key) {
  return [...new Set(exams.map(exam => exam[key]))].filter(Boolean).sort()
} 