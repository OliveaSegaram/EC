import { useState, useEffect, useCallback, useMemo } from 'react';

export function useSimplePagination<T>(items: T[], itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / itemsPerPage));
  }, [items.length, itemsPerPage]);

  // Calculate paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  // Reset to first page if current page exceeds total pages after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Smooth scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    handlePageChange,
    setCurrentPage, 
  };
}
