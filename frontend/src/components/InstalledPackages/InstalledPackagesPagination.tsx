import { Pagination } from "flowbite-react";

type InstalledPackagesPaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

export default function InstalledPackagesPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: InstalledPackagesPaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      data-cy="installed-packages-pagination"
      className="custom-shadow mt-4 flex flex-wrap items-center justify-between gap-3 rounded-b-md bg-white p-3 font-inter text-sm text-gray-700"
    >
      <div className="flex flex-wrap items-center gap-4">
        <span>
          Showing{" "}
          <span className="font-semibold text-gray-900">{startItem}</span> to{" "}
          <span className="font-semibold text-gray-900">{endItem}</span> of{" "}
          <span className="font-semibold text-gray-900">{totalItems}</span>{" "}
          releases
        </span>
        <div className="flex items-center gap-1.5">
          <label htmlFor="page-size-select" className="text-xs text-gray-500">
            Per page:
          </label>
          <select
            id="page-size-select"
            data-cy="page-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:border-gray-400 focus:border-sky-500 focus:outline-hidden"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            showIcons
            previousLabel="Previous"
            nextLabel="Next"
          />
        </div>
      )}
    </div>
  );
}
