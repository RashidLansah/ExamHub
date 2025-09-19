import { Search, RefreshCw, Filter } from "lucide-react"
import Button from "./ui/Button"

const EmptyState = ({ onResetFilters }) => {
  return (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <Search className="h-12 w-12 text-blue-500" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          No exams found
        </h3>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          No exams match your current filters. Try adjusting your search criteria or reset the filters to see all available exams.
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={onResetFilters}
            variant="default"
            size="lg"
            className="flex items-center gap-2 mx-auto px-8 py-3"
          >
            <RefreshCw className="h-5 w-5" />
            Reset All Filters
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            <span>Try removing some filters to see more results</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmptyState 