// Standardized response helper
const sendResponse = (res, statusCode, success, message, data = null, cacheOptions = null) => {
  // Set caching headers for public GET requests (if cacheOptions provided)
  if (cacheOptions && res.req.method === 'GET') {
    const { maxAge = 300, staleWhileRevalidate = 60 } = cacheOptions; // Default: 5 min cache, 1 min stale
    res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
    res.set('Vary', 'Accept-Encoding');
  }

  const response = {
    success,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Success responses with optional caching
exports.success = (res, message, data = null, statusCode = 200, cacheOptions = null) => {
  return sendResponse(res, statusCode, true, message, data, cacheOptions);
};

// Error responses
exports.error = (res, message, statusCode = 400, data = null) => {
  return sendResponse(res, statusCode, false, message, data);
};

// Pagination helper
exports.paginated = (res, message, data, pagination, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination
  });
};

