export async function paginate(model, query, options = {}) {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
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

export function buildPaginationMeta(result) {
  return {
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    hasNext: result.hasNext,
    hasPrev: result.hasPrev
  };
}