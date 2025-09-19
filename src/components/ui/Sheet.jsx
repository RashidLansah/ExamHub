import { useState, useEffect } from "react"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"

const Sheet = ({ open, onOpenChange, children, side = "right" }) => {
  const [isOpen, setIsOpen] = useState(open)

  useEffect(() => {
    setIsOpen(open)
  }, [open])

  const handleOpenChange = (newOpen) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  if (!isOpen) return null

  const sideClasses = {
    right: "right-0 top-0 h-full",
    left: "left-0 top-0 h-full",
    top: "top-0 left-0 w-full",
    bottom: "bottom-0 left-0 w-full"
  }

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => handleOpenChange(false)}
      />
      <div         className={cn(
          "fixed z-50 bg-white shadow-lg transition-transform duration-300 ease-in-out",
          sideClasses[side],
          side === "right" && "w-full max-w-md translate-x-0",
          side === "left" && "w-full max-w-md -translate-x-0",
          side === "top" && "h-full max-h-96 translate-y-0",
          side === "bottom" && "h-full max-h-96 -translate-y-0"
        )}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold">My Exams</h2>
            <button
              onClick={() => handleOpenChange(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sheet 