import { useState, useEffect, useCallback } from 'react';

export function useSimplePagination<T>(items: T[], itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedItems, setPaginatedItems] = useState<T[]>([]);

  // Update total pages when items or itemsPerPage changes
  useEffect(() => {
    const newTotalPages = Math.ceil(items.length / itemsPerPage);
    setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
    
    // Reset to first page if current page exceeds new total pages
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [items.length, itemsPerPage, currentPage]);

  // Update paginated items when items, currentPage, or itemsPerPage changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedItems(items.slice(startIndex, endIndex));
  }, [items, currentPage, itemsPerPage]);

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
    setItems: (newItems: T[]) => {
      setPaginatedItems(newItems);
      setCurrentPage(1);
    },
    handlePageChange,
  };
}
