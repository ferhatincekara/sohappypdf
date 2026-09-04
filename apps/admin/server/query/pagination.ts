export const ADMIN_PAGE_SIZE = 25;
export const ADMIN_MAX_PAGE_SIZE = 50;

export type PaginatedResult<T> = {
  rows: T[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export function parsePage(value: string | undefined): number {
  if (value === undefined) {
    return 1;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export function parsePageSize(value: string | undefined): number {
  if (value === undefined) {
    return ADMIN_PAGE_SIZE;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return ADMIN_PAGE_SIZE;
  }

  return Math.min(parsed, ADMIN_MAX_PAGE_SIZE);
}

export function paginated<T>(
  rows: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    rows,
    page,
    pageSize,
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}
