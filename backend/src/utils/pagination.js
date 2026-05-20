export async function paginate(model, query, options = {}) {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(options.limit) || 20));
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };

  const [data, total] = await Promise.all([
    model.find(query)
      .select(options.select || '')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    model.countDocuments(query)
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  };
}

/**
 * Enterprise Cursor Pagination for massive collections
 */
export async function paginateCursor(model, query, options = {}) {
  const limit = Math.min(1000, Math.max(1, parseInt(options.limit) || 20));
  const cursor = options.cursor; // Typically an ID or a timestamp
  const sortField = options.sortField || '_id';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

  if (cursor) {
    const operator = sortOrder === 1 ? '$gt' : '$lt';
    query[sortField] = { [operator]: cursor };
  }

  const data = await model.find(query)
    .select(options.select || '')
    .sort({ [sortField]: sortOrder })
    .limit(limit + 1) // Fetch one extra to check if there's a next page
    .lean();

  const hasNext = data.length > limit;
  if (hasNext) data.pop();

  const nextCursor = hasNext ? data[data.length - 1][sortField] : null;

  return {
    data,
    nextCursor,
    hasNext
  };
}

export function buildPaginationMeta(result) {
  return {
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    hasNext: result.hasNext,
    hasPrev: result.hasPrev,
    nextCursor: result.nextCursor
  };
}