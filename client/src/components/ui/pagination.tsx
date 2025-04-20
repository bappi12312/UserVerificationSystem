import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    if (currentPage > 3) {
      pages.push(1);
      
      // Show ellipsis if not directly after first page
      if (currentPage > 4) {
        pages.push('ellipsis');
      }
    }
    
    // Show pages around current page
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      pages.push(i);
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      // Show ellipsis if not directly before last page
      if (currentPage < totalPages - 3) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
      {/* Previous button */}
      <Button
        variant="outline"
        size="icon"
        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-gray-500"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <span className="sr-only">Previous</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Page numbers */}
      {pageNumbers.map((page, index) => (
        page === 'ellipsis' ? (
          <span 
            key={`ellipsis-${index}`}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
          >
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
              currentPage === page
                ? "z-10 bg-primary border-primary text-white"
                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => onPageChange(page as number)}
          >
            {page}
          </Button>
        )
      ))}
      
      {/* Next button */}
      <Button
        variant="outline"
        size="icon"
        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-gray-500"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <span className="sr-only">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
