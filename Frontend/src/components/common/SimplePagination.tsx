import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const SimplePagination: React.FC<SimplePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  // Always show exactly 3 pages centered around current page
  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + 2);
    
    // Adjust if we're near the start or end
    if (end === totalPages) {
      start = Math.max(1, end - 2);
    } else if (start === 1) {
      end = Math.min(totalPages, 3);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <nav className="flex items-center gap-0.5" aria-label="Pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <FiChevronLeft className="h-5 w-5" />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium min-w-[36px] ${
              page === currentPage
                ? 'bg-[#a169b0] text-white border border-[#a169b0]'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <FiChevronRight className="h-5 w-5" />
        </button>
      </nav>
    </div>
  );
};

export default SimplePagination;
