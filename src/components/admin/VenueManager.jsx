import { useState, useMemo } from "react"
import { Plus, Edit, Trash2, Check, X, Users, ChevronDown, ChevronRight, Building, AlertCircle } from "lucide-react"
import Button from "../ui/Button"
import Input from "../ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"

const VenueManager = ({ venues, onAdd, onUpdate, onDelete, exams }) => {
  const [newVenue, setNewVenue] = useState({ name: "", block: "", capacity: "" })
  const [editingIndex, setEditingIndex] = useState(null)
  const [editValue, setEditValue] = useState({ name: "", block: "", capacity: "" })
  const [error, setError] = useState("")
  const [expandedBlocks, setExpandedBlocks] = useState({
    "R Block": true,
    "B Block": true,
    "ICT Block": true,
    "New Block": true,
  })
  const [showCustomBlockInput, setShowCustomBlockInput] = useState(false)
  const [customBlock, setCustomBlock] = useState("")

  // Get unique blocks
  const blocks = useMemo(() => {
    const blockSet = new Set(venues.map(v => v.block))
    return Array.from(blockSet).sort()
  }, [venues])

  // Group venues by block
  const venuesByBlock = useMemo(() => {
    const grouped = {}
    blocks.forEach(block => {
      grouped[block] = venues.filter(v => v.block === block)
    })
    return grouped
  }, [venues, blocks])

  // Calculate block capacities
  const blockCapacities = useMemo(() => {
    const capacities = {}
    Object.entries(venuesByBlock).forEach(([block, blockVenues]) => {
      capacities[block] = blockVenues.reduce((sum, v) => sum + (v.capacity || 0), 0)
    })
    return capacities
  }, [venuesByBlock])

  // Total capacity
  const totalCapacity = useMemo(() => {
    return Object.values(blockCapacities).reduce((sum, cap) => sum + cap, 0)
  }, [blockCapacities])

  const getExamCountForVenue = (venueName) => {
    return exams.filter(exam => exam.venue === venueName).length
  }

  const generateId = (name) => {
    return name.toLowerCase().replace(/\s+/g, "")
  }

  const validateNewVenue = () => {
    const trimmedName = newVenue.name.trim()
    const trimmedBlock = newVenue.block.trim() || customBlock.trim()

    if (!trimmedName) {
      setError("Venue name cannot be empty")
      return false
    }

    if (!trimmedBlock) {
      setError("Block is required")
      return false
    }

    if (!newVenue.capacity || isNaN(newVenue.capacity) || newVenue.capacity <= 0) {
      setError("Capacity must be a positive number")
      return false
    }

    const venueExists = venues.some(
      v => v.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (venueExists) {
      setError("This venue already exists")
      return false
    }

    return true
  }

  const handleAdd = () => {
    if (!validateNewVenue()) return

    const block = newVenue.block || customBlock.trim()
    const venueObject = {
      id: generateId(newVenue.name),
      name: newVenue.name.trim(),
      block: block,
      capacity: parseInt(newVenue.capacity),
    }

    onAdd(venueObject)
    setNewVenue({ name: "", block: "", capacity: "" })
    setCustomBlock("")
    setShowCustomBlockInput(false)
    setError("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleStartEdit = (index) => {
    setEditingIndex(index)
    const venue = venues[index]
    setEditValue({ ...venue })
    setError("")
  }

  const validateEditVenue = () => {
    const trimmedName = editValue.name.trim()
    const trimmedBlock = editValue.block.trim()

    if (!trimmedName) {
      setError("Venue name cannot be empty")
      return false
    }

    if (!trimmedBlock) {
      setError("Block is required")
      return false
    }

    if (!editValue.capacity || isNaN(editValue.capacity) || editValue.capacity <= 0) {
      setError("Capacity must be a positive number")
      return false
    }

    const nameChanged = trimmedName !== venues[editingIndex].name
    const venueExists = nameChanged && venues.some(
      (v, idx) => idx !== editingIndex && v.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (venueExists) {
      setError("This venue already exists")
      return false
    }

    return true
  }

  const handleSaveEdit = () => {
    if (!validateEditVenue()) return

    const updatedVenue = {
      ...editValue,
      name: editValue.name.trim(),
      block: editValue.block.trim(),
      capacity: parseInt(editValue.capacity),
      id: generateId(editValue.name),
    }

    onUpdate(editingIndex, updatedVenue)
    setEditingIndex(null)
    setEditValue({ name: "", block: "", capacity: "" })
    setError("")
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue({ name: "", block: "", capacity: "" })
    setError("")
  }

  const handleDelete = (index) => {
    const venue = venues[index]
    const examCount = getExamCountForVenue(venue.name)

    if (examCount > 0) {
      const confirmed = window.confirm(
        `"${venue.name}" is used by ${examCount} exam${examCount > 1 ? "s" : ""}. Deleting it won't remove it from existing exams, but it will no longer appear as an option when creating new exams. Continue?`
      )
      if (!confirmed) return
    }

    onDelete(index)
  }

  const blockColors = {
    "R Block": { header: "from-blue-50 to-blue-100", icon: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
    "B Block": { header: "from-purple-50 to-purple-100", icon: "text-purple-600", badge: "bg-purple-100 text-purple-700" },
    "ICT Block": { header: "from-green-50 to-green-100", icon: "text-green-600", badge: "bg-green-100 text-green-700" },
    "New Block": { header: "from-amber-50 to-amber-100", icon: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
  }

  const getBlockColors = (block) => {
    return blockColors[block] || { header: "from-gray-50 to-gray-100", icon: "text-gray-600", badge: "bg-gray-100 text-gray-700" }
  }

  const toggleBlock = (block) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [block]: !prev[block]
    }))
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Building className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-gray-900">
              Manage Venues
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {venues.length} venue{venues.length !== 1 ? "s" : ""} across {blocks.length} block{blocks.length !== 1 ? "s" : ""} • Total capacity: {totalCapacity}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Add New Venue Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Add New Venue</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Venue Name</label>
              <Input
                type="text"
                value={newVenue.name}
                onChange={(e) => {
                  setNewVenue({ ...newVenue, name: e.target.value })
                  setError("")
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g., R1, ICT Lab 1"
                className="border-2 border-gray-200 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Block</label>
              {!showCustomBlockInput ? (
                <select
                  value={newVenue.block}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setShowCustomBlockInput(true)
                    } else {
                      setNewVenue({ ...newVenue, block: e.target.value })
                      setError("")
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:border-orange-500 text-sm"
                >
                  <option value="">Select block</option>
                  {blocks.map(block => (
                    <option key={block} value={block}>
                      {block}
                    </option>
                  ))}
                  <option value="custom">+ Add new block</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={customBlock}
                    onChange={(e) => setCustomBlock(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="New block name"
                    className="border-2 border-gray-200 focus:border-orange-500"
                    autoFocus
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomBlockInput(false)
                      setCustomBlock("")
                    }}
                    className="text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Capacity</label>
              <Input
                type="number"
                value={newVenue.capacity}
                onChange={(e) => {
                  setNewVenue({ ...newVenue, capacity: e.target.value })
                  setError("")
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g., 45"
                min="1"
                className="border-2 border-gray-200 focus:border-orange-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAdd}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Venue
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Venues by Block */}
        {blocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No venues added yet. Add your first venue above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map(block => {
              const blockVenues = venuesByBlock[block]
              const blockCapacity = blockCapacities[block]
              const colors = getBlockColors(block)
              const isExpanded = expandedBlocks[block]

              return (
                <div key={block} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Block Header */}
                  <button
                    onClick={() => toggleBlock(block)}
                    className={`w-full px-4 py-3 bg-gradient-to-r ${colors.header} hover:opacity-90 transition-opacity flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                      )}
                      <span className="font-semibold text-gray-900">{block}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                        {blockVenues.length} room{blockVenues.length !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-600 ml-auto mr-4">
                        <Users className="h-3 w-3" />
                        {blockCapacity} seats
                      </span>
                    </div>
                  </button>

                  {/* Block Venues */}
                  {isExpanded && (
                    <div className="bg-white p-4 space-y-2 border-t border-gray-100">
                      {blockVenues.map((venue, venueIndex) => {
                        const globalIndex = venues.findIndex(v => v.id === venue.id)
                        const examCount = getExamCountForVenue(venue.name)
                        const isEditing = editingIndex === globalIndex

                        return (
                          <div
                            key={venue.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                  <Input
                                    type="text"
                                    value={editValue.name}
                                    onChange={(e) => {
                                      setEditValue({ ...editValue, name: e.target.value })
                                      setError("")
                                    }}
                                    className="border-2 border-orange-300 focus:border-orange-500"
                                    placeholder="Name"
                                  />
                                  <select
                                    value={editValue.block}
                                    onChange={(e) => {
                                      setEditValue({ ...editValue, block: e.target.value })
                                      setError("")
                                    }}
                                    className="px-3 py-2 border-2 border-orange-300 rounded-md focus:border-orange-500 text-sm"
                                  >
                                    {blocks.map(b => (
                                      <option key={b} value={b}>
                                        {b}
                                      </option>
                                    ))}
                                  </select>
                                  <Input
                                    type="number"
                                    value={editValue.capacity}
                                    onChange={(e) => {
                                      setEditValue({ ...editValue, capacity: e.target.value })
                                      setError("")
                                    }}
                                    className="border-2 border-orange-300 focus:border-orange-500"
                                    placeholder="Capacity"
                                    min="1"
                                  />
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  className="text-green-600 border-green-200 hover:bg-green-50 flex-shrink-0"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="text-gray-600 border-gray-200 hover:bg-gray-50 flex-shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900">{venue.name}</span>
                                      {examCount > 0 && (
                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                                          {examCount} exam{examCount > 1 ? "s" : ""}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                      <Users className="h-3 w-3" />
                                      <span>Capacity: {venue.capacity}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStartEdit(globalIndex)}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(globalIndex)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Summary Stats */}
        {venues.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Venues</p>
                <p className="text-2xl font-bold text-blue-900">{venues.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Capacity</p>
                <p className="text-2xl font-bold text-blue-900">{totalCapacity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Avg Capacity</p>
                <p className="text-2xl font-bold text-blue-900">{Math.round(totalCapacity / venues.length)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default VenueManager
