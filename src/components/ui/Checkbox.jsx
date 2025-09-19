import { cn } from "../../lib/utils"

const Checkbox = ({ className, ...props }) => {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-gray-300 bg-white text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export default Checkbox 