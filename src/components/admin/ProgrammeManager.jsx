import { useState } from "react"
import { Plus, Edit, Trash2, Save, X, GraduationCap, ChevronDown, ChevronUp } from "lucide-react"
import Button from "../ui/Button"
import Input from "../ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"

const LEVELS = ["100", "200", "300", "400"]

const emptyForm = () => ({
  name: "",
  indexPrefix: "",
  enrolment: { "100": "", "200": "", "300": "", "400": "" },
})

const ProgrammeManager = ({ programmes, onAdd, onUpdate, onDelete, exams }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [error, setError] = useState("")

  const getExamCount = (prog) =>
    exams.filter(e => e.programme === prog.name).length

  const totalEnrolment = (prog) =>
    Object.values(prog.enrolment || {}).reduce((s, v) => s + (parseInt(v) || 0), 0)

  const validateForm = (form, currentId = null) => {
    if (!form.name.trim()) return "Programme name is required."
    if (!form.indexPrefix.trim()) return "Index prefix is required (e.g. CS, BATS)."
    const duplicate = programmes.find(
      p => p.name.toLowerCase() === form.name.trim().toLowerCase() && p.id !== currentId
    )
    if (duplicate) return "A programme with this name already exists."
    const prefixDup = programmes.find(
      p => p.indexPrefix.toUpperCase() === form.indexPrefix.trim().toUpperCase() && p.id !== currentId
    )
    if (prefixDup) return `Prefix "${form.indexPrefix.toUpperCase()}" is already used by ${prefixDup.name}.`
    return null
  }

  const handleAdd = () => {
    const err = validateForm(addForm)
    if (err) { setError(err); return }
    const enrolment = {}
    LEVELS.forEach(l => { enrolment[l] = parseInt(addForm.enrolment[l]) || 0 })
    onAdd({
      id: addForm.name.trim().toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      name: addForm.name.trim(),
      indexPrefix: addForm.indexPrefix.trim().toUpperCase(),
      enrolment,
    })
    setAddForm(emptyForm())
    setShowAddForm(false)
    setError("")
  }

  const handleStartEdit = (prog) => {
    setEditingId(prog.id)
    setEditForm({
      name: prog.name,
      indexPrefix: prog.indexPrefix || "",
      enrolment: { "100": prog.enrolment?.["100"] ?? "", "200": prog.enrolment?.["200"] ?? "", "300": prog.enrolment?.["300"] ?? "", "400": prog.enrolment?.["400"] ?? "" },
    })
    setError("")
  }

  const handleSaveEdit = (prog) => {
    const err = validateForm(editForm, prog.id)
    if (err) { setError(err); return }
    const enrolment = {}
    LEVELS.forEach(l => { enrolment[l] = parseInt(editForm.enrolment[l]) || 0 })
    onUpdate(prog.id, {
      ...prog,
      name: editForm.name.trim(),
      indexPrefix: editForm.indexPrefix.trim().toUpperCase(),
      enrolment,
    })
    setEditingId(null)
    setEditForm(null)
    setError("")
  }

  const handleDelete = (prog) => {
    const count = getExamCount(prog)
    if (count > 0) {
      const ok = window.confirm(
        `"${prog.name}" is used by ${count} exam${count > 1 ? "s" : ""}. It won't be removed from existing exams. Continue?`
      )
      if (!ok) return
    }
    onDelete(prog.id)
  }

  const EnrolmentFields = ({ value, onChange }) => (
    <div className="grid grid-cols-4 gap-2">
      {LEVELS.map(level => (
        <div key={level}>
          <label className="block text-xs text-gray-500 mb-1">Level {level}</label>
          <Input
            type="number"
            min="0"
            value={value[level]}
            onChange={e => onChange({ ...value, [level]: e.target.value })}
            placeholder="0"
            className="text-sm"
          />
        </div>
      ))}
    </div>
  )

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Manage Programmes</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {programmes.length} programme{programmes.length !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>
          <Button
            onClick={() => { setShowAddForm(v => !v); setError("") }}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
          >
            {showAddForm ? <><X className="h-4 w-4 mr-2" />Cancel</> : <><Plus className="h-4 w-4 mr-2" />Add Programme</>}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-6 p-4 border-2 border-purple-200 rounded-xl bg-purple-50 space-y-4">
            <p className="font-semibold text-purple-800 text-sm">New Programme</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Programme Name</label>
                <Input
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Computer Science"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Index Prefix</label>
                <Input
                  value={addForm.indexPrefix}
                  onChange={e => setAddForm(f => ({ ...f, indexPrefix: e.target.value.toUpperCase() }))}
                  placeholder="e.g. CS, BATS, EE"
                  className="uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-2">Enrolment by Level</label>
              <EnrolmentFields
                value={addForm.enrolment}
                onChange={v => setAddForm(f => ({ ...f, enrolment: v }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowAddForm(false); setAddForm(emptyForm()); setError("") }}>Cancel</Button>
              <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Save className="h-4 w-4 mr-2" />Add Programme
              </Button>
            </div>
          </div>
        )}

        {/* Programmes List */}
        <div className="space-y-3">
          {programmes.map(prog => (
            <div key={prog.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {editingId === prog.id ? (
                <div className="p-4 bg-blue-50 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Programme Name</label>
                      <Input
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Index Prefix</label>
                      <Input
                        value={editForm.indexPrefix}
                        onChange={e => setEditForm(f => ({ ...f, indexPrefix: e.target.value.toUpperCase() }))}
                        className="uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Enrolment by Level</label>
                    <EnrolmentFields
                      value={editForm.enrolment}
                      onChange={v => setEditForm(f => ({ ...f, enrolment: v }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setError("") }}>
                      <X className="h-4 w-4 mr-1" />Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSaveEdit(prog)} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Save className="h-4 w-4 mr-1" />Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <GraduationCap className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{prog.name}</span>
                        {prog.indexPrefix && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-mono rounded-full">
                            {prog.indexPrefix}
                          </span>
                        )}
                        {getExamCount(prog) > 0 && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {getExamCount(prog)} exam{getExamCount(prog) > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1">
                        {LEVELS.map(l => (
                          (prog.enrolment?.[l] || 0) > 0 && (
                            <span key={l} className="text-xs text-gray-500">
                              L{l}: <span className="font-medium text-gray-700">{prog.enrolment[l]}</span>
                            </span>
                          )
                        ))}
                        {totalEnrolment(prog) > 0 && (
                          <span className="text-xs text-gray-400">
                            · {totalEnrolment(prog)} total
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleStartEdit(prog)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(prog)} className="text-red-600 border-red-200 hover:bg-red-50">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {programmes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No programmes yet. Add your first programme above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProgrammeManager
