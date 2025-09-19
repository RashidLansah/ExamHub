import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Filter, Search, X } from "lucide-react"
import Input from "./ui/Input"
import Select from "./ui/Select"
import Checkbox from "./ui/Checkbox"
import { getUniqueValues } from "../lib/utils"

const Filters = ({ exams, onFiltersChange }) => {
  const [filters, setFilters] = useState({
    search: "",
    programme: "",
    level: "",
    date: "",
    day: [],
    timeWindow: "All",
    venue: ""
  })

  const [uniqueValues, setUniqueValues] = useState({
    programmes: [],
    levels: [],
    venues: []
  })

  const [isExpanded, setIsExpanded] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  useEffect(() => {
    setUniqueValues({
      programmes: getUniqueValues(exams, "programme"),
      levels: getUniqueValues(exams, "level"),
      venues: getUniqueValues(exams, "venue")
    })
  }, [exams])

  useEffect(() => {
    onFiltersChange(filters)
    
    // Calculate active filters count
    let count = 0
    if (filters.search) count++
    if (filters.programme) count++
    if (filters.level) count++
    if (filters.date) count++
    if (filters.day.length > 0) count++
    if (filters.timeWindow !== "All") count++
    if (filters.venue) count++
    
    setActiveFiltersCount(count)
  }, [filters, onFiltersChange])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleDayToggle = (day) => {
    setFilters(prev => ({
      ...prev,
      day: prev.day.includes(day)
        ? prev.day.filter(d => d !== day)
        : [...prev.day, day]
    }))
  }

  const resetFilters = () => {
    setFilters({
      search: "",
      programme: "",
      level: "",
      date: "",
      day: [],
      timeWindow: "All",
      venue: ""
    })
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const allLevels = ["100", "200", "300", "400"]

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b shadow-sm">
      <div className="max-w-6xl mx-auto">
        {/* Collapsible Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Filters & Search</h3>
                <p className="text-sm text-gray-600">
                  {activeFiltersCount > 0 
                    ? `${activeFiltersCount} active filter${activeFiltersCount !== 1 ? 's' : ''}`
                    : "No filters applied"
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </button>
              )}
              
              <button
                onClick={toggleExpanded}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                {isExpanded ? (
                  <>
                    <span className="text-sm font-medium">Hide Filters</span>
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium">Show Filters</span>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Content */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Input
                id="search"
                type="text"
                placeholder="🔍 Search by course code, title, or programme..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-12 text-lg py-4 border-2 border-gray-200 focus:border-blue-500 rounded-xl shadow-sm"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search className="w-6 h-6" />
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Programme Select */}
              <div>
                <label htmlFor="programme" className="block text-sm font-medium text-gray-700 mb-2">Programme</label>
                <Select
                  id="programme"
                  value={filters.programme}
                  onChange={(e) => handleFilterChange("programme", e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                >
                  <option value="">All Programmes</option>
                  {uniqueValues.programmes.map(programme => (
                    <option key={programme} value={programme}>{programme}</option>
                  ))}
                </Select>
              </div>

              {/* Level Select */}
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <Select
                  id="level"
                  value={filters.level}
                  onChange={(e) => handleFilterChange("level", e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                >
                  <option value="">All Levels</option>
                  {allLevels.map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </Select>
              </div>

              {/* Date Input */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <Input
                  id="date"
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange("date", e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                />
              </div>

              {/* Time Window Select */}
              <div>
                <label htmlFor="timeWindow" className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <Select
                  id="timeWindow"
                  value={filters.timeWindow}
                  onChange={(e) => handleFilterChange("timeWindow", e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                >
                  <option value="All">All Times</option>
                  <option value="AM">AM (Morning)</option>
                  <option value="PM">PM (Afternoon)</option>
                </Select>
              </div>
            </div>

            {/* Additional Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Venue Select */}
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                <Select
                  id="venue"
                  value={filters.venue}
                  onChange={(e) => handleFilterChange("venue", e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                >
                  <option value="">All Venues</option>
                  {uniqueValues.venues.map(venue => (
                    <option key={venue} value={venue}>{venue}</option>
                  ))}
                </Select>
              </div>

              {/* Active Filters Display */}
              <div className="flex items-end">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Active Filters</label>
                  <div className="flex flex-wrap gap-2">
                    {filters.search && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        Search: "{filters.search}"
                      </span>
                    )}
                    {filters.programme && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        Programme: {filters.programme}
                      </span>
                    )}
                    {filters.level && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                        Level: {filters.level}
                      </span>
                    )}
                    {filters.date && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                        Date: {new Date(filters.date).toLocaleDateString()}
                      </span>
                    )}
                    {filters.timeWindow !== "All" && (
                      <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">
                        Time: {filters.timeWindow}
                      </span>
                    )}
                    {filters.venue && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                        Venue: {filters.venue}
                      </span>
                    )}
                    {filters.day.length > 0 && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                        Days: {filters.day.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Day Chips */}
            <div className="border-t pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Filter by Days:</span>
                {days.map(day => (
                  <button
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      filters.day.includes(day)
                        ? "bg-blue-600 text-white shadow-md transform scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                    }`}
                    aria-pressed={filters.day.includes(day)}
                    role="checkbox"
                    aria-checked={filters.day.includes(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Filters 