import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Admin from './pages/Admin'
import { Settings, GraduationCap } from 'lucide-react'

function App() {
  const [currentView, setCurrentView] = useState('student')
  const [showViewToggle, setShowViewToggle] = useState(false)

  // Check if user is on admin route
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setCurrentView('admin')
    }
  }, [])

  const handleViewChange = (view) => {
    setCurrentView(view)
    if (view === 'admin') {
      window.history.pushState({}, '', '/admin')
    } else {
      window.history.pushState({}, '', '/')
    }
    setShowViewToggle(false)
  }

  const toggleViewToggle = () => {
    setShowViewToggle(!showViewToggle)
  }

  return (
    <div className="relative">
      {/* View Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleViewToggle}
          className="p-3 bg-white shadow-lg rounded-full hover:shadow-xl transition-all duration-200 border border-gray-200"
          title="Switch View"
        >
          <Settings className="h-5 w-5 text-gray-600" />
        </button>
        
        {showViewToggle && (
          <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[200px]">
            <div className="text-xs text-gray-500 px-3 py-2 border-b">
              Switch View
            </div>
            <button
              onClick={() => handleViewChange('student')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left hover:bg-gray-50 transition-colors ${
                currentView === 'student' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student View</span>
            </button>
            <button
              onClick={() => handleViewChange('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left hover:bg-gray-50 transition-colors ${
                currentView === 'admin' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Admin Panel</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      {currentView === 'student' ? <Home /> : <Admin />}
    </div>
  )
}

export default App
