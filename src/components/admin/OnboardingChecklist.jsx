import { CheckCircle, Circle, ArrowRight, Building, GraduationCap, Settings, ChevronRight } from "lucide-react"

const steps = [
  {
    id: "school",
    icon: Settings,
    title: "Set your school name",
    description: "Add your institution name so it appears on the timetable and PDF exports.",
    tab: "settings",
    checkFn: (_, __, schoolName) => !!schoolName && schoolName !== "Tamale Technical University",
  },
  {
    id: "venues",
    icon: Building,
    title: "Add exam venues",
    description: "Enter every hall or room with its seating capacity. This is used to split students across rooms.",
    tab: "venues",
    checkFn: (venues) => venues.length > 0 && venues.every(v => v.capacity > 0),
  },
  {
    id: "programmes",
    icon: GraduationCap,
    title: "Configure programmes",
    description: "Add each programme with its index prefix (e.g. CS, BATS) and enrolment per level.",
    tab: "programmes",
    checkFn: (_, programmes) =>
      programmes.length > 0 &&
      programmes.every(p => p.indexPrefix && Object.values(p.enrolment || {}).some(n => n > 0)),
  },
]

const OnboardingChecklist = ({ venues, programmes, schoolName, onNavigate }) => {
  const completed = steps.map(s => s.checkFn(venues, programmes, schoolName))
  const allDone = completed.every(Boolean)
  const doneCount = completed.filter(Boolean).length

  if (allDone) return null

  return (
    <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Welcome — let's get you set up</h2>
          <p className="text-blue-100 text-sm mt-0.5">
            Complete these {steps.length} steps before running your first exam schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  completed[i] ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
          <span className="text-white text-sm font-semibold ml-2">{doneCount}/{steps.length}</span>
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-blue-100">
        {steps.map((step, i) => {
          const Icon = step.icon
          const done = completed[i]
          return (
            <button
              key={step.id}
              onClick={() => !done && onNavigate(step.tab)}
              className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors ${
                done
                  ? "bg-white/40 cursor-default"
                  : "hover:bg-white/60 cursor-pointer"
              }`}
            >
              <div className={`flex-shrink-0 p-2.5 rounded-xl ${done ? "bg-green-100" : "bg-white shadow-sm"}`}>
                <Icon className={`h-5 w-5 ${done ? "text-green-600" : "text-blue-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    {step.title}
                  </span>
                  {done && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Done</span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${done ? "text-gray-400" : "text-gray-500"}`}>
                  {step.description}
                </p>
              </div>
              {done ? (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-5 w-5 text-blue-400 flex-shrink-0" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OnboardingChecklist
