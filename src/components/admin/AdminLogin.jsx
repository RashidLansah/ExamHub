import { useState } from "react"
import { Lock, User, Eye, EyeOff } from "lucide-react"
import Button from "../ui/Button"
import Input from "../ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"

const AdminLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Simple authentication - in production, this would be server-side
    if (credentials.username === "exam_officer" && credentials.password === "tatu2024") {
      onLogin(true)
      localStorage.setItem("adminLoggedIn", "true")
    } else {
      setError("Invalid credentials. Please try again.")
    }
  }

  const handleChange = (e) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    if (error) setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Exam Officer Login
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Access the admin panel to manage exam timetables
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  className="pl-10 border-2 border-gray-200 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="pl-10 pr-10 border-2 border-gray-200 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 text-lg font-semibold"
            >
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Demo Credentials: <br />
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                username: exam_officer | password: tatu2024
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminLogin 