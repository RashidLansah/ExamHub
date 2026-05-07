import { useState } from "react"
import { Plus, Edit, Trash2, Check, X, Search, Upload, UserPlus, Users } from "lucide-react"
import Button from "../ui/Button"
import Input from "../ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"

const StaffManager = ({ staff, onAdd, onUpdate, onDelete }) => {
  const [newStaff, setNewStaff] = useState({
    name: "",
    department: "",
    phone: "",
    email: ""
  })
  const [editingIndex, setEditingIndex] = useState(null)
  const [editValue, setEditValue] = useState({})
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [bulkInput, setBulkInput] = useState("")
  const [bulkDepartment, setBulkDepartment] = useState("")

  // Get unique departments
  const departments = [...new Set(staff.map(s => s.department).filter(Boolean))]

  // Generate unique ID
  const generateId = () => {
    return `staff_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  }

  // Filter staff based on search and department
  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = !departmentFilter || s.department === departmentFilter
    return matchesSearch && matchesDept
  })

  // Count by department
  const getDepartmentCount = (dept) => {
    return staff.filter(s => s.department === dept).length
  }

  // Validate staff object
  const validateStaff = (staffObj) => {
    if (!staffObj.name || !staffObj.name.trim()) {
      setError("Name is required")
      return false
    }
    setError("")
    return true
  }

  // Handle single staff add
  const handleAdd = () => {
    if (!validateStaff(newStaff)) return

    const staffToAdd = {
      id: generateId(),
      name: newStaff.name.trim(),
      department: newStaff.department.trim(),
      phone: newStaff.phone.trim(),
      email: newStaff.email.trim()
    }

    onAdd(staffToAdd)
    setNewStaff({ name: "", department: "", phone: "", email: "" })
    setError("")
  }

  // Handle bulk add
  const handleBulkAdd = () => {
    if (!bulkDepartment.trim()) {
      setError("Please select a department for bulk add")
      return
    }

    const names = bulkInput
      .split("\n")
      .map(name => name.trim())
      .filter(name => name.length > 0)

    if (names.length === 0) {
      setError("Please enter at least one name")
      return
    }

    names.forEach(name => {
      const staffToAdd = {
        id: generateId(),
        name: name,
        department: bulkDepartment.trim(),
        phone: "",
        email: ""
      }
      onAdd(staffToAdd)
    })

    setBulkInput("")
    setBulkDepartment("")
    setShowBulkAdd(false)
    setError("")
  }

  // Handle edit start
  const handleStartEdit = (index) => {
    const realIndex = staff.indexOf(filteredStaff[index])
    setEditingIndex(realIndex)
    setEditValue({ ...staff[realIndex] })
    setError("")
  }

  // Handle edit save
  const handleSaveEdit = () => {
    if (!validateStaff(editValue)) return

    const updatedStaff = {
      id: editValue.id,
      name: editValue.name.trim(),
      department: editValue.department.trim(),
      phone: editValue.phone.trim(),
      email: editValue.email.trim()
    }

    onUpdate(editingIndex, updatedStaff)
    setEditingIndex(null)
    setEditValue({})
    setError("")
  }

  // Handle edit cancel
  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue({})
    setError("")
  }

  // Handle delete with confirmation
  const handleDelete = (index) => {
    const realIndex = staff.indexOf(filteredStaff[index])
    const staffMember = staff[realIndex]
    if (window.confirm(`Delete "${staffMember.name}" from the staff list?`)) {
      onDelete(realIndex)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSaveEdit()
    }
    if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Users className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-gray-900">
              Manage Staff/Invigilators
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {staff.length} staff member{staff.length !== 1 ? "s" : ""} configured
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Add Single Staff */}
        <div className="mb-6 pb-6 border-b">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-teal-600" />
            Add Staff Member
          </h3>
          <div className="space-y-3">
            <Input
              type="text"
              value={newStaff.name}
              onChange={(e) => {
                setNewStaff({ ...newStaff, name: e.target.value })
                setError("")
              }}
              onKeyDown={handleKeyDown}
              placeholder="Name (required)"
              className="border-2 border-gray-200 focus:border-teal-500"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                type="text"
                value={newStaff.department}
                onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                placeholder="Department (optional)"
                className="border-2 border-gray-200 focus:border-teal-500"
              />
              <Input
                type="tel"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                placeholder="Phone (optional)"
                className="border-2 border-gray-200 focus:border-teal-500"
              />
              <Input
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="Email (optional)"
                className="border-2 border-gray-200 focus:border-teal-500"
              />
            </div>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </div>
        </div>

        {/* Bulk Add Section */}
        <div className="mb-6 pb-6 border-b">
          <button
            onClick={() => setShowBulkAdd(!showBulkAdd)}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm mb-4"
          >
            <Upload className="h-4 w-4" />
            {showBulkAdd ? "Hide" : "Show"} Bulk Add
          </button>

          {showBulkAdd && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department for Bulk Add
                </label>
                <Input
                  type="text"
                  value={bulkDepartment}
                  onChange={(e) => setBulkDepartment(e.target.value)}
                  placeholder="Enter department name..."
                  className="border-2 border-gray-200 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Names (one per line)
                </label>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Enter names, one per line..."
                  className="w-full h-24 p-3 border-2 border-gray-200 rounded-md focus:border-teal-500 focus:outline-none resize-none"
                />
              </div>
              <Button
                onClick={handleBulkAdd}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Multiple
              </Button>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or department..."
                className="pl-10 border-2 border-gray-200 focus:border-teal-500"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-md focus:border-teal-500 focus:outline-none text-sm"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept} ({getDepartmentCount(dept)})
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              Showing {filteredStaff.length} of {staff.length} staff
            </span>
            {departments.length > 0 && (
              <div className="flex gap-2">
                {departments.map(dept => (
                  <span
                    key={dept}
                    className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium"
                  >
                    {dept}: {getDepartmentCount(dept)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Staff List */}
        <div className="space-y-3">
          {filteredStaff.length > 0 ? (
            filteredStaff.map((member, displayIndex) => {
              const realIndex = staff.indexOf(member)
              const isEditing = editingIndex === realIndex

              return (
                <div
                  key={member.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <Input
                        type="text"
                        value={editValue.name}
                        onChange={(e) => {
                          setEditValue({ ...editValue, name: e.target.value })
                          setError("")
                        }}
                        onKeyDown={handleEditKeyDown}
                        placeholder="Name"
                        className="border-2 border-teal-300 focus:border-teal-500"
                        autoFocus
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          type="text"
                          value={editValue.department}
                          onChange={(e) => setEditValue({ ...editValue, department: e.target.value })}
                          onKeyDown={handleEditKeyDown}
                          placeholder="Department"
                          className="border-2 border-teal-300 focus:border-teal-500"
                        />
                        <Input
                          type="tel"
                          value={editValue.phone}
                          onChange={(e) => setEditValue({ ...editValue, phone: e.target.value })}
                          onKeyDown={handleEditKeyDown}
                          placeholder="Phone"
                          className="border-2 border-teal-300 focus:border-teal-500"
                        />
                        <Input
                          type="email"
                          value={editValue.email}
                          onChange={(e) => setEditValue({ ...editValue, email: e.target.value })}
                          onKeyDown={handleEditKeyDown}
                          placeholder="Email"
                          className="border-2 border-teal-300 focus:border-teal-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveEdit}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{member.name}</h4>
                          {member.department && (
                            <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                              {member.department}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          {member.phone && (
                            <div>
                              <span className="font-medium">Phone:</span> {member.phone}
                            </div>
                          )}
                          {member.email && (
                            <div>
                              <span className="font-medium">Email:</span> {member.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(displayIndex)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(displayIndex)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            // Empty State
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium mb-1">
                {searchTerm || departmentFilter ? "No staff found" : "No staff added yet"}
              </p>
              <p className="text-sm">
                {searchTerm || departmentFilter
                  ? "Try adjusting your search or filter criteria"
                  : "Add your first staff member above to get started"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default StaffManager
