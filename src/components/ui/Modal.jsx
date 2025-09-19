import { useEffect, useRef } from "react"
import { X } from "lucide-react"

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true
}) => {
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // Handle focus management
  useEffect(() => {
    if (!isOpen) return

    // Store the previously focused element
    previousFocusRef.current = document.activeElement

    // Focus the modal
    if (modalRef.current) {
      modalRef.current.focus()
    }

    // Prevent body scroll
    document.body.style.overflow = "hidden"

    return () => {
      // Restore body scroll
      document.body.style.overflow = "unset"
      
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose()
    }
  }

  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-full mx-4"
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`relative w-full ${sizeClasses[size]} bg-white rounded-xl shadow-2xl border-0 transform transition-all duration-300 ease-out`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          tabIndex={-1}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal 