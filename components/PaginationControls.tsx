type PaginationControlsProps = Readonly<{
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}>;

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange
}: PaginationControlsProps) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="pagination">
      <p className="pagination__summary">
        Mostrando {start}-{end} de {totalItems}
      </p>
      <div className="pagination__actions">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <span className="pagination__status">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
