import { useState } from "react";
import { PAGE_SIZE } from "@/lib/constants/pagination";

export function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(1);
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
  );
  return {
    page: currentPage,
    setPage,
    visible: items.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    ),
  };
}
