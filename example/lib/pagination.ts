export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function parsePagination(query: Record<string, string | undefined>): PaginationParams {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10) || 20));
  const sort = query.sort;
  const order = query.order === 'desc' ? 'desc' : 'asc';
  return { page, limit, sort, order };
}

export function paginate<T>(
  items: T[],
  { page, limit, sort, order }: PaginationParams,
  sortKey?: keyof T
): PaginatedResult<T> {
  let sorted = [...items];

  if (sort && sortKey) {
    sorted.sort((a, b) => {
      const aVal = String(a[sortKey] ?? '');
      const bVal = String(b[sortKey] ?? '');
      return order === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    });
  }

  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = sorted.slice(start, start + limit);

  return { data, total, page, limit, totalPages };
}
